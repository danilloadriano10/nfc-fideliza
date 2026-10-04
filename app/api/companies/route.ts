import { NextRequest, NextResponse } from 'next/server'
import {
  getServerCompanies,
  getServerCompanyBySlug,
  saveServerCompany,
  deleteServerCompany,
  toggleServerCompanyStatus,
} from '@/lib/server-storage'
import { Company } from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const company = await getServerCompanyBySlug(slug)
      if (!company) {
        return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
      }
      return NextResponse.json({ company })
    }

    const companies = await getServerCompanies()
    return NextResponse.json({ companies })
  } catch (err) {
    console.error('Error fetching companies from Firestore:', err)
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

    const res = await saveServerCompany(company)
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, company })
  } catch (err) {
    console.error('Error saving company in Firestore:', err)
    return NextResponse.json(
      { success: false, error: 'Falha ao salvar empresa no Firestore.' },
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

    const res = await deleteServerCompany(id)
    return NextResponse.json({ success: res })
  } catch (err) {
    console.error('Error deleting company from Firestore:', err)
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

    const res = await toggleServerCompanyStatus(id)
    return NextResponse.json({ success: res })
  } catch (err) {
    console.error('Error toggling company status in Firestore:', err)
    return NextResponse.json({ success: false, error: 'Erro ao alternar status.' }, { status: 500 })
  }
}
