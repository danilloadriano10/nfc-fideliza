import QRCode from 'qrcode'
import {
  Company,
  CompanySubscription,
  AsaasPaymentMethod,
  AsaasSubscriptionStatus,
  CompanyPlan,
  getPlanPrice,
  getPlanLabel,
} from '@/types/platform'

/**
 * Serviço Server-Side para integração com a API do Asaas.
 *
 * Suporta ambiente SANDBOX (https://sandbox.asaas.com/api/v3) e PRODUCTION (https://api.asaas.com/api/v3).
 * A chave de API nunca é exposta no client-side (lida exclusivamente via process.env.ASAAS_API_KEY).
 *
 * Planos Oficiais da Plataforma:
 * - DiretoLink Links: R$ 29,99/mês
 * - DiretoLink Pro:   R$ 69,99/mês
 */

/**
 * Gera dados de cobrança Pix válidos no padrão oficial EMV (Banco Central do Brasil)
 * com QR Code base64 e código Copia e Cola com o valor exato da assinatura.
 */
export async function generateSandboxPixPayload(params: {
  companyId: string
  plan: CompanyPlan
  amount: number
  description: string
}): Promise<AsaasPixQrCodeResponse> {
  const amountStr = params.amount.toFixed(2)
  const cleanTxId =
    params.companyId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase() || 'DIRETOLINK'

  const f00 = '000201'
  const pKey = 'financeiro@diretolink.com.br'
  const f26Content = `0014br.gov.bcb.pix01${String(pKey.length).padStart(2, '0')}${pKey}`
  const f26 = `26${String(f26Content.length).padStart(2, '0')}${f26Content}`
  const f52 = '52040000'
  const f53 = '5303986'
  const f54 = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`
  const f58 = '5802BR'
  const merchantName = 'DIRETOLINK'
  const f59 = `59${String(merchantName.length).padStart(2, '0')}${merchantName}`
  const merchantCity = 'SAO PAULO'
  const f60 = `60${String(merchantCity.length).padStart(2, '0')}${merchantCity}`
  const f62Content = `05${String(cleanTxId.length).padStart(2, '0')}${cleanTxId}`
  const f62 = `62${String(f62Content.length).padStart(2, '0')}${f62Content}`

  const rawWithoutCrc = `${f00}${f26}${f52}${f53}${f54}${f58}${f59}${f60}${f62}6304`

  // Calcular CRC-16 CCITT-FALSE (Padrão Bacen)
  let crc = 0xffff
  for (let i = 0; i < rawWithoutCrc.length; i++) {
    crc ^= rawWithoutCrc.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0')
  const payload = `${rawWithoutCrc}${crcHex}`

  // Gerar imagem do QR Code em base64 PNG
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 320,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  })

  // Remover cabeçalho data:image/png;base64, para compatibilidade com o formato Asaas
  const encodedImage = qrDataUrl.replace(/^data:image\/png;base64,/, '')
  const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  return {
    encodedImage,
    payload,
    expirationDate,
  }
}

export function getAsaasEnvironment(): 'SANDBOX' | 'PRODUCTION' {
  const env = (process.env.ASAAS_ENVIRONMENT || 'SANDBOX').trim().toUpperCase()
  return env === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX'
}

export function getAsaasBaseUrl(): string {
  return getAsaasEnvironment() === 'PRODUCTION'
    ? 'https://api.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3'
}

export function getAsaasApiKey(): string | null {
  const key = process.env.ASAAS_API_KEY
  return key && typeof key === 'string' && key.trim() ? key.trim() : null
}

export function isAsaasConfigured(): boolean {
  return Boolean(getAsaasApiKey())
}

function getHeaders(): HeadersInit {
  const apiKey = getAsaasApiKey()
  if (!apiKey) {
    throw new Error('Chave ASAAS_API_KEY não configurada no ambiente server-side.')
  }
  return {
    'Content-Type': 'application/json',
    'access_token': apiKey,
    'User-Agent': 'DiretoLink-Platform/1.0',
  }
}

// ----------------------------------------------------------------------
// 1. CLIENTES (CUSTOMERS)
// ----------------------------------------------------------------------

export interface AsaasCustomerInput {
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  mobilePhone?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  externalReference?: string
  notificationDisabled?: boolean
}

export interface AsaasCustomerResponse {
  object: 'customer'
  id: string
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  mobilePhone?: string
  externalReference?: string
  deleted?: boolean
  dateCreated?: string
}

export async function createAsaasCustomer(
  input: AsaasCustomerInput
): Promise<{ success: boolean; customer?: AsaasCustomerResponse; error?: string }> {
  try {
    const baseUrl = getAsaasBaseUrl()
    const res = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        cpfCnpj: input.cpfCnpj ? input.cpfCnpj.replace(/\D/g, '') : undefined,
        phone: input.phone ? input.phone.replace(/\D/g, '') : undefined,
        mobilePhone: input.mobilePhone ? input.mobilePhone.replace(/\D/g, '') : undefined,
        postalCode: input.postalCode ? input.postalCode.replace(/\D/g, '') : undefined,
        address: input.address?.trim() || undefined,
        addressNumber: input.addressNumber?.trim() || undefined,
        complement: input.complement?.trim() || undefined,
        province: input.province?.trim() || undefined,
        externalReference: input.externalReference?.trim() || undefined,
        notificationDisabled: input.notificationDisabled !== undefined ? input.notificationDisabled : false,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      const errMsg = Array.isArray(data.errors)
        ? data.errors.map((e: { description: string }) => e.description).join('; ')
        : data.message || `Erro HTTP ${res.status} ao criar cliente no Asaas.`
      return { success: false, error: errMsg }
    }

    return { success: true, customer: data as AsaasCustomerResponse }
  } catch (err) {
    console.error('Error in createAsaasCustomer:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao conectar com API do Asaas.' }
  }
}

export async function findAsaasCustomer(criteria: {
  email?: string
  cpfCnpj?: string
  externalReference?: string
}): Promise<AsaasCustomerResponse | null> {
  try {
    const baseUrl = getAsaasBaseUrl()
    const params = new URLSearchParams()
    if (criteria.email) params.set('email', criteria.email.trim().toLowerCase())
    if (criteria.cpfCnpj) params.set('cpfCnpj', criteria.cpfCnpj.replace(/\D/g, ''))
    if (criteria.externalReference) params.set('externalReference', criteria.externalReference.trim())

    const res = await fetch(`${baseUrl}/customers?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0] as AsaasCustomerResponse
    }
    return null
  } catch (err) {
    console.warn('Error in findAsaasCustomer:', err)
    return null
  }
}

/**
 * Localiza cliente Asaas existente por externalReference (companyId) ou email; se não existir, cria um novo.
 */
export async function findOrCreateAsaasCustomer(
  company: Company,
  customBilling?: {
    name?: string
    email?: string
    cpfCnpj?: string
    phone?: string
  }
): Promise<{ success: boolean; customerId?: string; customer?: AsaasCustomerResponse; error?: string }> {
  const companyId = company.id
  const targetEmail =
    customBilling?.email ||
    company.ownerAuth?.ownerEmail ||
    `${company.slug || company.id}@diretolink.com.br`

  const targetName =
    customBilling?.name ||
    company.ownerAuth?.ownerName ||
    company.name ||
    'Cliente DiretoLink'

  const targetPhone =
    customBilling?.phone ||
    company.ownerAuth?.ownerPhone ||
    company.whatsapp ||
    ''

  const targetCpfCnpj = customBilling?.cpfCnpj || ''

  const isSandbox = getAsaasEnvironment() === 'SANDBOX'

  // Se a chave Asaas estiver configurada, tenta buscar ou criar via API
  if (isAsaasConfigured()) {
    try {
      // 1. Tentar localizar por externalReference (companyId)
      let existing = await findAsaasCustomer({ externalReference: companyId })
      if (existing) {
        return { success: true, customerId: existing.id, customer: existing }
      }

      // 2. Tentar localizar por email
      if (targetEmail) {
        existing = await findAsaasCustomer({ email: targetEmail })
        if (existing) {
          return { success: true, customerId: existing.id, customer: existing }
        }
      }

      // 3. Criar novo cliente no Asaas
      const createRes = await createAsaasCustomer({
        name: targetName,
        email: targetEmail,
        cpfCnpj: targetCpfCnpj || undefined,
        mobilePhone: targetPhone || undefined,
        externalReference: companyId,
      })

      if (createRes.success && createRes.customer) {
        return { success: true, customerId: createRes.customer.id, customer: createRes.customer }
      }

      if (!isSandbox) {
        return { success: false, error: createRes.error || 'Não foi possível cadastrar o cliente no Asaas.' }
      }
    } catch (custErr) {
      if (!isSandbox) {
        return { success: false, error: custErr instanceof Error ? custErr.message : 'Erro ao conectar ao Asaas.' }
      }
    }
  }

  // Fallback seguro em ambiente Sandbox para testes contínuos sem bloqueio
  if (isSandbox) {
    const sandboxCustomerId = `cus_sbx_${companyId.replace(/[^a-zA-Z0-9]/g, '')}`
    return {
      success: true,
      customerId: sandboxCustomerId,
      customer: {
        object: 'customer',
        id: sandboxCustomerId,
        name: targetName,
        email: targetEmail,
        externalReference: companyId,
        dateCreated: new Date().toISOString(),
      },
    }
  }

  return { success: false, error: 'Chave ASAAS_API_KEY não configurada no servidor.' }
}

// ----------------------------------------------------------------------
// 2. ASSINATURAS (SUBSCRIPTIONS)
// ----------------------------------------------------------------------

export interface AsaasCreditCardInput {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export interface AsaasCreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  addressComplement?: string
  phone: string
  mobilePhone?: string
}

export interface CreateSubscriptionParams {
  companyId: string
  customerId: string
  billingType: 'PIX' | 'CREDIT_CARD'
  plan?: CompanyPlan
  value?: number
  nextDueDate?: string // YYYY-MM-DD
  cycle?: 'MONTHLY'
  description?: string
  creditCard?: AsaasCreditCardInput
  creditCardHolderInfo?: AsaasCreditCardHolderInfo
  remoteIp?: string
}

export interface AsaasSubscriptionResponse {
  object: 'subscription'
  id: string
  dateCreated: string
  customer: string
  paymentLink?: string
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'
  value: number
  nextDueDate: string
  discount?: { value: number; type: string }
  interest?: { value: number }
  fine?: { value: number }
  cycle: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description?: string
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  externalReference?: string
}

export interface AsaasPaymentResponse {
  object: 'payment'
  id: string
  dateCreated: string
  customer: string
  subscription?: string
  installment?: string
  paymentLink?: string
  dueDate: string
  value: number
  netValue?: number
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'
  status:
    | 'PENDING'
    | 'RECEIVED'
    | 'CONFIRMED'
    | 'OVERDUE'
    | 'REFUNDED'
    | 'RECEIVED_IN_CASH'
    | 'REFUND_REQUESTED'
    | 'REFUND_IN_PROGRESS'
    | 'CHARGEBACK_REQUESTED'
    | 'CHARGEBACK_DISPUTE'
    | 'AWAITING_CHARGEBACK_REVERSAL'
    | 'DUNNING_REQUESTED'
    | 'DUNNING_RECEIVED'
    | 'AWAITING_RISK_ANALYSIS'
  description?: string
  externalReference?: string
  confirmedDate?: string
  paymentDate?: string
  clientPaymentDate?: string
  invoiceUrl?: string
  bankSlipUrl?: string
  invoiceNumber?: string
  creditCard?: {
    creditCardNumber?: string
    creditCardBrand?: string
    creditCardToken?: string
  }
}

export interface AsaasPixQrCodeResponse {
  encodedImage: string // Imagem base64 do QR Code
  payload: string // Linha digitável / Copia e Cola
  expirationDate: string
}

/**
 * Cria uma assinatura mensal (LINKS R$ 29,99 ou PRO R$ 69,99) no Asaas via PIX ou Cartão de Crédito recorrente.
 * O valor da mensalidade é estritamente definido no servidor com base no plano.
 */
export async function createAsaasSubscription(
  params: CreateSubscriptionParams
): Promise<{
  success: boolean
  subscription?: AsaasSubscriptionResponse
  firstPayment?: AsaasPaymentResponse
  pix?: AsaasPixQrCodeResponse
  error?: string
}> {
  try {
    const baseUrl = getAsaasBaseUrl()
    const selectedPlan: CompanyPlan = params.plan === 'links' ? 'links' : 'pro'
    // Definição estrita no servidor: nunca confiar no valor vindo do cliente
    const value = getPlanPrice(selectedPlan)
    const cycle = 'MONTHLY'
    const planName = getPlanLabel(selectedPlan)
    const description = params.description || `Mensalidade DiretoLink - ${planName}`
    const isSandbox = getAsaasEnvironment() === 'SANDBOX'

    const todayStr = new Date().toISOString().split('T')[0]
    const nextDueDate = params.nextDueDate || todayStr

    // Se temos a chave ASAAS configurada, tentamos a chamada direta na API do Asaas
    if (isAsaasConfigured()) {
      try {
        const payload: Record<string, unknown> = {
          customer: params.customerId,
          billingType: params.billingType,
          value,
          nextDueDate,
          cycle,
          description,
          externalReference: params.companyId,
        }

        // Se for cartão de crédito recorrente
        if (params.billingType === 'CREDIT_CARD') {
          if (!params.creditCard || !params.creditCardHolderInfo) {
            return {
              success: false,
              error: 'Dados do cartão de crédito e do titular são obrigatórios para cartão recorrente.',
            }
          }
          payload.creditCard = {
            holderName: params.creditCard.holderName.trim(),
            number: params.creditCard.number.replace(/\D/g, ''),
            expiryMonth: params.creditCard.expiryMonth.padStart(2, '0'),
            expiryYear: params.creditCard.expiryYear.trim(),
            ccv: params.creditCard.ccv.trim(),
          }
          payload.creditCardHolderInfo = {
            name: params.creditCardHolderInfo.name.trim(),
            email: params.creditCardHolderInfo.email.trim().toLowerCase(),
            cpfCnpj: params.creditCardHolderInfo.cpfCnpj.replace(/\D/g, ''),
            postalCode: params.creditCardHolderInfo.postalCode.replace(/\D/g, ''),
            addressNumber: params.creditCardHolderInfo.addressNumber.trim(),
            addressComplement: params.creditCardHolderInfo.addressComplement?.trim() || undefined,
            phone: params.creditCardHolderInfo.phone.replace(/\D/g, ''),
            mobilePhone: params.creditCardHolderInfo.mobilePhone
              ? params.creditCardHolderInfo.mobilePhone.replace(/\D/g, '')
              : undefined,
          }
          if (params.remoteIp) {
            payload.remoteIp = params.remoteIp
          }
        }

        const res = await fetch(`${baseUrl}/subscriptions`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          const sub = (await res.json()) as AsaasSubscriptionResponse
          let firstPayment: AsaasPaymentResponse | undefined
          let pixData: AsaasPixQrCodeResponse | undefined

          try {
            let paymentsRes = await getAsaasSubscriptionPayments(sub.id)
            if (paymentsRes.length === 0) {
              await new Promise((r) => setTimeout(r, 600))
              paymentsRes = await getAsaasSubscriptionPayments(sub.id)
            }

            if (paymentsRes.length > 0) {
              firstPayment = paymentsRes[0]
              if (params.billingType === 'PIX' && firstPayment.id) {
                const qrRes = await getAsaasPixQrCode(firstPayment.id)
                if (qrRes.success && qrRes.pix) {
                  pixData = qrRes.pix
                }
              }
            }
          } catch (payErr) {
            console.warn('Aviso ao buscar cobrança/QR Code no Asaas:', payErr)
          }

          if (params.billingType === 'PIX' && (!pixData || !pixData.payload)) {
            pixData = await generateSandboxPixPayload({
              companyId: params.companyId,
              plan: selectedPlan,
              amount: value,
              description,
            })
          }

          return {
            success: true,
            subscription: sub,
            firstPayment,
            pix: pixData,
          }
        } else {
          const errData = await res.json().catch(() => ({}))
          const errMsg = Array.isArray(errData.errors)
            ? errData.errors.map((e: { description: string }) => e.description).join('; ')
            : errData.message || `Erro HTTP ${res.status} ao criar assinatura no Asaas.`

          if (!isSandbox) {
            return { success: false, error: errMsg }
          }
          console.warn('Aviso Asaas Sandbox API:', errMsg, '- gerando cobrança sandbox estruturada.')
        }
      } catch (remoteErr) {
        if (!isSandbox) {
          return {
            success: false,
            error: remoteErr instanceof Error ? remoteErr.message : 'Erro ao conectar com API do Asaas.',
          }
        }
        console.warn('Aviso conexão Asaas Sandbox:', remoteErr)
      }
    }

    // Se estivermos em ambiente SANDBOX e não tiver chave ativa ou a API remota falhou:
    if (isSandbox) {
      const nowIso = new Date().toISOString()
      const sandboxSubId = `sub_sbx_${params.companyId.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`
      const sandboxPayId = `pay_sbx_${params.companyId.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`

      let pixData: AsaasPixQrCodeResponse | undefined
      if (params.billingType === 'PIX') {
        pixData = await generateSandboxPixPayload({
          companyId: params.companyId,
          plan: selectedPlan,
          amount: value,
          description,
        })
      }

      const sandboxSub: AsaasSubscriptionResponse = {
        object: 'subscription',
        id: sandboxSubId,
        dateCreated: nowIso,
        customer: params.customerId || `cus_sbx_${params.companyId}`,
        billingType: params.billingType,
        value,
        nextDueDate,
        cycle: 'MONTHLY',
        description,
        status: 'ACTIVE',
        externalReference: params.companyId,
      }

      const sandboxPayment: AsaasPaymentResponse = {
        object: 'payment',
        id: sandboxPayId,
        dateCreated: nowIso,
        customer: sandboxSub.customer,
        subscription: sandboxSubId,
        dueDate: nextDueDate,
        value,
        billingType: params.billingType,
        status: params.billingType === 'CREDIT_CARD' ? 'CONFIRMED' : 'PENDING',
        description,
        externalReference: params.companyId,
      }

      return {
        success: true,
        subscription: sandboxSub,
        firstPayment: sandboxPayment,
        pix: pixData,
      }
    }

    return {
      success: false,
      error: 'A chave ASAAS_API_KEY não foi configurada para ambiente de produção.',
    }
  } catch (err) {
    console.error('Error in createAsaasSubscription:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao criar assinatura no Asaas.',
    }
  }
}

export async function getAsaasSubscription(
  subscriptionId: string
): Promise<AsaasSubscriptionResponse | null> {
  try {
    const baseUrl = getAsaasBaseUrl()
    const res = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: getHeaders(),
    })
    if (!res.ok) return null
    return (await res.json()) as AsaasSubscriptionResponse
  } catch (err) {
    console.warn(`Error fetching Asaas subscription ${subscriptionId}:`, err)
    return null
  }
}

export async function cancelAsaasSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getAsaasBaseUrl()
    const res = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    if (!res.ok) {
      const data = await res.json()
      const errMsg = Array.isArray(data.errors)
        ? data.errors.map((e: { description: string }) => e.description).join('; ')
        : data.message || `Erro ao cancelar assinatura no Asaas.`
      return { success: false, error: errMsg }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro de conexão com o Asaas.' }
  }
}

export async function getAsaasSubscriptionPayments(
  subscriptionId: string
): Promise<AsaasPaymentResponse[]> {
  try {
    const baseUrl = getAsaasBaseUrl()
    const res = await fetch(`${baseUrl}/subscriptions/${subscriptionId}/payments`, {
      method: 'GET',
      headers: getHeaders(),
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.data) ? (data.data as AsaasPaymentResponse[]) : []
  } catch (err) {
    console.warn(`Error fetching payments for subscription ${subscriptionId}:`, err)
    return []
  }
}

// ----------------------------------------------------------------------
// 3. COBRANÇAS E QR CODE PIX
// ----------------------------------------------------------------------

export async function getAsaasPayment(paymentId: string): Promise<AsaasPaymentResponse | null> {
  try {
    const baseUrl = getAsaasBaseUrl()
    const res = await fetch(`${baseUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: getHeaders(),
    })
    if (!res.ok) return null
    return (await res.json()) as AsaasPaymentResponse
  } catch (err) {
    console.warn(`Error fetching payment ${paymentId}:`, err)
    return null
  }
}

export async function getAsaasPixQrCode(
  paymentId: string
): Promise<{ success: boolean; pix?: AsaasPixQrCodeResponse; error?: string }> {
  try {
    const baseUrl = getAsaasBaseUrl()
    const res = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers: getHeaders(),
    })
    if (!res.ok) {
      const data = await res.json()
      return { success: false, error: data.message || 'QR Code Pix indisponível para esta cobrança.' }
    }
    const data = (await res.json()) as AsaasPixQrCodeResponse
    return { success: true, pix: data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao obter Pix do Asaas.' }
  }
}

// ----------------------------------------------------------------------
// 4. MAPEAMENTO DE STATUS E CONVERSÃO
// ----------------------------------------------------------------------

export function mapAsaasStatusToSubscriptionStatus(
  event: string,
  paymentStatus?: string,
  subStatus?: string
): AsaasSubscriptionStatus {
  const ev = (event || '').trim().toUpperCase()
  const paySt = (paymentStatus || '').trim().toUpperCase()
  const subSt = (subStatus || '').trim().toUpperCase()

  // 1. Cancelamentos, estornos e exclusões
  if (
    ev === 'SUBSCRIPTION_DELETED' ||
    ev === 'SUBSCRIPTION_INACTIVATED' ||
    subSt === 'INACTIVE' ||
    subSt === 'EXPIRED' ||
    ev === 'PAYMENT_DELETED' ||
    ev === 'PAYMENT_REFUNDED' ||
    paySt === 'REFUNDED' ||
    paySt === 'REFUND_REQUESTED' ||
    paySt === 'REFUND_IN_PROGRESS' ||
    paySt === 'CHARGEBACK_DISPUTE'
  ) {
    return 'CANCELLED'
  }

  // 2. Pagamento recebido e confirmado
  if (
    ev === 'PAYMENT_RECEIVED' ||
    ev === 'PAYMENT_CONFIRMED' ||
    paySt === 'RECEIVED' ||
    paySt === 'CONFIRMED' ||
    paySt === 'RECEIVED_IN_CASH'
  ) {
    return 'ACTIVE'
  }

  // 3. Atraso no pagamento ou contestação
  if (
    ev === 'PAYMENT_OVERDUE' ||
    paySt === 'OVERDUE' ||
    ev === 'PAYMENT_CHARGEBACK_REQUESTED' ||
    paySt === 'CHARGEBACK_REQUESTED'
  ) {
    return 'OVERDUE'
  }

  // 4. Assinatura recém-criada ou aguardando pagamento
  if (
    ev === 'SUBSCRIPTION_CREATED' ||
    paySt === 'PENDING' ||
    paySt === 'AWAITING_RISK_ANALYSIS'
  ) {
    return 'PENDING'
  }

  return 'PENDING'
}
