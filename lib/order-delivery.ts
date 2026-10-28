import { CartItem } from '@/components/public/menu-item-modal'
import { formatPhone, getWhatsappLink, normalizePhone } from './utils'
import { Company, CompanyPaymentConfig } from '@/types/platform'

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
  // Formas de Pagamento
  paymentMethod?: 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'vale_refeicao' | string
  needsChange?: boolean
  paymentChangeFor?: number | null
  receiptUrl?: string
  receiptName?: string
  receiptType?: string
}

export function getDefaultCompanyPaymentConfig(company?: Partial<Company>): CompanyPaymentConfig {
  const existing = company?.paymentConfig
  return {
    acceptPix: existing?.acceptPix ?? true,
    acceptCash: existing?.acceptCash ?? true,
    acceptDebitCard: existing?.acceptDebitCard ?? true,
    acceptCreditCard: existing?.acceptCreditCard ?? true,
    acceptMealVoucher: existing?.acceptMealVoucher ?? false,
    pixReceiverName: existing?.pixReceiverName || company?.name || 'DiretoLink Pagamentos',
    pixKey: existing?.pixKey || company?.whatsapp || '',
    pixKeyType: existing?.pixKeyType || 'phone',
    pixShowUpfront: existing?.pixShowUpfront ?? true,
  }
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

  if (deliveryInfo.paymentMethod) {
    msg += `\n💳 *FORMA DE PAGAMENTO:*\n`
    if (deliveryInfo.paymentMethod === 'pix') {
      msg += `• Pix`
      if (deliveryInfo.receiptUrl) {
        msg += ` (Comprovante anexado no pedido)\n`
      } else {
        msg += ` (Pendente de confirmação)\n`
      }
    } else if (deliveryInfo.paymentMethod === 'dinheiro') {
      msg += `• Dinheiro (${deliveryInfo.deliveryType === 'delivery' ? 'na entrega' : deliveryInfo.deliveryType === 'pickup' ? 'na retirada' : 'no local'})\n`
      if (deliveryInfo.needsChange && deliveryInfo.paymentChangeFor) {
        msg += `• Troco para: ${formatMoneyBRL(deliveryInfo.paymentChangeFor)}\n`
      } else {
        msg += `• Troco: Não precisa de troco\n`
      }
    } else if (deliveryInfo.paymentMethod === 'cartao_credito') {
      msg += `• Cartão de Crédito (${deliveryInfo.deliveryType === 'delivery' ? 'na entrega' : deliveryInfo.deliveryType === 'pickup' ? 'na retirada' : 'no local'})\n`
    } else if (deliveryInfo.paymentMethod === 'cartao_debito') {
      msg += `• Cartão de Débito (${deliveryInfo.deliveryType === 'delivery' ? 'na entrega' : deliveryInfo.deliveryType === 'pickup' ? 'na retirada' : 'no local'})\n`
    } else if (deliveryInfo.paymentMethod === 'vale_refeicao') {
      msg += `• Vale-Refeição (${deliveryInfo.deliveryType === 'delivery' ? 'na entrega' : deliveryInfo.deliveryType === 'pickup' ? 'na retirada' : 'no local'})\n`
    } else {
      msg += `• ${deliveryInfo.paymentMethod}\n`
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
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

/**
 * Constrói a mensagem pronta para envio ao MOTOBOY / ENTREGADOR via WhatsApp
 */
export function buildCourierDeliveryWhatsAppMessage(options: {
  companyName: string
  order: any // TableOrder
}): string {
  const { companyName, order } = options
  const orderNum = (order.id || '').slice(-6).toUpperCase()

  let msg = `🛵 *NOVA ENTREGA DISPONÍVEL*\n`
  msg += `🏢 *${companyName}*\n`
  msg += `📦 *Pedido #${orderNum}*\n\n`

  msg += `👤 *DADOS DO CLIENTE:*\n`
  msg += `• Nome: ${order.customerName?.trim() || 'Não informado'}\n`
  if (order.customerPhone) {
    msg += `• Telefone: ${formatPhone(order.customerPhone) || order.customerPhone}\n`
  }

  msg += `\n📍 *ENDEREÇO DE ENTREGA:*\n`
  if (order.address || order.deliveryAddress) {
    const rawAddress = order.address || order.deliveryAddress
    msg += `• ${rawAddress}\n`
    if (order.addressNumber) {
      msg += `• Nº: ${order.addressNumber}\n`
    }
    if (order.neighborhood) {
      msg += `• Bairro: ${order.neighborhood}\n`
    }
    if (order.complement) {
      msg += `• Complemento: ${order.complement}\n`
    }
    if (order.referencePoint) {
      msg += `• Referência: ${order.referencePoint}\n`
    }
  } else {
    msg += `• Endereço a confirmar com o estabelecimento\n`
  }

  // Google Maps link
  if (order.locationUrl && order.locationUrl.trim()) {
    msg += `• 🗺️ Google Maps: ${order.locationUrl.trim()}\n`
  } else if (order.address || order.deliveryAddress) {
    const queryAddress = encodeURIComponent(order.address || order.deliveryAddress)
    msg += `• 🗺️ Google Maps: https://www.google.com/maps/search/?api=1&query=${queryAddress}\n`
  }

  msg += `\n💰 *VALOR DO PEDIDO:* ${formatMoneyBRL(order.totalAmount)}\n\n`
  
  if (order.paymentMethod === 'pix') {
    if (order.paymentStatus === 'paid') {
      msg += `💳 *FORMA DE PAGAMENTO:*\n`
      msg += `✅ *PIX PAGO*\n`
      msg += `⚠️ *ATENÇÃO MOTOBOY: NÃO COBRAR DO CLIENTE (Já pago via Pix)*\n`
    } else {
      const stLabel =
        order.paymentStatus === 'awaiting_confirmation'
          ? 'Comprovante em análise na loja'
          : order.paymentStatus === 'not_found'
          ? 'Não localizado pela loja'
          : 'Pendente de confirmação'
      msg += `💳 *FORMA DE PAGAMENTO:*\n`
      msg += `💠 *PIX (${stLabel})*\n`
      msg += `⚠️ *Atenção: Conferir com a loja antes de liberar a entrega!*\n`
    }
  } else if (order.paymentMethod === 'dinheiro') {
    msg += `💳 *FORMA DE PAGAMENTO:*\n`
    msg += `💵 *DINHEIRO NA ENTREGA*\n`
    msg += `• Total a cobrar: ${formatMoneyBRL(order.totalAmount)}\n`
    if (order.paymentChangeFor && Number(order.paymentChangeFor) > 0) {
      msg += `• Levar troco para: ${formatMoneyBRL(order.paymentChangeFor)}\n`
    } else {
      msg += `• Troco: Não precisa de troco (valor exato)\n`
    }
  } else if (order.paymentMethod === 'cartao_credito') {
    msg += `💳 *FORMA DE PAGAMENTO:*\n`
    msg += `💳 *CARTÃO DE CRÉDITO NA ENTREGA*\n`
    msg += `• Total a cobrar na maquininha: ${formatMoneyBRL(order.totalAmount)}\n`
  } else if (order.paymentMethod === 'cartao_debito') {
    msg += `💳 *FORMA DE PAGAMENTO:*\n`
    msg += `💳 *CARTÃO DE DÉBITO NA ENTREGA*\n`
    msg += `• Total a cobrar na maquininha: ${formatMoneyBRL(order.totalAmount)}\n`
  } else if (order.paymentMethod === 'vale_refeicao') {
    msg += `💳 *FORMA DE PAGAMENTO:*\n`
    msg += `💳 *VALE-REFEIÇÃO NA ENTREGA*\n`
    msg += `• Total a cobrar na maquininha: ${formatMoneyBRL(order.totalAmount)}\n`
  } else if (order.paymentMethod) {
    msg += `💳 *FORMA DE PAGAMENTO:* ${order.paymentMethod}\n`
  }

  if (order.notes && order.notes.trim()) {
    msg += `\n📝 *OBSERVAÇÕES DA ENTREGA:*\n"${order.notes.trim()}"\n`
  }

  msg += `\nPor favor, confirme se pode retirar e realizar esta entrega!`

  return msg
}
