import { NextRequest, NextResponse } from 'next/server'
import {
  getServerCompanyById,
  getServerSubscription,
  saveServerSubscription,
} from '@/lib/server-storage'
import { generatePixDiretoData, PIX_CHAVE_EMAIL } from '@/lib/pix-direto'
import {
  CompanySubscription,
  getCompanyPlan,
  getPlanPrice,
  getPlanLabel,
} from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/pix-direto
 * Gera a cobrança Pix Direto com a chave oficialdiretolink@gmail.com
 * Valores e planos rigorosamente determinados no servidor:
 * - DiretoLink Links: R$ 29,99
 * - DiretoLink Pro: R$ 69,99
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { companyId } = body

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'companyId é obrigatório.' },
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

    // 1. O plano e o valor são determinados exclusivamente pelo servidor
    const companyPlan = getCompanyPlan(company)
    const planValue = getPlanPrice(companyPlan)
    const planLabel = getPlanLabel(companyPlan)

    // 2. Se a empresa já tiver assinatura ativa, não gera pendência
    const existingSub = await getServerSubscription(company.id)
    if (existingSub && existingSub.status === 'ACTIVE') {
      return NextResponse.json(
        {
          success: true,
          message: 'Esta empresa já possui assinatura ativa e painel liberado.',
          subscription: existingSub,
          isUnlocked: true,
        },
        { status: 200 }
      )
    }

    // 3. Gera os dados do PIX oficial (Chave: oficialdiretolink@gmail.com)
    const pixData = await generatePixDiretoData({
      plan: companyPlan,
      companyId: company.id,
    })

    const nowIso = new Date().toISOString()
    const updatedSubscription: CompanySubscription = {
      id: existingSub?.id || `sub_${company.id}`,
      companyId: company.id,
      gateway: 'pix_direto' as any,
      status: 'PENDING', // Permanece bloqueado até confirmação do Master Admin
      paymentMethod: 'PIX',
      value: planValue,
      cycle: 'MONTHLY',
      plan: companyPlan,
      pixCopiaECola: pixData.copiaECola,
      pixQrCodeUrl: pixData.qrCodeBase64,
      pixExpirationDate: null,
      nextDueDate: null,
      lastPaymentDate: null,
      lastPaymentStatus: 'WAITING_CONFIRMATION',
      externalReference: company.id,
      description: `Assinatura ${planLabel} - PIX Direto`,
      createdAt: existingSub?.createdAt || nowIso,
      updatedAt: nowIso,
    }

    await saveServerSubscription(updatedSubscription)

    return NextResponse.json(
      {
        success: true,
        copiaECola: pixData.copiaECola,
        qrCodeBase64: pixData.qrCodeBase64,
        chavePix: PIX_CHAVE_EMAIL,
        valor: planValue,
        plan: companyPlan,
        planLabel,
        status: 'AGUARDANDO CONFIRMAÇÃO',
        subscription: updatedSubscription,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Erro em POST /api/pix-direto:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Falha ao gerar cobrança PIX Direto.',
      },
      { status: 500 }
    )
  }
}
