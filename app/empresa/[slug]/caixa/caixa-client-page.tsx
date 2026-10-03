'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Company } from '@/types/platform'
import { getCompanyBySlug, DATA_CHANGE_EVENT } from '@/lib/storage'
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
