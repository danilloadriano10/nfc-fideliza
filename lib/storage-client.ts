/**
 * Client-side Storage Helpers (Zero Node.js dependencies, 100% browser-safe)
 */

export function isBase64Image(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false
  return val.trim().startsWith('data:image/')
}

/**
 * Compresses an image file in the browser using HTML5 Canvas.
 * Reduces 5MB-10MB mobile phone images down to 30KB-120KB in milliseconds.
 * This completely avoids mobile network timeouts, large request payload drops, and storage limits.
 */
export async function compressImageClient(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.85
): Promise<File> {
  // If not an image or SVG/GIF, return unchanged
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file
  }

  // Only run in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file
  }

  return new Promise((resolve) => {
    try {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        let { width, height } = img

        // If already within bounds and small, skip re-encoding
        if (width <= maxWidth && height <= maxHeight && file.size < 350 * 1024) {
          resolve(file)
          return
        }

        // Calculate aspect ratio preserving bounds
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve(file)
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, '') + (outputFormat === 'image/png' ? '.png' : '.jpg')
            const compressed = new File([blob], cleanName, {
              type: outputFormat,
              lastModified: Date.now(),
            })
            resolve(compressed)
          },
          outputFormat,
          quality
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        resolve(file)
      }

      img.src = objectUrl
    } catch {
      resolve(file)
    }
  })
}

export async function uploadCompanyImageFromClient(
  companyId: string,
  type: 'logo' | 'cover' | 'service' | 'product',
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  const typeLabel = type === 'logo' ? 'da logo' : type === 'cover' ? 'da capa' : type === 'product' ? 'do produto' : 'do serviço'
  try {
    // 1. Client-side smart compression (Logo: max 512x512, Cover: max 1280x720, Service/Product: max 800x800)
    const maxW = type === 'logo' ? 512 : type === 'cover' ? 1280 : 800
    const maxH = type === 'logo' ? 512 : type === 'cover' ? 720 : 800
    const fileToUpload = await compressImageClient(file, maxW, maxH, 0.85)

    // 2. Upload with retry (up to 2 attempts) to handle momentary network glitches
    let lastErrorMsg = ''
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const formData = new FormData()
        formData.append('file', fileToUpload)
        formData.append('companyId', companyId)
        formData.append('type', type)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          const err = data.error || `Erro ao enviar ${typeLabel}.`
          console.warn(`[Tentativa ${attempt}] Erro ao fazer upload ${typeLabel}:`, data)
          lastErrorMsg = err
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 600))
            continue
          }
          return { success: false, error: err }
        }

        return { success: true, url: data.url }
      } catch (networkErr) {
        lastErrorMsg = networkErr instanceof Error ? networkErr.message : String(networkErr)
        console.warn(`[Tentativa ${attempt}] Exceção de rede no upload ${typeLabel}:`, networkErr)
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 600))
        }
      }
    }

    return {
      success: false,
      error: `Erro ao enviar ${typeLabel}: ${lastErrorMsg || 'Falha de conexão com o servidor.'}`,
    }
  } catch (err) {
    console.error(`Erro ao processar imagem ${typeLabel}:`, err)
    return {
      success: false,
      error: `Erro ao preparar imagem ${typeLabel}: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}
