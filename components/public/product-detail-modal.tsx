'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Package,
  ExternalLink,
  MessageCircle,
  Tag,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { Company, CompanyProduct } from '@/types/platform'
import { normalizePhone } from '@/lib/utils'

interface ProductDetailModalProps {
  product: CompanyProduct | null
  isOpen: boolean
  onClose: () => void
  company: Company
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  company,
}) => {
  if (!isOpen || !product) return null

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

  // Handle WhatsApp Interest
  const handleInterestWhatsApp = () => {
    const raw = company.whatsapp || ''
    const clean = normalizePhone(raw)
    const message = `Olá! Vi o produto "${product.name}" na sua DiretoLink e gostaria de saber mais.`
    
    if (clean) {
      const url = `https://wa.me/55${clean}?text=${encodeURIComponent(message)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Handle Direct Purchase Link
  const handlePurchase = () => {
    if (product.purchaseUrl) {
      let finalUrl = product.purchaseUrl.trim()
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`
      }
      window.open(finalUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const isAvailable = product.isAvailable !== false
  const isConsult = product.priceType === 'consult' || product.price == null
  const hasPromo = !isConsult && product.promotionalPrice != null && product.promotionalPrice > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ y: '100%', opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={`relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col border ${
          isDark
            ? 'bg-[#15151b] border-white/10 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Mobile Drag Bar */}
        <div className="w-12 h-1.5 bg-neutral-500/40 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header / Close button */}
        <div className="absolute top-3 right-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDark
                ? 'bg-black/60 hover:bg-black/80 text-white/80 hover:text-white'
                : 'bg-white/80 hover:bg-white text-neutral-700 hover:text-neutral-900 shadow-sm'
            }`}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">
          {/* Foto Maior do Produto */}
          {(() => {
            const productPhoto =
              product.photoUrl ||
              (product as unknown as { imageUrl?: string; image?: string; photo?: string }).imageUrl ||
              (product as unknown as { image?: string }).image ||
              (product as unknown as { photo?: string }).photo ||
              ''

            return (
              <div
                className={`relative w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden border flex items-center justify-center ${
                  isDark ? 'bg-neutral-900 border-white/5' : 'bg-neutral-100 border-neutral-200'
                }`}
              >
                {productPhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={productPhoto}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-400 gap-2">
                    <Package className="w-12 h-12 opacity-60" />
                    <span className="text-xs font-medium">Sem imagem</span>
                  </div>
                )}

                {/* Badges sobre a foto */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                  {product.category && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/15">
                      {product.category}
                    </span>
                  )}
                  {hasPromo && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Promoção
                    </span>
                  )}
                </div>

                {/* Badge de Disponibilidade */}
                <div className="absolute bottom-3 left-3 z-10">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md border ${
                      isAvailable
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {isAvailable ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Disponível</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Indisponível</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            )
          })()}

          {/* Nome e Preço */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              {product.name}
            </h2>

            {/* Bloco de Preços */}
            <div className="flex items-baseline gap-2.5 flex-wrap">
              {isConsult ? (
                <span className="text-lg font-black text-amber-400">
                  Preço sob consulta
                </span>
              ) : hasPromo ? (
                <>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {formatPrice(product.promotionalPrice)}
                  </span>
                  <span
                    className={`text-sm line-through font-mono ${
                      isDark ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  >
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span
                  className="text-2xl font-black font-mono"
                  style={{ color: isDark ? '#ffffff' : primaryColor }}
                >
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Descrição */}
          {product.description && (
            <div
              className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                isDark
                  ? 'bg-white/[0.03] border-white/5 text-neutral-300'
                  : 'bg-neutral-50 border-neutral-200/80 text-neutral-700'
              }`}
            >
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Descrição
              </h4>
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>

        {/* Rodapé Fixo com Botões de Ação */}
        <div
          className={`p-4 sm:p-5 border-t shrink-0 flex flex-col sm:flex-row gap-2.5 ${
            isDark ? 'bg-[#101015] border-white/10' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          {/* CTA Principal: Tenho Interesse (WhatsApp) */}
          <button
            type="button"
            onClick={handleInterestWhatsApp}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Tenho interesse</span>
          </button>

          {/* CTA Opcional: Comprar Link */}
          {product.purchaseUrl && (
            <button
              type="button"
              onClick={handlePurchase}
              className="py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Comprar</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
