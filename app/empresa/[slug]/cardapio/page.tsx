import React from 'react'
import { Metadata } from 'next'
import {
  getServerCompanyBySlug,
  getServerProducts,
  getServerServices,
  getServerMenuItems,
} from '@/lib/server-storage'
import { EmpresaClientPage } from '../empresa-client-page'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ mesa?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { mesa } = await searchParams
  const company = await getServerCompanyBySlug(slug)

  const mesaLabel = mesa ? ` · Mesa ${mesa.replace(/^(mesa|table)\s*/i, '').trim() || mesa}` : ''

  if (!company) {
    return {
      title: 'Cardápio Digital · DiretoLink',
    }
  }

  return {
    title: `Cardápio Digital · ${company.name}${mesaLabel}`,
    description: `Faça seu pedido diretamente pelo cardápio digital de ${company.name}.`,
    openGraph: {
      title: `Cardápio Digital · ${company.name}${mesaLabel}`,
      description: `Cardápio digital oficial de ${company.name}`,
    },
  }
}

export default async function EmpresaCardapioPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { mesa } = await searchParams
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
      initialTableNumber={mesa}
      autoScrollToMenu={true}
    />
  )
}
