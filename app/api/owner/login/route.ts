import { NextRequest, NextResponse } from 'next/server'
import { getServerCompanyById, getServerCompanyBySlug, getServerCompanies } from '@/lib/server-storage'
import { verifyPassword } from '@/lib/auth-crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, slug, username, password } = body || {}

    const cleanUser = String(username || '').trim().toLowerCase()
    const cleanPass = String(password || '').trim()

    if (!cleanUser || !cleanPass) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe seu usuário e senha.' },
        { status: 400 }
      )
    }

    let targetCompany = null

    if (companyId) {
      targetCompany = await getServerCompanyById(companyId)
    } else if (slug) {
      targetCompany = await getServerCompanyBySlug(slug)
    } else {
      // General portal: match by username
      const all = await getServerCompanies()
      targetCompany =
        all.find((c) => (c.ownerAuth?.username || c.slug).toLowerCase() === cleanUser) || null
    }

    if (!targetCompany) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não encontrado.' },
        { status: 404 }
      )
    }

    const expectedUser = (targetCompany.ownerAuth?.username || targetCompany.slug).toLowerCase()
    const storedCredential = targetCompany.ownerAuth?.password || ''

    if (cleanUser !== expectedUser || !verifyPassword(cleanPass, storedCredential)) {
      return NextResponse.json(
        { success: false, error: 'Usuário ou senha incorretos para este estabelecimento.' },
        { status: 401 }
      )
    }

    // Return sanitized company without password
    const safeCompany = {
      ...targetCompany,
      ownerAuth: {
        username: targetCompany.ownerAuth?.username || targetCompany.slug,
      },
    }

    return NextResponse.json({
      success: true,
      company: safeCompany,
      token: Buffer.from(`${targetCompany.id}:${Date.now()}`).toString('base64'),
    })
  } catch (err) {
    console.error('Error in POST /api/owner/login:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao validar credenciais no servidor.' },
      { status: 500 }
    )
  }
}
