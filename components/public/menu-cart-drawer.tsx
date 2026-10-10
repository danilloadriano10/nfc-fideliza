'use client'

import React from 'react'
import {
  X,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  MessageCircle,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react'
import { Company } from '@/types/platform'
import { CartItem } from './menu-item-modal'

interface MenuCartDrawerProps {
  isOpen: boolean
  cart: CartItem[]
  company: Company
  isDark: boolean
  onClose: () => void
  onUpdateQuantity: (cartItemId: string, newQty: number) => void
  onRemoveItem: (cartItemId: string) => void
  onClearCart: () => void
}

export const MenuCartDrawer: React.FC<MenuCartDrawerProps> = ({
  isOpen,
  cart,
  company,
  isDark,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  if (!isOpen) return null

  const totalOrder = cart.reduce((acc, item) => acc + item.totalPrice, 0)
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  // Generate and send WhatsApp message
  const handleSendOrderWhatsApp = () => {
    if (cart.length === 0) return

    const phoneRaw = company.whatsapp || ''
    const phoneClean = phoneRaw.replace(/\D/g, '')
    const phoneWithDdi = phoneClean.startsWith('55') ? phoneClean : `55${phoneClean}`

    // Construct text
    let message = `👋 Olá! Gostaria de fazer um pedido pelo cardápio da *${company.name}*:\n\n`
    message += `📋 *RESUMO DO PEDIDO:*\n\n`

    cart.forEach((item, index) => {
      message += `${item.quantity}x *${item.menuItem.name}* — ${formatMoney(item.totalPrice)}\n`

      // Size
      if (item.options.size) {
        message += `   • Tamanho: ${item.options.size.name}${
          item.options.size.price > 0 ? ` (+${formatMoney(item.options.size.price)})` : ''
        }\n`
      }

      // Flavors
      if (item.options.flavors && item.options.flavors.length > 0) {
        message += `   • Sabores: ${item.options.flavors.join(', ')}\n`
      }

      // Custom Steps (Monte seu pedido)
      if (item.options.customSteps && item.options.customSteps.length > 0) {
        item.options.customSteps.forEach((st) => {
          if (st.selected && st.selected.length > 0) {
            const optsText = st.selected
              .map((o) => `${o.name}${o.price > 0 ? ` (+${formatMoney(o.price)})` : ''}`)
              .join(', ')
            message += `   • ${st.stepTitle}: ${optsText}\n`
          }
        })
      }

      // Extras
      if (item.options.extras && item.options.extras.length > 0) {
        const extrasText = item.options.extras
          .map((e) => `${e.name} (+${formatMoney(e.price)})`)
          .join(', ')
        message += `   • Adicionais: ${extrasText}\n`
      }

      // Removals
      if (item.options.removals && item.options.removals.length > 0) {
        message += `   • Retirar: ${item.options.removals.join(', ')}\n`
      }

      // Notes
      if (item.options.notes) {
        message += `   • Obs: "${item.options.notes}"\n`
      }

      message += `\n`
    })

    message += `--------------------------------\n`
    message += `💰 *Valor Total do Pedido: ${formatMoney(totalOrder)}*\n`
    message += `--------------------------------\n\n`
    message += `Por favor, confirme o recebimento do pedido e o tempo estimado! Obrigado.`

    const url = `https://wa.me/${phoneWithDdi}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md h-full flex flex-col shadow-2xl border-l transition-all animate-in slide-in-from-right duration-200 ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-neutral-800 bg-neutral-950/40' : 'border-neutral-100 bg-neutral-50/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Seu Pedido</h3>
              <p className="text-[11px] text-neutral-400">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'} adicionados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-[11px] text-neutral-400 hover:text-red-400 transition-all px-2 py-1"
                title="Limpar sacola"
              >
                Limpar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 divide-y divide-neutral-200/40 dark:divide-neutral-800">
          {cart.length === 0 ? (
            <div className="text-center py-16 px-4">
              <UtensilsCrossed className="w-12 h-12 text-neutral-500 opacity-40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-neutral-400">
                Sua sacola está vazia
              </h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Escolha itens deliciosos no cardápio para montar seu pedido.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
              >
                Ver Cardápio
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold leading-tight">
                      {item.quantity}x {item.menuItem.name}
                    </h4>
                    <span className="text-[11px] font-extrabold text-teal-500">
                      {formatMoney(item.totalPrice)}
                    </span>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div
                      className={`flex items-center rounded-lg border ${
                        isDark ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-neutral-400 hover:text-white transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-[11px] font-bold font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-neutral-400 hover:text-white transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 transition-all rounded-lg"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Options Breakdown */}
                <div
                  className={`p-2.5 rounded-xl text-[11px] space-y-1 ${
                    isDark ? 'bg-neutral-800/60 text-neutral-300' : 'bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {/* Size */}
                  {item.options.size && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-neutral-400">Tamanho:</span>
                      <span>{item.options.size.name}</span>
                      {item.options.size.price > 0 && (
                        <span className="text-emerald-500">
                          (+{formatMoney(item.options.size.price)})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Flavors */}
                  {item.options.flavors && item.options.flavors.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-neutral-400">Sabores:</span>
                      <span>{item.options.flavors.join(', ')}</span>
                    </div>
                  )}

                  {/* Custom Steps */}
                  {item.options.customSteps &&
                    item.options.customSteps.map((st, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <span className="font-semibold text-violet-400">
                          {st.stepTitle}:
                        </span>
                        <span className="pl-2">
                          {st.selected
                            .map(
                              (o) =>
                                `${o.name}${o.price > 0 ? ` (+${formatMoney(o.price)})` : ''}`
                            )
                            .join(', ')}
                        </span>
                      </div>
                    ))}

                  {/* Extras */}
                  {item.options.extras && item.options.extras.length > 0 && (
                    <div className="flex items-start gap-1">
                      <span className="font-semibold text-neutral-400">Adicionais:</span>
                      <span>
                        {item.options.extras
                          .map((e) => `${e.name} (+${formatMoney(e.price)})`)
                          .join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Removals */}
                  {item.options.removals && item.options.removals.length > 0 && (
                    <div className="flex items-start gap-1 text-red-400">
                      <span className="font-semibold">Sem:</span>
                      <span>{item.options.removals.join(', ')}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {item.options.notes && (
                    <div className="pt-0.5 italic text-neutral-400">
                      &quot;{item.options.notes}&quot;
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with WhatsApp Order Button */}
        {cart.length > 0 && (
          <div
            className={`p-4 border-t space-y-3 shrink-0 ${
              isDark ? 'border-neutral-800 bg-neutral-950/70' : 'border-neutral-100 bg-neutral-50'
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-neutral-400 font-semibold">
                Total do Pedido:
              </span>
              <span className="text-xl font-black text-teal-500">
                {formatMoney(totalOrder)}
              </span>
            </div>

            <button
              onClick={handleSendOrderWhatsApp}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Pedir pelo WhatsApp</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            <p className="text-[10px] text-center text-neutral-400">
              O pedido detalhado será enviado diretamente para o WhatsApp da empresa.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
