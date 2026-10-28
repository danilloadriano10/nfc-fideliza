import { NextRequest, NextResponse } from 'next/server'
import {
  getServerCouriers,
  saveServerCourier,
  deleteServerCourier,
  getServerCompanyById,
  getServerCompanyBySlug,
} from '@/lib/server-storage'
import { CompanyCourier } from '@/types/platform'

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
    const couriers = await getServerCouriers(targetCompanyId)

    return NextResponse.json(
      { success: true, couriers: Array.isArray(couriers) ? couriers : [] },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /api/couriers GET error:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar motoboys.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, companyId, name, phone, isActive, notes } = body || {}

    if (!companyId || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'companyId e nome do motoboy são obrigatórios.' },
        { status: 400 }
      )
    }

    const company = await getServerCompanyById(companyId)
    const targetCompanyId = company?.id || companyId

    const courierToSave: CompanyCourier = {
      id: id || `courier_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId: targetCompanyId,
      name: name.trim(),
      phone: (phone || '').trim(),
      isActive: isActive !== false,
      notes: notes?.trim() || undefined,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const saved = await saveServerCourier(courierToSave)
    return NextResponse.json(
      { success: true, courier: saved },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /api/couriers POST error:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar motoboy.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')
    const companyId = searchParams.get('companyId')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id é obrigatório.' },
        { status: 400 }
      )
    }

    await deleteServerCourier(id)
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('API /api/couriers DELETE error:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao remover motoboy.' },
      { status: 500 }
    )
  }
}
