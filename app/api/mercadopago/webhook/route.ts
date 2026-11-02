import { NextRequest, NextResponse } from 'next/server'
import {
  getServerCompanyById,
  getServerSubscription,
  saveServerSubscription,
  getServerSubscriptionByMpPreapprovalId,
  recordServerMpWebhookEvent,
} from '@/lib/server-storage'
import {
  getMercadoPagoPreapproval,
  getMercadoPagoPayment,
} from '@/lib/mercadopago-service'
import { CompanySubscription, getCompanyPlan, getPlanPrice } from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/mercadopago/webhook
 * Permite verificação de status e health-check pelo navegador ou monitores de webhook sem retornar 404.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      status: 'online',
      message: 'Endpoint de webhook do Mercado Pago (DiretoLink) ativo e pronto para receber notificações.',
    },
    { status: 200 }
  )
}

/**
 * POST /api/mercadopago/webhook
 * Recebe notificações de eventos do Mercado Pago para:
 * - Assinaturas / Planos: subscription_preapproval, entity: preapproval, action: updated
 * - Pagamentos de assinatura: subscription_authorized_payment, payment
 * - Simulações e testes do painel de desenvolvedores do Mercado Pago
 */
export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams

    // Parse do corpo JSON seguro
    let body: any = {}
    try {
      const text = await req.text()
      if (text && text.trim()) {
        body = JSON.parse(text)
      }
    } catch (parseErr) {
      console.warn('[Mercado Pago Webhook] Aviso ao fazer parse do corpo JSON:', parseErr)
    }

    // Extração normalizada de atributos de webhook / IPN
    const action = body?.action || searchParams.get('action') || ''
    const type =
      body?.type ||
      body?.entity ||
      searchParams.get('type') ||
      searchParams.get('topic') ||
      ''
    const rawDataId =
      body?.data?.id ??
      body?.id ??
      searchParams.get('data.id') ??
      searchParams.get('id') ??
      ''
    const dataId = String(rawDataId).trim()
    const eventId = String(body?.id || dataId || `mp_${Date.now()}`)

    console.log('[Mercado Pago Webhook] Notificação recebida:', {
      action,
      type,
      dataId,
      eventId,
    })

    // Registra log do evento para auditoria no Firestore
    try {
      await recordServerMpWebhookEvent(eventId, `${type}:${action}`, {
        body,
        query: Object.fromEntries(searchParams.entries()),
      })
    } catch (logErr) {
      console.warn('[Mercado Pago Webhook] Falha ao registrar log:', logErr)
    }

    // 1. Trata simulação e testes do painel do Mercado Pago (Data ID 123456 ou 123456789)
    if (dataId === '123456' || dataId === '123456789' || !dataId) {
      return NextResponse.json(
        {
          success: true,
          simulated: true,
          message: 'Simulação do Mercado Pago recebida e confirmada com sucesso (HTTP 200).',
          dataId,
        },
        { status: 200 }
      )
    }

    // 2. Eventos de Assinatura / Preapproval (Planos Recorrentes)
    const isPreapprovalEvent =
      type === 'subscription_preapproval' ||
      body?.entity === 'preapproval' ||
      type === 'preapproval' ||
      action.includes('preapproval')

    if (isPreapprovalEvent) {
      // Consulta os dados REAIS no Mercado Pago (nunca confiar exclusivamente no webhook)
      const mpPreapproval = await getMercadoPagoPreapproval(dataId)

      if (mpPreapproval) {
        // Localiza a empresa pelo external_reference ou pelo ID de preapproval
        const companyIdFromRef = (mpPreapproval.external_reference || '').trim()
        let company = companyIdFromRef ? await getServerCompanyById(companyIdFromRef) : null

        let existingSub: CompanySubscription | null = null
        if (company) {
          existingSub = await getServerSubscription(company.id)
        } else {
          // Busca por query mpPreapprovalId
          existingSub = await getServerSubscriptionByMpPreapprovalId(mpPreapproval.id)
          if (existingSub?.companyId) {
            company = await getServerCompanyById(existingSub.companyId)
          }
        }

        if (company) {
          const nowIso = new Date().toISOString()
          const companyPlan = existingSub?.plan || getCompanyPlan(company)
          const planValue = existingSub?.value || getPlanPrice(companyPlan)

          // Mapeia status do Mercado Pago para o status da DiretoLink
          let newStatus = existingSub?.status || 'PENDING'
          if (mpPreapproval.status === 'authorized') {
            newStatus = 'ACTIVE' // Pagamento e assinatura confirmados: painel liberado!
          } else if (mpPreapproval.status === 'cancelled') {
            newStatus = 'CANCELLED'
          } else if (mpPreapproval.status === 'paused') {
            newStatus = 'OVERDUE'
          } else if (mpPreapproval.status === 'pending') {
            newStatus = 'PENDING'
          }

          const updatedSubscription: CompanySubscription = {
            id: existingSub?.id || `sub_${company.id}`,
            companyId: company.id,
            gateway: 'mercadopago',
            status: newStatus,
            paymentMethod: existingSub?.paymentMethod || 'UNDEFINED',
            value: planValue,
            cycle: 'MONTHLY',
            plan: companyPlan,
            mpPreapprovalId: mpPreapproval.id,
            mpPayerEmail: mpPreapproval.payer_email || existingSub?.mpPayerEmail,
            mpInitPoint: mpPreapproval.init_point || mpPreapproval.sandbox_init_point || existingSub?.mpInitPoint,
            nextDueDate: existingSub?.nextDueDate || null,
            lastPaymentDate: newStatus === 'ACTIVE' ? nowIso : existingSub?.lastPaymentDate || null,
            lastPaymentStatus: mpPreapproval.status,
            lastPaymentId: mpPreapproval.id,
            externalReference: company.id,
            description: `Assinatura ${companyPlan === 'links' ? 'DiretoLink Links' : 'DiretoLink Pro'}`,
            createdAt: existingSub?.createdAt || nowIso,
            updatedAt: nowIso,
          }

          await saveServerSubscription(updatedSubscription)
          console.log(`[Mercado Pago Webhook] Assinatura da empresa ${company.slug} atualizada para ${newStatus}`)
        }
      }

      return NextResponse.json(
        {
          success: true,
          processed: true,
          type: 'subscription_preapproval',
          dataId,
        },
        { status: 200 }
      )
    }

    // 3. Eventos de Pagamento (subscription_authorized_payment ou payment)
    const isPaymentEvent =
      type === 'payment' ||
      type === 'subscription_authorized_payment' ||
      action.startsWith('payment.')

    if (isPaymentEvent) {
      const mpPayment = await getMercadoPagoPayment(dataId)
      if (mpPayment) {
        const companyIdFromRef = (mpPayment.external_reference || '').trim()
        let company = companyIdFromRef ? await getServerCompanyById(companyIdFromRef) : null

        if (company) {
          const nowIso = new Date().toISOString()
          const existingSub = await getServerSubscription(company.id)
          const companyPlan = existingSub?.plan || getCompanyPlan(company)
          const planValue = existingSub?.value || getPlanPrice(companyPlan)

          if (mpPayment.status === 'approved') {
            const updatedSubscription: CompanySubscription = {
              id: existingSub?.id || `sub_${company.id}`,
              companyId: company.id,
              gateway: 'mercadopago',
              status: 'ACTIVE', // Pagamento aprovado: ativa imediatamente o painel
              paymentMethod: 'CREDIT_CARD',
              value: planValue,
              cycle: 'MONTHLY',
              plan: companyPlan,
              mpPreapprovalId: existingSub?.mpPreapprovalId,
              mpPayerEmail: mpPayment.payer?.email || existingSub?.mpPayerEmail,
              nextDueDate: existingSub?.nextDueDate || null,
              lastPaymentDate: mpPayment.date_approved || nowIso,
              lastPaymentStatus: mpPayment.status,
              lastPaymentId: String(mpPayment.id),
              externalReference: company.id,
              description: `Assinatura ${companyPlan === 'links' ? 'DiretoLink Links' : 'DiretoLink Pro'}`,
              createdAt: existingSub?.createdAt || nowIso,
              updatedAt: nowIso,
            }

            await saveServerSubscription(updatedSubscription)
            console.log(`[Mercado Pago Webhook] Pagamento aprovado da empresa ${company.slug}: painel ativado com sucesso!`)
          }
        }
      }

      return NextResponse.json(
        {
          success: true,
          processed: true,
          type: 'payment',
          dataId,
        },
        { status: 200 }
      )
    }

    // Para outros tipos de eventos do Mercado Pago, responde 200 prontamente
    return NextResponse.json(
      {
        success: true,
        received: true,
        type,
        action,
        dataId,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[Mercado Pago Webhook] Erro ao processar webhook:', err)
    // Responde 200 para evitar re-tentativas desnecessárias do webhook em caso de exceções tratáveis
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro interno ao processar notificação.',
      },
      { status: 200 }
    )
  }
}
