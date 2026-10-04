import React from 'react'
import { Metadata } from 'next'
import { getServerCompanyBySlug } from '@/lib/server-storage'
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
      title: 'Página NFC Oficial · TapHub',
    }
  }

  return {
    title: `${company.name} · Página NFC Oficial`,
    description:
      company.tagline ||
      `Página oficial de ${company.name}. Conecte-se ao Wi-Fi, pontue na fidelidade e acesse nosso cardápio.`,
    openGraph: {
      title: `${company.name} · NFC Oficial`,
      description: company.tagline || `Página oficial de ${company.name}`,
    },
  }
}

export default async function EmpresaPage({ params }: PageProps) {
  const { slug } = await params
  const company = await getServerCompanyBySlug(slug)
  return <EmpresaClientPage slug={slug} initialCompany={company} />
}
