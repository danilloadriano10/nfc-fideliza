import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://diretolink.com.br'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/empresa/',
          '/cadastro',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/painel',
          '/painel/*',
          '/login',
          '/login/*',
          '/api',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
