'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Radio,
} from 'lucide-react'
import { loginAdmin } from '@/lib/auth'

interface AdminLoginViewProps {
  onSuccess: () => void
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    const res = await loginAdmin(email, password)
    if (res.success) {
      onSuccess()
    } else {
      setErrorMessage(res.error || 'Credenciais de administrador inválidas.')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-4 selection:bg-violet-100 selection:text-violet-900 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Início</span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
            Acesso Restrito
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <Radio className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              DiretoLink
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Painel Administrativo Master
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-neutral-400" />
              <span>E-mail do Administrador</span>
            </label>
            <input
              type="email"
              required
              autoFocus
              placeholder="admin@diretolink.com"
              value={email || ''}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-violet-600 rounded-xl text-neutral-900 text-xs focus:outline-none transition-colors shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
              <span>Senha de Acesso</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password || ''}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-violet-600 rounded-xl text-neutral-900 text-xs focus:outline-none transition-colors shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Acessar Painel Master</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-neutral-400 border-t border-neutral-100">
          DiretoLink · Um toque conecta o cliente à empresa.
        </div>
      </div>
    </div>
  )
}
