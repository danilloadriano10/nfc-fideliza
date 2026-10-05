import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id || typeof id !== 'string') {
      return new NextResponse('ID inválido', { status: 400 })
    }

    const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '')
    let docRef = doc(db, 'settings', cleanId)
    let snap = await getDoc(docRef)

    if (!snap.exists()) {
      docRef = doc(db, 'uploaded_images', cleanId)
      snap = await getDoc(docRef)
    }

    if (!snap.exists()) {
      return new NextResponse('Imagem não encontrada', { status: 404 })
    }

    const docData = snap.data()
    if (!docData?.data) {
      return new NextResponse('Dados de imagem ausentes', { status: 404 })
    }

    let fullBase64 = docData.data
    const totalChunks = Number(docData.totalChunks) || 1

    if (totalChunks > 1) {
      const chunkPromises = []
      for (let i = 1; i < totalChunks; i++) {
        chunkPromises.push(getDoc(doc(db, 'settings', `${cleanId}_p${i}`)))
      }
      const chunkSnaps = await Promise.all(chunkPromises)
      for (const cSnap of chunkSnaps) {
        if (cSnap.exists() && cSnap.data()?.data) {
          fullBase64 += cSnap.data().data
        }
      }
    }

    const buffer = Buffer.from(fullBase64, 'base64')
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': docData.contentType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    console.error('Erro ao servir imagem:', err)
    return new NextResponse('Erro interno ao buscar imagem', { status: 500 })
  }
}
