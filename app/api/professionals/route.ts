import { NextRequest, NextResponse } from 'next/server'
import {
  getServerProfessionals,
  saveServerProfessional,
  deleteServerProfessional,
  getServerCompanyById,
  getServerCompanyBySlug,
} from '@/lib/server-storage'
import { CompanyProfessional } from '@/types/platform'

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

    let company = await getServerCompanyById(companyIdOrSlug)
    if (!company) {
      company = await getServerCompanyBySlug(companyIdOrSlug)
    }

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não encontrado.' },
        { status: 404 }
      )
    }

    const professionals = await getServerProfessionals(company.id)
    return NextResponse.json({ success: true, professionals }, { status: 200 })
  } catch (err) {
    console.error('Error in GET /api/professionals:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar profissionais.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, companyId, name, role, photoUrl, serviceIds, isActive } = body || {}

    if (!companyId || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'companyId e nome do profissional são obrigatórios.' },
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

    const prof: CompanyProfessional = {
      id: id || `prf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId,
      name: name.trim(),
      role: role && typeof role === 'string' ? role.trim() : '',
      photoUrl: photoUrl && typeof photoUrl === 'string' ? photoUrl.trim() : undefined,
      serviceIds: Array.isArray(serviceIds) ? serviceIds : [],
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
    }

    const res = await saveServerProfessional(prof)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao salvar profissional.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, professional: res.professional || prof }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/professionals:', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao salvar profissional.' },
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

    const res = await deleteServerProfessional(id, companyId)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao excluir profissional.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, message: 'Profissional excluído com sucesso.' }, { status: 200 })
  } catch (err) {
    console.error('Error in DELETE /api/professionals:', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao excluir profissional.' },
      { status: 500 }
    )
  }
}
