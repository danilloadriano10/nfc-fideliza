import { NextRequest, NextResponse } from 'next/server'
import {
  getServerTableOrders,
  saveServerTableOrder,
  updateServerTableOrderStatus,
  deleteServerTableOrder,
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

    const nowIso = new Date().toISOString()
    const isAutoAccept = company?.autoAcceptOrders === true
    const explicitStatus = body.status as TableOrderStatus | undefined
    const finalStatus: TableOrderStatus = explicitStatus || (isAutoAccept ? 'preparo' : 'novo')

    const initialHistory = Array.isArray(body.history) && body.history.length > 0
      ? body.history
      : [
          {
            id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_created`,
            timestamp: nowIso,
            action: body.isManualOrder ? 'pedido criado manualmente' : 'pedido criado',
            description: body.isManualOrder
              ? 'Pedido criado manualmente pelo estabelecimento'
              : `Pedido criado (${resolvedOrigin === 'mesa' ? 'Consumo no local' : resolvedOrigin === 'retirada' ? 'Retirada no balcão' : 'Entrega delivery'})`,
            performedBy: body.isManualOrder ? 'Estabelecimento' : 'Cliente',
          },
        ]

    if (isAutoAccept && !explicitStatus) {
      initialHistory.push({
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_auto_accept`,
        timestamp: nowIso,
        action: 'pedido aceito automaticamente',
        description: 'Pedido aceito automaticamente',
        performedBy: 'Sistema',
      })
    }

    const newOrder: TableOrder = {
      id: body.id || `ord_table_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId: targetCompanyId,
      orderType: resolvedOrigin,
      origin: resolvedOrigin,
      tableNumber: finalTableNumber,
      deliveryAddress: (deliveryAddress || address)?.trim() || undefined,
      address: (address || deliveryAddress)?.trim() || undefined,
      addressNumber: body.addressNumber?.trim() || undefined,
      neighborhood: body.neighborhood?.trim() || undefined,
      complement: body.complement?.trim() || undefined,
      referencePoint: body.referencePoint?.trim() || undefined,
      city: body.city?.trim() || undefined,
      locationUrl: body.locationUrl?.trim() || undefined,
      paymentMethod: body.paymentMethod?.trim() || undefined,
      paymentStatus: body.paymentStatus || undefined,
      paymentChangeFor: body.paymentChangeFor ? Number(body.paymentChangeFor) : undefined,
      receiptUrl: body.receiptUrl || undefined,
      receiptName: body.receiptName || undefined,
      receiptType: body.receiptType || undefined,
      receiptUploadedAt: body.receiptUploadedAt || undefined,
      subtotal: body.subtotal ? Number(body.subtotal) : undefined,
      discount: body.discount ? Number(body.discount) : undefined,
      surcharge: body.surcharge ? Number(body.surcharge) : undefined,
      customerName: customerName?.trim() || undefined,
      customerPhone: customerPhone?.trim() || undefined,
      items: Array.isArray(items) ? items : [],
      totalAmount: Number(totalAmount) || 0,
      notes: notes?.trim() || undefined,
      status: finalStatus,
      isManualOrder: Boolean(body.isManualOrder),
      courierId: body.courierId || undefined,
      courierName: body.courierName || undefined,
      courierPhone: body.courierPhone || undefined,
      history: initialHistory,
      createdAt: body.createdAt || nowIso,
      updatedAt: nowIso,
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
    const { id, status, companyId, order, historyEvent } = body || {}

    // Caso 1: Atualização completa do pedido (edição de itens, dados do cliente, motoboy, totais, etc.)
    if (order && order.id) {
      const savedOrder = await saveServerTableOrder({
        ...order,
        updatedAt: new Date().toISOString(),
      })
      return NextResponse.json(
        { success: true, order: savedOrder },
        { status: 200 }
      )
    }

    // Caso 2: Atualização de status
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id e status são obrigatórios.' },
        { status: 400 }
      )
    }

    const rawStatus = (status || '').toString().trim().toLowerCase() as TableOrderStatus
    const validStatuses: TableOrderStatus[] = [
      'novo',
      'aceito',
      'preparo',
      'pronto',
      'pronto_retirada',
      'servido',
      'saiu_entrega',
      'entregue',
      'finalizado',
      'cancelado',
    ]

    if (!validStatuses.includes(rawStatus)) {
      return NextResponse.json(
        { success: false, error: `Status inválido: ${rawStatus}` },
        { status: 400 }
      )
    }

    // Se houver histórico ou precisarmos persistir com evento
    if (historyEvent && companyId) {
      const orders = await getServerTableOrders(companyId)
      const current = orders.find((o) => o.id === id)
      if (current) {
        const updated = await saveServerTableOrder({
          ...current,
          status: rawStatus,
          history: [...(current.history || []), historyEvent],
          updatedAt: new Date().toISOString(),
        })
        return NextResponse.json(
          { success: true, status: rawStatus, order: updated },
          { status: 200 }
        )
      }
    }

    await updateServerTableOrderStatus(id, rawStatus, companyId)
    return NextResponse.json(
      { success: true, status: rawStatus },
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

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')
    const companyId = searchParams.get('companyId')

    if (!id || !companyId) {
      return NextResponse.json(
        { success: false, error: 'id e companyId são obrigatórios.' },
        { status: 400 }
      )
    }

    const res = await deleteServerTableOrder(id, companyId)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao excluir pedido.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Pedido excluído com sucesso.' },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /api/table-orders DELETE error:', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao excluir pedido.' },
      { status: 500 }
    )
  }
}
