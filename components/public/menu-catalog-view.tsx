'use client'

import React, { useState, useMemo } from 'react'
import {
  UtensilsCrossed,
  ShoppingBag,
  Search,
  X,
  Flame,
  Star,
  Tag,
  LayoutGrid,
  Pizza,
  Coffee,
  Package,
  Cake,
} from 'lucide-react'
import { Company, MenuItem } from '@/types/platform'
import { getPublicTheme } from '@/lib/public-themes'
import { CartItem } from './menu-item-modal'

export interface MenuCatalogViewProps {
  company: Company
  menuItems: MenuItem[]
  cart?: CartItem[]
  onSelectItem: (item: MenuItem) => void
  onOpenCart?: () => void
  tableNumber?: string
  showHeader?: boolean
  showSearch?: boolean
  isModal?: boolean
  className?: string
  customThemedCardStyle?: React.CSSProperties
  customPrimaryColor?: string
  customButtonBgColor?: string
  customButtonTextColor?: string
  customPriceColor?: string
}

export const MenuCatalogView: React.FC<MenuCatalogViewProps> = ({
  company,
  menuItems,
  cart = [],
  onSelectItem,
  onOpenCart,
  tableNumber,
  showHeader = true,
  showSearch = true,
  isModal = false,
  className = '',
  customThemedCardStyle,
  customPrimaryColor,
  customButtonBgColor,
  customButtonTextColor,
  customPriceColor,
}) => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')

  // Theme resolution
  const activeTheme = useMemo(
    () => getPublicTheme(company.theme, company.customThemeConfig, company.themeColors),
    [company.theme, company.customThemeConfig, company.themeColors]
  )
  const isDark = activeTheme.isDarkBase ?? false
  const primaryColor = customPrimaryColor || activeTheme.colors.primary || company.primaryColor || '#7A1228'
  const buttonBgColor = customButtonBgColor || activeTheme.colors.buttonBg || primaryColor
  const buttonTextColor = customButtonTextColor || activeTheme.colors.buttonText || '#FFFFFF'
  const priceColor = customPriceColor || activeTheme.colors.priceColor || (isDark ? '#34D399' : '#059669')

  const themedCardStyle = useMemo(() => {
    if (customThemedCardStyle) return customThemedCardStyle
    return {
      backgroundColor: activeTheme.colors.cardBg || activeTheme.cardBg,
      borderColor: activeTheme.colors.borderColor || activeTheme.cardBorder,
    }
  }, [customThemedCardStyle, activeTheme.colors.cardBg, activeTheme.cardBg, activeTheme.colors.borderColor, activeTheme.cardBorder])

  // Active items of this company sorted correctly
  const sortedItems = useMemo(() => {
    return [...menuItems]
      .filter((i) => (i.companyId ? i.companyId === company.id : true) && i.isActive !== false)
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

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(sortedItems.map((i) => i.category?.trim() || 'Geral'))
    ).filter(Boolean)
    return ['Todos', ...cats]
  }, [sortedItems])

  // Filtered items by category and search
  const filteredItems = useMemo(() => {
    return sortedItems.filter((item) => {
      const matchCategory =
        selectedCategory === 'Todos' ||
        (item.category?.trim() || 'Geral') === selectedCategory
      if (!matchCategory) return false

      const q = search.trim().toLowerCase()
      if (!q) return true

      const nameMatch = item.name.toLowerCase().includes(q)
      const descMatch = Boolean(item.description && item.description.toLowerCase().includes(q))
      const catMatch = Boolean(item.category && item.category.toLowerCase().includes(q))
      const extrasMatch = Boolean(
        item.extras && item.extras.some((e) => e.name.toLowerCase().includes(q))
      )
      const sizesMatch = Boolean(
        item.sizes && item.sizes.some((s) => s.name.toLowerCase().includes(q))
      )

      return nameMatch || descMatch || catMatch || extrasMatch || sizesMatch
    })
  }, [sortedItems, selectedCategory, search])

  // Helper for category icons
  const getCategoryIcon = (c: string) => {
    const lower = c.toLowerCase()
    if (lower === 'todos') return <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
    if (lower.includes('pizza')) return <Pizza className="w-3.5 h-3.5 shrink-0" />
    if (
      lower.includes('bebida') ||
      lower.includes('drink') ||
      lower.includes('café') ||
      lower.includes('suco') ||
      lower.includes('refrigerante')
    )
      return <Coffee className="w-3.5 h-3.5 shrink-0" />
    if (
      lower.includes('combo') ||
      lower.includes('lanche') ||
      lower.includes('burger') ||
      lower.includes('sanduíche') ||
      lower.includes('porção')
    )
      return <Package className="w-3.5 h-3.5 shrink-0" />
    if (
      lower.includes('sobremesa') ||
      lower.includes('doce') ||
      lower.includes('torta') ||
      lower.includes('chocolate') ||
      lower.includes('açaí') ||
      lower.includes('sorvete')
    )
      return <Cake className="w-3.5 h-3.5 shrink-0" />
    return <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
  }

  // Currency formatter
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

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, it) => acc + (it.quantity || 1), 0)
  }, [cart])

  return (
    <div className={`space-y-3.5 sm:space-y-4 w-full ${className}`}>
      {/* 1. CABEÇALHO DO CARDÁPIO (quando ativado, ex: visualização direta na página pública) */}
      {showHeader && (
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs text-white shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span
                className="text-[10px] font-black uppercase tracking-wider block leading-none mb-1"
                style={{ color: primaryColor }}
              >
                Cardápio Digital
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`text-base sm:text-lg font-black tracking-tight ${
                    isDark ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  Nossas Opções
                </h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isDark
                      ? 'bg-white/10 text-neutral-300'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {sortedItems.length} {sortedItems.length === 1 ? 'item' : 'itens'}
                </span>
                {displayTableLabel && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                    <span>
                      Você está na <strong>{displayTableLabel}</strong>
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {totalCartCount > 0 && onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ver Pedido ({totalCartCount})</span>
            </button>
          )}
        </div>
      )}

      {/* 2. CAMPO DE BUSCA */}
      {showSearch && (
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar prato, porção, bebida ou ingrediente..."
            className={`w-full pl-10 pr-9 py-2.5 rounded-2xl border text-xs sm:text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 shadow-2xs ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-neutral-500 focus:border-white/20'
                : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-300'
            }`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer transition-colors"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 3. FILTRO DE CATEGORIAS EM CHIPS HORIZONTAIS COM ÍCONES */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 flex-nowrap shrink-0 touch-pan-x">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  isSelected
                    ? 'text-white shadow-sm scale-[1.02]'
                    : isDark
                      ? 'bg-[#181820] hover:bg-white/10 text-neutral-300 border border-white/10'
                      : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200/90'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: primaryColor }
                    : undefined
                }
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* 4. LISTA DE CARDS DO CARDÁPIO (FOTO QUADRADA 1:1 À ESQUERDA + INFORMAÇÕES À DIREITA) */}
      {filteredItems.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-3 rounded-2xl border border-dashed border-neutral-200 dark:border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center mx-auto text-neutral-400">
            <UtensilsCrossed className="w-6 h-6 opacity-60" />
          </div>
          <div className="space-y-1">
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-800'}`}>
              Nenhum item encontrado
            </p>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              {search
                ? `Nenhum resultado para "${search}". Tente buscar por outro termo.`
                : 'Não há itens disponíveis nesta categoria no momento.'}
            </p>
          </div>
          {(search || selectedCategory !== 'Todos') && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setSelectedCategory('Todos')
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 transition-colors cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 sm:gap-4 pt-1 w-full">
          {filteredItems.map((item) => {
            const hasPromo =
              item.promotionalPrice != null &&
              typeof item.price === 'number' &&
              item.promotionalPrice < item.price
            const isSoldOut = item.isAvailable === false

            // Menor preço dos tamanhos para "A partir de R$ XX,XX"
            const validSizePrices = (item.sizes || [])
              .map((s) => s.price)
              .filter((p): p is number => typeof p === 'number' && p > 0)
            const minSizePrice =
              validSizePrices.length > 0 ? Math.min(...validSizePrices) : null
            const hasPriceFrom =
              item.sizes && item.sizes.length > 0 && minSizePrice != null

            // Texto descritivo de customização (ex: "3 tamanhos • Personalizável")
            const sizeCount = item.sizes?.length || 0
            const isCustomizable = Boolean(
              (item.extras && item.extras.length > 0) ||
                (item.removableIngredients && item.removableIngredients.length > 0) ||
                item.isCustomBuilder ||
                (item.flavors && item.flavors.length > 0)
            )
            let customizationTag = ''
            if (sizeCount > 0 && isCustomizable) {
              customizationTag = `${sizeCount} ${sizeCount === 1 ? 'tamanho' : 'tamanhos'} • Personalizável`
            } else if (sizeCount > 0) {
              customizationTag = `${sizeCount} ${sizeCount === 1 ? 'tamanho' : 'tamanhos'}`
            } else if (isCustomizable) {
              customizationTag = 'Personalizável'
            }

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!isSoldOut) onSelectItem(item)
                }}
                className={`group w-full rounded-2xl sm:rounded-3xl border transition-all flex flex-row items-stretch overflow-hidden select-none ${
                  isSoldOut
                    ? 'opacity-65 cursor-not-allowed'
                    : 'cursor-pointer hover:shadow-lg active:scale-[0.99]'
                } shadow-xs`}
                style={themedCardStyle}
              >
                {/* 1. FOTO PERFEITAMENTE QUADRADA (1:1) ENCOSTANDO NAS BORDAS ESQUERDA, SUPERIOR E INFERIOR */}
                <div className="w-[160px] h-[160px] min-w-[160px] min-[390px]:w-[172px] min-[390px]:h-[172px] min-[390px]:min-w-[172px] sm:w-[185px] sm:h-[185px] sm:min-w-[185px] aspect-square shrink-0 relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  {item.photoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 p-2 text-center">
                      <UtensilsCrossed className="w-8 h-8 opacity-40 mb-1" />
                      <span className="text-[10px] font-medium">Sem foto</span>
                    </div>
                  )}

                  {/* Selos SOBRE a foto no canto superior esquerdo: Mais pedido, Destaque, Novidade */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none items-start">
                    {item.isBestSeller && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-tight bg-[#E52E2E] text-white shadow-md">
                        <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white shrink-0" />
                        <span>Mais pedido</span>
                      </span>
                    )}
                    {item.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-tight bg-[#FFB800] text-neutral-950 shadow-md">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-neutral-950 text-neutral-950 shrink-0" />
                        <span>Destaque</span>
                      </span>
                    )}
                    {item.isNew && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-tight bg-[#008A5E] text-white shadow-md">
                        <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white shrink-0" />
                        <span>Novidade</span>
                      </span>
                    )}
                  </div>

                  {hasPromo && !item.isBestSeller && !item.isFeatured && !item.isNew && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs z-10">
                      Promo
                    </span>
                  )}

                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-2xs flex items-center justify-center p-1 text-center z-20">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                        Esgotado
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. ÁREA DE INFORMAÇÕES À DIREITA COM EXATAMENTE A MESMA ALTURA DA FOTO (SEM NENHUM CORTE) */}
                <div className="flex-1 min-w-0 p-2.5 sm:p-3 flex flex-col justify-between h-[160px] min-[390px]:h-[172px] sm:h-[185px]">
                  {/* Bloco Superior: Categoria, Nome, Descrição */}
                  <div className="min-w-0">
                    {/* CATEGORIA */}
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block truncate leading-none">
                      {item.category || 'Geral'}
                    </span>

                    {/* NOME DO PRODUTO */}
                    <h4
                      className={`font-black text-xs sm:text-base leading-snug tracking-tight line-clamp-2 mt-0.5 ${
                        isDark ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {item.name}
                    </h4>

                    {/* DESCRIÇÃO */}
                    {item.description && (
                      <p
                        className={`text-[10px] sm:text-xs line-clamp-1 leading-tight mt-0.5 ${
                          isDark ? 'text-neutral-400' : 'text-neutral-500'
                        }`}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Bloco Inferior: "A partir de", Preço, Tag de Tamanhos, Botão (Sem cortes) */}
                  <div className="space-y-1 pt-0.5 min-w-0 shrink-0">
                    {/* Preço com "A partir de" */}
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 font-medium block leading-none">
                        {hasPriceFrom ? 'A partir de' : 'Valor'}
                      </span>
                      <div
                        className="text-sm sm:text-base font-black leading-tight mt-0.5"
                        style={{ color: priceColor }}
                      >
                        {hasPriceFrom ? (
                          formatMoney(minSizePrice)
                        ) : hasPromo ? (
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span style={{ color: priceColor }}>
                              {formatMoney(item.promotionalPrice)}
                            </span>
                            <span className="text-[11px] text-neutral-400 line-through font-normal">
                              {formatMoney(item.price)}
                            </span>
                          </div>
                        ) : item.price != null ? (
                          formatMoney(item.price)
                        ) : (
                          <span className="text-xs font-semibold text-neutral-400">
                            Sob consulta
                          </span>
                        )}
                      </div>
                    </div>

                    {/* "3 tamanhos • Personalizável" (completo) */}
                    <div>
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 text-[9px] sm:text-[10px] font-semibold leading-none max-w-full">
                        <Tag className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{customizationTag || 'Personalizável'}</span>
                      </div>
                    </div>

                    {/* BOTÃO "+ Pedir agora" ou "+ Montar agora" (100% inteiro, visível e sem corte) */}
                    <div className="pt-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={isSoldOut}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isSoldOut) onSelectItem(item)
                        }}
                        className={`w-full py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer shrink-0 ${
                          isSoldOut
                            ? 'opacity-40 cursor-not-allowed bg-neutral-400 text-white'
                            : 'shadow-sm hover:opacity-95'
                        }`}
                        style={
                          !isSoldOut
                            ? {
                                backgroundColor: buttonBgColor,
                                color: buttonTextColor,
                              }
                            : undefined
                        }
                      >
                        <span>
                          {item.isCustomBuilder ? '+ Montar agora' : '+ Pedir agora'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
