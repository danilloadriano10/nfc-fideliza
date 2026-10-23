'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import {
  X,
  UtensilsCrossed,
  Search,
  ShoppingBag,
  Flame,
  Tag,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { Company, MenuItem } from '@/types/platform'
import { getPublicTheme } from '@/lib/public-themes'
import { MenuItemModal, CartItem } from './menu-item-modal'

interface MenuSheetProps {
  isOpen: boolean
  onClose: () => void
  menuItems: MenuItem[]
  company: Company
  cart?: CartItem[]
  onAddToCart?: (item: CartItem) => void
  onDirectOrderWhatsApp?: (item: CartItem) => void
  onOpenCart?: () => void
  tableNumber?: string
}

export const MenuSheet: React.FC<MenuSheetProps> = ({
  isOpen,
  onClose,
  menuItems,
  company,
  cart = [],
  onAddToCart,
  onDirectOrderWhatsApp,
  onOpenCart,
  tableNumber,
}) => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)

  const activeTheme = useMemo(
    () => getPublicTheme(company.theme, company.customThemeConfig, company.themeColors),
    [company.theme, company.customThemeConfig, company.themeColors]
  )
  const isDark = activeTheme.isDarkBase ?? false
  const primaryColor = activeTheme.colors.primary || company.primaryColor || '#0D9488'

  // Active items of this company
  const activeItems = useMemo(() => {
    return menuItems
      .filter((i) => i.companyId === company.id && i.isActive !== false)
      .sort((a, b) => {
        if (Array.isArray(company.menuItemsOrder) && company.menuItemsOrder.length > 0) {
          const idxA = company.menuItemsOrder.indexOf(a.id)
          const idxB = company.menuItemsOrder.indexOf(b.id)
          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return -1
          if (idxB !== -1) return 1
        }
        const orderA = typeof a.order === 'number' ? a.order : 0
        const orderB = typeof b.order === 'number' ? b.order : 0
        if (orderA !== orderB) return orderA - orderB
        return (b.createdAt || '').localeCompare(a.createdAt || '')
      })
  }, [menuItems, company.id, company.menuItemsOrder])

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    activeItems.forEach((i) => {
      if (i.category && i.category.trim()) {
        set.add(i.category.trim())
      }
    })
    return ['Todas', ...Array.from(set)]
  }, [activeItems])

  // Filtered items
  const filteredItems = useMemo(() => {
    return activeItems.filter((i) => {
      const matchCat = selectedCategory === 'Todas' || i.category === selectedCategory
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q))
      return matchCat && matchSearch
    })
  }, [activeItems, selectedCategory, search])

  const cartTotalCount = useMemo(() => {
    return cart.reduce((acc, it) => acc + (it.quantity || 1), 0)
  }, [cart])

  const cartTotalPrice = useMemo(() => {
    return cart.reduce((acc, it) => acc + (it.totalPrice || 0), 0)
  }, [cart])

  const formatMoney = (val?: number | null) => {
    if (val == null) return ''
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
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
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Sheet Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className={`relative w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] h-[92vh] sm:h-auto sm:max-h-[88vh] border ${
            isDark ? 'bg-[#121217] border-white/10 text-white' : 'bg-white border-neutral-200 text-neutral-900'
          }`}
        >
          {/* Header */}
          <div
            className={`p-4 sm:p-5 border-b shrink-0 flex items-center justify-between gap-3 ${
              isDark ? 'bg-[#15151c] border-white/[0.08]' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base sm:text-lg tracking-tight truncate">
                    Cardápio Digital
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isDark ? 'bg-white/10 text-neutral-300' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {activeItems.length} {activeItems.length === 1 ? 'item' : 'itens'}
                  </span>
                  {tableNumber && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
                      Mesa {tableNumber.replace(/^(mesa|table)\s*/i, '').trim() || tableNumber}
                    </span>
                  )}
                </div>
                <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {company.name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isDark ? 'bg-white/5 hover:bg-white/10 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar & Category filters */}
          <div
            className={`p-4 sm:p-5 border-b shrink-0 space-y-3 ${
              isDark ? 'bg-[#121217] border-white/[0.08]' : 'bg-white border-neutral-200'
            }`}
          >
            {/* Search Input */}
            <div className="relative">
              <Search
                className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar prato, bebida ou porção..."
                className={`w-full pl-10 pr-9 py-2.5 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder-neutral-500'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category horizontal scroll */}
            {categories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-xs'
                          : isDark
                          ? 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                      style={isSelected ? { backgroundColor: primaryColor } : undefined}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <UtensilsCrossed className="w-8 h-8 mx-auto text-neutral-400 opacity-50" />
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-800'}`}>
                  Nenhum item encontrado
                </p>
                <p className="text-xs text-neutral-400">
                  Tente alterar os termos de busca ou a categoria selecionada.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map((item) => {
                  const hasPromotional =
                    item.promotionalPrice != null &&
                    typeof item.price === 'number' &&
                    item.promotionalPrice < item.price
                  const isSoldOut = item.isAvailable === false

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!isSoldOut) setSelectedMenuItem(item)
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isDark
                          ? 'bg-[#15151c] border-white/[0.08] hover:border-white/20'
                          : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        {/* Photo */}
                        {item.photoUrl && (
                          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800">
                            <Image
                              src={item.photoUrl}
                              alt={item.name}
                              fill
                              sizes="(max-width: 640px) 80px, 90px"
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {hasPromotional && !isSoldOut && (
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px] shadow-xs flex items-center gap-0.5">
                                <Tag className="w-2.5 h-2.5" />
                                <span>Promo</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.isFeatured && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[9px] font-bold flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" />
                                <span>Mais Pedido</span>
                              </span>
                            )}
                            {item.isCustomBuilder && (
                              <span className="px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[9px] font-bold flex items-center gap-0.5">
                                <Layers className="w-2.5 h-2.5" />
                                <span>Monte seu Pedido</span>
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-xs sm:text-sm mt-1 leading-snug line-clamp-2">
                            {item.name}
                          </h4>

                          {item.description && (
                            <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Pricing and Action Button */}
                      <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between gap-2 mt-auto">
                        <div>
                          {item.priceType === 'consult' ? (
                            <span className="text-xs font-bold text-neutral-500">Sob consulta</span>
                          ) : (
                            <div className="flex items-baseline gap-1.5">
                              {hasPromotional ? (
                                <>
                                  <span className="text-xs sm:text-sm font-black text-rose-600 font-mono">
                                    {formatMoney(item.promotionalPrice)}
                                  </span>
                                  <span className="text-[10px] text-neutral-400 line-through font-mono">
                                    {formatMoney(item.price)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                  {formatMoney(item.price)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isSoldOut}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                            isSoldOut
                              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-500'
                              : 'text-white hover:opacity-90 active:scale-95 shadow-xs cursor-pointer'
                          }`}
                          style={!isSoldOut ? { backgroundColor: primaryColor } : undefined}
                        >
                          <span>{item.isCustomBuilder ? 'Montar' : 'Pedir'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bottom Floating Cart Bar if cart has items */}
          {cartTotalCount > 0 && onOpenCart && (
            <div
              className={`p-3.5 sm:p-4 border-t shrink-0 flex items-center justify-between gap-3 shadow-lg ${
                isDark ? 'bg-[#15151c] border-white/[0.08]' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">
                    {cartTotalCount} {cartTotalCount === 1 ? 'item' : 'itens'} no pedido
                  </div>
                  <div className="text-xs font-black text-teal-600 font-mono">
                    {formatMoney(cartTotalPrice)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenCart()
                }}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <span>Ver Pedido</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Item Detail / Customization Modal */}
      {selectedMenuItem && (
        <MenuItemModal
          item={selectedMenuItem}
          company={company}
          isDark={isDark}
          onClose={() => setSelectedMenuItem(null)}
          onAddToCart={(cartItem) => {
            if (onAddToCart) onAddToCart(cartItem)
            setSelectedMenuItem(null)
          }}
          onDirectOrderWhatsApp={(cartItem) => {
            if (onDirectOrderWhatsApp) onDirectOrderWhatsApp(cartItem)
            setSelectedMenuItem(null)
          }}
        />
      )}
    </AnimatePresence>
  )
}
