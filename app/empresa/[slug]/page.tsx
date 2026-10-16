import React from 'react'
import { Metadata } from 'next'
import {
  getServerCompanyBySlug,
  getServerProducts,
  getServerServices,
  getServerMenuItems,
} from '@/lib/server-storage'
import { EmpresaClientPage } from './empresa-client-page'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ mesa?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const sp = searchParams ? await searchParams : {}
  const company = await getServerCompanyBySlug(slug)

  const mesaLabel = sp.mesa ? ` · Mesa ${sp.mesa.replace(/^(mesa|table)\s*/i, '').trim() || sp.mesa}` : ''

  if (!company) {
    return {
      title: 'Página NFC Oficial · DiretoLink',
    }
  }

  return {
    title: `${company.name}${mesaLabel} · Vitrine e Página NFC Oficial`,
    description:
      company.tagline ||
      `Página oficial de ${company.name}. Conheça nossos produtos e serviços, conecte-se ao Wi-Fi e pontue na fidelidade.`,
    openGraph: {
      title: `${company.name}${mesaLabel} · Vitrine e NFC Oficial`,
      description: company.tagline || `Página oficial de ${company.name}`,
    },
  }
}

export default async function EmpresaPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = searchParams ? await searchParams : {}
  const company = await getServerCompanyBySlug(slug)
  const initialProducts = company ? await getServerProducts(company.id) : []
  const initialServices = company ? await getServerServices(company.id) : []
  const initialMenuItems = company ? await getServerMenuItems(company.id) : []

  return (
    <EmpresaClientPage
      slug={slug}
      initialCompany={company}
      initialProducts={initialProducts}
      initialServices={initialServices}
      initialMenuItems={initialMenuItems}
      initialTableNumber={sp.mesa}
      autoScrollToMenu={Boolean(sp.mesa)}
    />
  )
}

