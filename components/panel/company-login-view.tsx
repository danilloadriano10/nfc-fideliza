'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Lock,
  User,
  ArrowRight,
  Store,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Radio,
} from 'lucide-react'
import { Company } from '@/types/platform'
import { loginOwnerAsync, findCompanyByOwnerLoginAsync } from '@/lib/auth'

interface CompanyLoginViewProps {
  company?: Company
  onSuccess: (loggedCompany: Company) => void
}

export const CompanyLoginView: React.FC<CompanyLoginViewProps> = ({
  company,
  onSuccess,
}) => {
  const [username, setUsername] = useState(company?.ownerAuth?.username || '')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    try {
      if (company) {
        // Logging in to specific company via secure server check
        const res = await loginOwnerAsync(company, username, password)
        if (res.success) {
          onSuccess(company)
        } else {
          setErrorMessage(res.error || 'Credenciais inválidas.')
        }
      } else {
        // General owner portal: identify company by credentials
        const found = await findCompanyByOwnerLoginAsync(username, password)
        if (found) {
          onSuccess(found)
        } else {
          setErrorMessage('Usuário ou senha incorretos. Nenhuma empresa encontrada.')
        }
      }
    } catch {
      setErrorMessage('Erro ao autenticar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-4 selection:bg-violet-100 selection:text-violet-900 font-sans text-neutral-900">
      <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
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

        {/* Brand / Company Identity */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center mx-auto shadow-xs overflow-hidden">
            {company?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
            ) : company ? (
              <Store className="w-7 h-7 text-violet-600" />
            ) : (
              <Radio className="w-7 h-7 text-violet-600 stroke-[2.5]" />
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold text-violet-700 uppercase tracking-widest block">
              Painel do Estabelecimento
            </span>
            <h1 className="text-xl font-bold text-neutral-900 mt-1">
              {company ? company.name : 'Acesso do Estabelecimento'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              {company
                ? 'Insira suas credenciais para gerenciar clientes, fidelidade e configurações.'
                : 'Acesse exclusivamente a gestão do seu estabelecimento comercial.'}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span>Usuário / Login da Empresa</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: cafecentral"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-violet-600 rounded-xl text-neutral-900 text-xs font-mono focus:outline-none transition-colors shadow-xs"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-violet-600 rounded-xl text-neutral-900 text-xs font-mono focus:outline-none transition-colors shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isLoading ? 'Autenticando...' : 'Entrar no Painel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-neutral-500 border-t border-neutral-100 space-y-1">
          <p>
            Ainda não tem conta?{' '}
            <Link href="/cadastro" className="font-semibold text-violet-700 hover:underline">
              Criar minha empresa
            </Link>
          </p>
          <p className="text-[11px] text-neutral-400">
            DiretoLink · Um toque conecta o cliente à empresa.
          </p>
        </div>
      </div>
    </div>
  )
}
