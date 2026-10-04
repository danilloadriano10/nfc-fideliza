import React from 'react'
import { Metadata } from 'next'
import { getServerCompanyBySlug } from '@/lib/server-storage'
import { PainelClientPage } from './painel-client-page'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const company = await getServerCompanyBySlug(slug)

  return {
    title: company ? `Painel · ${company.name}` : 'Painel do Estabelecimento',
    description: 'Gestão de fidelidade, clientes, pontos e configurações do estabelecimento.',
  }
}

export default async function PainelPage({ params }: PageProps) {
  const { slug } = await params
  const company = await getServerCompanyBySlug(slug)
  return <PainelClientPage slug={slug} initialCompany={company} />
}
