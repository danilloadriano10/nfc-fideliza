'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, ArrowLeft, AlertTriangle } from 'lucide-react'
import { Company } from '@/types/platform'
import { getCompanyBySlug, DATA_CHANGE_EVENT, getAllCompanies } from '@/lib/storage'
import { PublicCompanyView } from '@/components/public/public-company-view'

interface EmpresaClientPageProps {
  slug: string
  initialCompany?: Company | null
}

export const EmpresaClientPage: React.FC<EmpresaClientPageProps> = ({
  slug,
  initialCompany,
}) => {
  const [company, setCompany] = useState<Company | null>(() => initialCompany || getCompanyBySlug(slug))
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const update = () => {
      const fresh = getCompanyBySlug(slug)
      setCompany(fresh)
    }

    update()
    window.addEventListener(DATA_CHANGE_EVENT, update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, update)
      window.removeEventListener('storage', update)
    }
  }, [slug])

  if (!company) {
    const all = isClient ? getAllCompanies() : []

    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              Estabelecimento não encontrado
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              O link NFC <code className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-800 font-mono text-xs">/empresa/{slug}</code> ainda não foi cadastrado no sistema.
            </p>
          </div>

          {all.length > 0 && (
            <div className="pt-2 text-left">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Estabelecimentos disponíveis para teste:
              </span>
              <div className="space-y-2">
                {all.map((c) => (
                  <Link
                    key={c.id}
                    href={`/empresa/${c.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors border border-neutral-200/80 text-sm font-medium text-neutral-800"
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-neutral-400 font-mono">/empresa/{c.slug}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-neutral-900 text-white font-semibold text-sm shadow hover:bg-neutral-800 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Início da Plataforma</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!company.isActive) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900">{company.name}</h2>
          <p className="text-sm text-neutral-500">
            Esta página pública está temporariamente desativada pela gerência do estabelecimento.
          </p>
          <div className="pt-4 flex gap-2 justify-center">
            <Link
              href={`/painel/${company.slug}`}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold"
            >
              Abrir Painel da Empresa
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <PublicCompanyView company={company} />
}
