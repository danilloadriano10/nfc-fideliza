'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Package,
  ExternalLink,
  MessageCircle,
  Search,
  Sparkles,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react'
import { Company, CompanyProduct } from '@/types/platform'
import { ProductDetailModal } from './product-detail-modal'

interface ProductsSheetProps {
  isOpen: boolean
  onClose: () => void
  products: CompanyProduct[]
  company: Company
}

export const ProductsSheet: React.FC<ProductsSheetProps> = ({
  isOpen,
  onClose,
  products,
  company,
}) => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [selectedProduct, setSelectedProduct] = useState<CompanyProduct | null>(null)

  if (!isOpen) return null

  const isDark = (company.theme || 'dark') === 'dark'
  const primaryColor = company.primaryColor || '#6D28D9'

  // Filter only active products
  const activeProducts = products.filter((p) => p.isActive !== false)

  // Categories list
  const categories = Array.from(
    new Set(activeProducts.map((p) => p.category || 'Geral').filter(Boolean))
  )
  const categoryFilters = ['Todos', ...categories]

  // Filtered by search and category
  const filtered = activeProducts.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Todos' || (p.category || 'Geral') === selectedCategory
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Format currency
  const formatPrice = (value?: number | null) => {
    if (value == null) return null
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm"
        />

        {/* Sheet Content */}
        <motion.div
          initial={{ y: '100%', opacity: 0.9 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className={`relative w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 p-5 sm:p-6 space-y-4 max-h-[88vh] flex flex-col border ${
            isDark
              ? 'bg-[#15151b] border-white/10 text-white'
              : 'bg-white border-neutral-200 text-neutral-900'
          }`}
        >
          {/* Mobile Drag Bar */}
          <div className="w-12 h-1.5 bg-neutral-500/40 rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">
                  Catálogo Completo
                </h3>
                <p
                  className={`text-xs ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {company.name} • {activeProducts.length} itens disponíveis
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark
                  ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative shrink-0">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos..."
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                isDark
                  ? 'bg-neutral-900/90 border border-white/10 text-white placeholder-neutral-500 focus:border-violet-500'
                  : 'bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-violet-600'
              }`}
            />
          </div>

          {/* Categories Horizontal Filter */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
              {categoryFilters.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-violet-600 text-white shadow-xs'
                      : isDark
                      ? 'bg-neutral-900 text-neutral-400 hover:text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Products List Grid */}
          <div className="overflow-y-auto flex-1 pr-1 space-y-3">
            {filtered.length === 0 ? (
              <div
                className={`text-center py-12 rounded-2xl border ${
                  isDark
                    ? 'border-white/5 bg-white/[0.02]'
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <Package className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs text-neutral-400">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filtered.map((item) => {
                  const isConsult = item.priceType === 'consult' || item.price == null
                  const hasPromo =
                    !isConsult && item.promotionalPrice != null && item.promotionalPrice > 0

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedProduct(item)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 group items-center ${
                        isDark
                          ? 'bg-[#1a1a22] border-white/5 hover:border-white/20'
                          : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-2xs'
                      }`}
                    >
                      {/* Thumbnail */}
                      {(() => {
                        const itemPhoto =
                          item.photoUrl ||
                          (item as unknown as { imageUrl?: string; image?: string; photo?: string }).imageUrl ||
                          (item as unknown as { image?: string }).image ||
                          (item as unknown as { photo?: string }).photo ||
                          ''

                        return (
                          <div
                            className={`w-16 h-16 rounded-xl overflow-hidden relative shrink-0 border flex items-center justify-center ${
                              isDark ? 'bg-neutral-900 border-white/5' : 'bg-neutral-100 border-neutral-200'
                            }`}
                          >
                            {itemPhoto ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={itemPhoto}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-neutral-400 opacity-60" />
                            )}
                          </div>
                        )
                      })()}

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        {item.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 block truncate">
                            {item.category}
                          </span>
                        )}
                        <h4 className="text-xs font-bold truncate leading-tight mt-0.5">
                          {item.name}
                        </h4>

                        {/* Price */}
                        <div className="flex items-baseline gap-1.5 mt-1">
                          {isConsult ? (
                            <span className="text-xs font-bold text-amber-400">
                              Sob consulta
                            </span>
                          ) : hasPromo ? (
                            <>
                              <span className="text-xs font-black text-emerald-400 font-mono">
                                {formatPrice(item.promotionalPrice)}
                              </span>
                              <span
                                className={`text-[10px] line-through font-mono ${
                                  isDark ? 'text-neutral-500' : 'text-neutral-400'
                                }`}
                              >
                                {formatPrice(item.price)}
                              </span>
                            </>
                          ) : (
                            <span
                              className="text-xs font-bold font-mono"
                              style={{ color: isDark ? '#ffffff' : primaryColor }}
                            >
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5 ${
                          isDark ? 'bg-white/5 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Selected Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        company={company}
      />
    </>
  )
}
