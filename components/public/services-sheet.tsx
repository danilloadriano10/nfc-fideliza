'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Clock,
  Sparkles,
  MessageCircle,
  Scissors,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react'
import { Company, CompanyService } from '@/types/platform'
import { normalizePhone } from '@/lib/utils'

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
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)

  if (!isOpen) return null

  // Filter only active services for customers
  const activeServices = services.filter((s) => s.isActive !== false)

  // Categories list
  const categories = Array.from(
    new Set(activeServices.map((s) => s.category || 'Geral').filter(Boolean))
  )
  const categoryFilters = ['Todos', ...categories]

  const filtered = activeServices.filter((s) => {
    if (selectedCategory === 'Todos') return true
    return (s.category || 'Geral') === selectedCategory
  })

  // WhatsApp click handler
  const handleInquireWhatsApp = (service: CompanyService) => {
    const raw = company.whatsapp || ''
    const clean = normalizePhone(raw)
    if (!clean) return

    const message = `Olá! Vi o serviço "${service.name}" na DiretoLink e gostaria de mais informações.`
    const url = `https://wa.me/55${clean}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const primaryColor = company.primaryColor || '#6D28D9'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm"
      />

      {/* Sheet Content */}
      <motion.div
        initial={{ y: '100%', opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col"
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

        {/* Top Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base leading-tight">
                Nossos Serviços
              </h3>
              <p className="text-[11px] text-neutral-500">
                {company.name} · Consulte detalhes e valores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filters Bar */}
        {categoryFilters.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
            {categoryFilters.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Services List (Scrollable) */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-0.5 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-neutral-400">
              <Sparkles className="w-8 h-8 mx-auto opacity-40 text-violet-600" />
              <p className="text-xs font-medium text-neutral-600">
                Nenhum serviço disponível nesta categoria.
              </p>
            </div>
          ) : (
            filtered.map((srv) => {
              const isConsult = srv.priceType === 'consult' || srv.price == null
              const isExpanded = expandedServiceId === srv.id
              const hasPhoto = Boolean(srv.photoUrl && !srv.photoUrl.startsWith('data:'))

              return (
                <div
                  key={srv.id}
                  className="bg-neutral-50/80 border border-neutral-200/80 rounded-2xl p-3.5 space-y-2.5 transition-all hover:bg-neutral-50"
                >
                  <div className="flex gap-3 items-start">
                    {/* Thumbnail */}
                    {hasPhoto ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-200 shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={srv.photoUrl}
                          alt={srv.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-violet-100/60 text-violet-700 flex items-center justify-center shrink-0 border border-violet-200/50">
                        <Scissors className="w-6 h-6 opacity-70" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-neutral-900 text-xs sm:text-sm leading-snug truncate">
                          {srv.name}
                        </h4>
                        {srv.category && (
                          <span className="text-[10px] font-semibold text-neutral-500 bg-white border border-neutral-200/80 px-2 py-0.5 rounded-full shrink-0">
                            {srv.category}
                          </span>
                        )}
                      </div>

                      {/* Price and duration */}
                      <div className="flex items-center gap-2.5 text-xs">
                        {isConsult ? (
                          <span className="font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md text-[11px] border border-violet-100">
                            Consulte
                          </span>
                        ) : (
                          <span className="font-bold text-neutral-900 font-mono text-sm">
                            R$ {srv.price?.toFixed(2).replace('.', ',')}
                          </span>
                        )}

                        {srv.durationMinutes ? (
                          <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>{srv.durationMinutes} min</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Short description */}
                      {srv.description && (
                        <p
                          className={`text-xs text-neutral-500 leading-relaxed ${
                            !isExpanded ? 'line-clamp-2' : ''
                          }`}
                        >
                          {srv.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between gap-2">
                    {srv.description && srv.description.length > 70 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedServiceId(isExpanded ? null : srv.id)
                        }
                        className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Menos detalhes' : 'Mais detalhes'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      {company.modules?.appointments && onBookService && (
                        <button
                          type="button"
                          onClick={() => onBookService(srv)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Agendar</span>
                        </button>
                      )}
                      {company.whatsapp && (
                        <button
                          type="button"
                          onClick={() => handleInquireWhatsApp(srv)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-neutral-100 text-center text-[10px] text-neutral-400 shrink-0">
          DiretoLink · Um link. Várias possibilidades.
        </div>
      </motion.div>
    </div>
  )
}
