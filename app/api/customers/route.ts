import { NextRequest, NextResponse } from 'next/server'
import {
  getServerCompanyCustomers,
  getServerCustomerByPhone,
  getServerCustomerById,
  registerServerCustomer,
  directAddPointOnServer,
  redeemRewardOnServer,
  getServerCompanyBySlug,
  getServerCompanyById,
} from '@/lib/server-storage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const companyIdOrSlug = searchParams.get('companyId') || searchParams.get('slug')
    const phone = searchParams.get('phone')
    const id = searchParams.get('id')

    if (!companyIdOrSlug) {
      return NextResponse.json({ success: false, error: 'companyId obrigatório.' }, { status: 400 })
    }

    // Resolve real companyId
    let realCompanyId = companyIdOrSlug
    const compById = await getServerCompanyById(companyIdOrSlug)
    if (!compById) {
      const compBySlug = await getServerCompanyBySlug(companyIdOrSlug)
      if (compBySlug) {
        realCompanyId = compBySlug.id
      }
    }

    if (id) {
      const customer = await getServerCustomerById(realCompanyId, id)
      return NextResponse.json({ success: true, customer }, { status: 200 })
    }

    if (phone) {
      const customer = await getServerCustomerByPhone(realCompanyId, phone)
      return NextResponse.json({ success: true, customer }, { status: 200 })
    }

    const customers = await getServerCompanyCustomers(realCompanyId)
    return NextResponse.json({ success: true, customers }, { status: 200 })
  } catch (err) {
    console.error('Error in GET /api/customers:', err)
    return NextResponse.json({ success: false, error: 'Erro ao buscar clientes no Firestore.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, slug, name, phone } = body || {}

    let realCompanyId = companyId
    if (!realCompanyId && slug) {
      const compBySlug = await getServerCompanyBySlug(slug)
      if (compBySlug) realCompanyId = compBySlug.id
    }

    if (!realCompanyId) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não identificado.' },
        { status: 400 }
      )
    }

    const res = await registerServerCustomer(realCompanyId, { name, phone })
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, customer: res.customer }, { status: 200 })
  } catch (err) {
    console.error('Error in POST /api/customers:', err)
    return NextResponse.json(
      { success: false, error: 'Falha ao registrar cliente no Firestore.' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, customerId, action, operatorName } = body || {}

    if (!companyId || !customerId) {
      return NextResponse.json(
        { success: false, error: 'companyId e customerId são obrigatórios.' },
        { status: 400 }
      )
    }

    if (action === 'add_point') {
      const res = await directAddPointOnServer(companyId, customerId, operatorName || 'Caixa Balcão')
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, customer: res.customer }, { status: 200 })
    }

    if (action === 'redeem') {
      const res = await redeemRewardOnServer(companyId, customerId, operatorName || 'Gerente / Caixa')
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, customer: res.customer }, { status: 200 })
    }

    return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 })
  } catch (err) {
    console.error('Error in PUT /api/customers:', err)
    return NextResponse.json(
      { success: false, error: 'Falha ao atualizar pontos no Firestore.' },
      { status: 500 }
    )
  }
}
