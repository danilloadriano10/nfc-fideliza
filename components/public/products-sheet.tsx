'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  X,
  Package,
  Search,
  ArrowLeft,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
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

  // Filter only active products scoped to this company
  const activeProducts = useMemo(() => {
    return products
      .filter((p) => p.companyId === company.id && p.isActive !== false)
      .sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 0
        const orderB = typeof b.order === 'number' ? b.order : 0
        if (orderA !== orderB) return orderA - orderB
        return (b.createdAt || '').localeCompare(a.createdAt || '')
      })
  }, [products, company.id])

  // Categories list
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    activeProducts.forEach((p) => {
      const cat = p.category?.trim() || 'Geral'
      counts[cat] = (counts[cat] || 0) + 1
    })

    const cats = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
    return [
      { name: 'Todos', count: activeProducts.length },
      ...cats.map((c) => ({ name: c, count: counts[c] })),
    ]
  }, [activeProducts])

  // Filtered products by search and category
  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      const matchesCategory =
        selectedCategory === 'Todos' || (p.category?.trim() || 'Geral') === selectedCategory
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))

      return matchesCategory && matchesSearch
    })
  }, [activeProducts, selectedCategory, search])

  if (!isOpen) return null

  const isDark = (company.theme || 'dark') === 'dark'
  const primaryColor = company.primaryColor || '#6D28D9'

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
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm"
        />

        {/* Vitrine Modal Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0.9 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className={`relative w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] h-[92vh] sm:h-auto sm:max-h-[88vh] border ${
            isDark
              ? 'bg-[#121217] border-white/10 text-white'
              : 'bg-white border-neutral-200 text-neutral-900'
          }`}
        >
          {/* Mobile Drag Bar */}
          <div className="w-12 h-1.5 bg-neutral-500/40 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

          {/* Top Header */}
          <div
            className={`p-4 sm:p-5 border-b shrink-0 flex items-center justify-between gap-3 ${
              isDark ? 'bg-[#15151c] border-white/[0.08]' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
                title="Voltar"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg leading-tight truncate">
                    Catálogo de Produtos
                  </h3>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      color: isDark ? '#ffffff' : primaryColor,
                    }}
                  >
                    {activeProducts.length} itens
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {company.name} • Vitrine Oficial
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900'
              }`}
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar & Categories Filter */}
          <div
            className={`p-3.5 sm:p-4 space-y-3 shrink-0 border-b ${
              isDark ? 'bg-[#101015] border-white/[0.06]' : 'bg-white border-neutral-100'
            }`}
          >
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, categoria ou descrição..."
                className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                  isDark
                    ? 'bg-neutral-900/90 border border-white/10 text-white placeholder-neutral-500 focus:border-violet-500'
                    : 'bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-violet-600'
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-0.5"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Horizontal Categories Filter Pills */}
            {categoriesWithCounts.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                {categoriesWithCounts.map((cat) => {
                  const isSelected = selectedCategory === cat.name
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow-xs'
                          : isDark
                          ? 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/5'
                          : 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : isDark
                            ? 'bg-white/10 text-neutral-400'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Grid de Cards de Produtos */}
          <div className="overflow-y-auto flex-1 p-3.5 sm:p-5">
            {filteredProducts.length === 0 ? (
              <div
                className={`text-center py-16 px-4 rounded-3xl border flex flex-col items-center justify-center ${
                  isDark
                    ? 'border-white/5 bg-white/[0.02]'
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-neutral-500/10 flex items-center justify-center text-neutral-400 mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-neutral-300">
                  Nenhum produto encontrado
                </h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  {search
                    ? `Não encontramos resultados para "${search}". Tente buscar por outro termo.`
                    : 'Não há itens disponíveis nesta categoria no momento.'}
                </p>
                {(search || selectedCategory !== 'Todos') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setSelectedCategory('Todos')
                    }}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white transition-colors cursor-pointer"
                  >
                    Ver todos os produtos
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((item) => {
                  const isConsult = item.priceType === 'consult' || item.price == null
                  const hasPromo =
                    !isConsult && item.promotionalPrice != null && item.promotionalPrice > 0
                  const isSoldOut = item.isAvailable === false
                  const itemPhoto =
                    item.photoUrl ||
                    (item.photos && item.photos[0]) ||
                    (item as unknown as { imageUrl?: string }).imageUrl ||
                    ''

                  const discountPercent =
                    hasPromo && item.price && item.promotionalPrice
                      ? Math.round(((item.price - item.promotionalPrice) / item.price) * 100)
                      : null

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedProduct(item)}
                      className={`group rounded-2xl p-2.5 sm:p-3 border flex flex-col justify-between transition-all duration-200 cursor-pointer relative overflow-hidden select-none active:scale-[0.98] hover:shadow-lg ${
                        isDark
                          ? 'bg-[#181820] hover:bg-[#1f1f2a] border-white/[0.07] hover:border-white/20'
                          : 'bg-white hover:bg-neutral-50 border-neutral-200/90 hover:border-neutral-300 shadow-2xs'
                      }`}
                    >
                      <div>
                        {/* Foto do Produto em Grade */}
                        <div
                          className={`relative w-full aspect-square rounded-xl overflow-hidden mb-2.5 border flex items-center justify-center shrink-0 ${
                            isDark
                              ? 'bg-neutral-900 border-white/5'
                              : 'bg-neutral-100 border-neutral-200'
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
                            <div className="flex flex-col items-center justify-center text-neutral-400 gap-1">
                              <Package className="w-8 h-8 opacity-40" />
                              <span className="text-[10px] font-medium text-neutral-500">Sem foto</span>
                            </div>
                          )}

                          {/* Badge de Promoção */}
                          {hasPromo && (
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                              {discountPercent ? `-${discountPercent}%` : 'Promo'}
                            </span>
                          )}

                          {/* Badge Esgotado */}
                          {isSoldOut && (
                            <span className="absolute inset-x-1.5 bottom-1.5 text-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/80 text-rose-300 backdrop-blur-xs border border-rose-500/30">
                              Esgotado
                            </span>
                          )}
                        </div>

                        {/* Categoria e Nome */}
                        <div className="space-y-1">
                          {item.category && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400 block truncate">
                              {item.category}
                            </span>
                          )}

                          <h4
                            className={`font-bold text-xs sm:text-sm leading-snug line-clamp-2 ${
                              isDark ? 'text-white' : 'text-neutral-900'
                            }`}
                          >
                            {item.name}
                          </h4>

                          {/* Tamanhos / Variações Hint */}
                          {item.variations && item.variations.length > 0 && (
                            <div className="flex items-center gap-1 pt-0.5">
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                                  isDark ? 'bg-white/5 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                                }`}
                              >
                                {item.variations.length} {item.variations.length === 1 ? 'variação' : 'tamanhos'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Preço e Botão Detalhes */}
                      <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between gap-1">
                        <div className="min-w-0">
                          {isConsult ? (
                            <span className="text-xs font-bold text-amber-500 block truncate">
                              Consultar
                            </span>
                          ) : hasPromo ? (
                            <div>
                              <span className="text-xs sm:text-sm font-black text-emerald-500 font-mono block leading-tight">
                                {formatPrice(item.promotionalPrice)}
                              </span>
                              <span
                                className={`text-[10px] line-through font-mono block leading-tight ${
                                  isDark ? 'text-neutral-500' : 'text-neutral-400'
                                }`}
                              >
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`text-xs sm:text-sm font-black font-mono block leading-tight ${
                                isDark ? 'text-white' : 'text-neutral-900'
                              }`}
                            >
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </div>

                        <div
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-0.5 shrink-0 transition-colors ${
                            isDark
                              ? 'bg-white/5 group-hover:bg-violet-600 group-hover:text-white text-neutral-300'
                              : 'bg-neutral-100 group-hover:bg-violet-600 group-hover:text-white text-neutral-700'
                          }`}
                        >
                          <span>Ver</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal de Detalhes do Produto Selecionado */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        company={company}
      />
    </>
  )
}
