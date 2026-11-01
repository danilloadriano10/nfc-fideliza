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
    const companyPlan = getCompanyPlan(company)
    const planValue = getPlanPrice(companyPlan)
    const planLabel = getPlanLabel(companyPlan)

    let subscription = await getServerSubscription(companyId)
    const isConfigured = isAsaasConfigured()
    const environment = getAsaasEnvironment()

    // Se temos assinatura pendente no Asaas, tentar conciliar pagamento em tempo real
    let asaasRemoteDetails = null
    if (subscription?.asaasSubscriptionId && isConfigured) {
      try {
        asaasRemoteDetails = await getAsaasSubscription(subscription.asaasSubscriptionId)
        if (subscription.status !== 'ACTIVE') {
          const paymentsList = await getAsaasSubscriptionPayments(subscription.asaasSubscriptionId)
          if (Array.isArray(paymentsList)) {
            const confirmedPayment = paymentsList.find(
              (p) => p.status === 'CONFIRMED' || p.status === 'RECEIVED' || p.status === 'RECEIVED_IN_CASH'
            )
            if (confirmedPayment) {
              const nowIso = new Date().toISOString()
              subscription = {
                ...subscription,
                status: 'ACTIVE',
                lastPaymentId: confirmedPayment.id,
                lastPaymentStatus: confirmedPayment.status,
                lastPaymentDate:
                  confirmedPayment.paymentDate || confirmedPayment.clientPaymentDate || nowIso,
                updatedAt: nowIso,
              }
              await saveServerSubscription(subscription)
            }
          }
        }
      } catch (err) {
        console.warn('Não foi possível sincronizar com Asaas remoto no GET:', err)
      }
    }

    const isUnlocked = isCompanyActiveOrExempt({
      ...company,
      subscription: subscription || undefined,
    })

    return NextResponse.json(
      {
        success: true,
        companyId,
        environment,
        isConfigured,
        plan: companyPlan,
        planValue,
        planLabel,
        requiresActivation: Boolean(company.requiresActivation),
        isUnlocked,
        subscription: subscription || null,
        asaasRemote: asaasRemoteDetails,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error in GET /api/asaas/subscription:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno.' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Cria ou inicia uma assinatura mensal de R$ 69,99 no Asaas (PIX ou Cartão de Crédito).
 */
export async function POST(req: NextRequest) {
  try {
    // Se estiver em produção e sem chave configurada, retorna erro JSON explicativo (status 400 para evitar interceptação de proxy)
    if (!isAsaasConfigured() && getAsaasEnvironment() === 'PRODUCTION') {
      return NextResponse.json(
        {
          success: false,
          error:
            'A chave ASAAS_API_KEY não foi configurada nas variáveis de ambiente de produção.',
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json().catch(() => ({}))
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
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const method: 'PIX' | 'CREDIT_CARD' =
      paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX'

    let company = await getServerCompanyById(companyId)
    if (!company) {
      company = await getServerCompanyBySlug(companyId)
    }
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não encontrado.' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Identificação do plano e valor estritamente no servidor
    const companyPlan = getCompanyPlan(company)
    const planValue = getPlanPrice(companyPlan)
    const planLabel = getPlanLabel(companyPlan)

    // 1. Prevenção de duplicidade: verificar se já existe assinatura ativa ou pendente
    const existingSub = await getServerSubscription(companyId)
    if (existingSub && existingSub.status === 'ACTIVE') {
      return NextResponse.json(
        {
          success: true,
          message: 'Esta empresa já possui uma assinatura ativa no Asaas.',
          subscription: existingSub,
          environment: getAsaasEnvironment(),
        },
        { status: 200 }
      )
    }

    // Se o cliente já gerou uma assinatura PIX recente e ainda está PENDENTE com o mesmo plano, retornar os dados do Pix existente
    if (
      method === 'PIX' &&
      existingSub &&
      existingSub.status === 'PENDING' &&
      existingSub.paymentMethod === 'PIX' &&
      existingSub.pixCopiaECola &&
      (!existingSub.plan || existingSub.plan === companyPlan)
    ) {
      return NextResponse.json(
        {
          success: true,
          subscription: existingSub,
          environment: getAsaasEnvironment(),
          pix: {
            encodedImage: existingSub.pixQrCodeUrl?.replace('data:image/png;base64,', '') || '',
            payload: existingSub.pixCopiaECola,
            expirationDate: existingSub.pixExpirationDate || '',
          },
        },
        { status: 200 }
      )
    }

    // 2. Localizar ou cadastrar o cliente correspondente no Asaas
    const customerRes = await findOrCreateAsaasCustomer(company, billingInfo)
    if (!customerRes.success || !customerRes.customerId) {
      return NextResponse.json(
        { success: false, error: customerRes.error || 'Erro ao vincular cliente no Asaas.' },
        { status: 400 }
      )
    }

    const asaasCustomerId = customerRes.customerId

    // 3. Criar a assinatura no Asaas com valor oficial calculado no servidor (LINKS: 29.99 | PRO: 69.99)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined

    const subRes = await createAsaasSubscription({
      companyId,
      customerId: asaasCustomerId,
      billingType: method,
      plan: companyPlan,
      cycle: 'MONTHLY',
      description: `Mensalidade DiretoLink - ${planLabel} (${company.name})`,
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

    // 4. Estruturar os dados da assinatura com plano e valores oficiais
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
      plan: companyPlan,
      value: planValue,
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
      description: createdSub.description || `Mensalidade DiretoLink - ${planLabel}`,
      externalReference: companyId,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    // 5. Salvar assinatura no Firestore
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
      { status: 400, headers: { 'Content-Type': 'application/json' } }
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
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const currentSub = await getServerSubscription(companyId)
    if (!currentSub || !currentSub.asaasSubscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma assinatura encontrada para este estabelecimento.' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
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
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error in DELETE /api/asaas/subscription:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao cancelar assinatura.' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
