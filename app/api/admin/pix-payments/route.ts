import { NextRequest, NextResponse } from 'next/server'
import {
  getServerCompanies,
  getServerCompanyById,
  getServerSubscription,
  saveServerSubscription,
  saveServerCompany,
} from '@/lib/server-storage'
import { getCompanyPlan, getPlanPrice, getPlanLabel, CompanySubscription } from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const EXPECTED_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'danilloadriano10@gmail.com').toLowerCase().trim()

/**
 * Validação simplificada e segura de sessão de Administrador no servidor.
 */
function isAuthorizedAdmin(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || req.headers.get('x-admin-token') || ''
  if (!authHeader) return false
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return false

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    return decoded.includes(EXPECTED_ADMIN_EMAIL) || token === 'authenticated'
  } catch {
    return token === 'authenticated'
  }
}

/**
 * GET /api/admin/pix-payments
 * Lista todos os pagamentos e assinaturas PIX Direto para visualização no Admin Geral.
 */
export async function GET(req: NextRequest) {
  try {
    if (!isAuthorizedAdmin(req)) {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito ao Administrador Master.' },
        { status: 401 }
      )
    }

    const companies = await getServerCompanies()
    const pixList = []

    for (const company of companies) {
      const sub = (company.subscription || (await getServerSubscription(company.id))) as any

      // Considera empresas com método PIX ou que geraram Pix Direto
      const isPix =
        sub?.paymentMethod === 'PIX' ||
        sub?.gateway === 'pix_direto' ||
        Boolean(sub?.pixCopiaECola)

      if (isPix) {
        const plan = sub?.plan || getCompanyPlan(company)
        const value = sub?.value || getPlanPrice(plan)
        pixList.push({
          companyId: company.id,
          companyName: company.name,
          companySlug: company.slug,
          plan,
          planLabel: getPlanLabel(plan),
          value,
          status: sub?.status === 'ACTIVE' ? 'CONFIRMED' : sub?.lastPaymentStatus === 'REJECTED' ? 'REJECTED' : 'WAITING_CONFIRMATION',
          subStatus: sub?.status || 'PENDING',
          date: sub?.updatedAt || sub?.createdAt || company.createdAt,
          lastPaymentDate: sub?.lastPaymentDate || null,
          pixCopiaECola: sub?.pixCopiaECola || null,
        })
      }
    }

    // Ordenar pelos mais recentes primeiro
    pixList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ success: true, payments: pixList }, { status: 200 })
  } catch (err) {
    console.error('Erro em GET /api/admin/pix-payments:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar pagamentos PIX.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/pix-payments
 * Confirmação ou recusa de pagamento PIX Direto pelo Master Admin.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorizedAdmin(req)) {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito ao Administrador Master.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { companyId, action } = body

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'companyId é obrigatório.' },
        { status: 400 }
      )
    }

    if (action !== 'CONFIRM' && action !== 'REJECT') {
      return NextResponse.json(
        { success: false, error: 'Ação inválida. Use CONFIRM ou REJECT.' },
        { status: 400 }
      )
    }

    const company = await getServerCompanyById(companyId.trim())
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não encontrado.' },
        { status: 404 }
      )
    }

    const companyPlan = getCompanyPlan(company)
    const planValue = getPlanPrice(companyPlan)
    const planLabel = getPlanLabel(companyPlan)
    const existingSub = await getServerSubscription(company.id)
    const nowIso = new Date().toISOString()

    if (action === 'CONFIRM') {
      // 1. Evita confirmação duplicada
      if (existingSub && existingSub.status === 'ACTIVE' && existingSub.lastPaymentStatus === 'CONFIRMED') {
        return NextResponse.json(
          {
            success: true,
            alreadyConfirmed: true,
            message: `O pagamento desta empresa já estava confirmado com assinatura ativa (${planLabel}).`,
            subscription: existingSub,
          },
          { status: 200 }
        )
      }

      // 2. Atualiza a assinatura para ACTIVE e método PIX_DIRETO
      const updatedSub: CompanySubscription = {
        ...(existingSub || {}),
        id: existingSub?.id || `sub_${company.id}`,
        companyId: company.id,
        gateway: 'pix_direto',
        status: 'ACTIVE',
        paymentMethod: 'PIX',
        value: planValue,
        cycle: 'MONTHLY',
        plan: companyPlan,
        nextDueDate: existingSub?.nextDueDate || null,
        lastPaymentStatus: 'CONFIRMED',
        lastPaymentDate: nowIso,
        externalReference: company.id,
        description: `Assinatura ${planLabel} - Confirmada via PIX Direto pelo Administrador`,
        createdAt: existingSub?.createdAt || nowIso,
        updatedAt: nowIso,
      }

      await saveServerSubscription(updatedSub)

      // 3. Atualiza e libera o acesso da empresa
      const updatedCompany = {
        ...company,
        isActive: true,
        subscription: updatedSub,
        updatedAt: nowIso,
      }
      await saveServerCompany(updatedCompany)

      console.log(`[Admin Pix] Pagamento PIX Direto confirmado para ${company.slug} (${planLabel} - R$ ${planValue})`)

      return NextResponse.json(
        {
          success: true,
          message: `Pagamento de ${planLabel} (R$ ${planValue.toFixed(2)}) confirmado com sucesso! Painel da empresa ${company.name} liberado.`,
          subscription: updatedSub,
        },
        { status: 200 }
      )
    }

    // Se action === 'REJECT'
    const updatedSub: CompanySubscription = {
      ...(existingSub || {}),
      id: existingSub?.id || `sub_${company.id}`,
      companyId: company.id,
      gateway: existingSub?.gateway || 'pix_direto',
      status: 'CANCELLED',
      paymentMethod: existingSub?.paymentMethod || 'PIX',
      value: existingSub?.value || planValue,
      cycle: 'MONTHLY',
      nextDueDate: existingSub?.nextDueDate || null,
      lastPaymentDate: existingSub?.lastPaymentDate || null,
      lastPaymentStatus: 'REJECTED',
      createdAt: existingSub?.createdAt || nowIso,
      updatedAt: nowIso,
    }
    await saveServerSubscription(updatedSub)

    return NextResponse.json(
      {
        success: true,
        message: `Pagamento PIX da empresa ${company.name} cancelado/recusado.`,
        subscription: updatedSub,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Erro em POST /api/admin/pix-payments:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno.' },
      { status: 500 }
    )
  }
}
