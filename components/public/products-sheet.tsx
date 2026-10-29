'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Package,
  Search,
  Sparkles,
  Layers,
  ChevronRight,
  MessageCircle,
  Tag,
} from 'lucide-react'
import { Company, CompanyProduct } from '@/types/platform'
import { getPublicTheme } from '@/lib/public-themes'
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
        if (Array.isArray(company.productsOrder) && company.productsOrder.length > 0) {
          const idxA = company.productsOrder.indexOf(a.id)
          const idxB = company.productsOrder.indexOf(b.id)
          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return -1
          if (idxB !== -1) return 1
        }
        const orderA = typeof a.order === 'number' ? a.order : 0
        const orderB = typeof b.order === 'number' ? b.order : 0
        if (orderA !== orderB) return orderA - orderB
        return (b.createdAt || '').localeCompare(a.createdAt || '')
      })
  }, [products, company.id, company.productsOrder])

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

  const activeTheme = useMemo(
    () => getPublicTheme(company.theme, company.customThemeConfig, company.themeColors),
    [company.theme, company.customThemeConfig, company.themeColors]
  )
  const isDark = activeTheme.isDarkBase ?? false
  const primaryColor = activeTheme.colors.primary || company.primaryColor || '#6D28D9'
  const buttonBg = activeTheme.colors.buttonBg || primaryColor
  const buttonText = activeTheme.colors.buttonText || '#FFFFFF'
  const priceColor = activeTheme.colors.priceColor || (isDark ? '#34D399' : '#059669')

  // Format currency
  const formatPrice = (value?: number | null) => {
    if (value == null) return null
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
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

        {/* Vitrine Modal Container - Padronizado igual ao Cardápio Digital */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className={`relative w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] h-[92vh] sm:h-auto sm:max-h-[88vh] border ${
            isDark
              ? 'bg-[#121217] border-white/10 text-white'
              : 'bg-white border-neutral-200 text-neutral-900'
          }`}
          style={{
            backgroundColor: activeTheme.modalBg,
            borderColor: activeTheme.containerBorderColor,
          }}
        >
          {/* Header Superior Fixo */}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base sm:text-lg tracking-tight truncate">
                    Catálogo de Produtos
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isDark ? 'bg-white/10 text-neutral-300' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {activeProducts.length} {activeProducts.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {company.name} • Vitrine Oficial de Produtos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
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

          {/* Search Bar & Categories Filter (Fixos abaixo do Header) */}
          <div
            className={`p-3.5 sm:p-4 space-y-3 shrink-0 border-b ${
              isDark ? 'bg-[#101015] border-white/[0.06]' : 'bg-white border-neutral-100'
            }`}
          >
            {/* Input de Busca */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto por nome, categoria ou descrição..."
                className={`w-full pl-10 pr-9 py-2.5 rounded-2xl border text-xs sm:text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 shadow-2xs ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder-neutral-500'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chips de Categorias com Contadores */}
            {categoriesWithCounts.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 touch-pan-x">
                {categoriesWithCounts.map((cat) => {
                  const isSelected = selectedCategory === cat.name
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'text-white shadow-sm scale-[1.02]'
                          : isDark
                          ? 'bg-[#181820] hover:bg-white/10 text-neutral-300 border border-white/10'
                          : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200'
                      }`}
                      style={isSelected ? { backgroundColor: primaryColor } : undefined}
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

          {/* Lista de Produtos Ampla (Fotos em tamanho generoso, sem espremer) */}
          <div className="overflow-y-auto flex-1 p-3.5 sm:p-5">
            {filteredProducts.length === 0 ? (
              <div
                className={`text-center py-16 px-4 rounded-3xl border border-dashed flex flex-col items-center justify-center ${
                  isDark
                    ? 'border-white/10 bg-white/[0.02]'
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                >
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm">Nenhum produto encontrado</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">
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
                    className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-200 dark:bg-white/10 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Ver todos os produtos
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
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
                      className={`group rounded-2xl sm:rounded-3xl border transition-all cursor-pointer flex flex-row sm:flex-col overflow-hidden select-none active:scale-[0.99] shadow-2xs ${
                        isDark
                          ? 'bg-[#15151c] border-white/[0.08] hover:border-white/20'
                          : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {/* Foto Ampla: 1:1 no celular à esquerda e 1:1 no desktop no topo */}
                      <div className="w-[136px] h-[136px] min-w-[136px] min-[390px]:w-[148px] min-[390px]:h-[148px] min-[390px]:min-w-[148px] sm:w-full sm:h-auto sm:aspect-square relative overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border-b-0 sm:border-b border-black/5 dark:border-white/5">
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
                          <div
                            className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
                            style={{
                              backgroundColor: `${primaryColor}14`,
                              color: primaryColor,
                            }}
                          >
                            <Package className="w-8 h-8 opacity-70 mb-1" />
                            <span className="text-[10px] font-bold">Produto</span>
                          </div>
                        )}

                        {/* Badge de Promoção */}
                        {hasPromo && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs z-10">
                            {discountPercent ? `-${discountPercent}%` : 'Promo'}
                          </span>
                        )}

                        {/* Badge Esgotado */}
                        {isSoldOut && (
                          <div className="absolute inset-0 bg-black/75 backdrop-blur-2xs flex items-center justify-center p-1 text-center z-20">
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                              Esgotado
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Informações Completas do Produto */}
                      <div className="flex-1 min-w-0 p-3 sm:p-3.5 flex flex-col justify-between">
                        <div>
                          {item.category && (
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block truncate">
                              {item.category}
                            </span>
                          )}

                          <h4
                            className={`font-black text-xs sm:text-sm leading-snug line-clamp-2 mt-0.5 ${
                              isDark ? 'text-white' : 'text-neutral-900'
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </h4>

                          {item.description && (
                            <p className={`text-[10px] sm:text-xs line-clamp-1 mt-0.5 ${
                              isDark ? 'text-neutral-400' : 'text-neutral-500'
                            }`}>
                              {item.description}
                            </p>
                          )}

                          {item.variations && item.variations.length > 0 && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[9px] font-semibold mt-1">
                              <Tag className="w-2.5 h-2.5" />
                              <span>{item.variations.length} {item.variations.length === 1 ? 'variação' : 'tamanhos'}</span>
                            </div>
                          )}
                        </div>

                        {/* Preço e Ações */}
                        <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/5 space-y-1.5">
                          <div className="min-w-0">
                            {isConsult ? (
                              <span className="text-xs font-bold text-amber-500 block truncate">
                                Sob consulta
                              </span>
                            ) : hasPromo ? (
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span
                                  className="text-xs sm:text-sm font-black font-mono leading-tight"
                                  style={{ color: priceColor }}
                                >
                                  {formatPrice(item.promotionalPrice)}
                                </span>
                                <span className="text-[10px] text-neutral-400 line-through font-mono">
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                            ) : (
                              <span
                                className="text-xs sm:text-sm font-black font-mono leading-tight block"
                                style={{ color: priceColor }}
                              >
                                {formatPrice(item.price)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 w-full">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProduct(item)
                              }}
                              className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs hover:opacity-95 active:scale-[0.98]"
                              style={{
                                backgroundColor: buttonBg,
                                color: buttonText,
                              }}
                            >
                              <span>Ver produto</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>

                            {company.whatsapp && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const raw = company.whatsapp || ''
                                  const clean = raw.replace(/\D/g, '')
                                  const phoneWithDdi = clean.startsWith('55') ? clean : `55${clean}`
                                  const msg = encodeURIComponent(
                                    `Olá! Gostei do produto "${item.name}" na DiretoLink e gostaria de pedir.`
                                  )
                                  window.open(
                                    `https://wa.me/${phoneWithDdi}?text=${msg}`,
                                    '_blank',
                                    'noopener,noreferrer'
                                  )
                                }}
                                className="p-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center transition-transform active:scale-95 shadow-xs cursor-pointer shrink-0"
                                title="Pedir no WhatsApp"
                                aria-label="Pedir no WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                              </button>
                            )}
                          </div>
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

      {/* Modal de Detalhe Completo do Produto */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          company={company}
        />
      )}
    </AnimatePresence>
  )
}
