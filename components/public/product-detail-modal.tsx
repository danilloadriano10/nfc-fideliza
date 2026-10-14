'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  X,
  Package,
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  Layers,
} from 'lucide-react'
import { Company, CompanyProduct } from '@/types/platform'
import { normalizePhone } from '@/lib/utils'
import { buildProductWhatsAppMessage } from '@/lib/product-whatsapp'

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
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0)

  useEffect(() => {
    if (product?.variations && product.variations.length > 0) {
      setSelectedVariation(product.variations[0].name)
    } else {
      setSelectedVariation(null)
    }
    setActivePhotoIndex(0)
  }, [product])

  const productPhotoList = useMemo(() => {
    if (!product) return []
    const list: string[] = []
    if (product.photoUrl) list.push(product.photoUrl)
    if (Array.isArray(product.photos)) {
      product.photos.forEach((p) => {
        if (p && !list.includes(p)) list.push(p)
      })
    }
    return list
  }, [product])

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
    const customTemplate =
      company.productWhatsAppTemplate || company.productCatalog?.whatsappMessageTemplate

    const message = buildProductWhatsAppMessage({
      template: customTemplate,
      product,
      companyName: company.name,
      selectedVariation,
    })

    if (clean) {
      const phoneWithDdi = clean.startsWith('55') ? clean : `55${clean}`
      const url = `https://wa.me/${phoneWithDdi}?text=${encodeURIComponent(message)}`
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

  const activePhoto = productPhotoList[activePhotoIndex] || product.photoUrl || ''

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/75 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ y: '100%', opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={`relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col border ${
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
                : 'bg-white/85 hover:bg-white text-neutral-700 hover:text-neutral-900 shadow-sm'
            }`}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">
          {/* Foto Principal do Produto */}
          <div className="space-y-2">
            <div
              className={`relative w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden border flex items-center justify-center shadow-xs ${
                isDark ? 'bg-neutral-900 border-white/5' : 'bg-neutral-100 border-neutral-200'
              }`}
            >
              {activePhoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activePhoto}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-neutral-400 gap-2">
                  <Package className="w-12 h-12 opacity-60" />
                  <span className="text-xs font-medium">Sem imagem cadastrada</span>
                </div>
              )}

              {/* Badges sobre a foto */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                {product.category && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/65 backdrop-blur-md text-white border border-white/15 shadow-2xs">
                    {product.category}
                  </span>
                )}
                {hasPromo && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Promoção
                  </span>
                )}
              </div>

              {/* Badge de Disponibilidade */}
              <div className="absolute bottom-3 left-3 z-10">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md border shadow-2xs ${
                    isAvailable
                      ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-950/85 text-rose-300 border-rose-500/40'
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
                      <span>Esgotado / Indisponível</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Galeria de Fotos Adicionais (Miniaturas) */}
            {productPhotoList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {productPhotoList.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activePhotoIndex === idx
                        ? 'border-violet-600 ring-2 ring-violet-500/30 scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nome e Preço */}
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              {product.name}
            </h2>

            {/* Bloco de Preços */}
            <div className="flex items-baseline gap-2.5 flex-wrap">
              {isConsult ? (
                <span className="text-base sm:text-lg font-black text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  Preço sob consulta
                </span>
              ) : hasPromo ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono">
                    {formatPrice(product.promotionalPrice)}
                  </span>
                  <span
                    className={`text-sm line-through font-mono ${
                      isDark ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  >
                    {formatPrice(product.price)}
                  </span>
                </div>
              ) : (
                <span
                  className="text-2xl sm:text-3xl font-black font-mono"
                  style={{ color: isDark ? '#ffffff' : primaryColor }}
                >
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Tamanhos / Variações Opcionais */}
          {product.variations && product.variations.length > 0 && (
            <div
              className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-white/[0.03] border-white/5' : 'bg-neutral-50 border-neutral-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-violet-400" />
                  <span>Tamanhos / Variações</span>
                </span>
                {selectedVariation && (
                  <span className="text-[11px] font-bold text-violet-500">
                    Selecionado: {selectedVariation}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {product.variations.map((v) => {
                  const isSelected = selectedVariation === v.name
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariation(v.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-600 shadow-xs scale-105'
                          : isDark
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-white/10'
                          : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200 shadow-2xs'
                      }`}
                    >
                      <span>{v.name}</span>
                      {v.price != null && (
                        <span
                          className={`text-[10px] font-mono ml-0.5 ${
                            isSelected ? 'text-violet-100' : 'text-emerald-500 font-semibold'
                          }`}
                        >
                          (R$ {v.price.toFixed(2).replace('.', ',')})
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Descrição Completa */}
          {product.description && (
            <div
              className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                isDark
                  ? 'bg-white/[0.03] border-white/5 text-neutral-300'
                  : 'bg-neutral-50 border-neutral-200/80 text-neutral-700'
              }`}
            >
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Descrição Completa
              </h4>
              <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé Fixo com Botão "Tenho interesse" / WhatsApp */}
        <div
          className={`p-4 sm:p-5 border-t shrink-0 flex flex-col sm:flex-row gap-2.5 ${
            isDark ? 'bg-[#101015] border-white/10' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          {/* CTA Principal: Tenho Interesse (WhatsApp com mensagem automática) */}
          <button
            type="button"
            onClick={handleInterestWhatsApp}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white shrink-0" />
            <span>{isAvailable ? 'Tenho interesse' : 'Consultar disponibilidade'}</span>
          </button>

          {/* CTA Opcional: Link de Compra Direta */}
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
