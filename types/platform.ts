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
}

export interface DaySchedule {
  dayOfWeek: number // 0 (Domingo) to 6 (Sábado)
  isOpen: boolean
  openTime: string // e.g. "08:00"
  closeTime: string // e.g. "18:00"
  breakStart?: string // e.g. "12:00"
  breakEnd?: string // e.g. "13:00"
}

export interface BookingSettings {
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

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

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
  isActive: boolean
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
  wifi: CompanyWifi
  locationUrl: string
  addressText: string
  isActive: boolean
  modules: CompanyModules
  loyaltyProgram: LoyaltyProgramConfig
  highlightModule?: string // 'auto' | 'appointments' | 'services' | 'whatsapp' | 'loyalty' | 'googleReview' | 'menu' | etc.
  theme?: 'dark' | 'light' // Public page appearance theme (Escuro / Claro)
  rating?: number
  reviewCount?: number
  bookingSettings?: BookingSettings
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
