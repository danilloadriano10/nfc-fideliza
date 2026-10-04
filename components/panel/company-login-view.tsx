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
  HelpCircle,
  ArrowLeft,
} from 'lucide-react'
import { Company } from '@/types/platform'
import { loginOwnerAsync, findCompanyByOwnerLoginAsync } from '@/lib/auth'
import { getAllCompanies } from '@/lib/storage'

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

  const handleQuickDemo = (targetComp: Company) => {
    const user = targetComp.ownerAuth?.username || targetComp.slug
    const pass = targetComp.ownerAuth?.password || 'empresa123'
    setUsername(user)
    setPassword(pass)
    setErrorMessage(null)
  }

  const all = !company ? getAllCompanies() : []

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-neutral-950">
      <div className="w-full max-w-md bg-neutral-950 rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Voltar ao Início</span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
            Área do Dono
          </span>
        </div>

        {/* Brand / Company Identity */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            {company ? (
              <Store className="w-8 h-8 text-amber-400" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">
              Painel do Proprietário
            </span>
            <h1 className="text-xl font-bold text-white mt-1">
              {company ? company.name : 'Acesso do Estabelecimento'}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              {company
                ? 'Insira suas credenciais para gerenciar sua empresa, clientes e fidelidade.'
                : 'Acesse exclusivamente a gestão do seu estabelecimento comercial.'}
            </p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-2xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
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
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-750 focus:border-amber-500 rounded-xl text-white text-xs font-mono focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
              <span>Senha de Acesso</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-750 focus:border-amber-500 rounded-xl text-white text-xs font-mono focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isLoading ? 'Autenticando...' : 'Entrar no Painel da Empresa'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="p-3.5 bg-neutral-900/80 rounded-2xl border border-neutral-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Credenciais para teste rápido:</span>
          </div>

          {company ? (
            <div className="flex items-center justify-between bg-neutral-950 p-2 rounded-xl text-[11px] font-mono">
              <div className="space-x-2 text-neutral-300">
                <span>Usuário: <strong className="text-white">{company.ownerAuth?.username || company.slug}</strong></span>
                <span>Senha: <strong className="text-white">{company.ownerAuth?.password || 'cafe123'}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickDemo(company)}
                className="text-[10px] text-amber-400 hover:underline shrink-0"
              >
                Preencher
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 pt-1">
              {all.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-neutral-950 p-2 rounded-xl text-[11px]"
                >
                  <div className="min-w-0 font-mono text-neutral-300">
                    <span className="font-sans font-bold text-white block truncate">{c.name}</span>
                    <span className="text-[10px] text-neutral-400">
                      {c.ownerAuth?.username || c.slug} / {c.ownerAuth?.password || '123456'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo(c)}
                    className="text-[10px] text-amber-400 hover:underline shrink-0 px-2 py-1 bg-amber-500/10 rounded-md"
                  >
                    Usar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs text-neutral-500 hover:text-neutral-400 transition-colors"
          >
            ← Voltar à página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
