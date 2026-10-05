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
  ownerAuth?: CompanyOwnerAuth
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
