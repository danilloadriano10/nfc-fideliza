'use client'

import React, { useState, useMemo } from 'react'
import {
  X,
  Plus,
  Minus,
  Check,
  Sparkles,
  Layers,
  UtensilsCrossed,
  MessageCircle,
  AlertCircle,
} from 'lucide-react'
import { MenuItem, Company } from '@/types/platform'

export interface CartItemOption {
  size?: { name: string; price: number }
  flavors?: string[]
  extras?: { name: string; price: number }[]
  removals?: string[]
  customSteps?: { stepTitle: string; selected: { name: string; price: number }[] }[]
  notes?: string
}

export interface CartItem {
  id: string // unique cart item id
  menuItem: MenuItem
  quantity: number
  unitPrice: number
  totalPrice: number
  options: CartItemOption
}

interface MenuItemModalProps {
  item: MenuItem
  company: Company
  isDark: boolean
  onClose: () => void
  onAddToCart: (cartItem: CartItem) => void
  onDirectOrderWhatsApp: (cartItem: CartItem) => void
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
  item,
  company,
  isDark,
  onClose,
  onAddToCart,
  onDirectOrderWhatsApp,
}) => {
  const [quantity, setQuantity] = useState(1)
  const [selectedSizeId, setSelectedSizeId] = useState<string>(() => {
    return item.sizes && item.sizes.length > 0 ? item.sizes[0].id : ''
  })
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [selectedRemovals, setSelectedRemovals] = useState<string[]>([])
  const [stepSelections, setStepSelections] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {}
    if (item.customSteps) {
      item.customSteps.forEach((st) => {
        if (st.required && st.options.length > 0) {
          // pre-select first if required
          init[st.id] = [st.options[0].id]
        } else {
          init[st.id] = []
        }
      })
    }
    return init
  })
  const [notes, setNotes] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Calculate unit price dynamically
  const unitPrice = useMemo(() => {
    let base = 0

    // Size handling: Se houver tamanho com preço próprio cadastrado, o preço do tamanho SUBSTITUI o preço base.
    const chosenSize =
      item.sizes && item.sizes.length > 0 && selectedSizeId
        ? item.sizes.find((s) => s.id === selectedSizeId)
        : undefined

    if (chosenSize && typeof chosenSize.price === 'number' && chosenSize.price > 0) {
      base = chosenSize.price
    } else if (item.promotionalPrice != null && item.promotionalPrice > 0) {
      base = item.promotionalPrice
    } else if (item.price != null && item.price > 0) {
      base = item.price
    }

    // Extras (somente adicionais extras devem ser somados ao preço do tamanho)
    if (item.extras && item.extras.length > 0 && selectedExtras.length > 0) {
      selectedExtras.forEach((extId) => {
        const found = item.extras?.find((e) => e.id === extId)
        if (found && typeof found.price === 'number') {
          base += found.price
        }
      })
    }

    // Custom steps
    if (item.isCustomBuilder && item.customSteps) {
      item.customSteps.forEach((st) => {
        const selectedIds = stepSelections[st.id] || []
        selectedIds.forEach((opId) => {
          const opt = st.options.find((o) => o.id === opId)
          if (opt && typeof opt.price === 'number') {
            base += opt.price
          }
        })
      })
    }

    return base
  }, [
    item,
    selectedSizeId,
    selectedExtras,
    stepSelections,
  ])

  const totalPrice = unitPrice * quantity

  // Format currency
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  // Validate required steps
  const validate = (): boolean => {
    if (item.isCustomBuilder && item.customSteps) {
      for (const st of item.customSteps) {
        const selectedIds = stepSelections[st.id] || []
        if (st.required && selectedIds.length < (st.minSelection || 1)) {
          setValidationError(`Por favor, complete a etapa "${st.title}".`)
          return false
        }
        if (selectedIds.length > st.maxSelection) {
          setValidationError(
            `A etapa "${st.title}" permite no máximo ${st.maxSelection} ${
              st.maxSelection === 1 ? 'escolha' : 'escolhas'
            }.`
          )
          return false
        }
      }
    }

    // Validate flavors if required
    if (item.flavors && item.flavors.length > 0 && item.flavorsMax) {
      if (selectedFlavors.length > item.flavorsMax) {
        setValidationError(`Selecione no máximo ${item.flavorsMax} sabores.`)
        return false
      }
    }

    setValidationError(null)
    return true
  }

  // Build CartItem payload
  const buildCartItem = (): CartItem => {
    const chosenSize = item.sizes?.find((s) => s.id === selectedSizeId)
    const effectiveSizePrice =
      chosenSize && typeof chosenSize.price === 'number' && chosenSize.price > 0
        ? chosenSize.price
        : item.promotionalPrice != null && item.promotionalPrice > 0
        ? item.promotionalPrice
        : item.price || 0
    const chosenExtras = (item.extras || [])
      .filter((e) => selectedExtras.includes(e.id))
      .map((e) => ({ name: e.name, price: e.price }))

    const chosenCustomSteps = (item.customSteps || []).map((st) => {
      const selectedIds = stepSelections[st.id] || []
      const selOpts = st.options
        .filter((o) => selectedIds.includes(o.id))
        .map((o) => ({ name: o.name, price: o.price || 0 }))
      return {
        stepTitle: st.title,
        selected: selOpts,
      }
    })

    const opt: CartItemOption = {
      size: chosenSize ? { name: chosenSize.name, price: effectiveSizePrice } : undefined,
      flavors: selectedFlavors.length > 0 ? selectedFlavors : undefined,
      extras: chosenExtras.length > 0 ? chosenExtras : undefined,
      removals: selectedRemovals.length > 0 ? selectedRemovals : undefined,
      customSteps: chosenCustomSteps.length > 0 ? chosenCustomSteps : undefined,
      notes: notes.trim() || undefined,
    }

    return {
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      menuItem: item,
      quantity,
      unitPrice,
      totalPrice,
      options: opt,
    }
  }

  const handleAdd = () => {
    if (!validate()) return
    onAddToCart(buildCartItem())
  }

  const handleDirectWhatsApp = () => {
    if (!validate()) return
    onDirectOrderWhatsApp(buildCartItem())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border transition-all ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header / Image Banner */}
        <div className="relative shrink-0">
          {item.photoUrl ? (
            <div className="relative h-48 sm:h-56 w-full bg-neutral-950 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.photoUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
          ) : (
            <div
              className={`h-24 w-full flex items-center justify-center ${
                isDark ? 'bg-neutral-800' : 'bg-neutral-100'
              }`}
            >
              <UtensilsCrossed className="w-8 h-8 opacity-40 text-teal-600" />
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-all z-10"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge over image */}
          {item.isFeatured && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Destaque</span>
              </span>
            </div>
          )}

          {/* Title info inside image banner */}
          <div className="p-4 pt-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isDark
                  ? 'bg-teal-500/20 text-teal-300'
                  : 'bg-teal-100 text-teal-800'
              }`}
            >
              {item.category}
            </span>
            <h3 className="text-lg sm:text-xl font-bold mt-1.5 leading-snug">
              {item.name}
            </h3>
            {item.description && (
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  isDark ? 'text-neutral-300' : 'text-neutral-600'
                }`}
              >
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Customization Options */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 divide-y divide-neutral-200/50 dark:divide-neutral-800">
          {/* Validation Alert */}
          {validationError && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. ETAPAS "MONTE SEU PEDIDO" */}
          {item.isCustomBuilder && item.customSteps && item.customSteps.length > 0 && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">
                    Monte seu Pedido Passo a Passo
                  </h4>
                  <p
                    className={`text-[11px] ${
                      isDark ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    Selecione suas preferências em cada etapa abaixo:
                  </p>
                </div>
              </div>

              {item.customSteps.map((step) => {
                const currentSelections = stepSelections[step.id] || []
                const isSingleChoice = (step.maxSelection || 1) === 1

                return (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      isDark
                        ? 'bg-neutral-800/50 border-neutral-700/80'
                        : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h5 className="text-xs font-bold text-neutral-100 dark:text-neutral-100 flex items-center gap-1.5">
                        <span>{step.title}</span>
                        {step.required && (
                          <span className="text-[10px] text-amber-500 font-normal">
                            *Obrigatório
                          </span>
                        )}
                      </h5>
                      <span className="text-[10px] text-neutral-400">
                        {isSingleChoice
                          ? 'Escolha 1'
                          : `Até ${step.maxSelection} opções`}
                      </span>
                    </div>

                    {step.description && (
                      <p className="text-[11px] text-neutral-400">
                        {step.description}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-1">
                      {step.options.map((opt) => {
                        const isSelected = currentSelections.includes(opt.id)

                        const handleToggle = () => {
                          if (isSingleChoice) {
                            setStepSelections({
                              ...stepSelections,
                              [step.id]: [opt.id],
                            })
                          } else {
                            if (isSelected) {
                              setStepSelections({
                                ...stepSelections,
                                [step.id]: currentSelections.filter(
                                  (id) => id !== opt.id
                                ),
                              })
                            } else {
                              if (currentSelections.length < step.maxSelection) {
                                setStepSelections({
                                  ...stepSelections,
                                  [step.id]: [...currentSelections, opt.id],
                                })
                              }
                            }
                          }
                        }

                        return (
                          <div
                            key={opt.id}
                            onClick={handleToggle}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? isDark
                                  ? 'bg-violet-950/40 border-violet-500 text-white'
                                  : 'bg-violet-50 border-violet-400 text-violet-950'
                                : isDark
                                  ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                                  : 'bg-white border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-${
                                  isSingleChoice ? 'full' : 'md'
                                } border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-violet-600 border-violet-600 text-white'
                                    : 'border-neutral-400'
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                )}
                              </div>
                              <div>
                                <span className="text-xs font-medium block">
                                  {opt.name}
                                </span>
                                {opt.description && (
                                  <span className="text-[10px] text-neutral-400 block">
                                    {opt.description}
                                  </span>
                                )}
                              </div>
                            </div>

                            {opt.price != null && opt.price > 0 && (
                              <span className="text-xs font-bold text-emerald-500">
                                +{formatMoney(opt.price)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 2. TAMANHO */}
          {item.sizes && item.sizes.length > 0 && (
            <div className="space-y-2.5 pt-3">
              <div className="flex items-baseline justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Tamanho
                </h4>
                <span className="text-[10px] text-neutral-400">Escolha 1</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.sizes.map((sz) => {
                  const isSelected = selectedSizeId === sz.id
                  return (
                    <div
                      key={sz.id}
                      onClick={() => setSelectedSizeId(sz.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-teal-950/40 border-teal-500 text-white'
                            : 'bg-teal-50 border-teal-400 text-teal-950'
                          : isDark
                            ? 'bg-neutral-800/50 border-neutral-700'
                            : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-neutral-400'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-semibold">{sz.name}</span>
                      </div>
                      {sz.price != null && sz.price > 0 ? (
                        <span className="text-xs font-bold text-emerald-500">
                          {formatMoney(sz.price)}
                        </span>
                      ) : item.price != null && item.price > 0 ? (
                        <span className="text-xs font-bold text-emerald-500">
                          {formatMoney(
                            item.promotionalPrice && item.promotionalPrice > 0
                              ? item.promotionalPrice
                              : item.price
                          )}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 3. SABORES */}
          {item.flavors && item.flavors.length > 0 && (
            <div className="space-y-2.5 pt-3">
              <div className="flex items-baseline justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Sabores
                </h4>
                <span className="text-[10px] text-neutral-400">
                  Até {item.flavorsMax || 2} sabores
                </span>
              </div>
              <div className="space-y-1.5">
                {item.flavors.map((fl) => {
                  const isSelected = selectedFlavors.includes(fl.name)
                  const handleToggle = () => {
                    if (isSelected) {
                      setSelectedFlavors(
                        selectedFlavors.filter((s) => s !== fl.name)
                      )
                    } else {
                      if (selectedFlavors.length < (item.flavorsMax || 2)) {
                        setSelectedFlavors([...selectedFlavors, fl.name])
                      }
                    }
                  }
                  return (
                    <div
                      key={fl.id || fl.name}
                      onClick={handleToggle}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-teal-950/40 border-teal-500 text-white'
                            : 'bg-teal-50 border-teal-400 text-teal-950'
                          : isDark
                            ? 'bg-neutral-800/50 border-neutral-700'
                            : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isSelected
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-neutral-400'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium">{fl.name}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 4. ADICIONAIS COM VALOR EXTRA */}
          {item.extras && item.extras.length > 0 && (
            <div className="space-y-2.5 pt-3">
              <div className="flex items-baseline justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Adicionais Extras
                </h4>
                <span className="text-[10px] text-neutral-400">Opcional</span>
              </div>
              <div className="space-y-1.5">
                {item.extras.map((ext) => {
                  const isSelected = selectedExtras.includes(ext.id)
                  const handleToggle = () => {
                    if (isSelected) {
                      setSelectedExtras(selectedExtras.filter((e) => e !== ext.id))
                    } else {
                      setSelectedExtras([...selectedExtras, ext.id])
                    }
                  }
                  return (
                    <div
                      key={ext.id}
                      onClick={handleToggle}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-teal-950/40 border-teal-500 text-white'
                            : 'bg-teal-50 border-teal-400 text-teal-950'
                          : isDark
                            ? 'bg-neutral-800/50 border-neutral-700'
                            : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isSelected
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-neutral-400'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium">{ext.name}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-500">
                        +{formatMoney(ext.price)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 5. REMOVER INGREDIENTES */}
          {item.removableIngredients && item.removableIngredients.length > 0 && (
            <div className="space-y-2.5 pt-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Remover Ingredientes?
              </h4>
              <div className="space-y-1.5">
                {item.removableIngredients.map((rem, idx) => {
                  const isSelected = selectedRemovals.includes(rem)
                  const handleToggle = () => {
                    if (isSelected) {
                      setSelectedRemovals(
                        selectedRemovals.filter((r) => r !== rem)
                      )
                    } else {
                      setSelectedRemovals([...selectedRemovals, rem])
                    }
                  }
                  return (
                    <div
                      key={idx}
                      onClick={handleToggle}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-red-500/10 border-red-500/50 text-red-500'
                          : isDark
                            ? 'bg-neutral-800/50 border-neutral-700'
                            : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isSelected
                              ? 'bg-red-500 border-red-500 text-white'
                              : 'border-neutral-400'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium">{rem}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        Retirar do prato
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 6. OBSERVAÇÕES LIVRES */}
          {item.allowNotes !== false && (
            <div className="space-y-1.5 pt-3">
              <label
                className={`block text-xs font-bold ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                Observações do Pedido
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Ponto da carne bem passado, pouco sal, sem gelo no copo..."
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-teal-500 leading-relaxed ${
                  isDark
                    ? 'bg-neutral-800 border-neutral-700 text-white'
                    : 'bg-white border-neutral-300 text-neutral-900'
                }`}
              />
            </div>
          )}
        </div>

        {/* Modal Footer with Automatic Price Calculation & Actions */}
        <div
          className={`p-4 border-t shrink-0 flex flex-col gap-3 ${
            isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          {/* Quantity Selector & Total Preview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-medium">Qtd:</span>
              <div
                className={`flex items-center rounded-xl border ${
                  isDark ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 text-neutral-400 hover:text-white transition-all"
                  aria-label="Diminuir"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2.5 text-xs font-bold font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1.5 text-neutral-400 hover:text-white transition-all"
                  aria-label="Aumentar"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block">Total:</span>
              <span className="text-lg font-extrabold text-teal-500">
                {formatMoney(totalPrice)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar ao Pedido</span>
            </button>

            <button
              type="button"
              onClick={handleDirectWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Pedir no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
