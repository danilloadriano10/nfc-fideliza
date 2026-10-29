export type WifiSecurity = 'WPA/WPA2' | 'WEP' | 'OPEN'

export interface CompanyWifi {
  ssid: string
  password?: string
  security: WifiSecurity
}

export interface CompanyModules {
  loyalty: boolean
  googleReview: boolean
  menu: boolean
  wifi: boolean
  whatsapp: boolean
  location: boolean
  feedback: boolean
  instagram: boolean
  services?: boolean
  appointments?: boolean
  products?: boolean
  tables?: boolean
}

export interface DaySchedule {
  dayOfWeek: number // 0 (Domingo) to 6 (Sábado)
  isOpen: boolean
  openTime: string // e.g. "08:00"
  closeTime: string // e.g. "18:00"
  breakStart?: string // e.g. "12:00"
  breakEnd?: string // e.g. "13:00"
}

export type BookingMode = 'diretolink' | 'whatsapp'

export interface BookingSettings {
  mode?: BookingMode
  displayMode?: ModuleDisplayMode // 'full' (Conteúdo completo) | 'card' (Somente card)
  whatsappMessageTemplate?: string
  confirmationWhatsAppTemplate?: string
  slotDurationMinutes: number
  days: DaySchedule[]
  blockedDates?: string[] // "YYYY-MM-DD"
}

export interface CompanyProfessional {
  id: string
  companyId: string
  name: string
  role?: string
  photoUrl?: string
  serviceIds?: string[] // IDs dos serviços atendidos; vazio = todos
  isActive: boolean
  createdAt?: string
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_service' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  companyId: string
  serviceId: string
  serviceName: string
  servicePrice?: number | null
  serviceDurationMinutes?: number | null
  professionalId?: string
  professionalName?: string
  date: string // "YYYY-MM-DD"
  time: string // "HH:MM"
  customerName: string
  customerPhone: string
  status: AppointmentStatus
  notes?: string
  origin?: 'public' | 'manual'
  createdAt: string
  updatedAt?: string
}

export interface CompanyService {
  id: string
  companyId: string
  name: string
  photoUrl?: string
  description?: string
  price?: number | null // null or undefined indicates "Consulte"
  priceType?: 'fixed' | 'consult'
  durationMinutes?: number | null // approximate duration in minutes (e.g., 30, 45, 60)
  category?: string
  order?: number // Ordem de exibição definida pela empresa
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export type ProductCatalogMode = 'internal' | 'external'

export interface ProductCatalogConfig {
  mode: ProductCatalogMode // 'internal' | 'external'
  displayMode?: ModuleDisplayMode // 'full' (Conteúdo completo) | 'card' (Somente card)
  externalButtonText?: string // Default: "Ver Catálogo"
  externalUrl?: string
  whatsappMessageTemplate?: string // Mensagem personalizada do WhatsApp para produtos ({produto}, {preco}, {variacao}, {empresa})
}

export type MenuMode = 'external' | 'internal'

export interface MenuSizeOption {
  id: string
  name: string // Ex: "Pequeno", "Médio", "Grande"
  price?: number | null // Preço fixo deste tamanho ou acréscimo
}

export interface MenuFlavorOption {
  id: string
  name: string // Ex: "Calabresa", "Quatro Queijos"
  description?: string
}

export interface MenuExtraOption {
  id: string
  name: string // Ex: "Bacon Crocante", "Queijo Extra"
  price: number // Ex: 4.50
}

export interface MenuCustomStepOption {
  id: string
  name: string // Ex: "Filé de Frango", "Carne Desfiada", "Tofu"
  description?: string
  price?: number // Acréscimo opcional Ex: 0 ou 4.00
}

export interface MenuCustomStep {
  id: string
  title: string // Ex: "1. Escolha a proteína", "2. Escolha acompanhamentos", "3. Escolha adicionais"
  description?: string
  minSelection: number // Ex: 1
  maxSelection: number // Ex: 1 ou 2
  required: boolean
  options: MenuCustomStepOption[]
}

export interface MenuItem {
  id: string
  companyId: string
  name: string
  photoUrl?: string
  category: string // Ex: "Lanches", "Pizzas", "Bebidas", "Sobremesas", "Combos"
  description?: string
  price?: number | null // Preço base
  priceType?: 'fixed' | 'consult'
  promotionalPrice?: number | null
  isAvailable: boolean // Disponível / Esgotado
  isFeatured?: boolean // Destaque
  isBestSeller?: boolean // Mais pedido
  isNew?: boolean // Novidade
  order?: number // Ordem de exibição

  // Opções e adicionais
  sizes?: MenuSizeOption[] // Tamanhos
  flavorsMax?: number // Ex: até 2 sabores
  flavors?: MenuFlavorOption[] // Sabores
  extras?: MenuExtraOption[] // Adicionais com valor extra
  removableIngredients?: string[] // Remover ingredientes Ex: ["Sem cebola", "Sem maionese"]
  allowNotes?: boolean // Permitir observações do cliente (default true)

  // Monte seu pedido
  isCustomBuilder?: boolean // Flag se é item multi-etapas ("Monte seu pedido")
  customSteps?: MenuCustomStep[] // Etapas configuradas

  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export type ModuleDisplayMode = 'full' | 'card'
export type MenuDisplayMode = ModuleDisplayMode

export interface MenuConfig {
  mode: MenuMode // 'external' | 'internal'
  externalUrl?: string
  categories?: string[]
  displayMode?: ModuleDisplayMode // 'full' (Cardápio completo) | 'card' (Somente card/atalho)
}

export interface ProductVariationOption {
  id: string
  name: string // Ex: "P", "M", "G", "38", "Preto"
  price?: number | null // Preço opcional se houver variação de valor
}

export interface CompanyProduct {
  id: string
  companyId: string
  name: string
  photoUrl?: string
  photos?: string[] // Múltiplas fotos opcionais
  category?: string
  price?: number | null // null or undefined indicates "Sob consulta"
  priceType?: 'fixed' | 'consult'
  promotionalPrice?: number | null
  description?: string
  variations?: ProductVariationOption[] // Tamanhos/variações opcionais
  isAvailable?: boolean // default true
  purchaseUrl?: string
  order?: number // default 0
  isActive: boolean // default true
  createdAt: string
  updatedAt?: string
}

export interface LoyaltyProgramConfig {
  isActive: boolean
  campaignName: string
  goalPoints: number
  rewardDescription: string
}

export interface CompanyOwnerAuth {
  username: string
  password: string
  ownerName?: string
  ownerEmail?: string
  ownerPhone?: string
}

export type PublicPageThemeId =
  | 'clean'
  | 'natural-green'
  | 'dark'
  | 'rustic'
  | 'gold-luxury'
  | 'professional-blue'
  | 'elegant-rose'
  | 'earth'
  | 'vibrant'
  | 'custom'
  | 'light' // Backward compatibility
  | 'absolute-black'

export interface CustomThemeConfig {
  bgType?: 'color' | 'gradient' | 'image'
  bgColor?: string
  bgGradient?: string
  bgImageUrl?: string
  bgImageOpacity?: number
  bgImageBlur?: number
  cardBgColor?: string
  accentColor?: string
  isDarkBase?: boolean
}

export interface AdvancedColorsConfig {
  pageBg?: string      // Fundo da página
  cardBg?: string      // Fundo dos cards
  primary?: string     // Cor principal
  secondary?: string   // Cor secundária
  buttonBg?: string    // Cor dos botões
  priceColor?: string  // Cor dos preços
  titleColor?: string  // Cor dos títulos
  textColor?: string   // Cor dos textos
  borderColor?: string // Cor das bordas/detalhes
}

export type PixKeyType = 'cpf_cnpj' | 'phone' | 'email' | 'random'

export interface CompanyPaymentConfig {
  acceptPix: boolean
  acceptCash: boolean
  acceptDebitCard: boolean
  acceptCreditCard: boolean
  acceptMealVoucher: boolean
  pixReceiverName?: string
  pixKey?: string
  pixKeyType?: PixKeyType
  pixShowUpfront?: boolean // "Exibir Pix para pagamento antecipado"
}

export interface Company {
  id: string
  slug: string
  name: string
  category?: string
  tagline?: string
  logoUrl: string
  coverUrl: string
  primaryColor: string
  secondaryColor: string
  whatsapp: string
  instagram: string
  googleReviewUrl: string
  menuUrl: string
  menuMode?: MenuMode
  menuConfig?: MenuConfig
  menuDisplayMode?: MenuDisplayMode
  servicesDisplayMode?: ModuleDisplayMode
  productsDisplayMode?: ModuleDisplayMode
  appointmentsDisplayMode?: ModuleDisplayMode
  wifi: CompanyWifi
  locationUrl: string
  addressText: string
  isActive: boolean
  modules: CompanyModules
  loyaltyProgram: LoyaltyProgramConfig
  productCatalog?: ProductCatalogConfig
  productWhatsAppTemplate?: string // Mensagem personalizada do WhatsApp para produtos ({produto}, {preco}, {variacao}, {empresa})
  highlightModule?: string // 'auto' | 'appointments' | 'services' | 'whatsapp' | 'loyalty' | 'googleReview' | 'menu' | etc.
  featuredCards?: string[] // IDs of the featured highlight cards chosen for the top of the public page
  featuredCardsCount?: number // Number of top shortcut cards to display (0, 1, 2, 3, or 4)
  cardOrder?: string[] // Custom display order for public page modules/cards
  publicSectionsOrder?: string[] // Custom display order for public page sections
  productsOrder?: string[] // Custom display order for catalog products
  servicesOrder?: string[] // Custom display order for company services
  menuItemsOrder?: string[] // Custom display order for digital menu items
  theme?: PublicPageThemeId | string // Public page appearance theme (Clean, Verde Natural, Escuro Premium, Rústico, etc.)
  customThemeConfig?: CustomThemeConfig // Specific configuration when theme is 'custom'
  themeColors?: AdvancedColorsConfig // Custom advanced colors for individual customization
  rating?: number
  reviewCount?: number
  bookingSettings?: BookingSettings
  paymentConfig?: CompanyPaymentConfig // Configurações de formas de pagamento e Pix
  // Ajustes de enquadramento da foto de capa
  coverFit?: 'cover' | 'contain' | 'logo'
  coverPositionX?: 'left' | 'center' | 'right' | string
  coverPositionY?: 'top' | 'center' | 'bottom' | string
  coverZoom?: number
  // Configurações da Central de Pedidos
  autoAcceptOrders?: boolean // Aceitar pedidos automaticamente (vai direto para Em Preparo)
  soundAlertNewOrders?: boolean // Alerta sonoro quando chegar novo pedido
  subscription?: CompanySubscription // Assinatura Asaas da empresa
  ownerAuth?: CompanyOwnerAuth
  origin?: 'admin' | 'self_service'
  onboardingCompleted?: boolean
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  companyId: string
  name: string
  phone: string // Normalized phone (digits only)
  currentPoints: number
  totalVisits: number
  completedCycles: number
  availableRewards: number
  createdAt: string
  lastActivityAt: string
}

export interface PointRequest {
  id: string
  companyId: string
  customerId: string
  customerName: string
  customerPhone: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt?: string
  resolvedAt?: string
  resolvedBy?: string
  approvedBy?: string
  rejectedBy?: string
}

export type ActivityType =
  | 'point_added'
  | 'point_rejected'
  | 'reward_earned'
  | 'reward_redeemed'
  | 'customer_created'

export interface ActivityLog {
  id: string
  companyId: string
  customerId: string
  customerName: string
  customerPhone: string
  type: ActivityType
  description: string
  pointsChange?: number
  rewardName?: string
  approvedBy: string
  timestamp: string
}

export interface PrivateFeedback {
  id: string
  companyId: string
  customerName?: string
  customerPhone?: string
  rating?: number // 1 to 5
  message: string
  createdAt: string
}

export interface GlobalStats {
  totalCompanies: number
  activeCompanies: number
  totalCustomers: number
  totalPointsDistributed: number
  totalRewardsEarned: number
  totalRewardsRedeemed: number
}

// ==========================================
// MESAS E PEDIDOS DO SALÃO (CONSUMIR NO LOCAL)
// ==========================================

export interface CompanyTable {
  id: string
  companyId: string
  name: string // ex: "Mesa 01", "Mesa 08"
  identifier: string // ex: "01", "08"
  isActive: boolean
  qrCodeUrl?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export type TableOrderStatus =
  | 'novo'
  | 'aceito'
  | 'preparo'
  | 'pronto'
  | 'pronto_retirada'
  | 'servido'
  | 'saiu_entrega'
  | 'entregue'
  | 'finalizado'
  | 'cancelado'

export type OrderOrigin = 'mesa' | 'retirada' | 'entrega'

export interface TableOrderHistoryEvent {
  id: string
  timestamp: string
  action: string
  description?: string
  performedBy?: string
}

export interface CompanyCourier {
  id: string
  companyId: string
  name: string
  phone: string
  isActive: boolean
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface TableOrderItem {
  id: string
  menuItemId: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  sizeName?: string
  flavors?: string[]
  extras?: string[]
  removals?: string[]
  notes?: string
  customSteps?: Array<{ stepTitle: string; options: string[] }>
}

export type OrderPaymentStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'paid'
  | 'not_found'
  | 'payment_on_delivery'
  | 'cancelled'

export interface TableOrder {
  id: string
  companyId: string
  orderType?: OrderOrigin
  origin?: OrderOrigin
  tableNumber?: string // ex: "08" ou "Mesa 08"
  tableId?: string
  customerName?: string
  customerPhone?: string
  deliveryAddress?: string
  address?: string
  addressNumber?: string
  neighborhood?: string
  complement?: string
  referencePoint?: string
  city?: string
  locationUrl?: string | null
  // Forma e status do pagamento (independente do status operacional do pedido)
  paymentMethod?: string // 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'vale_refeicao' | etc.
  paymentStatus?: OrderPaymentStatus
  paymentChangeFor?: number | null // Troco para R$
  receiptUrl?: string // Comprovante em anexo (imagem base64 ou URL)
  paymentReceiptUrl?: string // Alias para compatibilidade
  receiptName?: string // Nome do arquivo do comprovante (ex: comprovante_pix.png)
  receiptUploadedAt?: string // Data/hora do upload do comprovante
  receiptType?: string // MIME type (image/png, image/jpeg, application/pdf)
  subtotal?: number
  discount?: number
  surcharge?: number // Acréscimo / Taxa de entrega
  totalAmount: number
  total?: number // Alias para compatibilidade
  items: TableOrderItem[]
  notes?: string
  status: TableOrderStatus
  cancellationReason?: string
  // Motoboy / Entregador selecionado
  courierId?: string
  courierName?: string
  courierPhone?: string
  // Histórico de eventos operacionais
  history?: TableOrderHistoryEvent[]
  isManualOrder?: boolean // Pedido lançado manualmente pelo estabelecimento (balcão/telefone)
  createdAt: string
  updatedAt?: string
}

// ==========================================
// ASSINATURAS E COBRANÇAS ASAAS
// ==========================================

export type AsaasSubscriptionStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'INACTIVE'
  | 'TRIAL'

export type AsaasPaymentMethod = 'PIX' | 'CREDIT_CARD' | 'UNDEFINED'

export interface CompanySubscription {
  id: string
  companyId: string
  asaasCustomerId: string
  asaasSubscriptionId: string
  status: AsaasSubscriptionStatus
  paymentMethod: AsaasPaymentMethod
  value: number // default: 69.99
  cycle: 'MONTHLY'
  nextDueDate: string | null
  lastPaymentDate: string | null
  lastPaymentStatus?: string | null
  lastPaymentId?: string | null
  pixQrCodeUrl?: string | null
  pixCopiaECola?: string | null
  pixExpirationDate?: string | null
  creditCardLast4?: string | null
  creditCardBrand?: string | null
  invoiceUrl?: string | null
  description?: string
  externalReference?: string
  createdAt: string
  updatedAt: string
}

export interface AsaasWebhookEventLog {
  id: string
  event: string
  dateCreated: string
  processedAt: string
  companyId?: string
  subscriptionId?: string
  paymentId?: string
  status: 'PROCESSED' | 'SKIPPED' | 'FAILED'
  error?: string
}

