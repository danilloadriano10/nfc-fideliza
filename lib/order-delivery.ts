import { CartItem } from '@/components/public/menu-item-modal'
import { formatPhone, getWhatsappLink, normalizePhone } from './utils'

export type DeliveryType = 'pickup' | 'delivery' | 'dine_in'

export interface OrderDeliveryInfo {
  deliveryType: DeliveryType
  customerName: string
  customerPhone: string
  tableNumber?: string
  address: string
  number: string
  neighborhood: string
  complement?: string
  reference?: string
  referencePoint?: string
  city?: string
  notes?: string
  locationCoordinates?: {
    lat: number
    lng: number
  } | null
  locationUrl?: string | null
}

const STORAGE_DELIVERY_KEY = 'nfc_customer_last_delivery_v2'

export function formatMoneyBRL(val?: number | null): string {
  if (val == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val)
}

/**
 * Carrega os últimos dados de entrega/identificação salvos localmente
 */
export function loadSavedDeliveryInfo(companyId?: string): Partial<OrderDeliveryInfo> {
  if (typeof window === 'undefined') return {}

  try {
    // Tenta primeiro dados específicos da empresa, depois genéricos
    const key = companyId ? `${STORAGE_DELIVERY_KEY}_${companyId}` : STORAGE_DELIVERY_KEY
    const raw = localStorage.getItem(key) || localStorage.getItem(STORAGE_DELIVERY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return {
      deliveryType: parsed.deliveryType || 'delivery',
      customerName: parsed.customerName || '',
      customerPhone: parsed.customerPhone || '',
      tableNumber: parsed.tableNumber || '',
      address: parsed.address || '',
      number: parsed.number || '',
      neighborhood: parsed.neighborhood || '',
      complement: parsed.complement || '',
      reference: parsed.reference || '',
    }
  } catch {
    return {}
  }
}

/**
 * Salva os dados de entrega/identificação para conveniência em futuros pedidos
 */
export function saveDeliveryInfo(info: OrderDeliveryInfo, companyId?: string): void {
  if (typeof window === 'undefined') return

  try {
    const dataToSave = {
      deliveryType: info.deliveryType,
      customerName: info.customerName,
      customerPhone: info.customerPhone,
      tableNumber: info.tableNumber || '',
      address: info.address,
      number: info.number,
      neighborhood: info.neighborhood,
      complement: info.complement || '',
      reference: info.reference || '',
    }
    const json = JSON.stringify(dataToSave)
    localStorage.setItem(STORAGE_DELIVERY_KEY, json)
    if (companyId) {
      localStorage.setItem(`${STORAGE_DELIVERY_KEY}_${companyId}`, json)
    }
  } catch {
    // Ignore storage errors in private browsing
  }
}

/**
 * Constrói a mensagem final do WhatsApp para pedidos do CARDÁPIO
 */
export function buildMenuOrderWhatsAppMessage(options: {
  companyName: string
  cart: CartItem[]
  totalOrder: number
  deliveryInfo: OrderDeliveryInfo
}): string {
  const { companyName, cart, totalOrder, deliveryInfo } = options

  let msg = `👋 Olá! Gostaria de fazer um pedido pelo cardápio da *${companyName}*:\n\n`
  msg += `📋 *ITENS DO PEDIDO:*\n\n`

  cart.forEach((item) => {
    msg += `• *${item.quantity}x ${item.menuItem.name}* — ${formatMoneyBRL(item.totalPrice)}\n`

    // Tamanho
    if (item.options.size) {
      msg += `   - Tamanho: ${item.options.size.name}${
        item.options.size.price > 0 ? ` (${formatMoneyBRL(item.options.size.price)})` : ''
      }\n`
    }

    // Sabores
    if (item.options.flavors && item.options.flavors.length > 0) {
      msg += `   - Sabores: ${item.options.flavors.join(', ')}\n`
    }

    // Monte seu pedido / Etapas customizadas
    if (item.options.customSteps && item.options.customSteps.length > 0) {
      item.options.customSteps.forEach((st) => {
        if (st.selected && st.selected.length > 0) {
          const optsText = st.selected
            .map((o) => `${o.name}${o.price > 0 ? ` (+${formatMoneyBRL(o.price)})` : ''}`)
            .join(', ')
          msg += `   - ${st.stepTitle}: ${optsText}\n`
        }
      })
    }

    // Adicionais / Extras
    if (item.options.extras && item.options.extras.length > 0) {
      const extText = item.options.extras
        .map((e) => `${e.name} (+${formatMoneyBRL(e.price)})`)
        .join(', ')
      msg += `   - Adicionais: ${extText}\n`
    }

    // Retiradas
    if (item.options.removals && item.options.removals.length > 0) {
      msg += `   - Retirar: ${item.options.removals.join(', ')}\n`
    }

    // Observações
    if (item.options.notes) {
      msg += `   - Obs: "${item.options.notes}"\n`
    }

    msg += `\n`
  })

  msg += `--------------------------------\n`
  msg += `💰 *VALOR TOTAL: ${formatMoneyBRL(totalOrder)}*\n`
  msg += `--------------------------------\n\n`

  if (deliveryInfo.deliveryType === 'delivery') {
    msg += `🚚 *FORMA DE RECEBIMENTO:* Entrega\n\n`
  } else if (deliveryInfo.deliveryType === 'dine_in') {
    msg += `🍽️ *FORMA DE RECEBIMENTO:* Consumir no Local\n`
    msg += `🪑 *MESA:* ${deliveryInfo.tableNumber ? deliveryInfo.tableNumber : 'Não informada'}\n\n`
  } else {
    msg += `🏬 *FORMA DE RECEBIMENTO:* Retirada no local\n\n`
  }

  msg += `👤 *DADOS DO CLIENTE:*\n`
  msg += `• Nome: ${deliveryInfo.customerName.trim() || 'Não informado'}\n`
  msg += `• Telefone: ${formatPhone(deliveryInfo.customerPhone) || deliveryInfo.customerPhone || 'Não informado'}\n`

  if (deliveryInfo.deliveryType === 'delivery') {
    msg += `\n📍 *ENDEREÇO DE ENTREGA:*\n`
    msg += `• Endereço: ${deliveryInfo.address.trim()}, Nº ${deliveryInfo.number.trim() || 'S/N'}\n`
    msg += `• Bairro: ${deliveryInfo.neighborhood.trim()}\n`
    if (deliveryInfo.complement && deliveryInfo.complement.trim()) {
      msg += `• Complemento: ${deliveryInfo.complement.trim()}\n`
    }
    if (deliveryInfo.reference && deliveryInfo.reference.trim()) {
      msg += `• Ponto de Referência: ${deliveryInfo.reference.trim()}\n`
    }
    if (deliveryInfo.locationUrl && deliveryInfo.locationUrl.trim()) {
      msg += `• Link da Localização: ${deliveryInfo.locationUrl.trim()}\n`
    }
  }

  msg += `\nPor favor, confirme o recebimento do pedido e o tempo estimado! Obrigado.`

  return msg
}

/**
 * Constrói a mensagem final do WhatsApp para pedidos do CATÁLOGO DE PRODUTOS
 */
export function buildProductOrderWhatsAppMessage(options: {
  companyName: string
  productName: string
  selectedVariation?: string | null
  quantity: number
  unitPrice?: number | null
  totalPrice?: number | null
  deliveryInfo: OrderDeliveryInfo
}): string {
  const {
    companyName,
    productName,
    selectedVariation,
    quantity,
    unitPrice,
    totalPrice,
    deliveryInfo,
  } = options

  let msg = `👋 Olá! Gostaria de fazer um pedido de produto da *${companyName}*:\n\n`
  msg += `🛍️ *ITEM DO PEDIDO:*\n`
  msg += `• Produto: *${productName}*\n`
  if (selectedVariation && selectedVariation.trim()) {
    msg += `• Variação / Tamanho: ${selectedVariation.trim()}\n`
  }
  msg += `• Quantidade: ${quantity}\n`
  if (unitPrice != null && unitPrice > 0) {
    msg += `• Valor Unitário: ${formatMoneyBRL(unitPrice)}\n`
  }

  msg += `\n--------------------------------\n`
  if (totalPrice != null && totalPrice > 0) {
    msg += `💰 *VALOR TOTAL: ${formatMoneyBRL(totalPrice)}*\n`
  } else {
    msg += `💰 *VALOR TOTAL:* A combinar / Preço sob consulta\n`
  }
  msg += `--------------------------------\n\n`

  if (deliveryInfo.deliveryType === 'delivery') {
    msg += `🚚 *FORMA DE RECEBIMENTO:* Entrega\n\n`
  } else {
    msg += `🏬 *FORMA DE RECEBIMENTO:* Retirada no local\n\n`
  }

  msg += `👤 *DADOS DO CLIENTE:*\n`
  msg += `• Nome: ${deliveryInfo.customerName.trim() || 'Não informado'}\n`
  msg += `• Telefone: ${formatPhone(deliveryInfo.customerPhone) || deliveryInfo.customerPhone || 'Não informado'}\n`

  if (deliveryInfo.deliveryType === 'delivery') {
    msg += `\n📍 *ENDEREÇO DE ENTREGA:*\n`
    msg += `• Endereço: ${deliveryInfo.address.trim()}, Nº ${deliveryInfo.number.trim() || 'S/N'}\n`
    msg += `• Bairro: ${deliveryInfo.neighborhood.trim()}\n`
    if (deliveryInfo.complement && deliveryInfo.complement.trim()) {
      msg += `• Complemento: ${deliveryInfo.complement.trim()}\n`
    }
    if (deliveryInfo.reference && deliveryInfo.reference.trim()) {
      msg += `• Ponto de Referência: ${deliveryInfo.reference.trim()}\n`
    }
    if (deliveryInfo.locationUrl && deliveryInfo.locationUrl.trim()) {
      msg += `• Link da Localização: ${deliveryInfo.locationUrl.trim()}\n`
    }
  }

  msg += `\nPor favor, confirme a disponibilidade e o pedido! Obrigado.`

  return msg
}

/**
 * Dispara a abertura do WhatsApp com a mensagem construída
 */
export function openOrderInWhatsApp(companyWhatsapp: string | undefined | null, message: string): void {
  const url = getWhatsappLink(companyWhatsapp || '', message)
  window.open(url, '_blank', 'noopener,noreferrer')
}
