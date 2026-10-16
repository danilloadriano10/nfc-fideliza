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

    if (!realCompany) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não encontrado.' },
        { status: 404 }
      )
    }

    const orders = await getServerTableOrders(realCompany.id)
    return NextResponse.json(
      { success: true, orders, companyId: realCompany.id },
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
    const { companyId, tableNumber, items, totalAmount, customerName, customerPhone, notes } = body

    if (!companyId || !tableNumber || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'companyId, tableNumber e items são obrigatórios.' },
        { status: 400 }
      )
    }

    const company = await getServerCompanyById(companyId)
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não encontrado.' },
        { status: 404 }
      )
    }

    const newOrder: TableOrder = {
      id: body.id || `ord_table_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId,
      tableNumber: tableNumber.trim(),
      customerName: customerName?.trim() || undefined,
      customerPhone: customerPhone?.trim() || undefined,
      items,
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
      { success: false, error: 'Erro ao registrar pedido do salão.' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, companyId } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id e status são obrigatórios.' },
        { status: 400 }
      )
    }

    const validStatuses: TableOrderStatus[] = ['novo', 'aceito', 'preparo', 'pronto', 'entregue']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido.' },
        { status: 400 }
      )
    }

    await updateServerTableOrderStatus(id, status as TableOrderStatus)
    return NextResponse.json(
      { success: true, status },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /api/table-orders PUT error:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar status do pedido.' },
      { status: 500 }
    )
  }
}
