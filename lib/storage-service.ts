import path from 'path'
import crypto from 'crypto'

export interface UploadResult {
  success: boolean
  url?: string
  storageProvider?: 'imgbb' | 'cloudinary'
  path?: string
  error?: string
}

/**
 * Sanitizes file names to prevent directory traversal or invalid characters
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
}

/**
 * Validates whether a given string is a raw Base64 data URL
 */
export function isBase64Image(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false
  return val.trim().startsWith('data:image/')
}

/**
 * Uploads an image buffer directly to ImgBB API (100% Free CDN, no credit card required)
 */
async function uploadToImgBB(
  companyId: string,
  type: 'logo' | 'cover',
  fileBuffer: Buffer,
  fileName: string,
  apiKey: string
): Promise<UploadResult> {
  const base64Data = fileBuffer.toString('base64')
  const cleanCompId = companyId.replace(/[^a-zA-Z0-9_-]/g, '_')
  const baseName = sanitizeFileName(path.parse(fileName).name) || type

  const formData = new FormData()
  formData.append('image', base64Data)
  formData.append('name', `${cleanCompId}_${type}_${baseName}`)

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    body: formData,
  })

  const data = await res.json()
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Erro HTTP ${res.status}`
    throw new Error(`Falha no upload para o ImgBB: ${errorMsg}`)
  }

  const publicUrl = data?.data?.url || data?.data?.display_url
  console.log(`[ImgBB CDN] Upload com sucesso para ${cleanCompId}/${type}: ${publicUrl}`)

  return {
    success: true,
    url: publicUrl,
    storageProvider: 'imgbb',
    path: `companies/${cleanCompId}/${type}/${fileName}`,
  }
}

/**
 * Uploads an image buffer directly to Cloudinary (Free tier 25GB, no credit card required)
 */
async function uploadToCloudinary(
  companyId: string,
  type: 'logo' | 'cover',
  fileBuffer: Buffer,
  mimeType: string,
  cloudName: string,
  preset?: string,
  apiKey?: string,
  apiSecret?: string
): Promise<UploadResult> {
  const cleanCompId = companyId.replace(/[^a-zA-Z0-9_-]/g, '_')
  const folder = `companies/${cleanCompId}/${type}`
  const base64Data = `data:${mimeType};base64,${fileBuffer.toString('base64')}`

  const formData = new FormData()
  formData.append('file', base64Data)
  formData.append('folder', folder)

  if (preset) {
    formData.append('upload_preset', preset)
  } else if (apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    formData.append('timestamp', timestamp)
    formData.append('api_key', apiKey)

    // Generate SHA-1 signature
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex')
    formData.append('signature', signature)
  } else {
    throw new Error(
      'Configuração incompleta do Cloudinary: informe CLOUDINARY_UPLOAD_PRESET ou (CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET).'
    )
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  const data = await res.json()
  if (!res.ok || !data.secure_url) {
    const errorMsg = data?.error?.message || `Erro HTTP ${res.status}`
    throw new Error(`Falha no upload para o Cloudinary: ${errorMsg}`)
  }

  console.log(`[Cloudinary CDN] Upload com sucesso para ${cleanCompId}/${type}: ${data.secure_url}`)

  return {
    success: true,
    url: data.secure_url,
    storageProvider: 'cloudinary',
    path: `${folder}/${data.public_id}`,
  }
}

/**
 * Server-side upload handler:
 * Uploads exclusively to free cloud image providers (ImgBB or Cloudinary).
 *
 * Rules:
 * 1. Zero usage of local temporary disk (/public/uploads)
 * 2. Zero raw Base64 data saved in Firestore
 * 3. Returns permanent public CDN HTTPS URLs
 * 4. Clear error diagnostics if no provider is configured
 */
export async function uploadCompanyFileServer(
  companyId: string,
  type: 'logo' | 'cover',
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  const cleanCompId = companyId.replace(/[^a-zA-Z0-9_-]/g, '_')
  const ext =
    path.extname(originalName) ||
    (mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg')
  const baseName = sanitizeFileName(path.basename(originalName, ext)) || type
  const fileName = `${Date.now()}_${baseName}${ext}`

  // 1. Try ImgBB if key is available (Server-only secret variable)
  const imgbbApiKey = process.env.IMGBB_API_KEY || ''

  if (imgbbApiKey) {
    try {
      return await uploadToImgBB(cleanCompId, type, fileBuffer, fileName, imgbbApiKey)
    } catch (err) {
      console.error('[ImgBB Erro]:', err)
      return {
        success: false,
        error: `Erro ao enviar para o ImgBB: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  }

  // 2. Try Cloudinary if cloud name is available
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || ''
  const cloudinaryPreset = process.env.CLOUDINARY_UPLOAD_PRESET || ''
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || ''
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || ''

  if (cloudinaryCloudName) {
    try {
      return await uploadToCloudinary(
        cleanCompId,
        type,
        fileBuffer,
        mimeType,
        cloudinaryCloudName,
        cloudinaryPreset,
        cloudinaryApiKey,
        cloudinaryApiSecret
      )
    } catch (err) {
      console.error('[Cloudinary Erro]:', err)
      return {
        success: false,
        error: `Erro ao enviar para o Cloudinary: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  }

  // 3. Neither provider configured: Fail clearly and actionably without writing locally
  const helpfulMessage =
    'Nenhum provedor gratuito de imagens configurado no Netlify. Para fazer upload de logo e capa sem cobrança e sem cartão de crédito, obtenha uma chave gratuita no ImgBB (https://api.imgbb.com) e configure a variável de ambiente IMGBB_API_KEY no Netlify (ou configure o Cloudinary). Você pode continuar o cadastro mantendo todos os outros dados intactos.'

  console.warn(`[Storage Warning] Tentativa de upload de ${type} sem provedor configurado.`)

  return {
    success: false,
    error: helpfulMessage,
  }
}
