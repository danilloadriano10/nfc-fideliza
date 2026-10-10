import React from 'react'
import { Metadata } from 'next'
import {
  getServerCompanyBySlug,
  getServerProducts,
  getServerServices,
} from '@/lib/server-storage'
import { EmpresaClientPage } from './empresa-client-page'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const company = await getServerCompanyBySlug(slug)

  if (!company) {
    return {
      title: 'Página NFC Oficial · DiretoLink',
    }
  }

  return {
    title: `${company.name} · Vitrine e Página NFC Oficial`,
    description:
      company.tagline ||
      `Página oficial de ${company.name}. Conheça nossos produtos e serviços, conecte-se ao Wi-Fi e pontue na fidelidade.`,
    openGraph: {
      title: `${company.name} · Vitrine e NFC Oficial`,
      description: company.tagline || `Página oficial de ${company.name}`,
    },
  }
}

export default async function EmpresaPage({ params }: PageProps) {
  const { slug } = await params
  const company = await getServerCompanyBySlug(slug)
  const initialProducts = company ? await getServerProducts(company.id) : []
  const initialServices = company ? await getServerServices(company.id) : []

  return (
    <EmpresaClientPage
      slug={slug}
      initialCompany={company}
      initialProducts={initialProducts}
      initialServices={initialServices}
    />
  )
}

