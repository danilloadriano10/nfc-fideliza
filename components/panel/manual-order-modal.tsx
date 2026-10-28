'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  X,
  Plus,
  Trash2,
  Search,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  Tag,
  FileText,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  Company,
  TableOrder,
  TableOrderItem,
  TableOrderHistoryEvent,
  MenuItem,
  OrderOrigin,
  TableOrderStatus,
  OrderPaymentStatus,
} from '@/types/platform'
import { getCompanyMenuItems, saveCompanyTableOrderOnServerApi } from '@/lib/storage'
import { formatMoneyBRL } from '@/lib/order-delivery'

interface ManualOrderModalProps {
  company: Company
  isOpen: boolean
  onClose: () => void
  onOrderCreated: (newOrder: TableOrder) => void
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  company,
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const [orderType, setOrderType] = useState<OrderOrigin>('mesa')
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Campos de entrega
  const [address, setAddress] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [complement, setComplement] = useState('')
  const [referencePoint, setReferencePoint] = useState('')
  const [deliveryFee, setDeliveryFee] = useState<string>('0')

  // Desconto e observação
  const [discount, setDiscount] = useState<string>('0')
  const [generalNotes, setGeneralNotes] = useState('')

  // Itens do pedido
  const [items, setItems] = useState<TableOrderItem[]>([])

  // Busca e inclusão de itens
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0)
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [itemQuantity, setItemQuantity] = useState<number>(1)
  const [itemNotes, setItemNotes] = useState('')

  // Forma de pagamento
  const [paymentMethod, setPaymentMethod] = useState<string>('dinheiro')
  const [pixPaidUpfront, setPixPaidUpfront] = useState<boolean>(false)
  const [paymentChangeFor, setPaymentChangeFor] = useState<string>('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Carregar produtos do cardápio ao abrir
  useEffect(() => {
    if (isOpen) {
      const prods = getCompanyMenuItems(company.id) || []
      setMenuItems(prods.filter((p) => p.isActive !== false))
      setErrorMsg(null)
      // Ajustar forma de pagamento padrão conforme configuração da empresa
      const cfg = company.paymentConfig
      if (cfg) {
        if (cfg.acceptCash) setPaymentMethod('dinheiro')
        else if (cfg.acceptPix) setPaymentMethod('pix')
        else if (cfg.acceptCreditCard) setPaymentMethod('cartao_credito')
        else if (cfg.acceptDebitCard) setPaymentMethod('cartao_debito')
        else if (cfg.acceptMealVoucher) setPaymentMethod('vale_refeicao')
      }
    }
  }, [isOpen, company.id, company.paymentConfig])

  // Produtos filtrados na busca
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return menuItems
    const q = searchQuery.toLowerCase().trim()
    return menuItems.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))
    )
  }, [menuItems, searchQuery])

  // Preço do item atualmente selecionado no modal de inclusão
  const currentItemPrice = useMemo(() => {
    if (!selectedMenuItem) return 0
    let base = Number(selectedMenuItem.promotionalPrice || selectedMenuItem.price) || 0
    if (selectedMenuItem.sizes && selectedMenuItem.sizes.length > 0) {
      const sz = selectedMenuItem.sizes[selectedSizeIndex]
      if (sz && typeof sz.price === 'number') {
        base = sz.price
      }
    }
    // Adicionar adicionais
    if (selectedMenuItem.extras && selectedMenuItem.extras.length > 0) {
      selectedExtras.forEach((extraName) => {
        const found = selectedMenuItem.extras?.find((e) => e.name === extraName)
        if (found && found.price) {
          base += Number(found.price)
        }
      })
    }
    return base
  }, [selectedMenuItem, selectedSizeIndex, selectedExtras])

  // Adicionar item à comanda
  const handleAddItem = () => {
    if (!selectedMenuItem) return
    const sizeObj = selectedMenuItem.sizes?.[selectedSizeIndex]
    const unitPrice = currentItemPrice
    const qty = Math.max(1, itemQuantity)
    const totalPrice = unitPrice * qty

    const newItem: TableOrderItem = {
      id: `it_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: selectedMenuItem.id,
      name: selectedMenuItem.name,
      quantity: qty,
      unitPrice,
      totalPrice,
      sizeName: sizeObj?.name,
      extras: selectedExtras.length > 0 ? selectedExtras : undefined,
      notes: itemNotes.trim() || undefined,
    }

    setItems((prev) => [...prev, newItem])
    // Resetar campos de adição
    setSelectedMenuItem(null)
    setSelectedSizeIndex(0)
    setSelectedExtras([])
    setItemQuantity(1)
    setItemNotes('')
    setSearchQuery('')
  }

  // Remover item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Alterar quantidade do item já adicionado
  const handleUpdateItemQuantity = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it
        const newQty = Math.max(1, it.quantity + delta)
        return {
          ...it,
          quantity: newQty,
          totalPrice: it.unitPrice * newQty,
        }
      })
    )
  }

  // Cálculos financeiros
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.totalPrice) || 0), 0)
  }, [items])

  const parsedDeliveryFee = useMemo(() => {
    if (orderType !== 'entrega') return 0
    return Math.max(0, parseFloat(deliveryFee.replace(',', '.')) || 0)
  }, [deliveryFee, orderType])

  const parsedDiscount = useMemo(() => {
    return Math.max(0, parseFloat(discount.replace(',', '.')) || 0)
  }, [discount])

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal + parsedDeliveryFee - parsedDiscount)
  }, [subtotal, parsedDeliveryFee, parsedDiscount])

  // Submeter pedido manual
  const handleCreateOrder = async () => {
    setErrorMsg(null)

    if (items.length === 0) {
      setErrorMsg('Adicione pelo menos um item ao pedido.')
      return
    }

    if (orderType === 'mesa' && !tableNumber.trim()) {
      setErrorMsg('Informe a Mesa ou Identificador do local.')
      return
    }

    if (orderType === 'entrega' && !address.trim()) {
      setErrorMsg('Informe o endereço de entrega completo.')
      return
    }

    const nowIso = new Date().toISOString()
    const autoAccept = company.autoAcceptOrders === true
    const initialStatus: TableOrderStatus = autoAccept ? 'preparo' : 'novo'

    // Status financeiro inicial
    let paymentStatus: OrderPaymentStatus = 'payment_on_delivery'
    if (paymentMethod === 'pix') {
      paymentStatus = pixPaidUpfront ? 'paid' : 'pending'
    }

    const eventIdSuffix = Math.random().toString(36).substring(2, 7)
    const historyEvents: TableOrderHistoryEvent[] = [
      {
        id: `hist_${Date.now()}_${eventIdSuffix}_manual_created`,
        timestamp: nowIso,
        action: 'pedido criado manualmente',
        description: `Pedido lançado no balcão pelo estabelecimento (${
          orderType === 'mesa' ? `Mesa/Local: ${tableNumber}` : orderType === 'retirada' ? 'Retirada no balcão' : 'Entrega delivery'
        })`,
        performedBy: 'Estabelecimento',
      },
    ]

    if (autoAccept) {
      historyEvents.push({
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_auto_accept`,
        timestamp: nowIso,
        action: 'pedido aceito automaticamente',
        description: 'Pedido aceito automaticamente',
        performedBy: 'Sistema',
      })
    }

    if (paymentMethod === 'pix' && pixPaidUpfront) {
      historyEvents.push({
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_pix_paid`,
        timestamp: nowIso,
        action: 'pagamento pix confirmado',
        description: 'Pagamento Pix já verificado no lançamento do pedido manual',
        performedBy: 'Estabelecimento',
      })
    }

    const formattedAddress =
      orderType === 'entrega'
        ? `${address.trim()}${addressNumber.trim() ? `, ${addressNumber.trim()}` : ''}${
            complement.trim() ? ` (${complement.trim()})` : ''
          }${neighborhood.trim() ? ` - ${neighborhood.trim()}` : ''}${
            referencePoint.trim() ? ` [Ref: ${referencePoint.trim()}]` : ''
          }`
        : undefined

    const newOrderData: TableOrder = {
      id: `ord_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId: company.id,
      orderType,
      origin: orderType,
      tableNumber:
        orderType === 'mesa'
          ? tableNumber.trim()
          : orderType === 'retirada'
          ? 'Retirada no Balcão'
          : 'Entrega Delivery',
      deliveryAddress: formattedAddress,
      address: address.trim() || undefined,
      addressNumber: addressNumber.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      complement: complement.trim() || undefined,
      referencePoint: referencePoint.trim() || undefined,
      customerName: customerName.trim() || (orderType === 'mesa' ? tableNumber.trim() : 'Cliente Balcão'),
      customerPhone: customerPhone.trim() || undefined,
      items,
      subtotal,
      discount: parsedDiscount > 0 ? parsedDiscount : undefined,
      surcharge: parsedDeliveryFee > 0 ? parsedDeliveryFee : undefined,
      totalAmount,
      notes: generalNotes.trim() || undefined,
      paymentMethod,
      paymentStatus,
      paymentChangeFor:
        paymentMethod === 'dinheiro' && paymentChangeFor
          ? parseFloat(paymentChangeFor.replace(',', '.')) || null
          : undefined,
      status: initialStatus,
      isManualOrder: true,
      history: historyEvents,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    setIsSubmitting(true)
    try {
      const res = await saveCompanyTableOrderOnServerApi(newOrderData)
      if (res.success && res.order) {
        onOrderCreated(res.order)
      } else {
        onOrderCreated(newOrderData)
      }
      onClose()
    } catch (err) {
      console.error('Error creating manual order:', err)
      setErrorMsg('Erro ao salvar o pedido na central.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const paymentConfig = company.paymentConfig || {
    acceptPix: true,
    acceptCash: true,
    acceptDebitCard: true,
    acceptCreditCard: true,
    acceptMealVoucher: true,
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/90 gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-neutral-900 text-base sm:text-lg">
                  Lançar Novo Pedido Manual
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-800">
                  Balcão / Telefone / WhatsApp
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Cadastre pedidos recebidos diretamente no estabelecimento com cálculo automático.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Corpo com scroll */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* SEÇÃO 1: TIPO DE ORIGEM (Mesa, Retirada, Entrega) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
              1. Tipo de Atendimento
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setOrderType('mesa')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  orderType === 'mesa'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Local (Mesa/Balcão)</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('retirada')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  orderType === 'retirada'
                    ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Retirada</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('entrega')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  orderType === 'entrega'
                    ? 'border-emerald-700 bg-emerald-700 text-white shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Entrega (Delivery)</span>
              </button>
            </div>
          </div>

          {/* SEÇÃO 2: DADOS DO CLIENTE / LOCAL */}
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-3">
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
              2. Dados do Cliente & Identificação
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {orderType === 'mesa' ? (
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                    Mesa ou Identificador *
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: Mesa 05, Balcão 02, Salão 01"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 font-bold"
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Nome do Cliente {orderType !== 'mesa' ? '*' : '(Opcional)'}</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Telefone / WhatsApp</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            {/* Endereço de Entrega */}
            {orderType === 'entrega' && (
              <div className="pt-3 border-t border-neutral-200/80 space-y-3">
                <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Endereço de Entrega</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                      Rua / Avenida *
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: Av. Paulista"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={addressNumber}
                      onChange={(e) => setAddressNumber(e.target.value)}
                      placeholder="Ex: 1000"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Ex: Centro"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Ex: Apto 42, Bloco B"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                      Ponto de Referência
                    </label>
                    <input
                      type="text"
                      value={referencePoint}
                      onChange={(e) => setReferencePoint(e.target.value)}
                      placeholder="Ex: Próximo à padaria"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">
                    Taxa de Entrega (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    placeholder="0.00"
                    className="w-32 px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white font-bold text-emerald-800 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 3: SELEÇÃO DE PRODUTOS DO CARDÁPIO */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
              3. Itens do Pedido ({items.length})
            </span>

            {/* Painel de Inclusão de Item */}
            <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-3">
              <span className="text-xs font-bold text-teal-900 block">
                Buscar e Adicionar Item do Cardápio
              </span>

              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar produto pelo nome ou categoria..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              {/* Lista compacta de sugestões */}
              {searchQuery.trim() && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 shadow-sm">
                  {filteredProducts.length === 0 ? (
                    <div className="p-2.5 text-xs text-neutral-400 text-center italic">
                      Nenhum produto encontrado
                    </div>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedMenuItem(p)
                          setSelectedSizeIndex(0)
                          setSelectedExtras([])
                          setSearchQuery(p.name)
                        }}
                        className="p-2.5 hover:bg-teal-50/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <strong className="text-neutral-900 block">{p.name}</strong>
                          <span className="text-[10px] text-neutral-500">{p.category || 'Geral'}</span>
                        </div>
                        <span className="font-bold text-teal-700">
                          {formatMoneyBRL(p.promotionalPrice || p.price)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Se um item foi selecionado para adicionar */}
              {selectedMenuItem && (
                <div className="p-3 rounded-xl bg-white border border-teal-300 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-neutral-900">{selectedMenuItem.name}</h4>
                      <span className="text-[10px] text-neutral-500">
                        {selectedMenuItem.category || 'Geral'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMenuItem(null)
                        setSearchQuery('')
                      }}
                      className="text-[10px] text-rose-600 hover:underline font-semibold"
                    >
                      Trocar produto
                    </button>
                  </div>

                  {/* Seleção de tamanho (se houver) */}
                  {selectedMenuItem.sizes && selectedMenuItem.sizes.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                        Tamanho / Porção
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMenuItem.sizes.map((sz, sidx) => (
                          <button
                            key={sz.id || sidx}
                            type="button"
                            onClick={() => setSelectedSizeIndex(sidx)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                              selectedSizeIndex === sidx
                                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {sz.name} {typeof sz.price === 'number' ? `(${formatMoneyBRL(sz.price)})` : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seleção de adicionais (se houver) */}
                  {selectedMenuItem.extras && selectedMenuItem.extras.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                        Adicionais
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMenuItem.extras.map((ex) => {
                          const isChecked = selectedExtras.includes(ex.name)
                          return (
                            <button
                              key={ex.id}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedExtras((prev) => prev.filter((n) => n !== ex.name))
                                } else {
                                  setSelectedExtras((prev) => [...prev, ex.name])
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                isChecked
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                              }`}
                            >
                              {isChecked ? '✓ ' : '+ '}
                              {ex.name} (+{formatMoneyBRL(ex.price)})
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantidade e Observação do Item */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                        Quantidade
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                          className="w-8 h-8 rounded-lg border border-neutral-200 bg-neutral-100 font-black text-neutral-700 flex items-center justify-center hover:bg-neutral-200"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-sm text-neutral-900">
                          {itemQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setItemQuantity((q) => q + 1)}
                          className="w-8 h-8 rounded-lg border border-neutral-200 bg-neutral-100 font-black text-neutral-700 flex items-center justify-center hover:bg-neutral-200"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                        Observação do Item
                      </label>
                      <input
                        type="text"
                        value={itemNotes}
                        onChange={(e) => setItemNotes(e.target.value)}
                        placeholder="Ex: Sem cebola, bem passado..."
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <div className="text-xs">
                      <span className="text-neutral-500">Subtotal do item: </span>
                      <strong className="text-teal-700 font-black text-sm">
                        {formatMoneyBRL(currentItemPrice * itemQuantity)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Incluir no Pedido</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista dos Itens Já Adicionados ao Pedido */}
            {items.length === 0 ? (
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-center text-xs text-neutral-400 italic">
                Nenhum item adicionado à comanda ainda.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div
                    key={it.id || idx}
                    className="p-3 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-neutral-900">{it.name}</span>
                        {it.sizeName && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600">
                            {it.sizeName}
                          </span>
                        )}
                      </div>
                      {it.extras && it.extras.length > 0 && (
                        <span className="text-[10px] text-emerald-700 block mt-0.5">
                          + {it.extras.join(', ')}
                        </span>
                      )}
                      {it.notes && (
                        <span className="text-[10px] text-neutral-500 italic block mt-0.5">
                          &quot;{it.notes}&quot;
                        </span>
                      )}
                    </div>

                    {/* Quantidade */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(idx, -1)}
                        className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 font-bold text-xs flex items-center justify-center text-neutral-700"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-neutral-900">
                        {it.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(idx, 1)}
                        className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 font-bold text-xs flex items-center justify-center text-neutral-700"
                      >
                        +
                      </button>
                    </div>

                    {/* Valor */}
                    <div className="text-right shrink-0">
                      <span className="font-black text-xs text-neutral-900 font-mono block">
                        {formatMoneyBRL(it.totalPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold mt-0.5"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEÇÃO 4: FORMA DE PAGAMENTO */}
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-3">
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
              4. Forma de Pagamento
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paymentConfig.acceptCash && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('dinheiro')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'dinheiro'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Dinheiro</span>
                </button>
              )}

              {paymentConfig.acceptPix && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'pix'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pix</span>
                </button>
              )}

              {paymentConfig.acceptCreditCard && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cartao_credito')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'cartao_credito'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão Crédito</span>
                </button>
              )}

              {paymentConfig.acceptDebitCard && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cartao_debito')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'cartao_debito'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão Débito</span>
                </button>
              )}
            </div>

            {/* Opções extras para Dinheiro (Troco) */}
            {paymentMethod === 'dinheiro' && (
              <div className="pt-2 border-t border-neutral-200/80 flex items-center gap-3">
                <label className="text-xs font-bold text-neutral-700">Troco para R$:</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={paymentChangeFor}
                  onChange={(e) => setPaymentChangeFor(e.target.value)}
                  placeholder="Ex: 50.00 (deixe em branco se não precisa)"
                  className="w-48 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 font-bold"
                />
              </div>
            )}

            {/* Opções extras para Pix (Pendente / Já pago) */}
            {paymentMethod === 'pix' && (
              <div className="pt-2 border-t border-neutral-200/80 flex items-center gap-3">
                <label className="text-xs font-bold text-neutral-700">Status do Pix:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPixPaidUpfront(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      !pixPaidUpfront
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-neutral-600 border-neutral-200'
                    }`}
                  >
                    Pendente
                  </button>
                  <button
                    type="button"
                    onClick={() => setPixPaidUpfront(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      pixPaidUpfront
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-neutral-600 border-neutral-200'
                    }`}
                  >
                    ✓ Já Pago
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 5: RESUMO FINANCEIRO E OBSERVAÇÃO GERAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span>Observação Geral do Pedido</span>
              </label>
              <textarea
                rows={3}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Ex: Cliente aguardando no salão, enviar sachês extras de molho..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 space-y-2">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Resumo Financeiro
              </span>

              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Subtotal dos itens:</span>
                <span className="font-bold text-neutral-800">{formatMoneyBRL(subtotal)}</span>
              </div>

              {orderType === 'entrega' && (
                <div className="flex items-center justify-between text-xs text-emerald-700">
                  <span>Taxa de Entrega:</span>
                  <span className="font-bold">+{formatMoneyBRL(parsedDeliveryFee)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs gap-2">
                <span className="text-neutral-600">Desconto (R$):</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="w-24 text-right px-2 py-1 text-xs rounded-lg border border-neutral-300 bg-white text-rose-600 font-bold"
                />
              </div>

              <div className="pt-2 border-t border-neutral-200 flex items-baseline justify-between">
                <span className="text-xs font-bold text-neutral-800 uppercase">Total Final:</span>
                <span className="text-xl font-black text-teal-600 font-mono">
                  {formatMoneyBRL(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isSubmitting || items.length === 0}
            onClick={handleCreateOrder}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Salvando...' : 'Lançar Pedido'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
