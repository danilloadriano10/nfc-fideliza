import { NextRequest, NextResponse } from 'next/server'
import { getServerFeedbacks, saveServerFeedback } from '@/lib/server-storage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId')?.trim()

    // If no companyId specified or empty, safely return empty list
    if (!companyId) {
      return NextResponse.json({ feedbacks: [] }, { status: 200 })
    }

    // Strict tenant isolation: only return feedbacks for the requested company from Firestore
    const feedbacks = (await getServerFeedbacks(companyId)) || []
    return NextResponse.json({ feedbacks }, { status: 200 })
  } catch (err) {
    console.error('Error in GET /api/feedbacks:', err)
    return NextResponse.json({ feedbacks: [] }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, rating, message, customerName, customerPhone } = body || {}

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa não informado.' },
        { status: 400 }
      )
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Por favor, escreva sua mensagem ou sugestão.' },
        { status: 400 }
      )
    }

    const res = await saveServerFeedback({
      companyId,
      rating: typeof rating === 'number' ? rating : undefined,
      message: String(message).trim(),
      customerName: customerName ? String(customerName).trim() : undefined,
      customerPhone: customerPhone ? String(customerPhone).trim() : undefined,
    })

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, feedback: res.feedback }, { status: 200 })
  } catch (err) {
    console.error('Error in POST /api/feedbacks:', err)
    return NextResponse.json(
      { success: false, error: 'Falha ao registrar feedback no Firestore.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
