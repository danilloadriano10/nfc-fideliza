import { NextRequest, NextResponse } from 'next/server'
import {
  getServerServices,
  getServerServiceById,
  saveServerService,
  deleteServerService,
  toggleServerServiceStatus,
  getServerCompanyById,
  getServerCompanyBySlug,
} from '@/lib/server-storage'
import { CompanyService } from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const companyIdOrSlug = searchParams.get('companyId') || searchParams.get('slug')
    const serviceId = searchParams.get('id')

    if (!companyIdOrSlug) {
      return NextResponse.json(
        { success: false, error: 'companyId ou slug é obrigatório.' },
        { status: 400 }
      )
    }

    // Resolve company ID
    let realCompanyId = companyIdOrSlug
    const compById = await getServerCompanyById(companyIdOrSlug)
    if (!compById) {
      const compBySlug = await getServerCompanyBySlug(companyIdOrSlug)
      if (compBySlug) {
        realCompanyId = compBySlug.id
      } else {
        return NextResponse.json(
          { success: false, error: 'Estabelecimento não encontrado.' },
          { status: 404 }
        )
      }
    }

    if (serviceId) {
      const service = await getServerServiceById(realCompanyId, serviceId)
      if (!service) {
        return NextResponse.json(
          { success: false, error: 'Serviço não encontrado.' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, service }, { status: 200 })
    }

    const services = await getServerServices(realCompanyId)
    return NextResponse.json({ success: true, services }, { status: 200 })
  } catch (err) {
    console.error('Error in GET /api/services:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao buscar serviços.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      companyId,
      name,
      photoUrl,
      description,
      price,
      priceType,
      durationMinutes,
      category,
      isActive,
    } = body || {}

    if (!companyId || !companyId.trim()) {
      return NextResponse.json(
        { success: false, error: 'companyId é obrigatório.' },
        { status: 400 }
      )
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome do serviço é obrigatório.' },
        { status: 400 }
      )
    }

    // Verify company exists to enforce multi-tenant isolation
    const company = await getServerCompanyById(companyId)
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Empresa associada não encontrada.' },
        { status: 404 }
      )
    }

    // Sanitize price
    let parsedPrice: number | null = null
    if (typeof price === 'number' && !isNaN(price)) {
      parsedPrice = price
    } else if (typeof price === 'string' && price.trim() !== '') {
      const num = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'))
      if (!isNaN(num)) parsedPrice = num
    }

    let parsedDuration: number | null = null
    if (typeof durationMinutes === 'number' && !isNaN(durationMinutes)) {
      parsedDuration = durationMinutes
    } else if (typeof durationMinutes === 'string' && durationMinutes.trim() !== '') {
      const num = parseInt(durationMinutes, 10)
      if (!isNaN(num)) parsedDuration = num
    }

    const newService: CompanyService = {
      id: body.id && typeof body.id === 'string' && body.id.trim() ? body.id.trim() : `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId: companyId.trim(),
      name: name.trim(),
      photoUrl: photoUrl && typeof photoUrl === 'string' ? photoUrl.trim() : undefined,
      description: description && typeof description === 'string' ? description.trim() : '',
      price: parsedPrice,
      priceType: priceType === 'consult' || parsedPrice === null ? 'consult' : 'fixed',
      durationMinutes: parsedDuration,
      category: category && typeof category === 'string' && category.trim() ? category.trim() : 'Geral',
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const res = await saveServerService(newService)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao salvar serviço.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, service: res.service || newService }, { status: 201 })
  } catch (err) {
    const errText = err instanceof Error ? err.message : typeof err === 'object' ? JSON.stringify(err) : String(err)
    console.error('Error in POST /api/services:', errText)
    return NextResponse.json(
      { success: false, error: errText || 'Erro interno ao criar serviço.' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      id,
      companyId,
      name,
      photoUrl,
      description,
      price,
      priceType,
      durationMinutes,
      category,
      isActive,
      toggleStatus,
    } = body || {}

    if (!id || !companyId) {
      return NextResponse.json(
        { success: false, error: 'id e companyId são obrigatórios.' },
        { status: 400 }
      )
    }

    // Toggle status fast path
    if (toggleStatus) {
      const res = await toggleServerServiceStatus(id, companyId)
      if (!res.success) {
        return NextResponse.json(
          { success: false, error: res.error || 'Erro ao alterar status do serviço.' },
          { status: 403 }
        )
      }
      return NextResponse.json({ success: true }, { status: 200 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome do serviço é obrigatório.' },
        { status: 400 }
      )
    }

    // Verify existing service belongs to company
    const existing = await getServerServiceById(companyId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Serviço não encontrado ou você não tem permissão para alterá-lo.' },
        { status: 404 }
      )
    }

    let parsedPrice: number | null = null
    if (typeof price === 'number' && !isNaN(price)) {
      parsedPrice = price
    } else if (typeof price === 'string' && price.trim() !== '') {
      const num = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'))
      if (!isNaN(num)) parsedPrice = num
    }

    let parsedDuration: number | null = null
    if (typeof durationMinutes === 'number' && !isNaN(durationMinutes)) {
      parsedDuration = durationMinutes
    } else if (typeof durationMinutes === 'string' && durationMinutes.trim() !== '') {
      const num = parseInt(durationMinutes, 10)
      if (!isNaN(num)) parsedDuration = num
    }

    const updatedService: CompanyService = {
      ...existing,
      name: name.trim(),
      photoUrl: photoUrl !== undefined ? (typeof photoUrl === 'string' ? photoUrl.trim() : '') : existing.photoUrl,
      description: description !== undefined ? (typeof description === 'string' ? description.trim() : '') : existing.description,
      price: parsedPrice,
      priceType: priceType === 'consult' || parsedPrice === null ? 'consult' : 'fixed',
      durationMinutes: parsedDuration,
      category: category && typeof category === 'string' && category.trim() ? category.trim() : existing.category || 'Geral',
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      updatedAt: new Date().toISOString(),
    }

    const res = await saveServerService(updatedService)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao atualizar serviço.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, service: res.service || updatedService }, { status: 200 })
  } catch (err) {
    console.error('Error in PUT /api/services:', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao atualizar serviço.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const serviceId = searchParams.get('id')
    const companyId = searchParams.get('companyId')

    if (!serviceId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'id e companyId são obrigatórios.' },
        { status: 400 }
      )
    }

    const res = await deleteServerService(serviceId, companyId)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao excluir serviço.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, message: 'Serviço excluído com sucesso.' }, { status: 200 })
  } catch (err) {
    console.error('Error in DELETE /api/services:', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao excluir serviço.' },
      { status: 500 }
    )
  }
}
