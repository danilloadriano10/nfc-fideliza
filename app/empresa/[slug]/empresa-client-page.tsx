'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import { Company, CompanyProduct, CompanyService, MenuItem } from '@/types/platform'
import { getCompanyBySlug, isCompanyDeleted, DATA_CHANGE_EVENT, saveCompanyLocally } from '@/lib/storage'
import { PublicCompanyView } from '@/components/public/public-company-view'

interface EmpresaClientPageProps {
  slug: string
  initialCompany?: Company | null
  initialProducts?: CompanyProduct[]
  initialServices?: CompanyService[]
  initialMenuItems?: MenuItem[]
}

export const EmpresaClientPage: React.FC<EmpresaClientPageProps> = ({
  slug,
  initialCompany,
  initialProducts,
  initialServices,
  initialMenuItems,
}) => {
  const [company, setCompany] = useState<Company | null>(() => {
    if (isCompanyDeleted(slug)) return null
    return initialCompany || null
  })
  const [isLoading, setIsLoading] = useState(!initialCompany)

  useEffect(() => {
    let isMounted = true

    if (isCompanyDeleted(slug)) {
      setCompany(null)
      setIsLoading(false)
      return
    }

    const fetchCompanyData = async () => {
      // 1. Try local storage first
      const local = getCompanyBySlug(slug)
      if (local && isMounted) {
        setCompany(local)
        setIsLoading(false)
      }

      // 2. Query real server API by slug
      try {
        const res = await fetch(`/api/companies?slug=${encodeURIComponent(slug)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.company && isMounted) {
            if (!isCompanyDeleted(data.company.id) && !isCompanyDeleted(data.company.slug)) {
              setCompany(data.company)
              saveCompanyLocally(data.company)
            } else {
              setCompany(null)
            }
          } else if (isMounted) {
            setCompany(null)
          }
        } else if (res.status === 404 && isMounted) {
          setCompany(null)
        }
      } catch (err) {
        console.error('Error fetching company by slug:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCompanyData()

    const onDataChange = () => {
      if (isCompanyDeleted(slug)) {
        setCompany(null)
        return
      }
      const fresh = getCompanyBySlug(slug)
      setCompany(fresh)
    }

    window.addEventListener(DATA_CHANGE_EVENT, onDataChange)
    window.addEventListener('storage', onDataChange)

    return () => {
      isMounted = false
      window.removeEventListener(DATA_CHANGE_EVENT, onDataChange)
      window.removeEventListener('storage', onDataChange)
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-800 mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">Carregando página NFC do estabelecimento...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 selection:bg-neutral-900 selection:text-white">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Estabelecimento não encontrado
            </h1>
            <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
              O link NFC <code className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-800 font-mono text-xs">/empresa/{slug}</code> ainda não foi registrado na plataforma.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-neutral-900 text-white font-semibold text-xs shadow hover:bg-neutral-800 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Página Inicial</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!company.isActive) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 selection:bg-neutral-900 selection:text-white">
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
              className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-all"
            >
              Abrir Painel da Empresa
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PublicCompanyView
      company={company}
      initialProducts={initialProducts}
      initialServices={initialServices}
      initialMenuItems={initialMenuItems}
    />
  )
}

