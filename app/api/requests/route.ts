import { NextRequest, NextResponse } from 'next/server'
import {
  getServerPointRequests,
  getServerPointRequestById,
  createPointRequestOnServer,
  approvePointRequestOnServer,
  rejectPointRequestOnServer,
  getServerCompanyBySlug,
  getServerCompanyById,
} from '@/lib/server-storage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const requestId = searchParams.get('requestId')
    const companyIdOrSlug = searchParams.get('companyId') || searchParams.get('slug')
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null

    // Single request query (e.g. for customer status polling on Celular A)
    if (requestId) {
      const request = await getServerPointRequestById(requestId)
      if (!request) {
        return NextResponse.json({ success: false, error: 'Solicitação não encontrada.' }, { status: 404 })
      }
      return NextResponse.json({ success: true, request }, { status: 200 })
    }

    if (!companyIdOrSlug) {
      return NextResponse.json({ success: true, requests: [] }, { status: 200 })
    }

    // Resolve real companyId if slug was provided
    let realCompanyId = companyIdOrSlug
    const compById = await getServerCompanyById(companyIdOrSlug)
    if (!compById) {
      const compBySlug = await getServerCompanyBySlug(companyIdOrSlug)
      if (compBySlug) {
        realCompanyId = compBySlug.id
      }
    }

    const requests = await getServerPointRequests(realCompanyId, status || undefined)
    return NextResponse.json({ success: true, requests }, { status: 200 })
  } catch (err) {
    console.error('Error in GET /api/requests:', err)
    return NextResponse.json({ success: false, error: 'Erro ao buscar solicitações no Firestore.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, slug, customerId, name, phone } = body || {}

    // Resolve real company ID
    let realCompanyId = companyId
    if (!realCompanyId && slug) {
      const compBySlug = await getServerCompanyBySlug(slug)
      if (compBySlug) realCompanyId = compBySlug.id
    } else if (realCompanyId) {
      const comp = (await getServerCompanyById(realCompanyId)) || (await getServerCompanyBySlug(realCompanyId))
      if (comp) realCompanyId = comp.id
    }

    if (!realCompanyId) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não identificado.' },
        { status: 400 }
      )
    }

    if (!phone || !String(phone).trim()) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe seu WhatsApp com DDD.' },
        { status: 400 }
      )
    }

    const res = await createPointRequestOnServer(realCompanyId, {
      customerId,
      name: name ? String(name).trim() : 'Cliente',
      phone: String(phone).trim(),
    })

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 })
    }

    return NextResponse.json(
      { success: true, request: res.request, customer: res.customer },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error in POST /api/requests:', err)
    return NextResponse.json(
      { success: false, error: 'Falha ao registrar solicitação de ponto no Firestore.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { requestId, action, operatorName } = body || {}

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'ID da solicitação obrigatório.' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      const res = await approvePointRequestOnServer(requestId, operatorName || 'Caixa Balcão')
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, request: res.request, customer: res.customer })
    }

    if (action === 'reject') {
      const res = await rejectPointRequestOnServer(requestId, operatorName || 'Caixa Balcão')
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, request: res.request })
    }

    return NextResponse.json(
      { success: false, error: 'Ação inválida. Use "approve" ou "reject".' },
      { status: 400 }
    )
  } catch (err) {
    console.error('Error in PATCH /api/requests:', err)
    return NextResponse.json(
      { success: false, error: 'Falha ao processar solicitação no Firestore.' },
      { status: 500 }
    )
  }
}
