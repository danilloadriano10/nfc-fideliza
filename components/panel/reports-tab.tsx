'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  MessageCircle,
  Eye,
  Calendar,
  Clock,
  Users,
  Gift,
  Award,
  Scissors,
  Package,
  MapPin,
  Star,
  Instagram,
  Link2,
  ExternalLink,
  RefreshCw,
  Printer,
  ChevronDown,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Percent,
  Sparkles,
  BarChart2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react'
import {
  Company,
  Customer,
  ActivityLog,
  TableOrder,
  Appointment,
  DailyCompanyAnalytics,
  ReportPeriodKey,
  isCompanyPro,
} from '@/types/platform'
import {
  getCompanyTableOrders,
  fetchCompanyTableOrdersFromServer,
  getCompanyAppointments,
  fetchCompanyAppointmentsFromServer,
  getCompanyCustomers,
  fetchCompanyCustomersFromServer,
  getCompanyActivityLogs,
} from '@/lib/storage'

interface ReportsTabProps {
  company: Company
}

// Helpers de formatação
function formatCurrency(val?: number | null): string {
  if (val == null || isNaN(val)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val)
}

function formatPercent(val?: number | null): string {
  if (val == null || isNaN(val)) return '0%'
  const prefix = val > 0 ? '+' : ''
  return `${prefix}${val.toFixed(1).replace('.', ',')}%`
}

function formatDateISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function parseDateOnly(dateStr: string): Date {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
  }
  return new Date(dateStr)
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ company }) => {
  const [period, setPeriod] = useState<ReportPeriodKey>('30d')
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return formatDateISO(d)
  })
  const [customEnd, setCustomEnd] = useState<string>(() => formatDateISO(new Date()))

  // Dados reais
  const [orders, setOrders] = useState<TableOrder[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])

  // Analytics agregados diários da DiretoLink
  const [currentDailyAnalytics, setCurrentDailyAnalytics] = useState<DailyCompanyAnalytics[]>([])
  const [previousDailyAnalytics, setPreviousDailyAnalytics] = useState<DailyCompanyAnalytics[]>([])
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Cálculo das datas atuais e comparativas
  const { startDate, endDate, prevStartDate, prevEndDate, periodLabel } = useMemo(() => {
    const now = new Date()
    let s = new Date()
    let e = new Date()
    let ps = new Date()
    let pe = new Date()
    let label = ''

    if (period === 'today') {
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      ps = new Date(s)
      ps.setDate(ps.getDate() - 1)
      pe = new Date(e)
      pe.setDate(pe.getDate() - 1)
      label = 'Hoje vs Ontem'
    } else if (period === '7d') {
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0)
      e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      ps = new Date(s)
      ps.setDate(ps.getDate() - 7)
      pe = new Date(s)
      pe.setDate(pe.getDate() - 1)
      pe.setHours(23, 59, 59)
      label = 'Últimos 7 dias vs 7 dias anteriores'
    } else if (period === '30d') {
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0)
      e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      ps = new Date(s)
      ps.setDate(ps.getDate() - 30)
      pe = new Date(s)
      pe.setDate(pe.getDate() - 1)
      pe.setHours(23, 59, 59)
      label = 'Últimos 30 dias vs 30 dias anteriores'
    } else if (period === 'this_month') {
      s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      ps = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
      const prevEndDay = Math.min(now.getDate(), lastDayPrevMonth)
      pe = new Date(now.getFullYear(), now.getMonth() - 1, prevEndDay, 23, 59, 59)
      label = 'Este mês vs Mesmo período do mês anterior'
    } else if (period === 'last_month') {
      s = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
      e = new Date(now.getFullYear(), now.getMonth() - 1, lastDayOfLastMonth, 23, 59, 59)
      ps = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0)
      const lastDayOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 0).getDate()
      pe = new Date(now.getFullYear(), now.getMonth() - 2, lastDayOfTwoMonthsAgo, 23, 59, 59)
      label = 'Mês anterior vs Mês retrasado'
    } else {
      // custom
      const startParsed = parseDateOnly(customStart)
      startParsed.setHours(0, 0, 0, 0)
      const endParsed = parseDateOnly(customEnd)
      endParsed.setHours(23, 59, 59, 999)
      s = startParsed
      e = endParsed

      const diffDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)))
      pe = new Date(s)
      pe.setDate(pe.getDate() - 1)
      pe.setHours(23, 59, 59)
      ps = new Date(pe)
      ps.setDate(ps.getDate() - diffDays + 1)
      ps.setHours(0, 0, 0)
      label = `${s.toLocaleDateString('pt-BR')} até ${e.toLocaleDateString('pt-BR')}`
    }

    return {
      startDate: formatDateISO(s),
      endDate: formatDateISO(e),
      prevStartDate: formatDateISO(ps),
      prevEndDate: formatDateISO(pe),
      periodLabel: label,
    }
  }, [period, customStart, customEnd])

  // Carga dos dados locais e remotos
  const loadLocalAndServerData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Dados locais
      const localOrders = getCompanyTableOrders(company.id)
      const localAppts = getCompanyAppointments(company.id)
      const localCusts = getCompanyCustomers(company.id)
      const localLogs = getCompanyActivityLogs(company.id)

      setOrders(localOrders)
      setAppointments(localAppts)
      setCustomers(localCusts)
      setLogs(localLogs)

      // Sync servidor em background
      fetchCompanyTableOrdersFromServer(company.id).then((srvOrders) => {
        if (Array.isArray(srvOrders)) setOrders(srvOrders)
      }).catch(() => {})

      fetchCompanyAppointmentsFromServer(company.id).then((srvAppts) => {
        if (Array.isArray(srvAppts)) setAppointments(srvAppts)
      }).catch(() => {})

      fetchCompanyCustomersFromServer(company.id).then((srvCusts) => {
        if (Array.isArray(srvCusts)) setCustomers(srvCusts)
      }).catch(() => {})
    } finally {
      setIsRefreshing(false)
    }
  }, [company.id])

  // Carrega analytics da API para o período selecionado
  const loadAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true)
    try {
      const url = `/api/reports?companyId=${encodeURIComponent(company.id)}&startDate=${startDate}&endDate=${endDate}&prevStartDate=${prevStartDate}&prevEndDate=${prevEndDate}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setCurrentDailyAnalytics(data.currentPeriod?.daily || [])
          setPreviousDailyAnalytics(data.previousPeriod?.daily || [])
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar analytics agregados:', err)
    } finally {
      setIsLoadingAnalytics(false)
    }
  }, [company.id, startDate, endDate, prevStartDate, prevEndDate])

  useEffect(() => {
    loadLocalAndServerData()
  }, [loadLocalAndServerData])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  // ==========================================
  // FILTRAGEM DOS DADOS DE PEDIDOS NO PERÍODO
  // ==========================================
  const startTimestamp = useMemo(() => new Date(`${startDate}T00:00:00`).getTime(), [startDate])
  const endTimestamp = useMemo(() => new Date(`${endDate}T23:59:59.999`).getTime(), [endDate])
  const prevStartTimestamp = useMemo(() => new Date(`${prevStartDate}T00:00:00`).getTime(), [prevStartDate])
  const prevEndTimestamp = useMemo(() => new Date(`${prevEndDate}T23:59:59.999`).getTime(), [prevEndDate])

  // Pedidos no período atual
  const periodOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime()
      return orderTime >= startTimestamp && orderTime <= endTimestamp
    })
  }, [orders, startTimestamp, endTimestamp])

  // Pedidos no período anterior (para comparação)
  const prevPeriodOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime()
      return orderTime >= prevStartTimestamp && orderTime <= prevEndTimestamp
    })
  }, [orders, prevStartTimestamp, prevEndTimestamp])

  // Status de pedidos válidos para faturamento (regras de negócio do sistema)
  const isCompletedOrderStatus = (status: string) => {
    return ['finalizado', 'entregue', 'servido'].includes(status)
  }

  // Faturamento e métricas de pedidos no período atual
  const ordersCompleted = useMemo(
    () => periodOrders.filter((o) => isCompletedOrderStatus(o.status)),
    [periodOrders]
  )
  const ordersCanceled = useMemo(
    () => periodOrders.filter((o) => o.status === 'cancelado'),
    [periodOrders]
  )
  const ordersRevenue = useMemo(() => {
    return ordersCompleted.reduce((acc, o) => acc + (o.totalAmount || o.total || 0), 0)
  }, [ordersCompleted])

  const ordersAverageTicket = useMemo(() => {
    if (ordersCompleted.length === 0) return 0
    return ordersRevenue / ordersCompleted.length
  }, [ordersRevenue, ordersCompleted.length])

  // Pedidos no período anterior
  const prevOrdersCompleted = useMemo(
    () => prevPeriodOrders.filter((o) => isCompletedOrderStatus(o.status)),
    [prevPeriodOrders]
  )
  const prevOrdersRevenue = useMemo(() => {
    return prevOrdersCompleted.reduce((acc, o) => acc + (o.totalAmount || o.total || 0), 0)
  }, [prevOrdersCompleted])

  // ==========================================
  // FILTRAGEM DOS AGENDAMENTOS NO PERÍODO
  // ==========================================
  const periodAppointments = useMemo(() => {
    return appointments.filter((a) => {
      // Prioriza a data agendada do serviço (ex: "2026-11-04")
      const apptDateStr = a.date || (a.createdAt ? a.createdAt.split('T')[0] : '')
      return apptDateStr >= startDate && apptDateStr <= endDate
    })
  }, [appointments, startDate, endDate])

  const apptsCompleted = useMemo(
    () => periodAppointments.filter((a) => a.status === 'completed'),
    [periodAppointments]
  )
  const apptsConfirmed = useMemo(
    () => periodAppointments.filter((a) => a.status === 'confirmed'),
    [periodAppointments]
  )
  const apptsCancelled = useMemo(
    () => periodAppointments.filter((a) => a.status === 'cancelled'),
    [periodAppointments]
  )

  // Receita de agendamentos: apenas dos agendamentos finalizados (completed)
  const apptsCompletedRevenue = useMemo(() => {
    return apptsCompleted.reduce((acc, a) => acc + (a.servicePrice || 0), 0)
  }, [apptsCompleted])

  // Receita estimada total de agendamentos (confirmados + completed)
  const apptsTotalExpectedRevenue = useMemo(() => {
    return [...apptsCompleted, ...apptsConfirmed].reduce(
      (acc, a) => acc + (a.servicePrice || 0),
      0
    )
  }, [apptsCompleted, apptsConfirmed])

  const apptCancellationRate = useMemo(() => {
    if (periodAppointments.length === 0) return 0
    return (apptsCancelled.length / periodAppointments.length) * 100
  }, [periodAppointments.length, apptsCancelled.length])

  // ==========================================
  // FATURAMENTO REAL CONSOLIDADO
  // ==========================================
  // Faturamento = pedidos finalizados + agendamentos concluídos
  const totalRealRevenue = useMemo(() => {
    return ordersRevenue + apptsCompletedRevenue
  }, [ordersRevenue, apptsCompletedRevenue])

  // Período anterior consolidado
  const prevPeriodAppts = useMemo(() => {
    return appointments.filter((a) => {
      const apptDateStr = a.date || (a.createdAt ? a.createdAt.split('T')[0] : '')
      return apptDateStr >= prevStartDate && apptDateStr <= prevEndDate
    })
  }, [appointments, prevStartDate, prevEndDate])

  const prevApptsCompletedRevenue = useMemo(() => {
    return prevPeriodAppts
      .filter((a) => a.status === 'completed')
      .reduce((acc, a) => acc + (a.servicePrice || 0), 0)
  }, [prevPeriodAppts])

  const prevTotalRealRevenue = useMemo(() => {
    return prevOrdersRevenue + prevApptsCompletedRevenue
  }, [prevOrdersRevenue, prevApptsCompletedRevenue])

  // Comparação percentual de faturamento
  const revenueGrowthPercent = useMemo(() => {
    if (prevTotalRealRevenue <= 0) return null
    return ((totalRealRevenue - prevTotalRealRevenue) / prevTotalRealRevenue) * 100
  }, [totalRealRevenue, prevTotalRealRevenue])

  // Comparação de quantidade de pedidos
  const ordersGrowthPercent = useMemo(() => {
    if (prevPeriodOrders.length <= 0) return null
    return ((periodOrders.length - prevPeriodOrders.length) / prevPeriodOrders.length) * 100
  }, [periodOrders.length, prevPeriodOrders.length])

  // ==========================================
  // MÉTRICAS DE ANALYTICS (PAGE VIEWS, WHATSAPP, ETC.)
  // ==========================================
  const currentTotals = useMemo(() => {
    return currentDailyAnalytics.reduce(
      (acc, d) => {
        acc.pageViews += d.pageViews || 0
        acc.whatsappClicks += d.whatsappClicks || 0
        acc.mapClicks += d.mapClicks || 0
        acc.menuClicks += d.menuClicks || 0
        acc.schedulingClicks += d.schedulingClicks || 0
        acc.productClicks += d.productClicks || 0
        acc.serviceClicks += d.serviceClicks || 0
        acc.googleReviewClicks += d.googleReviewClicks || 0
        acc.instagramClicks += d.instagramClicks || 0
        acc.socialClicks += d.socialClicks || 0
        acc.customLinkClicks += d.customLinkClicks || 0
        acc.totalActions += d.totalActions || 0
        return acc
      },
      {
        pageViews: 0,
        whatsappClicks: 0,
        mapClicks: 0,
        menuClicks: 0,
        schedulingClicks: 0,
        productClicks: 0,
        serviceClicks: 0,
        googleReviewClicks: 0,
        instagramClicks: 0,
        socialClicks: 0,
        customLinkClicks: 0,
        totalActions: 0,
      }
    )
  }, [currentDailyAnalytics])

  const previousTotals = useMemo(() => {
    return previousDailyAnalytics.reduce(
      (acc, d) => {
        acc.pageViews += d.pageViews || 0
        acc.whatsappClicks += d.whatsappClicks || 0
        acc.mapClicks += d.mapClicks || 0
        acc.menuClicks += d.menuClicks || 0
        acc.schedulingClicks += d.schedulingClicks || 0
        acc.productClicks += d.productClicks || 0
        acc.serviceClicks += d.serviceClicks || 0
        acc.googleReviewClicks += d.googleReviewClicks || 0
        acc.instagramClicks += d.instagramClicks || 0
        acc.socialClicks += d.socialClicks || 0
        acc.customLinkClicks += d.customLinkClicks || 0
        acc.totalActions += d.totalActions || 0
        return acc
      },
      {
        pageViews: 0,
        whatsappClicks: 0,
        mapClicks: 0,
        menuClicks: 0,
        schedulingClicks: 0,
        productClicks: 0,
        serviceClicks: 0,
        googleReviewClicks: 0,
        instagramClicks: 0,
        socialClicks: 0,
        customLinkClicks: 0,
        totalActions: 0,
      }
    )
  }, [previousDailyAnalytics])

  // Ações relevantes geradas (SEM contar visualizações como conversão)
  const totalGeneratedActions = useMemo(() => {
    return (
      currentTotals.whatsappClicks +
      currentTotals.mapClicks +
      currentTotals.menuClicks +
      currentTotals.schedulingClicks +
      currentTotals.productClicks +
      currentTotals.serviceClicks +
      currentTotals.googleReviewClicks +
      currentTotals.instagramClicks +
      currentTotals.socialClicks +
      currentTotals.customLinkClicks
    )
  }, [currentTotals])

  const whatsappGrowthPercent = useMemo(() => {
    if (previousTotals.whatsappClicks <= 0) return null
    return (
      ((currentTotals.whatsappClicks - previousTotals.whatsappClicks) /
        previousTotals.whatsappClicks) *
      100
    )
  }, [currentTotals.whatsappClicks, previousTotals.whatsappClicks])

  const pageViewsGrowthPercent = useMemo(() => {
    if (previousTotals.pageViews <= 0) return null
    return (
      ((currentTotals.pageViews - previousTotals.pageViews) / previousTotals.pageViews) * 100
    )
  }, [currentTotals.pageViews, previousTotals.pageViews])

  // ==========================================
  // FUNIL DA DIRETOLINK
  // 1. Visualizações da Página
  // 2. Interações (Menu, Produtos, Serviços, Mapa, Instagram, Redes, Links)
  // 3. Ações de Intenção (WhatsApp, Agendamento)
  // ==========================================
  const funnelInteractions = useMemo(() => {
    return (
      currentTotals.menuClicks +
      currentTotals.productClicks +
      currentTotals.serviceClicks +
      currentTotals.mapClicks +
      currentTotals.instagramClicks +
      currentTotals.socialClicks +
      currentTotals.customLinkClicks +
      currentTotals.googleReviewClicks
    )
  }, [currentTotals])

  const funnelIntentions = useMemo(() => {
    return currentTotals.whatsappClicks + currentTotals.schedulingClicks + periodOrders.length
  }, [currentTotals.whatsappClicks, currentTotals.schedulingClicks, periodOrders.length])

  // ==========================================
  // TOP PRODUTOS E ITENS VENDIDOS
  // ==========================================
  const topSoldItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; count: number; revenue: number }>()

    ordersCompleted.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const key = item.name.trim()
          const existing = itemMap.get(key) || { name: key, count: 0, revenue: 0 }
          const qty = item.quantity || 1
          const price = item.totalPrice || item.unitPrice * qty || 0
          existing.count += qty
          existing.revenue += price
          itemMap.set(key, existing)
        })
      }
    })

    return Array.from(itemMap.values()).sort((a, b) => b.count - a.count)
  }, [ordersCompleted])

  const topRevenueItems = useMemo(() => {
    return [...topSoldItems].sort((a, b) => b.revenue - a.revenue)
  }, [topSoldItems])

  // Top Serviços agendados
  const topBookedServices = useMemo(() => {
    const srvMap = new Map<string, { name: string; count: number; revenue: number }>()

    periodAppointments.forEach((a) => {
      const key = a.serviceName.trim()
      const existing = srvMap.get(key) || { name: key, count: 0, revenue: 0 }
      existing.count += 1
      if (a.status === 'completed' || a.status === 'confirmed') {
        existing.revenue += a.servicePrice || 0
      }
      srvMap.set(key, existing)
    })

    return Array.from(srvMap.values()).sort((a, b) => b.count - a.count)
  }, [periodAppointments])

  // Formas de pagamento dos pedidos
  const paymentMethodBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>()

    ordersCompleted.forEach((o) => {
      let rawMethod = (o.paymentMethod || 'não informado').toLowerCase().trim()
      let label = 'Outros'
      if (rawMethod.includes('pix')) label = 'Pix'
      else if (rawMethod.includes('dinheiro') || rawMethod === 'cash') label = 'Dinheiro'
      else if (rawMethod.includes('debito') || rawMethod.includes('débito')) label = 'Cartão de Débito'
      else if (rawMethod.includes('credito') || rawMethod.includes('crédito')) label = 'Cartão de Crédito'
      else if (rawMethod.includes('refeicao') || rawMethod.includes('refeição') || rawMethod.includes('vale')) label = 'Vale Refeição'

      const existing = map.get(label) || { count: 0, revenue: 0 }
      existing.count += 1
      existing.revenue += o.totalAmount || o.total || 0
      map.set(label, existing)
    })

    return Array.from(map.entries())
      .map(([label, val]) => ({ label, ...val }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [ordersCompleted])

  // Modalidade dos pedidos (Mesa, Retirada, Entrega)
  const orderTypeBreakdown = useMemo(() => {
    let mesa = 0
    let retirada = 0
    let entrega = 0

    periodOrders.forEach((o) => {
      const origin = o.orderType || o.origin || (o.tableNumber ? 'mesa' : 'entrega')
      if (origin === 'mesa') mesa += 1
      else if (origin === 'retirada') retirada += 1
      else entrega += 1
    })

    return {
      mesa,
      retirada,
      entrega,
      total: periodOrders.length,
    }
  }, [periodOrders])

  // Horários de maior movimento (00h às 23h)
  const hourlyPeakOrders = useMemo(() => {
    const hours = Array(24).fill(0)
    periodOrders.forEach((o) => {
      const h = new Date(o.createdAt).getHours()
      if (h >= 0 && h < 24) hours[h] += 1
    })
    return hours
  }, [periodOrders])

  // Dias com maior número de pedidos (Domingo = 0 a Sábado = 6)
  const dayOfWeekOrders = useMemo(() => {
    const days = [
      { name: 'Dom', count: 0, fullName: 'Domingo' },
      { name: 'Seg', count: 0, fullName: 'Segunda-feira' },
      { name: 'Ter', count: 0, fullName: 'Terça-feira' },
      { name: 'Qua', count: 0, fullName: 'Quarta-feira' },
      { name: 'Qui', count: 0, fullName: 'Quinta-feira' },
      { name: 'Sex', count: 0, fullName: 'Sexta-feira' },
      { name: 'Sáb', count: 0, fullName: 'Sábado' },
    ]
    periodOrders.forEach((o) => {
      const d = new Date(o.createdAt).getDay()
      if (d >= 0 && d < 7) days[d].count += 1
    })
    return days
  }, [periodOrders])

  // Clientes no período
  const customersMetrics = useMemo(() => {
    const newCustomers = customers.filter((c) => {
      const createdStr = c.createdAt ? c.createdAt.split('T')[0] : ''
      return createdStr >= startDate && createdStr <= endDate
    })

    const recurringCustomers = customers.filter((c) => c.totalVisits > 1)

    const periodLogs = logs.filter((l) => {
      const logDate = l.timestamp ? l.timestamp.split('T')[0] : ''
      return logDate >= startDate && logDate <= endDate
    })

    const pointsAdded = periodLogs
      .filter((l) => l.type === 'point_added')
      .reduce((acc, l) => acc + (l.pointsChange || 1), 0)

    const rewardsRedeemed = periodLogs.filter((l) => l.type === 'reward_redeemed').length

    return {
      total: customers.length,
      newCount: newCustomers.length,
      recurringCount: recurringCustomers.length,
      pointsAdded,
      rewardsRedeemed,
    }
  }, [customers, logs, startDate, endDate])

  // ==========================================
  // DESTAQUES DO PERÍODO (CALCULADOS OBJETIVAMENTE)
  // ==========================================
  const highlights = useMemo(() => {
    const list: Array<{ title: string; desc: string; icon: React.ReactNode; color: string }> = []

    // 1. Ação mais utilizada
    const actionsRanking = [
      { name: 'WhatsApp', count: currentTotals.whatsappClicks },
      { name: 'Visualização do Cardápio', count: currentTotals.menuClicks },
      { name: 'Localização / Como Chegar', count: currentTotals.mapClicks },
      { name: 'Agendamentos', count: currentTotals.schedulingClicks },
      { name: 'Vitrine de Produtos', count: currentTotals.productClicks },
      { name: 'Lista de Serviços', count: currentTotals.serviceClicks },
      { name: 'Instagram', count: currentTotals.instagramClicks },
      { name: 'Avaliações do Google', count: currentTotals.googleReviewClicks },
    ].sort((a, b) => b.count - a.count)

    if (actionsRanking[0] && actionsRanking[0].count > 0) {
      list.push({
        title: `${actionsRanking[0].name} liderou o engajamento`,
        desc: `${actionsRanking[0].name} foi a ação mais acionada pelos seus clientes com ${actionsRanking[0].count} interações no período.`,
        icon: <MessageCircle className="w-4 h-4 text-emerald-600" />,
        color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      })
    }

    // 2. Dia com maior volume de pedidos
    const bestDay = [...dayOfWeekOrders].sort((a, b) => b.count - a.count)[0]
    if (bestDay && bestDay.count > 0) {
      list.push({
        title: `${bestDay.fullName} teve o maior movimento`,
        desc: `Com um total de ${bestDay.count} pedidos realizados, foi o dia da semana de maior procura pelos clientes.`,
        icon: <ShoppingBag className="w-4 h-4 text-violet-600" />,
        color: 'bg-violet-50 border-violet-200 text-violet-900',
      })
    }

    // 3. Produto mais vendido
    if (topSoldItems[0] && topSoldItems[0].count > 0) {
      list.push({
        title: `Item campeão: ${topSoldItems[0].name}`,
        desc: `Foi o item mais vendido no período com ${topSoldItems[0].count} unidades e ${formatCurrency(topSoldItems[0].revenue)} em faturamento.`,
        icon: <Package className="w-4 h-4 text-blue-600" />,
        color: 'bg-blue-50 border-blue-200 text-blue-900',
      })
    }

    // 4. Crescimento de faturamento
    if (revenueGrowthPercent != null && Math.abs(revenueGrowthPercent) > 0.01) {
      const isPositive = revenueGrowthPercent > 0
      list.push({
        title: isPositive ? 'Faturamento em alta' : 'Variação de Faturamento',
        desc: `Seu faturamento ${isPositive ? 'aumentou' : 'variou'} ${formatPercent(revenueGrowthPercent)} em comparação ao período anterior.`,
        icon: isPositive ? (
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-rose-600" />
        ),
        color: isPositive
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900',
      })
    }

    // 5. Horário de pico
    let peakHour = -1
    let peakCount = 0
    hourlyPeakOrders.forEach((count, hour) => {
      if (count > peakCount) {
        peakCount = count
        peakHour = hour
      }
    })
    if (peakHour >= 0 && peakCount > 0) {
      const nextHour = (peakHour + 1) % 24
      const hStr = `${peakHour.toString().padStart(2, '0')}:00 às ${nextHour.toString().padStart(2, '0')}:00`
      list.push({
        title: `Horário de pico: ${hStr}`,
        desc: `Concentrou ${peakCount} pedidos no intervalo mais movimentado do seu negócio.`,
        icon: <Clock className="w-4 h-4 text-indigo-600" />,
        color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      })
    }

    return list
  }, [
    currentTotals,
    dayOfWeekOrders,
    topSoldItems,
    revenueGrowthPercent,
    hourlyPeakOrders,
  ])

  // Gráfico diário de visualizações vs ações
  const dailyChartData = useMemo(() => {
    // Monta mapa de datas
    const map = new Map<string, { date: string; views: number; actions: number; orders: number; revenue: number }>()

    currentDailyAnalytics.forEach((d) => {
      const existing = map.get(d.date) || { date: d.date, views: 0, actions: 0, orders: 0, revenue: 0 }
      existing.views += d.pageViews || 0
      existing.actions += d.totalActions || 0
      map.set(d.date, existing)
    })

    // Adiciona receita e pedidos por dia
    ordersCompleted.forEach((o) => {
      const d = o.createdAt ? o.createdAt.split('T')[0] : ''
      if (d) {
        const existing = map.get(d) || { date: d, views: 0, actions: 0, orders: 0, revenue: 0 }
        existing.orders += 1
        existing.revenue += o.totalAmount || o.total || 0
        map.set(d, existing)
      }
    })

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [currentDailyAnalytics, ordersCompleted])

  const maxRevenueInChart = useMemo(() => {
    const max = Math.max(...dailyChartData.map((d) => d.revenue), 0)
    return max > 0 ? max : 100
  }, [dailyChartData])

  const maxViewsInChart = useMemo(() => {
    const max = Math.max(...dailyChartData.map((d) => Math.max(d.views, d.actions)), 0)
    return max > 0 ? max : 10
  }, [dailyChartData])

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* ========================================================= */}
      {/* CABEÇALHO COM CONTROLES DE FILTRO E EXPORTAÇÃO            */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                Exclusivo PRO
              </span>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                Relatórios & Desempenho
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Acompanhe vendas reais, pedidos, agendamentos e o valor gerado pela sua DiretoLink.
            </p>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex items-center gap-2 self-start lg:self-auto print:hidden">
            <button
              type="button"
              onClick={() => {
                loadLocalAndServerData()
                loadAnalytics()
              }}
              disabled={isRefreshing || isLoadingAnalytics}
              className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Recarregar dados"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing || isLoadingAnalytics ? 'animate-spin text-violet-600' : ''
                }`}
              />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Imprimir relatório ou exportar em PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros de Período */}
        <div className="pt-2 border-t border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(
              [
                { id: 'today', label: 'Hoje' },
                { id: '7d', label: 'Últimos 7 dias' },
                { id: '30d', label: 'Últimos 30 dias' },
                { id: 'this_month', label: 'Este mês' },
                { id: 'last_month', label: 'Mês anterior' },
                { id: 'custom', label: 'Personalizado' },
              ] as Array<{ id: ReportPeriodKey; label: string }>
            ).map((f) => {
              const active = period === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPeriod(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-violet-600 text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <div className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1.5 bg-neutral-50 px-3 py-1 rounded-xl border border-neutral-200/60 self-start md:self-auto">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>{periodLabel}</span>
          </div>
        </div>

        {/* Inputs de período personalizado se selecionado */}
        {period === 'custom' && (
          <div className="p-3.5 rounded-2xl bg-violet-50/70 border border-violet-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-violet-950">De:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-violet-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-violet-950">Até:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-violet-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <span className="text-[11px] text-violet-700 font-medium">
              O relatório calculará automaticamente o período equivalente anterior para fins de comparação.
            </span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* RESUMO PRINCIPAL: 4 TOP CARDS                            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento */}
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Faturamento Confirmado
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 font-mono tracking-tight">
              {formatCurrency(totalRealRevenue)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {revenueGrowthPercent != null ? (
                <span
                  className={`font-bold flex items-center gap-0.5 ${
                    revenueGrowthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {revenueGrowthPercent >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {formatPercent(revenueGrowthPercent)}
                </span>
              ) : (
                <span className="text-neutral-400 font-medium">Sem dados para comparação</span>
              )}
              {revenueGrowthPercent != null && (
                <span className="text-neutral-400">vs período anterior</span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 border-t border-neutral-100 pt-2 leading-tight">
            Vendas reais finalizadas no sistema.
          </div>
        </div>

        {/* Card 2: Pedidos */}
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Pedidos Realizados
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 tracking-tight flex items-baseline gap-2">
              <span>{periodOrders.length}</span>
              <span className="text-xs text-neutral-500 font-normal">
                ({ordersCompleted.length} finalizados)
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {ordersGrowthPercent != null ? (
                <span
                  className={`font-bold flex items-center gap-0.5 ${
                    ordersGrowthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {ordersGrowthPercent >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {formatPercent(ordersGrowthPercent)}
                </span>
              ) : (
                <span className="text-neutral-400 font-medium">Sem dados para comparação</span>
              )}
              {ordersGrowthPercent != null && (
                <span className="text-neutral-400">vs anterior</span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-neutral-500 border-t border-neutral-100 pt-2 flex items-center justify-between">
            <span>Ticket Médio:</span>
            <strong className="text-neutral-900 font-mono">
              {formatCurrency(ordersAverageTicket)}
            </strong>
          </div>
        </div>

        {/* Card 3: WhatsApp */}
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Cliques no WhatsApp
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#25D366] flex items-center justify-center border border-emerald-100 shadow-2xs">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 tracking-tight">
              {currentTotals.whatsappClicks}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {whatsappGrowthPercent != null ? (
                <span
                  className={`font-bold flex items-center gap-0.5 ${
                    whatsappGrowthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {whatsappGrowthPercent >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {formatPercent(whatsappGrowthPercent)}
                </span>
              ) : (
                <span className="text-neutral-400 font-medium">Sem dados para comparação</span>
              )}
              {whatsappGrowthPercent != null && (
                <span className="text-neutral-400">vs anterior</span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 border-t border-neutral-100 pt-2 leading-tight">
            Contatos diretos iniciados pelos clientes.
          </div>
        </div>

        {/* Card 4: Visualizações */}
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Visualizações da Página
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 tracking-tight">
              {currentTotals.pageViews}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {pageViewsGrowthPercent != null ? (
                <span
                  className={`font-bold flex items-center gap-0.5 ${
                    pageViewsGrowthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {pageViewsGrowthPercent >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {formatPercent(pageViewsGrowthPercent)}
                </span>
              ) : (
                <span className="text-neutral-400 font-medium">Sem dados para comparação</span>
              )}
              {pageViewsGrowthPercent != null && (
                <span className="text-neutral-400">vs anterior</span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 border-t border-neutral-100 pt-2 leading-tight">
            Acessos reais na placa NFC / link oficial.
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESTAQUES DO PERÍODO (CALCULADOS BASEADOS EM DADOS REAIS)   */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Destaques do Período</h3>
            <p className="text-[11px] text-neutral-500">
              Análise objetiva baseada no comportamento e vendas do seu estabelecimento.
            </p>
          </div>
        </div>

        {highlights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {highlights.map((h, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${h.color}`}
              >
                <div className="p-2 rounded-xl bg-white shadow-2xs shrink-0 mt-0.5">
                  {h.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-snug">{h.title}</h4>
                  <p className="text-[11px] opacity-85 mt-1 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center text-xs text-neutral-500">
            Ainda não há dados suficientes para gerar os destaques automáticos deste período.
            Conforme os clientes visitarem e realizarem pedidos, os insights aparecerão aqui.
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* FATURAMENTO DETALHADO & FORMAS DE PAGAMENTO                */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Faturamento Diário */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-violet-600" />
                  <span>Faturamento por Dia</span>
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Valores diários de vendas confirmadas e serviços concluídos.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                {formatCurrency(totalRealRevenue)} total
              </span>
            </div>

            {/* SVG Bar Chart de Faturamento */}
            <div className="mt-6 h-48 w-full flex items-end gap-1 sm:gap-2 px-1">
              {dailyChartData.length > 0 ? (
                dailyChartData.map((d, idx) => {
                  const heightPercent =
                    maxRevenueInChart > 0 ? Math.max(8, (d.revenue / maxRevenueInChart) * 100) : 8
                  const formattedDay = d.date.split('-').slice(1).reverse().join('/')

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip hover */}
                      <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-neutral-900 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                        <span className="font-bold">{formattedDay}</span>
                        <span className="font-mono text-emerald-400">
                          {formatCurrency(d.revenue)}
                        </span>
                        <span className="text-[9px] text-neutral-400">
                          {d.orders} {d.orders === 1 ? 'pedido' : 'pedidos'}
                        </span>
                      </div>

                      <div
                        className="w-full max-w-[28px] rounded-t-lg transition-all duration-300 group-hover:opacity-85 shadow-2xs"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: d.revenue > 0 ? '#6D28D9' : '#E5E7EB',
                        }}
                      />
                      <span className="text-[9px] text-neutral-400 font-mono mt-1 truncate max-w-full">
                        {formattedDay}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                  Nenhuma venda registrada nos dias deste período.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span>
              Total de Vendas Concluídas:{' '}
              <strong className="text-neutral-900 font-bold">{ordersCompleted.length}</strong>
            </span>
            <span>
              Ticket Médio Geral:{' '}
              <strong className="text-neutral-900 font-mono font-bold">
                {formatCurrency(ordersAverageTicket)}
              </strong>
            </span>
          </div>
        </div>

        {/* Formas de Pagamento Mais Utilizadas */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Formas de Pagamento</h3>
            <p className="text-[11px] text-neutral-500">Distribuição do faturamento por método.</p>
          </div>

          {paymentMethodBreakdown.length > 0 ? (
            <div className="space-y-3">
              {paymentMethodBreakdown.map((pm, idx) => {
                const percent =
                  totalRealRevenue > 0 ? (pm.revenue / totalRealRevenue) * 100 : 0

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-neutral-700">{pm.label}</span>
                      <span className="font-mono text-neutral-900 font-bold">
                        {formatCurrency(pm.revenue)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-600 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{pm.count} pedidos</span>
                      <span>{percent.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-neutral-400">
              Nenhum método de pagamento registrado no período.
            </div>
          )}

          <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-[11px] text-neutral-600 space-y-1">
            <div className="font-bold text-neutral-800">Transparência dos Dados:</div>
            <p className="text-[10px] leading-relaxed">
              O DiretoLink calcula exclusivamente valores confirmados no sistema. Cliques no WhatsApp
              ou acessos externos não são computados como faturamento.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PRODUTOS E SERVIÇOS MAIS VENDIDOS / QUE MAIS FATURARAM     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Produtos */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-600" />
                <span>Itens & Produtos Mais Vendidos</span>
              </h3>
              <p className="text-[11px] text-neutral-500">Ranking por volume e faturamento.</p>
            </div>
            <span className="text-xs text-neutral-500 font-medium">
              {topSoldItems.length} itens distintos
            </span>
          </div>

          {topRevenueItems.length > 0 ? (
            <div className="space-y-2.5">
              {topRevenueItems.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition border border-neutral-200/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-white text-neutral-700 text-xs font-black flex items-center justify-center shrink-0 border border-neutral-200 shadow-2xs">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">{item.name}</h4>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {item.count} {item.count === 1 ? 'unidade' : 'unidades vendidas'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black font-mono text-neutral-900">
                      {formatCurrency(item.revenue)}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Faturamento gerado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-neutral-400">
              Nenhum item vendido registrado no período selecionado.
            </div>
          )}
        </div>

        {/* Top Serviços / Agendamentos */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <span>Serviços Mais Procurados</span>
              </h3>
              <p className="text-[11px] text-neutral-500">Agendamentos e receita gerada.</p>
            </div>
            <span className="text-xs text-neutral-500 font-medium">
              {topBookedServices.length} serviços
            </span>
          </div>

          {topBookedServices.length > 0 ? (
            <div className="space-y-2.5">
              {topBookedServices.slice(0, 6).map((srv, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition border border-neutral-200/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-white text-indigo-700 text-xs font-black flex items-center justify-center shrink-0 border border-neutral-200 shadow-2xs">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">{srv.name}</h4>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {srv.count} {srv.count === 1 ? 'agendamento' : 'agendamentos'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black font-mono text-neutral-900">
                      {formatCurrency(srv.revenue)}
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      Receita registrada
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-neutral-400">
              Nenhum agendamento de serviço registrado no período selecionado.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* CENTRAL DE PEDIDOS: ESTATÍSTICAS E HORÁRIOS DE PICO        */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-violet-600" />
              <span>Operação da Central de Pedidos</span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              Dados consolidados de mesas, retirada no balcão e delivery.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
              {ordersCompleted.length} Finalizados
            </span>
            <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-100">
              {ordersCanceled.length} Cancelados
            </span>
          </div>
        </div>

        {/* Modalidades de Entrega */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Consumo no Local (Mesa)
            </span>
            <div className="text-xl font-black text-neutral-900 font-mono">
              {orderTypeBreakdown.mesa}
            </div>
            <span className="text-[10px] text-neutral-400">
              {orderTypeBreakdown.total > 0
                ? ((orderTypeBreakdown.mesa / orderTypeBreakdown.total) * 100).toFixed(0)
                : 0}
              % do total
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Retirada no Balcão
            </span>
            <div className="text-xl font-black text-neutral-900 font-mono">
              {orderTypeBreakdown.retirada}
            </div>
            <span className="text-[10px] text-neutral-400">
              {orderTypeBreakdown.total > 0
                ? ((orderTypeBreakdown.retirada / orderTypeBreakdown.total) * 100).toFixed(0)
                : 0}
              % do total
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Entrega / Delivery
            </span>
            <div className="text-xl font-black text-neutral-900 font-mono">
              {orderTypeBreakdown.entrega}
            </div>
            <span className="text-[10px] text-neutral-400">
              {orderTypeBreakdown.total > 0
                ? ((orderTypeBreakdown.entrega / orderTypeBreakdown.total) * 100).toFixed(0)
                : 0}
              % do total
            </span>
          </div>
        </div>

        {/* Gráficos de Horários de Pico e Dias da Semana */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3 border-t border-neutral-100">
          {/* Horários de Pico (00h a 23h) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span>Horários de Maior Movimento (24h)</span>
              </h4>
              <span className="text-[10px] text-neutral-400">Volume por hora</span>
            </div>

            <div className="h-32 flex items-end gap-1 px-1 bg-neutral-50/60 p-2.5 rounded-2xl border border-neutral-100">
              {hourlyPeakOrders.map((count, hour) => {
                const max = Math.max(...hourlyPeakOrders, 1)
                const heightPercent = Math.max(6, (count / max) * 100)
                const isSelected = count === max && max > 0

                return (
                  <div
                    key={hour}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    <div className="absolute -top-8 z-10 hidden group-hover:flex bg-neutral-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap shadow">
                      {hour}:00 - {count} ped.
                    </div>
                    <div
                      className="w-full rounded-t-xs transition-all"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: isSelected ? '#6D28D9' : count > 0 ? '#A78BFA' : '#E5E7EB',
                      }}
                    />
                    {hour % 4 === 0 && (
                      <span className="text-[8px] text-neutral-400 font-mono mt-0.5">
                        {hour}h
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dias da Semana */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Dias com Maior Número de Pedidos</span>
              </h4>
              <span className="text-[10px] text-neutral-400">Distribuição semanal</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {dayOfWeekOrders.map((d, idx) => {
                const max = Math.max(...dayOfWeekOrders.map((x) => x.count), 1)
                const isPeak = d.count === max && max > 0

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border text-center flex flex-col justify-between h-24 ${
                      isPeak
                        ? 'bg-violet-50 border-violet-200 text-violet-950 font-bold'
                        : 'bg-neutral-50 border-neutral-200/60 text-neutral-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">{d.name}</span>
                    <div className="text-base font-black font-mono">{d.count}</div>
                    <span className="text-[9px] text-neutral-400 font-medium">
                      {d.count === 1 ? 'ped.' : 'ped.'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* AGENDAMENTOS: OPERAÇÃO E TAXAS DE CANCELAMENTO            */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Desempenho de Agendamentos</span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              Taxa de comparecimento e receita registrada em procedimentos.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-900 bg-neutral-100 px-3 py-1 rounded-xl">
            {periodAppointments.length} agendamentos no período
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Finalizados
            </span>
            <div className="text-xl font-black text-emerald-700 font-mono">
              {apptsCompleted.length}
            </div>
            <span className="text-[10px] text-neutral-400">Atendimentos concluídos</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
              Confirmados
            </span>
            <div className="text-xl font-black text-blue-700 font-mono">
              {apptsConfirmed.length}
            </div>
            <span className="text-[10px] text-neutral-400">Aguardando atendimento</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Cancelados
            </span>
            <div className="text-xl font-black text-rose-700 font-mono">
              {apptsCancelled.length}
            </div>
            <span className="text-[10px] text-neutral-400">
              Taxa: {apptCancellationRate.toFixed(1)}%
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Receita Concluída
            </span>
            <div className="text-xl font-black text-neutral-900 font-mono">
              {formatCurrency(apptsCompletedRevenue)}
            </div>
            <span className="text-[10px] text-neutral-400">
              Prevista: {formatCurrency(apptsTotalExpectedRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESEMPENHO DA SUA DIRETOLINK & AÇÕES GERADAS               */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-violet-600" />
              <span>Desempenho da sua DiretoLink</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Cliques e conversões gerados pela sua página pública e placa NFC.
            </p>
          </div>

          {/* Destaque: Ações geradas pela DiretoLink */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center gap-3.5 shadow-sm">
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
                Ações Geradas pela DiretoLink
              </span>
              <div className="text-2xl font-black tracking-tight">{totalGeneratedActions}</div>
            </div>
            <div className="text-[10px] opacity-80 max-w-[120px] leading-tight border-l border-white/20 pl-3">
              Total de interações diretas realizadas por visitantes.
            </div>
          </div>
        </div>

        {/* Grade com todas as ações monitoradas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>Visualizações</span>
            </div>
            <div className="text-lg font-black text-neutral-900">{currentTotals.pageViews}</div>
            <span className="text-[10px] text-neutral-400 block">Acessos na página</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>WhatsApp</span>
            </div>
            <div className="text-lg font-black text-neutral-900">
              {currentTotals.whatsappClicks}
            </div>
            <span className="text-[10px] text-neutral-400 block">Conversas iniciadas</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Localização</span>
            </div>
            <div className="text-lg font-black text-neutral-900">{currentTotals.mapClicks}</div>
            <span className="text-[10px] text-neutral-400 block">Como chegar</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              <span>Cardápio</span>
            </div>
            <div className="text-lg font-black text-neutral-900">{currentTotals.menuClicks}</div>
            <span className="text-[10px] text-neutral-400 block">Aberturas do cardápio</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Agendamento</span>
            </div>
            <div className="text-lg font-black text-neutral-900">
              {currentTotals.schedulingClicks}
            </div>
            <span className="text-[10px] text-neutral-400 block">Cliques p/ agendar</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
              <Package className="w-3.5 h-3.5 text-blue-500" />
              <span>Produtos</span>
            </div>
            <div className="text-lg font-black text-neutral-900">{currentTotals.productClicks}</div>
            <span className="text-[10px] text-neutral-400 block">Consultas na vitrine</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
              <Scissors className="w-3.5 h-3.5 text-violet-500" />
              <span>Serviços</span>
            </div>
            <div className="text-lg font-black text-neutral-900">{currentTotals.serviceClicks}</div>
            <span className="text-[10px] text-neutral-400 block">Visualizações de tabela</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Google Review</span>
            </div>
            <div className="text-lg font-black text-neutral-900">
              {currentTotals.googleReviewClicks}
            </div>
            <span className="text-[10px] text-neutral-400 block">Cliques para avaliar</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
              <Instagram className="w-3.5 h-3.5 text-pink-500" />
              <span>Instagram / Redes</span>
            </div>
            <div className="text-lg font-black text-neutral-900">
              {currentTotals.instagramClicks + currentTotals.socialClicks}
            </div>
            <span className="text-[10px] text-neutral-400 block">Acessos a perfis</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
              <Link2 className="w-3.5 h-3.5 text-neutral-600" />
              <span>Links Extras</span>
            </div>
            <div className="text-lg font-black text-neutral-900">
              {currentTotals.customLinkClicks}
            </div>
            <span className="text-[10px] text-neutral-400 block">Links personalizados</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FUNIL DA DIRETOLINK                                      */}
        {/* ========================================================= */}
        <div className="pt-4 border-t border-neutral-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-800">
              Funil de Conversão da Página Pública
            </h4>
            <span className="text-[10px] text-neutral-400">
              Visualizações → Interações → Ações de Intenção
            </span>
          </div>

          <div className="space-y-2">
            {/* Etapa 1: Visualizações */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  <span>1. Visualizações da Página</span>
                </span>
                <span className="font-mono text-neutral-900 font-bold">
                  {currentTotals.pageViews} visualizações
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 w-full" />
              </div>
            </div>

            {/* Etapa 2: Interações */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>2. Interações com Conteúdo (Cardápio, Vitrine, Serviços, Mapa)</span>
                </span>
                <span className="font-mono text-neutral-900 font-bold">
                  {funnelInteractions} interações
                  {currentTotals.pageViews > 0 && (
                    <span className="text-[10px] text-neutral-400 font-normal ml-1.5">
                      ({((funnelInteractions / currentTotals.pageViews) * 100).toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{
                    width: `${
                      currentTotals.pageViews > 0
                        ? Math.min(100, (funnelInteractions / currentTotals.pageViews) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Etapa 3: Ações de Intenção */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>3. Ações de Intenção (WhatsApp, Agendamento, Pedido)</span>
                </span>
                <span className="font-mono text-neutral-900 font-bold">
                  {funnelIntentions} ações
                  {currentTotals.pageViews > 0 && (
                    <span className="text-[10px] text-neutral-400 font-normal ml-1.5">
                      ({((funnelIntentions / currentTotals.pageViews) * 100).toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${
                      currentTotals.pageViews > 0
                        ? Math.min(100, (funnelIntentions / currentTotals.pageViews) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BASE DE CLIENTES & FIDELIDADE NO PERÍODO                  */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-600" />
              <span>Clientes & Fidelidade no Período</span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              Retenção e participação na campanha de fidelidade.
            </p>
          </div>
          <span className="text-xs text-neutral-600 font-semibold bg-neutral-100 px-3 py-1 rounded-xl">
            {customersMetrics.total} clientes cadastrados na sua base
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Novos Clientes
            </span>
            <div className="text-xl font-black text-neutral-900 font-mono">
              {customersMetrics.newCount}
            </div>
            <span className="text-[10px] text-neutral-400">Cadastrados no período</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Clientes Recorrentes
            </span>
            <div className="text-xl font-black text-neutral-900 font-mono">
              {customersMetrics.recurringCount}
            </div>
            <span className="text-[10px] text-neutral-400">Mais de 1 visita registrada</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Pontos Acumulados
            </span>
            <div className="text-xl font-black text-emerald-600 font-mono">
              +{customersMetrics.pointsAdded}
            </div>
            <span className="text-[10px] text-neutral-400">Pontos no cartão fidelidade</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Prêmios Resgatados
            </span>
            <div className="text-xl font-black text-violet-600 font-mono">
              {customersMetrics.rewardsRedeemed}
            </div>
            <span className="text-[10px] text-neutral-400">Ciclos de fidelidade concluídos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
