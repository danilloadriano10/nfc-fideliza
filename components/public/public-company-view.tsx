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
  Clock,
  ChevronRight,
  Award,
  Navigation,
  CheckCircle2,
  Share2,
  Check,
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
import {
  sanitizeHex,
  getGradientContrastTextColor,
  hexToRgba,
} from '@/lib/colors'

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
  const isDark = (company.theme || 'dark') === 'dark'
  const primaryColor = useMemo(
    () => sanitizeHex(company.primaryColor, '#6D28D9'),
    [company.primaryColor]
  )
  const secondaryColor = useMemo(
    () => sanitizeHex(company.secondaryColor, '#8B5CF6'),
    [company.secondaryColor]
  )
  const gradientBg = useMemo(
    () => `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
    [primaryColor, secondaryColor]
  )
  const contrastText = useMemo(
    () => getGradientContrastTextColor(primaryColor, secondaryColor),
    [primaryColor, secondaryColor]
  )
  const isLightContrast = contrastText === '#171717'

  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false)
  const [isWifiOpen, setIsWifiOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingService, setBookingService] = useState<CompanyService | null>(null)
  const [services, setServices] = useState<CompanyService[]>([])
  const [coverError, setCoverError] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

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

  // Synchronize customer session on platform data events
  useEffect(() => {
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

  // Share Page Link
  const handleShare = useCallback(() => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href
      if (navigator.share) {
        navigator.share({
          title: company.name,
          text: `Conheça ${company.name} na DiretoLink`,
          url: currentUrl,
        }).catch(() => {})
      } else {
        navigator.clipboard.writeText(currentUrl)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2200)
      }
    }
  }, [company.name])

  // Open / Connect Wi-Fi
  const handleOpenWifi = useCallback(() => {
    if (!company.wifi?.ssid) return

    const ssid = company.wifi.ssid.trim()
    const password = company.wifi.password ? company.wifi.password.trim() : ''
    const security = company.wifi.security || (password ? 'WPA/WPA2' : 'OPEN')
    const type = security === 'OPEN' || !password ? 'nopass' : 'WPA'
    const wifiPayload = `WIFI:S:${ssid};T:${type};P:${password};;`

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
        subtitle: 'Reserve online',
        icon: <Calendar className="w-4.5 h-4.5" />,
        featuredBadge: '📅 Agendamento Online',
        featuredTitle: 'Agendar Horário',
        featuredDescription: 'Escolha seu serviço, profissional e horário ideal em poucos segundos.',
        featuredCta: 'Agendar Agora',
        featuredIcon: <Calendar className="w-5 h-5 stroke-[2]" />,
        themeBg: 'bg-violet-50 text-violet-700 border-violet-100',
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
        subtitle: activeServicesList.length > 0 ? `${activeServicesList.length} opções` : 'Ver catálogo',
        icon: <Scissors className="w-4.5 h-4.5" />,
        featuredBadge: '✂️ Catálogo de Serviços',
        featuredTitle: 'Nossos Serviços',
        featuredDescription: 'Confira a tabela completa de opções, valores e detalhes de cada serviço.',
        featuredCta: 'Ver Serviços',
        featuredIcon: <Scissors className="w-5 h-5 stroke-[2]" />,
        themeBg: 'bg-purple-50 text-purple-700 border-purple-100',
        onClick: () => setIsServicesOpen(true),
      })
    }

    if (activeModules.loyalty) {
      items.push({
        id: 'loyalty',
        title: 'Fidelidade',
        subtitle:
          customerPoints !== null
            ? `${customerPoints}/${loyaltyProgram.goalPoints} pts`
            : 'Ganhe prêmios',
        badgeText: hasAvailableReward ? 'Prêmio!' : undefined,
        icon: <Gift className="w-4.5 h-4.5" />,
        featuredBadge: hasAvailableReward ? '🎉 Prêmio Pronto para Resgate!' : '🎁 Clube Fidelidade',
        featuredTitle: 'Cartão Fidelidade Digital',
        featuredDescription:
          customerPoints !== null
            ? `Você já tem ${customerPoints} de ${loyaltyProgram.goalPoints} pontos acumulados.`
            : `Acumule pontos em cada visita e ganhe "${loyaltyProgram.rewardDescription}" sem baixar nada!`,
        featuredCta: hasAvailableReward ? 'Resgatar Prêmio' : 'Ver Meu Cartão',
        featuredIcon: <Gift className="w-5 h-5 stroke-[2]" />,
        themeBg: 'bg-amber-50 text-amber-700 border-amber-100',
        onClick: () => setIsLoyaltyOpen(true),
      })
    }

    if (activeModules.whatsapp) {
      items.push({
        id: 'whatsapp',
        title: 'WhatsApp',
        subtitle: 'Fale conosco',
        icon: <MessageCircle className="w-4.5 h-4.5" />,
        featuredBadge: '💬 Atendimento Direto',
        featuredTitle: 'Falar no WhatsApp',
        featuredDescription: 'Converse agora com nossa equipe para tirar dúvidas ou fazer pedidos.',
        featuredCta: 'Chamar no WhatsApp',
        featuredIcon: <MessageCircle className="w-5 h-5 stroke-[2]" />,
        themeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        onClick: handleOpenWhatsApp,
      })
    }

    if (activeModules.googleReview) {
      items.push({
        id: 'googleReview',
        title: 'Avaliações',
        subtitle: 'Avaliar no Google',
        icon: <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />,
        featuredBadge: '⭐ Avaliação Google',
        featuredTitle: 'Avalie Nossa Empresa',
        featuredDescription: 'Sua opinião é fundamental para nós. Conte como foi sua experiência!',
        featuredCta: 'Deixar Avaliação',
        featuredIcon: <Star className="w-5 h-5 fill-current stroke-[2]" />,
        themeBg: 'bg-amber-50 text-amber-600 border-amber-100',
        onClick: handleGoogleReview,
      })
    }

    if (activeModules.menu) {
      items.push({
        id: 'menu',
        title: 'Cardápio',
        subtitle: 'Ver especialidades',
        icon: <BookOpen className="w-4.5 h-4.5" />,
        featuredBadge: '📖 Cardápio Digital',
        featuredTitle: 'Cardápio Completo',
        featuredDescription: 'Confira todas as nossas opções, pratos e novidades preparadas para você.',
        featuredCta: 'Abrir Cardápio',
        featuredIcon: <BookOpen className="w-5 h-5 stroke-[2]" />,
        themeBg: 'bg-teal-50 text-teal-700 border-teal-100',
        onClick: handleOpenMenu,
      })
    }

    if (activeModules.wifi) {
      items.push({
        id: 'wifi',
        title: 'Wi-Fi',
        subtitle: 'Conectar à rede',
        icon: <Wifi className="w-4.5 h-4.5" />,
        featuredBadge: '📶 Conexão Rápida',
        featuredTitle: 'Conectar ao Wi-Fi',
        featuredDescription: `Acesse a rede "${company.wifi?.ssid}" em um toque sem complicação.`,
        featuredCta: 'Conectar Agora',
        featuredIcon: <Wifi className="w-5 h-5 stroke-[2]" />,
        themeBg: 'bg-sky-50 text-sky-700 border-sky-100',
        onClick: handleOpenWifi,
      })
    }

    if (activeModules.feedback) {
      items.push({
        id: 'feedback',
        title: 'Feedback',
        subtitle: 'Canal privado',
        icon: <MessageSquareHeart className="w-4.5 h-4.5" />,
        featuredBadge: '💭 Canal Confidencial',
        featuredTitle: 'Deixe sua Sugestão',
        featuredDescription: 'Envie um recado privado diretamente para a gerência do estabelecimento.',
        featuredCta: 'Enviar Mensagem',
        featuredIcon: <MessageSquareHeart className="w-5 h-5 stroke-[2]" />,
        themeBg: 'bg-pink-50 text-pink-700 border-pink-100',
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

  // Compact quick access items (all active modules or excluding hero to avoid exact duplicate)
  const quickAccessItems = useMemo(() => {
    if (!featuredItem) return allFeatureItems
    return allFeatureItems.filter((item) => item.id !== featuredItem.id)
  }, [allFeatureItems, featuredItem])

  // Calculate loyalty percentage
  const loyaltyProgressPercent = useMemo(() => {
    if (customerPoints === null) return 0
    const goal = loyaltyProgram.goalPoints || 10
    return Math.min(100, Math.round((customerPoints / goal) * 100))
  }, [customerPoints, loyaltyProgram.goalPoints])

  return (
    <div
      className={`min-h-screen sm:py-6 flex justify-center transition-colors duration-200 ${
        isDark
          ? 'bg-[#070709] selection:bg-neutral-800 selection:text-white'
          : 'bg-neutral-100/90 selection:bg-neutral-900 selection:text-white'
      }`}
    >
      {/* Mobile-first App Container */}
      <main
        className={`w-full max-w-md sm:rounded-3xl shadow-2xl overflow-hidden relative pb-28 sm:pb-24 flex flex-col transition-colors duration-200 ${
          isDark
            ? 'bg-[#0d0d12] border-x sm:border border-white/[0.08] text-white'
            : 'bg-white border-x sm:border border-neutral-200/80 text-neutral-900'
        }`}
      >
        
        {/* ========================================================= */}
        {/* 1. TOPO DA EMPRESA: HERO IMERSIVO COM IDENTIDADE DA MARCA */}
        {/* ========================================================= */}
        <div className="relative w-full">
          {/* Foto de Capa Imersiva & Integração com o Fundo */}
          <div className="relative w-full h-48 sm:h-52 bg-neutral-950 overflow-hidden">
            {company.coverUrl && !coverError ? (
              <>
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
                {/* Tonalidade sutil da marca sobreposta à foto de capa */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
                  style={{ background: gradientBg }}
                />
                {/* Gradiente vertical para fusão perfeita e sem corte seco */}
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    isDark
                      ? 'bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/70 to-transparent'
                      : 'bg-gradient-to-t from-white via-white/60 to-transparent'
                  }`}
                />
                {/* Vinheta superior para contraste das ações flutuantes */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />
              </>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center relative overflow-hidden"
                style={{ background: gradientBg }}
              >
                <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/20 blur-xl pointer-events-none" />
                <div className="absolute right-0 bottom-0 w-28 h-28 rounded-full bg-black/25 blur-xl pointer-events-none" />
                <Store className="w-10 h-10 opacity-35" style={{ color: contrastText }} />
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    isDark
                      ? 'bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/60 to-transparent'
                      : 'bg-gradient-to-t from-white via-white/50 to-transparent'
                  }`}
                />
              </div>
            )}

            {/* Ações rápidas flutuantes no topo da capa */}
            <div className="absolute top-2.5 right-3 z-20 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShare}
                className="w-8 h-8 rounded-full bg-black/45 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/60 flex items-center justify-center transition-all cursor-pointer shadow-xs border border-white/10 active:scale-95"
                title="Compartilhar página"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Logo sobreposto & Identidade da Empresa */}
          <div className="px-5 -mt-14 sm:-mt-16 relative z-20 flex flex-col items-center text-center">
            {/* Moldura do Logo com Gradiente e Contraste */}
            <div
              className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-2xl p-[3px] shadow-2xl overflow-hidden flex items-center justify-center transition-transform hover:scale-105"
              style={{
                background: gradientBg,
                boxShadow: `0 12px 28px -4px ${hexToRgba(primaryColor, isDark ? 0.55 : 0.4)}`,
              }}
            >
              <div
                className={`w-full h-full rounded-[13px] p-1 overflow-hidden flex items-center justify-center ${
                  isDark ? 'bg-[#141419]' : 'bg-white'
                }`}
              >
                {company.logoUrl && !logoError ? (
                  <Image
                    src={company.logoUrl}
                    alt={`${company.name} logo`}
                    width={88}
                    height={88}
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-xl flex items-center justify-center text-xl font-black shadow-inner"
                    style={{
                      background: gradientBg,
                      color: contrastText,
                    }}
                  >
                    {company.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Nome da Empresa */}
            <h1
              className={`mt-3 text-xl sm:text-2xl font-black tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {company.name}
            </h1>

            {/* Tagline da Empresa (Categoria removida da interface pública conforme solicitação) */}
            {company.tagline && (
              <p
                className={`text-xs font-medium max-w-xs mt-1 leading-snug ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                {company.tagline}
              </p>
            )}

            {/* Linha de Metadados: Avaliação no Google & Status */}
            <div className="flex items-center justify-center flex-wrap gap-2 mt-2.5">
              {/* Avaliação Google */}
              <button
                type="button"
                onClick={activeModules.googleReview ? handleGoogleReview : undefined}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  isDark
                    ? 'bg-[#16161c] border border-white/[0.08] text-amber-300 hover:border-amber-400/40 shadow-xs'
                    : 'bg-amber-50/90 border border-amber-200/70 text-amber-900 hover:bg-amber-100'
                } ${
                  activeModules.googleReview ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-default'
                }`}
                title={activeModules.googleReview ? 'Ver avaliações no Google' : undefined}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{company.rating ? company.rating.toFixed(1) : '4.9'}</span>
                <span
                  className={`font-normal text-[10px] ${
                    isDark ? 'text-neutral-400' : 'text-amber-700/80'
                  }`}
                >
                  ({company.reviewCount || '120+'})
                </span>
              </button>

              {/* Status do Estabelecimento */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  isDark
                    ? 'bg-[#0f1b14] border border-emerald-500/30 text-emerald-300 shadow-xs'
                    : 'bg-emerald-50 border border-emerald-200/70 text-emerald-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Atendimento Ativo</span>
              </div>
            </div>

            {/* Endereço Compacto */}
            {company.addressText && (
              <button
                type="button"
                onClick={handleOpenLocation}
                className={`inline-flex items-center justify-center gap-1 text-[11px] transition-colors mt-2 max-w-xs cursor-pointer group px-2 py-0.5 rounded-lg ${
                  isDark
                    ? 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05]'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
                title="Abrir no Google Maps"
              >
                <MapPin
                  className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform"
                  style={{ color: primaryColor }}
                />
                <span className="truncate">{company.addressText}</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CORPO PRINCIPAL COM CONTEÚDO PREMIUM                     */}
        {/* ========================================================= */}
        <div className="px-4 sm:px-5 mt-5 flex-1 flex flex-col space-y-6">

          {/* ======================================================= */}
          {/* 2. DESTAQUE PRINCIPAL (HERO CARD COM GRADIENTE)         */}
          {/* ======================================================= */}
          {featuredItem && (
            <div
              onClick={featuredItem.onClick}
              className="w-full relative overflow-hidden rounded-3xl p-5 shadow-xl cursor-pointer active:scale-[0.985] transition-all duration-200 group border select-none"
              style={{
                background: gradientBg,
                color: contrastText,
                borderColor: isDark
                  ? 'rgba(255,255,255,0.22)'
                  : isLightContrast
                  ? 'rgba(0,0,0,0.08)'
                  : 'rgba(255,255,255,0.2)',
                boxShadow: `0 16px 36px -10px ${hexToRgba(primaryColor, isDark ? 0.55 : 0.42)}`,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Efeitos de iluminação modernos sobre o gradiente */}
              <div
                className="absolute -right-8 -top-8 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-35"
                style={{ backgroundColor: secondaryColor }}
              />
              <div
                className="absolute right-0 bottom-0 w-28 h-28 rounded-full blur-xl pointer-events-none opacity-30"
                style={{ backgroundColor: primaryColor }}
              />

              <div className="relative z-10 flex flex-col items-start text-left">
                {/* Badge no topo com backdrop blur */}
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide backdrop-blur-md mb-3 border"
                  style={{
                    backgroundColor: isLightContrast
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(255, 255, 255, 0.2)',
                    borderColor: isLightContrast
                      ? 'rgba(0, 0, 0, 0.12)'
                      : 'rgba(255, 255, 255, 0.25)',
                    color: contrastText,
                  }}
                >
                  <Sparkles
                    className="w-3 h-3"
                    style={{ color: isLightContrast ? '#d97706' : '#fde047' }}
                  />
                  <span>{featuredItem.featuredBadge}</span>
                </div>

                {/* Ícone e Título */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner border"
                    style={{
                      backgroundColor: isLightContrast
                        ? 'rgba(0, 0, 0, 0.08)'
                        : 'rgba(255, 255, 255, 0.2)',
                      borderColor: isLightContrast
                        ? 'rgba(0, 0, 0, 0.12)'
                        : 'rgba(255, 255, 255, 0.25)',
                      color: contrastText,
                    }}
                  >
                    {featuredItem.featuredIcon}
                  </div>
                  <div>
                    <h3
                      className="text-base sm:text-lg font-black tracking-tight leading-tight"
                      style={{ color: contrastText }}
                    >
                      {featuredItem.featuredTitle}
                    </h3>
                  </div>
                </div>

                {/* Descrição */}
                <p
                  className="text-xs leading-relaxed max-w-[320px] mb-4"
                  style={{
                    color: isLightContrast
                      ? 'rgba(23, 23, 23, 0.85)'
                      : 'rgba(255, 255, 255, 0.92)',
                  }}
                >
                  {featuredItem.featuredDescription}
                </p>

                {/* Botão CTA com contraste automático perfeito */}
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-transform group-hover:scale-[1.02]"
                  style={{
                    backgroundColor: isLightContrast ? '#171717' : '#ffffff',
                    color: isLightContrast ? '#ffffff' : '#171717',
                  }}
                >
                  <span>{featuredItem.featuredCta}</span>
                  <ArrowRight
                    className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform"
                    style={{
                      color: isLightContrast ? '#fcd34d' : primaryColor,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 3. ACESSOS RÁPIDOS: ATALHOS COMPACTOS ESTILO APP ICONS   */}
          {/* ======================================================= */}
          {quickAccessItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-3 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <h2
                    className={`text-xs font-extrabold uppercase tracking-wider ${
                      isDark ? 'text-neutral-400' : 'text-neutral-600'
                    }`}
                  >
                    Acessos Rápidos
                  </h2>
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isDark ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  Toque para abrir
                </span>
              </div>

              {/* Grid estilo ícones de aplicativo mobile (compacto e visual) */}
              <div className="grid grid-cols-4 gap-2">
                {quickAccessItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl active:scale-95 transition-all duration-150 cursor-pointer group relative select-none ${
                      isDark
                        ? 'bg-[#141419] hover:bg-[#1a1a20] border border-white/[0.07] hover:border-white/15'
                        : 'bg-neutral-50/90 hover:bg-neutral-100/90 border border-neutral-200/60'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {/* Badge flutuante quando houver */}
                    {item.badgeText && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-amber-500 text-white shadow-2xs">
                        {item.badgeText}
                      </span>
                    )}

                    {/* Ícone arredondado estilo App com tint da marca */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: hexToRgba(primaryColor, isDark ? 0.18 : 0.1),
                        color: primaryColor,
                      }}
                    >
                      {item.icon}
                    </div>

                    {/* Rótulo Compacto */}
                    <span
                      className={`mt-1.5 text-[11px] font-bold text-center truncate max-w-full ${
                        isDark
                          ? 'text-neutral-200 group-hover:text-white'
                          : 'text-neutral-800 group-hover:text-neutral-950'
                      }`}
                    >
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 4. NOSSOS SERVIÇOS: VITRINE VISUAL COM FOTOS GRANDES     */}
          {/* ======================================================= */}
          {activeServicesList.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-3 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <h3
                    className={`text-sm font-black tracking-tight ${
                      isDark ? 'text-white' : 'text-neutral-900'
                    }`}
                  >
                    Nossos Serviços
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.2 rounded-full ${
                      isDark ? 'border border-white/[0.08]' : ''
                    }`}
                    style={{
                      backgroundColor: hexToRgba(primaryColor, isDark ? 0.2 : 0.1),
                      color: isDark ? '#ffffff' : primaryColor,
                    }}
                  >
                    {activeServicesList.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsServicesOpen(true)}
                  className="text-xs font-bold flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: primaryColor }}
                >
                  <span>Ver todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Vitrine de Serviços: Cards Visuais com Fotos Maiores e Layout Moderno */}
              <div className="space-y-3">
                {activeServicesList.slice(0, 4).map((srv) => {
                  const srvPhoto = srv.photoUrl || (srv as unknown as { imageUrl?: string }).imageUrl || ''
                  const isConsult = srv.priceType === 'consult' || srv.price == null

                  return (
                    <div
                      key={srv.id}
                      className={`rounded-3xl p-3 sm:p-3.5 flex flex-col sm:flex-row gap-3 transition-all cursor-pointer group relative overflow-hidden ${
                        isDark
                          ? 'bg-[#141419] hover:bg-[#191920] border border-white/[0.07] hover:border-white/15 shadow-md'
                          : 'bg-white hover:border-neutral-300 border border-neutral-200/90 shadow-xs hover:shadow-md'
                      }`}
                      style={{
                        boxShadow: isDark
                          ? `0 6px 20px -4px rgba(0,0,0,0.5)`
                          : `0 4px 16px -4px ${hexToRgba(primaryColor, 0.08)}`,
                      }}
                      onClick={() => {
                        if (activeModules.appointments) {
                          setBookingService(srv)
                          setIsBookingOpen(true)
                        } else {
                          setIsServicesOpen(true)
                        }
                      }}
                    >
                      <div className="flex items-start gap-3.5 w-full">
                        {/* Foto Maior em Destaque Visual (Estilo Vitrine Comercial) */}
                        {srvPhoto ? (
                          <div
                            className={`relative w-24 h-24 sm:w-26 sm:h-26 rounded-2xl overflow-hidden shrink-0 shadow-xs ${
                              isDark
                                ? 'bg-[#1a1a22] border border-white/[0.08]'
                                : 'bg-neutral-100 border border-neutral-200/80'
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={srvPhoto}
                              alt={srv.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {srv.durationMinutes && (
                              <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 shadow-2xs">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{srv.durationMinutes}m</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="w-24 h-24 sm:w-26 sm:h-26 rounded-2xl flex flex-col items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: hexToRgba(primaryColor, isDark ? 0.15 : 0.08),
                              borderColor: hexToRgba(primaryColor, isDark ? 0.3 : 0.2),
                              color: primaryColor,
                            }}
                          >
                            <Scissors className="w-7 h-7 opacity-85 mb-1" />
                            {srv.durationMinutes && (
                              <span className="text-[10px] font-bold opacity-80">
                                {srv.durationMinutes} min
                              </span>
                            )}
                          </div>
                        )}

                        {/* Informações Completas do Serviço */}
                        <div className="min-w-0 flex-1 flex flex-col justify-between self-stretch">
                          <div>
                            {srv.category && (
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider block mb-0.5"
                                style={{ color: primaryColor }}
                              >
                                {srv.category}
                              </span>
                            )}
                            <h4
                              className={`font-black text-sm sm:text-base leading-snug transition-colors ${
                                isDark
                                  ? 'text-white group-hover:text-neutral-100'
                                  : 'text-neutral-900 group-hover:text-neutral-950'
                              }`}
                            >
                              {srv.name}
                            </h4>
                            {srv.description && (
                              <p
                                className={`text-[11px] line-clamp-2 mt-1 leading-relaxed ${
                                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                                }`}
                              >
                                {srv.description}
                              </p>
                            )}
                          </div>

                          {/* Preço e Botão de Agendamento */}
                          <div
                            className={`flex items-center justify-between gap-2 mt-2 pt-2 ${
                              isDark ? 'border-t border-white/[0.06]' : 'border-t border-neutral-100'
                            }`}
                          >
                            <div>
                              <span
                                className={`text-[10px] block font-medium ${
                                  isDark ? 'text-neutral-500' : 'text-neutral-400'
                                }`}
                              >
                                A partir de
                              </span>
                              {isConsult ? (
                                <span
                                  className="text-xs font-bold"
                                  style={{ color: primaryColor }}
                                >
                                  Sob Consulta
                                </span>
                              ) : (
                                <span
                                  className={`text-sm sm:text-base font-black font-mono ${
                                    isDark ? 'text-white' : 'text-neutral-900'
                                  }`}
                                >
                                  R$ {srv.price?.toFixed(2).replace('.', ',')}
                                </span>
                              )}
                            </div>

                            {/* Botão de Agendar */}
                            {activeModules.appointments ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setBookingService(srv)
                                  setIsBookingOpen(true)
                                }}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                style={{
                                  backgroundColor: primaryColor,
                                  boxShadow: `0 4px 12px -2px ${hexToRgba(primaryColor, 0.45)}`,
                                }}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Agendar</span>
                              </button>
                            ) : (
                              <div
                                className="text-[11px] font-bold flex items-center gap-0.5"
                                style={{ color: primaryColor }}
                              >
                                <span>Ver Mais</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Botão de Ver Catálogo Completo */}
              {activeServicesList.length > 4 && (
                <button
                  type="button"
                  onClick={() => setIsServicesOpen(true)}
                  className={`w-full py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isDark
                      ? 'hover:bg-white/[0.05]'
                      : 'hover:bg-neutral-100'
                  }`}
                  style={{
                    backgroundColor: hexToRgba(primaryColor, isDark ? 0.1 : 0.04),
                    borderColor: hexToRgba(primaryColor, isDark ? 0.3 : 0.2),
                    color: isDark ? '#ffffff' : primaryColor,
                  }}
                >
                  <span>Ver todos os {activeServicesList.length} serviços</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* 5. SEÇÃO VISUAL: FIDELIDADE DIGITAL                     */}
          {/* ======================================================= */}
          {activeModules.loyalty && (
            <div
              className={`rounded-3xl p-5 border relative overflow-hidden space-y-4 ${
                isDark
                  ? 'border-white/[0.08] shadow-lg'
                  : 'shadow-sm'
              }`}
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.18)} 0%, #131318 45%, ${hexToRgba(secondaryColor, 0.12)} 100%)`
                  : `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.05)} 0%, #ffffff 50%, ${hexToRgba(secondaryColor, 0.08)} 100%)`,
                borderColor: hexToRgba(primaryColor, isDark ? 0.28 : 0.22),
              }}
            >
              {/* Efeito decorativo sutil */}
              <div
                className="absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-25"
                style={{ backgroundColor: primaryColor }}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
                    style={{
                      background: gradientBg,
                      color: contrastText,
                    }}
                  >
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider block"
                      style={{ color: primaryColor }}
                    >
                      Programa de Vantagens
                    </span>
                    <h3
                      className={`text-sm font-black tracking-tight ${
                        isDark ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {loyaltyProgram.campaignName || 'Cartão Fidelidade'}
                    </h3>
                  </div>
                </div>

                {hasAvailableReward && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-500/40 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>Prêmio Pronto!</span>
                  </span>
                )}
              </div>

              {/* Status dos Pontos & Progresso Visual */}
              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <div>
                    <span
                      className={`text-[11px] ${
                        isDark ? 'text-neutral-400' : 'text-neutral-500'
                      }`}
                    >
                      Seu saldo atual
                    </span>
                    <p
                      className={`text-base sm:text-lg font-black ${
                        isDark ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {customerPoints !== null ? `${customerPoints} ` : '0 '}
                      <span
                        className={`text-xs font-normal ${
                          isDark ? 'text-neutral-400' : 'text-neutral-500'
                        }`}
                      >
                        de {loyaltyProgram.goalPoints} pontos
                      </span>
                    </p>
                  </div>
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color: primaryColor }}
                  >
                    {loyaltyProgressPercent}%
                  </span>
                </div>

                {/* Barra de Progresso Visual */}
                <div
                  className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 ${
                    isDark ? 'bg-neutral-800/90' : 'bg-neutral-200/80'
                  }`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(5, loyaltyProgressPercent)}%`,
                      background: gradientBg,
                    }}
                  />
                </div>

                {/* Carimbos Digitais de Progresso (Punch Card) */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1.5">
                  {Array.from({
                    length: Math.min(10, loyaltyProgram.goalPoints || 10),
                  }).map((_, idx) => {
                    const isEarned = (customerPoints || 0) > idx
                    const isGoal = idx === Math.min(10, loyaltyProgram.goalPoints || 10) - 1

                    return (
                      <div
                        key={idx}
                        className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                          isEarned
                            ? 'shadow-xs scale-105'
                            : isGoal
                            ? isDark
                              ? 'border border-amber-500/50 text-amber-300 bg-amber-950/40'
                              : 'border border-amber-300 text-amber-700 bg-amber-50'
                            : isDark
                            ? 'bg-neutral-800/80 border border-neutral-700/60 text-neutral-400'
                            : 'bg-neutral-100 border border-neutral-200 text-neutral-400'
                        }`}
                        style={{
                          background: isEarned ? gradientBg : undefined,
                          color: isEarned ? contrastText : undefined,
                        }}
                      >
                        {isEarned ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : isGoal ? (
                          <Gift className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recompensa */}
              <div
                className="p-3 rounded-2xl flex items-start gap-2.5 text-left border"
                style={{
                  backgroundColor: hexToRgba(primaryColor, isDark ? 0.12 : 0.05),
                  borderColor: hexToRgba(primaryColor, isDark ? 0.28 : 0.15),
                }}
              >
                <Sparkles
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: primaryColor }}
                />
                <div className="text-xs">
                  <span
                    className={`font-bold block ${
                      isDark ? 'text-white' : 'text-neutral-900'
                    }`}
                  >
                    Próxima Recompensa:
                  </span>
                  <span
                    className={`leading-snug ${
                      isDark ? 'text-neutral-300' : 'text-neutral-600'
                    }`}
                  >
                    {loyaltyProgram.rewardDescription}
                  </span>
                </div>
              </div>

              {/* Botão de Ação: Ver Meu Cartão */}
              <button
                type="button"
                onClick={() => setIsLoyaltyOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: gradientBg,
                  color: contrastText,
                }}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>
                  {hasAvailableReward ? 'Resgatar Prêmio Disponível' : 'Ver Meu Cartão Fidelidade'}
                </span>
              </button>
            </div>
          )}

          {/* ======================================================= */}
          {/* 6. SEÇÃO VISUAL: AVALIAÇÃO NO GOOGLE                    */}
          {/* ======================================================= */}
          {activeModules.googleReview && company.googleReviewUrl && (
            <div
              className={`rounded-3xl p-4.5 sm:p-5 space-y-3.5 ${
                isDark
                  ? 'bg-[#141419] border border-white/[0.07] shadow-sm'
                  : 'bg-white border border-neutral-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Badge Oficial Google */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs ${
                      isDark
                        ? 'bg-neutral-800/90 border border-white/10'
                        : 'bg-neutral-100 border border-neutral-200/60'
                    }`}
                  >
                    <span className="text-[#4285F4] font-black">G</span>
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold tracking-tight block ${
                        isDark ? 'text-neutral-200' : 'text-neutral-800'
                      }`}
                    >
                      Google Reviews
                    </span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-black block leading-none ${
                      isDark ? 'text-white' : 'text-neutral-900'
                    }`}
                  >
                    {company.rating ? company.rating.toFixed(1) : '4.9'}
                  </span>
                  <span
                    className={`text-[10px] font-normal ${
                      isDark ? 'text-neutral-400' : 'text-neutral-400'
                    }`}
                  >
                    {company.reviewCount || '120+'} opiniões
                  </span>
                </div>
              </div>

              <div>
                <h4
                  className={`text-sm font-black tracking-tight ${
                    isDark ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  Sua opinião faz a diferença!
                </h4>
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  Avalie sua experiência na {company.name} no Google. Leva menos de 1 minuto e nos ajuda muito a continuar evoluindo.
                </p>
              </div>

              {/* Botão de Avaliar no Google */}
              <button
                type="button"
                onClick={handleGoogleReview}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-white text-white" />
                <span>Avaliar no Google</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          )}

          {/* ======================================================= */}
          {/* 7. LOCALIZAÇÃO E CONTATO (COMPACTO & ELEGANTE NO FINAL) */}
          {/* ======================================================= */}
          {(activeModules.location ||
            activeModules.whatsapp ||
            activeModules.instagram ||
            activeModules.wifi) && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-3 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <h3
                    className={`text-xs font-extrabold uppercase tracking-wider ${
                      isDark ? 'text-neutral-400' : 'text-neutral-600'
                    }`}
                  >
                    Onde Estamos & Contato
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                {/* Localização & Como Chegar */}
                {activeModules.location && (
                  <div
                    onClick={handleOpenLocation}
                    className={`w-full rounded-2xl p-3 flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer group ${
                      isDark
                        ? 'bg-[#141419] hover:bg-[#1a1a22] border border-white/[0.07] hover:border-white/15'
                        : 'bg-white border border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isDark
                            ? 'bg-rose-950/40 text-rose-400 border-rose-500/20'
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}
                      >
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold transition-colors truncate ${
                            isDark
                              ? 'text-white group-hover:text-rose-400'
                              : 'text-neutral-900 group-hover:text-rose-600'
                          }`}
                        >
                          Localização
                        </p>
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isDark ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          {company.addressText || 'Ver rota no Google Maps'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                        isDark
                          ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30 group-hover:bg-rose-900/50'
                          : 'bg-rose-50 text-rose-700 group-hover:bg-rose-100'
                      }`}
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Rotas</span>
                    </div>
                  </div>
                )}

                {/* WhatsApp */}
                {activeModules.whatsapp && (
                  <div
                    onClick={handleOpenWhatsApp}
                    className={`w-full rounded-2xl p-3 flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer group ${
                      isDark
                        ? 'bg-[#141419] hover:bg-[#1a1a22] border border-white/[0.07] hover:border-white/15'
                        : 'bg-white border border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isDark
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}
                      >
                        <MessageCircle className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold transition-colors truncate ${
                            isDark
                              ? 'text-white group-hover:text-emerald-400'
                              : 'text-neutral-900 group-hover:text-emerald-600'
                          }`}
                        >
                          WhatsApp Oficial
                        </p>
                        <p
                          className={`text-[11px] truncate mt-0.5 font-mono ${
                            isDark ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          {company.whatsapp || 'Atendimento rápido'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                        isDark
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-900/50'
                          : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
                      }`}
                    >
                      <span>Conversar</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )}

                {/* Instagram */}
                {activeModules.instagram && company.instagram && (
                  <div
                    onClick={(e) => {
                      e.preventDefault()
                      const clean = company.instagram.replace(/^@/, '').trim()
                      window.open(`https://www.instagram.com/${clean}/`, '_blank', 'noopener,noreferrer')
                    }}
                    className={`w-full rounded-2xl p-3 flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer group ${
                      isDark
                        ? 'bg-[#141419] hover:bg-[#1a1a22] border border-white/[0.07] hover:border-white/15'
                        : 'bg-white border border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Instagram className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold transition-colors truncate ${
                            isDark
                              ? 'text-white group-hover:text-[#e6683c]'
                              : 'text-neutral-900 group-hover:text-[#bc1888]'
                          }`}
                        >
                          Instagram
                        </p>
                        <p
                          className={`text-[11px] truncate mt-0.5 font-mono ${
                            isDark ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          @{company.instagram.replace(/^@/, '')}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                        isDark
                          ? 'bg-pink-950/40 text-pink-300 border border-pink-500/30 group-hover:bg-pink-900/50'
                          : 'bg-pink-50 text-pink-700 group-hover:bg-pink-100'
                      }`}
                    >
                      <span>Seguir</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}

                {/* Wi-Fi Rápido */}
                {activeModules.wifi && company.wifi?.ssid && (
                  <div
                    onClick={handleOpenWifi}
                    className={`w-full rounded-2xl p-3 flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer group ${
                      isDark
                        ? 'bg-[#141419] hover:bg-[#1a1a22] border border-white/[0.07] hover:border-white/15'
                        : 'bg-white border border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isDark
                            ? 'bg-sky-950/40 text-sky-400 border-sky-500/20'
                            : 'bg-sky-50 text-sky-600 border-sky-100'
                        }`}
                      >
                        <Wifi className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold transition-colors truncate ${
                            isDark
                              ? 'text-white group-hover:text-sky-400'
                              : 'text-neutral-900 group-hover:text-sky-600'
                          }`}
                        >
                          Wi-Fi do Local
                        </p>
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isDark ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          Rede: {company.wifi.ssid}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                        isDark
                          ? 'bg-sky-950/40 text-sky-300 border border-sky-500/30 group-hover:bg-sky-900/50'
                          : 'bg-sky-50 text-sky-700 group-hover:bg-sky-100'
                      }`}
                    >
                      Conectar
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* RODAPÉ ELEGANTE DIRETO LINK                              */}
        {/* ========================================================= */}
        <footer
          className={`mt-10 pt-5 pb-6 border-t text-center text-[11px] px-6 space-y-1.5 ${
            isDark
              ? 'border-white/[0.06] text-neutral-500'
              : 'border-neutral-100 text-neutral-400'
          }`}
        >
          <p
            className={`font-semibold ${
              isDark ? 'text-neutral-300' : 'text-neutral-600'
            }`}
          >
            © {company.name}
          </p>
          <div
            className={`flex items-center justify-center gap-1.5 text-[10px] ${
              isDark ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <span className={isDark ? 'font-medium text-neutral-400' : 'font-medium text-neutral-500'}>
              DiretoLink • Uma conexão. Tudo mais perto.
            </span>
          </div>
        </footer>

        {/* ========================================================= */}
        {/* BARRA INFERIOR FIXA (MOBILE APP ACTION DOCK)              */}
        {/* ========================================================= */}
        <div
          className={`fixed bottom-0 inset-x-0 max-w-md mx-auto z-40 px-3.5 py-2.5 backdrop-blur-xl border-t flex items-center justify-between gap-2.5 transition-colors duration-200 ${
            isDark
              ? 'bg-[#0f0f14]/95 border-white/[0.08] shadow-[0_-8px_25px_rgba(0,0,0,0.6)]'
              : 'bg-white/95 border-neutral-200/80 shadow-[0_-8px_25px_rgba(0,0,0,0.08)]'
          }`}
        >
          {/* Ações Rápidas Secundárias */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }}
              className={`p-2 sm:p-2.5 rounded-xl transition-colors flex flex-col items-center gap-0.5 cursor-pointer ${
                isDark
                  ? 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              title="Início"
            >
              <Store className="w-4 h-4" />
              <span className="text-[9px] font-medium hidden sm:inline">Início</span>
            </button>

            {activeModules.services && (
              <button
                type="button"
                onClick={() => setIsServicesOpen(true)}
                className={`p-2 sm:p-2.5 rounded-xl transition-colors flex flex-col items-center gap-0.5 cursor-pointer ${
                  isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
                title="Serviços"
              >
                <Scissors className="w-4 h-4" />
                <span className="text-[9px] font-medium hidden sm:inline">Serviços</span>
              </button>
            )}

            {activeModules.loyalty && (
              <button
                type="button"
                onClick={() => setIsLoyaltyOpen(true)}
                className={`p-2 sm:p-2.5 rounded-xl transition-colors flex flex-col items-center gap-0.5 relative cursor-pointer ${
                  isDark
                    ? 'text-neutral-400 hover:text-amber-400 hover:bg-white/[0.05]'
                    : 'text-neutral-600 hover:text-amber-700 hover:bg-amber-50'
                }`}
                title="Fidelidade"
              >
                <Gift className="w-4 h-4 text-amber-500" />
                {hasAvailableReward && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
                <span className="text-[9px] font-medium hidden sm:inline">Fidelidade</span>
              </button>
            )}

            {activeModules.whatsapp && (
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className={`p-2 sm:p-2.5 rounded-xl transition-colors flex flex-col items-center gap-0.5 cursor-pointer ${
                  isDark
                    ? 'text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.05]'
                    : 'text-emerald-600 hover:bg-emerald-50'
                }`}
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-[9px] font-medium hidden sm:inline">Contato</span>
              </button>
            )}
          </div>

          {/* Botão Principal de Conversão */}
          {activeModules.appointments ? (
            <button
              type="button"
              onClick={() => {
                setBookingService(null)
                setIsBookingOpen(true)
              }}
              className="flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate"
              style={{
                background: gradientBg,
                color: contrastText,
              }}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Agendar Horário</span>
            </button>
          ) : activeModules.whatsapp ? (
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Falar no WhatsApp</span>
            </button>
          ) : activeModules.services ? (
            <button
              type="button"
              onClick={() => setIsServicesOpen(true)}
              className="flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate"
              style={{
                background: gradientBg,
                color: contrastText,
              }}
            >
              <Scissors className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Ver Serviços</span>
            </button>
          ) : activeModules.loyalty ? (
            <button
              type="button"
              onClick={() => setIsLoyaltyOpen(true)}
              className="flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate"
              style={{
                background: gradientBg,
                color: contrastText,
              }}
            >
              <Gift className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Meu Cartão</span>
            </button>
          ) : null}
        </div>

        {/* ========================================================= */}
        {/* MODAIS E SHEETS (TODAS AS FUNCIONALIDADES PRESERVADAS)    */}
        {/* ========================================================= */}
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
