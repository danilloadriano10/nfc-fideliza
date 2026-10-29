import { NextRequest, NextResponse } from 'next/server'
import {
  getServerCompanyById,
  getServerCompanyBySlug,
  getServerSubscription,
  saveServerSubscription,
} from '@/lib/server-storage'
import {
  findOrCreateAsaasCustomer,
  createAsaasSubscription,
  getAsaasSubscription,
  cancelAsaasSubscription,
  getAsaasPixQrCode,
  getAsaasSubscriptionPayments,
  getAsaasEnvironment,
  isAsaasConfigured,
  AsaasCreditCardInput,
  AsaasCreditCardHolderInfo,
} from '@/lib/asaas-service'
import { CompanySubscription } from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PLAN_VALUE = 69.99

/**
 * Consulta a assinatura da empresa e ambiente Asaas atual.
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

    const companyId = company.id
    const subscription = await getServerSubscription(companyId)
    const isConfigured = isAsaasConfigured()
    const environment = getAsaasEnvironment()

    // Se temos assinatura ativa no Asaas, tentar enriquecer com dados atualizados se necessário
    let asaasRemoteDetails = null
    if (subscription?.asaasSubscriptionId && isConfigured) {
      try {
        asaasRemoteDetails = await getAsaasSubscription(subscription.asaasSubscriptionId)
      } catch (err) {
        console.warn('Não foi possível sincronizar com Asaas remoto no GET:', err)
      }
    }

    return NextResponse.json(
      {
        success: true,
        companyId,
        environment,
        isConfigured,
        planValue: PLAN_VALUE,
        subscription: subscription || null,
        asaasRemote: asaasRemoteDetails,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error in GET /api/asaas/subscription:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno.' },
      { status: 500 }
    )
  }
}

/**
 * Cria ou inicia uma assinatura mensal de R$ 69,99 no Asaas (PIX ou Cartão de Crédito).
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAsaasConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A chave ASAAS_API_KEY não foi configurada nas variáveis de ambiente do servidor.',
        },
        { status: 503 }
      )
    }

    const body = await req.json()
    const {
      companyId,
      paymentMethod,
      creditCard,
      creditCardHolderInfo,
      billingInfo,
    } = body || {}

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId é obrigatório.' },
        { status: 400 }
      )
    }

    const method: 'PIX' | 'CREDIT_CARD' =
      paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX'

    const company = await getServerCompanyById(companyId)
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não encontrado.' },
        { status: 404 }
      )
    }

    // 1. Localizar ou cadastrar o cliente correspondente no Asaas
    const customerRes = await findOrCreateAsaasCustomer(company, billingInfo)
    if (!customerRes.success || !customerRes.customerId) {
      return NextResponse.json(
        { success: false, error: customerRes.error || 'Erro ao vincular cliente no Asaas.' },
        { status: 400 }
      )
    }

    const asaasCustomerId = customerRes.customerId

    // 2. Criar a assinatura no Asaas com valor de R$ 69,99 / mês
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined

    const subRes = await createAsaasSubscription({
      companyId,
      customerId: asaasCustomerId,
      billingType: method,
      value: PLAN_VALUE,
      cycle: 'MONTHLY',
      description: `Mensalidade DiretoLink - ${company.name}`,
      creditCard: method === 'CREDIT_CARD' ? (creditCard as AsaasCreditCardInput) : undefined,
      creditCardHolderInfo:
        method === 'CREDIT_CARD'
          ? (creditCardHolderInfo as AsaasCreditCardHolderInfo)
          : undefined,
      remoteIp: clientIp,
    })

    if (!subRes.success || !subRes.subscription) {
      return NextResponse.json(
        { success: false, error: subRes.error || 'Erro ao gerar assinatura no Asaas.' },
        { status: 400 }
      )
    }

    const createdSub = subRes.subscription
    const firstPayment = subRes.firstPayment
    const pixData = subRes.pix

    // 3. Estruturar os dados da assinatura conforme especificado
    const nowIso = new Date().toISOString()
    const initialStatus = method === 'CREDIT_CARD' && firstPayment?.status === 'CONFIRMED'
      ? 'ACTIVE'
      : 'PENDING'

    const companySubscription: CompanySubscription = {
      id: `sub_${companyId}`,
      companyId,
      asaasCustomerId,
      asaasSubscriptionId: createdSub.id,
      status: initialStatus,
      paymentMethod: method,
      value: PLAN_VALUE,
      cycle: 'MONTHLY',
      nextDueDate: createdSub.nextDueDate || firstPayment?.dueDate || null,
      lastPaymentDate: firstPayment?.status === 'CONFIRMED' ? nowIso : null,
      lastPaymentStatus: firstPayment?.status || 'PENDING',
      lastPaymentId: firstPayment?.id || null,
      pixQrCodeUrl: pixData?.encodedImage ? `data:image/png;base64,${pixData.encodedImage}` : null,
      pixCopiaECola: pixData?.payload || null,
      pixExpirationDate: pixData?.expirationDate || null,
      creditCardLast4: firstPayment?.creditCard?.creditCardNumber || undefined,
      creditCardBrand: firstPayment?.creditCard?.creditCardBrand || undefined,
      invoiceUrl: firstPayment?.invoiceUrl || undefined,
      description: createdSub.description || 'Mensalidade DiretoLink - Plano Profissional',
      externalReference: companyId,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    // 4. Salvar assinatura no Firestore
    const saved = await saveServerSubscription(companySubscription)

    return NextResponse.json(
      {
        success: true,
        subscription: saved,
        environment: getAsaasEnvironment(),
        pix: pixData || null,
        firstPayment: firstPayment || null,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Error in POST /api/asaas/subscription:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao processar assinatura.' },
      { status: 500 }
    )
  }
}

/**
 * Cancela a assinatura de uma empresa no Asaas e atualiza o status para CANCELLED.
 */
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId é obrigatório.' },
        { status: 400 }
      )
    }

    const currentSub = await getServerSubscription(companyId)
    if (!currentSub || !currentSub.asaasSubscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma assinatura encontrada para este estabelecimento.' },
        { status: 404 }
      )
    }

    // Cancela no Asaas
    if (isAsaasConfigured()) {
      const cancelRes = await cancelAsaasSubscription(currentSub.asaasSubscriptionId)
      if (!cancelRes.success) {
        console.warn('Aviso no cancelamento remoto Asaas:', cancelRes.error)
      }
    }

    // Atualiza status local para CANCELLED
    const updated: CompanySubscription = {
      ...currentSub,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    }

    await saveServerSubscription(updated)

    return NextResponse.json(
      { success: true, message: 'Assinatura cancelada com sucesso.', subscription: updated },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error in DELETE /api/asaas/subscription:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao cancelar assinatura.' },
      { status: 500 }
    )
  }
}
