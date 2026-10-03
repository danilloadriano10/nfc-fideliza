import { NextRequest, NextResponse } from 'next/server'

// Server-side admin credentials validation
const EXPECTED_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'danilloadriano10@gmail.com').toLowerCase().trim()
const EXPECTED_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '550210t@'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    const cleanEmail = (typeof email === 'string' ? email : '').toLowerCase().trim()
    const cleanPassword = typeof password === 'string' ? password.trim() : ''

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: 'Por favor, preencha o e-mail e a senha do administrador.' },
        { status: 400 }
      )
    }

    if (cleanEmail === EXPECTED_ADMIN_EMAIL && cleanPassword === EXPECTED_ADMIN_PASSWORD) {
      // Secure token or success flag
      const sessionToken = Buffer.from(`${cleanEmail}:${Date.now()}`).toString('base64')
      return NextResponse.json({
        success: true,
        token: sessionToken,
        message: 'Autenticado com sucesso.',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Credenciais inválidas. Verifique seu e-mail e senha de administrador.' },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: 'Falha ao processar solicitação de login.' },
      { status: 500 }
    )
  }
}
