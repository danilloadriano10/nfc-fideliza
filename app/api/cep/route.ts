import { NextRequest, NextResponse } from 'next/server'

interface ViaCepResponse {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean | string
}

interface BrasilApiCepResponse {
  cep?: string
  state?: string
  city?: string
  neighborhood?: string
  street?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawCep = searchParams.get('cep') || ''
  const cleanCep = rawCep.replace(/\D/g, '')

  if (cleanCep.length !== 8) {
    return NextResponse.json(
      {
        success: false,
        found: false,
        message: 'CEP inválido. O CEP deve conter 8 dígitos numéricos.',
      },
      { status: 400 }
    )
  }

  // 1. Tentar ViaCEP primeiro com timeout de 3.5 segundos
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 86400 }, // Cache de 24h
    })
    clearTimeout(timeoutId)

    if (viaCepRes.ok) {
      const data: ViaCepResponse = await viaCepRes.json()

      if (data.erro === true || data.erro === 'true') {
        return NextResponse.json({
          success: true,
          found: false,
          message: 'CEP não encontrado.',
        })
      }

      const formattedCep = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`

      return NextResponse.json(
        {
          success: true,
          found: true,
          postalCode: formattedCep,
          street: (data.logradouro || '').trim(),
          neighborhood: (data.bairro || '').trim(),
          city: (data.localidade || '').trim(),
          state: (data.uf || '').trim().toUpperCase(),
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
        }
      )
    }
  } catch (err) {
    // ViaCEP falhou ou deu timeout, tenta fallback BrasilAPI
    console.warn('ViaCEP lookup failed, trying BrasilAPI fallback...', err)
  }

  // 2. Fallback: BrasilAPI com timeout de 3.5 segundos
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    const brasilApiRes = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 86400 },
    })
    clearTimeout(timeoutId)

    if (brasilApiRes.ok) {
      const data: BrasilApiCepResponse = await brasilApiRes.json()
      const formattedCep = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`

      return NextResponse.json(
        {
          success: true,
          found: true,
          postalCode: formattedCep,
          street: (data.street || '').trim(),
          neighborhood: (data.neighborhood || '').trim(),
          city: (data.city || '').trim(),
          state: (data.state || '').trim().toUpperCase(),
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        }
      )
    }

    if (brasilApiRes.status === 404) {
      return NextResponse.json({
        success: true,
        found: false,
        message: 'CEP não encontrado.',
      })
    }
  } catch (err) {
    console.warn('BrasilAPI fallback failed:', err)
  }

  // Se ambas falharem por conectividade ou timeout, não bloqueamos o cliente
  return NextResponse.json({
    success: false,
    found: false,
    message: 'Não foi possível consultar o CEP automaticamente. Você pode preencher o endereço manualmente.',
  })
}
