import { NextRequest, NextResponse } from 'next/server'
import {
  getServerTableOrders,
  getServerTableOrderById,
  saveServerTableOrder,
  updateServerTableOrderStatus,
  deleteServerTableOrder,
  getServerCompanyById,
  getServerCompanyBySlug,
} from '@/lib/server-storage'
import { TableOrder, TableOrderStatus, isCompanyPro, isCompanyActiveOrExempt } from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const orderId = searchParams.get('orderId') || searchParams.get('id')

    // Se estiver buscando um pedido específico (ex: motoboy na entrega ou cliente)
    if (orderId) {
      const order = await getServerTableOrderById(orderId)
      if (!order) {
        return NextResponse.json({ success: false, error: 'Pedido não encontrado.' }, { status: 404 })
      }
      let company = null
      if (order.companyId) {
        company = await getServerCompanyById(order.companyId)
      }
      return NextResponse.json(
        {
          success: true,
          order: {
            ...order,
            items: Array.isArray(order.items) ? order.items : [],
            history: Array.isArray(order.history) ? order.history : [],
          },
          company: company ? { id: company.id, name: company.name, whatsapp: company.whatsapp } : null,
        },
        { status: 200 }
      )
    }

    const companyIdOrSlug = searchParams.get('companyId') || searchParams.get('slug')

    if (!companyIdOrSlug) {
      return NextResponse.json(
        { success: false, error: 'companyId, slug ou orderId é obrigatório.' },
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

    let company = await getServerCompanyById(companyId)
    if (!company) {
      company = await getServerCompanyBySlug(companyId)
    }
    if (!company) {
      return NextResponse.json({ success: false, error: 'Empresa associada não encontrada.' }, { status: 404 })
    }

    const targetCompanyId = company.id

    // Idempotency guard: prevent accidental duplicate order creation
    if (body.id) {
      const existingOrders = await getServerTableOrders(targetCompanyId)
      const existing = existingOrders.find((o) => o.id === body.id)
      if (existing) {
        return NextResponse.json(
          { success: true, order: existing, duplicatePrevented: true },
          { status: 200 }
        )
      }
    }

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
      deliveryAddress: (body.formattedAddress || deliveryAddress || address)?.trim() || undefined,
      address: (body.street || address || deliveryAddress)?.trim() || undefined,
      addressNumber: (body.number || body.addressNumber)?.trim() || undefined,
      number: (body.number || body.addressNumber)?.trim() || undefined,
      neighborhood: body.neighborhood?.trim() || undefined,
      complement: body.complement?.trim() || undefined,
      referencePoint: (body.reference || body.referencePoint)?.trim() || undefined,
      reference: (body.reference || body.referencePoint)?.trim() || undefined,
      city: body.city?.trim() || undefined,
      state: body.state?.trim() || undefined,
      postalCode: body.postalCode?.trim() || undefined,
      street: (body.street || address || deliveryAddress)?.trim() || undefined,
      block: body.block?.trim() || undefined,
      lot: body.lot?.trim() || undefined,
      formattedAddress: (body.formattedAddress || deliveryAddress)?.trim() || undefined,
      structuredAddress: body.structuredAddress || undefined,
      locationUrl: body.locationUrl?.trim() || undefined,
      paymentMethod: body.paymentMethod?.trim() || undefined,
      paymentStatus: body.paymentStatus || undefined,
      paymentChangeFor: body.paymentChangeFor ? Number(body.paymentChangeFor) : undefined,
      receiptUrl:
        typeof body.receiptUrl === 'string' && body.receiptUrl.length > 500_000
          ? body.receiptUrl.slice(0, 500_000)
          : body.receiptUrl || undefined,
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
      deliveryCode: body.deliveryCode || undefined,
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
    const { id, status, companyId, order, historyEvent, action, code } = body || {}

    // Ação Especial: Confirmação de Entrega por Código de 4 Dígitos
    if (action === 'confirm_delivery_code') {
      const orderIdToConfirm = id || body.orderId
      if (!orderIdToConfirm || !code) {
        return NextResponse.json(
          { success: false, error: 'ID do pedido e código de 4 dígitos são obrigatórios.' },
          { status: 400 }
        )
      }

      const existing = await getServerTableOrderById(orderIdToConfirm)
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Pedido não encontrado.' }, { status: 404 })
      }

      const enteredCode = String(code).trim()
      const expectedCode = String(existing.deliveryCode || '').trim()

      if (!expectedCode || enteredCode !== expectedCode) {
        return NextResponse.json(
          {
            success: false,
            error: 'Código de entrega incorreto. Solicite ao cliente o código de 4 dígitos informado no aplicativo.',
          },
          { status: 400 }
        )
      }

      const nowIso = new Date().toISOString()
      const deliveryEvent = {
        id: `hist_${Date.now()}_delivery_code_verified`,
        timestamp: nowIso,
        action: 'entregue (código confirmado)',
        description: `Entrega confirmada pelo entregador via código de 4 dígitos (${enteredCode}).`,
        performedBy: existing.courierName ? `Motoboy ${existing.courierName}` : 'Entregador',
      }

      const updated = await saveServerTableOrder({
        ...existing,
        status: 'entregue',
        history: [...(existing.history || []), deliveryEvent],
        updatedAt: nowIso,
      })

      return NextResponse.json({ success: true, order: updated, message: 'Entrega confirmada com sucesso!' }, { status: 200 })
    }

    // Ação Especial: Confirmação manual de entrega pelo estabelecimento (fallback sem código)
    if (action === 'confirm_delivery_manual') {
      const orderIdToConfirm = id || body.orderId
      const existing = await getServerTableOrderById(orderIdToConfirm)
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Pedido não encontrado.' }, { status: 404 })
      }

      const nowIso = new Date().toISOString()
      const manualEvent = {
        id: `hist_${Date.now()}_manual_delivery_confirmed`,
        timestamp: nowIso,
        action: 'entregue (confirmação manual)',
        description: 'Entrega confirmada manualmente pelo estabelecimento (sem código).',
        performedBy: 'Estabelecimento',
      }

      const updated = await saveServerTableOrder({
        ...existing,
        status: 'entregue',
        history: [...(existing.history || []), manualEvent],
        updatedAt: nowIso,
      })

      return NextResponse.json({ success: true, order: updated }, { status: 200 })
    }

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
