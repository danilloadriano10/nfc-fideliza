'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { X, Wifi, Copy, Check, QrCode } from 'lucide-react'
import { CompanyWifi } from '@/types/platform'
import { QRCodeView } from '@/components/common/qr-code'

interface WifiSheetProps {
  isOpen: boolean
  onClose: () => void
  wifi: CompanyWifi
  companyName: string
  primaryColor?: string
}

export const WifiSheet: React.FC<WifiSheetProps> = ({
  isOpen,
  onClose,
  wifi,
  companyName,
  primaryColor = '#18181B',
}) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopyPassword = () => {
    if (!wifi.password) return
    navigator.clipboard.writeText(wifi.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Standard Wi-Fi connection QR payload
  const wifiPayload = `WIFI:S:${wifi.ssid};T:${wifi.security === 'OPEN' ? 'nopass' : 'WPA'};P:${wifi.password || ''};;`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: '100%', opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5"
      >
        <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto -mt-2 mb-2 sm:hidden" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Rede Wi-Fi</h3>
              <p className="text-xs text-neutral-500">{companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code auto-connect */}
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <QRCodeView value={wifiPayload} size={160} />
          <p className="text-xs text-neutral-500 mt-2.5 max-w-xs">
            Aponte a câmera do seu celular para conectar automaticamente à rede.
          </p>
        </div>

        {/* Network details card */}
        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-medium">Nome da Rede (SSID):</span>
            <span className="font-bold text-neutral-900 font-mono text-sm">{wifi.ssid}</span>
          </div>

          {wifi.password ? (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/60">
              <span className="text-neutral-500 font-medium">Senha:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-neutral-900 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 text-sm">
                  {wifi.password}
                </span>
                <button
                  onClick={handleCopyPassword}
                  className="p-2 rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all flex items-center gap-1 text-xs font-semibold"
                  title="Copiar senha"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-emerald-700 font-semibold pt-1 border-t border-neutral-200/60">
              Rede aberta (sem senha).
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
            <span>Segurança: {wifi.security}</span>
            <span>Acesso exclusivo para clientes</span>
          </div>
        </div>

        {/* Quick action button */}
        {wifi.password && (
          <button
            onClick={handleCopyPassword}
            className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Senha Copiada para a Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Senha do Wi-Fi</span>
              </>
            )}
          </button>
        )}
      </motion.div>
    </div>
  )
}
