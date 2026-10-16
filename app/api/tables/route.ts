import { NextRequest, NextResponse } from 'next/server'
import {
  getServerTables,
  saveServerTable,
  deleteServerTable,
  toggleServerTableStatus,
  getServerCompanyById,
  getServerCompanyBySlug,
} from '@/lib/server-storage'
import { CompanyTable } from '@/types/platform'

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

    const tables = await getServerTables(realCompany.id)
    return NextResponse.json(
      { success: true, tables, companyId: realCompany.id },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /api/tables GET error:', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao consultar mesas.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, name, identifier, notes, isActive, id } = body

    if (!companyId || !name) {
      return NextResponse.json(
        { success: false, error: 'companyId e name são obrigatórios.' },
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

    const cleanIdentifier = (identifier || name).replace(/^(mesa|table)\s*/i, '').trim() || name.trim()

    const tableData: CompanyTable = {
      id: id || `table_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId,
      name: name.trim(),
      identifier: cleanIdentifier,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      notes: notes?.trim() || undefined,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const saved = await saveServerTable(tableData)
    return NextResponse.json(
      { success: true, table: saved },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /api/tables POST error:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar mesa.' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, companyId, toggleStatus, name, identifier, notes, isActive } = body

    if (!id || !companyId) {
      return NextResponse.json(
        { success: false, error: 'id e companyId são obrigatórios.' },
        { status: 400 }
      )
    }

    if (toggleStatus) {
      const nextStatus = await toggleServerTableStatus(id, companyId)
      return NextResponse.json(
        { success: true, isActive: nextStatus },
        { status: 200 }
      )
    }

    const cleanIdentifier = identifier ? identifier.replace(/^(mesa|table)\s*/i, '').trim() : undefined

    const updated = await saveServerTable({
      id,
      companyId,
      name: name?.trim() || 'Mesa',
      identifier: cleanIdentifier || name?.trim() || 'Mesa',
      notes: notes?.trim() || undefined,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json(
      { success: true, table: updated },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /api/tables PUT error:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar mesa.' },
      { status: 500 }
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

    await deleteServerTable(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    console.error('API /api/tables DELETE error:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir mesa.' },
      { status: 500 }
    )
  }
}
