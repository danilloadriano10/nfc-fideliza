'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  UtensilsCrossed,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react'
import { Company, MenuItem } from '@/types/platform'
import { getPublicTheme } from '@/lib/public-themes'
import { MenuItemModal, CartItem } from './menu-item-modal'
import { MenuCatalogView } from './menu-catalog-view'

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
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)

  const activeTheme = useMemo(
    () => getPublicTheme(company.theme, company.customThemeConfig, company.themeColors),
    [company.theme, company.customThemeConfig, company.themeColors]
  )
  const isDark = activeTheme.isDarkBase ?? false
  const primaryColor = activeTheme.colors.primary || company.primaryColor || '#0D9488'

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

  const cleanTableNumber = tableNumber ? tableNumber.trim() : null
  const displayTableLabel = useMemo(() => {
    if (!cleanTableNumber) return null
    return cleanTableNumber.toLowerCase().startsWith('mesa')
      ? cleanTableNumber
      : `Mesa ${cleanTableNumber.replace(/^(mesa|table)\s*/i, '').trim() || cleanTableNumber}`
  }, [cleanTableNumber])

  // Count active items
  const activeItemsCount = useMemo(() => {
    return menuItems.filter(
      (i) => (i.companyId ? i.companyId === company.id : true) && i.isActive !== false
    ).length
  }, [menuItems, company.id])

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

        {/* Modal Sheet Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className={`relative w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] h-[92vh] sm:h-auto sm:max-h-[88vh] border ${
            isDark ? 'bg-[#121217] border-white/10 text-white' : 'bg-white border-neutral-200 text-neutral-900'
          }`}
          style={{
            backgroundColor: activeTheme.modalBg,
            borderColor: activeTheme.containerBorderColor,
          }}
        >
          {/* Header */}
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
                    {activeItemsCount} {activeItemsCount === 1 ? 'item' : 'itens'}
                  </span>
                  {displayTableLabel && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-500 dark:text-teal-400 border border-teal-500/30">
                      {displayTableLabel}
                    </span>
                  )}
                </div>
                <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {company.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {cartTotalCount > 0 && onOpenCart && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onOpenCart()
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Ver Pedido"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{cartTotalCount}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body: EXACT SAME LISTING COMPONENT AS 'Exibir conteúdo' */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5">
            <MenuCatalogView
              company={company}
              menuItems={menuItems}
              cart={cart}
              onSelectItem={(item) => setSelectedMenuItem(item)}
              onOpenCart={onOpenCart}
              tableNumber={tableNumber}
              showHeader={false}
              showSearch={true}
              isModal={true}
            />
          </div>

          {/* Bottom Floating Cart Bar if cart has items */}
          {cartTotalCount > 0 && onOpenCart && (
            <div
              className={`p-3 sm:p-4 border-t shrink-0 flex items-center justify-between gap-3 shadow-lg ${
                isDark ? 'bg-[#15151c] border-white/[0.08]' : 'bg-white border-neutral-200'
              }`}
              style={{
                backgroundColor: activeTheme.fixedAreaBg,
                borderColor: activeTheme.containerBorderColor,
              }}
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
