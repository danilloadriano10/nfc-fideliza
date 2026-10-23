import { NextRequest, NextResponse } from 'next/server'
import {
  getServerMenuItems,
  getServerMenuItemById,
  saveServerMenuItem,
  deleteServerMenuItem,
  toggleServerMenuItemStatus,
  getServerCompanyById,
  getServerCompanyBySlug,
  saveServerCompany,
  saveServerMenuItemsOrder,
} from '@/lib/server-storage'
import { MenuItem } from '@/types/platform'
import { uploadCompanyFileServer, isBase64Image } from '@/lib/storage-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const companyIdOrSlug = searchParams.get('companyId') || searchParams.get('slug')
    const itemId = searchParams.get('id')

    if (!companyIdOrSlug) {
      return NextResponse.json(
        { success: false, error: 'companyId ou slug é obrigatório.' },
        { status: 400 }
      )
    }

    // Resolve company ID
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

    if (itemId) {
      const item = await getServerMenuItemById(realCompany.id, itemId)
      if (!item) {
        return NextResponse.json(
          { success: false, error: 'Item do cardápio não encontrado.' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, menuItem: item }, { status: 200 })
    }

    const menuItems = await getServerMenuItems(realCompany.id)
    return NextResponse.json(
      {
        success: true,
        menuItems,
        menuMode: realCompany.menuMode || (realCompany.menuUrl ? 'external' : 'internal'),
        menuUrl: realCompany.menuUrl || '',
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error in GET /api/menu:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao buscar cardápio.' },
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
      category,
      price,
      priceType,
      promotionalPrice,
      description,
      isAvailable,
      isFeatured,
      order,
      sizes,
      flavorsMax,
      flavors,
      extras,
      removableIngredients,
      allowNotes,
      isCustomBuilder,
      customSteps,
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
        { success: false, error: 'Nome do item do cardápio é obrigatório.' },
        { status: 400 }
      )
    }

    // Verify company exists
    const company = await getServerCompanyById(companyId)
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Empresa associada não encontrada.' },
        { status: 404 }
      )
    }

    // Auto-convert Base64 if sent directly
    let finalPhoto = photoUrl
    if (finalPhoto && isBase64Image(finalPhoto)) {
      try {
        const matches = finalPhoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (matches && matches[2]) {
          const mime = matches[1]
          const buf = Buffer.from(matches[2], 'base64')
          const up = await uploadCompanyFileServer(companyId, 'menu', buf, 'menu_item.jpg', mime)
          finalPhoto = up.url || undefined
        }
      } catch (uploadErr) {
        console.error('Falha ao processar imagem base64 de item do cardápio:', uploadErr)
      }
    }

    const newItem: MenuItem = {
      id: `mnu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId: company.id,
      name: name.trim(),
      photoUrl: finalPhoto || undefined,
      category: category?.trim() || 'Geral',
      description: description?.trim() || undefined,
      price: typeof price === 'number' && !isNaN(price) ? price : null,
      priceType: priceType || (price != null ? 'fixed' : 'consult'),
      promotionalPrice:
        typeof promotionalPrice === 'number' && !isNaN(promotionalPrice)
          ? promotionalPrice
          : null,
      isAvailable: isAvailable !== false,
      isFeatured: Boolean(isFeatured),
      order: typeof order === 'number' && !isNaN(order) ? order : 0,
      sizes: Array.isArray(sizes) ? sizes : [],
      flavorsMax: typeof flavorsMax === 'number' ? flavorsMax : 1,
      flavors: Array.isArray(flavors) ? flavors : [],
      extras: Array.isArray(extras) ? extras : [],
      removableIngredients: Array.isArray(removableIngredients) ? removableIngredients : [],
      allowNotes: allowNotes !== false,
      isCustomBuilder: Boolean(isCustomBuilder),
      customSteps: Array.isArray(customSteps) ? customSteps : [],
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const res = await saveServerMenuItem(newItem)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao salvar item do cardápio.' },
        { status: 500 }
      )
    }

    // Auto-enable menu module on company if not already configured
    let companyUpdated = false
    if (!company.modules?.menu) {
      company.modules = { ...(company.modules || {}), menu: true }
      companyUpdated = true
    }
    if (!company.menuMode) {
      company.menuMode = 'internal'
      companyUpdated = true
    }
    if (companyUpdated) {
      try {
        await saveServerCompany(company)
      } catch (err) {
        console.warn('Could not auto-enable menu module on company:', err)
      }
    }

    return NextResponse.json({ success: true, menuItem: res.menuItem }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/menu:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao cadastrar item do cardápio.',
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, companyId, toggleStatus, updateMenuConfig, menuMode, menuUrl } = body || {}

    // Special handler: updating company menu settings (mode: external/internal, menuUrl)
    if (updateMenuConfig && companyId) {
      const company = await getServerCompanyById(companyId)
      if (!company) {
        return NextResponse.json(
          { success: false, error: 'Empresa não encontrada.' },
          { status: 404 }
        )
      }
      if (menuMode) {
        company.menuMode = menuMode as 'external' | 'internal'
      }
      if (typeof menuUrl === 'string') {
        company.menuUrl = menuUrl.trim()
      }
      if (body.menuDisplayMode) {
        company.menuDisplayMode = body.menuDisplayMode
      }
      if (body.menuConfig) {
        company.menuConfig = { ...(company.menuConfig || {}), ...body.menuConfig }
      }
      company.modules = { ...(company.modules || {}), menu: true }
      await saveServerCompany(company)
      return NextResponse.json({ success: true, company }, { status: 200 })
    }

    if (!id || !companyId) {
      return NextResponse.json(
        { success: false, error: 'id e companyId são obrigatórios.' },
        { status: 400 }
      )
    }

    // Toggle availability
    if (toggleStatus) {
      const resToggle = await toggleServerMenuItemStatus(id, companyId)
      if (!resToggle.success) {
        return NextResponse.json(
          { success: false, error: resToggle.error || 'Erro ao alterar status.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: true, isAvailable: resToggle.isAvailable },
        { status: 200 }
      )
    }

    const existing = await getServerMenuItemById(companyId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Item do cardápio não encontrado.' },
        { status: 404 }
      )
    }

    let finalPhoto = body.photoUrl !== undefined ? body.photoUrl : existing.photoUrl
    if (finalPhoto && isBase64Image(finalPhoto)) {
      try {
        const matches = finalPhoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (matches && matches[2]) {
          const mime = matches[1]
          const buf = Buffer.from(matches[2], 'base64')
          const up = await uploadCompanyFileServer(companyId, 'menu', buf, 'menu_item.jpg', mime)
          finalPhoto = up.url || undefined
        }
      } catch (uploadErr) {
        console.error('Falha ao processar imagem base64:', uploadErr)
      }
    }

    const updatedItem: MenuItem = {
      ...existing,
      name: typeof body.name === 'string' ? body.name.trim() : existing.name,
      photoUrl: finalPhoto || undefined,
      category: typeof body.category === 'string' ? body.category.trim() : existing.category,
      description:
        typeof body.description === 'string' ? body.description.trim() : existing.description,
      price: typeof body.price === 'number' && !isNaN(body.price) ? body.price : existing.price,
      priceType: body.priceType || existing.priceType,
      promotionalPrice:
        typeof body.promotionalPrice === 'number' && !isNaN(body.promotionalPrice)
          ? body.promotionalPrice
          : body.promotionalPrice === null
            ? null
            : existing.promotionalPrice,
      isAvailable: typeof body.isAvailable === 'boolean' ? body.isAvailable : existing.isAvailable,
      isFeatured: typeof body.isFeatured === 'boolean' ? body.isFeatured : existing.isFeatured,
      order: typeof body.order === 'number' ? body.order : existing.order,
      sizes: Array.isArray(body.sizes) ? body.sizes : existing.sizes,
      flavorsMax: typeof body.flavorsMax === 'number' ? body.flavorsMax : existing.flavorsMax,
      flavors: Array.isArray(body.flavors) ? body.flavors : existing.flavors,
      extras: Array.isArray(body.extras) ? body.extras : existing.extras,
      removableIngredients: Array.isArray(body.removableIngredients)
        ? body.removableIngredients
        : existing.removableIngredients,
      allowNotes: typeof body.allowNotes === 'boolean' ? body.allowNotes : existing.allowNotes,
      isCustomBuilder:
        typeof body.isCustomBuilder === 'boolean'
          ? body.isCustomBuilder
          : existing.isCustomBuilder,
      customSteps: Array.isArray(body.customSteps) ? body.customSteps : existing.customSteps,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : existing.isActive,
      updatedAt: new Date().toISOString(),
    }

    const res = await saveServerMenuItem(updatedItem)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao atualizar item do cardápio.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, menuItem: res.menuItem }, { status: 200 })
  } catch (err) {
    console.error('Error in PUT /api/menu:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao atualizar item do cardápio.',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, companyId, reorder } = body || {}

    // Batch reorder path
    if (reorder && Array.isArray(reorder) && companyId) {
      const ok = await saveServerMenuItemsOrder(companyId, reorder)
      return NextResponse.json({ success: ok }, { status: ok ? 200 : 500 })
    }

    if (!id || !companyId) {
      return NextResponse.json(
        { success: false, error: 'id e companyId são obrigatórios.' },
        { status: 400 }
      )
    }

    const res = await toggleServerMenuItemStatus(id, companyId)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao alternar disponibilidade.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, isAvailable: res.isAvailable }, { status: 200 })
  } catch (err) {
    console.error('Error in PATCH /api/menu:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao atualizar.' },
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

    const res = await deleteServerMenuItem(id, companyId)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao excluir item do cardápio.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('Error in DELETE /api/menu:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao excluir item do cardápio.',
      },
      { status: 500 }
    )
  }
}
