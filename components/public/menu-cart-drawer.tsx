'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  MessageCircle,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Truck,
  Store,
} from 'lucide-react'
import { Company } from '@/types/platform'
import { CartItem } from './menu-item-modal'
import { DeliveryOptionsForm } from './delivery-options-form'
import {
  OrderDeliveryInfo,
  buildMenuOrderWhatsAppMessage,
  formatMoneyBRL,
  loadSavedDeliveryInfo,
  openOrderInWhatsApp,
  saveDeliveryInfo,
} from '@/lib/order-delivery'
import { saveCompanyTableOrderOnServerApi } from '@/lib/storage'

interface MenuCartDrawerProps {
  isOpen: boolean
  cart: CartItem[]
  company: Company
  isDark: boolean
  initialStep?: 'items' | 'delivery'
  initialCustomerName?: string
  initialCustomerPhone?: string
  autoDetectedTable?: string | null
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
  initialStep = 'items',
  initialCustomerName,
  initialCustomerPhone,
  autoDetectedTable,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [step, setStep] = useState<'items' | 'delivery'>(initialStep)
  const [deliveryInfo, setDeliveryInfo] = useState<OrderDeliveryInfo>(() => {
    const saved = loadSavedDeliveryInfo(company.id)
    return {
      deliveryType: autoDetectedTable ? 'dine_in' : (saved.deliveryType || 'delivery'),
      customerName: initialCustomerName || saved.customerName || '',
      customerPhone: initialCustomerPhone || saved.customerPhone || '',
      tableNumber: autoDetectedTable || saved.tableNumber || '',
      address: saved.address || '',
      number: saved.number || '',
      neighborhood: saved.neighborhood || '',
      complement: saved.complement || '',
      reference: saved.reference || '',
      locationCoordinates: null,
      locationUrl: null,
    }
  })

  // Synchronize detected table from QR
  useEffect(() => {
    if (autoDetectedTable) {
      setDeliveryInfo((prev) => ({
        ...prev,
        deliveryType: 'dine_in',
        tableNumber: autoDetectedTable,
      }))
    }
  }, [autoDetectedTable])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Reset or update step when opening
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep)
      setFormErrors({})
      // Merge initial customer info if provided
      setDeliveryInfo((prev) => {
        const saved = loadSavedDeliveryInfo(company.id)
        return {
          ...prev,
          customerName: prev.customerName || initialCustomerName || saved.customerName || '',
          customerPhone: prev.customerPhone || initialCustomerPhone || saved.customerPhone || '',
          address: prev.address || saved.address || '',
          number: prev.number || saved.number || '',
          neighborhood: prev.neighborhood || saved.neighborhood || '',
          complement: prev.complement || saved.complement || '',
          reference: prev.reference || saved.reference || '',
        }
      })
    }
  }, [isOpen, initialStep, initialCustomerName, initialCustomerPhone, company.id])

  if (!isOpen) return null

  const totalOrder = cart.reduce((acc, item) => acc + item.totalPrice, 0)
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  const validateDeliveryForm = (): boolean => {
    const errs: Record<string, string> = {}

    if (!deliveryInfo.customerName || !deliveryInfo.customerName.trim()) {
      errs.customerName = 'Por favor, informe seu nome completo.'
    }

    if (!deliveryInfo.customerPhone || !deliveryInfo.customerPhone.trim()) {
      errs.customerPhone = 'Por favor, informe seu telefone com DDD.'
    } else {
      const digits = deliveryInfo.customerPhone.replace(/\D/g, '')
      if (digits.length < 10) {
        errs.customerPhone = 'Telefone incompleto (informe DDD + número).'
      }
    }

    if (deliveryInfo.deliveryType === 'delivery') {
      if (!deliveryInfo.address || !deliveryInfo.address.trim()) {
        errs.address = 'Informe a rua ou avenida de entrega.'
      }
      if (!deliveryInfo.number || !deliveryInfo.number.trim()) {
        errs.number = 'Informe o número ou S/N.'
      }
      if (!deliveryInfo.neighborhood || !deliveryInfo.neighborhood.trim()) {
        errs.neighborhood = 'Informe o bairro.'
      }
    }

    if (deliveryInfo.deliveryType === 'dine_in') {
      const activeTable = deliveryInfo.tableNumber || autoDetectedTable
      if (!activeTable || !activeTable.trim()) {
        errs.tableNumber = 'Por favor, informe o número da sua mesa.'
      }
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Generate and send WhatsApp message with delivery options
  const handleFinalizeWhatsAppOrder = () => {
    if (cart.length === 0) return
    if (!validateDeliveryForm()) return

    // Persist delivery info for customer convenience
    saveDeliveryInfo(deliveryInfo, company.id)

    // Registrar imediatamente na Central de Pedidos (Mesa, Retirada ou Entrega)
    const orderItems = cart.map((c) => ({
      id: c.id,
      menuItemId: c.menuItem.id,
      name: c.menuItem.name,
      quantity: c.quantity,
      unitPrice: c.totalPrice / (c.quantity || 1),
      totalPrice: c.totalPrice,
      sizeName: c.options.size?.name,
      flavors: c.options.flavors,
      extras: c.options.extras?.map((e) => e.name),
      removals: c.options.removals,
      notes: c.options.notes,
      customSteps: c.options.customSteps?.map((cs) => ({
        stepTitle: cs.stepTitle,
        options: cs.selected.map((s) => s.name),
      })),
    }))

    const orderType =
      deliveryInfo.deliveryType === 'delivery'
        ? 'entrega'
        : deliveryInfo.deliveryType === 'pickup'
        ? 'retirada'
        : 'mesa'

    const activeTable =
      orderType === 'mesa'
        ? deliveryInfo.tableNumber || autoDetectedTable || 'Mesa do Salão'
        : orderType === 'retirada'
        ? 'Retirada no Balcão'
        : 'Entrega Delivery'

    const formattedAddress =
      orderType === 'entrega'
        ? `${deliveryInfo.address || ''}, ${deliveryInfo.number || 'S/N'}${
            deliveryInfo.complement ? ` (${deliveryInfo.complement})` : ''
          } - ${deliveryInfo.neighborhood || ''}${
            deliveryInfo.city ? `, ${deliveryInfo.city}` : ''
          }${deliveryInfo.referencePoint ? ` [Ref: ${deliveryInfo.referencePoint}]` : ''}`
        : undefined

    saveCompanyTableOrderOnServerApi({
      id: '',
      companyId: company.id,
      orderType,
      origin: orderType,
      tableNumber: activeTable,
      deliveryAddress: formattedAddress,
      customerName: deliveryInfo.customerName,
      customerPhone: deliveryInfo.customerPhone,
      items: orderItems,
      totalAmount: totalOrder,
      notes: deliveryInfo.notes,
      status: 'novo',
      createdAt: new Date().toISOString(),
    }).catch((err) => console.error('Erro ao registrar pedido na Central de Pedidos:', err))

    const message = buildMenuOrderWhatsAppMessage({
      companyName: company.name,
      cart,
      totalOrder,
      deliveryInfo: {
        ...deliveryInfo,
        tableNumber: deliveryInfo.tableNumber || autoDetectedTable || '',
      },
    })

    openOrderInWhatsApp(company.whatsapp, message)
    onClose()
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
            {step === 'delivery' ? (
              <button
                type="button"
                onClick={() => setStep('items')}
                className="p-1.5 rounded-xl hover:bg-neutral-800/60 text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                title="Voltar aos itens do pedido"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-semibold">Itens</span>
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold">
                {step === 'delivery' ? 'Opções de Entrega' : 'Seu Pedido'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {step === 'delivery'
                  ? `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'itens'} • ${formatMoneyBRL(totalOrder)}`
                  : `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'itens'} adicionados`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'items' && cart.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-[11px] text-neutral-400 hover:text-red-400 transition-all px-2 py-1 cursor-pointer"
                title="Limpar sacola"
              >
                Limpar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {step === 'items' ? (
            /* PASSO 1: Itens do Carrinho */
            cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-3 text-neutral-500">
                  <UtensilsCrossed className="w-8 h-8 opacity-40" />
                </div>
                <h4 className="text-sm font-bold text-neutral-300">Sua sacola está vazia</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                  Adicione pratos deliciosos e bebidas do cardápio para fazer o seu pedido.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isDark
                        ? 'bg-neutral-800/40 border-neutral-700/60'
                        : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold leading-snug">
                          {item.menuItem.name}
                        </h4>
                        <span className="text-xs font-semibold text-teal-500 block mt-0.5">
                          {formatMoneyBRL(item.totalPrice)}
                        </span>
                      </div>

                      {/* Quantity Controller & Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          className={`flex items-center rounded-xl border ${
                            isDark
                              ? 'border-neutral-700 bg-neutral-800'
                              : 'border-neutral-200 bg-white'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-neutral-400 hover:text-white transition-all cursor-pointer"
                            aria-label="Diminuir"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-neutral-400 hover:text-white transition-all cursor-pointer"
                            aria-label="Aumentar"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 text-neutral-400 hover:text-red-400 transition-all cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Detalhes / Customizações do item */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-700/40 space-y-1 text-[11px] text-neutral-400">
                      {/* Tamanho */}
                      {item.options.size && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-neutral-300">Tamanho:</span>
                          <span>
                            {item.options.size.name}
                            {item.options.size.price > 0 &&
                              ` (${formatMoneyBRL(item.options.size.price)})`}
                          </span>
                        </div>
                      )}

                      {/* Sabores */}
                      {item.options.flavors && item.options.flavors.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-neutral-300">Sabores:</span>
                          <span>{item.options.flavors.join(', ')}</span>
                        </div>
                      )}

                      {/* Custom Steps */}
                      {item.options.customSteps &&
                        item.options.customSteps.map((st, i) => (
                          <div key={i} className="flex flex-col gap-0.5">
                            <span className="font-semibold text-teal-400">
                              {st.stepTitle}:
                            </span>
                            <span className="pl-2">
                              {st.selected
                                .map(
                                  (o) =>
                                    `${o.name}${o.price > 0 ? ` (+${formatMoneyBRL(o.price)})` : ''}`
                                )
                                .join(', ')}
                            </span>
                          </div>
                        ))}

                      {/* Extras */}
                      {item.options.extras && item.options.extras.length > 0 && (
                        <div className="flex items-start gap-1">
                          <span className="font-semibold text-neutral-300">Adicionais:</span>
                          <span>
                            {item.options.extras
                              .map((e) => `${e.name} (+${formatMoneyBRL(e.price)})`)
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
                ))}
              </div>
            )
          ) : (
            /* PASSO 2: Formulário de Entrega / Retirada */
            <div className="space-y-4">
              {/* Mini resumo dos itens */}
              <div
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                  isDark ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    Resumo do Pedido
                  </span>
                  <span className="font-semibold">
                    {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'} no carrinho
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    Total
                  </span>
                  <span className="text-base font-black text-teal-500 font-mono">
                    {formatMoneyBRL(totalOrder)}
                  </span>
                </div>
              </div>

              {/* Formulário reutilizável de Entrega */}
              <DeliveryOptionsForm
                info={deliveryInfo}
                onChange={setDeliveryInfo}
                isDark={isDark}
                errors={formErrors}
                autoDetectedTable={autoDetectedTable}
              />
            </div>
          )}
        </div>

        {/* Footer */}
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
              <span className="text-xl font-black text-teal-500 font-mono">
                {formatMoneyBRL(totalOrder)}
              </span>
            </div>

            {step === 'items' ? (
              <button
                type="button"
                onClick={() => setStep('delivery')}
                className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Avançar para Opções de Entrega</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalizeWhatsAppOrder}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4.5 h-4.5 fill-white shrink-0" />
                <span>Confirmar e Pedir no WhatsApp</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            )}

            <p className="text-[10px] text-center text-neutral-400">
              {step === 'items'
                ? 'Você escolherá entrega ou retirada no próximo passo.'
                : 'O pedido detalhado será enviado diretamente para o WhatsApp da empresa.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
