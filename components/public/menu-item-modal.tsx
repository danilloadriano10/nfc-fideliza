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
  Flame,
  Tag,
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
  const primaryColor = company.primaryColor || '#0D9488'

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border transition-all ${
          isDark
            ? 'bg-[#14141a] border-white/10 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* FOTO GRANDE NO TOPO - Cores e iluminação originais, sem filtros ou escurecimento */}
        <div className="relative shrink-0">
          {item.photoUrl ? (
            <div className="relative h-72 sm:h-88 md:h-96 w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
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
            </div>
          ) : (
            <div
              className={`h-40 sm:h-48 w-full flex flex-col items-center justify-center ${
                isDark ? 'bg-neutral-800' : 'bg-neutral-100'
              }`}
            >
              <UtensilsCrossed className="w-10 h-10 opacity-30 text-neutral-400 mb-1" />
              <span className="text-xs text-neutral-400">Cardápio Digital</span>
            </div>
          )}

          {/* Botão de Fechar visível sobre a foto */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all z-10 cursor-pointer shadow-lg active:scale-95 border border-white/20"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Selos opcionais sobre a foto: Mais pedido, Destaque e Novidade */}
          <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5 z-10">
            {item.isBestSeller && (
              <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black shadow-md flex items-center gap-1">
                <Flame className="w-3 h-3 text-white" />
                <span>Mais pedido</span>
              </span>
            )}
            {item.isFeatured && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-white" />
                <span>Destaque</span>
              </span>
            )}
            {item.isNew && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-md flex items-center gap-1">
                <Tag className="w-3 h-3 text-white" />
                <span>Novidade</span>
              </span>
            )}
          </div>
        </div>

        {/* NOME E DESCRIÇÃO DO PRODUTO */}
        <div className="px-5 pt-4 pb-3 border-b border-neutral-100 dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: primaryColor }}
            >
              {item.category || 'Cardápio'}
            </span>
          </div>

          <h3 className="text-lg sm:text-2xl font-black mt-1 leading-snug tracking-tight">
            {item.name}
          </h3>

          {item.description && (
            <p
              className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${
                isDark ? 'text-neutral-300' : 'text-neutral-600'
              }`}
            >
              {item.description}
            </p>
          )}
        </div>

        {/* CONTEÚDO CUSTOMIZÁVEL SCROLLÁVEL */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* Alerta de Validação */}
          {validationError && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. ETAPAS "MONTE SEU PEDIDO" (Se configurado) */}
          {item.isCustomBuilder && item.customSteps && item.customSteps.length > 0 && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded-lg text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
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
                      <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
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
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'shadow-xs'
                                : isDark
                                  ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                                  : 'bg-white border-neutral-200 hover:border-neutral-300'
                            }`}
                            style={
                              isSelected
                                ? {
                                    borderColor: primaryColor,
                                    backgroundColor: isDark
                                      ? `${primaryColor}20`
                                      : `${primaryColor}10`,
                                  }
                                : undefined
                            }
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4.5 h-4.5 rounded-${
                                  isSingleChoice ? 'full' : 'md'
                                } border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'text-white'
                                    : 'border-neutral-400'
                                }`}
                                style={
                                  isSelected
                                    ? {
                                        backgroundColor: primaryColor,
                                        borderColor: primaryColor,
                                      }
                                    : undefined
                                }
                              >
                                {isSelected && (
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                )}
                              </div>
                              <div>
                                <span className="text-xs font-semibold block">
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
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
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

          {/* 2. TAMANHOS EM CARDS SELECIONÁVEIS */}
          {item.sizes && item.sizes.length > 0 && (
            <div className="space-y-3 pt-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                    Tamanho
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Selecione o tamanho desejado (obrigatório 1)
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                  {item.sizes.length} {item.sizes.length === 1 ? 'opção' : 'opções'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {item.sizes.map((sz) => {
                  const isSelected = selectedSizeId === sz.id
                  const sizePrice =
                    sz.price != null && sz.price > 0
                      ? sz.price
                      : item.promotionalPrice != null && item.promotionalPrice > 0
                      ? item.promotionalPrice
                      : item.price

                  return (
                    <div
                      key={sz.id}
                      onClick={() => setSelectedSizeId(sz.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'shadow-xs'
                          : isDark
                            ? 'bg-neutral-800/40 border-neutral-700/60 hover:border-neutral-600'
                            : 'bg-neutral-50/70 border-neutral-200/80 hover:border-neutral-300'
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: primaryColor,
                              backgroundColor: isDark
                                ? `${primaryColor}20`
                                : `${primaryColor}10`,
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'text-white'
                              : 'border-neutral-300 dark:border-neutral-600'
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: primaryColor,
                                  borderColor: primaryColor,
                                }
                              : undefined
                          }
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isSelected
                              ? 'text-neutral-900 dark:text-white'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {sz.name}
                        </span>
                      </div>

                      {sizePrice != null && sizePrice > 0 && (
                        <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {formatMoney(sizePrice)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 3. SABORES (Se configurado) */}
          {item.flavors && item.flavors.length > 0 && (
            <div className="space-y-3 pt-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                    Sabores
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Escolha até {item.flavorsMax || 2} sabores
                  </p>
                </div>
              </div>

              <div className="space-y-2">
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
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'shadow-xs'
                          : isDark
                            ? 'bg-neutral-800/40 border-neutral-700/60 hover:border-neutral-600'
                            : 'bg-neutral-50/70 border-neutral-200/80 hover:border-neutral-300'
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: primaryColor,
                              backgroundColor: isDark
                                ? `${primaryColor}20`
                                : `${primaryColor}10`,
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'text-white'
                              : 'border-neutral-300 dark:border-neutral-600'
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: primaryColor,
                                  borderColor: primaryColor,
                                }
                              : undefined
                          }
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold">
                          {fl.name}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 4. ADICIONAIS */}
          {item.extras && item.extras.length > 0 && (
            <div className="space-y-3 pt-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                    Adicionais Extras
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Turbine seu pedido com itens extras (opcional)
                  </p>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Opcional</span>
              </div>

              <div className="space-y-2">
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
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'shadow-xs'
                          : isDark
                            ? 'bg-neutral-800/40 border-neutral-700/60 hover:border-neutral-600'
                            : 'bg-neutral-50/70 border-neutral-200/80 hover:border-neutral-300'
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: primaryColor,
                              backgroundColor: isDark
                                ? `${primaryColor}20`
                                : `${primaryColor}10`,
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'text-white'
                              : 'border-neutral-300 dark:border-neutral-600'
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: primaryColor,
                                  borderColor: primaryColor,
                                }
                              : undefined
                          }
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold">
                          {ext.name}
                        </span>
                      </div>

                      <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
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
            <div className="space-y-3 pt-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                    Remover Ingredientes?
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Não gosta de algum item? Marque para retirar
                  </p>
                </div>
              </div>

              <div className="space-y-2">
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
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-rose-500/10 border-rose-500/50 text-rose-600 dark:text-rose-400 shadow-2xs'
                          : isDark
                            ? 'bg-neutral-800/40 border-neutral-700/60 hover:border-neutral-600'
                            : 'bg-neutral-50/70 border-neutral-200/80 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'border-neutral-300 dark:border-neutral-600'
                          }`}
                        >
                          {isSelected && <X className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold">
                          {rem}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-rose-500 text-white'
                            : 'text-neutral-400'
                        }`}
                      >
                        {isSelected ? 'Retirar' : 'Manter'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 6. OBSERVAÇÕES */}
          {item.allowNotes !== false && (
            <div className="space-y-2 pt-3">
              <label
                className={`block text-xs font-black uppercase tracking-wider ${
                  isDark ? 'text-neutral-200' : 'text-neutral-800'
                }`}
              >
                Observações do Pedido
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Ponto da carne bem passado, pouco sal, sem gelo no copo..."
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border focus:outline-none transition-all leading-relaxed ${
                  isDark
                    ? 'bg-neutral-800/80 border-neutral-700 text-white focus:border-white/40'
                    : 'bg-white border-neutral-300 text-neutral-900 focus:border-neutral-500'
                }`}
              />
            </div>
          )}
        </div>

        {/* BARRA INFERIOR COM "ADICIONAR AO PEDIDO" E TOTAL ATUALIZADO */}
        <div
          className={`p-3.5 sm:p-4 border-t shrink-0 flex items-center gap-3 sticky bottom-0 z-20 ${
            isDark
              ? 'bg-[#181822]/95 border-white/[0.08] backdrop-blur-md'
              : 'bg-white/95 border-neutral-200 backdrop-blur-md shadow-xl'
          }`}
        >
          {/* Seletor de Quantidade */}
          <div
            className={`flex items-center rounded-2xl border p-1 shrink-0 ${
              isDark
                ? 'border-neutral-700 bg-neutral-800'
                : 'border-neutral-200 bg-neutral-100'
            }`}
          >
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer active:scale-90"
              aria-label="Diminuir quantidade"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <span className="w-8 text-center text-xs sm:text-sm font-black font-mono">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer active:scale-90 shadow-2xs"
              style={{ backgroundColor: primaryColor }}
              aria-label="Aumentar quantidade"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Botão Adicionar ao Pedido com Total Atualizado */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 py-3 px-4 rounded-2xl text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-between gap-2 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Plus className="w-4 h-4 stroke-[3] shrink-0" />
              <span className="truncate">Adicionar ao pedido</span>
            </div>
            <span className="font-mono font-black text-sm shrink-0 bg-black/20 px-2 py-0.5 rounded-lg">
              {formatMoney(totalPrice)}
            </span>
          </button>

          {/* Botão direto do WhatsApp (Opcional e Prático) */}
          <button
            type="button"
            onClick={handleDirectWhatsApp}
            className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            title="Pedir direto no WhatsApp"
          >
            <MessageCircle className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
