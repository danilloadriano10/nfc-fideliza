'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { X, Star, MessageSquareHeart, CheckCircle2, Send, Lock } from 'lucide-react'
import { submitFeedback } from '@/lib/storage'
import { formatPhone } from '@/lib/utils'

interface FeedbackSheetProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  companyName: string
  primaryColor?: string
  initialCustomerName?: string
  initialCustomerPhone?: string
}

export const FeedbackSheet: React.FC<FeedbackSheetProps> = ({
  isOpen,
  onClose,
  companyId,
  companyName,
  primaryColor = '#18181B',
  initialCustomerName,
  initialCustomerPhone,
}) => {
  const [rating, setRating] = useState<number>(5)
  const [message, setMessage] = useState('')
  const [name, setName] = useState(initialCustomerName || '')
  const [phone, setPhone] = useState(initialCustomerPhone ? formatPhone(initialCustomerPhone) : '')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!message.trim()) {
      setErrorMessage('Por favor, digite sua mensagem ou sugestão.')
      return
    }

    const res = submitFeedback(companyId, {
      rating,
      message,
      customerName: name,
      customerPhone: phone,
    })

    if (res.success) {
      setIsSubmitted(true)
      setTimeout(() => {
        setIsSubmitted(false)
        setMessage('')
        onClose()
      }, 3000)
    } else {
      setErrorMessage(res.error || 'Erro ao enviar feedback.')
    }
  }

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
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-4"
      >
        <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto -mt-2 mb-2 sm:hidden" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Enviar Feedback</h3>
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

        {/* Privacy reassurance banner */}
        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-xl text-[11px] text-neutral-600 font-medium">
          <Lock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <span>Este feedback é estritamente privado e recebido apenas pela gerência.</span>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-neutral-900 text-lg">Obrigado pela sua mensagem!</h4>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Sua opinião nos ajuda a melhorar constantemente nossos serviços e atendimento.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {errorMessage}
              </p>
            )}

            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 text-center">
                Como você avalia sua visita hoje? (opcional)
              </label>
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-2xl transition-transform active:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-200 hover:text-neutral-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Sua sugestão, elogio ou comentário
              </label>
              <textarea
                required
                rows={3}
                value={message || ''}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Conte com detalhes o que podemos melhorar ou o que você mais gostou..."
                className="w-full p-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm resize-none"
              />
            </div>

            {/* Optional contact details */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-0.5">
                  Seu nome (opcional)
                </label>
                <input
                  type="text"
                  value={name || ''}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-0.5">
                  WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  value={phone || ''}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(62) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="w-4 h-4" />
              <span>Enviar Feedback Direto</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
