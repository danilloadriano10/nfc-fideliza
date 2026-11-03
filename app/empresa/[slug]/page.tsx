import React from 'react'
import { Metadata } from 'next'
import {
  getServerCompanyBySlug,
  getServerProducts,
  getServerServices,
  getServerMenuItems,
  getServerExternalLinks,
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
      title: 'Estabelecimento não encontrado | DiretoLink',
      description: 'A página solicitada não foi encontrada ou não está disponível.',
      robots: { index: false, follow: false },
    }
  }

  const pageTitle = company.tagline
    ? `${company.name} | ${company.tagline}${mesaLabel}`
    : `${company.name}${mesaLabel} | DiretoLink`

  const pageDescription = company.tagline
    ? `${company.name}${company.category ? ` (${company.category})` : ''} - ${company.tagline}. Acesse produtos, serviços, agendamentos, cardápio e WhatsApp oficial no DiretoLink.`
    : `Página oficial de ${company.name}${company.category ? ` (${company.category})` : ''} no DiretoLink. Conecte-se pelo WhatsApp, confira produtos, serviços e novidades em um só lugar.`

  const canonicalUrl = `https://diretolink.com.br/empresa/${encodeURIComponent(slug)}`

  const images: { url: string; alt?: string }[] = []
  if (company.coverUrl) {
    images.push({ url: company.coverUrl, alt: `Capa de ${company.name}` })
  }
  if (company.logoUrl) {
    images.push({ url: company.logoUrl, alt: `Logo de ${company.name}` })
  }

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: 'DiretoLink',
      locale: 'pt_BR',
      type: 'website',
      images: images.length > 0 ? images : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: images.length > 0 ? [images[0].url] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function EmpresaPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = searchParams ? await searchParams : {}
  const company = await getServerCompanyBySlug(slug)
  const isProductsActive = Boolean(company?.modules?.products)
  const isServicesActive = Boolean(company?.modules?.services)
  const isMenuActive = Boolean(company?.modules?.menu)

  const [initialProducts, initialServices, initialMenuItems, initialExternalLinks] = company
    ? await Promise.all([
        isProductsActive ? getServerProducts(company.id) : Promise.resolve([]),
        isServicesActive ? getServerServices(company.id) : Promise.resolve([]),
        isMenuActive ? getServerMenuItems(company.id) : Promise.resolve([]),
        getServerExternalLinks(company.id),
      ])
    : [[], [], [], []]

  const schemaJsonLd = company
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: company.name,
        description: company.tagline || `Página oficial de ${company.name}`,
        url: `https://diretolink.com.br/empresa/${encodeURIComponent(slug)}`,
        telephone: company.whatsapp || undefined,
        image: company.logoUrl || company.coverUrl || undefined,
        address: company.addressText
          ? {
              '@type': 'PostalAddress',
              streetAddress: company.addressText,
            }
          : undefined,
      }
    : null

  return (
    <>
      {schemaJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
        />
      )}
      <EmpresaClientPage
        slug={slug}
        initialCompany={company}
        initialProducts={initialProducts}
        initialServices={initialServices}
        initialMenuItems={initialMenuItems}
        initialExternalLinks={initialExternalLinks}
        initialTableNumber={sp.mesa}
        autoScrollToMenu={Boolean(sp.mesa)}
      />
    </>
  )
}

