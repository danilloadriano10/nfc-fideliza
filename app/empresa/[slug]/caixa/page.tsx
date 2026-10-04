import React from 'react'
import { Metadata } from 'next'
import { getServerCompanyBySlug } from '@/lib/server-storage'
import { CaixaClientPage } from './caixa-client-page'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const company = await getServerCompanyBySlug(slug)

  return {
    title: company ? `Modo Caixa · ${company.name}` : 'Modo Caixa',
    description: 'Terminal rápido de validação de pontos e resgates para atendentes.',
  }
}

export default async function CaixaPage({ params }: PageProps) {
  const { slug } = await params
  const company = await getServerCompanyBySlug(slug)
  return <CaixaClientPage slug={slug} initialCompany={company} />
}
