import { CompanyPlan, getPlanPrice, getPlanLabel } from '@/types/platform'

const MP_API_BASE = 'https://api.mercadopago.com'

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_ACCESS_TOKEN.trim().length > 0)
}

export function getMercadoPagoAccessToken(): string {
  return (process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim()
}

export function getMercadoPagoPublicKey(): string {
  return (process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '').trim()
}

export interface MpPreapprovalResponse {
  id: string
  payer_id?: number
  payer_email?: string
  back_url?: string
  collector_id?: number
  application_id?: number
  status: 'pending' | 'authorized' | 'paused' | 'cancelled' | string
  reason?: string
  external_reference?: string
  date_created?: string
  last_modified?: string
  init_point?: string
  sandbox_init_point?: string
  auto_recurring?: {
    frequency: number
    frequency_type: string
    transaction_amount: number
    currency_id: string
  }
}

export interface MpPaymentResponse {
  id: number | string
  status: 'approved' | 'pending' | 'in_process' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back' | string
  status_detail?: string
  external_reference?: string
  transaction_amount?: number
  date_approved?: string
  date_created?: string
  payment_method_id?: string
  payment_type_id?: string
  payer?: {
    id?: string
    email?: string
  }
}

/**
 * Cria uma assinatura (preapproval) no Mercado Pago com cobrança mensal recorrente.
 * O valor e plano são rigorosamente validados no servidor.
 */
export async function createMercadoPagoPreapproval(params: {
  companyId: string
  companyName: string
  plan: CompanyPlan
  payerEmail?: string
  backUrl?: string
}): Promise<{
  success: boolean
  id?: string
  init_point?: string
  status?: string
  value?: number
  error?: string
}> {
  const token = getMercadoPagoAccessToken()
  if (!token) {
    return {
      success: false,
      error: 'Variável de ambiente MERCADOPAGO_ACCESS_TOKEN não está configurada.',
    }
  }

  // Preço e plano definidos exclusivamente no servidor
  const amount = getPlanPrice(params.plan)
  const planLabel = getPlanLabel(params.plan)
  const reason = `Assinatura ${planLabel} - Mensal`

  // Payer email válido
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  let cleanEmail = (params.payerEmail || '').trim()
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    cleanEmail = `contato+${params.companyId.slice(0, 12)}@diretolink.com.br`
  }

  const payload = {
    reason,
    external_reference: params.companyId,
    payer_email: cleanEmail,
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: amount,
      currency_id: 'BRL',
    },
    back_url: params.backUrl || 'https://diretolink.com.br/painel',
    status: 'pending',
  }

  try {
    const res = await fetch(`${MP_API_BASE}/preapproval`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Erro ao criar preapproval no Mercado Pago:', res.status, data)
      const detail = data?.message || data?.error || (Array.isArray(data?.cause) ? data.cause.map((c: { description?: string }) => c.description).join('; ') : '')
      return {
        success: false,
        error: detail ? `Mercado Pago: ${detail}` : `Erro HTTP ${res.status} ao criar assinatura no Mercado Pago.`,
      }
    }

    const initPoint = data.init_point || data.sandbox_init_point || ''
    return {
      success: true,
      id: data.id,
      init_point: initPoint,
      status: data.status,
      value: amount,
    }
  } catch (err) {
    console.error('Exceção ao chamar API de preapproval do Mercado Pago:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha na comunicação com Mercado Pago.',
    }
  }
}

/**
 * Consulta uma assinatura (preapproval) diretamente na API do Mercado Pago.
 */
export async function getMercadoPagoPreapproval(
  preapprovalId: string
): Promise<MpPreapprovalResponse | null> {
  const cleanId = (preapprovalId || '').trim()
  if (!cleanId) return null

  // Evitar consulta desnecessária se for o mock/simulador 123456
  if (cleanId === '123456' || cleanId === '123456789') {
    return null
  }

  const token = getMercadoPagoAccessToken()
  if (!token) return null

  try {
    const res = await fetch(`${MP_API_BASE}/preapproval/${encodeURIComponent(cleanId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status !== 404) {
        console.warn('Mercado Pago GET preapproval retornou status:', res.status)
      }
      return null
    }

    const data = await res.json()
    return data as MpPreapprovalResponse
  } catch (err) {
    console.error('Erro ao consultar preapproval no Mercado Pago:', err)
    return null
  }
}

/**
 * Consulta um pagamento avulso ou de assinatura diretamente na API do Mercado Pago.
 */
export async function getMercadoPagoPayment(paymentId: string | number): Promise<MpPaymentResponse | null> {
  const cleanId = String(paymentId || '').trim()
  if (!cleanId) return null

  if (cleanId === '123456' || cleanId === '123456789') {
    return null
  }

  const token = getMercadoPagoAccessToken()
  if (!token) return null

  try {
    const res = await fetch(`${MP_API_BASE}/v1/payments/${encodeURIComponent(cleanId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status !== 404) {
        console.warn('Mercado Pago GET payment retornou status:', res.status)
      }
      return null
    }

    const data = await res.json()
    return data as MpPaymentResponse
  } catch (err) {
    console.error('Erro ao consultar pagamento no Mercado Pago:', err)
    return null
  }
}
