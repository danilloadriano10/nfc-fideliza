'use client'

import React, { useEffect, useState, use } from 'react'
import {
  Bike,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  RotateCw,
  Clock,
  ShieldCheck,
  CreditCard,
  Banknote,
  QrCode,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react'
import { TableOrder } from '@/types/platform'
import {
  formatMoneyBRL,
  formatStructuredDeliveryAddress,
  formatSingleLineAddress,
} from '@/lib/order-delivery'
import { formatPhone, getWhatsappLink } from '@/lib/utils'

interface PageProps {
  params: Promise<{ orderId: string }>
}

export default function CourierDeliveryPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const orderId = resolvedParams.orderId

  const [order, setOrder] = useState<TableOrder | null>(null)
  const [company, setCompany] = useState<{ id: string; name: string; phone?: string; whatsapp?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Input de código de 4 dígitos
  const [deliveryCodeInput, setDeliveryCodeInput] = useState('')
  const [isSubmittingCode, setIsSubmittingCode] = useState(false)
  const [codeFeedback, setCodeFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showItems, setShowItems] = useState(false)

  const loadOrder = async () => {
    if (!orderId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/table-orders?orderId=${encodeURIComponent(orderId)}`)
      const data = await res.json()
      if (data.success && data.order) {
        setOrder(data.order)
        if (data.company) {
          setCompany(data.company)
        }
      } else {
        setError(data.error || 'Pedido não encontrado.')
      }
    } catch {
      setError('Erro ao carregar dados da entrega. Verifique sua conexão.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = deliveryCodeInput.trim()
    if (cleanCode.length !== 4) {
      setCodeFeedback({ text: 'Digite o código de 4 dígitos.', type: 'error' })
      return
    }

    setIsSubmittingCode(true)
    setCodeFeedback(null)

    try {
      const res = await fetch('/api/table-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_delivery_code',
          orderId,
          code: cleanCode,
        }),
      })

      const data = await res.json()
      if (data.success && data.order) {
        setOrder(data.order)
        setCodeFeedback({ text: 'Entrega confirmada com sucesso!', type: 'success' })
      } else {
        setCodeFeedback({
          text: data.error || 'Código incorreto. Peça ao cliente o código de 4 dígitos do aplicativo.',
          type: 'error',
        })
      }
    } catch {
      setCodeFeedback({ text: 'Erro ao validar código. Verifique sua conexão.', type: 'error' })
    } finally {
      setIsSubmittingCode(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4">
        <RotateCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm font-semibold text-neutral-300">Carregando dados da rota de entrega...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Entrega não localizada</h2>
        <p className="text-sm text-neutral-400 max-w-sm mb-6">{error || 'Este pedido não existe ou foi removido.'}</p>
        <button
          type="button"
          onClick={loadOrder}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  const isCompleted = order.status === 'entregue' || order.status === 'finalizado'

  const structuredAddressText =
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

  const singleLineAddress =
    formatSingleLineAddress({
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
    }) ||
    order.deliveryAddress ||
    order.address ||
    ''

  const mapsUrl =
    order.locationUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(singleLineAddress)}`

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-12">
      {/* Top Bar do Entregador */}
      <header className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-sm text-white leading-tight">Painel do Entregador</h1>
            <p className="text-[11px] text-neutral-400 truncate max-w-[200px] sm:max-w-xs">
              {company?.name || 'Estabelecimento'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadOrder}
          className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
          title="Atualizar dados"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Status Card */}
        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono font-bold text-neutral-400">
              PEDIDO #{order.id.slice(-6).toUpperCase()}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : order.status === 'saiu_entrega'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isCompleted ? '✓ Entregue' : order.status === 'saiu_entrega' ? '🛵 Em Rota' : order.status}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-neutral-800">
            <span className="text-xs text-neutral-400">Valor do Pedido:</span>
            <span className="text-2xl font-black font-mono text-emerald-400">
              {formatMoneyBRL(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Informações de Pagamento & Cobrança */}
        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-4 sm:p-5 shadow-lg space-y-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 block">
            Instrução de Cobrança ao Motoboy
          </span>

          {order.paymentMethod === 'pix' ? (
            order.paymentStatus === 'paid' ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 space-y-1">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>JÁ ESTÁ PAGO VIA PIX</span>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  Não cobrar nada do cliente na entrega. Apenas solicite o código de 4 dígitos.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-black text-sm text-amber-300">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>PIX PENDENTE DE CONFIRMAÇÃO</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Confirme com a loja antes de liberar a entrega se o Pix caiu na conta.
                </p>
              </div>
            )
          ) : order.paymentMethod === 'dinheiro' ? (
            <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm text-amber-300">
                  <Banknote className="w-5 h-5 text-amber-400" />
                  <span>COBRAR EM DINHEIRO:</span>
                </div>
                <span className="text-base font-black font-mono text-amber-300">
                  {formatMoneyBRL(order.totalAmount)}
                </span>
              </div>
              {order.paymentChangeFor && Number(order.paymentChangeFor) > order.totalAmount ? (
                <p className="text-xs text-amber-300/90 font-bold">
                  ⚠️ Levar troco para {formatMoneyBRL(order.paymentChangeFor)} (Troco:{' '}
                  {formatMoneyBRL(order.paymentChangeFor - order.totalAmount)})
                </p>
              ) : (
                <p className="text-xs text-amber-200/90">Cliente informou valor exato (sem troco).</p>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm text-indigo-300">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <span>COBRAR NA MAQUININHA:</span>
                </div>
                <span className="text-base font-black font-mono text-indigo-300">
                  {formatMoneyBRL(order.totalAmount)}
                </span>
              </div>
              <p className="text-xs text-indigo-200/90">
                Forma indicada: {order.paymentMethod?.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          )}
        </div>

        {/* Cliente & Endereço */}
        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                Cliente
              </span>
              <h2 className="text-base font-bold text-white">{order.customerName || 'Cliente'}</h2>
            </div>

            {order.customerPhone && (
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
                  title="Ligar para o cliente"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                </a>
                <a
                  href={getWhatsappLink(
                    order.customerPhone,
                    `Olá ${order.customerName || ''}, sou o entregador do seu pedido #${order.id.slice(-6).toUpperCase()} no ${company?.name || ''}. Estou a caminho!`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  title="WhatsApp do cliente"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Endereço de Entrega</span>
            </span>

            <div className="text-sm font-semibold text-white leading-relaxed whitespace-pre-line bg-neutral-950/70 p-3 rounded-2xl border border-neutral-800/80">
              {structuredAddressText || 'Endereço a confirmar com a loja'}
            </div>

            {order.referencePoint && (
              <p className="text-xs text-neutral-400 bg-neutral-850 p-2 rounded-xl">
                📍 Ponto de Referência: <span className="text-neutral-200">{order.referencePoint}</span>
              </p>
            )}

            {order.notes && (
              <p className="text-xs text-amber-300/90 bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl">
                💬 Observação: &quot;{order.notes}&quot;
              </p>
            )}

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <span>Abrir Rota no Google Maps</span>
              <ExternalLink className="w-4 h-4 text-emerald-400" />
            </a>
          </div>
        </div>

        {/* Validação do Código de 4 Dígitos */}
        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-sm text-white">Confirmação de Entrega</h3>
          </div>

          {isCompleted ? (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-black text-base text-emerald-300">Entrega Concluída com Sucesso!</h4>
              <p className="text-xs text-emerald-200/80">
                O pedido foi finalizado no sistema e registrado no histórico.
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <p className="text-xs text-neutral-300 leading-relaxed">
                Solicite ao cliente o <strong>código de 4 dígitos</strong> que aparece na tela de acompanhamento dele:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={deliveryCodeInput}
                  onChange={(e) => setDeliveryCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  className="flex-1 px-4 py-3 text-center font-mono font-black text-2xl tracking-[0.5em] rounded-2xl bg-neutral-950 border border-neutral-700 text-white focus:outline-hidden focus:border-emerald-500"
                />

                <button
                  type="submit"
                  disabled={isSubmittingCode || deliveryCodeInput.length !== 4}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm transition-all shadow-md disabled:opacity-40 cursor-pointer"
                >
                  {isSubmittingCode ? (
                    <RotateCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Validar</span>
                  )}
                </button>
              </div>

              {codeFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    codeFeedback.type === 'success'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                  }`}
                >
                  {codeFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{codeFeedback.text}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Itens do Pedido (Colapsável) */}
        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-4 shadow-lg space-y-2">
          <button
            type="button"
            onClick={() => setShowItems(!showItems)}
            className="w-full flex items-center justify-between text-xs font-bold text-neutral-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-neutral-400" />
              <span>Itens da Entrega ({order.items?.length || 0})</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showItems ? 'rotate-180' : ''}`} />
          </button>

          {showItems && (
            <div className="pt-2 divide-y divide-neutral-800 space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">
                      {item.quantity}x {item.name}
                    </span>
                    {item.sizeName && <p className="text-[11px] text-neutral-400">Tamanho: {item.sizeName}</p>}
                    {item.notes && <p className="text-[11px] text-amber-300/80 italic">&quot;{item.notes}&quot;</p>}
                  </div>
                  <span className="font-mono text-neutral-300 font-bold">
                    {formatMoneyBRL(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
