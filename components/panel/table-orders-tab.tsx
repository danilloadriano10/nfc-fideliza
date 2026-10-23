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
} from 'lucide-react'
import { Company, TableOrder, TableOrderStatus, OrderOrigin } from '@/types/platform'
import {
  getCompanyTableOrders,
  fetchCompanyTableOrdersFromServer,
  updateTableOrderStatusOnServerApi,
  DATA_CHANGE_EVENT,
} from '@/lib/storage'
import { formatMoneyBRL } from '@/lib/order-delivery'
import { formatPhone, getWhatsappLink } from '@/lib/utils'

interface TableOrdersTabProps {
  company: Company
  onOpenTables?: () => void
}

const STATUS_CONFIG: Record<
  TableOrderStatus,
  {
    label: string
    color: string
    bgLight: string
    border: string
    icon: React.ComponentType<{ className?: string }>
    nextStatus?: TableOrderStatus
    nextLabel?: string
  }
> = {
  novo: {
    label: 'Novo Pedido',
    color: 'text-rose-700 dark:text-rose-400',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-300 dark:border-rose-800',
    icon: Bell,
    nextStatus: 'aceito',
    nextLabel: 'Aceitar Pedido',
  },
  aceito: {
    label: 'Aceito',
    color: 'text-blue-700 dark:text-blue-400',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-300 dark:border-blue-800',
    icon: Check,
    nextStatus: 'preparo',
    nextLabel: 'Iniciar Preparo',
  },
  preparo: {
    label: 'Em Preparo',
    color: 'text-amber-700 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-800',
    icon: Flame,
    nextStatus: 'pronto',
    nextLabel: 'Marcar como Pronto',
  },
  pronto: {
    label: 'Pronto p/ Servir',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-800',
    icon: PackageCheck,
    nextStatus: 'finalizado',
    nextLabel: 'Finalizar Pedido',
  },
  finalizado: {
    label: 'Finalizado',
    color: 'text-neutral-600 dark:text-neutral-400',
    bgLight: 'bg-neutral-100 dark:bg-neutral-800',
    border: 'border-neutral-200 dark:border-neutral-700',
    icon: CheckCheck,
    nextStatus: undefined,
    nextLabel: undefined,
  },
  entregue: {
    label: 'Finalizado',
    color: 'text-neutral-600 dark:text-neutral-400',
    bgLight: 'bg-neutral-100 dark:bg-neutral-800',
    border: 'border-neutral-200 dark:border-neutral-700',
    icon: CheckCheck,
    nextStatus: undefined,
    nextLabel: undefined,
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
    badgeText: 'Mesa',
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

const normalizeTableOrder = (ord: TableOrder): TableOrder => ({
  ...ord,
  items: Array.isArray(ord?.items) ? ord.items : [],
})

export const TableOrdersTab: React.FC<TableOrdersTabProps> = ({ company, onOpenTables }) => {
  const [orders, setOrders] = useState<TableOrder[]>(() =>
    (getCompanyTableOrders(company.id) || []).map(normalizeTableOrder)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'todos' | TableOrderStatus>('todos')
  const [activeOriginFilter, setActiveOriginFilter] = useState<'todos' | OrderOrigin>('todos')
  const [search, setSearch] = useState('')
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  const loadOrders = useCallback(async (isBackground = false) => {
    if (!company?.id) return
    if (!isBackground) setIsLoading(true)
    try {
      const serverOrders = await fetchCompanyTableOrdersFromServer(company.id)
      if (serverOrders && Array.isArray(serverOrders)) {
        setOrders(serverOrders.map(normalizeTableOrder))
      }
    } catch {
      const local = getCompanyTableOrders(company.id) || []
      setOrders(local.map(normalizeTableOrder))
    } finally {
      if (!isBackground) {
        setIsLoading(false)
      }
    }
  }, [company.id])

  // Polling automático para novos pedidos com respeito a visibilidade e desmontagem
  useEffect(() => {
    let isMounted = true
    loadOrders(false)

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      if (isMounted) {
        loadOrders(true)
      }
    }, 15000)

    const onDataChange = () => {
      if (isMounted && company.id) {
        setOrders((getCompanyTableOrders(company.id) || []).map(normalizeTableOrder))
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
  }, [loadOrders, company.id])

  // Atualizar status do pedido
  const handleUpdateStatus = async (orderId: string, nextStatus: TableOrderStatus) => {
    setUpdatingId(orderId)
    try {
      const ok = await updateTableOrderStatusOnServerApi(orderId, company.id, nextStatus)
      if (ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus, updatedAt: new Date().toISOString() } : o))
        )
        const statusLabel = STATUS_CONFIG[nextStatus]?.label || nextStatus
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

  // Formatação de data e hora
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
  const newOrdersCount = orders.filter((o) => o.status === 'novo').length
  const preparingCount = orders.filter((o) => o.status === 'aceito' || o.status === 'preparo').length
  const finalizedCount = orders.filter((o) => o.status === 'finalizado' || o.status === 'entregue').length
  const totalAmountToday = todayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
  const averageTicketToday = ordersTodayCount > 0 ? totalAmountToday / ordersTodayCount : 0

  // Contagens por origem
  const mesaOrdersCount = orders.filter((o) => getOrderOrigin(o) === 'mesa').length
  const retiradaOrdersCount = orders.filter((o) => getOrderOrigin(o) === 'retirada').length
  const entregaOrdersCount = orders.filter((o) => getOrderOrigin(o) === 'entrega').length

  // Filtragem
  const filteredOrders = orders.map(normalizeTableOrder).filter((ord) => {
    // Filtro de Status
    if (activeFilter !== 'todos') {
      if (activeFilter === 'finalizado') {
        if (ord.status !== 'finalizado' && ord.status !== 'entregue') return false
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
      safeItems.some((it) => (it?.name || '').toLowerCase().includes(q))
    )
  })

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
      <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-2xs">
                <ChefHat className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                    Central de Pedidos
                  </h2>
                  {newOrdersCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                      {newOrdersCount} NOVO{newOrdersCount > 1 ? 'S' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  Gerencie todos os pedidos em tempo real: Mesa, Retirada e Entrega (Novo → Aceito → Em preparo → Pronto → Finalizado)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTables && (
              <button
                type="button"
                onClick={onOpenTables}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-neutral-500" />
                <span>Mesas & QR Codes</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => loadOrders(false)}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Atualizar lista de pedidos"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>

        {/* Métricas Principais da Central de Pedidos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {/* 1. Pedidos hoje */}
          <div
            onClick={() => {
              setActiveFilter('todos')
              setActiveOriginFilter('todos')
            }}
            className="p-3.5 rounded-2xl border border-neutral-200/90 bg-neutral-50 hover:bg-neutral-100/80 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Pedidos Hoje
              </span>
              <CalendarDays className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <span className="text-xl font-black text-neutral-900 mt-1 block">
              {ordersTodayCount}
            </span>
          </div>

          {/* 2. Novos */}
          <div
            onClick={() => setActiveFilter('novo')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              activeFilter === 'novo'
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/30'
                : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                Novos
              </span>
              <Bell className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <span className="text-xl font-black text-rose-600 mt-1 block">
              {newOrdersCount}
            </span>
          </div>

          {/* 3. Em Preparo */}
          <div
            onClick={() => setActiveFilter('preparo')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              activeFilter === 'preparo'
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30'
                : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Em Preparo
              </span>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="text-xl font-black text-amber-700 mt-1 block">
              {preparingCount}
            </span>
          </div>

          {/* 4. Finalizados */}
          <div
            onClick={() => setActiveFilter('finalizado')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
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
            <span className="text-xl font-black text-neutral-800 mt-1 block">
              {finalizedCount}
            </span>
          </div>

          {/* 5. Valor total hoje */}
          <div className="p-3.5 rounded-2xl border border-teal-200/80 bg-teal-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                Valor Total Hoje
              </span>
              <DollarSign className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <span className="text-lg font-black text-teal-800 mt-1 block font-mono truncate" title={formatMoneyBRL(totalAmountToday)}>
              {formatMoneyBRL(totalAmountToday)}
            </span>
          </div>

          {/* 6. Ticket médio */}
          <div className="p-3.5 rounded-2xl border border-blue-200/80 bg-blue-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Ticket Médio
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-lg font-black text-blue-800 mt-1 block font-mono truncate" title={formatMoneyBRL(averageTicketToday)}>
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
                { key: 'pronto', label: 'Prontos' },
                { key: 'finalizado', label: 'Finalizados', count: finalizedCount },
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
              placeholder="Buscar por cliente, mesa, rua ou item..."
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
            const statusMeta = STATUS_CONFIG[order.status] || STATUS_CONFIG.novo
            const StatusIcon = statusMeta.icon
            const origin = getOrderOrigin(order)
            const originMeta = ORIGIN_CONFIG[origin] || ORIGIN_CONFIG.mesa
            const OriginIcon = originMeta.icon
            const orderItems = Array.isArray(order?.items) ? order.items : []
            const totalItemsCount = orderItems.reduce((acc, it) => acc + (it?.quantity || 1), 0)

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                  isNovo
                    ? 'border-rose-400 shadow-lg ring-2 ring-rose-400/20 shadow-rose-500/10'
                    : 'border-neutral-200 shadow-xs'
                }`}
              >
                {/* Alerta Visual de NOVO PEDIDO */}
                {isNovo && (
                  <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 px-5 py-2 text-white flex items-center justify-between text-xs font-black tracking-wide">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                      <span>NOVO PEDIDO NA CENTRAL ({originMeta.label.toUpperCase()}) — ATENÇÃO</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-md">
                      Aguardando Aceite
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Topo do Pedido: Origem, Horário e Status Atual */}
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
                            ? (order.tableNumber || 'Mesa')
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
                        </div>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span>{formatOrderTime(order.createdAt)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Badge do Status Atual */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${statusMeta.bgLight} ${statusMeta.border} ${statusMeta.color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusMeta.label}</span>
                      </div>
                    </div>
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
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2.5">
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
                  )}

                  {/* Mesa (quando houver e não for entrega/retirada) */}
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
                              {/* Tamanho */}
                              {item.sizeName && (
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-neutral-700">Tamanho:</span>
                                  <span>{item.sizeName}</span>
                                </div>
                              )}

                              {/* Sabores */}
                              {Array.isArray(item.flavors) && item.flavors.length > 0 && (
                                <div className="flex items-start gap-1">
                                  <span className="font-semibold text-neutral-700">Sabores:</span>
                                  <span>{item.flavors.join(', ')}</span>
                                </div>
                              )}

                              {/* Etapas / Custom steps */}
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

                              {/* Adicionais / Extras */}
                              {Array.isArray(item.extras) && item.extras.length > 0 && (
                                <div className="flex items-start gap-1 text-teal-700 font-medium">
                                  <span className="font-bold">+ Adicionais:</span>
                                  <span>{item.extras.join(', ')}</span>
                                </div>
                              )}

                              {/* Removals */}
                              {Array.isArray(item.removals) && item.removals.length > 0 && (
                                <div className="flex items-start gap-1 text-rose-600">
                                  <span className="font-bold">Sem:</span>
                                  <span>{item.removals.join(', ')}</span>
                                </div>
                              )}

                              {/* Notas do item */}
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
                    </div>

                    {/* Ações de Transição de Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusMeta.nextStatus && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => handleUpdateStatus(order.id, statusMeta.nextStatus!)}
                          className={`py-2 px-4 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 ${
                            isNovo
                              ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                              : order.status === 'aceito'
                              ? 'bg-amber-600 hover:bg-amber-500'
                              : order.status === 'preparo'
                              ? 'bg-emerald-600 hover:bg-emerald-500'
                              : 'bg-teal-600 hover:bg-teal-500'
                          }`}
                        >
                          <span>{statusMeta.nextLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Seletor manual para mudar para qualquer status */}
                      <select
                        value={order.status === 'entregue' ? 'finalizado' : order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as TableOrderStatus)}
                        className="py-1.5 px-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 text-xs font-semibold focus:outline-hidden focus:border-teal-500 cursor-pointer"
                      >
                        <option value="novo">Novo</option>
                        <option value="aceito">Aceito</option>
                        <option value="preparo">Em preparo</option>
                        <option value="pronto">Pronto</option>
                        <option value="finalizado">Finalizado</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
