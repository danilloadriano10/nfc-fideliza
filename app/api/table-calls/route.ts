import { NextRequest, NextResponse } from 'next/server'
import {
  getFirestoreTableCalls,
  saveFirestoreTableCall,
  resolveFirestoreTableCall,
} from '@/lib/firestore-service'
import { CompanyTableCall } from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId é obrigatório.' }, { status: 400 })
    }

    const calls = await getFirestoreTableCalls(companyId)
    return NextResponse.json({ success: true, calls }, { status: 200 })
  } catch (err) {
    console.error('API /api/table-calls GET error:', err)
    return NextResponse.json({ success: false, error: 'Erro ao listar chamados.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, tableNumber, tableId, type, paymentMethodPreference, notes } = body || {}

    if (!companyId || !tableNumber || !type) {
      return NextResponse.json(
        { success: false, error: 'companyId, tableNumber e type são obrigatórios.' },
        { status: 400 }
      )
    }

    const newCall: CompanyTableCall = {
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId,
      tableNumber: String(tableNumber).trim(),
      tableId: tableId ? String(tableId) : undefined,
      type: type === 'conta' ? 'conta' : 'garcom',
      paymentMethodPreference: paymentMethodPreference || undefined,
      notes: notes?.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    const saved = await saveFirestoreTableCall(newCall)
    return NextResponse.json({ success: true, call: saved }, { status: 200 })
  } catch (err) {
    console.error('API /api/table-calls POST error:', err)
    return NextResponse.json({ success: false, error: 'Erro ao registrar chamado.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, companyId, action } = body || {}

    if (!id || !companyId) {
      return NextResponse.json({ success: false, error: 'id e companyId são obrigatórios.' }, { status: 400 })
    }

    if (action === 'resolve') {
      const ok = await resolveFirestoreTableCall(id, companyId)
      return NextResponse.json({ success: ok }, { status: 200 })
    }

    return NextResponse.json({ success: false, error: 'Ação não suportada.' }, { status: 400 })
  } catch (err) {
    console.error('API /api/table-calls PUT error:', err)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar chamado.' }, { status: 500 })
  }
}
