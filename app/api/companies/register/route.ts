import { NextRequest, NextResponse } from 'next/server'
import {
  saveServerCompany,
  getServerCompanyBySlug,
  getServerCompanies,
} from '@/lib/server-storage'
import { Company } from '@/types/platform'
import { slugify, normalizePhone } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      ownerName,
      ownerPhone,
      ownerEmail,
      companyName,
      category,
      password,
    } = body || {}

    // 1. Validations
    if (!ownerName || !String(ownerName).trim()) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe seu nome completo.' },
        { status: 400 }
      )
    }

    if (!ownerPhone || !String(ownerPhone).trim()) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe seu WhatsApp com DDD.' },
        { status: 400 }
      )
    }

    if (!ownerEmail || !String(ownerEmail).trim()) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe seu e-mail de acesso.' },
        { status: 400 }
      )
    }

    const cleanEmail = String(ownerEmail).trim().toLowerCase()
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe um endereço de e-mail válido.' },
        { status: 400 }
      )
    }

    if (!companyName || !String(companyName).trim()) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe o nome do seu estabelecimento.' },
        { status: 400 }
      )
    }

    if (!password || String(password).trim().length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha de acesso deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      )
    }

    // 2. Slug Generation with Collision Avoidance
    let baseSlug = slugify(companyName.trim())
    if (!baseSlug) {
      baseSlug = `empresa-${Date.now().toString().slice(-4)}`
    }

    let finalSlug = baseSlug
    let counter = 1
    const allCompanies = await getServerCompanies()

    while (allCompanies.some((c) => c.slug.toLowerCase() === finalSlug.toLowerCase())) {
      counter += 1
      finalSlug = `${baseSlug}-${counter}`
    }

    // 3. Construct New Company Record
    const companyId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const cleanPhone = normalizePhone(String(ownerPhone)) || String(ownerPhone).replace(/\D/g, '')

    const newCompany: Company = {
      id: companyId,
      name: String(companyName).trim(),
      slug: finalSlug,
      category: category ? String(category).trim() : 'Outro Estabelecimento',
      tagline: 'Aproxime e conecte-se com nossa empresa!',
      logoUrl: '',
      coverUrl: '/images/cafe_central_banner_1791003956057.jpg',
      primaryColor: '#6D28D9',
      secondaryColor: '#18181B',
      whatsapp: cleanPhone,
      instagram: '',
      googleReviewUrl: '',
      menuUrl: '',
      wifi: {
        ssid: '',
        password: '',
        security: 'WPA/WPA2',
      },
      locationUrl: '',
      addressText: '',
      isActive: true,
      modules: {
        loyalty: true,
        googleReview: true,
        menu: false,
        wifi: true,
        whatsapp: true,
        location: false,
        feedback: true,
        instagram: false,
      },
      loyaltyProgram: {
        isActive: true,
        campaignName: 'Cartão Fidelidade VIP',
        goalPoints: 10,
        rewardDescription: '1 Cortesia Especial',
      },
      ownerAuth: {
        username: cleanEmail,
        password: String(password).trim(),
        ownerName: String(ownerName).trim(),
        ownerEmail: cleanEmail,
        ownerPhone: cleanPhone,
      },
      origin: 'self_service',
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const saveRes = await saveServerCompany(newCompany)
    if (!saveRes.success) {
      return NextResponse.json(
        { success: false, error: saveRes.error || 'Erro ao gravar novo estabelecimento.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      company: newCompany,
    })
  } catch (err) {
    console.error('Error in POST /api/companies/register:', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar autocadastro da empresa.' },
      { status: 500 }
    )
  }
}
