/**
 * Utilitários para normalização, cache e resiliência de URLs de imagens.
 * Garante compatibilidade com URLs diretas do ImgBB (i.ibb.co), Cloudinary,
 * Unsplash, Firebase Storage e fallback para evitar erros 503 / páginas de visualização.
 */

/**
 * Normaliza uma URL de imagem para garantir que seja um link direto ao arquivo CDN.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null

  // Já é data:image base64
  if (trimmed.startsWith('data:image/')) return trimmed

  // Caso seja link relativo
  if (trimmed.startsWith('/')) return trimmed

  // Corrige protocolo ausente
  let fullUrl = trimmed
  if (fullUrl.startsWith('//')) {
    fullUrl = `https:${fullUrl}`
  } else if (!/^https?:\/\//i.test(fullUrl)) {
    fullUrl = `https://${fullUrl}`
  }

  // Tratamento específico para ImgBB
  // O ImgBB gera dois tipos de links:
  // 1. https://ibb.co/xyz (página HTML de visualização com Cloudflare - NÃO é imagem)
  // 2. https://i.ibb.co/xyz/nome.png (CDN direto - É imagem)
  try {
    const parsed = new URL(fullUrl)

    // Se for ibb.co sem o subdomínio 'i.', e tiver path com extensão de arquivo:
    if (parsed.hostname === 'ibb.co' && /\.(png|jpe?g|webp|gif|svg)$/i.test(parsed.pathname)) {
      parsed.hostname = 'i.ibb.co'
      return parsed.toString()
    }

    // Se for images.unsplash.com, otimiza para carregamento móvel rápido mantendo alta nitidez (Retina 800px max)
    if (parsed.hostname === 'images.unsplash.com') {
      parsed.searchParams.set('auto', 'format')
      const currentW = Number(parsed.searchParams.get('w'))
      if (!currentW || currentW > 800) {
        parsed.searchParams.set('w', '800')
      }
      if (!parsed.searchParams.has('q')) {
        parsed.searchParams.set('q', '80')
      }
      return parsed.toString()
    }

    // Se for Cloudinary CDN, ativa conversão automática para WebP/AVIF e limites inteligentes de resolução
    if (parsed.hostname.includes('cloudinary.com') && parsed.pathname.includes('/image/upload/')) {
      if (!parsed.pathname.includes('/f_auto') && !parsed.pathname.includes('/q_auto')) {
        parsed.pathname = parsed.pathname.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_800,c_limit/')
        return parsed.toString()
      }
    }

    return parsed.toString()
  } catch {
    return trimmed
  }
}

/**
 * Detecta se a imagem carregada é o banner de erro "service unavailable" retornado pelo ImgBB (geralmente ~1115 bytes ou dimensões anômalas).
 */
export function isImgbbErrorImage(img: HTMLImageElement): boolean {
  if (!img) return false
  // O banner de erro "service unavailable" do ImgBB tem largura/altura muito específicas
  // ou tamanho quase nulo em proporções incorretas
  if (img.naturalWidth === 0 || img.naturalHeight === 0) return true
  // Banner de erro padrão do ImgBB tem 160x40 ou proporções 4:1 com menos de 200px
  if (img.naturalWidth <= 180 && img.naturalHeight <= 50) return true
  return false
}
