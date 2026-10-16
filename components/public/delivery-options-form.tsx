'use client'

import React, { useState } from 'react'
import {
  MapPin,
  Truck,
  Store,
  User,
  Phone,
  Home,
  Navigation,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Loader2,
  UtensilsCrossed,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { formatPhone, normalizePhone } from '@/lib/utils'
import { OrderDeliveryInfo, DeliveryType } from '@/lib/order-delivery'

interface DeliveryOptionsFormProps {
  info: OrderDeliveryInfo
  onChange: (updated: OrderDeliveryInfo) => void
  isDark: boolean
  errors?: Record<string, string>
  autoDetectedTable?: string | null
}

export const DeliveryOptionsForm: React.FC<DeliveryOptionsFormProps> = ({
  info,
  onChange,
  isDark,
  errors = {},
  autoDetectedTable,
}) => {
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const handleTypeChange = (type: DeliveryType) => {
    if (type === 'dine_in' && autoDetectedTable && !info.tableNumber) {
      onChange({ ...info, deliveryType: type, tableNumber: autoDetectedTable })
    } else {
      onChange({ ...info, deliveryType: type })
    }
  }

  const handleFieldChange = (field: keyof OrderDeliveryInfo, val: string) => {
    if (field === 'customerPhone') {
      onChange({ ...info, [field]: formatPhone(val) })
    } else {
      onChange({ ...info, [field]: val })
    }
  }

  const handleShareLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocalização não é suportada pelo seu dispositivo.')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const url = `https://www.google.com/maps?q=${lat},${lng}`
        onChange({
          ...info,
          locationCoordinates: { lat, lng },
          locationUrl: url,
        })
        setIsLocating(false)
      },
      (err) => {
        setIsLocating(false)
        console.warn('Geolocation error:', err)
        if (err.code === 1) {
          setLocationError('Permissão de localização negada no navegador.')
        } else {
          setLocationError('Não foi possível obter a localização exata no momento.')
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    )
  }

  const handleRemoveLocation = () => {
    onChange({
      ...info,
      locationCoordinates: null,
      locationUrl: null,
    })
    setLocationError(null)
  }

  const inputBaseClass = `w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all outline-hidden border ${
    isDark
      ? 'bg-neutral-800/80 border-neutral-700/80 text-white placeholder-neutral-500 focus:border-teal-400 focus:bg-neutral-800'
      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-teal-600 focus:bg-white'
  }`

  const inputErrorClass = isDark
    ? 'border-rose-500/80 focus:border-rose-400'
    : 'border-rose-500 focus:border-rose-600 bg-rose-50/20'

  return (
    <div className="space-y-4">
      {/* 1. Escolha entre Consumir no Local, Retirada e Entrega */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
          Forma de Recebimento
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* Opção 1: Consumir no Local */}
          <button
            type="button"
            onClick={() => handleTypeChange('dine_in')}
            className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
              info.deliveryType === 'dine_in'
                ? isDark
                  ? 'bg-teal-950/40 border-teal-500 text-white shadow-xs'
                  : 'bg-teal-50 border-teal-500 text-teal-950 shadow-xs'
                : isDark
                ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`p-1.5 rounded-xl ${
                  info.deliveryType === 'dine_in'
                    ? 'bg-teal-600 text-white'
                    : isDark
                    ? 'bg-neutral-800 text-neutral-400'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              {info.deliveryType === 'dine_in' && (
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500" />
              )}
            </div>
            <div>
              <span className="text-[11px] sm:text-xs font-bold block leading-tight">
                No local
              </span>
              <span className="text-[9px] sm:text-[10px] text-neutral-400 block mt-0.5 truncate">
                Mesa / Salão
              </span>
            </div>
          </button>

          {/* Opção 2: Retirada no Local */}
          <button
            type="button"
            onClick={() => handleTypeChange('pickup')}
            className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
              info.deliveryType === 'pickup'
                ? isDark
                  ? 'bg-teal-950/40 border-teal-500 text-white shadow-xs'
                  : 'bg-teal-50 border-teal-500 text-teal-950 shadow-xs'
                : isDark
                ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`p-1.5 rounded-xl ${
                  info.deliveryType === 'pickup'
                    ? 'bg-teal-600 text-white'
                    : isDark
                    ? 'bg-neutral-800 text-neutral-400'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              {info.deliveryType === 'pickup' && (
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500" />
              )}
            </div>
            <div>
              <span className="text-[11px] sm:text-xs font-bold block leading-tight">
                Retirada
              </span>
              <span className="text-[9px] sm:text-[10px] text-neutral-400 block mt-0.5 truncate">
                No balcão
              </span>
            </div>
          </button>

          {/* Opção 3: Entrega */}
          <button
            type="button"
            onClick={() => handleTypeChange('delivery')}
            className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
              info.deliveryType === 'delivery'
                ? isDark
                  ? 'bg-teal-950/40 border-teal-500 text-white shadow-xs'
                  : 'bg-teal-50 border-teal-500 text-teal-950 shadow-xs'
                : isDark
                ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`p-1.5 rounded-xl ${
                  info.deliveryType === 'delivery'
                    ? 'bg-teal-600 text-white'
                    : isDark
                    ? 'bg-neutral-800 text-neutral-400'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              {info.deliveryType === 'delivery' && (
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500" />
              )}
            </div>
            <div>
              <span className="text-[11px] sm:text-xs font-bold block leading-tight">
                Entrega
              </span>
              <span className="text-[9px] sm:text-[10px] text-neutral-400 block mt-0.5 truncate">
                No endereço
              </span>
            </div>
          </button>
        </div>

        {/* Bloco dedicado quando selecionado Consumir no Local */}
        {info.deliveryType === 'dine_in' && (
          <div className="pt-2">
            {autoDetectedTable ? (
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 ${
                  isDark
                    ? 'bg-teal-950/30 border-teal-500/40 text-teal-200'
                    : 'bg-teal-50/80 border-teal-300 text-teal-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block leading-tight truncate">
                      Você está na <strong className="underline decoration-teal-400 decoration-2">{autoDetectedTable}</strong>
                    </span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 block leading-tight mt-0.5">
                      Identificada via QR Code • Não precisa digitar
                    </span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 block">
                  Qual o número da sua mesa? <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UtensilsCrossed className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={info.tableNumber || ''}
                    onChange={(e) => handleFieldChange('tableNumber', e.target.value)}
                    placeholder="Ex: Mesa 08, 04, Balcão 2 *"
                    className={`${inputBaseClass} pl-9 ${errors.tableNumber ? inputErrorClass : ''}`}
                  />
                </div>
                {errors.tableNumber && (
                  <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.tableNumber}</span>
                  </p>
                )}
                <span className="text-[10px] text-neutral-400 block">
                  Informe o número identificado na placa da sua mesa.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Dados do Cliente (Nome e Telefone) */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
          Seus Dados
        </label>

        {/* Nome */}
        <div>
          <div className="relative">
            <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={info.customerName}
              onChange={(e) => handleFieldChange('customerName', e.target.value)}
              placeholder="Seu nome completo *"
              className={`${inputBaseClass} pl-9 ${errors.customerName ? inputErrorClass : ''}`}
            />
          </div>
          {errors.customerName && (
            <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.customerName}</span>
            </p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <div className="relative">
            <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={info.customerPhone}
              onChange={(e) => handleFieldChange('customerPhone', e.target.value)}
              placeholder="Seu WhatsApp com DDD *"
              className={`${inputBaseClass} pl-9 ${errors.customerPhone ? inputErrorClass : ''}`}
            />
          </div>
          {errors.customerPhone && (
            <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.customerPhone}</span>
            </p>
          )}
        </div>
      </div>

      {/* 3. Se for Entrega: Campos de Endereço */}
      <AnimatePresence>
        {info.deliveryType === 'delivery' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 pt-1 border-t border-neutral-700/30 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-500" />
                <span>Endereço de Entrega</span>
              </label>
              <span className="text-[10px] text-neutral-400">* campos obrigatórios</span>
            </div>

            {/* Endereço / Rua */}
            <div>
              <div className="relative">
                <Home className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={info.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder="Rua, Avenida, Alameda... *"
                  className={`${inputBaseClass} pl-9 ${errors.address ? inputErrorClass : ''}`}
                />
              </div>
              {errors.address && (
                <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.address}</span>
                </p>
              )}
            </div>

            {/* Número e Bairro */}
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  value={info.number}
                  onChange={(e) => handleFieldChange('number', e.target.value)}
                  placeholder="Nº *"
                  className={`${inputBaseClass} ${errors.number ? inputErrorClass : ''}`}
                />
                {errors.number && (
                  <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.number}</span>
                  </p>
                )}
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  value={info.neighborhood}
                  onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
                  placeholder="Bairro *"
                  className={`${inputBaseClass} ${errors.neighborhood ? inputErrorClass : ''}`}
                />
                {errors.neighborhood && (
                  <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.neighborhood}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Complemento (Opcional) */}
            <div>
              <input
                type="text"
                value={info.complement || ''}
                onChange={(e) => handleFieldChange('complement', e.target.value)}
                placeholder="Complemento (Apto, Bloco, Casa...) (opcional)"
                className={inputBaseClass}
              />
            </div>

            {/* Ponto de Referência (Opcional) */}
            <div>
              <input
                type="text"
                value={info.reference || ''}
                onChange={(e) => handleFieldChange('reference', e.target.value)}
                placeholder="Ponto de Referência (Ex: próximo ao mercado...) (opcional)"
                className={inputBaseClass}
              />
            </div>

            {/* 4. Compartilhar Localização Atual (Opcional) */}
            <div
              className={`p-3 rounded-2xl border space-y-2 ${
                isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50/80 border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-500" />
                  <span>Localização GPS (opcional)</span>
                </span>
                {info.locationUrl && (
                  <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Anexada
                  </span>
                )}
              </div>

              <p className="text-[11px] text-neutral-400 leading-tight">
                Ajuda o entregador a encontrar o local com precisão gerando o link direto no Google Maps.
              </p>

              {info.locationUrl ? (
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                    isDark ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                        Localização capturada
                      </span>
                      <a
                        href={info.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <span>Abrir no Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLocation}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 transition-colors"
                    title="Remover localização"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleShareLocation}
                  disabled={isLocating}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                      : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 shadow-2xs'
                  }`}
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500" />
                      <span>Obtendo localização atual...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5 text-blue-500" />
                      <span>Compartilhar localização atual</span>
                    </>
                  )}
                </button>
              )}

              {locationError && (
                <p className="text-[10px] text-amber-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{locationError}</span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
