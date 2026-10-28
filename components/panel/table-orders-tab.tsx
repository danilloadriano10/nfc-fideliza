'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  User,
  Phone,
  MessageCircle,
  Bell,
  Sparkles,
  ArrowRight,
  Flame,
  ChefHat,
  PackageCheck,
  CheckCheck,
  ShoppingBag,
  Bike,
  MapPin,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Layers,
  Edit,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  CreditCard,
  QrCode,
  Banknote,
  Eye,
  X,
  Volume2,
  VolumeX,
  Plus,
  Settings,
  Download,
} from 'lucide-react'
import {
  Company,
  TableOrder,
  TableOrderStatus,
  OrderOrigin,
  TableOrderHistoryEvent,
  CompanyCourier,
} from '@/types/platform'
import {
  getCompanyTableOrders,
  fetchCompanyTableOrdersFromServer,
  updateTableOrderStatusOnServerApi,
  updateTableOrderOnServerApi,
  getCompanyCouriers,
  fetchCompanyCouriersFromServer,
  saveCompanyLocally,
  saveCompany,
  saveCompanyAsync,
  DATA_CHANGE_EVENT,
} from '@/lib/storage'
import {
  formatMoneyBRL,
  buildCourierDeliveryWhatsAppMessage,
  openOrderInWhatsApp,
} from '@/lib/order-delivery'
import { formatPhone, getWhatsappLink } from '@/lib/utils'
import { OrderManagementModal } from './order-management-modal'
import { CouriersModal } from './couriers-modal'
import { PaymentSettingsSection } from './payment-settings-section'
import { ManualOrderModal } from './manual-order-modal'

interface TableOrdersTabProps {
  company: Company
  onOpenTables?: () => void
  onCompanyUpdate?: (updated: Company) => void
}

export function getOrderOrigin(ord: TableOrder): OrderOrigin {
  if (ord.orderType === 'mesa' || ord.orderType === 'retirada' || ord.orderType === 'entrega') {
    return ord.orderType
  }
  if (ord.origin === 'mesa' || ord.origin === 'retirada' || ord.origin === 'entrega') {
    return ord.origin
  }
  if (ord.deliveryAddress || ord.address) {
    return 'entrega'
  }
  const t = (ord.tableNumber || '').trim().toLowerCase()
  if (t.includes('retirada') || t.includes('balcão') || t.includes('balcao')) {
    return 'retirada'
  }
  if (t.includes('delivery') || t.includes('entrega')) {
    return 'entrega'
  }
  if (!t) {
    return 'retirada'
  }
  return 'mesa'
}

export const STATUS_META: Record<
  TableOrderStatus,
  {
    label: string
    color: string
    bgLight: string
    border: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  novo: {
    label: 'Novo Pedido',
    color: 'text-rose-700 dark:text-rose-400',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-300 dark:border-rose-800',
    icon: Bell,
  },
  aceito: {
    label: 'Aceito',
    color: 'text-blue-700 dark:text-blue-400',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-300 dark:border-blue-800',
    icon: Check,
  },
  preparo: {
    label: 'Em Preparo',
    color: 'text-amber-700 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-800',
    icon: Flame,
  },
  pronto: {
    label: 'Pronto',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-800',
    icon: PackageCheck,
  },
  pronto_retirada: {
    label: 'Pronto p/ Retirada',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-800',
    icon: PackageCheck,
  },
  servido: {
    label: 'Servido na Mesa',
    color: 'text-purple-700 dark:text-purple-400',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-300 dark:border-purple-800',
    icon: UtensilsCrossed,
  },
  saiu_entrega: {
    label: 'Saiu para Entrega',
    color: 'text-indigo-700 dark:text-indigo-400',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-300 dark:border-indigo-800',
    icon: Truck,
  },
  entregue: {
    label: 'Entregue',
    color: 'text-teal-700 dark:text-teal-400',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-300 dark:border-teal-800',
    icon: CheckCheck,
  },
  finalizado: {
    label: 'Finalizado',
    color: 'text-neutral-600 dark:text-neutral-400',
    bgLight: 'bg-neutral-100 dark:bg-neutral-800',
    border: 'border-neutral-200 dark:border-neutral-700',
    icon: CheckCheck,
  },
  cancelado: {
    label: 'Cancelado',
    color: 'text-rose-700 dark:text-rose-400',
    bgLight: 'bg-rose-100 dark:bg-rose-950/40',
    border: 'border-rose-300 dark:border-rose-800',
    icon: AlertCircle,
  },
}

const ORIGIN_CONFIG: Record<
  OrderOrigin,
  {
    label: string
    badgeText: string
    color: string
    bgLight: string
    border: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  mesa: {
    label: 'Mesa',
    badgeText: 'Consumo no Local',
    color: 'text-indigo-700 dark:text-indigo-400',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: UtensilsCrossed,
  },
  retirada: {
    label: 'Retirada',
    badgeText: 'Retirada no Balcão',
    color: 'text-amber-700 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    icon: ShoppingBag,
  },
  entrega: {
    label: 'Entrega',
    badgeText: 'Delivery / Entrega',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: Bike,
  },
}

/**
 * Retorna o próximo passo específico do fluxo conforme a origem do pedido
 * 1. MESA: Novo → Aceito → Em preparo → Pronto → Servido → Finalizado
 * 2. RETIRADA: Novo → Aceito → Em preparo → Pronto para retirada → Finalizado
 * 3. ENTREGA: Novo → Aceito → Em preparo → Pronto → Saiu para entrega → Entregue → Finalizado
 */
export function getNextStepForOrder(order: TableOrder): {
  nextStatus: TableOrderStatus
  nextLabel: string
  actionName: string
  buttonClass: string
} | null {
  const origin = getOrderOrigin(order)
  const st = order.status

  if (st === 'finalizado' || st === 'cancelado') {
    return null
  }

  // ETAPA 1: Novo -> Em Preparo (Aceitar Pedido vai direto para Preparo)
  if (st === 'novo') {
    return {
      nextStatus: 'preparo',
      nextLabel: 'Aceitar Pedido',
      actionName: 'pedido aceito e em preparo',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25',
    }
  }

  // Compatibilidade com pedidos legados no status aceito
  if (st === 'aceito') {
    return {
      nextStatus: 'preparo',
      nextLabel: 'Iniciar Preparo',
      actionName: 'entrou em preparo',
      buttonClass: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25',
    }
  }

  // ETAPA 3 em diante por tipo de pedido:
  if (origin === 'mesa') {
    if (st === 'preparo') {
      return {
        nextStatus: 'pronto',
        nextLabel: 'Marcar como Pronto',
        actionName: 'ficou pronto',
        buttonClass: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25',
      }
    }
    if (st === 'pronto') {
      return {
        nextStatus: 'servido',
        nextLabel: 'Marcar como Servido',
        actionName: 'servido',
        buttonClass: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/25',
      }
    }
    if (st === 'servido') {
      return {
        nextStatus: 'finalizado',
        nextLabel: 'Finalizar Pedido',
        actionName: 'finalizado',
        buttonClass: 'bg-neutral-900 hover:bg-neutral-800 shadow-neutral-900/25',
      }
    }
  } else if (origin === 'retirada') {
    if (st === 'preparo') {
      return {
        nextStatus: 'pronto_retirada',
        nextLabel: 'Pronto p/ Retirada',
        actionName: 'ficou pronto',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25',
      }
    }
    if (st === 'pronto' || st === 'pronto_retirada') {
      return {
        nextStatus: 'finalizado',
        nextLabel: 'Finalizar Pedido',
        actionName: 'finalizado',
        buttonClass: 'bg-neutral-900 hover:bg-neutral-800 shadow-neutral-900/25',
      }
    }
  } else {
    // ENTREGA
    if (st === 'preparo') {
      return {
        nextStatus: 'pronto',
        nextLabel: 'Marcar como Pronto',
        actionName: 'ficou pronto',
        buttonClass: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25',
      }
    }
    if (st === 'pronto') {
      return {
        nextStatus: 'saiu_entrega',
        nextLabel: 'Saiu para Entrega',
        actionName: 'saiu para entrega',
        buttonClass: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25',
      }
    }
    if (st === 'saiu_entrega') {
      return {
        nextStatus: 'entregue',
        nextLabel: 'Marcar como Entregue',
        actionName: 'entregue',
        buttonClass: 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/25',
      }
    }
    if (st === 'entregue') {
      return {
        nextStatus: 'finalizado',
        nextLabel: 'Finalizar Pedido',
        actionName: 'finalizado',
        buttonClass: 'bg-neutral-900 hover:bg-neutral-800 shadow-neutral-900/25',
      }
    }
  }

  return null
}

const normalizeTableOrder = (ord: TableOrder): TableOrder => ({
  ...ord,
  items: Array.isArray(ord?.items) ? ord.items : [],
  history: Array.isArray(ord?.history) ? ord.history : [],
})

function createStatusHistoryEvent(
  nextStatus: TableOrderStatus,
  actionName?: string
): TableOrderHistoryEvent {
  const now = new Date()
  const randomSuffix = Math.random().toString(36).substring(2, 7)
  return {
    id: `hist_${now.getTime()}_${randomSuffix}_${nextStatus}`,
    timestamp: now.toISOString(),
    action: actionName || `status alterado para ${nextStatus}`,
    description: `Status atualizado para ${STATUS_META[nextStatus]?.label || nextStatus}`,
    performedBy: 'Operador',
  }
}

// Chime sonoro discreto e agradável via Web Audio API (sem dependência de arquivos externos)
function playNewOrderChime() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => null)
    }
    const now = ctx.currentTime

    // Nota 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0.12, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.22)

    // Nota 2: A5 (880.00 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.12)
    gain2.gain.setValueAtTime(0.15, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.42)
  } catch {
    // Autoplay policy silenciada caso não haja interação prévia
  }
}

export const TableOrdersTab: React.FC<TableOrdersTabProps> = ({
  company,
  onOpenTables,
  onCompanyUpdate,
}) => {
  const [orders, setOrders] = useState<TableOrder[]>(() =>
    (getCompanyTableOrders(company.id) || []).map(normalizeTableOrder)
  )
  const [couriers, setCouriers] = useState<CompanyCourier[]>(() => getCompanyCouriers(company.id))
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'todos' | TableOrderStatus>('todos')
  const [activeOriginFilter, setActiveOriginFilter] = useState<'todos' | OrderOrigin>('todos')
  const [search, setSearch] = useState('')
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Modais
  const [managingOrder, setManagingOrder] = useState<TableOrder | null>(null)
  const [isCouriersModalOpen, setIsCouriersModalOpen] = useState(false)
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false)
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false)
  const [isOrderSettingsOpen, setIsOrderSettingsOpen] = useState(false)
  const [confirmingPixOrder, setConfirmingPixOrder] = useState<TableOrder | null>(null)
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<TableOrder | null>(null)

  // Configurações da Central de Pedidos
  const [soundAlertEnabled, setSoundAlertEnabled] = useState<boolean>(() => company.soundAlertNewOrders !== false)
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState<boolean>(() => Boolean(company.autoAcceptOrders))
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Rastreamento para disparo sonoro de novo pedido (uma única vez)
  const notifiedOrderIdsRef = React.useRef<Set<string>>(new Set())
  const hasInitializedOrdersRef = React.useRef(false)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Monitorar novos pedidos para disparo de alerta sonoro
  useEffect(() => {
    const newOrders = orders.filter((o) => o.status === 'novo')
    if (!hasInitializedOrdersRef.current) {
      newOrders.forEach((o) => notifiedOrderIdsRef.current.add(o.id))
      hasInitializedOrdersRef.current = true
      return
    }

    if (soundAlertEnabled && newOrders.length > 0) {
      let hasFresh = false
      newOrders.forEach((o) => {
        if (!notifiedOrderIdsRef.current.has(o.id)) {
          hasFresh = true
          notifiedOrderIdsRef.current.add(o.id)
        }
      })
      if (hasFresh) {
        playNewOrderChime()
      }
    }
  }, [orders, soundAlertEnabled])

  // Alternar alerta sonoro rápido
  const handleToggleSound = () => {
    const nextVal = !soundAlertEnabled
    setSoundAlertEnabled(nextVal)
    const updatedCompany: Company = {
      ...company,
      soundAlertNewOrders: nextVal,
    }
    saveCompanyLocally(updatedCompany)
    saveCompany(updatedCompany)
    onCompanyUpdate?.(updatedCompany)
    saveCompanyAsync(updatedCompany).catch(() => null)
    showToast(nextVal ? 'Alerta sonoro ativado.' : 'Alerta sonoro silenciado.')
    if (nextVal) {
      playNewOrderChime()
    }
  }

  // Salvar configurações gerais da Central
  const handleSaveCentralSettings = async () => {
    setIsSavingSettings(true)
    const updatedCompany: Company = {
      ...company,
      autoAcceptOrders: autoAcceptEnabled,
      soundAlertNewOrders: soundAlertEnabled,
    }
    saveCompanyLocally(updatedCompany)
    saveCompany(updatedCompany)
    onCompanyUpdate?.(updatedCompany)
    try {
      await saveCompanyAsync(updatedCompany)
      showToast('Configurações da Central de Pedidos salvas com sucesso!')
      setIsOrderSettingsOpen(false)
    } catch {
      showToast('Configurações salvas localmente!')
      setIsOrderSettingsOpen(false)
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Confirmar Pix diretamente pelo card com registro no histórico
  const handleConfirmPixDirect = async (order: TableOrder) => {
    const nowIso = new Date().toISOString()
    const historyEvent: TableOrderHistoryEvent = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_pix_paid`,
      timestamp: nowIso,
      action: 'pagamento pix confirmado',
      description: 'Pagamento Pix confirmado manualmente pelo estabelecimento',
      performedBy: 'Estabelecimento',
    }

    const updatedOrder: TableOrder = {
      ...order,
      paymentStatus: 'paid',
      history: [...(order.history || []), historyEvent],
      updatedAt: nowIso,
    }

    try {
      await updateTableOrderOnServerApi(updatedOrder)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)))
      setConfirmingPixOrder(null)
      showToast('Pagamento Pix confirmado com sucesso!')
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)))
      setConfirmingPixOrder(null)
      showToast('Pagamento Pix confirmado!')
    }
  }

  // Marcar Pix como não localizado diretamente pelo card
  const handleMarkPixNotFoundDirect = async (order: TableOrder) => {
    const nowIso = new Date().toISOString()
    const historyEvent: TableOrderHistoryEvent = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_pix_not_found`,
      timestamp: nowIso,
      action: 'pix não localizado',
      description: 'Pagamento Pix marcado como não localizado pelo estabelecimento',
      performedBy: 'Estabelecimento',
    }

    const updatedOrder: TableOrder = {
      ...order,
      paymentStatus: 'not_found',
      history: [...(order.history || []), historyEvent],
      updatedAt: nowIso,
    }

    try {
      await updateTableOrderOnServerApi(updatedOrder)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)))
      showToast('Pagamento marcado como não localizado.', 'error')
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)))
      showToast('Pagamento marcado como não localizado.', 'error')
    }
  }

  const loadData = useCallback(async (isBackground = false) => {
    if (!company?.id) return
    if (!isBackground) setIsLoading(true)
    try {
      const [serverOrders, serverCouriers] = await Promise.all([
        fetchCompanyTableOrdersFromServer(company.id),
        fetchCompanyCouriersFromServer(company.id),
      ])
      if (serverOrders && Array.isArray(serverOrders)) {
        setOrders(serverOrders.map(normalizeTableOrder))
      }
      if (serverCouriers && Array.isArray(serverCouriers)) {
        setCouriers(serverCouriers)
      }
    } catch {
      const local = getCompanyTableOrders(company.id) || []
      setOrders(local.map(normalizeTableOrder))
      setCouriers(getCompanyCouriers(company.id))
    } finally {
      if (!isBackground) {
        setIsLoading(false)
      }
    }
  }, [company.id])

  // Polling automático para novos pedidos com respeito a visibilidade e desmontagem
  useEffect(() => {
    let isMounted = true
    loadData(false)

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      if (isMounted) {
        loadData(true)
      }
    }, 12000)

    const onDataChange = () => {
      if (isMounted && company.id) {
        setOrders((getCompanyTableOrders(company.id) || []).map(normalizeTableOrder))
        setCouriers(getCompanyCouriers(company.id))
      }
    }
    window.addEventListener(DATA_CHANGE_EVENT, onDataChange)
    window.addEventListener('storage', onDataChange)

    return () => {
      isMounted = false
      clearInterval(timer)
      window.removeEventListener(DATA_CHANGE_EVENT, onDataChange)
      window.removeEventListener('storage', onDataChange)
    }
  }, [loadData, company.id])

  // Atualizar status do pedido com registro automático no histórico
  const handleUpdateStatus = async (
    orderId: string,
    nextStatus: TableOrderStatus,
    actionName?: string
  ) => {
    setUpdatingId(orderId)
    const historyEvent = createStatusHistoryEvent(nextStatus, actionName)
    const nowIso = historyEvent.timestamp

    try {
      const ok = await updateTableOrderStatusOnServerApi(orderId, company.id, nextStatus, historyEvent)
      if (ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: nextStatus,
                  history: [...(o.history || []), historyEvent],
                  updatedAt: nowIso,
                }
              : o
          )
        )
        const statusLabel = STATUS_META[nextStatus]?.label || nextStatus
        showToast(`Status atualizado para: ${statusLabel}`)
      } else {
        showToast('Erro ao atualizar status', 'error')
      }
    } catch (err) {
      console.error('Error updating status:', err)
      showToast('Erro ao atualizar status', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  // Formatação de data e tempo relativo
  const formatOrderTime = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMin = Math.floor(diffMs / 60000)

      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      if (diffMin < 1) return `Agora mesmo (${timeStr})`
      if (diffMin < 60) return `Há ${diffMin} min (${timeStr})`
      const diffHours = Math.floor(diffMin / 60)
      if (diffHours < 24) return `Há ${diffHours}h ${diffMin % 60}m (${timeStr})`
      return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${timeStr}`
    } catch {
      return ''
    }
  }

  // Cálculo de pedidos de hoje
  const isToday = (isoString?: string) => {
    if (!isoString) return true
    try {
      const d = new Date(isoString)
      const now = new Date()
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
    } catch {
      return true
    }
  }

  const todayOrders = orders.filter((o) => isToday(o.createdAt))
  const ordersTodayCount = todayOrders.length

  // Métricas do Topo Solicitadas:
  // 1. Pedidos hoje
  // 2. Novos
  // 3. Em preparo
  // 4. Prontos
  // 5. Em entrega
  // 6. Finalizados
  // 7. Valor total hoje
  // 8. Ticket médio
  const newOrdersCount = orders.filter((o) => o.status === 'novo').length
  const preparingCount = orders.filter((o) => o.status === 'aceito' || o.status === 'preparo').length
  const readyCount = orders.filter(
    (o) => o.status === 'pronto' || o.status === 'pronto_retirada'
  ).length
  const inDeliveryCount = orders.filter((o) => o.status === 'saiu_entrega').length
  const finalizedCount = orders.filter(
    (o) => o.status === 'finalizado' || o.status === 'entregue' || o.status === 'servido'
  ).length

  // Valores financeiros calculados sobre pedidos não cancelados de hoje
  const nonCancelledTodayOrders = todayOrders.filter((o) => o.status !== 'cancelado')
  const totalAmountToday = nonCancelledTodayOrders.reduce(
    (sum, o) => sum + (Number(o.totalAmount) || 0),
    0
  )
  const averageTicketToday =
    nonCancelledTodayOrders.length > 0 ? totalAmountToday / nonCancelledTodayOrders.length : 0

  // Contagens por origem
  const mesaOrdersCount = orders.filter((o) => getOrderOrigin(o) === 'mesa').length
  const retiradaOrdersCount = orders.filter((o) => getOrderOrigin(o) === 'retirada').length
  const entregaOrdersCount = orders.filter((o) => getOrderOrigin(o) === 'entrega').length

  // Filtragem
  const filteredOrders = orders.map(normalizeTableOrder).filter((ord) => {
    // Filtro de Status
    if (activeFilter !== 'todos') {
      if (activeFilter === 'finalizado') {
        if (ord.status !== 'finalizado' && ord.status !== 'entregue' && ord.status !== 'servido') {
          return false
        }
      } else if (activeFilter === 'pronto') {
        if (ord.status !== 'pronto' && ord.status !== 'pronto_retirada') return false
      } else if (ord.status !== activeFilter) {
        return false
      }
    }

    // Filtro de Origem (Mesa, Retirada, Entrega)
    const origin = getOrderOrigin(ord)
    if (activeOriginFilter !== 'todos' && origin !== activeOriginFilter) {
      return false
    }

    // Busca textual
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const safeItems = Array.isArray(ord.items) ? ord.items : []
    return (
      (ord.id || '').toLowerCase().includes(q) ||
      (ord.tableNumber || '').toLowerCase().includes(q) ||
      (ord.customerName && ord.customerName.toLowerCase().includes(q)) ||
      (ord.customerPhone && ord.customerPhone.includes(q)) ||
      (ord.deliveryAddress && ord.deliveryAddress.toLowerCase().includes(q)) ||
      (ord.address && ord.address.toLowerCase().includes(q)) ||
      safeItems.some((it) => (it?.name || '').toLowerCase().includes(q))
    )
  })

  // Enviar entrega para o WhatsApp do Motoboy
  const handleSendToMotoboyWhatsApp = (order: TableOrder) => {
    if (!order.courierPhone) {
      // Abre o modal de gerenciamento para atribuir motoboy
      setManagingOrder(order)
      showToast('Selecione um motoboy para enviar a entrega.', 'error')
      return
    }
    const message = buildCourierDeliveryWhatsAppMessage({
      companyName: company.name,
      order,
    })
    openOrderInWhatsApp(order.courierPhone, message)
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 py-2.5 px-4 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Quick Status */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-2xs">
                <ChefHat className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                    Central de Pedidos Operacional
                  </h2>
                  {newOrdersCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                      {newOrdersCount} NOVO{newOrdersCount > 1 ? 'S' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  Gerenciamento em tempo real para Mesa, Retirada e Entrega com fluxo completo e motoboys.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão + NOVO PEDIDO MANUAL */}
            <button
              type="button"
              onClick={() => setIsManualOrderOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/20 active:scale-95"
              title="Lançar novo pedido manual (balcão, telefone, whatsapp)"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>NOVO PEDIDO</span>
            </button>

            {/* Botão de Motoboys */}
            <button
              type="button"
              onClick={() => setIsCouriersModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Gerenciar motoboys e entregadores"
            >
              <Bike className="w-3.5 h-3.5 text-emerald-600" />
              <span>Motoboys</span>
              {couriers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900">
                  {couriers.filter((c) => c.isActive).length}
                </span>
              )}
            </button>

            {/* Botão de Formas de Pagamento */}
            <button
              type="button"
              onClick={() => setIsPaymentSettingsOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100/80 text-teal-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Configurar formas de pagamento aceitas e Chave Pix"
            >
              <CreditCard className="w-3.5 h-3.5 text-teal-600" />
              <span>Pagamentos</span>
            </button>

            {/* Botão de Configurações da Central (Aceite automático e Alertas) */}
            <button
              type="button"
              onClick={() => setIsOrderSettingsOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Configurar recebimento automático de pedidos e alertas"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden md:inline">Configurações</span>
            </button>

            {/* Botão Rápido de Silenciar / Ativar Som */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                soundAlertEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
              }`}
              title={
                soundAlertEnabled
                  ? 'Alerta sonoro ativado (clique para silenciar)'
                  : 'Alerta sonoro silenciado (clique para ativar)'
              }
            >
              {soundAlertEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-400" />
              )}
            </button>

            {onOpenTables && (
              <button
                type="button"
                onClick={onOpenTables}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-neutral-500" />
                <span>Mesas & QR</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Atualizar lista de pedidos"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>

        {/* 8 INDICADORES PRINCIPAIS DA CENTRAL */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
          {/* 1. Pedidos hoje */}
          <div
            onClick={() => {
              setActiveFilter('todos')
              setActiveOriginFilter('todos')
            }}
            className="p-3 rounded-2xl border border-neutral-200/90 bg-neutral-50 hover:bg-neutral-100/80 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Hoje
              </span>
              <CalendarDays className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <span className="text-lg font-black text-neutral-900 mt-1 block">
              {ordersTodayCount}
            </span>
          </div>

          {/* 2. Novos */}
          <div
            onClick={() => setActiveFilter('novo')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeFilter === 'novo'
                ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/30'
                : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                Novos
              </span>
              <Bell className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <span className="text-lg font-black text-rose-600 mt-1 block">
              {newOrdersCount}
            </span>
          </div>

          {/* 3. Em Preparo */}
          <div
            onClick={() => setActiveFilter('preparo')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeFilter === 'preparo'
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/30'
                : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Preparo
              </span>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="text-lg font-black text-amber-700 mt-1 block">
              {preparingCount}
            </span>
          </div>

          {/* 4. Prontos */}
          <div
            onClick={() => setActiveFilter('pronto')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeFilter === 'pronto'
                ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30'
                : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Prontos
              </span>
              <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-lg font-black text-emerald-700 mt-1 block">
              {readyCount}
            </span>
          </div>

          {/* 5. Em Entrega */}
          <div
            onClick={() => setActiveFilter('saiu_entrega')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeFilter === 'saiu_entrega'
                ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-400/30'
                : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Entrega
              </span>
              <Truck className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <span className="text-lg font-black text-indigo-700 mt-1 block">
              {inDeliveryCount}
            </span>
          </div>

          {/* 6. Finalizados */}
          <div
            onClick={() => setActiveFilter('finalizado')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeFilter === 'finalizado'
                ? 'bg-neutral-100 border-neutral-300 ring-2 ring-neutral-400/30'
                : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                Finalizados
              </span>
              <CheckCheck className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <span className="text-lg font-black text-neutral-800 mt-1 block">
              {finalizedCount}
            </span>
          </div>

          {/* 7. Valor total hoje */}
          <div className="p-3 rounded-2xl border border-teal-200/80 bg-teal-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                Total Hoje
              </span>
              <DollarSign className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <span className="text-sm font-black text-teal-800 mt-1 block font-mono truncate" title={formatMoneyBRL(totalAmountToday)}>
              {formatMoneyBRL(totalAmountToday)}
            </span>
          </div>

          {/* 8. Ticket médio */}
          <div className="p-3 rounded-2xl border border-blue-200/80 bg-blue-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Ticket Médio
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-black text-blue-800 mt-1 block font-mono truncate" title={formatMoneyBRL(averageTicketToday)}>
              {formatMoneyBRL(averageTicketToday)}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="space-y-3">
        {/* Linha 1: Filtro por Status + Busca */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Pills de Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {(
              [
                { key: 'todos', label: 'Todos' },
                { key: 'novo', label: 'Novos', count: newOrdersCount },
                { key: 'aceito', label: 'Aceitos' },
                { key: 'preparo', label: 'Em preparo', count: preparingCount },
                { key: 'pronto', label: 'Prontos', count: readyCount },
                { key: 'saiu_entrega', label: 'Em entrega', count: inDeliveryCount },
                { key: 'finalizado', label: 'Finalizados', count: finalizedCount },
                { key: 'cancelado', label: 'Cancelados' },
              ] as Array<{
                key: 'todos' | TableOrderStatus
                label: string
                count?: number
              }>
            ).map((tab) => {
              const isActive = activeFilter === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Input de Busca */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, mesa, endereço ou pedido..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-teal-500 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Filtro por Origem (Todos / Mesa / Retirada / Entrega) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-neutral-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-neutral-400" />
            <span>Origem:</span>
          </span>

          {(
            [
              { key: 'todos', label: 'Todos', icon: Layers },
              { key: 'mesa', label: 'Mesa', icon: UtensilsCrossed, count: mesaOrdersCount },
              { key: 'retirada', label: 'Retirada', icon: ShoppingBag, count: retiradaOrdersCount },
              { key: 'entrega', label: 'Entrega', icon: Bike, count: entregaOrdersCount },
            ] as Array<{
              key: 'todos' | OrderOrigin
              label: string
              icon: React.ComponentType<{ className?: string }>
              count?: number
            }>
          ).map((orig) => {
            const Icon = orig.icon
            const isActive = activeOriginFilter === orig.key
            return (
              <button
                key={orig.key}
                type="button"
                onClick={() => setActiveOriginFilter(orig.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{orig.label}</span>
                {orig.count !== undefined && orig.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-teal-800 text-white' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {orig.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista de Pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-neutral-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <ChefHat className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-sm font-bold text-neutral-800">
            {search ? 'Nenhum pedido encontrado com esse termo' : 'Nenhum pedido nesta etapa'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {search
              ? 'Tente buscar por outro nome, telefone, mesa ou endereço.'
              : 'Quando chegarem novos pedidos (Mesa, Retirada ou Entrega), eles aparecerão aqui automaticamente.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isNovo = order.status === 'novo'
            const statusMeta = STATUS_META[order.status] || STATUS_META.novo
            const StatusIcon = statusMeta.icon
            const origin = getOrderOrigin(order)
            const originMeta = ORIGIN_CONFIG[origin] || ORIGIN_CONFIG.mesa
            const OriginIcon = originMeta.icon
            const orderItems = Array.isArray(order?.items) ? order.items : []
            const totalItemsCount = orderItems.reduce((acc, it) => acc + (it?.quantity || 1), 0)
            const nextStep = getNextStepForOrder(order)
            const isDelivery = origin === 'entrega'

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                  isNovo
                    ? 'border-rose-400 shadow-lg ring-2 ring-rose-400/20 shadow-rose-500/10'
                    : order.status === 'cancelado'
                    ? 'border-neutral-200 bg-neutral-50/50 opacity-80'
                    : 'border-neutral-200 shadow-xs'
                }`}
              >
                {/* Alerta Visual de NOVO PEDIDO */}
                {isNovo && (
                  <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 px-4 sm:px-6 py-2.5 sm:py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-black tracking-wide shadow-md">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-rose-700 font-black text-xs shadow-xs animate-pulse">
                        <Bell className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                        <span>🔔 NOVO PEDIDO</span>
                      </span>
                      <span className="text-[11px] font-bold bg-black/25 px-2.5 py-1 rounded-lg text-white">
                        Chegou {formatOrderTime(order.createdAt)} ({originMeta.label})
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'preparo', 'pedido aceito e em preparo')}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-rose-700 font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto active:scale-95"
                    >
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span>ACEITAR PEDIDO</span>
                    </button>
                  </div>
                )}

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Topo do Pedido: Origem, Horário, Botão Gerenciar e Status Atual */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Badge Origem Destacado */}
                      <div
                        className={`px-3.5 py-2 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2 shadow-xs shrink-0 ${
                          origin === 'mesa'
                            ? 'bg-neutral-900 text-white'
                            : origin === 'retirada'
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        <OriginIcon className="w-4 h-4 text-teal-300" />
                        <span>
                          {origin === 'mesa'
                            ? order.tableNumber || 'Mesa'
                            : origin === 'retirada'
                            ? 'Retirada no Balcão'
                            : 'Entrega (Delivery)'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-800">
                            Pedido #{order.id.slice(-6).toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${originMeta.bgLight} ${originMeta.border} ${originMeta.color}`}>
                            {originMeta.label}
                          </span>
                          {order.isManualOrder && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                              Lançado Manualmente
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span>{formatOrderTime(order.createdAt)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Badge do Status Atual e Botão Gerenciar Pedido */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${statusMeta.bgLight} ${statusMeta.border} ${statusMeta.color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusMeta.label}</span>
                      </div>

                      {/* Botão GERENCIAR PEDIDO */}
                      <button
                        type="button"
                        onClick={() => setManagingOrder(order)}
                        className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Edit className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Gerenciar / Detalhes</span>
                      </button>
                    </div>
                  </div>

                  {/* DESTAQUE OPERACIONAL PIX PENDENTE / AGUARDANDO CONFIRMAÇÃO */}
                  {order.paymentMethod === 'pix' &&
                    (order.paymentStatus === 'awaiting_confirmation' ||
                      order.paymentStatus === 'pending') && (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/60 border-2 border-amber-300/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs">
                            <QrCode className="w-3.5 h-3.5" />
                            <span>💠 PIX</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-200/90 text-amber-950 border border-amber-300 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                            <span>🟡 AGUARDANDO CONFIRMAÇÃO</span>
                          </span>
                          {order.receiptUrl ? (
                            <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-lg border border-teal-300">
                              📎 Comprovante Anexado
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-neutral-500 italic">
                              (Sem comprovante anexado)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                          {order.receiptUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingReceiptOrder(order)}
                              className="px-3 py-1.5 rounded-xl border border-teal-300 bg-white hover:bg-teal-50 text-teal-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Visualizar imagem do comprovante"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-600" />
                              <span>VER COMPROVANTE</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setConfirmingPixOrder(order)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title="Confirmar que o valor entrou na conta"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>CONFIRMAR PIX</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMarkPixNotFoundDirect(order)}
                            className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-[11px] font-bold transition-all cursor-pointer"
                            title="Marcar pagamento Pix como não localizado"
                          >
                            <span>Não Localizado</span>
                          </button>
                        </div>
                      </div>
                    )}

                  {/* SEÇÃO FORMA DE PAGAMENTO & STATUS FINANCEIRO */}
                  <div className="p-3 rounded-2xl bg-neutral-50/90 border border-neutral-150 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {order.paymentMethod === 'pix' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
                            <QrCode className="w-3.5 h-3.5 text-teal-600" />
                            <span>PIX</span>
                          </span>

                          {order.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Pix Pago</span>
                            </span>
                          ) : order.paymentStatus === 'awaiting_confirmation' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Aguardando Confirmação</span>
                            </span>
                          ) : order.paymentStatus === 'not_found' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Pagamento Não Localizado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pix Pendente</span>
                            </span>
                          )}
                        </div>
                      ) : order.paymentMethod === 'dinheiro' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                            <span>DINHEIRO</span>
                          </span>

                          {order.paymentChangeFor && Number(order.paymentChangeFor) > Number(order.totalAmount) ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-neutral-800 font-semibold bg-emerald-100/60 border border-emerald-200">
                              <span>Troco para {formatMoneyBRL(order.paymentChangeFor)}</span>
                              <strong className="text-emerald-700 font-bold">
                                (Levar {formatMoneyBRL(Number(order.paymentChangeFor) - Number(order.totalAmount))})
                              </strong>
                            </span>
                          ) : (
                            <span className="text-neutral-500 font-medium">
                              (Não precisa de troco / Valor exato)
                            </span>
                          )}
                        </div>
                      ) : order.paymentMethod === 'cartao_credito' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                            <span>CARTÃO DE CRÉDITO</span>
                          </span>
                          <span className="text-neutral-500 font-medium text-[11px]">
                            Pagamento na {origin === 'entrega' ? 'entrega (maquininha)' : origin === 'retirada' ? 'retirada no balcão' : 'mesa'}
                          </span>
                        </div>
                      ) : order.paymentMethod === 'cartao_debito' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
                            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                            <span>CARTÃO DE DÉBITO</span>
                          </span>
                          <span className="text-neutral-500 font-medium text-[11px]">
                            Pagamento na {origin === 'entrega' ? 'entrega (maquininha)' : origin === 'retirada' ? 'retirada no balcão' : 'mesa'}
                          </span>
                        </div>
                      ) : order.paymentMethod === 'vale_refeicao' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
                            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                            <span>VALE-REFEIÇÃO</span>
                          </span>
                          <span className="text-neutral-500 font-medium text-[11px]">
                            Pagamento no recebimento
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                            <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{order.paymentMethod ? order.paymentMethod.toUpperCase() : 'PAGAMENTO A COMBINAR'}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Atalho para Ver Comprovante se anexado */}
                    {order.receiptUrl && (
                      <button
                        type="button"
                        onClick={() => setManagingOrder(order)}
                        className="px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition-all shrink-0"
                        title="Abrir detalhes e conferir comprovante"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Comprovante</span>
                      </button>
                    )}
                  </div>

                  {/* Informações do Cliente */}
                  {(order.customerName || order.customerPhone) && (
                    <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-150 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 flex-wrap">
                        {order.customerName && (
                          <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
                            <User className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{order.customerName}</span>
                          </div>
                        )}

                        {order.customerPhone && (
                          <div className="flex items-center gap-1.5 text-neutral-600">
                            <Phone className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{formatPhone(order.customerPhone)}</span>
                          </div>
                        )}
                      </div>

                      {order.customerPhone && (
                        <a
                          href={getWhatsappLink(
                            order.customerPhone,
                            `Olá ${order.customerName || ''}, referente ao seu pedido #${order.id.slice(-6).toUpperCase()} (${originMeta.label}) no ${company.name}:`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 transition-all"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>Falar no WhatsApp</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Endereço de Entrega (quando for Entrega) */}
                  {origin === 'entrega' && (order.deliveryAddress || order.address) && (
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-700 block">
                            Endereço de Entrega:
                          </span>
                          <p className="font-medium text-emerald-950 leading-relaxed">
                            {order.deliveryAddress || order.address}
                          </p>
                        </div>
                      </div>

                      <a
                        href={
                          order.locationUrl ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            order.deliveryAddress || order.address || ''
                          )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-teal-800 hover:underline font-bold shrink-0 self-end sm:self-center"
                      >
                        Abrir Mapa
                      </a>
                    </div>
                  )}

                  {/* SEÇÃO MOTOBOY DO PEDIDO DE ENTREGA */}
                  {origin === 'entrega' && (
                    <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-800 block">
                            Entregador / Motoboy:
                          </span>
                          <span className="font-bold text-neutral-900">
                            {order.courierName ? order.courierName : 'Nenhum motoboy atribuído'}
                          </span>
                          {order.courierPhone && (
                            <span className="text-neutral-500 text-[11px] ml-1">
                              ({formatPhone(order.courierPhone)})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {order.courierPhone ? (
                          <button
                            type="button"
                            onClick={() => handleSendToMotoboyWhatsApp(order)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Enviar Entrega p/ WhatsApp</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setManagingOrder(order)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>Chamar Motoboy</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mesa (quando houver e for mesa) */}
                  {origin === 'mesa' && order.tableNumber && (
                    <div className="px-3 py-2 rounded-xl bg-neutral-50/80 border border-neutral-150 text-xs text-neutral-700 flex items-center gap-2">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="font-semibold">Consumo Local:</span>
                      <span className="font-bold text-neutral-900">{order.tableNumber}</span>
                    </div>
                  )}

                  {/* Itens do Pedido */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Itens do Pedido ({totalItemsCount})
                    </span>

                    {orderItems.length > 0 ? (
                      <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-150 bg-neutral-50/50 p-2 sm:p-3 space-y-2">
                        {orderItems.map((item, idx) => (
                          <div key={item.id || idx} className="pt-2 first:pt-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <span className="px-2 py-0.5 rounded-lg bg-neutral-900 text-white font-mono font-bold text-xs shrink-0">
                                  {item.quantity || 1}x
                                </span>
                                <div>
                                  <h4 className="font-bold text-neutral-900 text-xs sm:text-sm leading-snug">
                                    {item.name || 'Item'}
                                  </h4>
                                </div>
                              </div>

                              <span className="text-xs font-black text-neutral-800 font-mono shrink-0">
                                {formatMoneyBRL(item.totalPrice || 0)}
                              </span>
                            </div>

                            {/* Detalhes: Variações, Tamanhos, Sabores e Adicionais */}
                            <div className="pl-8 space-y-0.5 text-[11px] text-neutral-600">
                              {item.sizeName && (
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-neutral-700">Tamanho:</span>
                                  <span>{item.sizeName}</span>
                                </div>
                              )}

                              {Array.isArray(item.flavors) && item.flavors.length > 0 && (
                                <div className="flex items-start gap-1">
                                  <span className="font-semibold text-neutral-700">Sabores:</span>
                                  <span>{item.flavors.join(', ')}</span>
                                </div>
                              )}

                              {Array.isArray(item.customSteps) && item.customSteps.length > 0 && (
                                <div className="space-y-0.5">
                                  {item.customSteps.map((cs, cidx) => (
                                    <div key={cidx} className="flex items-start gap-1">
                                      <span className="font-semibold text-neutral-700">{cs.stepTitle}:</span>
                                      <span>{Array.isArray(cs.options) ? cs.options.join(', ') : ''}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {Array.isArray(item.extras) && item.extras.length > 0 && (
                                <div className="flex items-start gap-1 text-teal-700 font-medium">
                                  <span className="font-bold">+ Adicionais:</span>
                                  <span>{item.extras.join(', ')}</span>
                                </div>
                              )}

                              {Array.isArray(item.removals) && item.removals.length > 0 && (
                                <div className="flex items-start gap-1 text-rose-600">
                                  <span className="font-bold">Sem:</span>
                                  <span>{item.removals.join(', ')}</span>
                                </div>
                              )}

                              {item.notes && (
                                <div className="italic text-neutral-500">
                                  &quot;{item.notes}&quot;
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl border border-neutral-150 bg-neutral-50/50 text-xs text-neutral-400 italic text-center">
                        Nenhum item discriminado neste pedido
                      </div>
                    )}
                  </div>

                  {/* Observação Geral do Pedido (se houver) */}
                  {order.notes && (
                    <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-0.5">
                      <span className="font-bold uppercase text-[10px] tracking-wider text-amber-700 block">
                        Observação Geral:
                      </span>
                      <p className="font-medium italic">&quot;{order.notes}&quot;</p>
                    </div>
                  )}

                  {/* Rodapé: Total e Botões de Fluxo do Status */}
                  <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-neutral-400 font-semibold">Total do Pedido:</span>
                      <span className="text-xl font-black text-teal-600 font-mono">
                        {formatMoneyBRL(order.totalAmount)}
                      </span>
                      {order.discount ? (
                        <span className="text-[10px] text-rose-600 font-bold">
                          (Desc: -{formatMoneyBRL(order.discount)})
                        </span>
                      ) : null}
                    </div>

                    {/* Ações de Transição de Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* BOTÃO DA PRÓXIMA ETAPA VISÍVEL */}
                      {nextStep && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() =>
                            handleUpdateStatus(order.id, nextStep.nextStatus, nextStep.actionName)
                          }
                          className={`py-2 px-4 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 ${nextStep.buttonClass}`}
                        >
                          <span>{nextStep.nextLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Seletor manual para mudar para qualquer status */}
                      <select
                        value={order.status === 'entregue' ? 'finalizado' : order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleUpdateStatus(order.id, e.target.value as TableOrderStatus)
                        }
                        className="py-1.5 px-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 text-xs font-semibold focus:outline-hidden focus:border-teal-500 cursor-pointer"
                      >
                        <option value="novo">Novo</option>
                        <option value="aceito">Aceito</option>
                        <option value="preparo">Em preparo</option>
                        <option value="pronto">Pronto</option>
                        <option value="pronto_retirada">Pronto p/ retirada</option>
                        <option value="servido">Servido</option>
                        <option value="saiu_entrega">Saiu p/ entrega</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Gerenciamento Completo do Pedido */}
      {managingOrder && (
        <OrderManagementModal
          order={managingOrder}
          company={company}
          isOpen={Boolean(managingOrder)}
          onClose={() => setManagingOrder(null)}
          onOrderUpdated={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
            setManagingOrder(null)
          }}
          onOpenCouriersManager={() => {
            setIsCouriersModalOpen(true)
          }}
        />
      )}

      {/* Modal de Motoboys */}
      {isCouriersModalOpen && (
        <CouriersModal
          company={company}
          isOpen={isCouriersModalOpen}
          onClose={() => setIsCouriersModalOpen(false)}
        />
      )}

      {/* Modal de Configuração de Formas de Pagamento */}
      {isPaymentSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                  <CreditCard className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900">
                    Configurar Formas de Pagamento
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Habilite formas de recebimento e configure seus dados Pix para os clientes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentSettingsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <PaymentSettingsSection
                company={company}
                onCompanyUpdate={onCompanyUpdate}
              />
            </div>

            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPaymentSettingsOpen(false)}
                className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Pedido Manual (+ NOVO PEDIDO) */}
      {isManualOrderOpen && (
        <ManualOrderModal
          company={company}
          isOpen={isManualOrderOpen}
          onClose={() => setIsManualOrderOpen(false)}
          onOrderCreated={(newOrder) => {
            setOrders((prev) => [normalizeTableOrder(newOrder), ...prev])
            showToast('Pedido manual criado com sucesso!')
          }}
        />
      )}

      {/* Modal de Confirmação de Recebimento do Pix */}
      {confirmingPixOrder && (
        <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-neutral-100 flex items-center gap-3 bg-teal-50/70">
              <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-sm">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-neutral-900 text-base">
                  Confirmar Recebimento Pix
                </h3>
                <p className="text-xs text-neutral-500 truncate">
                  Pedido #{confirmingPixOrder.id.slice(-4)} • {confirmingPixOrder.customerName || 'Cliente'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingPixOrder(null)}
                className="p-1 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-amber-950 mb-0.5">
                    Você verificou que o valor realmente entrou na conta bancária?
                  </strong>
                  Certifique-se no aplicativo do seu banco antes de aprovar. Comprovantes falsos podem ser enviados.
                </div>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-2 text-xs">
                <div className="flex justify-between items-center text-neutral-600">
                  <span>Valor do Pedido:</span>
                  <span className="font-black text-sm text-neutral-900">
                    {formatMoneyBRL(confirmingPixOrder.totalAmount ?? confirmingPixOrder.total ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-neutral-600">
                  <span>Forma escolhida:</span>
                  <span className="font-semibold text-neutral-800">Pix</span>
                </div>
                {(confirmingPixOrder.receiptUrl || confirmingPixOrder.paymentReceiptUrl) && (
                  <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
                    <span className="text-neutral-500">Comprovante anexado:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const targetOrd = confirmingPixOrder
                        setConfirmingPixOrder(null)
                        setViewingReceiptOrder(targetOrd)
                      }}
                      className="text-teal-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Visualizar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmingPixOrder(null)}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-200/70 font-semibold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPixDirect(confirmingPixOrder)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Sim, Pagamento Confirmado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização Rápida de Comprovante */}
      {viewingReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">
                    Comprovante de Pagamento
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Pedido #{viewingReceiptOrder.id.slice(-4)} • {formatMoneyBRL(viewingReceiptOrder.totalAmount ?? viewingReceiptOrder.total ?? 0)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceiptOrder(null)}
                className="p-1.5 rounded-xl hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-neutral-900/5 min-h-[300px]">
              {viewingReceiptOrder.receiptUrl || viewingReceiptOrder.paymentReceiptUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewingReceiptOrder.receiptUrl || viewingReceiptOrder.paymentReceiptUrl}
                  alt="Comprovante Pix"
                  referrerPolicy="no-referrer"
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md border border-neutral-200 bg-white"
                />
              ) : (
                <div className="text-center py-12 text-neutral-400 text-sm">
                  Nenhum comprovante anexado a este pedido.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between gap-2">
              {viewingReceiptOrder.receiptUrl || viewingReceiptOrder.paymentReceiptUrl ? (
                <a
                  href={viewingReceiptOrder.receiptUrl || viewingReceiptOrder.paymentReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`comprovante_pedido_${viewingReceiptOrder.id.slice(-4)}.jpg`}
                  className="px-3.5 py-2 rounded-xl border border-neutral-300 hover:bg-white text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Abrir Original
                </a>
              ) : <div />}

              <div className="flex items-center gap-2">
                {viewingReceiptOrder.paymentStatus !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingReceiptOrder
                      setViewingReceiptOrder(null)
                      setConfirmingPixOrder(target)
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirmar Pix
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingReceiptOrder(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configurações da Central de Pedidos */}
      {isOrderSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-neutral-900 text-white">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900">
                    Configurações da Central de Pedidos
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Ajuste o fluxo de recepção e alertas operacionais
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderSettingsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Opção 1: Aceitar Pedidos Automaticamente */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition-colors">
                <label className="flex items-start gap-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAcceptEnabled}
                    onChange={(e) => setAutoAcceptEnabled(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded-md text-teal-600 border-neutral-300 focus:ring-teal-500 cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-sm text-neutral-900 block">
                      Aceitar pedidos automaticamente
                    </span>
                    <span className="text-xs text-neutral-500 mt-1 block leading-relaxed">
                      Ao habilitar, novos pedidos feitos pelos clientes no Cardápio Digital entram direto no status <strong>&quot;Em preparo&quot;</strong>, sem a necessidade de clicar em &quot;Aceitar pedido&quot;.
                    </span>
                  </div>
                </label>
              </div>

              {/* Opção 2: Alerta sonoro de novos pedidos */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition-colors space-y-3">
                <label className="flex items-start gap-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundAlertEnabled}
                    onChange={(e) => setSoundAlertEnabled(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded-md text-teal-600 border-neutral-300 focus:ring-teal-500 cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-sm text-neutral-900 block">
                      Alerta sonoro de novos pedidos
                    </span>
                    <span className="text-xs text-neutral-500 mt-1 block leading-relaxed">
                      Toca um sinal sonoro suave e elegante uma única vez sempre que um novo pedido chegar à Central.
                    </span>
                  </div>
                </label>

                <div className="pl-8 pt-1">
                  <button
                    type="button"
                    onClick={() => playNewOrderChime()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                    Testar som de notificação
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsOrderSettingsOpen(false)}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-200/70 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCentralSettings}
                disabled={isSavingSettings}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingSettings ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
