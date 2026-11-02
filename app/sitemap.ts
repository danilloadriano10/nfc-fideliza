import { MetadataRoute } from 'next'
import { getServerCompanies } from '@/lib/server-storage'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://diretolink.com.br'
  const now = new Date()

  // Páginas públicas estáticas principais
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/cadastro`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Páginas públicas dinâmicas de cada empresa cadastrada
  try {
    const companies = await getServerCompanies()
    const companyRoutes: MetadataRoute.Sitemap = []

    for (const c of companies) {
      if (!c.slug) continue
      const lastMod = c.updatedAt ? new Date(c.updatedAt) : now

      // Página oficial do estabelecimento /empresa/[slug]
      companyRoutes.push({
        url: `${baseUrl}/empresa/${encodeURIComponent(c.slug)}`,
        lastModified: lastMod,
        changeFrequency: 'weekly',
        priority: 0.9,
      })

      // Cardápio digital da empresa se o módulo estiver ativo
      if (c.modules?.menu) {
        companyRoutes.push({
          url: `${baseUrl}/empresa/${encodeURIComponent(c.slug)}/cardapio`,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }

    return [...staticRoutes, ...companyRoutes]
  } catch (err) {
    console.error('Erro ao gerar sitemap dinâmico:', err)
    return staticRoutes
  }
}
