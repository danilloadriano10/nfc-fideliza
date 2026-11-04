'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Search,
  Clock,
  CheckCircle2,
  Package,
  Bike,
  UtensilsCrossed,
  MapPin,
  RefreshCw,
  Phone,
  MessageCircle,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { Company, TableOrder, TableOrderStatus } from '@/types/platform'
import { formatPhone, normalizePhone } from '@/lib/utils'
import { getPublicTheme } from '@/lib/public-themes'

interface OrderTrackerSheetProps {
  isOpen: boolean
  onClose: () => void
  company: Company
  initialOrderId?: string
}

export const OrderTrackerSheet: React.FC<OrderTrackerSheetProps> = ({
  isOpen,
  onClose,
  company,
  initialOrderId,
}) => {
  const [searchInput, setSearchInput] = useState('')
  const [orders, setOrders] = useState<TableOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<TableOrder | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Theme styling
  const activeTheme = useMemo(
    () => getPublicTheme(company.theme, company.customThemeConfig, company.themeColors),
    [company.theme, company.customThemeConfig, company.themeColors]
  )
  const isDark = activeTheme.isDarkBase ?? false
  const primaryColor = activeTheme.colors.primary || company.primaryColor || '#6D28D9'

  const fetchOrdersForCustomer = useCallback(
    async (term: string) => {
      const cleanTerm = term.trim()
      if (!cleanTerm) return
      setIsLoading(true)
      setError(null)
      setHasSearched(true)

      try {
        const res = await fetch(`/api/table-orders?companyId=${encodeURIComponent(company.id)}`, {
          cache: 'no-store',
        })
        const data = await res.json()
        if (res.ok && Array.isArray(data.orders)) {
          const cleanPhoneTerm = normalizePhone(cleanTerm)
          const matched = data.orders.filter((o: TableOrder) => {
            if (o.companyId !== company.id) return false
            if (o.id === cleanTerm || o.id?.toLowerCase() === cleanTerm.toLowerCase()) return true
            if (cleanPhoneTerm && cleanPhoneTerm.length >= 8) {
              const p = normalizePhone(o.customerPhone || '')
              return p.includes(cleanPhoneTerm) || cleanPhoneTerm.includes(p)
            }
            return false
          })

          setOrders(matched)
          if (matched.length === 1) {
            setSelectedOrder(matched[0])
          } else if (matched.length > 1) {
            // Se o usuário procurou um id específico, seleciona ele
            const exactId = matched.find((o: TableOrder) => o.id === cleanTerm)
            setSelectedOrder(exactId || matched[0])
          } else {
            setSelectedOrder(null)
          }
        } else {
          setError('Não foi possível carregar os pedidos no momento.')
        }
      } catch (err) {
        console.warn('Erro ao buscar pedidos:', err)
        setError('Falha de conexão ao buscar pedido.')
      } finally {
        setIsLoading(false)
      }
    },
    [company.id]
  )

  // On open, load initial order or last stored order
  useEffect(() => {
    if (isOpen) {
      if (initialOrderId) {
        setSearchInput(initialOrderId)
        fetchOrdersForCustomer(initialOrderId)
      } else {
        // Check localStorage for last order
        try {
          const stored = localStorage.getItem(`diretolink_last_order_${company.id}`)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed?.id) {
              setSearchInput(parsed.customerPhone || parsed.id)
              fetchOrdersForCustomer(parsed.id)
              return
            }
          }
        } catch {}
      }
    }
  }, [isOpen, initialOrderId, company.id, fetchOrdersForCustomer])

  const handleRefreshStatus = () => {
    if (selectedOrder) {
      fetchOrdersForCustomer(selectedOrder.id)
    } else if (searchInput) {
      fetchOrdersForCustomer(searchInput)
    }
  }

  // Delivery status pipeline definition
  const getSteps = (order: TableOrder) => {
    const isDelivery = order.orderType === 'entrega' || order.origin === 'entrega'
    const isPickup = order.orderType === 'retirada' || order.origin === 'retirada'

    if (isDelivery) {
      return [
        { key: 'novo', label: 'Recebido' },
        { key: 'aceito', label: 'Confirmado' },
        { key: 'preparo', label: 'Em Preparo' },
        { key: 'pronto', label: 'Pronto' },
        { key: 'saiu_entrega', label: 'A Caminho' },
        { key: 'entregue', label: 'Entregue' },
      ]
    }

    if (isPickup) {
      return [
        { key: 'novo', label: 'Recebido' },
        { key: 'aceito', label: 'Confirmado' },
        { key: 'preparo', label: 'Em Preparo' },
        { key: 'pronto_retirada', label: 'Pronto p/ Retirada' },
        { key: 'finalizado', label: 'Retirado' },
      ]
    }

    // Salão / Mesa
    return [
      { key: 'novo', label: 'Recebido' },
      { key: 'aceito', label: 'Confirmado' },
      { key: 'preparo', label: 'Em Preparo' },
      { key: 'pronto', label: 'Pronto' },
      { key: 'servido', label: 'Servido' },
    ]
  }

  const getStepIndex = (status: TableOrderStatus, steps: Array<{ key: string }>) => {
    if (status === 'cancelado') return -1
    // Mapeamentos equivalentes
    if (status === 'pronto_retirada') {
      const idx = steps.findIndex((s) => s.key === 'pronto_retirada' || s.key === 'pronto')
      if (idx !== -1) return idx
    }
    if (status === 'finalizado') {
      return steps.length - 1
    }
    const idx = steps.findIndex((s) => s.key === status)
    return idx !== -1 ? idx : 0
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className={`relative w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] h-[92vh] sm:h-auto sm:max-h-[88vh] border ${
            isDark ? 'bg-[#121217] border-white/10 text-white' : 'bg-white border-neutral-200 text-neutral-900'
          }`}
          style={{
            backgroundColor: activeTheme.modalBg,
            borderColor: activeTheme.containerBorderColor,
          }}
        >
          {/* Header Superior */}
          <div
            className={`p-3.5 sm:p-4 border-b shrink-0 flex items-center justify-between gap-3 ${
              isDark ? 'bg-[#15151c] border-white/[0.08]' : 'bg-neutral-50 border-neutral-200'
            }`}
            style={{
              backgroundColor: activeTheme.fixedAreaBg,
              borderColor: activeTheme.containerBorderColor,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base tracking-tight truncate">
                    Acompanhar Pedido
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </div>
                <p className={`text-xs truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {company.name} · Status em tempo real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {selectedOrder && (
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={isLoading}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/10 text-neutral-300' : 'hover:bg-neutral-200 text-neutral-700'
                  }`}
                  title="Atualizar status agora"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-white/10 text-neutral-300' : 'hover:bg-neutral-200 text-neutral-700'
                }`}
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Campo de Busca por Telefone ou Código */}
          <div
            className={`p-3 border-b shrink-0 ${
              isDark ? 'bg-[#101015] border-white/[0.06]' : 'bg-neutral-50/70 border-neutral-100'
            }`}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault()
                fetchOrdersForCustomer(searchInput)
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Seu WhatsApp ou código do pedido..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-xl font-bold text-xs text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Buscar</span>}
              </button>
            </form>
          </div>

          {/* Conteúdo Scrollável */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-500 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Múltiplos pedidos encontrados: seletor de pedidos */}
            {orders.length > 1 && !selectedOrder && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-neutral-500">
                  Encontramos {orders.length} pedidos. Selecione um para acompanhar:
                </p>
                {orders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedOrder(o)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{o.id.slice(-6).toUpperCase()}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase">
                          {o.orderType}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        Total: R$ {o.totalAmount.toFixed(2).replace('.', ',')} · {new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Pedido Selecionado */}
            {selectedOrder ? (
              <div className="space-y-4">
                {orders.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="text-xs font-bold hover:underline flex items-center gap-1"
                    style={{ color: primaryColor }}
                  >
                    ← Ver outros pedidos ({orders.length})
                  </button>
                )}

                {/* Banner de Status Principal */}
                {(() => {
                  const steps = getSteps(selectedOrder)
                  const currentIdx = getStepIndex(selectedOrder.status, steps)
                  const isCancelled = selectedOrder.status === 'cancelado'

                  return (
                    <div
                      className={`p-4 rounded-3xl border space-y-4 ${
                        isDark ? 'bg-[#15151c] border-white/10' : 'bg-neutral-50 border-neutral-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                            Código do Pedido
                          </span>
                          <span className="font-mono font-black text-sm sm:text-base">
                            #{selectedOrder.id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                            Modalidade
                          </span>
                          <span className="text-xs font-black capitalize">
                            {selectedOrder.orderType === 'entrega'
                              ? '🛵 Delivery'
                              : selectedOrder.orderType === 'mesa'
                              ? `🍽️ ${selectedOrder.tableNumber || 'Mesa'}`
                              : '🛍️ Retirada'}
                          </span>
                        </div>
                      </div>

                      {/* Stepper Visual */}
                      {isCancelled ? (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-500 text-xs font-bold text-center">
                          Este pedido foi cancelado pelo estabelecimento.
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 text-center">
                            {steps.map((st, idx) => {
                              const isCompleted = idx <= currentIdx
                              const isCurrent = idx === currentIdx
                              return (
                                <div key={st.key} className="flex flex-col items-center">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                      isCompleted
                                        ? 'bg-emerald-500 text-white shadow-xs'
                                        : isDark
                                        ? 'bg-white/10 text-neutral-500'
                                        : 'bg-neutral-200 text-neutral-500'
                                    } ${isCurrent ? 'ring-2 ring-emerald-300 ring-offset-1 animate-pulse' : ''}`}
                                  >
                                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                  </div>
                                  <span
                                    className={`text-[9px] font-bold mt-1 line-clamp-1 leading-tight ${
                                      isCurrent
                                        ? 'text-emerald-500 font-black'
                                        : isCompleted
                                        ? isDark ? 'text-neutral-300' : 'text-neutral-700'
                                        : 'text-neutral-400'
                                    }`}
                                  >
                                    {st.label}
                                  </span>
                                </div>
                              )
                            })}
                          </div>

                          <div className="text-center pt-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                              Status Atual: {steps[currentIdx]?.label || selectedOrder.status}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Informações de Entrega & Motoboy */}
                      {selectedOrder.orderType === 'entrega' && (
                        <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2 text-xs">
                          {selectedOrder.deliveryAddress && (
                            <div className="flex items-start gap-2 text-neutral-600 dark:text-neutral-400">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-500" />
                              <span className="line-clamp-2">{selectedOrder.deliveryAddress}</span>
                            </div>
                          )}

                          {selectedOrder.courierName && (
                            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bike className="w-4 h-4 text-teal-500" />
                                <div>
                                  <span className="text-[10px] font-bold uppercase block text-neutral-400">
                                    Entregador Responsável
                                  </span>
                                  <span className="font-bold text-xs">{selectedOrder.courierName}</span>
                                </div>
                              </div>
                              {selectedOrder.courierPhone && (
                                <a
                                  href={`tel:${selectedOrder.courierPhone}`}
                                  className="px-2 py-1 rounded-lg bg-teal-600 text-white font-bold text-[10px]"
                                >
                                  Ligar
                                </a>
                              )}
                            </div>
                          )}

                          {/* Código de Entrega (se aplicável) */}
                          {selectedOrder.deliveryCode && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-center">
                              <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-600 dark:text-amber-300">
                                Seu Código de Confirmação de Entrega
                              </span>
                              <span className="font-mono font-black text-2xl tracking-widest text-amber-600 dark:text-amber-300">
                                {selectedOrder.deliveryCode}
                              </span>
                              <p className="text-[10px] mt-0.5 opacity-80">
                                Diga este código ao entregador quando seu pedido chegar.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Itens do Pedido */}
                <div
                  className={`p-4 rounded-3xl border space-y-2.5 ${
                    isDark ? 'bg-[#15151c] border-white/10' : 'bg-white border-neutral-200 shadow-2xs'
                  }`}
                >
                  <h4 className="font-black text-xs uppercase tracking-wider text-neutral-400">
                    Itens Pedidos ({selectedOrder.items?.length || 0})
                  </h4>
                  <div className="divide-y divide-black/5 dark:divide-white/5 space-y-2">
                    {selectedOrder.items?.map((it, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-teal-500">{it.quantity}x</span>
                            <span>{it.name}</span>
                          </div>
                          {it.sizeName && (
                            <span className="text-[10px] text-neutral-400 block">{it.sizeName}</span>
                          )}
                        </div>
                        <span className="font-mono font-black text-xs">
                          R$ {it.totalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between font-mono">
                    <span className="text-xs font-bold text-neutral-400">Total do Pedido:</span>
                    <span className="text-base font-black" style={{ color: primaryColor }}>
                      R$ {selectedOrder.totalAmount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Botão de Contato com o Estabelecimento */}
                {company.whatsapp && (
                  <a
                    href={`https://wa.me/${normalizePhone(company.whatsapp)}?text=${encodeURIComponent(
                      `Olá! Gostaria de falar sobre o meu pedido #${selectedOrder.id.slice(-6).toUpperCase()}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Dúvidas sobre o pedido? Falar no WhatsApp</span>
                  </a>
                )}
              </div>
            ) : hasSearched && orders.length === 0 ? (
              <div
                className={`py-12 text-center rounded-2xl border border-dashed space-y-2 ${
                  isDark ? 'border-white/10 text-neutral-400' : 'border-neutral-200 text-neutral-500'
                }`}
              >
                <Package className="w-8 h-8 mx-auto opacity-30 text-neutral-400" />
                <p className="font-bold text-sm">Nenhum pedido encontrado</p>
                <p className="text-xs max-w-xs mx-auto">
                  Verifique se digitou o WhatsApp correto ou o código do pedido fornecido ao finalizar.
                </p>
              </div>
            ) : (
              <div
                className={`py-12 text-center rounded-2xl border border-dashed space-y-2 ${
                  isDark ? 'border-white/10 text-neutral-400' : 'border-neutral-200 text-neutral-500'
                }`}
              >
                <Clock className="w-8 h-8 mx-auto opacity-30 text-neutral-400" />
                <p className="font-bold text-sm">Acompanhe seu pedido em tempo real</p>
                <p className="text-xs max-w-xs mx-auto">
                  Digite seu WhatsApp com DDD acima para consultar o status atual da sua entrega ou preparo.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
