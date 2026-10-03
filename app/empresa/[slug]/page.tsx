import React from 'react'
import { Metadata } from 'next'
import { INITIAL_COMPANIES } from '@/lib/initial-data'
import { EmpresaClientPage } from './empresa-client-page'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const company = INITIAL_COMPANIES.find((c) => c.slug.toLowerCase() === slug.toLowerCase())

  if (!company) {
    return {
      title: 'Página NFC Oficial · NFC Fideliza',
    }
  }

  return {
    title: `${company.name} · Página NFC Oficial`,
    description: company.tagline || `Página oficial de ${company.name}. Conecte-se ao Wi-Fi, pontue na fidelidade e acesse nosso cardápio.`,
    openGraph: {
      title: `${company.name} · NFC Oficial`,
      description: company.tagline || `Página oficial de ${company.name}`,
    },
  }
}

export default async function EmpresaPage({ params }: PageProps) {
  const { slug } = await params
  return <EmpresaClientPage slug={slug} />
}
