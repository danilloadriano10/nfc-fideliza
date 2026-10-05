import { NextRequest, NextResponse } from 'next/server'
import {
  getServerCompanies,
  getServerCompanyBySlug,
  saveServerCompany,
  deleteServerCompany,
  toggleServerCompanyStatus,
} from '@/lib/server-storage'
import { Company } from '@/types/platform'
import { isBase64Image, uploadCompanyFileServer } from '@/lib/storage-service'

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
    return NextResponse.json({ error: 'Erro interno ao buscar empresas', details: err instanceof Error ? err.message : String(err) }, { status: 500 })
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

    if (!company.id) {
      company.id = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    }

    // 1. Strict Base64 Defense: Never allow Base64 to enter Firestore
    if (isBase64Image(company.logoUrl)) {
      const matches = company.logoUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (matches && matches[2]) {
        const mime = matches[1]
        const buf = Buffer.from(matches[2], 'base64')
        const up = await uploadCompanyFileServer(company.id, 'logo', buf, 'logo.png', mime)
        company.logoUrl = up.url || ''
      } else {
        company.logoUrl = ''
      }
    }

    if (isBase64Image(company.coverUrl)) {
      const matches = company.coverUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (matches && matches[2]) {
        const mime = matches[1]
        const buf = Buffer.from(matches[2], 'base64')
        const up = await uploadCompanyFileServer(company.id, 'cover', buf, 'cover.jpg', mime)
        company.coverUrl = up.url || ''
      } else {
        company.coverUrl = '/images/cafe_central_banner_1791003956057.jpg'
      }
    }

    const res = await saveServerCompany(company)
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, company })
  } catch (err) {
    console.error('Error saving company in Firestore:', err)
    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao salvar empresa no Firestore.',
        details: err instanceof Error ? err.message : String(err),
      },
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
