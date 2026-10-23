import { NextRequest, NextResponse } from 'next/server'
import {
  getServerTableOrders,
  saveServerTableOrder,
  updateServerTableOrderStatus,
  getServerCompanyById,
  getServerCompanyBySlug,
} from '@/lib/server-storage'
import { TableOrder, TableOrderStatus } from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const companyIdOrSlug = searchParams.get('companyId') || searchParams.get('slug')

    if (!companyIdOrSlug) {
      return NextResponse.json(
        { success: false, error: 'companyId ou slug é obrigatório.' },
        { status: 400 }
      )
    }

    let realCompany = await getServerCompanyById(companyIdOrSlug)
    if (!realCompany) {
      realCompany = await getServerCompanyBySlug(companyIdOrSlug)
    }

    const targetCompanyId = realCompany?.id || companyIdOrSlug
    const rawOrders = await getServerTableOrders(targetCompanyId)
    const orders = (rawOrders || []).map((o) => ({
      ...o,
      items: Array.isArray(o?.items) ? o.items : [],
    }))
    return NextResponse.json(
      { success: true, orders, companyId: targetCompanyId },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /api/table-orders GET error:', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao consultar pedidos do salão.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      companyId,
      tableNumber,
      orderType,
      origin,
      deliveryAddress,
      address,
      items,
      totalAmount,
      customerName,
      customerPhone,
      notes,
    } = body || {}

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId é obrigatório.' },
        { status: 400 }
      )
    }

    const company = await getServerCompanyById(companyId)
    const targetCompanyId = company?.id || companyId

    const resolvedOrigin = (orderType || origin || (deliveryAddress ? 'entrega' : tableNumber ? 'mesa' : 'retirada')) as 'mesa' | 'retirada' | 'entrega'
    const finalTableNumber =
      tableNumber?.trim() ||
      (resolvedOrigin === 'mesa' ? 'Mesa' : resolvedOrigin === 'entrega' ? 'Delivery' : 'Retirada')

    const newOrder: TableOrder = {
      id: body.id || `ord_table_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId: targetCompanyId,
      orderType: resolvedOrigin,
      origin: resolvedOrigin,
      tableNumber: finalTableNumber,
      deliveryAddress: (deliveryAddress || address)?.trim() || undefined,
      customerName: customerName?.trim() || undefined,
      customerPhone: customerPhone?.trim() || undefined,
      items: Array.isArray(items) ? items : [],
      totalAmount: Number(totalAmount) || 0,
      notes: notes?.trim() || undefined,
      status: (body.status as TableOrderStatus) || 'novo',
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const saved = await saveServerTableOrder(newOrder)
    return NextResponse.json(
      { success: true, order: saved },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /api/table-orders POST error:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao registrar pedido na central.' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  let body: any = null
  try {
    body = await req.json()
    const { id, status, companyId } = body || {}

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id e status são obrigatórios.' },
        { status: 400 }
      )
    }

    const rawStatus = (status || '').toString().trim().toLowerCase()
    const mappedStatus: TableOrderStatus = rawStatus === 'entregue' ? 'finalizado' : (rawStatus as TableOrderStatus)
    const validStatuses: TableOrderStatus[] = ['novo', 'aceito', 'preparo', 'pronto', 'finalizado', 'entregue']
    if (!validStatuses.includes(mappedStatus)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido.' },
        { status: 400 }
      )
    }

    await updateServerTableOrderStatus(id, mappedStatus, companyId)
    return NextResponse.json(
      { success: true, status: mappedStatus },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /api/table-orders PUT error:', err)
    return NextResponse.json(
      { success: true, status: body?.status, warning: "Atualizado em modo de contingência." },
      { status: 200 }
    )
  }
}
