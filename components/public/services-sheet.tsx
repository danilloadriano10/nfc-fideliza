'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Clock,
  Sparkles,
  MessageCircle,
  Scissors,
  Check,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Company, CompanyService } from '@/types/platform'
import { normalizePhone } from '@/lib/utils'
import { getPublicTheme } from '@/lib/public-themes'

interface ServicesSheetProps {
  isOpen: boolean
  onClose: () => void
  services: CompanyService[]
  company: Company
  onBookService?: (service: CompanyService) => void
}

export const ServicesSheet: React.FC<ServicesSheetProps> = ({
  isOpen,
  onClose,
  services,
  company,
  onBookService,
}) => {
  const [search, setSearch] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

  // Theme resolution
  const activeTheme = useMemo(
    () => getPublicTheme(company.theme, company.customThemeConfig, company.themeColors),
    [company.theme, company.customThemeConfig, company.themeColors]
  )
  const isDark = activeTheme.isDarkBase ?? false
  const primaryColor = activeTheme.colors.primary || company.primaryColor || '#6D28D9'
  const buttonBg = activeTheme.colors.buttonBg || primaryColor
  const buttonText = activeTheme.colors.buttonText || '#FFFFFF'
  const priceColor = activeTheme.colors.priceColor || (isDark ? '#34D399' : '#059669')

  // Filter only active services sorted by company order
  const activeServices = useMemo(() => {
    return services
      .filter((s) => s.isActive !== false)
      .sort((a, b) => {
        if (Array.isArray(company.servicesOrder) && company.servicesOrder.length > 0) {
          const idxA = company.servicesOrder.indexOf(a.id)
          const idxB = company.servicesOrder.indexOf(b.id)
          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return -1
          if (idxB !== -1) return 1
        }
        const orderA = typeof a.order === 'number' ? a.order : 0
        const orderB = typeof b.order === 'number' ? b.order : 0
        if (orderA !== orderB) return orderA - orderB
        return (a.name || '').localeCompare(b.name || '')
      })
  }, [services, company.servicesOrder])

  // Categories list with item counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    activeServices.forEach((s) => {
      const cat = s.category?.trim() || 'Geral'
      counts[cat] = (counts[cat] || 0) + 1
    })
    const cats = Object.keys(counts).sort()
    return [
      { name: 'Todos', count: activeServices.length },
      ...cats.map((c) => ({ name: c, count: counts[c] })),
    ]
  }, [activeServices])

  // Filtered by category and search query
  const filtered = useMemo(() => {
    return activeServices.filter((s) => {
      const matchCat =
        selectedCategory === 'Todos' || (s.category?.trim() || 'Geral') === selectedCategory
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      return matchCat && matchSearch
    })
  }, [activeServices, selectedCategory, search])

  // Toggle description expansion
  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Inquire via WhatsApp
  const handleInquireWhatsApp = (service: CompanyService) => {
    const raw = company.whatsapp || ''
    const clean = normalizePhone(raw)
    if (!clean) return

    const message = `Olá! Vi o serviço "${service.name}" na DiretoLink e gostaria de mais informações.`
    const phoneWithDdi = clean.startsWith('55') ? clean : `55${clean}`
    const url = `https://wa.me/${phoneWithDdi}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
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

        {/* Modal Sheet Container - Padronizado igual ao Cardápio Digital */}
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
                <Scissors className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base sm:text-lg tracking-tight truncate">
                    Nossos Serviços
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isDark ? 'bg-white/10 text-neutral-300' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {activeServices.length} {activeServices.length === 1 ? 'serviço' : 'serviços'}
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {company.name} · Consulte detalhes, duração e agende
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

          {/* Barra de Busca e Filtros de Categoria (Fixa abaixo do header) */}
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
                placeholder="Buscar serviço por nome ou descrição..."
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

            {/* Chips de Categorias */}
            {categoriesWithCounts.length > 2 && (
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

          {/* Lista Ampla de Serviços (Sem cards espremidos) */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5">
            {filtered.length === 0 ? (
              <div
                className={`py-16 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center ${
                  isDark ? 'border-white/10 text-neutral-400' : 'border-neutral-200 text-neutral-500'
                }`}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                >
                  <Scissors className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm">Nenhum serviço encontrado</h4>
                <p className="text-xs mt-1 max-w-xs text-neutral-400">
                  {search
                    ? `Nenhum resultado para "${search}". Tente buscar por outros termos.`
                    : 'Não há serviços disponíveis nesta categoria.'}
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
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 sm:gap-4">
                {filtered.map((srv) => {
                  const isConsult = srv.priceType === 'consult' || srv.price == null
                  const servicePhoto = srv.photoUrl || (srv as unknown as { imageUrl?: string }).imageUrl || ''
                  const hasPhoto = Boolean(servicePhoto && servicePhoto.trim().length > 0)
                  const isExpanded = Boolean(expandedDescriptions[srv.id])

                  return (
                    <div
                      key={srv.id}
                      className={`group p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-start sm:items-stretch shadow-2xs ${
                        isDark
                          ? 'bg-[#15151c] border-white/[0.08] hover:border-white/20'
                          : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {/* Foto Ampla do Serviço */}
                      <div className="w-full sm:w-36 h-44 sm:h-auto sm:aspect-square rounded-2xl overflow-hidden shrink-0 relative bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5">
                        {hasPhoto ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={servicePhoto}
                            alt={srv.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
                            style={{
                              backgroundColor: `${primaryColor}14`,
                              color: primaryColor,
                            }}
                          >
                            <Scissors className="w-8 h-8 opacity-70 mb-1" />
                            <span className="text-[10px] font-bold">Serviço</span>
                          </div>
                        )}

                        {srv.category && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-xs text-white z-10">
                            {srv.category}
                          </span>
                        )}
                      </div>

                      {/* Informações Completas do Serviço */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-sm sm:text-base leading-snug">
                              {srv.name}
                            </h4>

                            {srv.durationMinutes ? (
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                  isDark ? 'bg-white/5 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                                }`}
                              >
                                <Clock className="w-3 h-3 text-neutral-400" />
                                <span>{srv.durationMinutes} min</span>
                              </span>
                            ) : null}
                          </div>

                          {srv.description && (
                            <div className="mt-1.5">
                              <p
                                className={`text-xs leading-relaxed ${
                                  isDark ? 'text-neutral-300' : 'text-neutral-600'
                                } ${!isExpanded && srv.description.length > 120 ? 'line-clamp-2' : ''}`}
                              >
                                {srv.description}
                              </p>
                              {srv.description.length > 120 && (
                                <button
                                  type="button"
                                  onClick={() => toggleDescription(srv.id)}
                                  className="text-[11px] font-bold mt-0.5 inline-flex items-center gap-0.5 transition-opacity hover:opacity-80 cursor-pointer"
                                  style={{ color: primaryColor }}
                                >
                                  <span>{isExpanded ? 'Ver menos' : 'Ver mais'}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Linha Inferior com Preço Destacado e Ação */}
                        <div className="pt-3 mt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-none mb-0.5">
                              Valor
                            </span>
                            <div
                              className="text-base sm:text-lg font-black font-mono leading-tight"
                              style={{ color: priceColor }}
                            >
                              {isConsult ? (
                                <span className="text-xs sm:text-sm font-bold text-amber-500">
                                  Sob consulta
                                </span>
                              ) : (
                                `R$ ${srv.price?.toFixed(2).replace('.', ',')}`
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {onBookService && (
                              <button
                                type="button"
                                onClick={() => onBookService(srv)}
                                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 hover:opacity-95"
                                style={{ backgroundColor: buttonBg, color: buttonText }}
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Agendar Horário</span>
                              </button>
                            )}

                            {company.whatsapp && (
                              <button
                                type="button"
                                onClick={() => handleInquireWhatsApp(srv)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                  !onBookService
                                    ? 'bg-[#25D366] text-white border-transparent hover:bg-[#20ba59]'
                                    : isDark
                                    ? 'border-white/10 hover:bg-white/10 text-neutral-300'
                                    : 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                                }`}
                                title="Falar no WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{!onBookService ? 'Consultar no WhatsApp' : 'Dúvidas'}</span>
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
    </AnimatePresence>
  )
}
