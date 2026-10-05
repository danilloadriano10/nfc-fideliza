'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Store,
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Radio,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { registerCompanySelfServiceAsync } from '@/lib/storage'
import { setOwnerAuthenticatedSession } from '@/lib/auth'

interface RegisterCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (slug: string) => void
}

const CATEGORY_OPTIONS = [
  'Cafeteria / Bistrô',
  'Barbearia / Salão de Beleza',
  'Hamburgueria / Lanchonete',
  'Pizzaria / Restaurante',
  'Sorveteria / Açaí',
  'Saúde, Clínica & Estética',
  'Comércio, Loja & Varejo',
  'Outro Estabelecimento',
]

export const RegisterCompanyModal: React.FC<RegisterCompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter()

  // Form states
  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // UI states
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validations
    if (!ownerName.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.')
      return
    }

    if (!ownerPhone.trim()) {
      setErrorMessage('Por favor, informe seu WhatsApp de contato.')
      return
    }

    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      setErrorMessage('Por favor, informe um e-mail válido para acesso.')
      return
    }

    if (!companyName.trim()) {
      setErrorMessage('Por favor, informe o nome da sua empresa.')
      return
    }

    if (!password || password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem. Digite a mesma senha nos dois campos.')
      return
    }

    setIsLoading(true)

    try {
      const res = await registerCompanySelfServiceAsync({
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerEmail: ownerEmail.trim(),
        companyName: companyName.trim(),
        category,
        password: password.trim(),
      })

      if (res.success && res.company) {
        // Authenticate owner session automatically
        setOwnerAuthenticatedSession(res.company.id)

        if (onSuccess) {
          onSuccess(res.company.slug)
        } else {
          router.push(`/painel/${res.company.slug}`)
        }
        onClose()
      } else {
        setErrorMessage(res.error || 'Erro ao criar conta. Tente novamente.')
      }
    } catch (err) {
      console.error('Registration failed:', err)
      setErrorMessage('Falha ao comunicar com o servidor. Verifique sua conexão.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-lg overflow-hidden text-neutral-900 font-sans my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-neutral-100 bg-neutral-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs">
                <Radio className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900 leading-tight">
                  Criar minha empresa no DiretoLink
                </h2>
                <p className="text-[11px] text-neutral-500 font-medium">
                  Conecte clientes e configure sua placa NFC em instantes
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SEÇÃO 1: RESPONSÁVEL */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100 inline-block">
                1. Responsável
              </span>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Seu Nome Completo *</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Carlos Eduardo Silva"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>WhatsApp (com DDD) *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 11999998888"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Seu E-mail *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@exemplo.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: EMPRESA */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100 inline-block">
                2. Empresa
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Nome da Empresa *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Café Central Bistrô"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: ACESSO */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100 inline-block">
                3. Acesso ao Painel
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Senha de Acesso *</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Confirmar Senha *</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-4 border-t border-neutral-100 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Criando sua empresa no DiretoLink...</span>
                  </>
                ) : (
                  <>
                    <span>Criar Minha Empresa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-neutral-400 text-center">
                Você será direcionado para o assistente de boas-vindas do seu painel.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
