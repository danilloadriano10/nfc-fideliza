'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Company } from '@/types/platform'
import { getCompanyBySlug, DATA_CHANGE_EVENT, saveCompanyLocally } from '@/lib/storage'
import { ModoCaixaView } from '@/components/caixa/modo-caixa-view'

interface CaixaClientPageProps {
  slug: string
  initialCompany?: Company | null
}

export const CaixaClientPage: React.FC<CaixaClientPageProps> = ({
  slug,
  initialCompany,
}) => {
  const [company, setCompany] = useState<Company | null>(() => initialCompany || getCompanyBySlug(slug))
  const [isLoading, setIsLoading] = useState(!initialCompany && !getCompanyBySlug(slug))

  useEffect(() => {
    let isMounted = true

    const fetchCompanyData = async () => {
      const local = getCompanyBySlug(slug)
      if (local && isMounted) {
        setCompany(local)
        setIsLoading(false)
      }

      try {
        const res = await fetch(`/api/companies?slug=${encodeURIComponent(slug)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.company && isMounted) {
            setCompany(data.company)
            saveCompanyLocally(data.company)
          }
        }
      } catch (err) {
        console.error('Error fetching company in caixa:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCompanyData()

    const update = () => {
      const fresh = getCompanyBySlug(slug)
      if (fresh) setCompany(fresh)
    }

    window.addEventListener(DATA_CHANGE_EVENT, update)
    window.addEventListener('storage', update)
    return () => {
      isMounted = false
      window.removeEventListener(DATA_CHANGE_EVENT, update)
      window.removeEventListener('storage', update)
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
          <p className="text-xs text-neutral-400 font-medium">Carregando modo caixa do estabelecimento...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-950 p-6 rounded-2xl border border-neutral-800 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold">Estabelecimento não encontrado</h2>
          <p className="text-xs text-neutral-400">
            Não foi possível carregar o modo caixa para o slug: &quot;{slug}&quot;.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Link>
        </div>
      </div>
    )
  }

  return <ModoCaixaView company={company} />
}
