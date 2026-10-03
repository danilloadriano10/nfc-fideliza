'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Company } from '@/types/platform'
import { getCompanyBySlug, DATA_CHANGE_EVENT, saveCompanyLocally } from '@/lib/storage'
import { CompanyPanelView } from '@/components/panel/company-panel-view'

interface PainelClientPageProps {
  slug: string
  initialCompany?: Company | null
}

export const PainelClientPage: React.FC<PainelClientPageProps> = ({
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
        console.error('Error fetching company in painel:', err)
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
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-800 mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">Carregando painel do estabelecimento...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-3xl shadow-xl text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-neutral-900">
            Estabelecimento não encontrado
          </h2>
          <p className="text-xs text-neutral-500">
            Não existe empresa cadastrada com o slug: &quot;{slug}&quot;.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Link>
        </div>
      </div>
    )
  }

  return <CompanyPanelView initialCompany={company} />
}
