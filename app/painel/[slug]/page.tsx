import React from 'react'
import { Metadata } from 'next'
import { INITIAL_COMPANIES } from '@/lib/initial-data'
import { PainelClientPage } from './painel-client-page'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const company = INITIAL_COMPANIES.find((c) => c.slug.toLowerCase() === slug.toLowerCase())

  return {
    title: company ? `Painel · ${company.name}` : 'Painel do Estabelecimento',
    description: 'Gestão de fidelidade, clientes, pontos e configurações do estabelecimento.',
  }
}

export default async function PainelPage({ params }: PageProps) {
  const { slug } = await params
  return <PainelClientPage slug={slug} />
}
