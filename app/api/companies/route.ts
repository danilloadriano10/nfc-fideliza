import { NextRequest, NextResponse } from 'next/server'
import {
  getServerCompanies,
  getServerCompanyBySlug,
  saveServerCompany,
  deleteServerCompany,
  toggleServerCompanyStatus,
} from '@/lib/server-storage'
import { Company } from '@/types/platform'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const company = getServerCompanyBySlug(slug)
      if (!company) {
        return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
      }
      return NextResponse.json({ company })
    }

    const companies = getServerCompanies()
    return NextResponse.json({ companies })
  } catch (err) {
    console.error('Error fetching companies:', err)
    return NextResponse.json({ error: 'Erro interno ao buscar empresas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const company = body as Company

    if (!company.name || !company.slug) {
      return NextResponse.json(
        { success: false, error: 'Nome e slug são obrigatórios.' },
        { status: 400 }
      )
    }

    const res = saveServerCompany(company)
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, company })
  } catch (err) {
    console.error('Error saving company:', err)
    return NextResponse.json(
      { success: false, error: 'Falha ao salvar empresa no servidor.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID da empresa não fornecido.' }, { status: 400 })
    }

    const res = deleteServerCompany(id)
    return NextResponse.json({ success: res })
  } catch (err) {
    console.error('Error deleting company:', err)
    return NextResponse.json({ success: false, error: 'Erro ao excluir empresa.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID da empresa não fornecido.' }, { status: 400 })
    }

    const res = toggleServerCompanyStatus(id)
    return NextResponse.json({ success: res })
  } catch (err) {
    console.error('Error toggling company status:', err)
    return NextResponse.json({ success: false, error: 'Erro ao alternar status.' }, { status: 500 })
  }
}
