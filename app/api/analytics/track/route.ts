import { NextRequest, NextResponse } from 'next/server'
import { recordServerAnalyticsEvent } from '@/lib/server-storage'
import { AnalyticsEventType } from '@/types/platform'

const ALLOWED_EVENTS: Set<AnalyticsEventType> = new Set([
  'PAGE_VIEW',
  'WHATSAPP_CLICK',
  'MAP_CLICK',
  'MENU_CLICK',
  'SCHEDULING_CLICK',
  'PRODUCT_CLICK',
  'SERVICE_CLICK',
  'GOOGLE_REVIEW_CLICK',
  'INSTAGRAM_CLICK',
  'SOCIAL_CLICK',
  'CUSTOM_LINK_CLICK',
])

export async function POST(req: NextRequest) {
  try {
    let body: { companyId?: string; eventType?: AnalyticsEventType; date?: string }

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      const text = await req.text()
      try {
        body = JSON.parse(text)
      } catch {
        return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 })
      }
    } else {
      body = await req.json()
    }

    const { companyId, eventType, date } = body || {}

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json({ success: false, error: 'companyId obrigatório' }, { status: 400 })
    }

    if (!eventType || !ALLOWED_EVENTS.has(eventType)) {
      return NextResponse.json({ success: false, error: 'eventType inválido' }, { status: 400 })
    }

    const result = await recordServerAnalyticsEvent(companyId.trim(), eventType, date)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Erro na rota /api/analytics/track:', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao registrar evento' },
      { status: 500 }
    )
  }
}
