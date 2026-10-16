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
  Package,
  ShoppingBag,
  UtensilsCrossed,
  Minus,
  Plus,
  Layers,
  Flame,
  Tag,
  LayoutGrid,
  Pizza,
  Coffee,
  Cake,
} from 'lucide-react'
import { Company, CompanyService, CompanyProduct, MenuItem } from '@/types/platform'
import { LoyaltySheet } from './loyalty-sheet'
import { WifiSheet } from './wifi-sheet'
import { FeedbackSheet } from './feedback-sheet'
import { ServicesSheet } from './services-sheet'
import { BookingSheet } from './booking-sheet'
import { ProductsSheet } from './products-sheet'
import { ProductDetailModal } from './product-detail-modal'
import { MenuItemModal, CartItem } from './menu-item-modal'
import { MenuCartDrawer } from './menu-cart-drawer'
import {
  getLocalCustomerSession,
  getCustomerByPhone,
  getCompanyServices,
  fetchCompanyServicesFromServer,
  getCompanyProducts,
  fetchCompanyProductsFromServer,
  getCompanyMenuItems,
  fetchCompanyMenuItemsFromServer,
  DATA_CHANGE_EVENT,
} from '@/lib/storage'
import {
  sanitizeHex,
  getGradientContrastTextColor,
  hexToRgba,
} from '@/lib/colors'

interface PublicCompanyViewProps {
  company: Company
  initialProducts?: CompanyProduct[]
  initialServices?: CompanyService[]
  initialMenuItems?: MenuItem[]
}

interface FeatureItem {
  id: string
  title: string
  subtitle?: string
  badgeText?: string
  icon: React.ReactNode
  iconContainerClass?: string
  iconContainerStyle?: React.CSSProperties
  featuredBadge?: string
  featuredTitle?: string
  featuredDescription?: string
  featuredCta?: string
  featuredIcon?: React.ReactNode
  themeBg?: string
  onClick: () => void
}

const GoogleColoredIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
)

export const PublicCompanyView: React.FC<PublicCompanyViewProps> = ({
  company,
  initialProducts = [],
  initialServices = [],
  initialMenuItems = [],
}) => {
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
  const [services, setServices] = useState<CompanyService[]>(initialServices)
  const [products, setProducts] = useState<CompanyProduct[]>(initialProducts)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() =>
    initialMenuItems.length > 0 ? initialMenuItems : getCompanyMenuItems(company.id)
  )
  const [selectedVitrineCategory, setSelectedVitrineCategory] = useState<string>('Todos')
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('Todos')
  const [isProductsSheetOpen, setIsProductsSheetOpen] = useState(false)
  const [selectedProductDetail, setSelectedProductDetail] = useState<CompanyProduct | null>(null)
  const [selectedMenuItemDetail, setSelectedMenuItemDetail] = useState<MenuItem | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartInitialStep, setCartInitialStep] = useState<'items' | 'delivery'>('items')
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

  // Products data sync
  useEffect(() => {
    setProducts(getCompanyProducts(company.id))
    fetchCompanyProductsFromServer(company.id).then((prds) => {
      if (Array.isArray(prds) && prds.length > 0) setProducts(prds)
    })
    const updateProducts = () => {
      setProducts(getCompanyProducts(company.id))
    }
    window.addEventListener(DATA_CHANGE_EVENT, updateProducts)
    window.addEventListener('storage', updateProducts)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, updateProducts)
      window.removeEventListener('storage', updateProducts)
    }
  }, [company.id])

  // Menu items data sync
  useEffect(() => {
    setMenuItems(getCompanyMenuItems(company.id))
    fetchCompanyMenuItemsFromServer(company.id).then((items) => {
      if (Array.isArray(items) && items.length > 0) setMenuItems(items)
    })
    const updateMenu = () => {
      setMenuItems(getCompanyMenuItems(company.id))
    }
    window.addEventListener(DATA_CHANGE_EVENT, updateMenu)
    window.addEventListener('storage', updateMenu)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, updateMenu)
      window.removeEventListener('storage', updateMenu)
    }
  }, [company.id])

  const isExternalMenu = useMemo(() => {
    if (company.menuMode === 'external') return true
    if (company.menuMode === 'internal') return false
    return Boolean(company.menuUrl) && menuItems.length === 0
  }, [company.menuMode, company.menuUrl, menuItems.length])

  const customerPhone = customerSession.phone
  const customerName = customerSession.name
  const customerPoints = customerSession.points
  const hasAvailableReward = customerSession.hasReward

  // Open Google Review
  const handleGoogleReview = useCallback(() => {
    if (company.googleReviewUrl) {
      window.open(company.googleReviewUrl, '_blank', 'noopener,noreferrer')
    } else {
      const q = encodeURIComponent(`${company.name} avaliações`)
      window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener,noreferrer')
    }
  }, [company.googleReviewUrl, company.name])

  // Open Menu (External link or Scroll to internal cardápio)
  const handleOpenMenu = useCallback(() => {
    if (isExternalMenu && company.menuUrl) {
      window.open(company.menuUrl, '_blank', 'noopener,noreferrer')
    } else {
      const el = document.getElementById('secao-cardapio')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [isExternalMenu, company.menuUrl])

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

  // Open WhatsApp
  const handleOpenWhatsApp = useCallback(() => {
    const raw = company.whatsapp || ''
    const phoneClean = raw.replace(/\D/g, '')
    if (phoneClean) {
      const phoneWithDdi = phoneClean.startsWith('55') ? phoneClean : `55${phoneClean}`
      const msg = encodeURIComponent(
        `Olá! Estou visitando a ${company.name} e gostaria de falar com vocês.`
      )
      window.open(`https://wa.me/${phoneWithDdi}?text=${msg}`, '_blank', 'noopener,noreferrer')
    } else {
      handleOpenLocation()
    }
  }, [company.whatsapp, company.name, handleOpenLocation])

  // Open Instagram
  const handleOpenInstagram = useCallback(() => {
    if (!company.instagram) return
    const raw = company.instagram.trim().replace(/^@/, '')
    const targetUrl = /^https?:\/\//i.test(company.instagram.trim())
      ? company.instagram.trim()
      : `https://instagram.com/${raw}`
    window.open(targetUrl, '_blank', 'noopener,noreferrer')
  }, [company.instagram])

  // Open External Product Catalog
  const handleOpenCatalogExternal = useCallback(() => {
    if (company.productCatalog?.externalUrl) {
      let raw = company.productCatalog.externalUrl.trim()
      if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
        raw = `https://${raw}`
      }
      window.open(raw, '_blank', 'noopener,noreferrer')
    }
  }, [company.productCatalog])

  // Handler para iniciar o agendamento (DiretoLink ou WhatsApp)
  const handleInitiateBooking = useCallback(
    (service?: CompanyService | null) => {
      const isWhatsAppMode = company.bookingSettings?.mode === 'whatsapp'

      if (isWhatsAppMode) {
        const rawPhone = company.whatsapp || ''
        const cleanPhone = rawPhone.replace(/\D/g, '')
        if (cleanPhone) {
          const phoneWithDdi = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
          let template = company.bookingSettings?.whatsappMessageTemplate?.trim()
          if (!template) {
            if (service?.name) {
              template =
                'Olá! Gostaria de agendar um horário para {servico} na {empresa}. Poderia me informar os horários disponíveis?'
            } else {
              template =
                'Olá! Gostaria de agendar um horário na {empresa}. Poderia me informar os horários disponíveis?'
            }
          }

          const message = template
            .replace(/{empresa}/gi, company.name)
            .replace(/{servico}/gi, service?.name || 'um serviço')

          window.open(
            `https://wa.me/${phoneWithDdi}?text=${encodeURIComponent(message)}`,
            '_blank',
            'noopener,noreferrer'
          )
          return
        }
      }

      // Modo DiretoLink padrão
      setBookingService(service || null)
      setIsBookingOpen(true)
    },
    [
      company.bookingSettings?.mode,
      company.bookingSettings?.whatsappMessageTemplate,
      company.whatsapp,
      company.name,
    ]
  )

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
    const isModEnabled = (key: string, fallback: boolean) => {
      if (company.modules && typeof company.modules[key as keyof typeof company.modules] === 'boolean') {
        return Boolean(company.modules[key as keyof typeof company.modules])
      }
      return fallback
    }

    return {
      products: isModEnabled('products', products.length > 0),
      appointments: isModEnabled('appointments', false),
      services: isModEnabled('services', services.length > 0),
      loyalty: isModEnabled('loyalty', Boolean(company.loyaltyProgram?.isActive ?? true)),
      whatsapp: isModEnabled('whatsapp', Boolean(company.whatsapp)),
      googleReview: isModEnabled('googleReview', Boolean(company.googleReviewUrl || company.rating)),
      menu: isModEnabled(
        'menu',
        company.menuMode === 'internal' ||
          Boolean(company.menuUrl) ||
          menuItems.length > 0
      ),
      wifi: isModEnabled('wifi', Boolean(company.wifi?.ssid)),
      location: isModEnabled('location', Boolean(company.locationUrl || company.addressText)),
      feedback: isModEnabled('feedback', false),
      instagram: isModEnabled('instagram', Boolean(company.instagram)),
    }
  }, [company, products.length, services.length, menuItems.length])

  // Active menu items
  const activeMenuItemsList = useMemo(() => {
    return menuItems
      .filter((i) => i.isActive !== false)
      .sort((a, b) => {
        if (Array.isArray(company.menuItemsOrder) && company.menuItemsOrder.length > 0) {
          const idxA = company.menuItemsOrder.indexOf(a.id)
          const idxB = company.menuItemsOrder.indexOf(b.id)
          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return -1
          if (idxB !== -1) return 1
        }
        const orderA = typeof a.order === 'number' ? a.order : 0
        const orderB = typeof b.order === 'number' ? b.order : 0
        if (orderA !== orderB) return orderA - orderB
        return (b.createdAt || '').localeCompare(a.createdAt || '')
      })
  }, [menuItems, company.menuItemsOrder])

  const menuCategories = useMemo(() => {
    const cats = Array.from(
      new Set(activeMenuItemsList.map((i) => i.category || 'Geral'))
    ).filter(Boolean)
    return ['Todos', ...cats]
  }, [activeMenuItemsList])

  const displayedMenuItems = useMemo(() => {
    if (selectedMenuCategory === 'Todos') {
      return activeMenuItemsList
    }
    return activeMenuItemsList.filter((i) => i.category === selectedMenuCategory)
  }, [activeMenuItemsList, selectedMenuCategory])

  // Cart operations
  const handleAddToCart = useCallback((item: CartItem) => {
    setCart((prev) => [...prev, item])
    setSelectedMenuItemDetail(null)
    setCartInitialStep('items')
    setIsCartOpen(true)
  }, [])

  const handleDirectOrderWhatsApp = useCallback(
    (item: CartItem) => {
      setCart((prev) => [...prev, item])
      setSelectedMenuItemDetail(null)
      setCartInitialStep('delivery')
      setIsCartOpen(true)
    },
    []
  )

  const handleUpdateCartQty = useCallback((cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== cartItemId))
    } else {
      setCart((prev) =>
        prev.map((i) => {
          if (i.id === cartItemId) {
            return {
              ...i,
              quantity: newQty,
              totalPrice: i.unitPrice * newQty,
            }
          }
          return i
        })
      )
    }
  }, [])

  const handleRemoveCartItem = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId))
  }, [])

  const handleClearCart = useCallback(() => {
    setCart([])
  }, [])

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

  // Active services list
  const activeServicesList = useMemo(() => {
    return services
      .filter((s) => s.isActive !== false)
      .sort((a, b) => {
        if (Array.isArray(company.servicesOrder) && company.servicesOrder.length > 0) {
          const idxA = company.servicesOrder.indexOf(a.id)
          const idxB = company.servicesOrder.indexOf(b.id)
          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return -1
          if (idxB !== -1) return 1
        }
        const orderA = typeof a.order === 'number' ? a.order : 0
        const orderB = typeof b.order === 'number' ? b.order : 0
        if (orderA !== orderB) return orderA - orderB
        return (a.name || '').localeCompare(b.name || '')
      })
  }, [services, company.servicesOrder])

  // Active products list
  const activeProductsList = useMemo(() => {
    return products
      .filter((p) => p.isActive !== false)
      .sort((a, b) => {
        if (Array.isArray(company.productsOrder) && company.productsOrder.length > 0) {
          const idxA = company.productsOrder.indexOf(a.id)
          const idxB = company.productsOrder.indexOf(b.id)
          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return -1
          if (idxB !== -1) return 1
        }
        const orderA = typeof a.order === 'number' ? a.order : 0
        const orderB = typeof b.order === 'number' ? b.order : 0
        if (orderA !== orderB) return orderA - orderB
        return (b.createdAt || '').localeCompare(a.createdAt || '')
      })
  }, [products, company.productsOrder])

  // Category filters for the on-page vitrine
  const vitrineCategories = useMemo(() => {
    const cats = Array.from(
      new Set(
        activeProductsList
          .map((p) => p.category?.trim() || 'Geral')
          .filter(Boolean)
      )
    )
    return cats.length > 1 ? ['Todos', ...cats] : []
  }, [activeProductsList])

  const displayedVitrineProducts = useMemo(() => {
    if (selectedVitrineCategory === 'Todos') {
      return activeProductsList
    }
    return activeProductsList.filter(
      (p) => (p.category?.trim() || 'Geral') === selectedVitrineCategory
    )
  }, [activeProductsList, selectedVitrineCategory])

  // Flags to detect if full dedicated sections are present on page
  const isExternalCatalog = company.productCatalog?.mode === 'external'
  const hasFullServicesSection = Boolean(activeModules.services && activeServicesList.length > 0)
  const hasFullLoyaltySection = Boolean(activeModules.loyalty && company.loyaltyProgram?.isActive)
  const hasFullProductsSection = Boolean(activeModules.products && !isExternalCatalog && activeProductsList.length > 0)

  // Interface para os 4 cards de destaque flutuantes (layout 2x2 no celular)
  interface HighlightCardItem {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    iconContainerClass: string
    iconContainerStyle?: React.CSSProperties
    onClick: () => void
    isActive: boolean
    badgeText?: string
  }

  // Definições de todos os recursos disponíveis para os cards de destaque
  const availableHighlightCards = useMemo<Record<string, HighlightCardItem>>(() => {
    return {
      whatsapp: {
        id: 'whatsapp',
        title: 'WhatsApp',
        description: 'Atendimento direto',
        icon: <MessageCircle className="w-5 h-5 text-[#25D366]" />,
        iconContainerClass: isDark
          ? 'bg-emerald-500/15 border border-emerald-500/25'
          : 'bg-emerald-50 border border-emerald-200/80',
        iconContainerStyle: { color: '#25D366' },
        onClick: handleOpenWhatsApp,
        isActive: Boolean(activeModules.whatsapp),
      },
      appointments: {
        id: 'appointments',
        title: 'Agendamento',
        description: company.bookingSettings?.mode === 'whatsapp'
          ? 'Agende pelo WhatsApp'
          : 'Reserve seu horário online',
        icon: <Calendar className="w-5 h-5 text-indigo-400" />,
        iconContainerClass: isDark
          ? 'bg-indigo-500/15 border border-indigo-500/25'
          : 'bg-indigo-50 border border-indigo-200/80',
        iconContainerStyle: { color: '#6366F1' },
        onClick: () => {
          handleInitiateBooking(null)
        },
        isActive: Boolean(activeModules.appointments),
      },
      googleReview: {
        id: 'googleReview',
        title: 'Avaliações do Google',
        description: `${company.rating ? company.rating.toFixed(1) : '5.0'}★ no Google`,
        icon: <GoogleColoredIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" />,
        iconContainerClass: isDark
          ? 'bg-neutral-800/90 border border-white/10'
          : 'bg-white border border-neutral-200/80 shadow-2xs',
        onClick: handleGoogleReview,
        isActive: Boolean(activeModules.googleReview),
      },
      loyalty: {
        id: 'loyalty',
        title: 'Fidelidade',
        description: hasAvailableReward
          ? 'Prêmio pronto para resgate!'
          : customerPoints !== null
          ? `${customerPoints}/${loyaltyProgram.goalPoints} pontos`
          : 'Ganhe prêmios e bônus',
        badgeText: hasAvailableReward ? 'Prêmio!' : undefined,
        icon: <Gift className="w-5 h-5 text-orange-400" />,
        iconContainerClass: isDark
          ? 'bg-orange-500/15 border border-orange-500/25'
          : 'bg-orange-50 border border-orange-200/80',
        iconContainerStyle: { color: '#F97316' },
        onClick: () => setIsLoyaltyOpen(true),
        isActive: Boolean(activeModules.loyalty),
      },
      menu: {
        id: 'menu',
        title: 'Cardápio Digital',
        description: isExternalMenu
          ? 'Abrir cardápio oficial'
          : activeMenuItemsList.length > 0
          ? `${activeMenuItemsList.length} itens disponíveis`
          : 'Ver opções e pedir',
        icon: <BookOpen className="w-5 h-5 text-teal-400" />,
        iconContainerClass: isDark
          ? 'bg-teal-500/15 border border-teal-500/25'
          : 'bg-teal-50 border border-teal-200/80',
        iconContainerStyle: { color: '#0D9488' },
        onClick: handleOpenMenu,
        isActive: Boolean(activeModules.menu),
      },
      products: {
        id: 'products',
        title: isExternalCatalog
          ? (company.productCatalog?.externalButtonText || 'Ver Catálogo')
          : 'Catálogo de Produtos',
        description: isExternalCatalog
          ? 'Ver catálogo oficial'
          : activeProductsList.length > 0
          ? `${activeProductsList.length} itens disponíveis`
          : 'Vitrine de produtos',
        icon: <ShoppingBag className="w-5 h-5 text-violet-400" />,
        iconContainerClass: isDark
          ? 'bg-violet-500/15 border border-violet-500/25'
          : 'bg-violet-50 border border-violet-200/80',
        iconContainerStyle: { color: '#8B5CF6' },
        onClick: isExternalCatalog ? handleOpenCatalogExternal : () => setIsProductsSheetOpen(true),
        isActive: Boolean(activeModules.products),
      },
      services: {
        id: 'services',
        title: 'Nossos Serviços',
        description: activeServicesList.length > 0
          ? `${activeServicesList.length} opções disponíveis`
          : 'Tabela de serviços',
        icon: <Scissors className="w-5 h-5 text-purple-400" />,
        iconContainerClass: isDark
          ? 'bg-purple-500/15 border border-purple-500/25'
          : 'bg-purple-50 border border-purple-200/80',
        iconContainerStyle: { color: '#8B5CF6' },
        onClick: () => setIsServicesOpen(true),
        isActive: Boolean(activeModules.services),
      },
      location: {
        id: 'location',
        title: 'Localização',
        description: company.addressText ? 'Como chegar até nós' : 'Ver rotas no mapa',
        icon: <Navigation className="w-5 h-5 text-rose-400" />,
        iconContainerClass: isDark
          ? 'bg-rose-500/15 border border-rose-500/25'
          : 'bg-rose-50 border border-rose-200/80',
        iconContainerStyle: { color: '#EA4335' },
        onClick: handleOpenLocation,
        isActive: Boolean(activeModules.location),
      },
      wifi: {
        id: 'wifi',
        title: 'Wi-Fi Grátis',
        description: company.wifi?.ssid ? `Rede: ${company.wifi.ssid}` : 'Toque para conectar',
        icon: <Wifi className="w-5 h-5 text-sky-400" />,
        iconContainerClass: isDark
          ? 'bg-sky-500/15 border border-sky-500/25'
          : 'bg-sky-50 border border-sky-200/80',
        iconContainerStyle: { color: '#0284C7' },
        onClick: handleOpenWifi,
        isActive: Boolean(activeModules.wifi),
      },
      feedback: {
        id: 'feedback',
        title: 'Feedback Privado',
        description: 'Envie um recado à gerência',
        icon: <MessageSquareHeart className="w-5 h-5 text-pink-400" />,
        iconContainerClass: isDark
          ? 'bg-pink-500/15 border border-pink-500/25'
          : 'bg-pink-50 border border-pink-200/80',
        iconContainerStyle: { color: '#EC4899' },
        onClick: () => setIsFeedbackOpen(true),
        isActive: Boolean(activeModules.feedback),
      },
      instagram: {
        id: 'instagram',
        title: 'Instagram',
        description: company.instagram ? `@${company.instagram.replace(/^@/, '')}` : 'Siga nosso perfil oficial',
        icon: <Instagram className="w-5 h-5 text-white" />,
        iconContainerClass: 'shadow-xs border border-white/10',
        iconContainerStyle: {
          background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
          color: '#ffffff',
        },
        onClick: handleOpenInstagram,
        isActive: Boolean(activeModules.instagram),
      },
    }
  }, [
    activeModules,
    company,
    isDark,
    isExternalMenu,
    isExternalCatalog,
    activeMenuItemsList.length,
    activeProductsList.length,
    activeServicesList.length,
    customerPoints,
    hasAvailableReward,
    loyaltyProgram.goalPoints,
    handleOpenWhatsApp,
    handleGoogleReview,
    handleOpenMenu,
    handleOpenCatalogExternal,
    handleOpenLocation,
    handleOpenWifi,
    handleOpenInstagram,
    handleInitiateBooking,
  ])

  // Resolve os 4 cards de destaque em layout 2x2 no celular
  const featuredCardsList = useMemo<HighlightCardItem[]>(() => {
    const configured = company.featuredCards && company.featuredCards.length > 0
      ? company.featuredCards
      : ['whatsapp', 'appointments', 'googleReview', 'loyalty']

    const list: HighlightCardItem[] = []
    const seen = new Set<string>()

    // 1. Prioriza os configurados que estão ativos
    for (const id of configured) {
      const card = availableHighlightCards[id]
      if (card && card.isActive && !seen.has(id)) {
        list.push(card)
        seen.add(id)
        if (list.length === 4) break
      }
    }

    // 2. Se houver menos de 4, completa com os primeiros módulos ativos disponíveis
    if (list.length < 4) {
      const fallbackOrder = [
        'whatsapp',
        'appointments',
        'googleReview',
        'loyalty',
        'menu',
        'products',
        'services',
        'location',
        'wifi',
        'feedback',
        'instagram',
      ]
      for (const id of fallbackOrder) {
        if (list.length >= 4) break
        const card = availableHighlightCards[id]
        if (card && card.isActive && !seen.has(id)) {
          list.push(card)
          seen.add(id)
        }
      }
    }

    return list.slice(0, 4)
  }, [company.featuredCards, availableHighlightCards])

  // Calculate loyalty percentage
  const loyaltyProgressPercent = useMemo(() => {
    if (customerPoints === null) return 0
    const goal = loyaltyProgram.goalPoints || 10
    return Math.min(100, Math.round((customerPoints / goal) * 100))
  }, [customerPoints, loyaltyProgram.goalPoints])

  // Public Page Dynamic Sections Order
  const effectivePageOrder = useMemo(() => {
    const defaultOrder = [
      'whatsapp',
      'services',
      'products',
      'appointments',
      'menu',
      'loyalty',
      'googleReview',
      'location',
      'wifi',
      'feedback',
      'instagram',
    ]
    const saved = Array.isArray(company.publicSectionsOrder) && company.publicSectionsOrder.length > 0
      ? company.publicSectionsOrder
      : Array.isArray(company.cardOrder) ? company.cardOrder : []
    const result: string[] = []

    saved.forEach((key) => {
      const normalizedKey = key === 'reviews' ? 'googleReview' : key === 'contact' ? 'location' : key
      if (defaultOrder.includes(normalizedKey) && !result.includes(normalizedKey)) {
        result.push(normalizedKey)
      }
    })

    defaultOrder.forEach((key) => {
      if (!result.includes(key)) {
        result.push(key)
      }
    })

    return result
  }, [company.publicSectionsOrder, company.cardOrder])

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
          <div className="relative w-full h-52 sm:h-56 bg-neutral-950 overflow-hidden">
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
                {/* Overlay sutil para foco e alto contraste da logo no centro */}
                <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                {/* Gradiente escuro concentrado na base da foto para transição suave com o fundo */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-14 sm:h-16 pointer-events-none ${
                    isDark
                      ? 'bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/60 to-transparent'
                      : 'bg-gradient-to-t from-white via-white/60 to-transparent'
                  }`}
                />
              </>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center relative overflow-hidden"
                style={{ background: gradientBg }}
              >
                <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/20 blur-xl pointer-events-none" />
                <div className="absolute right-0 bottom-0 w-28 h-28 rounded-full bg-black/25 blur-xl pointer-events-none" />
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

            {/* LOGO CENTRALIZADA NO MEIO DA CAPA (A capa atrás e a logo na frente no centro) */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div
                className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-2xl p-[3px] shadow-2xl overflow-hidden flex items-center justify-center pointer-events-auto transition-transform hover:scale-105"
                style={{
                  background: gradientBg,
                  boxShadow: `0 12px 28px -4px ${hexToRgba(primaryColor, isDark ? 0.65 : 0.45)}`,
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
            </div>
          </div>

          {/* ======================================================= */}
          {/* 2. 4 CARDS DE DESTAQUE NO LUGAR DA LOGO FLUTUANTE        */}
          {/* 4 CARDS UM DO LADO DO OUTRO EM TAMANHOS IGUAIS          */}
          {/* ======================================================= */}
          {featuredCardsList.length > 0 && (
            <div className="px-2.5 sm:px-4 -mt-7 sm:-mt-8 relative z-20">
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {featuredCardsList.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={card.onClick}
                    className={`w-full text-center p-1.5 sm:p-2 rounded-2xl border transition-all duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer group flex flex-col items-center justify-center gap-1 sm:gap-1.5 shadow-2xs hover:shadow-md select-none relative overflow-hidden h-[68px] sm:h-[72px] ${
                      isDark
                        ? 'bg-[#141419]/95 hover:bg-[#1a1a22] border-white/[0.08] hover:border-white/20'
                        : 'bg-white/95 hover:bg-neutral-50/90 border-neutral-200/90 hover:border-neutral-300'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {/* Badge flutuante (ex: Prêmio!) */}
                    {card.badgeText && (
                      <span className="absolute top-1 right-1 px-1 py-0.2 rounded-full text-[7.5px] font-black bg-amber-500 text-white shadow-2xs leading-none">
                        {card.badgeText}
                      </span>
                    )}

                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${
                        card.iconContainerClass
                      }`}
                      style={card.iconContainerStyle}
                    >
                      {card.icon}
                    </div>

                    <span
                      className={`text-[10px] sm:text-xs font-bold tracking-tight truncate w-full text-center leading-tight block px-0.5 ${
                        isDark ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {card.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 3. IDENTIDADE DA EMPRESA (NOME, STATUS, AVALIAÇÕES)     */}
          {/* ======================================================= */}
          <div className="px-4 mt-3 sm:mt-4 relative z-10 flex flex-col items-center text-center">
            {/* Nome da Empresa */}
            <h1
              className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {company.name}
            </h1>

            {/* Tagline da Empresa */}
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
            <div className="flex items-center justify-center flex-wrap gap-2 mt-2">
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
          </div>
        </div>

        {/* ========================================================= */}
        {/* CORPO PRINCIPAL COM CONTEÚDO (ORDEM DINÂMICA)            */}
        {/* ========================================================= */}
        <div className="px-4 sm:px-5 mt-5 flex-1 flex flex-col space-y-6">

          {/* ======================================================= */}
          {/* 4. SEÇÕES E CARDS DA PÁGINA PÚBLICA (ORDEM DINÂMICA)     */}
          {/* ======================================================= */}
          {(() => {
            const sectionElements: Record<string, React.ReactNode> = {
              whatsapp: activeModules.whatsapp ? (
                <div
                  key="whatsapp"
                  className={`rounded-3xl p-4 sm:p-4.5 border flex items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-[#141419] border-white/[0.08] shadow-sm'
                      : 'bg-white border-neutral-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-[#25D366]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        WhatsApp Oficial
                      </h4>
                      <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {company.whatsapp ? `Atendimento: ${company.whatsapp}` : 'Fale diretamente com nossa equipe'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shrink-0 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Conversar</span>
                  </button>
                </div>
              ) : null,
              services: activeModules.services ? (
                activeServicesList.length > 0 ? (
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
                          handleInitiateBooking(srv)
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

                        {/* Informações Essenciais do Serviço: Nome, Duração, Preço e Botão */}
                        <div className="min-w-0 flex-1 flex flex-col justify-between self-stretch py-0.5">
                          <div>
                            <h4
                              className={`font-black text-sm sm:text-base leading-snug transition-colors line-clamp-2 ${
                                isDark
                                  ? 'text-white group-hover:text-neutral-100'
                                  : 'text-neutral-900 group-hover:text-neutral-950'
                              }`}
                            >
                              {srv.name}
                            </h4>
                            {srv.durationMinutes && (
                              <div
                                className={`inline-flex items-center gap-1 text-[11px] font-medium mt-1 ${
                                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                <span>{srv.durationMinutes} min</span>
                              </div>
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
                                  handleInitiateBooking(srv)
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
          ) : (
            <div
              key="services-card"
              className={`rounded-3xl p-4.5 sm:p-5 border space-y-3 ${
                isDark ? 'bg-[#141419] border-white/[0.08] shadow-sm' : 'bg-white border-neutral-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Nossos Serviços
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Consulte nossos serviços e agende seu atendimento
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (activeModules.appointments) {
                    handleInitiateBooking(null)
                  } else {
                    handleOpenWhatsApp()
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                style={{ backgroundColor: primaryColor }}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Consultar Serviços</span>
              </button>
            </div>
          )) : null,
              products: (activeProductsList.length > 0 && !isExternalCatalog && company.modules?.products !== false) ? (
            <div
              className={`rounded-3xl p-4.5 sm:p-5 space-y-4 border ${
                isDark
                  ? 'bg-[#121217] border-white/[0.08] shadow-sm'
                  : 'bg-white border-neutral-200/80 shadow-2xs'
              }`}
            >
              {/* Cabeçalho da Vitrine */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider block"
                      style={{ color: primaryColor }}
                    >
                      Vitrine de Produtos
                    </span>
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm sm:text-base font-black tracking-tight ${
                          isDark ? 'text-white' : 'text-neutral-900'
                        }`}
                      >
                        Nossos Produtos
                      </h3>
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: hexToRgba(primaryColor, isDark ? 0.2 : 0.1),
                          color: isDark ? '#ffffff' : primaryColor,
                        }}
                      >
                        {activeProductsList.length}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProductsSheetOpen(true)}
                  className="text-xs font-bold transition-opacity hover:opacity-85 flex items-center gap-0.5 cursor-pointer"
                  style={{ color: primaryColor }}
                >
                  <span>Ver todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Filtros de Categoria (se houver mais de uma categoria) */}
              {vitrineCategories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                  {vitrineCategories.map((cat) => {
                    const isSelected = selectedVitrineCategory === cat
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedVitrineCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white shadow-xs'
                            : isDark
                            ? 'bg-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/10'
                            : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                        }`}
                        style={isSelected ? { backgroundColor: primaryColor } : undefined}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Vitrine Visual de Produtos: Cards em Grid de 2 colunas */}
              <div className="grid grid-cols-2 gap-3">
                {displayedVitrineProducts.slice(0, 6).map((prod) => {
                  const isConsult = prod.priceType === 'consult' || prod.price == null
                  const hasPromo = !isConsult && prod.promotionalPrice != null && prod.promotionalPrice > 0
                  const discountPercent =
                    hasPromo && prod.price && prod.price > 0 && prod.promotionalPrice
                      ? Math.round((1 - prod.promotionalPrice / prod.price) * 100)
                      : null
                  const prodPhoto =
                    prod.photoUrl ||
                    (prod as unknown as { imageUrl?: string; image?: string; photo?: string }).imageUrl ||
                    (prod as unknown as { image?: string }).image ||
                    (prod as unknown as { photo?: string }).photo ||
                    ''

                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProductDetail(prod)}
                      className={`group rounded-2xl border p-2.5 flex flex-col justify-between transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#181820] border-white/[0.06] hover:border-white/20'
                          : 'bg-neutral-50/80 border-neutral-200/90 hover:border-neutral-300 hover:bg-white shadow-2xs'
                      }`}
                    >
                      {/* Foto do Produto */}
                      <div
                        className={`relative w-full aspect-square rounded-xl overflow-hidden mb-2.5 border flex items-center justify-center ${
                          isDark ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-200'
                        }`}
                      >
                        {prodPhoto ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={prodPhoto}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-neutral-400 opacity-60" />
                        )}

                        {hasPromo && (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                            {discountPercent ? `-${discountPercent}%` : 'Promo'}
                          </span>
                        )}

                        {prod.isAvailable === false && (
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-black/75 text-rose-300 border border-rose-500/30">
                            Esgotado
                          </span>
                        )}
                      </div>

                      {/* Nome, Categoria & Preço */}
                      <div className="space-y-1 flex-1 flex flex-col justify-between">
                        <div>
                          {prod.category && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                              {prod.category}
                            </span>
                          )}
                          <h4
                            className={`font-bold text-xs leading-snug line-clamp-2 ${
                              isDark ? 'text-white' : 'text-neutral-900'
                            }`}
                          >
                            {prod.name}
                          </h4>
                          {prod.description && (
                            <p
                              className={`text-[10px] line-clamp-1 mt-0.5 ${
                                isDark ? 'text-neutral-400' : 'text-neutral-500'
                              }`}
                            >
                              {prod.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-1.5">
                          {isConsult ? (
                            <span className="text-xs font-bold text-amber-400 block truncate">
                              Sob consulta
                            </span>
                          ) : hasPromo ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-emerald-400 font-mono">
                                R$ {prod.promotionalPrice?.toFixed(2).replace('.', ',')}
                              </span>
                              <span
                                className={`text-[10px] line-through font-mono ${
                                  isDark ? 'text-neutral-500' : 'text-neutral-400'
                                }`}
                              >
                                R$ {prod.price?.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`text-xs font-black font-mono block ${
                                isDark ? 'text-white' : 'text-neutral-900'
                              }`}
                            >
                              R$ {prod.price?.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação do Card */}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedProductDetail(prod)
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isDark
                              ? 'bg-white/10 hover:bg-white/15 text-white'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200/80'
                          }`}
                        >
                          <span>Detalhes</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>

                        {company.whatsapp && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const raw = company.whatsapp || ''
                              const clean = raw.replace(/\D/g, '')
                              const phoneWithDdi = clean.startsWith('55') ? clean : `55${clean}`
                              const msg = encodeURIComponent(
                                `Olá! Gostei do produto "${prod.name}" no DiretoLink e gostaria de saber mais.`
                              )
                              window.open(
                                `https://wa.me/${phoneWithDdi}?text=${msg}`,
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }}
                            className="p-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center transition-transform active:scale-95 shadow-xs cursor-pointer"
                            title="Pedir no WhatsApp"
                            aria-label="Pedir no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Botão de Ver Catálogo Completo */}
              {activeProductsList.length > 2 && (
                <button
                  type="button"
                  onClick={() => setIsProductsSheetOpen(true)}
                  className={`w-full py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-neutral-100'
                  }`}
                  style={{
                    backgroundColor: hexToRgba(primaryColor, isDark ? 0.1 : 0.04),
                    borderColor: hexToRgba(primaryColor, isDark ? 0.3 : 0.2),
                    color: isDark ? '#ffffff' : primaryColor,
                  }}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Ver catálogo completo ({activeProductsList.length} itens)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (activeModules.products && isExternalCatalog && company.productCatalog?.externalUrl) ? (
            <div
              className={`rounded-3xl p-4.5 sm:p-5 border flex items-center justify-between gap-3 ${
                isDark
                  ? 'bg-[#121217] border-white/[0.08] shadow-sm'
                  : 'bg-white border-neutral-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4
                    className={`font-black text-xs sm:text-sm truncate ${
                      isDark ? 'text-white' : 'text-neutral-900'
                    }`}
                  >
                    {company.productCatalog?.externalButtonText || 'Ver Catálogo'}
                  </h4>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isDark ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    Acesse nossa loja oficial e veja todos os produtos disponíveis
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenCatalogExternal}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-90 active:scale-95 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <span>{company.productCatalog?.externalButtonText || 'Ver Catálogo'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          ) : activeModules.products ? (
            <div
              key="products-card"
              className={`rounded-3xl p-4.5 sm:p-5 border flex items-center justify-between gap-3 ${
                isDark ? 'bg-[#121217] border-white/[0.08] shadow-sm' : 'bg-white border-neutral-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className={`font-black text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Catálogo de Produtos
                  </h4>
                  <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Conheça nossa seleção de produtos disponíveis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductsSheetOpen(true)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-90 active:scale-95 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Ver Produtos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null,
              appointments: (activeModules.appointments && (
                <div
                  key="appointments"
                  className={`rounded-3xl p-4.5 sm:p-5 border space-y-3.5 transition-all ${
                    isDark
                      ? 'bg-[#141419] border-white/[0.08] shadow-sm'
                      : 'bg-white border-neutral-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3
                          className={`text-sm font-black tracking-tight ${
                            isDark ? 'text-white' : 'text-neutral-900'
                          }`}
                        >
                          Agendamento Online
                        </h3>
                        <p
                          className={`text-[11px] ${
                            isDark ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          {company.bookingSettings?.mode === 'whatsapp'
                            ? 'Agende seu horário diretamente pelo WhatsApp da empresa'
                            : 'Escolha um serviço e reserve seu horário em poucos toques'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleInitiateBooking(null)
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>
                      {company.bookingSettings?.mode === 'whatsapp'
                        ? 'Agendar Horário pelo WhatsApp'
                        : 'Agendar Horário Agora'}
                    </span>
                  </button>
                </div>
              )),
              menu: (activeModules.menu && !isExternalMenu && activeMenuItemsList.length > 0) ? (
            <div
              id="secao-cardapio"
              className="space-y-3.5 sm:space-y-4 w-full"
            >
              {/* Cabeçalho do Cardápio */}
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs text-white shrink-0"
                    style={{ backgroundColor: primaryColor || '#7A1228' }}
                  >
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <span
                      className="text-[10px] font-black uppercase tracking-wider block"
                      style={{ color: primaryColor || '#7A1228' }}
                    >
                      Cardápio Digital
                    </span>
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-base sm:text-lg font-black tracking-tight ${
                          isDark ? 'text-white' : 'text-neutral-900'
                        }`}
                      >
                        Nossas Opções
                      </h3>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isDark
                            ? 'bg-white/10 text-neutral-300'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {activeMenuItemsList.length} {activeMenuItemsList.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Ver Pedido ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
                  </button>
                )}
              </div>

              {/* Filtro de Categorias em Chips Horizontais */}
              {menuCategories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1 flex-nowrap shrink-0 touch-pan-x">
                  {menuCategories.map((cat) => {
                    const isSelected = selectedMenuCategory === cat

                    const getCategoryIcon = (c: string) => {
                      const lower = c.toLowerCase()
                      if (lower === 'todos') return <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                      if (lower.includes('pizza')) return <Pizza className="w-3.5 h-3.5 shrink-0" />
                      if (lower.includes('bebida') || lower.includes('drink') || lower.includes('café') || lower.includes('suco'))
                        return <Coffee className="w-3.5 h-3.5 shrink-0" />
                      if (lower.includes('combo') || lower.includes('lanche') || lower.includes('burger'))
                        return <Package className="w-3.5 h-3.5 shrink-0" />
                      if (lower.includes('sobremesa') || lower.includes('doce') || lower.includes('torta') || lower.includes('chocolate'))
                        return <Cake className="w-3.5 h-3.5 shrink-0" />
                      return <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
                    }

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedMenuCategory(cat)}
                        className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                          isSelected
                            ? 'text-white shadow-sm scale-[1.02]'
                            : isDark
                              ? 'bg-[#181820] hover:bg-white/10 text-neutral-300 border border-white/10'
                              : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200/90'
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: primaryColor || '#7A1228' }
                            : undefined
                        }
                      >
                        {getCategoryIcon(cat)}
                        <span>{cat}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Lista de Cards do Cardápio - Mobile First (FOTO QUADRADA 1:1 À ESQUERDA + INFORMAÇÕES À DIREITA) */}
              <div className="flex flex-col gap-3.5 sm:gap-4 pt-1 w-full">
                {displayedMenuItems.map((item) => {
                  const hasPromo =
                    item.promotionalPrice != null &&
                    typeof item.price === 'number' &&
                    item.promotionalPrice < item.price
                  const isSoldOut = item.isAvailable === false

                  const formatMoney = (val?: number | null) => {
                    if (val == null) return ''
                    return new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(val)
                  }

                  // Menor preço dos tamanhos para "A partir de R$ XX,XX"
                  const validSizePrices = (item.sizes || [])
                    .map((s) => s.price)
                    .filter((p): p is number => typeof p === 'number' && p > 0)
                  const minSizePrice =
                    validSizePrices.length > 0 ? Math.min(...validSizePrices) : null
                  const hasPriceFrom =
                    item.sizes && item.sizes.length > 0 && minSizePrice != null

                  // Texto descritivo de customização (ex: "3 tamanhos • Personalizável")
                  const sizeCount = item.sizes?.length || 0
                  const isCustomizable = Boolean(
                    (item.extras && item.extras.length > 0) ||
                      (item.removableIngredients && item.removableIngredients.length > 0) ||
                      item.isCustomBuilder ||
                      (item.flavors && item.flavors.length > 0)
                  )
                  let customizationTag = ''
                  if (sizeCount > 0 && isCustomizable) {
                    customizationTag = `${sizeCount} ${sizeCount === 1 ? 'tamanho' : 'tamanhos'} • Personalizável`
                  } else if (sizeCount > 0) {
                    customizationTag = `${sizeCount} ${sizeCount === 1 ? 'tamanho' : 'tamanhos'}`
                  } else if (isCustomizable) {
                    customizationTag = 'Personalizável'
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!isSoldOut) setSelectedMenuItemDetail(item)
                      }}
                      className={`group w-full rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 border transition-all flex flex-row items-center sm:items-stretch gap-2.5 sm:gap-3.5 ${
                        isSoldOut
                          ? 'opacity-65 cursor-not-allowed'
                          : 'cursor-pointer hover:shadow-lg active:scale-[0.99]'
                      } ${
                        isDark
                          ? 'bg-[#181820] hover:bg-[#1f1f28] border-white/10 hover:border-white/20'
                          : 'bg-white hover:bg-neutral-50/70 border-neutral-200/90 hover:border-neutral-300 shadow-xs'
                      }`}
                    >
                      {/* 1. COLUNA ESQUERDA: FOTO AUMENTADA EM FORMATO QUADRADO 1:1 */}
                      <div className="w-[145px] h-[145px] min-w-[145px] sm:w-[175px] sm:h-[175px] sm:min-w-[175px] md:w-[195px] md:h-[195px] md:min-w-[195px] shrink-0 aspect-square relative rounded-2xl sm:rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-white/10 self-center sm:self-start">
                        {item.photoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.photoUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 p-2 text-center">
                            <UtensilsCrossed className="w-8 h-8 opacity-40 mb-1" />
                            <span className="text-[10px] font-medium">Sem foto</span>
                          </div>
                        )}

                        {/* Selos SOBRE a foto no canto superior esquerdo: Mais pedido, Destaque, Novidade */}
                        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1 z-10 pointer-events-none items-start">
                          {item.isBestSeller && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-tight bg-[#E52E2E] text-white shadow-md">
                              <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white shrink-0" />
                              <span>Mais pedido</span>
                            </span>
                          )}
                          {item.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-tight bg-[#FFB800] text-neutral-950 shadow-md">
                              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-neutral-950 text-neutral-950 shrink-0" />
                              <span>Destaque</span>
                            </span>
                          )}
                          {item.isNew && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-tight bg-[#008A5E] text-white shadow-md">
                              <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white shrink-0" />
                              <span>Novidade</span>
                            </span>
                          )}
                        </div>

                        {hasPromo && !item.isBestSeller && !item.isFeatured && !item.isNew && (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs z-10">
                            Promo
                          </span>
                        )}

                        {isSoldOut && (
                          <div className="absolute inset-0 bg-black/75 backdrop-blur-2xs flex items-center justify-center p-1 text-center z-20">
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                              Esgotado
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 2. COLUNA DIREITA: INFORMAÇÕES (Aproveita toda a largura, organizada verticalmente) */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 pl-0.5 sm:pl-1 pr-0.5">
                        {/* Bloco Superior: Categoria, Nome, Descrição */}
                        <div>
                          {/* 1. CATEGORIA */}
                          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block truncate">
                            {item.category || 'Geral'}
                          </span>

                          {/* 2. NOME DO PRODUTO */}
                          <h4
                            className={`font-black text-xs sm:text-base leading-tight tracking-tight line-clamp-2 mt-0.5 ${
                              isDark ? 'text-white' : 'text-neutral-900'
                            }`}
                          >
                            {item.name}
                          </h4>

                          {/* 3. DESCRIÇÃO (limitada a 2 linhas) */}
                          {item.description && (
                            <p
                              className={`text-[11px] sm:text-xs line-clamp-2 leading-snug sm:leading-relaxed mt-1 ${
                                isDark ? 'text-neutral-400' : 'text-neutral-500'
                              }`}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Bloco Inferior: "A partir de", Preço, Tag de Tamanhos, Botão */}
                        <div className="mt-2 space-y-1">
                          {/* 4. "A partir de" */}
                          <span className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 font-medium block leading-tight">
                            {hasPriceFrom ? 'A partir de' : 'Valor'}
                          </span>

                          {/* 5. PREÇO */}
                          <div className="text-base sm:text-lg font-black text-[#8B0000] dark:text-rose-400 leading-tight">
                            {hasPriceFrom ? (
                              formatMoney(minSizePrice)
                            ) : hasPromo ? (
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {formatMoney(item.promotionalPrice)}
                                </span>
                                <span className="text-xs text-neutral-400 line-through font-normal">
                                  {formatMoney(item.price)}
                                </span>
                              </div>
                            ) : item.price != null ? (
                              formatMoney(item.price)
                            ) : (
                              <span className="text-xs font-semibold text-neutral-400">Sob consulta</span>
                            )}
                          </div>

                          {/* 6. "3 tamanhos • Personalizável" (Completo, sem cortar) */}
                          <div className="pt-0.5">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 text-[10px] sm:text-[11px] font-semibold leading-tight">
                              <Tag className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                              <span className="whitespace-normal">{customizationTag || 'Personalizável'}</span>
                            </div>
                          </div>

                          {/* 7. BOTÃO "+ Pedir agora" (Ocupando a largura da coluna direita) */}
                          <div className="pt-1.5">
                            <button
                              type="button"
                              disabled={isSoldOut}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!isSoldOut) setSelectedMenuItemDetail(item)
                              }}
                              className={`w-full py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-white shadow-xs transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer ${
                                isSoldOut
                                  ? 'opacity-40 cursor-not-allowed bg-neutral-400'
                                  : 'bg-[#008A5E] hover:bg-[#007550] shadow-sm'
                              }`}
                            >
                              <span>{item.isCustomBuilder ? '+ Montar agora' : '+ Pedir agora'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (activeModules.menu && isExternalMenu && company.menuUrl) ? (
            <div
              className={`rounded-3xl p-4.5 sm:p-5 border flex items-center justify-between gap-3 ${
                isDark
                  ? 'bg-[#121217] border-white/[0.08] shadow-sm'
                  : 'bg-white border-neutral-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4
                    className={`font-black text-xs sm:text-sm truncate ${
                      isDark ? 'text-white' : 'text-neutral-900'
                    }`}
                  >
                    Cardápio Digital
                  </h4>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isDark ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    Acesse nosso cardápio completo e confira todas as opções
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenMenu}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-90 active:scale-95 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Abrir Cardápio</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          ) : activeModules.menu ? (
            <div
              key="menu-card"
              className={`rounded-3xl p-4.5 sm:p-5 border flex items-center justify-between gap-3 ${
                isDark ? 'bg-[#121217] border-white/[0.08] shadow-sm' : 'bg-white border-neutral-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className={`font-black text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Cardápio Digital
                  </h4>
                  <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Confira nossas opções de pratos, porções e bebidas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenMenu}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-90 active:scale-95 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Ver Cardápio</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          ) : null,
              loyalty: activeModules.loyalty ? (
            <div
              className={`rounded-3xl p-4.5 sm:p-5 border relative overflow-hidden space-y-3.5 ${
                isDark
                  ? 'border-white/[0.08] shadow-sm'
                  : 'shadow-2xs'
              }`}
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.16)} 0%, #131318 50%, ${hexToRgba(secondaryColor, 0.1)} 100%)`
                  : `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.05)} 0%, #ffffff 50%, ${hexToRgba(secondaryColor, 0.07)} 100%)`,
                borderColor: hexToRgba(primaryColor, isDark ? 0.28 : 0.2),
              }}
            >
              {/* Efeito decorativo sutil */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20"
                style={{ backgroundColor: primaryColor }}
              />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs text-white"
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
                      Programa de Fidelidade
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

                {hasAvailableReward ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-500/40 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>Prêmio Pronto!</span>
                  </span>
                ) : (
                  <span
                    className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: hexToRgba(primaryColor, isDark ? 0.2 : 0.1),
                      color: isDark ? '#ffffff' : primaryColor,
                    }}
                  >
                    Meta: {loyaltyProgram.goalPoints} pts
                  </span>
                )}
              </div>

              {loyaltyProgram.rewardDescription && (
                <p
                  className={`text-xs leading-relaxed relative z-10 ${
                    isDark ? 'text-neutral-300' : 'text-neutral-600'
                  }`}
                >
                  Acumule pontos em cada visita e ganhe <strong className="font-bold" style={{ color: isDark ? '#fcd34d' : primaryColor }}>&ldquo;{loyaltyProgram.rewardDescription}&rdquo;</strong>.
                </p>
              )}

              {/* Botão de Ação: Ver Meu Cartão */}
              <button
                type="button"
                onClick={() => setIsLoyaltyOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer relative z-10"
                style={{
                  background: gradientBg,
                  color: contrastText,
                }}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>
                  {hasAvailableReward ? 'Resgatar Prêmio Disponível' : 'Ver Meu Cartão Fidelidade'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          ) : null,
              googleReview: activeModules.googleReview ? (
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
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${
                      isDark
                        ? 'bg-neutral-800/90 border border-white/10'
                        : 'bg-neutral-100 border border-neutral-200/60'
                    }`}
                  >
                    <GoogleColoredIcon className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold tracking-tight block ${
                        isDark ? 'text-neutral-200' : 'text-neutral-800'
                      }`}
                    >
                      Avaliações do Google
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
          ) : null,
              location: activeModules.location ? (
            <div key="location" className="pt-1">
              <div
                onClick={handleOpenLocation}
                className={`w-full rounded-2xl p-3 flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer group ${
                  isDark
                    ? 'bg-[#141419] hover:bg-[#1a1a22] border border-white/[0.07] hover:border-white/15'
                    : 'bg-white border border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      isDark
                        ? 'bg-rose-950/40 text-rose-400 border-rose-500/20'
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold truncate ${
                        isDark ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      Localização e Endereço
                    </p>
                    <p
                      className={`text-[11px] truncate mt-0.5 ${
                        isDark ? 'text-neutral-400' : 'text-neutral-500'
                      }`}
                    >
                      {company.addressText || 'Como chegar ao nosso estabelecimento'}
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
                  <span>Como Chegar</span>
                </div>
              </div>
            </div>
          ) : null,
              wifi: (activeModules.wifi && (
                <div
                  key="wifi"
                  className={`rounded-3xl p-4 sm:p-4.5 border flex items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-[#141419] border-white/[0.08] shadow-sm'
                      : 'bg-white border-neutral-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {company.wifi?.ssid ? `Wi-Fi Grátis: ${company.wifi.ssid}` : 'Wi-Fi Grátis Disponível'}
                      </h4>
                      <p className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Toque para ver a senha e conectar
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWifiOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    Conectar
                  </button>
                </div>
              )),
              feedback: (activeModules.feedback && (
                <div
                  key="feedback"
                  className={`rounded-3xl p-4 sm:p-4.5 border flex items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-[#141419] border-white/[0.08] shadow-sm'
                      : 'bg-white border-neutral-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <MessageSquareHeart className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        Feedback Privado
                      </h4>
                      <p className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Envie sua mensagem direta à administração
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFeedbackOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    Opinar
                  </button>
                </div>
              )),
              instagram: (activeModules.instagram && (
                <div
                  key="instagram"
                  className={`rounded-3xl p-4 sm:p-4.5 border flex items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-[#141419] border-white/[0.08] shadow-sm'
                      : 'bg-white border-neutral-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {company.instagram ? `@${company.instagram.replace(/^@/, '')}` : 'Instagram Oficial'}
                      </h4>
                      <p className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Siga nosso perfil oficial no Instagram
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenInstagram}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span>Seguir</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )),
            }

            return effectivePageOrder.map((sectionKey) => {
              const node = sectionElements[sectionKey]
              if (!node) return null
              return <React.Fragment key={sectionKey}>{node}</React.Fragment>
            })
          })()}
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

            {/* Botão de Produtos no Dock se ativo */}
            {activeModules.products && !isExternalCatalog && (
              <button
                type="button"
                onClick={() => setIsProductsSheetOpen(true)}
                className={`p-2 sm:p-2.5 rounded-xl transition-colors flex flex-col items-center gap-0.5 cursor-pointer ${
                  isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
                title="Produtos"
              >
                <Package className="w-4 h-4" />
                <span className="text-[9px] font-medium hidden sm:inline">Produtos</span>
              </button>
            )}

            {/* Botão de Cardápio no Dock se ativo */}
            {activeModules.menu && (
              <button
                type="button"
                onClick={handleOpenMenu}
                className={`p-2 sm:p-2.5 rounded-xl transition-colors flex flex-col items-center gap-0.5 cursor-pointer ${
                  isDark
                    ? 'text-neutral-400 hover:text-teal-400 hover:bg-white/[0.05]'
                    : 'text-neutral-600 hover:text-teal-700 hover:bg-teal-50'
                }`}
                title="Cardápio"
              >
                <UtensilsCrossed className="w-4 h-4 text-teal-500" />
                <span className="text-[9px] font-medium hidden sm:inline">Cardápio</span>
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
                handleInitiateBooking(null)
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
            handleInitiateBooking(srv)
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

        {/* Modais do Catálogo de Produtos */}
        <ProductsSheet
          isOpen={isProductsSheetOpen}
          onClose={() => setIsProductsSheetOpen(false)}
          products={products}
          company={company}
        />

        <ProductDetailModal
          product={selectedProductDetail}
          isOpen={Boolean(selectedProductDetail)}
          onClose={() => setSelectedProductDetail(null)}
          company={company}
          initialCustomerName={customerSession.name}
          initialCustomerPhone={customerSession.phone || undefined}
        />

        {/* Modal de Personalização do Item do Cardápio */}
        {selectedMenuItemDetail && (
          <MenuItemModal
            item={selectedMenuItemDetail}
            company={company}
            isDark={isDark}
            onClose={() => setSelectedMenuItemDetail(null)}
            onAddToCart={handleAddToCart}
            onDirectOrderWhatsApp={handleDirectOrderWhatsApp}
          />
        )}

        {/* Drawer do Carrinho / Resumo do Pedido */}
        <MenuCartDrawer
          isOpen={isCartOpen}
          cart={cart}
          company={company}
          isDark={isDark}
          initialStep={cartInitialStep}
          initialCustomerName={customerSession.name}
          initialCustomerPhone={customerSession.phone || undefined}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
        />

        {/* Botão Flutuante do Carrinho quando houver itens */}
        {cart.length > 0 && !isCartOpen && (
          <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <button
              type="button"
              onClick={() => {
                setCartInitialStep('items')
                setIsCartOpen(true)
              }}
              className="px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xl shadow-teal-950/40 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer border border-teal-400/30"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {cart.reduce((a, b) => a + b.quantity, 0)}{' '}
                {cart.reduce((a, b) => a + b.quantity, 0) === 1 ? 'item' : 'itens'}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/50" />
              <span>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(cart.reduce((a, b) => a + b.totalPrice, 0))}
              </span>
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] uppercase font-black tracking-wider">
                Ver Pedido
              </span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
