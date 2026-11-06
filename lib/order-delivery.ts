import { CartItem } from '@/components/public/menu-item-modal'
import { formatCep, formatPhone, getWhatsappLink, normalizeCep, normalizePhone } from './utils'
import { Company, CompanyPaymentConfig } from '@/types/platform'

export type DeliveryType = 'pickup' | 'delivery' | 'dine_in'

export interface OrderDeliveryInfo {
  deliveryType: DeliveryType
  customerName: string
  customerPhone: string
  tableNumber?: string
  // Endereço e CEP
  postalCode?: string // CEP (00000-000)
  street?: string // Logradouro / Rua
  address: string // Compatibilidade (Rua)
  number: string
  neighborhood: string
  city?: string
  state?: string // UF (ex: GO, SP)
  block?: string // Quadra (Qd.)
  lot?: string // Lote (Lt.)
  complement?: string
  reference?: string
  referencePoint?: string
  formattedAddress?: string
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

/**
 * Gera o endereço estruturado formatado com quebras de linha para WhatsApp, Central de Pedidos e Motoboy
 */
export function formatStructuredDeliveryAddress(info: {
  postalCode?: string
  street?: string
  address?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  block?: string
  lot?: string
  complement?: string
  reference?: string
  referencePoint?: string
}): string {
  const lines: string[] = []
  const streetName = (info.street || info.address || '').trim()
  const num = (info.number || '').trim()

  if (streetName && num) {
    lines.push(`${streetName}, nº ${num}`)
  } else if (streetName) {
    lines.push(streetName)
  } else if (num) {
    lines.push(`nº ${num}`)
  }

  const qdLote: string[] = []
  if (info.block && info.block.trim()) {
    qdLote.push(`Qd. ${info.block.trim()}`)
  }
  if (info.lot && info.lot.trim()) {
    qdLote.push(`Lt. ${info.lot.trim()}`)
  }
  if (qdLote.length > 0) {
    lines.push(qdLote.join(', '))
  }

  if (info.complement && info.complement.trim()) {
    lines.push(`Compl: ${info.complement.trim()}`)
  }

  const neigh = (info.neighborhood || '').trim()
  const city = (info.city || '').trim()
  const uf = (info.state || '').trim().toUpperCase()

  if (neigh && city && uf) {
    lines.push(`${neigh} — ${city}/${uf}`)
  } else if (neigh && (city || uf)) {
    lines.push(`${neigh} — ${[city, uf].filter(Boolean).join('/')}`)
  } else if (neigh) {
    lines.push(neigh)
  } else if (city || uf) {
    lines.push([city, uf].filter(Boolean).join('/'))
  }

  if (info.postalCode && info.postalCode.trim()) {
    lines.push(`CEP ${formatCep(info.postalCode)}`)
  }

  const ref = (info.reference || info.referencePoint || '').trim()
  if (ref) {
    lines.push(`Referência: ${ref}`)
  }

  return lines.join('\n')
}

/**
 * Gera o endereço completo em linha única para pesquisas e mapas
 */
export function formatSingleLineAddress(info: {
  postalCode?: string
  street?: string
  address?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  block?: string
  lot?: string
  complement?: string
  reference?: string
  referencePoint?: string
}): string {
  const chunks: string[] = []
  const streetName = (info.street || info.address || '').trim()
  const num = (info.number || '').trim()
  if (streetName && num) chunks.push(`${streetName}, nº ${num}`)
  else if (streetName) chunks.push(streetName)
  else if (num) chunks.push(`nº ${num}`)

  const qdLote: string[] = []
  if (info.block && info.block.trim()) qdLote.push(`Qd. ${info.block.trim()}`)
  if (info.lot && info.lot.trim()) qdLote.push(`Lt. ${info.lot.trim()}`)
  if (qdLote.length > 0) chunks.push(qdLote.join(', '))

  if (info.complement && info.complement.trim()) chunks.push(`(${info.complement.trim()})`)

  const neigh = (info.neighborhood || '').trim()
  const city = (info.city || '').trim()
  const uf = (info.state || '').trim().toUpperCase()
  if (neigh && (city || uf)) {
    chunks.push(`${neigh} — ${[city, uf].filter(Boolean).join('/')}`)
  } else if (neigh) {
    chunks.push(neigh)
  } else if (city || uf) {
    chunks.push([city, uf].filter(Boolean).join('/'))
  }

  if (info.postalCode && info.postalCode.trim()) {
    chunks.push(`CEP ${formatCep(info.postalCode)}`)
  }

  const ref = (info.reference || info.referencePoint || '').trim()
  if (ref) {
    chunks.push(`[Ref: ${ref}]`)
  }

  return chunks.join(', ')
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
      postalCode: parsed.postalCode || '',
      street: parsed.street || parsed.address || '',
      address: parsed.address || parsed.street || '',
      number: parsed.number || '',
      neighborhood: parsed.neighborhood || '',
      city: parsed.city || '',
      state: parsed.state || '',
      block: parsed.block || '',
      lot: parsed.lot || '',
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
      postalCode: info.postalCode || '',
      street: info.street || info.address || '',
      address: info.address || info.street || '',
      number: info.number,
      neighborhood: info.neighborhood,
      city: info.city || '',
      state: info.state || '',
      block: info.block || '',
      lot: info.lot || '',
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
    const formatted = formatStructuredDeliveryAddress(deliveryInfo)
    if (formatted) {
      formatted.split('\n').forEach((line) => {
        msg += `• ${line}\n`
      })
    } else {
      msg += `• Endereço: ${deliveryInfo.address.trim()}, Nº ${deliveryInfo.number.trim() || 'S/N'}\n`
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
    const formatted = formatStructuredDeliveryAddress(deliveryInfo)
    if (formatted) {
      formatted.split('\n').forEach((line) => {
        msg += `• ${line}\n`
      })
    } else {
      msg += `• Endereço: ${deliveryInfo.address.trim()}, Nº ${deliveryInfo.number.trim() || 'S/N'}\n`
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
  const formattedAddr =
    order.formattedAddress ||
    formatStructuredDeliveryAddress({
      postalCode: order.postalCode,
      street: order.street || order.address,
      address: order.address || order.deliveryAddress,
      number: order.number || order.addressNumber,
      neighborhood: order.neighborhood,
      city: order.city,
      state: order.state,
      block: order.block,
      lot: order.lot,
      complement: order.complement,
      reference: order.reference || order.referencePoint,
    })

  if (formattedAddr) {
    formattedAddr.split('\n').forEach((l: string) => {
      msg += `• ${l}\n`
    })
  } else if (order.address || order.deliveryAddress) {
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
  const mapsQuery = order.formattedAddress || order.deliveryAddress || order.address || ''
  if (order.locationUrl && order.locationUrl.trim()) {
    msg += `• 🗺️ Google Maps: ${order.locationUrl.trim()}\n`
  } else if (mapsQuery) {
    const queryAddress = encodeURIComponent(mapsQuery.replace(/\n/g, ', '))
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

  const originUrl = typeof window !== 'undefined' ? window.location.origin : ''
  if (originUrl) {
    msg += `\n📲 *LINK DO ENTREGADOR (ROTA & CONFIRMAÇÃO):*\n${originUrl}/entrega/${order.id}\n`
    msg += `🔑 *CONFIRMAÇÃO:* Ao entregar, solicite o código de 4 dígitos ao cliente e confirme no link acima!\n`
  }

  msg += `\nPor favor, confirme se pode retirar e realizar esta entrega!`

  return msg
}
