'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Check,
  Clock,
  User,
  Phone,
  MapPin,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  MessageCircle,
  Save,
  DollarSign,
  Tag,
  CreditCard,
  FileText,
  History,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Eye,
  Download,
  QrCode,
  Banknote,
} from 'lucide-react'
import {
  Company,
  TableOrder,
  TableOrderStatus,
  TableOrderItem,
  TableOrderHistoryEvent,
  CompanyCourier,
  MenuItem,
  OrderOrigin,
} from '@/types/platform'
import {
  getCompanyMenuItems,
  updateTableOrderOnServerApi,
  deleteTableOrderOnServerApi,
  getCompanyCouriers,
  fetchCompanyCouriersFromServer,
} from '@/lib/storage'
import { formatMoneyBRL, buildCourierDeliveryWhatsAppMessage, openOrderInWhatsApp } from '@/lib/order-delivery'
import { formatPhone, getWhatsappLink } from '@/lib/utils'

interface OrderManagementModalProps {
  order: TableOrder | null
  company: Company
  isOpen: boolean
  onClose: () => void
  onOrderUpdated: (updatedOrder: TableOrder) => void
  onOrderDeleted?: (orderId: string) => void
  onOpenCouriersManager?: () => void
}

const PAYMENT_METHODS = [
  { id: 'pix', label: 'Pix' },
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'cartao_credito', label: 'Cartão de Crédito' },
  { id: 'cartao_debito', label: 'Cartão de Débito' },
  { id: 'vale_refeicao', label: 'Vale Refeição / Alimentação' },
  { id: 'outro', label: 'Outro / A combinar' },
]

export const OrderManagementModal: React.FC<OrderManagementModalProps> = ({
  order,
  company,
  isOpen,
  onClose,
  onOrderUpdated,
  onOrderDeleted,
  onOpenCouriersManager,
}) => {
  // Estado local do pedido sendo editado
  const [editedOrder, setEditedOrder] = useState<TableOrder | null>(null)
  const [couriers, setCouriers] = useState<CompanyCourier[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('')
  const [customItemName, setCustomItemName] = useState('')
  const [customItemPrice, setCustomItemPrice] = useState<string>('')
  const [customItemQuantity, setCustomItemQuantity] = useState<number>(1)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Modais de confirmação e visualizador de comprovante
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type })
    setTimeout(() => setFeedback(null), 3000)
  }

  // Carregar dados ao abrir o modal
  useEffect(() => {
    if (order && isOpen) {
      setEditedOrder(JSON.parse(JSON.stringify(order)))
      setMenuItems(getCompanyMenuItems(company.id) || [])
      const initialCouriers = getCompanyCouriers(company.id) || []
      setCouriers(initialCouriers)

      fetchCompanyCouriersFromServer(company.id)
        .then((list) => {
          if (list) setCouriers(list)
        })
        .catch(() => null)
    }
  }, [order, isOpen, company.id])

  if (!isOpen || !editedOrder) return null

  const isFinalized = editedOrder.status === 'finalizado' || editedOrder.status === 'entregue'
  const isCancelled = editedOrder.status === 'cancelado'
  const isLocked = isFinalized || isCancelled

  const origin = editedOrder.orderType || editedOrder.origin || (editedOrder.deliveryAddress ? 'entrega' : 'mesa')

  // Recalcular totais sempre que itens, desconto ou acréscimo mudarem
  const calculateTotals = (
    items: TableOrderItem[],
    discountVal: number = Number(editedOrder.discount) || 0,
    surchargeVal: number = Number(editedOrder.surcharge) || 0
  ) => {
    const subtotal = items.reduce((acc, it) => acc + (Number(it.totalPrice) || 0), 0)
    const totalAmount = Math.max(0, subtotal - discountVal + surchargeVal)
    return { subtotal, totalAmount }
  }

  // Alterar quantidade do item
  const handleQuantityChange = (index: number, delta: number) => {
    if (isLocked) return
    const currentItems = [...editedOrder.items]
    const item = currentItems[index]
    if (!item) return

    const newQty = Math.max(1, (item.quantity || 1) + delta)
    const unitPrice = item.unitPrice || 0
    const newTotal = unitPrice * newQty

    currentItems[index] = {
      ...item,
      quantity: newQty,
      totalPrice: newTotal,
    }

    const { subtotal, totalAmount } = calculateTotals(currentItems)
    setEditedOrder({
      ...editedOrder,
      items: currentItems,
      subtotal,
      totalAmount,
    })
  }

  // Remover item do pedido
  const handleRemoveItem = (index: number) => {
    if (isLocked) return
    if (editedOrder.items.length <= 1) {
      if (!window.confirm('Este é o único item do pedido. Deseja realmente remover?')) return
    }
    const currentItems = editedOrder.items.filter((_, i) => i !== index)
    const { subtotal, totalAmount } = calculateTotals(currentItems)
    setEditedOrder({
      ...editedOrder,
      items: currentItems,
      subtotal,
      totalAmount,
    })
  }

  // Adicionar produto
  const handleAddProduct = () => {
    if (isLocked) return
    let newItem: TableOrderItem | null = null

    if (selectedMenuItemId) {
      const found = menuItems.find((m) => m.id === selectedMenuItemId)
      if (found) {
        const price = Number(found.promotionalPrice || found.price) || 0
        const qty = Math.max(1, customItemQuantity)
        newItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          menuItemId: found.id,
          name: found.name,
          quantity: qty,
          unitPrice: price,
          totalPrice: price * qty,
        }
      }
    } else if (customItemName.trim()) {
      const price = parseFloat(customItemPrice.replace(',', '.')) || 0
      const qty = Math.max(1, customItemQuantity)
      newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        menuItemId: '',
        name: customItemName.trim(),
        quantity: qty,
        unitPrice: price,
        totalPrice: price * qty,
      }
    }

    if (!newItem) {
      showToast('Selecione um produto do cardápio ou informe o nome e valor.', 'error')
      return
    }

    const updatedItems = [...editedOrder.items, newItem]
    const { subtotal, totalAmount } = calculateTotals(updatedItems)

    setEditedOrder({
      ...editedOrder,
      items: updatedItems,
      subtotal,
      totalAmount,
    })

    // Reset formulário
    setSelectedMenuItemId('')
    setCustomItemName('')
    setCustomItemPrice('')
    setCustomItemQuantity(1)
    setIsAddingProduct(false)
    showToast('Produto adicionado ao pedido!')
  }

  // Alterar Desconto
  const handleDiscountChange = (valStr: string) => {
    if (isLocked) return
    const discountVal = Math.max(0, parseFloat(valStr.replace(',', '.')) || 0)
    const { subtotal, totalAmount } = calculateTotals(
      editedOrder.items,
      discountVal,
      Number(editedOrder.surcharge) || 0
    )
    setEditedOrder({
      ...editedOrder,
      discount: discountVal,
      subtotal,
      totalAmount,
    })
  }

  // Alterar Acréscimo / Taxa de entrega
  const handleSurchargeChange = (valStr: string) => {
    if (isLocked) return
    const surchargeVal = Math.max(0, parseFloat(valStr.replace(',', '.')) || 0)
    const { subtotal, totalAmount } = calculateTotals(
      editedOrder.items,
      Number(editedOrder.discount) || 0,
      surchargeVal
    )
    setEditedOrder({
      ...editedOrder,
      surcharge: surchargeVal,
      subtotal,
      totalAmount,
    })
  }

  const generateEventId = (type: string) =>
    `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${type}`

  // Selecionar Motoboy
  const handleSelectCourier = (courierId: string) => {
    if (isLocked) return
    const selected = couriers.find((c) => c.id === courierId)
    const nowIso = new Date().toISOString()
    const historyEvent: TableOrderHistoryEvent = {
      id: generateEventId('courier'),
      timestamp: nowIso,
      action: 'motoboy selecionado',
      description: selected ? `Motoboy ${selected.name} (${selected.phone || 'Sem telefone'}) atribuído` : 'Motoboy desatribuído',
      performedBy: 'Operador',
    }

    setEditedOrder({
      ...editedOrder,
      courierId: selected ? selected.id : undefined,
      courierName: selected ? selected.name : undefined,
      courierPhone: selected ? selected.phone : undefined,
      history: [...(editedOrder.history || []), historyEvent],
    })
  }

  // Salvar alterações
  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      const nowIso = new Date().toISOString()
      const historyEvent: TableOrderHistoryEvent = {
        id: generateEventId('edited'),
        timestamp: nowIso,
        action: 'pedido editado',
        description: 'Dados ou itens do pedido alterados pelo operador',
        performedBy: 'Operador',
      }

      const orderToSave: TableOrder = {
        ...editedOrder,
        history: [...(editedOrder.history || []), historyEvent],
        updatedAt: nowIso,
      }

      const res = await updateTableOrderOnServerApi(orderToSave)
      if (res.success && res.order) {
        setEditedOrder(res.order)
        onOrderUpdated(res.order)
        showToast('Pedido atualizado com sucesso!')
      } else {
        setEditedOrder(orderToSave)
        onOrderUpdated(orderToSave)
        showToast('Salvo com sucesso!')
      }
    } catch (err) {
      console.error('Error saving order updates:', err)
      showToast('Erro ao salvar alterações.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Excluir pedido permanentemente (Requirement: Excluir pedidos do cardápio)
  const handleDeleteOrder = async () => {
    if (!editedOrder) return
    setIsDeleting(true)
    const res = await deleteTableOrderOnServerApi(editedOrder.id, company.id)
    setIsDeleting(false)
    if (res.success) {
      showToast('Pedido excluído com sucesso!', 'success')
      setIsDeleteModalOpen(false)
      if (onOrderDeleted) {
        onOrderDeleted(editedOrder.id)
      }
      onClose()
    } else {
      showToast(res.error || 'Erro ao excluir pedido.', 'error')
    }
  }

  // Reabrir pedido
  const handleConfirmReopen = async () => {
    setIsSaving(true)
    try {
      const nowIso = new Date().toISOString()
      const historyEvent: TableOrderHistoryEvent = {
        id: generateEventId('reopened'),
        timestamp: nowIso,
        action: 'pedido reaberto',
        description: 'Pedido reaberto pelo estabelecimento para revisão',
        performedBy: 'Operador',
      }

      // Reabre para status 'preparo' ou 'aceito'
      const reopenedStatus: TableOrderStatus = 'preparo'
      const orderToSave: TableOrder = {
        ...editedOrder,
        status: reopenedStatus,
        history: [...(editedOrder.history || []), historyEvent],
        updatedAt: nowIso,
      }

      const res = await updateTableOrderOnServerApi(orderToSave)
      const updated = res.order || orderToSave
      setEditedOrder(updated)
      onOrderUpdated(updated)
      setIsReopenModalOpen(false)
      showToast('Pedido reaberto com sucesso!')
    } catch {
      showToast('Erro ao reabrir pedido.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Cancelar pedido
  const handleConfirmCancel = async () => {
    if (!cancellationReason.trim()) {
      showToast('Informe o motivo do cancelamento.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const nowIso = new Date().toISOString()
      const reason = cancellationReason.trim()
      const historyEvent: TableOrderHistoryEvent = {
        id: generateEventId('cancelled'),
        timestamp: nowIso,
        action: 'cancelado',
        description: `Motivo: ${reason}`,
        performedBy: 'Operador',
      }

      const orderToSave: TableOrder = {
        ...editedOrder,
        status: 'cancelado',
        cancellationReason: reason,
        history: [...(editedOrder.history || []), historyEvent],
        updatedAt: nowIso,
      }

      const res = await updateTableOrderOnServerApi(orderToSave)
      const updated = res.order || orderToSave
      setEditedOrder(updated)
      onOrderUpdated(updated)
      setIsCancelModalOpen(false)
      showToast('Pedido cancelado.')
    } catch {
      showToast('Erro ao cancelar pedido.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Confirmar pagamento Pix manualmente pelo estabelecimento
  const handleConfirmPixPayment = async () => {
    setIsSaving(true)
    try {
      const nowIso = new Date().toISOString()
      const historyEvent: TableOrderHistoryEvent = {
        id: generateEventId('pix_paid'),
        timestamp: nowIso,
        action: 'pagamento pix confirmado',
        description: 'Pagamento Pix confirmado manualmente pelo estabelecimento.',
        performedBy: 'Estabelecimento',
      }

      const orderToSave: TableOrder = {
        ...editedOrder,
        paymentStatus: 'paid',
        history: [...(editedOrder.history || []), historyEvent],
        updatedAt: nowIso,
      }

      const res = await updateTableOrderOnServerApi(orderToSave)
      const updated = res.order || orderToSave
      setEditedOrder(updated)
      onOrderUpdated(updated)
      showToast('Pagamento Pix confirmado com sucesso!')
    } catch {
      showToast('Erro ao confirmar pagamento Pix.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Marcar pagamento Pix como não localizado
  const handleMarkPixNotFound = async () => {
    setIsSaving(true)
    try {
      const nowIso = new Date().toISOString()
      const historyEvent: TableOrderHistoryEvent = {
        id: generateEventId('pix_not_found'),
        timestamp: nowIso,
        action: 'pix não localizado',
        description: 'Pagamento Pix marcado como não localizado pelo estabelecimento.',
        performedBy: 'Estabelecimento',
      }

      const orderToSave: TableOrder = {
        ...editedOrder,
        paymentStatus: 'not_found',
        history: [...(editedOrder.history || []), historyEvent],
        updatedAt: nowIso,
      }

      const res = await updateTableOrderOnServerApi(orderToSave)
      const updated = res.order || orderToSave
      setEditedOrder(updated)
      onOrderUpdated(updated)
      showToast('Pagamento marcado como não localizado.', 'error')
    } catch {
      showToast('Erro ao atualizar status do pagamento.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Alterar forma de pagamento com histórico
  const handlePaymentMethodChange = (newMethod: string) => {
    if (isLocked) return
    const methodMeta = PAYMENT_METHODS.find((pm) => pm.id === newMethod)
    const methodLabel = methodMeta ? methodMeta.label : newMethod

    const nowIso = new Date().toISOString()
    const historyEvent: TableOrderHistoryEvent = {
      id: generateEventId('method_change'),
      timestamp: nowIso,
      action: 'forma de pagamento alterada',
      description: `Forma de pagamento alterada para: ${methodLabel}`,
      performedBy: 'Estabelecimento',
    }

    let newStatus = editedOrder.paymentStatus
    if (newMethod === 'pix') {
      newStatus = editedOrder.receiptUrl ? 'awaiting_confirmation' : 'pending'
    } else {
      newStatus = 'payment_on_delivery'
    }

    setEditedOrder({
      ...editedOrder,
      paymentMethod: newMethod,
      paymentStatus: newStatus,
      history: [...(editedOrder.history || []), historyEvent],
    })
  }

  // Enviar entrega pelo WhatsApp do Motoboy
  const handleSendToMotoboyWhatsApp = () => {
    if (!editedOrder.courierPhone) {
      showToast('O motoboy selecionado não possui telefone cadastrado.', 'error')
      return
    }
    const message = buildCourierDeliveryWhatsAppMessage({
      companyName: company.name,
      order: editedOrder,
    })
    openOrderInWhatsApp(editedOrder.courierPhone, message)
  }

  // Formatar tempo
  const formatTime = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    } catch {
      return ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header do Pedido */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/90 gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl shrink-0 ${
                origin === 'mesa'
                  ? 'bg-neutral-900 text-white'
                  : origin === 'retirada'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-700 text-white'
              }`}
            >
              {origin === 'mesa' ? (
                <UtensilsCrossed className="w-5 h-5 text-teal-300" />
              ) : origin === 'retirada' ? (
                <ShoppingBag className="w-5 h-5 text-amber-200" />
              ) : (
                <Bike className="w-5 h-5 text-emerald-200" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-neutral-900 text-base sm:text-lg">
                  Pedido #{editedOrder.id.slice(-6).toUpperCase()}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-200 text-neutral-800">
                  {origin === 'mesa'
                    ? editedOrder.tableNumber || 'Mesa'
                    : origin === 'retirada'
                    ? 'Retirada no Balcão'
                    : 'Entrega Delivery'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                    editedOrder.status === 'novo'
                      ? 'bg-rose-100 text-rose-700'
                      : editedOrder.status === 'aceito'
                      ? 'bg-blue-100 text-blue-700'
                      : editedOrder.status === 'preparo'
                      ? 'bg-amber-100 text-amber-700'
                      : editedOrder.status === 'pronto' || editedOrder.status === 'pronto_retirada'
                      ? 'bg-emerald-100 text-emerald-700'
                      : editedOrder.status === 'saiu_entrega'
                      ? 'bg-indigo-100 text-indigo-700'
                      : editedOrder.status === 'cancelado'
                      ? 'bg-rose-200 text-rose-900 line-through'
                      : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {editedOrder.status}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Criado em: {formatTime(editedOrder.createdAt)}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Toast */}
        {feedback && (
          <div
            className={`mx-5 mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Alerta de Pedido Finalizado / Bloqueado */}
        {isFinalized && (
          <div className="mx-4 sm:mx-6 mt-3 p-3.5 rounded-2xl bg-neutral-100 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Pedido Finalizado.</strong> A edição de itens e valores está bloqueada para preservar o registro operacional.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsReopenModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reabrir Pedido</span>
            </button>
          </div>
        )}

        {/* Alerta de Pedido Cancelado */}
        {isCancelled && (
          <div className="mx-4 sm:mx-6 mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
            <div>
              <span className="font-bold block">Pedido Cancelado</span>
              {editedOrder.cancellationReason && (
                <p className="mt-0.5 italic">Motivo: &quot;{editedOrder.cancellationReason}&quot;</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsReopenModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reabrir Pedido</span>
            </button>
          </div>
        )}

        {/* Corpo com scroll */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* SEÇÃO 1: DADOS DO CLIENTE & ENTREGA */}
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-600" />
                <span>Dados do Cliente & Local</span>
              </span>
              {editedOrder.customerPhone && (
                <a
                  href={getWhatsappLink(
                    editedOrder.customerPhone,
                    `Olá ${editedOrder.customerName || ''}, referente ao seu pedido #${editedOrder.id.slice(-6).toUpperCase()} no ${company.name}:`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Cliente</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={editedOrder.customerName || ''}
                  onChange={(e) => setEditedOrder({ ...editedOrder, customerName: e.target.value })}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100 disabled:text-neutral-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  disabled={isLocked}
                  value={editedOrder.customerPhone || ''}
                  onChange={(e) => setEditedOrder({ ...editedOrder, customerPhone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100 disabled:text-neutral-500"
                />
              </div>
            </div>

            {/* Endereço de Entrega (se for Entrega) */}
            {origin === 'entrega' && (
              <div className="pt-2 border-t border-neutral-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Endereço de Entrega Completo</span>
                  </label>
                  {editedOrder.deliveryAddress && (
                    <a
                      href={
                        editedOrder.locationUrl ||
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          editedOrder.deliveryAddress || ''
                        )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-teal-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Abrir no Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      disabled={isLocked}
                      value={editedOrder.deliveryAddress || editedOrder.address || ''}
                      onChange={(e) =>
                        setEditedOrder({
                          ...editedOrder,
                          deliveryAddress: e.target.value,
                          address: e.target.value,
                        })
                      }
                      placeholder="Rua / Avenida e Bairro"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={editedOrder.addressNumber || ''}
                      onChange={(e) => setEditedOrder({ ...editedOrder, addressNumber: e.target.value })}
                      placeholder="Número (ex: 120)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    disabled={isLocked}
                    value={editedOrder.complement || ''}
                    onChange={(e) => setEditedOrder({ ...editedOrder, complement: e.target.value })}
                    placeholder="Complemento (Apto, Bloco)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100"
                  />
                  <input
                    type="text"
                    disabled={isLocked}
                    value={editedOrder.referencePoint || ''}
                    onChange={(e) => setEditedOrder({ ...editedOrder, referencePoint: e.target.value })}
                    placeholder="Ponto de Referência"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100"
                  />
                </div>
              </div>
            )}

            {/* Mesa (se for Mesa) */}
            {origin === 'mesa' && (
              <div className="pt-2 border-t border-neutral-200/60">
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                  Identificação da Mesa / Local
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={editedOrder.tableNumber || ''}
                  onChange={(e) => setEditedOrder({ ...editedOrder, tableNumber: e.target.value })}
                  placeholder="Ex: Mesa 04"
                  className="w-full max-w-xs px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100"
                />
              </div>
            )}
          </div>

          {/* SEÇÃO 2: MOTOBOY / ENTREGA (quando for Entrega) */}
          {origin === 'entrega' && (
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-emerald-700" />
                  <span>Entrega & Motoboy</span>
                </span>
                {onOpenCouriersManager && (
                  <button
                    type="button"
                    onClick={onOpenCouriersManager}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                  >
                    Gerenciar Motoboys ({couriers.length})
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                    Atribuir Entregador:
                  </label>
                  <select
                    disabled={isLocked}
                    value={editedOrder.courierId || ''}
                    onChange={(e) => handleSelectCourier(e.target.value)}
                    className="w-full sm:max-w-xs px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white text-neutral-800 font-medium focus:outline-hidden focus:border-emerald-500 disabled:bg-neutral-100"
                  >
                    <option value="">-- Nenhum motoboy selecionado --</option>
                    {couriers
                      .filter((c) => c.isActive || c.id === editedOrder.courierId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''} {!c.isActive ? '(Inativo)' : ''}
                        </option>
                      ))}
                  </select>
                </div>

                {editedOrder.courierId && editedOrder.courierPhone && (
                  <button
                    type="button"
                    onClick={handleSendToMotoboyWhatsApp}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-end"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Entrega pelo WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SEÇÃO 3: ITENS DO PEDIDO (Edição, Quantidades, Adição e Remoção) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Itens do Pedido ({editedOrder.items.length})
              </span>

              {!isLocked && (
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(!isAddingProduct)}
                  className="px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAddingProduct ? 'Fechar Inclusão' : 'Adicionar Produto'}</span>
                </button>
              )}
            </div>

            {/* Painel para Adicionar Produto */}
            {isAddingProduct && !isLocked && (
              <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/60 space-y-3 animate-in fade-in">
                <span className="text-xs font-bold text-teal-900 block">
                  Adicionar Item ao Pedido
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                      Selecionar do Cardápio
                    </label>
                    <select
                      value={selectedMenuItemId}
                      onChange={(e) => {
                        setSelectedMenuItemId(e.target.value)
                        if (e.target.value) {
                          setCustomItemName('')
                          setCustomItemPrice('')
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
                    >
                      <option value="">-- Escolha um item do cardápio --</option>
                      {menuItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {formatMoneyBRL(m.promotionalPrice || m.price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                      Ou Digite um Item Avulso
                    </label>
                    <input
                      type="text"
                      value={customItemName}
                      onChange={(e) => {
                        setCustomItemName(e.target.value)
                        if (e.target.value) setSelectedMenuItemId('')
                      }}
                      placeholder="Ex: Suco de Laranja 500ml"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={customItemQuantity}
                      onChange={(e) => setCustomItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                      Preço Unitário (R$)
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(selectedMenuItemId)}
                      value={
                        selectedMenuItemId
                          ? formatMoneyBRL(
                              menuItems.find((m) => m.id === selectedMenuItemId)?.promotionalPrice ||
                                menuItems.find((m) => m.id === selectedMenuItemId)?.price
                            )
                          : customItemPrice
                      }
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      placeholder="Ex: 15,00"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Incluir</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista dos Itens */}
            <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-neutral-50/40 p-2 sm:p-3 space-y-2">
              {editedOrder.items.map((item, idx) => (
                <div key={item.id || idx} className="pt-2 first:pt-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="flex items-center gap-1 shrink-0">
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(idx, -1)}
                            className="w-6 h-6 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                            title="Diminuir quantidade"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        )}
                        <span className="px-2 py-0.5 rounded-lg bg-neutral-900 text-white font-mono font-bold text-xs">
                          {item.quantity || 1}x
                        </span>
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(idx, 1)}
                            className="w-6 h-6 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                            title="Aumentar quantidade"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">
                          {item.name}
                        </h4>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {formatMoneyBRL(item.unitPrice)} un.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-neutral-900 font-mono">
                        {formatMoneyBRL(item.totalPrice)}
                      </span>

                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Variações, Tamanhos, Extras e Observações */}
                  <div className="pl-14 space-y-0.5 text-[11px] text-neutral-600">
                    {item.sizeName && <div>Tamanho: {item.sizeName}</div>}
                    {Array.isArray(item.flavors) && item.flavors.length > 0 && (
                      <div>Sabores: {item.flavors.join(', ')}</div>
                    )}
                    {Array.isArray(item.extras) && item.extras.length > 0 && (
                      <div className="text-teal-700 font-medium">+ Adicionais: {item.extras.join(', ')}</div>
                    )}
                    {Array.isArray(item.removals) && item.removals.length > 0 && (
                      <div className="text-rose-600 font-medium">Sem: {item.removals.join(', ')}</div>
                    )}
                    {item.notes && <div className="italic text-neutral-500">&quot;{item.notes}&quot;</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEÇÃO 4: PAGAMENTO, DESCONTOS, ACRÉSCIMO E TOTAL */}
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>Valores & Pagamento</span>
              </span>

              {/* Status Financeiro Badge */}
              <div className="flex items-center gap-2">
                {editedOrder.paymentStatus === 'paid' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pago</span>
                  </span>
                ) : editedOrder.paymentStatus === 'awaiting_confirmation' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Aguardando Confirmação</span>
                  </span>
                ) : editedOrder.paymentStatus === 'not_found' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Não Localizado</span>
                  </span>
                ) : editedOrder.paymentStatus === 'payment_on_delivery' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>{origin === 'entrega' ? 'Pagar na Entrega' : origin === 'retirada' ? 'Pagar na Retirada' : 'Pagar no Balcão'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-200 text-neutral-700">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pendente</span>
                  </span>
                )}

                {editedOrder.receiptUrl && (
                  <button
                    type="button"
                    onClick={() => setIsReceiptModalOpen(true)}
                    className="px-2.5 py-1 rounded-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                    title="Visualizar comprovante anexado"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Comprovante</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Forma de Pagamento */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                  Forma de Pagamento
                </label>
                <select
                  disabled={isLocked}
                  value={editedOrder.paymentMethod || 'pix'}
                  onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-medium focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Troco para R$ (se dinheiro) */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                  Troco para (R$)
                </label>
                <input
                  type="text"
                  disabled={isLocked || editedOrder.paymentMethod !== 'dinheiro'}
                  value={editedOrder.paymentChangeFor || ''}
                  onChange={(e) =>
                    setEditedOrder({
                      ...editedOrder,
                      paymentChangeFor: parseFloat(e.target.value.replace(',', '.')) || 0,
                    })
                  }
                  placeholder="Ex: 50,00"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100"
                />
                {editedOrder.paymentMethod === 'dinheiro' &&
                  editedOrder.paymentChangeFor &&
                  editedOrder.paymentChangeFor > editedOrder.totalAmount && (
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                      Levar troco de:{' '}
                      {formatMoneyBRL(editedOrder.paymentChangeFor - editedOrder.totalAmount)}
                    </span>
                  )}
              </div>
            </div>

            {/* SEÇÃO ESPECÍFICA PARA CONFERÊNCIA MANUAL DO PIX */}
            {editedOrder.paymentMethod === 'pix' && (
              <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-3">
                <div className="flex items-start gap-2 text-amber-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Atenção:</strong> Confirme o pagamento somente após verificar que o
                    valor realmente entrou na conta bancária do estabelecimento.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
                  <div className="flex items-center gap-2">
                    {editedOrder.receiptUrl ? (
                      <button
                        type="button"
                        onClick={() => setIsReceiptModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-700" />
                        <span>Abrir Comprovante</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-neutral-500 italic">
                        Nenhum comprovante anexado pelo cliente
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {editedOrder.paymentStatus !== 'paid' ? (
                      <>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={handleMarkPixNotFound}
                          className="px-3 py-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center gap-1 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Não Localizado</span>
                        </button>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={handleConfirmPixPayment}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmar Pagamento</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Pix Confirmado na Conta</span>
                        </span>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={handleMarkPixNotFound}
                          className="text-[11px] text-neutral-400 hover:text-rose-600 font-semibold underline ml-2 cursor-pointer"
                        >
                          Alterar p/ Não localizado
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Desconto e Acréscimo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200/60">
              <div>
                <label className="block text-[11px] font-bold text-rose-700 uppercase mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-rose-600" />
                  <span>Desconto (R$)</span>
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={editedOrder.discount || ''}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-teal-700 uppercase mb-1 flex items-center gap-1">
                  <Plus className="w-3 h-3 text-teal-600" />
                  <span>Acréscimo / Taxa de Entrega (R$)</span>
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={editedOrder.surcharge || ''}
                  onChange={(e) => handleSurchargeChange(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100"
                />
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="pt-3 border-t border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs text-neutral-500 space-x-3">
                <span>
                  Subtotal: <strong className="text-neutral-800">{formatMoneyBRL(editedOrder.subtotal || editedOrder.totalAmount)}</strong>
                </span>
                {editedOrder.discount ? (
                  <span className="text-rose-600">
                    Desc: -{formatMoneyBRL(editedOrder.discount)}
                  </span>
                ) : null}
                {editedOrder.surcharge ? (
                  <span className="text-teal-700">
                    Acrésc.: +{formatMoneyBRL(editedOrder.surcharge)}
                  </span>
                ) : null}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-neutral-500">Valor Final:</span>
                <span className="text-2xl font-black text-teal-600 font-mono">
                  {formatMoneyBRL(editedOrder.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 5: OBSERVAÇÃO GERAL DO PEDIDO */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              <span>Observação Geral do Pedido</span>
            </label>
            <textarea
              rows={2}
              disabled={isLocked}
              value={editedOrder.notes || ''}
              onChange={(e) => setEditedOrder({ ...editedOrder, notes: e.target.value })}
              placeholder="Ex: Cliente pediu para não tocar a campainha, entregar no portão lateral..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 disabled:bg-neutral-100"
            />
          </div>

          {/* SEÇÃO 6: HISTÓRICO COMPLETO DO PEDIDO (TIMELINE) */}
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/40 space-y-3">
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-teal-600" />
              <span>Histórico do Pedido</span>
            </span>

            {Array.isArray(editedOrder.history) && editedOrder.history.length > 0 ? (
              <div className="space-y-2 border-l-2 border-teal-300 pl-3 ml-2 text-xs">
                {editedOrder.history.map((evt, eidx) => (
                  <div key={`${evt.id || 'evt'}-${eidx}`} className="relative group">
                    <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-2 ring-white" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-neutral-900 capitalize">
                        {evt.action}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {formatTime(evt.timestamp)}
                      </span>
                    </div>
                    {evt.description && (
                      <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                        {evt.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">
                Nenhum evento registrado no histórico ainda.
              </p>
            )}
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Ações Destrutivas ou de Reabertura */}
          <div className="flex items-center gap-2">
            {!isCancelled && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Cancelar Pedido</span>
              </button>
            )}

            {isLocked && (
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reabrir Pedido</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Excluir este pedido permanentemente"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Excluir Pedido</span>
            </button>
          </div>

          {/* Botões Fechar e Salvar */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Fechar
            </button>

            {!isLocked && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveChanges}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cancelamento com Motivo */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-60 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h4 className="font-bold text-base text-neutral-900">
                Confirmar Cancelamento do Pedido
              </h4>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              O cancelamento bloqueará o pedido e registrará a ação no histórico da central com data e hora.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                Motivo do Cancelamento *
              </label>
              <textarea
                rows={3}
                required
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Ex: Cliente desistiu por telefone / item esgotado / endereço fora de rota..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-bold hover:bg-neutral-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isSaving || !cancellationReason.trim()}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reabertura com Confirmação */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-60 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-neutral-900">
              <div className="p-2.5 rounded-2xl bg-neutral-100 border border-neutral-200">
                <RotateCcw className="w-5 h-5 text-neutral-800" />
              </div>
              <h4 className="font-bold text-base text-neutral-900">
                Deseja Reabrir este Pedido?
              </h4>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Ao reabrir, o pedido voltará para o status <strong>Em Preparo</strong>, permitindo editar itens, valores, cliente e avançar as etapas normalmente. O evento será registrado no histórico.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-bold hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmReopen}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Reabrindo...' : 'Confirmar Reabertura'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Visualização de Comprovante Pix */}
      {isReceiptModalOpen && editedOrder.receiptUrl && (
        <div className="fixed inset-0 z-60 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-neutral-900">
                    Comprovante de Pagamento
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Pedido #{editedOrder.id.slice(-6).toUpperCase()} • {editedOrder.customerName || 'Cliente'} • {formatMoneyBRL(editedOrder.totalAmount)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Preview */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-neutral-100/60 min-h-[280px]">
              {editedOrder.receiptType === 'pdf' || editedOrder.receiptUrl.startsWith('data:application/pdf') || editedOrder.receiptName?.toLowerCase().endsWith('.pdf') ? (
                <div className="text-center p-8 bg-white rounded-2xl border border-neutral-200 shadow-sm max-w-sm w-full space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-neutral-900">Documento PDF Anexado</h5>
                    <p className="text-xs text-neutral-500 mt-1 font-mono truncate px-2">
                      {editedOrder.receiptName || 'comprovante.pdf'}
                    </p>
                  </div>
                  <a
                    href={editedOrder.receiptUrl}
                    download={editedOrder.receiptName || 'comprovante.pdf'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar / Abrir PDF</span>
                  </a>
                </div>
              ) : (
                <div className="max-w-full space-y-2 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editedOrder.receiptUrl}
                    alt="Comprovante de pagamento"
                    className="max-h-[60vh] max-w-full rounded-2xl border border-neutral-200 shadow-lg object-contain mx-auto bg-white"
                  />
                  {editedOrder.receiptName && (
                    <span className="text-[11px] text-neutral-400 block">
                      Arquivo: {editedOrder.receiptName}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-500">
                {editedOrder.receiptUploadedAt ? `Anexado em: ${formatTime(editedOrder.receiptUploadedAt)}` : 'Anexado no checkout'}
              </span>

              <div className="flex items-center gap-2">
                {editedOrder.paymentMethod === 'pix' && editedOrder.paymentStatus !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleConfirmPixPayment()
                      setIsReceiptModalOpen(false)
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Pagamento</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão do Pedido */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-70 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-base text-neutral-900">
                  Excluir Pedido Permanentemente
                </h4>
                <p className="text-xs text-neutral-500">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Identificação:</span>
                <span className="font-bold text-neutral-900">
                  #{editedOrder.id.slice(-6).toUpperCase()} ({origin === 'mesa' ? `Mesa ${editedOrder.tableNumber || ''}` : origin === 'entrega' ? 'Delivery' : 'Retirada'})
                </span>
              </div>
              {editedOrder.customerName && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Cliente:</span>
                  <span className="font-semibold text-neutral-800">{editedOrder.customerName}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Valor Total:</span>
                <span className="font-mono font-bold text-teal-700">{formatMoneyBRL(editedOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Itens:</span>
                <span className="text-neutral-700">{editedOrder.items?.length || 0} itens</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Tem certeza que deseja excluir permanentemente este pedido? Ele será removido da Central de Pedidos, dos relatórios e do histórico.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-xs hover:bg-neutral-50 transition-all cursor-pointer disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteOrder}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sim, excluir pedido</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
