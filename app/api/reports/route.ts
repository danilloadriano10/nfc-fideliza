import { NextRequest, NextResponse } from 'next/server'
import { getServerDailyAnalytics, getServerCompanyById } from '@/lib/server-storage'
import { isCompanyPro } from '@/types/platform'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const prevStartDate = searchParams.get('prevStartDate')
    const prevEndDate = searchParams.get('prevEndDate')

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro companyId obrigatório' },
        { status: 400 }
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'startDate e endDate são obrigatórios (formato YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    // Verify company exists
    const company = await getServerCompanyById(companyId)
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Reports are PRO exclusive
    const isPro = isCompanyPro(company)
    if (!isPro) {
      return NextResponse.json(
        {
          success: false,
          isPro: false,
          error: 'Módulo de Relatórios disponível exclusivamente no plano PRO.',
        },
        { status: 403 }
      )
    }

    // Query analytics for current period and comparison period in parallel
    const [currentAnalytics, previousAnalytics] = await Promise.all([
      getServerDailyAnalytics(company.id, startDate, endDate),
      prevStartDate && prevEndDate
        ? getServerDailyAnalytics(company.id, prevStartDate, prevEndDate)
        : Promise.resolve([]),
    ])

    return NextResponse.json({
      success: true,
      companyId: company.id,
      startDate,
      endDate,
      currentAnalytics,
      previousAnalytics,
    })
  } catch (err) {
    console.error('Erro na rota /api/reports:', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao consultar relatórios' },
      { status: 500 }
    )
  }
}
