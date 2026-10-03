'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Company } from '@/types/platform'
import { getCompanyBySlug, DATA_CHANGE_EVENT } from '@/lib/storage'
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

  useEffect(() => {
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
