import { NextRequest, NextResponse } from 'next/server'
import { uploadCompanyFileServer, isBase64Image } from '@/lib/storage-service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''

    // 1. Multipart Form Data (File upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      const companyId = String(formData.get('companyId') || '').trim()
      const rawType = String(formData.get('type') || 'logo').trim().toLowerCase()
      const type = (rawType === 'product' ? 'product' : rawType === 'service' ? 'service' : rawType === 'cover' ? 'cover' : 'logo') as 'logo' | 'cover' | 'service' | 'product'

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'Nenhum arquivo enviado para upload.' },
          { status: 400 }
        )
      }

      if (!companyId) {
        return NextResponse.json(
          { success: false, error: 'Identificador da empresa (companyId) é obrigatório.' },
          { status: 400 }
        )
      }

      // Size limit (5MB)
      if (file.size > 5 * 1024 * 1024) {
        const typeLabel = type === 'logo' ? 'logo' : type === 'cover' ? 'capa' : type === 'product' ? 'produto' : 'serviço'
        return NextResponse.json(
          { success: false, error: `A imagem do ${typeLabel} excede o limite máximo de 5MB.` },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const result = await uploadCompanyFileServer(
        companyId,
        type,
        buffer,
        file.name || `${type}.jpg`,
        file.type || 'image/jpeg'
      )

      if (!result.success) {
        const typeLabel = type === 'logo' ? 'logo' : type === 'cover' ? 'capa' : type === 'product' ? 'produto' : 'serviço'
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao enviar ${typeLabel}: ${result.error || 'Falha no upload.'}`,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        url: result.url,
        storageProvider: result.storageProvider,
        path: result.path,
      })
    }

    // 2. JSON Body (e.g. if a Base64 string needs to be converted and uploaded)
    if (contentType.includes('application/json')) {
      const body = await req.json()
      const { companyId, type, base64Data, originalName } = body || {}

      if (!companyId || !base64Data || !isBase64Image(base64Data)) {
        return NextResponse.json(
          { success: false, error: 'Dados inválidos para conversão de Base64.' },
          { status: 400 }
        )
      }

      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        return NextResponse.json(
          { success: false, error: 'Formato Base64 inválido.' },
          { status: 400 }
        )
      }

      const mimeType = matches[1]
      const buffer = Buffer.from(matches[2], 'base64')
      const targetType = type === 'product' ? 'product' : type === 'cover' ? 'cover' : type === 'service' ? 'service' : 'logo'

      const result = await uploadCompanyFileServer(
        companyId,
        targetType,
        buffer,
        originalName || `${targetType}.jpg`,
        mimeType
      )

      if (!result.success) {
        const typeLabel = targetType === 'logo' ? 'logo' : targetType === 'cover' ? 'capa' : targetType === 'product' ? 'produto' : 'serviço'
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao enviar ${typeLabel}: ${result.error || 'Falha na gravação.'}`,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        url: result.url,
        storageProvider: result.storageProvider,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Content-Type não suportado. Use multipart/form-data.' },
      { status: 415 }
    )
  } catch (err) {
    console.error('Erro inesperado em POST /api/upload:', err)
    return NextResponse.json(
      {
        success: false,
        error: `Erro interno no servidor ao processar upload: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    )
  }
}
