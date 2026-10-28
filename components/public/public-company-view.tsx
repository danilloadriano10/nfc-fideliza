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
import { PublicCard } from './action-card'
import { LoyaltySheet } from './loyalty-sheet'
import { WifiSheet } from './wifi-sheet'
import { FeedbackSheet } from './feedback-sheet'
import { ServicesSheet } from './services-sheet'
import { BookingSheet } from './booking-sheet'
import { ProductsSheet } from './products-sheet'
import { MenuSheet } from './menu-sheet'
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
import { getPublicTheme } from '@/lib/public-themes'

interface PublicCompanyViewProps {
  company: Company
  initialProducts?: CompanyProduct[]
  initialServices?: CompanyService[]
  initialMenuItems?: MenuItem[]
  initialTableNumber?: string
  autoScrollToMenu?: boolean
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
  initialTableNumber,
  autoScrollToMenu,
}) => {
  const activeTheme = useMemo(
    () => getPublicTheme(company.theme, company.customThemeConfig, company.themeColors),
    [company.theme, company.customThemeConfig, company.themeColors]
  )
  const isDark = activeTheme.isDarkBase

  const themedCardStyle = useMemo(() => ({
    backgroundColor: activeTheme.colors.cardBg || activeTheme.cardBg,
    borderColor: activeTheme.colors.borderColor || activeTheme.cardBorder,
  }), [activeTheme.colors.cardBg, activeTheme.cardBg, activeTheme.colors.borderColor, activeTheme.cardBorder])

  const cleanTableNumber = initialTableNumber ? initialTableNumber.trim() : null
  const displayTableLabel = useMemo(() => {
    if (!cleanTableNumber) return null
    return cleanTableNumber.toLowerCase().startsWith('mesa')
      ? cleanTableNumber
      : `Mesa ${cleanTableNumber}`
  }, [cleanTableNumber])

  const isMenuShortcutMode = useMemo(() => {
    return Boolean(company.menuDisplayMode === 'card' || company.menuConfig?.displayMode === 'card')
  }, [company.menuDisplayMode, company.menuConfig?.displayMode])

  const isServicesShortcutMode = useMemo(() => {
    return Boolean(company.servicesDisplayMode === 'card')
  }, [company.servicesDisplayMode])

  const isProductsShortcutMode = useMemo(() => {
    return Boolean(company.productsDisplayMode === 'card' || company.productCatalog?.displayMode === 'card')
  }, [company.productsDisplayMode, company.productCatalog?.displayMode])

  const isAppointmentsShortcutMode = useMemo(() => {
    return Boolean(company.appointmentsDisplayMode === 'card' || company.bookingSettings?.displayMode === 'card')
  }, [company.appointmentsDisplayMode, company.bookingSettings?.displayMode])

  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false)

  useEffect(() => {
    if (autoScrollToMenu) {
      const timer = setTimeout(() => {
        const el = document.getElementById('secao-cardapio')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        } else if (isMenuShortcutMode) {
          setIsMenuSheetOpen(true)
        }
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [autoScrollToMenu, isMenuShortcutMode])

  const primaryColor = useMemo(
    () => sanitizeHex(activeTheme.colors.primary || company.primaryColor, '#6D28D9'),
    [activeTheme.colors.primary, company.primaryColor]
  )
  const secondaryColor = useMemo(
    () => sanitizeHex(activeTheme.colors.secondary || company.secondaryColor, '#8B5CF6'),
    [activeTheme.colors.secondary, company.secondaryColor]
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

  // Open Menu (External link, Shortcut modal or Scroll to internal cardápio)
  const handleOpenMenu = useCallback(() => {
    if (isExternalMenu && company.menuUrl) {
      window.open(company.menuUrl, '_blank', 'noopener,noreferrer')
    } else if (isMenuShortcutMode) {
      setIsMenuSheetOpen(true)
    } else {
      const el = document.getElementById('secao-cardapio')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      } else {
        setIsMenuSheetOpen(true)
      }
    }
  }, [isExternalMenu, company.menuUrl, isMenuShortcutMode, setIsMenuSheetOpen])

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
        icon: <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />,
        iconContainerClass: 'border',
        iconContainerStyle: {
          backgroundColor: hexToRgba(primaryColor, isDark ? 0.15 : 0.08),
          borderColor: hexToRgba(primaryColor, isDark ? 0.3 : 0.2),
          color: primaryColor,
        },
        onClick: isExternalCatalog ? handleOpenCatalogExternal : () => setIsProductsSheetOpen(true),
        isActive: Boolean(activeModules.products),
      },
      services: {
        id: 'services',
        title: 'Nossos Serviços',
        description: activeServicesList.length > 0
          ? `${activeServicesList.length} opções disponíveis`
          : 'Tabela de serviços',
        icon: <Scissors className="w-5 h-5" style={{ color: secondaryColor }} />,
        iconContainerClass: 'border',
        iconContainerStyle: {
          backgroundColor: hexToRgba(secondaryColor, isDark ? 0.15 : 0.08),
          borderColor: hexToRgba(secondaryColor, isDark ? 0.3 : 0.2),
          color: secondaryColor,
        },
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
    primaryColor,
    secondaryColor,
  ])

  // Resolve os cards de destaque do topo (0, 1, 2, 3 ou 4 cards configuráveis)
  const featuredCardsList = useMemo<HighlightCardItem[]>(() => {
    const targetCount =
      typeof company.featuredCardsCount === 'number' && [0, 1, 2, 3, 4].includes(company.featuredCardsCount)
        ? company.featuredCardsCount
        : Array.isArray(company.featuredCards) && company.featuredCards.length >= 0 && company.featuredCards.length <= 4
        ? company.featuredCards.length
        : 4

    if (targetCount === 0) {
      return []
    }

    const configured =
      company.featuredCards && company.featuredCards.length > 0
        ? company.featuredCards.slice(0, targetCount)
        : ['whatsapp', 'location', 'googleReview', 'instagram'].slice(0, targetCount)

    const list: HighlightCardItem[] = []
    const seen = new Set<string>()

    // 1. Prioriza os configurados
    for (const id of configured) {
      const card = availableHighlightCards[id]
      if (card && !seen.has(id)) {
        list.push(card)
        seen.add(id)
        if (list.length === targetCount) break
      }
    }

    // 2. Se houver menos que targetCount, completa com os primeiros atalhos disponíveis
    if (list.length < targetCount) {
      const fallbackOrder = [
        'whatsapp',
        'location',
        'googleReview',
        'instagram',
        'wifi',
        'appointments',
        'loyalty',
        'menu',
        'products',
        'services',
        'feedback',
      ]
      for (const id of fallbackOrder) {
        if (list.length >= targetCount) break
        const card = availableHighlightCards[id]
        if (card && !seen.has(id)) {
          list.push(card)
          seen.add(id)
        }
      }
    }

    return list.slice(0, targetCount)
  }, [company.featuredCards, company.featuredCardsCount, availableHighlightCards])

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
      className={`min-h-screen sm:py-6 flex justify-center transition-colors duration-200 relative ${
        isDark
          ? 'selection:bg-neutral-800 selection:text-white'
          : 'selection:bg-neutral-900 selection:text-white'
      } ${activeTheme.pageBgClass || ''}`}
      style={activeTheme.pageBgStyle}
    >
      {/* Camada Atmosférica de Textura / Brilho / Gradiente do Tema */}
      {activeTheme.textureOverlay && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={activeTheme.textureOverlay.style}
        />
      )}

      {/* Mobile-first App Container */}
      <main
        className={`w-full max-w-md sm:rounded-3xl shadow-2xl overflow-hidden relative pb-28 sm:pb-24 flex flex-col transition-all duration-200 ${
          isDark
            ? 'border-x sm:border text-white'
            : 'border-x sm:border text-neutral-900'
        }`}
        style={{
          ...activeTheme.containerBgStyle,
          borderColor: activeTheme.containerBorderColor,
          boxShadow: activeTheme.containerShadow,
          color: activeTheme.textPrimary,
        }}
      >
        {/* Identificação Automática da Mesa no Salão (Discreta) */}
        {displayTableLabel && (
          <div className="sticky top-2 z-40 px-3 w-full pointer-events-auto">
            <div className="bg-neutral-900/90 dark:bg-neutral-800/95 backdrop-blur-md text-white text-xs font-semibold py-2 px-3.5 rounded-full shadow-lg border border-white/10 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">
                  Você está na <strong className="text-teal-300 font-bold">{displayTableLabel}</strong>
                </span>
              </div>
              <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 text-neutral-200">
                Consumo no Local
              </span>
            </div>
          </div>
        )}
        
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
                  className={company.coverFit === 'contain' ? 'object-contain' : 'object-cover'}
                  style={{
                    objectPosition: `${company.coverPositionX || 'center'} ${company.coverPositionY || 'center'}`,
                    transform: company.coverZoom && company.coverZoom !== 1 ? `scale(${company.coverZoom})` : undefined,
                  }}
                  sizes="(max-width: 480px) 100vw, 448px"
                  referrerPolicy="no-referrer"
                  unoptimized={Boolean(typeof company.coverUrl === 'string' && company.coverUrl.includes('ibb.co'))}
                  onError={() => setCoverError(true)}
                />
                {/* Gradiente concentrado na base da foto para transição suave com o fundo do tema */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-14 sm:h-16 pointer-events-none"
                  style={{ background: activeTheme.heroTransitionGradient }}
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
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: activeTheme.heroTransitionGradient }}
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

          {/* ======================================================= */}
          {/* 2. ATALHOS FLUTUANTES NO TOPO (0, 1, 2, 3 OU 4 ITENS)   */}
          {/* ======================================================= */}
          {featuredCardsList.length > 0 && (
            <div className="px-2.5 sm:px-4 -mt-6 sm:-mt-7 relative z-20">
              <div
                className={
                  featuredCardsList.length === 1
                    ? 'grid grid-cols-1 max-w-[140px] mx-auto'
                    : featuredCardsList.length === 2
                    ? 'grid grid-cols-2 max-w-[280px] mx-auto gap-4'
                    : featuredCardsList.length === 3
                    ? 'grid grid-cols-3 max-w-[360px] mx-auto gap-2.5 sm:gap-3'
                    : 'grid grid-cols-4 gap-2 sm:gap-2.5'
                }
              >
                {featuredCardsList.map((card) => {
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={card.onClick}
                      className="w-full text-center p-1 cursor-pointer group flex flex-col items-center justify-center gap-1.5 select-none transition-transform active:scale-95 bg-transparent border-0 shadow-none hover:bg-transparent"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {/* Ícone Flutuante com Sombra Elevada e Efeito ao Toque */}
                      <div className="relative">
                        <div
                          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-200 group-hover:scale-105 ${
                            card.iconContainerClass
                          }`}
                          style={card.iconContainerStyle}
                        >
                          {card.icon}
                        </div>

                        {/* Badge flutuante sobre o ícone (ex: Prêmio!) */}
                        {card.badgeText && (
                          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-black bg-amber-500 text-white shadow-xs leading-none z-10">
                            {card.badgeText}
                          </span>
                        )}
                      </div>

                      {/* Nome do Atalho */}
                      <span
                        className="font-bold tracking-tight truncate w-full text-center leading-tight text-[11px] sm:text-xs block px-0.5"
                        style={{ color: activeTheme.colors.titleColor || (isDark ? '#ffffff' : '#171717') }}
                      >
                        {card.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 3. IDENTIDADE DA EMPRESA (NOME E DESCRIÇÃO)             */}
          {/* ======================================================= */}
          <div
            className={`px-4 ${
              featuredCardsList.length > 0 ? 'mt-3 sm:mt-4' : 'mt-4 sm:mt-5'
            } relative z-10 flex flex-col items-center text-center`}
          >
            {/* Nome da Empresa */}
            <h1
              className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}
              style={{ color: activeTheme.colors.titleColor }}
            >
              {company.name}
            </h1>

            {/* Descrição da Empresa */}
            {company.tagline && (
              <p
                className={`text-xs font-medium max-w-xs mt-1 leading-snug ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
                style={{ color: activeTheme.colors.textColor }}
              >
                {company.tagline}
              </p>
            )}
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
                <PublicCard
                  key="whatsapp"
                  icon={<MessageCircle className="w-5 h-5 text-[#25D366]" />}
                  iconContainerClass={
                    isDark
                      ? 'bg-emerald-500/15 border border-emerald-500/30'
                      : 'bg-emerald-50 border border-emerald-200/80'
                  }
                  title="WhatsApp Oficial"
                  subtitle={
                    company.whatsapp
                      ? `Atendimento: ${company.whatsapp}`
                      : 'Fale diretamente com nossa equipe'
                  }
                  actionText="Conversar"
                  actionIcon={<MessageCircle className="w-3.5 h-3.5" />}
                  actionVariant="theme"
                  onAction={handleOpenWhatsApp}
                  onClick={handleOpenWhatsApp}
                  isDark={isDark}
                  cardStyle={themedCardStyle}
                  primaryColor={primaryColor}
                  buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
                  buttonTextColor={activeTheme.colors.buttonText}
                />
              ) : null,
              services: activeModules.services ? (
                isServicesShortcutMode ? (
                  <PublicCard
                    key="services-card"
                    icon={<Scissors className="w-5 h-5 text-white" />}
                    iconContainerStyle={{ backgroundColor: secondaryColor || primaryColor }}
                    title="Nossos Serviços"
                    badgeText={activeServicesList.length > 0 ? `${activeServicesList.length}` : undefined}
                    badgeVariant="violet"
                    subtitle={
                      activeServicesList.length > 0
                        ? `${activeServicesList.length} opções com preços e horários`
                        : 'Consulte nossa tabela de procedimentos e serviços'
                    }
                    actionText="Ver Serviços"
                    actionIcon={<Scissors className="w-3.5 h-3.5" />}
                    actionVariant="theme"
                    onAction={() => setIsServicesOpen(true)}
                    onClick={() => setIsServicesOpen(true)}
                    isDark={isDark}
                    cardStyle={themedCardStyle}
                    primaryColor={primaryColor}
                    buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
                    buttonTextColor={activeTheme.colors.buttonText}
                  />
                ) : activeServicesList.length > 0 ? (
                  <div className="space-y-2.5 pt-1">
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

                    {/* Vitrine de Serviços padronizada no formato horizontal compacto */}
                    <div className="space-y-2.5">
                      {activeServicesList.slice(0, 4).map((srv) => {
                        const srvPhoto =
                          srv.photoUrl ||
                          (srv as unknown as { imageUrl?: string }).imageUrl ||
                          ''
                        const isConsult = srv.priceType === 'consult' || srv.price == null

                        return (
                          <PublicCard
                            key={srv.id}
                            icon={
                              srvPhoto ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={srvPhoto}
                                  alt={srv.name}
                                  className="w-full h-full object-cover rounded-xl"
                                  loading="lazy"
                                />
                              ) : (
                                <Scissors
                                  className="w-5 h-5"
                                  style={{ color: secondaryColor || primaryColor }}
                                />
                              )
                            }
                            iconContainerClass="overflow-hidden border"
                            iconContainerStyle={{
                              backgroundColor: hexToRgba(secondaryColor || primaryColor, isDark ? 0.2 : 0.08),
                              borderColor: hexToRgba(secondaryColor || primaryColor, isDark ? 0.35 : 0.2),
                            }}
                            title={srv.name}
                            subtitle={
                              <div className="flex items-center gap-1.5 text-[11px] truncate">
                                {srv.durationMinutes && (
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="w-3 h-3 text-neutral-400" />
                                    <span>{srv.durationMinutes} min</span>
                                    <span>•</span>
                                  </span>
                                )}
                                <span
                                  className="font-bold font-mono"
                                  style={{ color: activeTheme.colors.priceColor }}
                                >
                                  {isConsult
                                    ? 'Sob Consulta'
                                    : `R$ ${srv.price?.toFixed(2).replace('.', ',')}`}
                                </span>
                              </div>
                            }
                            actionText={activeModules.appointments ? 'Agendar' : 'Ver'}
                            actionIcon={
                              activeModules.appointments ? (
                                <Calendar className="w-3.5 h-3.5" />
                              ) : (
                                <Scissors className="w-3.5 h-3.5" />
                              )
                            }
                            actionVariant="theme"
                            onAction={() => {
                              if (activeModules.appointments) {
                                handleInitiateBooking(srv)
                              } else {
                                setIsServicesOpen(true)
                              }
                            }}
                            onClick={() => {
                              if (activeModules.appointments) {
                                handleInitiateBooking(srv)
                              } else {
                                setIsServicesOpen(true)
                              }
                            }}
                            isDark={isDark}
                            cardStyle={themedCardStyle}
                            primaryColor={primaryColor}
                            buttonBgColor={activeTheme.colors.buttonBg}
                            buttonTextColor={activeTheme.colors.buttonText}
                          />
                        )
                      })}
                    </div>

                    {activeServicesList.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setIsServicesOpen(true)}
                        className={`w-full py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-neutral-100'
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
                  <PublicCard
                    key="services-card"
                    icon={
                      <Scissors
                        className="w-5 h-5"
                        style={{ color: secondaryColor || primaryColor }}
                      />
                    }
                    iconContainerClass="border"
                    iconContainerStyle={{
                      backgroundColor: hexToRgba(secondaryColor || primaryColor, isDark ? 0.2 : 0.08),
                      borderColor: hexToRgba(secondaryColor || primaryColor, isDark ? 0.35 : 0.2),
                    }}
                    title="Nossos Serviços"
                    subtitle="Consulte nossos serviços e agende seu atendimento"
                    actionText="Consultar"
                    actionIcon={<Scissors className="w-3.5 h-3.5" />}
                    actionVariant="theme"
                    onAction={() => {
                      if (activeModules.appointments) {
                        handleInitiateBooking(null)
                      } else {
                        handleOpenWhatsApp()
                      }
                    }}
                    onClick={() => {
                      if (activeModules.appointments) {
                        handleInitiateBooking(null)
                      } else {
                        handleOpenWhatsApp()
                      }
                    }}
                    isDark={isDark}
                    cardStyle={themedCardStyle}
                    primaryColor={primaryColor}
                    buttonBgColor={activeTheme.colors.buttonBg}
                    buttonTextColor={activeTheme.colors.buttonText}
                  />
                )
              ) : null,
              products: (activeProductsList.length > 0 && !isExternalCatalog && company.modules?.products !== false && !isProductsShortcutMode) ? (
            <div
              className={`rounded-3xl p-3 sm:p-4.5 space-y-3.5 border ${
                isDark
                  ? 'bg-[#121217] border-white/[0.08] shadow-sm'
                  : 'bg-white border-neutral-200/80 shadow-2xs'
              }`}
            >
              {/* Cabeçalho da Vitrine */}
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs text-white shrink-0"
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

              {/* Vitrine Visual de Produtos: Cards em Grid de 2 colunas moderno, sem bordas e imagens ampliadas */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                      className="group flex flex-col justify-between transition-all cursor-pointer relative select-none active:scale-[0.99]"
                    >
                      <div>
                        {/* Foto do Produto - Sem container cinza, aproveitando 100% da largura da coluna com object-contain */}
                        <div className="relative w-full aspect-square mb-2 flex items-center justify-center overflow-hidden">
                          {prodPhoto ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={prodPhoto}
                              alt={prod.name}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className={`w-full h-full rounded-2xl flex flex-col items-center justify-center ${
                                isDark ? 'bg-white/[0.04] text-neutral-500' : 'bg-neutral-100/80 text-neutral-400'
                              }`}
                            >
                              <Package className="w-8 h-8 opacity-40 mb-1" />
                              <span className="text-[10px] font-medium">Sem foto</span>
                            </div>
                          )}

                          {hasPromo && (
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs z-10">
                              {discountPercent ? `-${discountPercent}%` : 'Promo'}
                            </span>
                          )}

                          {prod.isAvailable === false && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-2xs rounded-xl flex items-center justify-center p-1 text-center z-20">
                              <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                                Esgotado
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Nome e Categoria diretamente abaixo da imagem */}
                        <div className="space-y-0.5 px-0.5">
                          {prod.category && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block truncate">
                              {prod.category}
                            </span>
                          )}
                          <h4
                            className={`font-semibold sm:font-bold text-xs sm:text-sm leading-snug line-clamp-2 ${
                              isDark ? 'text-white' : 'text-neutral-900'
                            }`}
                            title={prod.name}
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
                      </div>

                      {/* Preço e Botão de Ação diretamente abaixo */}
                      <div className="pt-1.5 px-0.5 space-y-2">
                        <div className="min-w-0">
                          {isConsult ? (
                            <span className="text-xs font-bold text-amber-500 dark:text-amber-400 block truncate">
                              Sob consulta
                            </span>
                          ) : hasPromo ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span
                                className="text-xs sm:text-sm font-black font-mono leading-tight"
                                style={{ color: activeTheme.colors.priceColor }}
                              >
                                R$ {prod.promotionalPrice?.toFixed(2).replace('.', ',')}
                              </span>
                              <span
                                className={`text-[10px] line-through font-mono leading-tight ${
                                  isDark ? 'text-neutral-500' : 'text-neutral-400'
                                }`}
                              >
                                R$ {prod.price?.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="text-xs sm:text-sm font-black font-mono leading-tight block"
                              style={{ color: activeTheme.colors.priceColor }}
                            >
                              R$ {prod.price?.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>

                        {/* Botões de Ação do Card */}
                        <div className="flex items-center gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProductDetail(prod)
                            }}
                            className="flex-1 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                            style={{
                              backgroundColor: activeTheme.colors.buttonBg,
                              color: activeTheme.colors.buttonText,
                            }}
                          >
                            <span>Ver produto</span>
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
                              className="p-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center transition-transform active:scale-95 shadow-xs cursor-pointer shrink-0"
                              title="Pedir no WhatsApp"
                              aria-label="Pedir no WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            </button>
                          )}
                        </div>
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
            <PublicCard
              key="products-external"
              icon={<ShoppingBag className="w-5 h-5 text-white" />}
              iconContainerStyle={{ backgroundColor: primaryColor }}
              title={company.productCatalog?.externalButtonText || 'Ver Catálogo'}
              subtitle="Acesse nossa loja oficial e veja todos os produtos"
              actionText={company.productCatalog?.externalButtonText || 'Ver Catálogo'}
              actionIcon={<ShoppingBag className="w-3.5 h-3.5" />}
              actionVariant="theme"
              onAction={handleOpenCatalogExternal}
              onClick={handleOpenCatalogExternal}
              isDark={isDark}
              cardStyle={themedCardStyle}
              primaryColor={primaryColor}
              buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
              buttonTextColor={activeTheme.colors.buttonText}
            />
          ) : activeModules.products ? (
            <PublicCard
              key="products-card"
              icon={<Package className="w-5 h-5 text-white" />}
              iconContainerStyle={{ backgroundColor: primaryColor }}
              title="Catálogo de Produtos"
              badgeText={activeProductsList.length > 0 ? `${activeProductsList.length}` : undefined}
              badgeVariant="violet"
              subtitle={
                activeProductsList.length > 0
                  ? `${activeProductsList.length} produtos disponíveis para conferir`
                  : 'Conheça nossa seleção de produtos disponíveis'
              }
              actionText="Ver Produtos"
              actionIcon={<Package className="w-3.5 h-3.5" />}
              actionVariant="theme"
              onAction={() => setIsProductsSheetOpen(true)}
              onClick={() => setIsProductsSheetOpen(true)}
              isDark={isDark}
              cardStyle={themedCardStyle}
              primaryColor={primaryColor}
              buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
              buttonTextColor={activeTheme.colors.buttonText}
            />
          ) : null,
              appointments: activeModules.appointments ? (
                <PublicCard
                  key="appointments"
                  icon={<Calendar className="w-5 h-5 text-indigo-400" />}
                  iconContainerClass={
                    isDark
                      ? 'bg-indigo-500/15 border border-indigo-500/25'
                      : 'bg-indigo-50 border border-indigo-200/80'
                  }
                  iconContainerStyle={{ color: '#6366F1' }}
                  title="Agendamento Online"
                  subtitle={
                    company.bookingSettings?.mode === 'whatsapp'
                      ? 'Agende seu horário pelo WhatsApp'
                      : 'Reserve seu horário em poucos toques'
                  }
                  actionText="Agendar"
                  actionIcon={<Calendar className="w-3.5 h-3.5" />}
                  actionVariant="theme"
                  onAction={() => handleInitiateBooking(null)}
                  onClick={() => handleInitiateBooking(null)}
                  isDark={isDark}
                  cardStyle={themedCardStyle}
                  primaryColor={primaryColor}
                  buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
                  buttonTextColor={activeTheme.colors.buttonText}
                />
              ) : null,
              menu: (activeModules.menu && !isExternalMenu && !isMenuShortcutMode && activeMenuItemsList.length > 0) ? (
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
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {displayTableLabel && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                          <span>Você está na <strong>{displayTableLabel}</strong></span>
                        </span>
                      )}
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
                      className={`group w-full rounded-2xl sm:rounded-3xl border transition-all flex flex-row items-stretch overflow-hidden select-none ${
                        isSoldOut
                          ? 'opacity-65 cursor-not-allowed'
                          : 'cursor-pointer hover:shadow-lg active:scale-[0.99]'
                      } shadow-xs`}
                      style={themedCardStyle}
                    >
                      {/* 1. FOTO PERFEITAMENTE QUADRADA (1:1) ENCOSTANDO NAS BORDAS ESQUERDA, SUPERIOR E INFERIOR */}
                      <div className="w-[172px] h-[172px] min-w-[172px] sm:w-[185px] sm:h-[185px] sm:min-w-[185px] aspect-square shrink-0 relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
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
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none items-start">
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
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs z-10">
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

                      {/* 2. ÁREA DE INFORMAÇÕES À DIREITA COM EXATAMENTE A MESMA ALTURA DA FOTO (SEM NENHUM CORTE) */}
                      <div className="flex-1 min-w-0 p-2.5 sm:p-3 flex flex-col justify-between h-[172px] sm:h-[185px]">
                        {/* Bloco Superior: Categoria, Nome, Descrição */}
                        <div className="min-w-0">
                          {/* CATEGORIA */}
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block truncate leading-none">
                            {item.category || 'Geral'}
                          </span>

                          {/* NOME DO PRODUTO */}
                          <h4
                            className={`font-black text-xs sm:text-base leading-snug tracking-tight line-clamp-2 mt-0.5 ${
                              isDark ? 'text-white' : 'text-neutral-900'
                            }`}
                          >
                            {item.name}
                          </h4>

                          {/* DESCRIÇÃO */}
                          {item.description && (
                            <p
                              className={`text-[10px] sm:text-xs line-clamp-1 leading-tight mt-0.5 ${
                                isDark ? 'text-neutral-400' : 'text-neutral-500'
                              }`}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Bloco Inferior: "A partir de", Preço, Tag de Tamanhos, Botão (Sem cortes) */}
                        <div className="space-y-1 pt-0.5 min-w-0 shrink-0">
                          {/* Preço com "A partir de" */}
                          <div>
                            <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 font-medium block leading-none">
                              {hasPriceFrom ? 'A partir de' : 'Valor'}
                            </span>
                            <div
                              className="text-sm sm:text-base font-black leading-tight mt-0.5"
                              style={{ color: activeTheme.colors.priceColor }}
                            >
                              {hasPriceFrom ? (
                                formatMoney(minSizePrice)
                              ) : hasPromo ? (
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span style={{ color: activeTheme.colors.priceColor }}>
                                    {formatMoney(item.promotionalPrice)}
                                  </span>
                                  <span className="text-[11px] text-neutral-400 line-through font-normal">
                                    {formatMoney(item.price)}
                                  </span>
                                </div>
                              ) : item.price != null ? (
                                formatMoney(item.price)
                              ) : (
                                <span className="text-xs font-semibold text-neutral-400">Sob consulta</span>
                              )}
                            </div>
                          </div>

                          {/* "3 tamanhos • Personalizável" (completo) */}
                          <div>
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 text-[9px] sm:text-[10px] font-semibold leading-none max-w-full">
                              <Tag className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                              <span className="truncate">{customizationTag || 'Personalizável'}</span>
                            </div>
                          </div>

                          {/* BOTÃO "+ Pedir agora" (100% inteiro, visível e sem corte) */}
                          <div className="pt-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={isSoldOut}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!isSoldOut) setSelectedMenuItemDetail(item)
                              }}
                              className={`w-full py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer shrink-0 ${
                                isSoldOut
                                  ? 'opacity-40 cursor-not-allowed bg-neutral-400 text-white'
                                  : 'shadow-sm hover:opacity-95'
                              }`}
                              style={
                                !isSoldOut
                                  ? {
                                      backgroundColor: activeTheme.colors.buttonBg,
                                      color: activeTheme.colors.buttonText,
                                    }
                                  : undefined
                              }
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
            <PublicCard
              key="menu-external"
              icon={<BookOpen className="w-5 h-5 text-white" />}
              iconContainerStyle={{ backgroundColor: primaryColor }}
              title="Cardápio Digital"
              subtitle="Acesse nosso cardápio completo e confira todas as opções"
              actionText="Abrir Cardápio"
              actionIcon={<BookOpen className="w-3.5 h-3.5" />}
              actionVariant="theme"
              onAction={handleOpenMenu}
              onClick={handleOpenMenu}
              isDark={isDark}
              cardStyle={themedCardStyle}
              primaryColor={primaryColor}
              buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
              buttonTextColor={activeTheme.colors.buttonText}
            />
          ) : activeModules.menu ? (
            <PublicCard
              key="menu-card"
              icon={<UtensilsCrossed className="w-5 h-5 text-white" />}
              iconContainerStyle={{ backgroundColor: primaryColor || '#7A1228' }}
              title="Cardápio Digital"
              badgeText={activeMenuItemsList.length > 0 ? `${activeMenuItemsList.length}` : undefined}
              badgeVariant="theme"
              subtitle={
                activeMenuItemsList.length > 0
                  ? `${activeMenuItemsList.length} itens disponíveis para pedir agora`
                  : 'Confira nossas opções de pratos, porções e bebidas'
              }
              actionText="Ver Cardápio"
              actionIcon={<UtensilsCrossed className="w-3.5 h-3.5" />}
              actionVariant="theme"
              onAction={handleOpenMenu}
              onClick={handleOpenMenu}
              isDark={isDark}
              cardStyle={themedCardStyle}
              primaryColor={primaryColor}
              buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
              buttonTextColor={activeTheme.colors.buttonText}
            />
          ) : null,
              loyalty: activeModules.loyalty ? (
                <PublicCard
                  key="loyalty"
                  icon={<Gift className="w-5 h-5 text-orange-400" />}
                  iconContainerClass={
                    isDark
                      ? 'bg-orange-500/15 border border-orange-500/25'
                      : 'bg-orange-50 border border-orange-200/80'
                  }
                  iconContainerStyle={{ color: '#F97316' }}
                  title={loyaltyProgram.campaignName || 'Programa de Fidelidade'}
                  badgeText={hasAvailableReward ? 'Prêmio!' : `Meta: ${loyaltyProgram.goalPoints} pts`}
                  badgeVariant={hasAvailableReward ? 'emerald' : 'amber'}
                  subtitle={
                    hasAvailableReward
                      ? 'Prêmio pronto para resgate!'
                      : customerPoints !== null
                      ? `${customerPoints}/${loyaltyProgram.goalPoints} pontos acumulados`
                      : loyaltyProgram.rewardDescription
                      ? `Ganhe: ${loyaltyProgram.rewardDescription}`
                      : 'Ganhe prêmios e bônus a cada visita'
                  }
                  actionText={hasAvailableReward ? 'Resgatar' : 'Ver Cartão'}
                  actionIcon={<Gift className="w-3.5 h-3.5" />}
                  actionVariant="theme"
                  onAction={() => setIsLoyaltyOpen(true)}
                  onClick={() => setIsLoyaltyOpen(true)}
                  isDark={isDark}
                  cardStyle={themedCardStyle}
                  primaryColor={primaryColor}
                  buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
                  buttonTextColor={activeTheme.colors.buttonText}
                />
              ) : null,
              googleReview: activeModules.googleReview ? (
                <PublicCard
                  key="googleReview"
                  icon={<GoogleColoredIcon className="w-5 h-5 shrink-0" />}
                  iconContainerClass={
                    isDark
                      ? 'bg-neutral-800/90 border border-white/10'
                      : 'bg-white border border-neutral-200/80 shadow-2xs'
                  }
                  title="Avaliações do Google"
                  badgeText={`${company.rating ? company.rating.toFixed(1) : '5.0'}★`}
                  badgeVariant="amber"
                  subtitle={`${company.reviewCount || '120+'} avaliações • Avalie sua experiência`}
                  actionText="Avaliar"
                  actionIcon={<Star className="w-3.5 h-3.5" />}
                  actionVariant="theme"
                  onAction={handleGoogleReview}
                  onClick={handleGoogleReview}
                  isDark={isDark}
                  cardStyle={themedCardStyle}
                  primaryColor={primaryColor}
                  buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
                  buttonTextColor={activeTheme.colors.buttonText}
                />
              ) : null,
              location: activeModules.location ? (
                <PublicCard
                  key="location"
                  icon={<Navigation className="w-5 h-5 text-rose-500" />}
                  iconContainerClass={
                    isDark
                      ? 'bg-rose-950/40 border border-rose-500/30'
                      : 'bg-rose-50 border border-rose-100'
                  }
                  title="Localização e Endereço"
                  subtitle={company.addressText || 'Como chegar ao nosso estabelecimento'}
                  actionText="Como Chegar"
                  actionIcon={<Navigation className="w-3.5 h-3.5" />}
                  actionVariant="theme"
                  onAction={handleOpenLocation}
                  onClick={handleOpenLocation}
                  isDark={isDark}
                  cardStyle={themedCardStyle}
                  primaryColor={primaryColor}
                  buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
                  buttonTextColor={activeTheme.colors.buttonText}
                />
              ) : null,
              wifi: activeModules.wifi ? (
                <PublicCard
                  key="wifi"
                  icon={<Wifi className="w-5 h-5 text-sky-400" />}
                  iconContainerClass={
                    isDark
                      ? 'bg-sky-500/15 border border-sky-500/25'
                      : 'bg-sky-50 border border-sky-200/80'
                  }
                  iconContainerStyle={{ color: '#0284C7' }}
                  title="Wi-Fi Grátis"
                  subtitle={company.wifi?.ssid ? `Rede: ${company.wifi.ssid}` : 'Toque para ver a senha e conectar'}
                  actionText="Conectar"
                  actionIcon={<Wifi className="w-3.5 h-3.5" />}
                  actionVariant="theme"
                  onAction={handleOpenWifi}
                  onClick={handleOpenWifi}
                  isDark={isDark}
                  cardStyle={themedCardStyle}
                  primaryColor={primaryColor}
                  buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
                  buttonTextColor={activeTheme.colors.buttonText}
                />
              ) : null,
              feedback: activeModules.feedback ? (
                <PublicCard
                  key="feedback"
                  icon={<MessageSquareHeart className="w-5 h-5 text-pink-400" />}
                  iconContainerClass={
                    isDark
                      ? 'bg-pink-500/15 border border-pink-500/25'
                      : 'bg-pink-50 border border-pink-200/80'
                  }
                  iconContainerStyle={{ color: '#EC4899' }}
                  title="Feedback Privado"
                  subtitle="Envie sua mensagem direta à administração"
                  actionText="Opinar"
                  actionIcon={<MessageSquareHeart className="w-3.5 h-3.5" />}
                  actionVariant="theme"
                  onAction={() => setIsFeedbackOpen(true)}
                  onClick={() => setIsFeedbackOpen(true)}
                  isDark={isDark}
                  cardStyle={themedCardStyle}
                  primaryColor={primaryColor}
                  buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
                  buttonTextColor={activeTheme.colors.buttonText}
                />
              ) : null,
              instagram: activeModules.instagram ? (
                <PublicCard
                  key="instagram"
                  icon={<Instagram className="w-5 h-5 text-white" />}
                  iconContainerClass="shadow-xs border border-white/10"
                  iconContainerStyle={{
                    background:
                      'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: '#ffffff',
                  }}
                  title={company.instagram ? `@${company.instagram.replace(/^@/, '')}` : 'Instagram Oficial'}
                  subtitle="Siga nosso perfil oficial no Instagram"
                  actionText="Seguir"
                  actionIcon={<Instagram className="w-3.5 h-3.5" />}
                  actionVariant="theme"
                  onAction={handleOpenInstagram}
                  onClick={handleOpenInstagram}
                  isDark={isDark}
                  cardStyle={themedCardStyle}
                  primaryColor={primaryColor}
                  buttonBgColor={activeTheme.colors.buttonBg || primaryColor}
                  buttonTextColor={activeTheme.colors.buttonText}
                />
              ) : null,
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
              className="flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate"
              style={{
                background: gradientBg,
                color: contrastText,
              }}
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

        {/* Modal do Cardápio Completo (Modo Atalho) */}
        <MenuSheet
          isOpen={isMenuSheetOpen}
          onClose={() => setIsMenuSheetOpen(false)}
          menuItems={menuItems}
          company={company}
          cart={cart}
          onAddToCart={handleAddToCart}
          onDirectOrderWhatsApp={handleDirectOrderWhatsApp}
          onOpenCart={() => setIsCartOpen(true)}
          tableNumber={displayTableLabel || cleanTableNumber || undefined}
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
          autoDetectedTable={displayTableLabel || cleanTableNumber || undefined}
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
