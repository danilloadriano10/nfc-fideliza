import { NextRequest, NextResponse } from 'next/server'
import {
  getServerProducts,
  getServerProductById,
  saveServerProduct,
  deleteServerProduct,
  toggleServerProductStatus,
  getServerCompanyById,
  getServerCompanyBySlug,
  saveServerCompany,
  saveServerProductsOrder,
} from '@/lib/server-storage'
import { CompanyProduct } from '@/types/platform'
import { uploadCompanyFileServer, isBase64Image } from '@/lib/storage-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const companyIdOrSlug = searchParams.get('companyId') || searchParams.get('slug')
    const productId = searchParams.get('id')

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

    if (productId) {
      const product = await getServerProductById(realCompanyId, productId)
      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Produto não encontrado.' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, product }, { status: 200 })
    }

    const products = await getServerProducts(realCompanyId)
    return NextResponse.json({ success: true, products }, { status: 200 })
  } catch (err) {
    console.error('Error in GET /api/products:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao buscar produtos.' },
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
      purchaseUrl,
      order,
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
        { success: false, error: 'Nome do produto é obrigatório.' },
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

    // Auto-convert Base64 if sent directly
    let finalPhoto = photoUrl
    if (finalPhoto && isBase64Image(finalPhoto)) {
      try {
        const matches = finalPhoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (matches && matches[2]) {
          const mime = matches[1]
          const buf = Buffer.from(matches[2], 'base64')
          const up = await uploadCompanyFileServer(companyId, 'product', buf, 'product.jpg', mime)
          finalPhoto = up.url || undefined
        }
      } catch (uploadErr) {
        console.error('Falha ao processar imagem base64 de produto:', uploadErr)
      }
    }

    const newProduct: CompanyProduct = {
      id: `prd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId: company.id,
      name: name.trim(),
      photoUrl: finalPhoto || undefined,
      photos: Array.isArray(body.photos) ? body.photos : (finalPhoto ? [finalPhoto] : []),
      category: category?.trim() || 'Geral',
      description: description?.trim() || undefined,
      price: typeof price === 'number' && !isNaN(price) ? price : null,
      priceType: priceType || (price != null ? 'fixed' : 'consult'),
      promotionalPrice: typeof promotionalPrice === 'number' && !isNaN(promotionalPrice) ? promotionalPrice : null,
      variations: Array.isArray(body.variations) ? body.variations : [],
      isAvailable: isAvailable !== false,
      purchaseUrl: purchaseUrl?.trim() || undefined,
      order: typeof order === 'number' && !isNaN(order) ? order : 0,
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const res = await saveServerProduct(newProduct)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao salvar produto.' },
        { status: 500 }
      )
    }

    // Auto-enable products module on company if not explicitly disabled
    if (company.modules?.products !== true && company.modules?.products !== false) {
      try {
        company.modules = { ...(company.modules || {}), products: true }
        await saveServerCompany(company)
      } catch (modErr) {
        console.warn('Could not auto-enable products module on company:', modErr)
      }
    }

    return NextResponse.json({ success: true, product: res.product }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/products:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao cadastrar produto.' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, companyId, toggleStatus, reorder } = body || {}

    // Batch reorder path
    if (reorder && Array.isArray(reorder) && companyId) {
      const ok = await saveServerProductsOrder(companyId, reorder)
      return NextResponse.json({ success: ok }, { status: ok ? 200 : 500 })
    }

    if (!id || !companyId) {
      return NextResponse.json(
        { success: false, error: 'id e companyId são obrigatórios.' },
        { status: 400 }
      )
    }

    // Toggle active status shortcut
    if (toggleStatus) {
      const toggleRes = await toggleServerProductStatus(id, companyId)
      if (!toggleRes.success) {
        return NextResponse.json(
          { success: false, error: toggleRes.error || 'Erro ao alterar status do produto.' },
          { status: 400 }
        )
      }
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Full update
    const existing = await getServerProductById(companyId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado ou não pertence a esta empresa.' },
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
          const up = await uploadCompanyFileServer(companyId, 'product', buf, 'product.jpg', mime)
          finalPhoto = up.url || undefined
        }
      } catch (uploadErr) {
        console.error('Falha ao processar imagem base64 na atualização de produto:', uploadErr)
      }
    }

    const updatedProduct: CompanyProduct = {
      ...existing,
      name: body.name !== undefined ? body.name.trim() : existing.name,
      photoUrl: finalPhoto,
      photos: body.photos !== undefined ? (Array.isArray(body.photos) ? body.photos : []) : existing.photos,
      category: body.category !== undefined ? body.category.trim() : existing.category,
      description: body.description !== undefined ? body.description.trim() : existing.description,
      price: body.price !== undefined ? (typeof body.price === 'number' && !isNaN(body.price) ? body.price : null) : existing.price,
      priceType: body.priceType !== undefined ? body.priceType : existing.priceType,
      promotionalPrice: body.promotionalPrice !== undefined ? (typeof body.promotionalPrice === 'number' && !isNaN(body.promotionalPrice) ? body.promotionalPrice : null) : existing.promotionalPrice,
      variations: body.variations !== undefined ? (Array.isArray(body.variations) ? body.variations : []) : existing.variations,
      isAvailable: body.isAvailable !== undefined ? body.isAvailable : existing.isAvailable,
      purchaseUrl: body.purchaseUrl !== undefined ? body.purchaseUrl.trim() : existing.purchaseUrl,
      order: body.order !== undefined && typeof body.order === 'number' ? body.order : existing.order,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      updatedAt: new Date().toISOString(),
    }

    const res = await saveServerProduct(updatedProduct)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao atualizar produto.' },
        { status: 500 }
      )
    }

    try {
      const company = await getServerCompanyById(companyId)
      if (company && company.modules?.products !== true && company.modules?.products !== false) {
        company.modules = { ...(company.modules || {}), products: true }
        await saveServerCompany(company)
      }
    } catch {
      // non-fatal
    }

    return NextResponse.json({ success: true, product: res.product }, { status: 200 })
  } catch (err) {
    console.error('Error in PUT /api/products:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao atualizar produto.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const productId = searchParams.get('id')
    const companyId = searchParams.get('companyId')

    if (!productId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'id e companyId são obrigatórios.' },
        { status: 400 }
      )
    }

    const res = await deleteServerProduct(productId, companyId)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao remover produto.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('Error in DELETE /api/products:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao deletar produto.' },
      { status: 500 }
    )
  }
}
