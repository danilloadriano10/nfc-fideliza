import { NextRequest, NextResponse } from 'next/server'
import {
  getServerCompanyById,
  getServerCompanyBySlug,
  getServerSubscription,
  saveServerSubscription,
} from '@/lib/server-storage'
import {
  createMercadoPagoPreapproval,
  getMercadoPagoPreapproval,
  isMercadoPagoConfigured,
  getMercadoPagoPublicKey,
} from '@/lib/mercadopago-service'
import {
  CompanySubscription,
  getCompanyPlan,
  getPlanPrice,
  getPlanLabel,
  isCompanyActiveOrExempt,
} from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/mercadopago/subscription?companyId=...
 * Consulta o status da assinatura Mercado Pago e sincroniza se estiver pendente.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const companyIdOrSlug = searchParams.get('companyId') || searchParams.get('slug')

    if (!companyIdOrSlug) {
      return NextResponse.json(
        { success: false, error: 'companyId ou slug é obrigatório.' },
        { status: 400 }
      )
    }

    let company = await getServerCompanyById(companyIdOrSlug)
    if (!company) {
      company = await getServerCompanyBySlug(companyIdOrSlug)
    }

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não encontrado.' },
        { status: 404 }
      )
    }

    const companyPlan = getCompanyPlan(company)
    const planValue = getPlanPrice(companyPlan)
    const planLabel = getPlanLabel(companyPlan)
    let subscription = await getServerSubscription(company.id)
    const isConfigured = isMercadoPagoConfigured()

    // Se temos assinatura pendente no Mercado Pago, tenta conciliar status em tempo real
    if (subscription?.mpPreapprovalId && subscription.status !== 'ACTIVE' && isConfigured) {
      try {
        const mpDetails = await getMercadoPagoPreapproval(subscription.mpPreapprovalId)
        if (mpDetails && mpDetails.status === 'authorized') {
          const nowIso = new Date().toISOString()
          subscription = {
            ...subscription,
            status: 'ACTIVE',
            lastPaymentStatus: 'authorized',
            lastPaymentDate: nowIso,
            updatedAt: nowIso,
          }
          await saveServerSubscription(subscription)
          console.log(`[Mercado Pago Sync] Assinatura da empresa ${company.slug} ativada via verificação direta.`)
        }
      } catch (syncErr) {
        console.warn('Erro ao sincronizar status do Mercado Pago no GET:', syncErr)
      }
    }

    const isUnlocked = isCompanyActiveOrExempt({
      ...company,
      subscription: subscription || undefined,
    })

    return NextResponse.json(
      {
        success: true,
        companyId: company.id,
        isConfigured,
        publicKey: getMercadoPagoPublicKey(),
        plan: companyPlan,
        planValue,
        planLabel,
        requiresActivation: Boolean(company.requiresActivation),
        isUnlocked,
        subscription: subscription || null,
        initPoint: subscription?.mpInitPoint || null,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Erro em GET /api/mercadopago/subscription:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno.' },
      { status: 400 }
    )
  }
}

/**
 * POST /api/mercadopago/subscription
 * Cria ou recupera uma assinatura recorrente no Mercado Pago.
 *
 * PLANOS OFICIAIS (valores e regras validados no servidor):
 * - DiretoLink Links: R$ 29,99/mês
 * - DiretoLink Pro: R$ 69,99/mês
 */
export async function POST(req: NextRequest) {
  try {
    const isConfigured = isMercadoPagoConfigured()
    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A credencial MERCADOPAGO_ACCESS_TOKEN não está configurada nas variáveis de ambiente do servidor.',
        },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { companyId, payerEmail } = body

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

    // Identificação do plano e valor EXCLUSIVAMENTE pelo servidor
    const companyPlan = getCompanyPlan(company)
    const planValue = getPlanPrice(companyPlan)
    const planLabel = getPlanLabel(companyPlan)

    // 1. Evitar cobrança duplicada se a empresa já estiver ACTIVE
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

    // 2. Se já existir uma assinatura pendente com link de pagamento válido, reaproveitar para não gerar lixo
    if (existingSub && existingSub.mpPreapprovalId && existingSub.mpInitPoint && existingSub.status === 'PENDING') {
      return NextResponse.json(
        {
          success: true,
          subscription: existingSub,
          initPoint: existingSub.mpInitPoint,
          isUnlocked: false,
          reused: true,
        },
        { status: 200 }
      )
    }

    // Determina URL de retorno após o checkout
    const host = req.headers.get('host') || 'diretolink.com.br'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const backUrl = `${protocol}://${host}/painel`

    // Email do pagador seguro
    const finalEmail =
      payerEmail ||
      company.ownerAuth?.ownerEmail ||
      `${company.slug}@diretolink.com.br`

    // Criação no Mercado Pago
    const mpResult = await createMercadoPagoPreapproval({
      companyId: company.id,
      companyName: company.name,
      plan: companyPlan,
      payerEmail: finalEmail,
      backUrl,
    })

    if (!mpResult.success || !mpResult.id) {
      return NextResponse.json(
        {
          success: false,
          error: mpResult.error || 'Não foi possível gerar a assinatura no Mercado Pago.',
        },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()
    const newSubscription: CompanySubscription = {
      id: existingSub?.id || `sub_${company.id}`,
      companyId: company.id,
      gateway: 'mercadopago',
      status: 'PENDING',
      paymentMethod: 'UNDEFINED',
      value: planValue,
      cycle: 'MONTHLY',
      plan: companyPlan,
      mpPreapprovalId: mpResult.id,
      mpInitPoint: mpResult.init_point,
      mpPayerEmail: finalEmail,
      nextDueDate: null,
      lastPaymentDate: null,
      externalReference: company.id,
      description: `Assinatura ${planLabel} - Mensal`,
      createdAt: existingSub?.createdAt || nowIso,
      updatedAt: nowIso,
    }

    await saveServerSubscription(newSubscription)

    return NextResponse.json(
      {
        success: true,
        subscription: newSubscription,
        initPoint: mpResult.init_point,
        plan: companyPlan,
        planValue,
        planLabel,
        isUnlocked: false,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Erro em POST /api/mercadopago/subscription:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro interno ao processar assinatura.',
      },
      { status: 500 }
    )
  }
}
