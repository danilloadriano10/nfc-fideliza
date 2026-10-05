/**
 * Client-side Storage Helpers (Zero Node.js dependencies, 100% browser-safe)
 */

export function isBase64Image(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false
  return val.trim().startsWith('data:image/')
}

export async function uploadCompanyImageFromClient(
  companyId: string,
  type: 'logo' | 'cover',
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('companyId', companyId)
    formData.append('type', type)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      const typeLabel = type === 'logo' ? 'da logo' : 'da capa'
      const err = data.error || `Erro ao enviar ${typeLabel}.`
      console.error(`Erro ao fazer upload ${typeLabel}:`, data)
      return { success: false, error: err }
    }

    return { success: true, url: data.url }
  } catch (err) {
    const typeLabel = type === 'logo' ? 'da logo' : 'da capa'
    console.error(`Exceção de rede no upload ${typeLabel}:`, err)
    return {
      success: false,
      error: `Erro de conexão ao enviar ${typeLabel}: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}
