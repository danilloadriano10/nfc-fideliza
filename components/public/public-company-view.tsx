'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import {
  Gift,
  Star,
  BookOpen,
  Wifi,
  MessageCircle,
  MapPin,
  MessageSquareHeart,
  Store,
  Scissors,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Instagram,
} from 'lucide-react'
import { Company, CompanyService } from '@/types/platform'
import { LoyaltySheet } from './loyalty-sheet'
import { WifiSheet } from './wifi-sheet'
import { FeedbackSheet } from './feedback-sheet'
import { ServicesSheet } from './services-sheet'
import { BookingSheet } from './booking-sheet'
import {
  getLocalCustomerSession,
  getCustomerByPhone,
  getCompanyServices,
  fetchCompanyServicesFromServer,
  DATA_CHANGE_EVENT,
} from '@/lib/storage'

interface PublicCompanyViewProps {
  company: Company
}

interface FeatureItem {
  id: string
  title: string
  subtitle: string
  badgeText?: string
  icon: React.ReactNode
  featuredBadge: string
  featuredTitle: string
  featuredDescription: string
  featuredCta: string
  featuredIcon: React.ReactNode
  themeBg: string
  onClick: () => void
}

export const PublicCompanyView: React.FC<PublicCompanyViewProps> = ({ company }) => {
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false)
  const [isWifiOpen, setIsWifiOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingService, setBookingService] = useState<CompanyService | null>(null)
  const [services, setServices] = useState<CompanyService[]>([])
  const [coverError, setCoverError] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const [customerSession, setCustomerSession] = useState<{
    phone: string | null
    name?: string
    points: number | null
    hasReward: boolean
  }>({
    phone: null,
    points: null,
    hasReward: false,
  })

  // Synchronize on platform data events
  useEffect(() => {
    // Populate client session on mount
    const savedPhone = getLocalCustomerSession(company.id)
    if (savedPhone) {
      const cust = getCustomerByPhone(company.id, savedPhone)
      if (cust) {
        setCustomerSession({
          phone: savedPhone,
          name: cust.name,
          points: cust.currentPoints,
          hasReward: cust.availableRewards > 0,
        })
      }
    }

    const handleUpdate = () => {
      const currentPhone = getLocalCustomerSession(company.id)
      if (currentPhone) {
        const cust = getCustomerByPhone(company.id, currentPhone)
        if (cust) {
          setCustomerSession({
            phone: currentPhone,
            name: cust.name,
            points: cust.currentPoints,
            hasReward: cust.availableRewards > 0,
          })
          return
        }
      }
      setCustomerSession({ phone: null, points: null, hasReward: false })
    }

    window.addEventListener(DATA_CHANGE_EVENT, handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [company.id])

  // Services data sync
  useEffect(() => {
    setServices(getCompanyServices(company.id))
    fetchCompanyServicesFromServer(company.id).then((srvs) => {
      if (Array.isArray(srvs) && srvs.length > 0) setServices(srvs)
    })
    const updateServices = () => {
      setServices(getCompanyServices(company.id))
    }
    window.addEventListener(DATA_CHANGE_EVENT, updateServices)
    window.addEventListener('storage', updateServices)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, updateServices)
      window.removeEventListener('storage', updateServices)
    }
  }, [company.id])

  const customerPhone = customerSession.phone
  const customerName = customerSession.name
  const customerPoints = customerSession.points
  const hasAvailableReward = customerSession.hasReward

  // Open Google Review
  const handleGoogleReview = useCallback(() => {
    if (company.googleReviewUrl) {
      window.open(company.googleReviewUrl, '_blank', 'noopener,noreferrer')
    }
  }, [company.googleReviewUrl])

  // Open Menu
  const handleOpenMenu = useCallback(() => {
    if (company.menuUrl) {
      window.open(company.menuUrl, '_blank', 'noopener,noreferrer')
    }
  }, [company.menuUrl])

  // Open WhatsApp
  const handleOpenWhatsApp = useCallback(() => {
    const raw = company.whatsapp || ''
    const phoneClean = raw.replace(/\D/g, '')
    const phoneWithDdi = phoneClean.startsWith('55') ? phoneClean : `55${phoneClean}`
    const msg = encodeURIComponent(
      `Olá! Estou visitando a ${company.name} e gostaria de falar com vocês.`
    )
    window.open(`https://wa.me/${phoneWithDdi}?text=${msg}`, '_blank', 'noopener,noreferrer')
  }, [company.whatsapp, company.name])

  // Open Location
  const handleOpenLocation = useCallback(() => {
    if (company.locationUrl) {
      const raw = company.locationUrl.trim()
      const targetUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    } else if (company.addressText) {
      const targetUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.addressText)}`
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }
  }, [company.locationUrl, company.addressText])

  // Open / Connect Wi-Fi
  const handleOpenWifi = useCallback(() => {
    if (!company.wifi?.ssid) return

    const ssid = company.wifi.ssid.trim()
    const password = company.wifi.password ? company.wifi.password.trim() : ''
    const security = company.wifi.security || (password ? 'WPA/WPA2' : 'OPEN')
    const type = security === 'OPEN' || !password ? 'nopass' : 'WPA'
    const wifiPayload = `WIFI:S:${ssid};T:${type};P:${password};;`

    // Try direct connection on supported devices
    try {
      const link = document.createElement('a')
      link.href = wifiPayload
      link.click()
    } catch {
      // Fallback
    }

    setIsWifiOpen(true)
  }, [company.wifi])

  // Active Modules strictly respected
  const activeModules = useMemo(() => {
    return {
      appointments: Boolean(company.modules?.appointments),
      services: Boolean(company.modules?.services),
      loyalty: Boolean(company.modules?.loyalty ?? true) && Boolean(company.loyaltyProgram?.isActive ?? true),
      whatsapp: Boolean(company.modules?.whatsapp ?? true) && Boolean(company.whatsapp),
      googleReview: Boolean(company.modules?.googleReview ?? true) && Boolean(company.googleReviewUrl),
      menu: Boolean(company.modules?.menu ?? true) && Boolean(company.menuUrl),
      wifi: Boolean(company.modules?.wifi ?? true) && Boolean(company.wifi?.ssid),
      location: Boolean(company.modules?.location ?? true) && Boolean(company.locationUrl || company.addressText),
      feedback: Boolean(company.modules?.feedback ?? true),
      instagram: Boolean(company.modules?.instagram ?? true) && Boolean(company.instagram),
    }
  }, [company])

  const loyaltyProgram = useMemo(() => {
    return (
      company.loyaltyProgram || {
        isActive: true,
        goalPoints: 10,
        rewardDescription: 'Recompensa Especial',
        campaignName: 'Cartão Fidelidade',
      }
    )
  }, [company.loyaltyProgram])

  const activeServicesList = useMemo(() => {
    return services.filter((s) => s.isActive !== false)
  }, [services])

  // Build items catalog for active modules
  const allFeatureItems = useMemo<FeatureItem[]>(() => {
    const items: FeatureItem[] = []

    if (activeModules.appointments) {
      items.push({
        id: 'appointments',
        title: 'Agendamento',
        subtitle: 'Reserve seu horário online',
        icon: <Calendar className="w-5 h-5" />,
        featuredBadge: '📅 Agendamento Online',
        featuredTitle: 'Agendar Horário',
        featuredDescription: 'Escolha seu serviço, profissional e horário ideal em poucos segundos.',
        featuredCta: 'Agendar Agora',
        featuredIcon: <Calendar className="w-6 h-6 text-white" />,
        themeBg: 'bg-violet-100/80 text-violet-700',
        onClick: () => {
          setBookingService(null)
          setIsBookingOpen(true)
        },
      })
    }

    if (activeModules.services) {
      items.push({
        id: 'services',
        title: 'Serviços',
        subtitle: activeServicesList.length > 0 ? `${activeServicesList.length} opções` : 'Valores e detalhes',
        icon: <Scissors className="w-5 h-5" />,
        featuredBadge: '✂️ Catálogo de Serviços',
        featuredTitle: 'Nossos Serviços',
        featuredDescription: 'Confira a tabela completa de opções, valores e detalhes de cada serviço.',
        featuredCta: 'Ver Serviços',
        featuredIcon: <Scissors className="w-6 h-6 text-white" />,
        themeBg: 'bg-purple-100/80 text-purple-700',
        onClick: () => setIsServicesOpen(true),
      })
    }

    if (activeModules.loyalty) {
      items.push({
        id: 'loyalty',
        title: 'Fidelidade',
        subtitle:
          customerPoints !== null
            ? `${customerPoints}/${loyaltyProgram.goalPoints} pontos`
            : 'Ganhe pontos e prêmios',
        badgeText: hasAvailableReward ? 'Prêmio Pronto!' : undefined,
        icon: <Gift className="w-5 h-5" />,
        featuredBadge: hasAvailableReward ? '🎉 Prêmio Pronto para Resgate!' : '🎁 Clube Fidelidade',
        featuredTitle: 'Cartão Fidelidade Digital',
        featuredDescription:
          customerPoints !== null
            ? `Você já tem ${customerPoints} de ${loyaltyProgram.goalPoints} pontos acumulados.`
            : `Acumule pontos em cada visita e ganhe "${loyaltyProgram.rewardDescription}" sem baixar nada!`,
        featuredCta: hasAvailableReward ? 'Resgatar Prêmio' : 'Ver Meu Cartão',
        featuredIcon: <Gift className="w-6 h-6 text-white" />,
        themeBg: 'bg-amber-100/80 text-amber-700',
        onClick: () => setIsLoyaltyOpen(true),
      })
    }

    if (activeModules.whatsapp) {
      items.push({
        id: 'whatsapp',
        title: 'WhatsApp',
        subtitle: 'Atendimento direto',
        icon: <MessageCircle className="w-5 h-5" />,
        featuredBadge: '💬 Atendimento Direto',
        featuredTitle: 'Falar no WhatsApp',
        featuredDescription: 'Converse agora com nossa equipe para tirar dúvidas ou fazer pedidos.',
        featuredCta: 'Chamar no WhatsApp',
        featuredIcon: <MessageCircle className="w-6 h-6 text-white" />,
        themeBg: 'bg-emerald-100/80 text-emerald-700',
        onClick: handleOpenWhatsApp,
      })
    }

    if (activeModules.googleReview) {
      items.push({
        id: 'googleReview',
        title: 'Avaliações',
        subtitle: 'Avalie no Google',
        icon: <Star className="w-5 h-5 fill-amber-400 text-amber-400" />,
        featuredBadge: '⭐ Avaliação Google',
        featuredTitle: 'Avalie Nossa Empresa',
        featuredDescription: 'Sua opinião é fundamental para nós. Conte como foi sua experiência!',
        featuredCta: 'Deixar Avaliação',
        featuredIcon: <Star className="w-6 h-6 fill-amber-300 text-amber-300" />,
        themeBg: 'bg-amber-100/80 text-amber-600',
        onClick: handleGoogleReview,
      })
    }

    if (activeModules.menu) {
      items.push({
        id: 'menu',
        title: 'Cardápio',
        subtitle: 'Opções e especialidades',
        icon: <BookOpen className="w-5 h-5" />,
        featuredBadge: '📖 Cardápio Digital',
        featuredTitle: 'Cardápio Completo',
        featuredDescription: 'Confira todas as nossas opções, pratos e novidades preparadas para você.',
        featuredCta: 'Abrir Cardápio',
        featuredIcon: <BookOpen className="w-6 h-6 text-white" />,
        themeBg: 'bg-teal-100/80 text-teal-700',
        onClick: handleOpenMenu,
      })
    }

    if (activeModules.wifi) {
      items.push({
        id: 'wifi',
        title: 'Wi-Fi',
        subtitle: 'Conecte-se à rede',
        icon: <Wifi className="w-5 h-5" />,
        featuredBadge: '📶 Conexão Rápida',
        featuredTitle: 'Conectar ao Wi-Fi',
        featuredDescription: `Acesse a rede "${company.wifi?.ssid}" em um toque sem complicação.`,
        featuredCta: 'Conectar Agora',
        featuredIcon: <Wifi className="w-6 h-6 text-white" />,
        themeBg: 'bg-sky-100/80 text-sky-700',
        onClick: handleOpenWifi,
      })
    }

    if (activeModules.feedback) {
      items.push({
        id: 'feedback',
        title: 'Feedback',
        subtitle: 'Canal direto privado',
        icon: <MessageSquareHeart className="w-5 h-5" />,
        featuredBadge: '💭 Canal Confidencial',
        featuredTitle: 'Deixe sua Sugestão',
        featuredDescription: 'Envie um recado privado diretamente para a gerência do estabelecimento.',
        featuredCta: 'Enviar Mensagem',
        featuredIcon: <MessageSquareHeart className="w-6 h-6 text-white" />,
        themeBg: 'bg-pink-100/80 text-pink-700',
        onClick: () => setIsFeedbackOpen(true),
      })
    }

    return items
  }, [
    activeModules,
    activeServicesList,
    customerPoints,
    hasAvailableReward,
    loyaltyProgram,
    company,
    handleGoogleReview,
    handleOpenMenu,
    handleOpenWhatsApp,
    handleOpenWifi,
  ])

  // Resolve configurable featured module
  // If configured module is active, use it. Otherwise, automatic fallback to the top active module.
  const featuredItem = useMemo<FeatureItem | null>(() => {
    if (allFeatureItems.length === 0) return null

    const configured = company.highlightModule || 'auto'

    if (configured !== 'auto') {
      const match = allFeatureItems.find((item) => item.id === configured)
      if (match) return match
    }

    // Automatic priority order
    const priority = ['appointments', 'services', 'loyalty', 'whatsapp', 'googleReview', 'menu', 'wifi', 'feedback']
    for (const key of priority) {
      const found = allFeatureItems.find((item) => item.id === key)
      if (found) return found
    }

    return allFeatureItems[0] || null
  }, [allFeatureItems, company.highlightModule])

  // Remaining active items for the 2-column grid (excluding the featured one)
  const gridItems = useMemo(() => {
    if (!featuredItem) return allFeatureItems
    return allFeatureItems.filter((item) => item.id !== featuredItem.id)
  }, [allFeatureItems, featuredItem])

  return (
    <div className="min-h-screen bg-neutral-100 flex justify-center selection:bg-neutral-900 selection:text-white">
      {/* Mobile-first Container constraint */}
      <main className="w-full max-w-md bg-white min-h-screen shadow-xl relative pb-10 flex flex-col">
        {/* 1. CAPA MENOR NO TOPO (Sleek Compact Cover) */}
        <div className="relative w-full h-36 sm:h-40 bg-neutral-900 overflow-hidden">
          {company.coverUrl && !coverError ? (
            <Image
              src={company.coverUrl}
              alt={company.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 480px) 100vw, 448px"
              referrerPolicy="no-referrer"
              onError={() => setCoverError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${company.primaryColor || '#6D28D9'} 0%, #1e1e24 100%)`,
              }}
            >
              <Store className="w-10 h-10 text-white/30" />
            </div>
          )}

          {/* Gentle scrim gradient for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>

        {/* 2. LOGO SOBREPOSTO & IDENTIDADE COMPACTA */}
        <div className="px-5 -mt-11 relative z-20 flex flex-col items-center text-center">
          {/* Logo sobreposto compacto */}
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white p-1 shadow-md ring-4 ring-white overflow-hidden flex items-center justify-center">
            {company.logoUrl && !logoError ? (
              <Image
                src={company.logoUrl}
                alt={`${company.name} logo`}
                width={80}
                height={80}
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className="w-full h-full rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-inner"
                style={{ backgroundColor: company.primaryColor || '#6D28D9' }}
              >
                {company.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Business Name */}
          <h1 className="mt-2.5 text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight leading-tight">
            {company.name}
          </h1>

          {/* Categoria / Tagline & Avaliação compactas */}
          <div className="flex items-center justify-center flex-wrap gap-2 mt-1">
            {(company.category || company.tagline) && (
              <span className="text-xs text-neutral-500 font-medium truncate max-w-[200px]">
                {company.category || company.tagline}
              </span>
            )}

            {/* Avaliação compacta com estrelas */}
            <button
              type="button"
              onClick={activeModules.googleReview ? handleGoogleReview : undefined}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/60 text-[11px] font-bold text-amber-800 transition-colors ${
                activeModules.googleReview ? 'hover:bg-amber-100 cursor-pointer' : 'cursor-default'
              }`}
              title={activeModules.googleReview ? 'Avaliar no Google' : undefined}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <span>{company.rating ? company.rating.toFixed(1) : '4.9'}</span>
              <span className="text-amber-600/80 font-normal text-[10px]">
                ({company.reviewCount || '120+'})
              </span>
            </button>
          </div>

          {/* Endereço compacto */}
          {company.addressText && (
            <button
              type="button"
              onClick={handleOpenLocation}
              className="flex items-center justify-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors mt-1 max-w-xs cursor-pointer group"
              title="Abrir no Google Maps"
            >
              <MapPin className="w-3 h-3 shrink-0 text-neutral-400 group-hover:text-rose-600 transition-colors" />
              <span className="truncate">{company.addressText}</span>
            </button>
          )}
        </div>

        {/* 3. CONTEÚDO PRINCIPAL (Compacto & Premium) */}
        <div className="px-4 sm:px-5 mt-5 flex-1 flex flex-col">
          {/* GRANDE CARD ROXO DE DESTAQUE PRINCIPAL */}
          {featuredItem && (
            <div
              onClick={featuredItem.onClick}
              className="w-full relative overflow-hidden rounded-3xl p-4 sm:p-4.5 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 text-white shadow-xl shadow-violet-500/15 cursor-pointer active:scale-[0.985] transition-all duration-200 group border border-violet-400/20"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Efeitos decorativos sutis */}
              <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute right-0 bottom-0 w-28 h-28 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

              <div className="relative z-10 flex flex-col items-start text-left">
                {/* Badge no topo */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold text-white tracking-wide backdrop-blur-md mb-2.5 border border-white/10">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{featuredItem.featuredBadge}</span>
                </div>

                {/* Ícone e Título */}
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner border border-white/20">
                    {featuredItem.featuredIcon}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-[17px] font-bold tracking-tight text-white leading-tight">
                      {featuredItem.featuredTitle}
                    </h3>
                  </div>
                </div>

                {/* Descrição */}
                <p className="text-[11px] sm:text-xs text-violet-100/90 leading-snug max-w-[310px] mb-3">
                  {featuredItem.featuredDescription}
                </p>

                {/* Botão CTA destacado */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-violet-950 text-xs font-bold shadow-md shadow-black/10 group-hover:bg-violet-50 transition-colors">
                  <span>{featuredItem.featuredCta}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] text-violet-700 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          )}

          {/* 4. TÍTULO: “O QUE VOCÊ PRECISA HOJE?” */}
          {gridItems.length > 0 && (
            <div className="mt-5 mb-2.5 px-0.5 flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-neutral-800 tracking-tight">
                O que você precisa hoje?
              </h2>
            </div>
          )}

          {/* 5. GRADE DE 2 COLUNAS PARA OS DEMAIS RECURSOS ATIVOS */}
          {gridItems.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5">
              {gridItems.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={item.onClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      item.onClick()
                    }
                  }}
                  className="bg-white border border-neutral-200/80 hover:border-violet-300 rounded-2xl p-3.5 flex flex-col justify-between text-left shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all duration-150 group cursor-pointer select-none min-h-[105px]"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="flex items-start justify-between gap-1 w-full">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.themeBg}`}>
                      {item.icon}
                    </div>
                    {item.badgeText && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600 truncate max-w-[80px]">
                        {item.badgeText}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <h4 className="text-xs font-bold text-neutral-900 group-hover:text-violet-700 transition-colors truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 6. ATALHOS: LOCALIZAÇÃO, INSTAGRAM E OUTROS MÓDULOS ATIVOS */}
          {(activeModules.location || activeModules.instagram) && (
            <div className="mt-6 space-y-2.5">
              {/* Atalho de Localização */}
              {activeModules.location && (
                <div
                  onClick={handleOpenLocation}
                  className="w-full bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer group"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 group-hover:text-rose-700 transition-colors truncate">
                        Localização & Como Chegar
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {company.addressText || 'Abrir rota no Google Maps'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold group-hover:bg-rose-100 transition-colors">
                    Rotas
                  </div>
                </div>
              )}

              {/* Atalho de Instagram */}
              {activeModules.instagram && company.instagram && (
                <div
                  onClick={(e) => {
                    e.preventDefault()
                    const clean = company.instagram.replace(/^@/, '').trim()
                    window.open(`https://www.instagram.com/${clean}/`, '_blank', 'noopener,noreferrer')
                  }}
                  className="w-full bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer group"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 group-hover:text-[#bc1888] transition-colors truncate">
                        Instagram Oficial
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5 font-mono">
                        @{company.instagram.replace(/^@/, '')}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 text-[11px] font-bold group-hover:bg-pink-100 transition-colors flex items-center gap-1">
                    <span>Seguir</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* DiretoLink Signature Footer */}
        <footer className="mt-8 pt-5 pb-6 border-t border-neutral-100 text-center text-[11px] text-neutral-400 px-6 space-y-1">
          <p className="font-medium text-neutral-600">© {company.name}</p>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
            <span className="font-semibold text-neutral-600">DiretoLink • Uma conexão. Tudo mais perto.</span>
          </div>
        </footer>

        {/* MODALS / SHEETS (Preserving all existing business flows) */}
        <LoyaltySheet
          isOpen={isLoyaltyOpen}
          onClose={() => setIsLoyaltyOpen(false)}
          company={company}
          initialCustomerPhone={customerPhone}
        />

        <WifiSheet
          isOpen={isWifiOpen}
          onClose={() => setIsWifiOpen(false)}
          wifi={company.wifi || { ssid: '', security: 'OPEN' }}
          companyName={company.name}
          primaryColor={company.primaryColor}
        />

        <FeedbackSheet
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          companyId={company.id}
          companyName={company.name}
          primaryColor={company.primaryColor}
          initialCustomerName={customerName}
          initialCustomerPhone={customerPhone || undefined}
        />

        <ServicesSheet
          isOpen={isServicesOpen}
          onClose={() => setIsServicesOpen(false)}
          services={services}
          company={company}
          onBookService={(srv) => {
            setIsServicesOpen(false)
            setBookingService(srv)
            setIsBookingOpen(true)
          }}
        />

        <BookingSheet
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false)
            setBookingService(null)
          }}
          company={company}
          initialService={bookingService}
        />
      </main>
    </div>
  )
}
