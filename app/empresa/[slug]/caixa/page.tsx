import React from 'react'
import { Metadata } from 'next'
import { INITIAL_COMPANIES } from '@/lib/initial-data'
import { CaixaClientPage } from './caixa-client-page'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const company = INITIAL_COMPANIES.find((c) => c.slug.toLowerCase() === slug.toLowerCase())

  return {
    title: company ? `Modo Caixa · ${company.name}` : 'Modo Caixa',
    description: 'Terminal rápido de validação de pontos e resgates para atendentes.',
  }
}

export default async function CaixaPage({ params }: PageProps) {
  const { slug } = await params
  return <CaixaClientPage slug={slug} />
}
