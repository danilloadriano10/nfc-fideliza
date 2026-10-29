import { NextRequest, NextResponse } from 'next/server'
import {
  getServerSubscription,
  saveServerSubscription,
  getServerSubscriptionByAsaasId,
  getServerSubscriptionByAsaasCustomerId,
  isServerWebhookEventProcessed,
  recordServerWebhookEvent,
  getServerCompanyById,
} from '@/lib/server-storage'
import {
  getAsaasEnvironment,
  mapAsaasStatusToSubscriptionStatus,
} from '@/lib/asaas-service'
import { AsaasSubscriptionStatus, CompanySubscription } from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface AsaasWebhookBody {
  id?: string
  event?: string
  dateCreated?: string
  payment?: {
    id?: string
    customer?: string
    subscription?: string
    value?: number
    netValue?: number
    billingType?: string
    status?: string
    dueDate?: string
    paymentDate?: string
    clientPaymentDate?: string
    invoiceUrl?: string
    externalReference?: string
    confirmedDate?: string
    creditCard?: {
      creditCardNumber?: string
      creditCardBrand?: string
    }
  }
  subscription?: {
    id?: string
    customer?: string
    billingType?: string
    value?: number
    nextDueDate?: string
    status?: string
    cycle?: string
    externalReference?: string
  }
}

/**
 * Endpoint de Health Check e Verificação de Conectividade do Webhook.
 */
export async function GET() {
  const env = getAsaasEnvironment()
  const hasKey = Boolean(process.env.ASAAS_API_KEY)
  const hasWebhookToken = Boolean(process.env.ASAAS_WEBHOOK_TOKEN)

  return NextResponse.json(
    {
      status: 'active',
      service: 'DiretoLink Asaas Webhook Service',
      environment: env,
      isConfigured: hasKey,
      hasWebhookTokenValidation: hasWebhookToken,
      timestamp: new Date().toISOString(),
      instructions:
        'Envie requisições POST do Asaas para este endpoint. O webhook é idempotente e processa pagamentos e assinaturas em segundo plano.',
    },
    { status: 200 }
  )
}

/**
 * Webhook Idempotente para receber notificações de eventos do Asaas (Sandbox e Produção).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Validação opcional de token de segurança do webhook (se configurado nas variáveis de ambiente)
    const expectedToken = (process.env.ASAAS_WEBHOOK_TOKEN || '').trim()
    if (expectedToken) {
      const incomingToken = (req.headers.get('asaas-access-token') || '').trim()
      if (incomingToken !== expectedToken) {
        console.warn('Webhook Asaas rejeitado: asaas-access-token inválido.')
        return NextResponse.json(
          { success: false, error: 'Token de acesso do webhook não autorizado.' },
          { status: 401 }
        )
      }
    }

    // 2. Parse seguro do body
    let body: AsaasWebhookBody
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'JSON inválido no corpo da requisição.' },
        { status: 400 }
      )
    }

    const eventName = (body.event || '').trim().toUpperCase()
    if (!eventName) {
      return NextResponse.json(
        { success: false, error: 'Campo "event" é obrigatório no webhook.' },
        { status: 400 }
      )
    }

    const payment = body.payment
    const subscription = body.subscription

    // 3. Chave de idempotência única para o evento
    const paymentId = payment?.id || ''
    const subscriptionId = subscription?.id || payment?.subscription || ''
    const rawEventId = body.id || ''
    const eventKey = (
      rawEventId ||
      `${eventName}_${paymentId || subscriptionId}_${payment?.status || subscription?.status || ''}_${payment?.paymentDate || body.dateCreated || ''}`
    ).trim()

    // 4. Verificação de idempotência (evita processamento duplicado)
    const alreadyProcessed = await isServerWebhookEventProcessed(eventKey)
    if (alreadyProcessed) {
      return NextResponse.json(
        {
          success: true,
          idempotent: true,
          message: 'Evento Asaas já processado anteriormente.',
          eventId: eventKey,
        },
        { status: 200 }
      )
    }

    // 5. Localizar a assinatura correspondente no Firestore
    let companyId = (payment?.externalReference || subscription?.externalReference || '').trim()
    let currentSubscription: CompanySubscription | null = null

    // 5.1 Se temos companyId direto na externalReference
    if (companyId) {
      currentSubscription = await getServerSubscription(companyId)
    }

    // 5.2 Se não encontrou, busca por asaasSubscriptionId
    if (!currentSubscription && subscriptionId) {
      currentSubscription = await getServerSubscriptionByAsaasId(subscriptionId)
      if (currentSubscription) {
        companyId = currentSubscription.companyId
      }
    }

    // 5.3 Se não encontrou, busca por asaasCustomerId
    const asaasCustomerId = payment?.customer || subscription?.customer || ''
    if (!currentSubscription && asaasCustomerId) {
      currentSubscription = await getServerSubscriptionByAsaasCustomerId(asaasCustomerId)
      if (currentSubscription) {
        companyId = currentSubscription.companyId
      }
    }

    // Se ainda não temos companyId, tenta verificar se o externalReference é de uma empresa válida
    if (companyId && !currentSubscription) {
      const comp = await getServerCompanyById(companyId)
      if (comp) {
        currentSubscription = comp.subscription || null
      }
    }

    // 6. Atualizar a assinatura se localizada
    if (currentSubscription && companyId) {
      const targetSubId = subscriptionId || currentSubscription.asaasSubscriptionId || ''
      const targetCustId = asaasCustomerId || currentSubscription.asaasCustomerId || ''

      const newStatus: AsaasSubscriptionStatus = mapAsaasStatusToSubscriptionStatus(
        eventName,
        payment?.status,
        subscription?.status
      )

      const isPaymentSuccess = eventName === 'PAYMENT_RECEIVED' || eventName === 'PAYMENT_CONFIRMED'
      const paymentDate = payment?.paymentDate || payment?.clientPaymentDate || new Date().toISOString()

      const updatedSubscription: CompanySubscription = {
        ...currentSubscription,
        asaasSubscriptionId: targetSubId || currentSubscription.asaasSubscriptionId,
        asaasCustomerId: targetCustId || currentSubscription.asaasCustomerId,
        status: newStatus,
        paymentMethod:
          payment?.billingType === 'PIX'
            ? 'PIX'
            : payment?.billingType === 'CREDIT_CARD'
            ? 'CREDIT_CARD'
            : currentSubscription.paymentMethod,
        lastPaymentStatus: payment?.status || currentSubscription.lastPaymentStatus,
        lastPaymentId: payment?.id || currentSubscription.lastPaymentId,
        lastPaymentDate: isPaymentSuccess ? paymentDate : currentSubscription.lastPaymentDate,
        nextDueDate:
          subscription?.nextDueDate ||
          payment?.dueDate ||
          currentSubscription.nextDueDate,
        invoiceUrl: payment?.invoiceUrl || currentSubscription.invoiceUrl,
        creditCardLast4: payment?.creditCard?.creditCardNumber || currentSubscription.creditCardLast4,
        creditCardBrand: payment?.creditCard?.creditCardBrand || currentSubscription.creditCardBrand,
        updatedAt: new Date().toISOString(),
      }

      await saveServerSubscription(updatedSubscription)
      console.log(`[ASAAS WEBHOOK] Assinatura da empresa ${companyId} atualizada para status ${newStatus}. Evento: ${eventName}`)
    } else {
      console.warn(
        `[ASAAS WEBHOOK] Nenhuma empresa associada ao evento ${eventName}. ExternalRef: ${companyId}, SubscriptionId: ${subscriptionId}, CustomerId: ${asaasCustomerId}`
      )
    }

    // 7. Grava o evento na coleção de idempotência para auditoria
    await recordServerWebhookEvent(eventKey, eventName, body, companyId || undefined)

    // 8. Responde 200 OK para o Asaas confirmar a entrega
    return NextResponse.json(
      {
        success: true,
        event: eventName,
        processed: true,
        companyId: companyId || null,
        subscriptionId: subscriptionId || null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Erro interno no processamento do webhook Asaas:', err)
    // Retorna status 200 mesmo em caso de erro interno com log para evitar retentativas infinitas se payload for irrecuperável
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro no processamento do webhook',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  }
}
