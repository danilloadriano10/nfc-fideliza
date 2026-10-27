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
  MessageCircle,
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

  if (!isOpen) return null

  const activeTheme = getPublicTheme(company.theme, company.customThemeConfig, company.themeColors)
  const isDark = activeTheme.isDarkBase
  const primaryColor = activeTheme.colors.primary || company.primaryColor || '#6D28D9'

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
                          ? 'shadow-xs'
                          : isDark
                          ? 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/5'
                          : 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: activeTheme.colors.buttonBg,
                              color: activeTheme.colors.buttonText,
                            }
                          : undefined
                      }
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
          <div className="overflow-y-auto flex-1 p-2.5 sm:p-4">
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
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    style={{
                      backgroundColor: activeTheme.colors.buttonBg,
                      color: activeTheme.colors.buttonText,
                    }}
                  >
                    Ver todos os produtos
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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
                      className="group flex flex-col justify-between transition-all cursor-pointer relative select-none active:scale-[0.99]"
                    >
                      <div>
                        {/* Foto do Produto em Grade - Sem container cinza, aproveitando 100% da largura da coluna com object-contain */}
                        <div className="relative w-full aspect-square mb-2 flex items-center justify-center overflow-hidden">
                          {itemPhoto ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={itemPhoto}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className={`w-full h-full rounded-2xl flex flex-col items-center justify-center ${
                                isDark ? 'bg-white/[0.04] text-neutral-500' : 'bg-neutral-100/80 text-neutral-400'
                              }`}
                            >
                              <Package className="w-8 h-8 opacity-40 mb-1" />
                              <span className="text-[10px] font-medium text-neutral-500">Sem foto</span>
                            </div>
                          )}

                          {/* Badge de Promoção */}
                          {hasPromo && (
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs z-10">
                              {discountPercent ? `-${discountPercent}%` : 'Promo'}
                            </span>
                          )}

                          {/* Badge Esgotado */}
                          {isSoldOut && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-2xs rounded-xl flex items-center justify-center p-1 text-center z-20">
                              <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                                Esgotado
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Nome e Categoria diretamente abaixo da imagem */}
                        <div className="space-y-0.5 px-0.5">
                          {item.category && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block truncate">
                              {item.category}
                            </span>
                          )}

                          <h4
                            className={`font-semibold sm:font-bold text-xs sm:text-sm leading-snug line-clamp-2 ${
                              isDark ? 'text-white' : 'text-neutral-900'
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </h4>

                          {/* Variações */}
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

                      {/* Preço e Botão de Ação diretamente abaixo */}
                      <div className="pt-1.5 px-0.5 space-y-2">
                        <div className="min-w-0">
                          {isConsult ? (
                            <span className="text-xs font-bold text-amber-500 dark:text-amber-400 block truncate">
                              Consultar
                            </span>
                          ) : hasPromo ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span
                                className="text-xs sm:text-sm font-black font-mono leading-tight"
                                style={{ color: activeTheme.colors.priceColor }}
                              >
                                {formatPrice(item.promotionalPrice)}
                              </span>
                              <span
                                className={`text-[10px] line-through font-mono leading-tight ${
                                  isDark ? 'text-neutral-500' : 'text-neutral-400'
                                }`}
                              >
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="text-xs sm:text-sm font-black font-mono leading-tight block"
                              style={{ color: activeTheme.colors.priceColor }}
                            >
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </div>

                        {/* Botão de Ação Direto */}
                        <div className="flex items-center gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProduct(item)
                            }}
                            className="flex-1 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                            style={{
                              backgroundColor: activeTheme.colors.buttonBg,
                              color: activeTheme.colors.buttonText,
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
                                  `Olá! Gostei do produto "${item.name}" no DiretoLink e gostaria de saber mais.`
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
