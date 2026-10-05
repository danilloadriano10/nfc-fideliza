'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Radio,
  ArrowLeft,
  Store,
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { registerCompanySelfServiceAsync } from '@/lib/storage'
import { setOwnerAuthenticatedSession } from '@/lib/auth'

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

export default function RegisterCompanyPage() {
  const router = useRouter()

  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!ownerName.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.')
      return
    }

    if (!ownerPhone.trim()) {
      setErrorMessage('Por favor, informe seu WhatsApp com DDD.')
      return
    }

    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      setErrorMessage('Por favor, informe um e-mail válido para acesso.')
      return
    }

    if (!companyName.trim()) {
      setErrorMessage('Por favor, informe o nome do estabelecimento.')
      return
    }

    if (!password || password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.')
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
        setOwnerAuthenticatedSession(res.company.id)
        router.push(`/painel/${res.company.slug}`)
      } else {
        setErrorMessage(res.error || 'Erro ao realizar cadastro.')
      }
    } catch {
      setErrorMessage('Falha ao comunicar com o servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-4 selection:bg-violet-100 selection:text-violet-900 font-sans text-neutral-900">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Início</span>
          </Link>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-bold uppercase tracking-wider">
            <Radio className="w-3 h-3" />
            <span>DiretoLink</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <Radio className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Criar Minha Empresa
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Conecte seus clientes por aproximação NFC sem apps
            </p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Responsável */}
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
                placeholder="Ex: Carlos Silva"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                />
              </div>
            </div>
          </div>

          {/* 2. Empresa */}
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
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

          {/* 3. Acesso */}
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white font-mono"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
          >
            {isLoading ? (
              <span>Criando sua empresa no DiretoLink...</span>
            ) : (
              <>
                <span>Criar Minha Empresa</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-neutral-500 border-t border-neutral-100">
          Já possui cadastro?{' '}
          <Link href="/painel" className="font-semibold text-violet-700 hover:underline">
            Acessar meu painel
          </Link>
        </div>
      </div>
    </div>
  )
}
