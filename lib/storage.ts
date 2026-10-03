import {
  Company,
  Customer,
  PointRequest,
  ActivityLog,
  PrivateFeedback,
  GlobalStats,
} from '@/types/platform'
import {
  INITIAL_COMPANIES,
  INITIAL_CUSTOMERS,
  INITIAL_REQUESTS,
  INITIAL_LOGS,
  INITIAL_FEEDBACKS,
} from './initial-data'
import { normalizePhone } from './utils'

const STORAGE_KEYS = {
  COMPANIES: 'nfc_tenant_companies_v1',
  CUSTOMERS: 'nfc_tenant_customers_v1',
  REQUESTS: 'nfc_tenant_requests_v1',
  LOGS: 'nfc_tenant_logs_v1',
  FEEDBACKS: 'nfc_tenant_feedbacks_v1',
  CURRENT_CUSTOMER_PREFIX: 'nfc_client_session_',
}

// Event dispatcher for real-time reactivity within the same tab and cross-tabs
export const DATA_CHANGE_EVENT = 'nfc_platform_data_sync'

export function notifyDataChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_CHANGE_EVENT))
    // Also touch a timestamp in localStorage so other tabs react to 'storage' event
    try {
      localStorage.setItem('nfc_sync_ping', Date.now().toString())
    } catch {}
  }
}

// Memory cache fallback for SSR and quick reads
let memoryCompanies: Company[] = [...INITIAL_COMPANIES]
let memoryCustomers: Customer[] = [...INITIAL_CUSTOMERS]
let memoryRequests: PointRequest[] = [...INITIAL_REQUESTS]
let memoryLogs: ActivityLog[] = [...INITIAL_LOGS]
let memoryFeedbacks: PrivateFeedback[] = [...INITIAL_FEEDBACKS]

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function getItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) return defaultValue
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue))
      return defaultValue
    }
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err)
    return defaultValue
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`Error writing ${key} to storage:`, err)
  }
}

// ==========================================
// 1. COMPANIES (MULTI-TENANT ROOTS)
// ==========================================

export function getAllCompanies(): Company[] {
  if (!isBrowser()) return memoryCompanies
  return getItem<Company[]>(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES)
}

export function getCompanyBySlug(slug: string): Company | null {
  const companies = getAllCompanies()
  const cleanSlug = slug.toLowerCase().trim()
  return companies.find((c) => c.slug.toLowerCase() === cleanSlug) || null
}

export function getCompanyById(id: string): Company | null {
  const companies = getAllCompanies()
  return companies.find((c) => c.id === id) || null
}

export function saveCompanyLocally(company: Company): void {
  const current = getAllCompanies()
  const idx = current.findIndex((c) => c.id === company.id || c.slug.toLowerCase() === company.slug.toLowerCase())
  let updated: Company[]
  if (idx >= 0) {
    updated = [...current.slice(0, idx), company, ...current.slice(idx + 1)]
  } else {
    updated = [company, ...current]
  }
  setItem(STORAGE_KEYS.COMPANIES, updated)
  memoryCompanies = updated
  notifyDataChange()
}

export function saveCompany(updated: Company): { success: boolean; error?: string } {
  const companies = getAllCompanies()
  // Ensure slug is unique if changed
  const existingWithSlug = companies.find(
    (c) => c.slug.toLowerCase() === updated.slug.toLowerCase() && c.id !== updated.id
  )
  if (existingWithSlug) {
    return { success: false, error: 'Já existe outro estabelecimento utilizando este slug.' }
  }

  const index = companies.findIndex((c) => c.id === updated.id)
  let newCompanies: Company[]
  if (index >= 0) {
    newCompanies = [
      ...companies.slice(0, index),
      { ...updated, updatedAt: new Date().toISOString() },
      ...companies.slice(index + 1),
    ]
  } else {
    newCompanies = [
      ...companies,
      { ...updated, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ]
  }

  setItem(STORAGE_KEYS.COMPANIES, newCompanies)
  memoryCompanies = newCompanies
  notifyDataChange()

  // Asynchronously synchronize with shared server storage
  if (isBrowser()) {
    fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch((err) => console.error('Error syncing company to server:', err))
  }

  return { success: true }
}

export function toggleCompanyStatus(companyId: string): boolean {
  const companies = getAllCompanies()
  const index = companies.findIndex((c) => c.id === companyId)
  if (index === -1) return false

  const updated = {
    ...companies[index],
    isActive: !companies[index].isActive,
    updatedAt: new Date().toISOString(),
  }
  companies[index] = updated
  setItem(STORAGE_KEYS.COMPANIES, companies)
  memoryCompanies = companies
  notifyDataChange()

  if (isBrowser()) {
    fetch(`/api/companies?id=${encodeURIComponent(companyId)}`, {
      method: 'PATCH',
    }).catch((err) => console.error('Error toggling company status on server:', err))
  }

  return true
}

export function deleteCompany(companyId: string): boolean {
  const companies = getAllCompanies()
  const filtered = companies.filter((c) => c.id !== companyId)
  if (filtered.length === companies.length) return false

  setItem(STORAGE_KEYS.COMPANIES, filtered)
  memoryCompanies = filtered

  // Cascade delete isolated company data
  const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS).filter(
    (c) => c.companyId !== companyId
  )
  setItem(STORAGE_KEYS.CUSTOMERS, customers)

  const requests = getItem<PointRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS).filter(
    (r) => r.companyId !== companyId
  )
  setItem(STORAGE_KEYS.REQUESTS, requests)

  const logs = getItem<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS).filter(
    (l) => l.companyId !== companyId
  )
  setItem(STORAGE_KEYS.LOGS, logs)

  const feedbacks = getItem<PrivateFeedback[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS).filter(
    (f) => f.companyId !== companyId
  )
  setItem(STORAGE_KEYS.FEEDBACKS, feedbacks)

  notifyDataChange()

  if (isBrowser()) {
    fetch(`/api/companies?id=${encodeURIComponent(companyId)}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Error deleting company on server:', err))
  }

  return true
}

// ==========================================
// 2. CUSTOMERS (STRICT TENANT ISOLATION)
// ==========================================

export function getCompanyCustomers(companyId: string): Customer[] {
  const all = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  return all.filter((c) => c.companyId === companyId)
}

export function getCustomerByPhone(companyId: string, rawPhone: string): Customer | null {
  const normalized = normalizePhone(rawPhone)
  if (!normalized) return null
  const customers = getCompanyCustomers(companyId)
  return customers.find((c) => c.phone === normalized) || null
}

export function getCustomerById(companyId: string, customerId: string): Customer | null {
  const customers = getCompanyCustomers(companyId)
  return customers.find((c) => c.id === customerId) || null
}

export function registerCustomer(
  companyId: string,
  data: { name: string; phone: string }
): { success: boolean; customer?: Customer; error?: string } {
  const normalized = normalizePhone(data.phone)
  if (!normalized || normalized.length < 10) {
    return { success: false, error: 'Por favor, informe um número de WhatsApp válido com DDD.' }
  }
  if (!data.name.trim()) {
    return { success: false, error: 'Por favor, informe o seu nome.' }
  }

  const existing = getCustomerByPhone(companyId, normalized)
  if (existing) {
    return {
      success: false,
      error: 'Este número de WhatsApp já possui um cartão fidelidade cadastrado neste estabelecimento.',
      customer: existing,
    }
  }

  const newCustomer: Customer = {
    id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    companyId,
    name: data.name.trim(),
    phone: normalized,
    currentPoints: 0,
    totalVisits: 0,
    completedCycles: 0,
    availableRewards: 0,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  }

  const all = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  const updatedAll = [newCustomer, ...all]
  setItem(STORAGE_KEYS.CUSTOMERS, updatedAll)
  memoryCustomers = updatedAll

  // Log activity
  logActivity({
    companyId,
    customerId: newCustomer.id,
    customerName: newCustomer.name,
    customerPhone: newCustomer.phone,
    type: 'customer_created',
    description: 'Criou seu primeiro cartão fidelidade via NFC.',
    approvedBy: 'Auto-cadastro NFC',
  })

  // Set active customer in local device session for this company
  saveLocalCustomerSession(companyId, newCustomer.phone)
  notifyDataChange()
  return { success: true, customer: newCustomer }
}

// Local device remember-me per company
export function getLocalCustomerSession(companyId: string): string | null {
  if (!isBrowser()) return null
  try {
    return localStorage.getItem(`${STORAGE_KEYS.CURRENT_CUSTOMER_PREFIX}${companyId}`)
  } catch {
    return null
  }
}

export function saveLocalCustomerSession(companyId: string, phone: string): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(`${STORAGE_KEYS.CURRENT_CUSTOMER_PREFIX}${companyId}`, normalizePhone(phone))
  } catch {}
}

export function clearLocalCustomerSession(companyId: string): void {
  if (!isBrowser()) return
  try {
    localStorage.removeItem(`${STORAGE_KEYS.CURRENT_CUSTOMER_PREFIX}${companyId}`)
  } catch {}
}

// ==========================================
// 3. POINT REQUESTS & CASHIER VALIDATION
// ==========================================

export function getCompanyPointRequests(companyId: string): PointRequest[] {
  const all = getItem<PointRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS)
  return all.filter((r) => r.companyId === companyId)
}

export function requestPoint(
  companyId: string,
  customerId: string
): { success: boolean; error?: string; request?: PointRequest } {
  const customer = getCustomerById(companyId, customerId)
  if (!customer) {
    return { success: false, error: 'Cliente não localizado.' }
  }

  const existingRequests = getCompanyPointRequests(companyId)
  // Check if there is already an active pending request from this customer
  const pending = existingRequests.find(
    (r) => r.customerId === customerId && r.status === 'pending'
  )
  if (pending) {
    return {
      success: false,
      error: 'Você já possui uma solicitação de ponto aguardando confirmação no caixa.',
      request: pending,
    }
  }

  const newRequest: PointRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  const all = getItem<PointRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS)
  const updatedAll = [newRequest, ...all]
  setItem(STORAGE_KEYS.REQUESTS, updatedAll)
  memoryRequests = updatedAll
  notifyDataChange()

  return { success: true, request: newRequest }
}

export function approvePointRequest(
  requestId: string,
  approvedBy: string = 'Caixa Balcão'
): { success: boolean; error?: string } {
  const allRequests = getItem<PointRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS)
  const reqIndex = allRequests.findIndex((r) => r.id === requestId)
  if (reqIndex === -1) {
    return { success: false, error: 'Solicitação não encontrada.' }
  }

  const request = allRequests[reqIndex]
  if (request.status !== 'pending') {
    return { success: false, error: 'Esta solicitação já foi finalizada anteriormente.' }
  }

  // Update request
  const resolvedReq: PointRequest = {
    ...request,
    status: 'approved',
    resolvedAt: new Date().toISOString(),
    resolvedBy: approvedBy,
  }
  allRequests[reqIndex] = resolvedReq
  setItem(STORAGE_KEYS.REQUESTS, allRequests)

  // Credit customer points safely
  const company = getCompanyById(request.companyId)
  const goal = company?.loyaltyProgram.goalPoints || 10
  const rewardName = company?.loyaltyProgram.rewardDescription || 'Recompensa de Fidelidade'

  const allCustomers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  const custIndex = allCustomers.findIndex(
    (c) => c.id === request.customerId && c.companyId === request.companyId
  )

  if (custIndex >= 0) {
    const cust = allCustomers[custIndex]
    const nextPoints = cust.currentPoints + 1
    const reachedGoal = nextPoints >= goal

    let updatedPoints = nextPoints
    let updatedAvailableRewards = cust.availableRewards
    let updatedCompletedCycles = cust.completedCycles

    if (reachedGoal) {
      updatedAvailableRewards += 1
      updatedCompletedCycles += 1
      // Keep points at goal until redeemed, or visual 10/10
      updatedPoints = goal
    }

    const updatedCustomer: Customer = {
      ...cust,
      currentPoints: updatedPoints,
      totalVisits: cust.totalVisits + 1,
      availableRewards: updatedAvailableRewards,
      completedCycles: updatedCompletedCycles,
      lastActivityAt: new Date().toISOString(),
    }
    allCustomers[custIndex] = updatedCustomer
    setItem(STORAGE_KEYS.CUSTOMERS, allCustomers)

    // Log point approval
    logActivity({
      companyId: request.companyId,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      type: 'point_added',
      description: `Aprovado +1 ponto pelo caixa (${updatedPoints}/${goal}).`,
      pointsChange: 1,
      approvedBy,
    })

    if (reachedGoal) {
      logActivity({
        companyId: request.companyId,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        type: 'reward_earned',
        description: `Completou a meta de ${goal} pontos e conquistou: ${rewardName}!`,
        pointsChange: 0,
        rewardName,
        approvedBy,
      })
    }
  }

  notifyDataChange()
  return { success: true }
}

export function rejectPointRequest(
  requestId: string,
  rejectedBy: string = 'Caixa Balcão'
): { success: boolean; error?: string } {
  const allRequests = getItem<PointRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS)
  const reqIndex = allRequests.findIndex((r) => r.id === requestId)
  if (reqIndex === -1) {
    return { success: false, error: 'Solicitação não encontrada.' }
  }

  const request = allRequests[reqIndex]
  if (request.status !== 'pending') {
    return { success: false, error: 'Esta solicitação já foi finalizada.' }
  }

  allRequests[reqIndex] = {
    ...request,
    status: 'rejected',
    resolvedAt: new Date().toISOString(),
    resolvedBy: rejectedBy,
  }
  setItem(STORAGE_KEYS.REQUESTS, allRequests)

  logActivity({
    companyId: request.companyId,
    customerId: request.customerId,
    customerName: request.customerName,
    customerPhone: request.customerPhone,
    type: 'point_rejected',
    description: 'Solicitação de ponto recusada pelo caixa.',
    approvedBy: rejectedBy,
  })

  notifyDataChange()
  return { success: true }
}

export function directAddPoint(
  companyId: string,
  customerId: string,
  approvedBy: string = 'Caixa Balcão'
): { success: boolean; error?: string; customer?: Customer } {
  const company = getCompanyById(companyId)
  if (!company) return { success: false, error: 'Empresa não encontrada.' }

  const goal = company.loyaltyProgram.goalPoints || 10
  const rewardName = company.loyaltyProgram.rewardDescription || 'Recompensa de Fidelidade'

  const allCustomers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  const custIndex = allCustomers.findIndex(
    (c) => c.id === customerId && c.companyId === companyId
  )

  if (custIndex === -1) {
    return { success: false, error: 'Cliente não encontrado nesta empresa.' }
  }

  const cust = allCustomers[custIndex]
  // If already at goal and hasn't redeemed, prompt to redeem first
  if (cust.currentPoints >= goal && cust.availableRewards > 0) {
    return {
      success: false,
      error: `Cliente já atingiu a meta de ${goal} pontos e possui 1 recompensa pronta para resgate!`,
    }
  }

  const nextPoints = cust.currentPoints + 1
  const reachedGoal = nextPoints >= goal

  let updatedPoints = nextPoints
  let updatedAvailableRewards = cust.availableRewards
  let updatedCompletedCycles = cust.completedCycles

  if (reachedGoal) {
    updatedAvailableRewards += 1
    updatedCompletedCycles += 1
    updatedPoints = goal
  }

  const updatedCustomer: Customer = {
    ...cust,
    currentPoints: updatedPoints,
    totalVisits: cust.totalVisits + 1,
    availableRewards: updatedAvailableRewards,
    completedCycles: updatedCompletedCycles,
    lastActivityAt: new Date().toISOString(),
  }

  allCustomers[custIndex] = updatedCustomer
  setItem(STORAGE_KEYS.CUSTOMERS, allCustomers)

  logActivity({
    companyId,
    customerId: cust.id,
    customerName: cust.name,
    customerPhone: cust.phone,
    type: 'point_added',
    description: `Ponto direto atribuído pelo caixa (${updatedPoints}/${goal}).`,
    pointsChange: 1,
    approvedBy,
  })

  if (reachedGoal) {
    logActivity({
      companyId,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      type: 'reward_earned',
      description: `Meta de ${goal} pontos atingida! Liberado: ${rewardName}`,
      pointsChange: 0,
      rewardName,
      approvedBy,
    })
  }

  notifyDataChange()
  return { success: true, customer: updatedCustomer }
}

export function redeemReward(
  companyId: string,
  customerId: string,
  approvedBy: string = 'Gerente / Caixa'
): { success: boolean; error?: string; customer?: Customer } {
  const company = getCompanyById(companyId)
  if (!company) return { success: false, error: 'Empresa não encontrada.' }

  const allCustomers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  const custIndex = allCustomers.findIndex(
    (c) => c.id === customerId && c.companyId === companyId
  )

  if (custIndex === -1) return { success: false, error: 'Cliente não encontrado.' }

  const cust = allCustomers[custIndex]
  if (cust.availableRewards <= 0) {
    return { success: false, error: 'O cliente não possui nenhuma recompensa disponível para resgate.' }
  }

  const rewardName = company.loyaltyProgram.rewardDescription

  // After redemption, decrease available reward and restart loyalty points cycle smoothly
  const updatedCustomer: Customer = {
    ...cust,
    availableRewards: Math.max(0, cust.availableRewards - 1),
    currentPoints: 0, // Fresh new cycle begins without losing past stats
    lastActivityAt: new Date().toISOString(),
  }

  allCustomers[custIndex] = updatedCustomer
  setItem(STORAGE_KEYS.CUSTOMERS, allCustomers)

  logActivity({
    companyId,
    customerId: cust.id,
    customerName: cust.name,
    customerPhone: cust.phone,
    type: 'reward_redeemed',
    description: `Recompensa resgatada com sucesso: ${rewardName}. Novo ciclo de fidelidade iniciado!`,
    rewardName,
    approvedBy,
  })

  notifyDataChange()
  return { success: true, customer: updatedCustomer }
}

// ==========================================
// 4. ACTIVITY AUDIT LOGS
// ==========================================

export function logActivity(entry: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
  const newLog: ActivityLog = {
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  }
  const all = getItem<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS)
  const updated = [newLog, ...all]
  setItem(STORAGE_KEYS.LOGS, updated)
  memoryLogs = updated
  return newLog
}

export function getCompanyActivityLogs(companyId: string): ActivityLog[] {
  const all = getItem<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS)
  return all.filter((l) => l.companyId === companyId)
}

export function getAllActivityLogs(): ActivityLog[] {
  return getItem<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS)
}

// ==========================================
// 5. PRIVATE FEEDBACKS
// ==========================================

export function submitFeedback(
  companyId: string,
  data: { rating?: number; message: string; customerName?: string; customerPhone?: string }
): { success: boolean; error?: string } {
  if (!data.message.trim()) {
    return { success: false, error: 'Por favor, escreva sua mensagem ou sugestão.' }
  }

  const newFeedback: PrivateFeedback = {
    id: `feed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId,
    rating: data.rating,
    message: data.message.trim(),
    customerName: data.customerName?.trim() || undefined,
    customerPhone: data.customerPhone ? normalizePhone(data.customerPhone) : undefined,
    createdAt: new Date().toISOString(),
  }

  const all = getItem<PrivateFeedback[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS)
  const updated = [newFeedback, ...all]
  setItem(STORAGE_KEYS.FEEDBACKS, updated)
  memoryFeedbacks = updated
  notifyDataChange()

  // Asynchronously synchronize with shared server storage
  if (isBrowser()) {
    fetch('/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        rating: data.rating,
        message: data.message,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
      }),
    }).catch((err) => console.error('Error syncing feedback to server:', err))
  }

  return { success: true }
}

export function getCompanyFeedbacks(companyId: string): PrivateFeedback[] {
  if (!companyId) return []
  const all = getItem<PrivateFeedback[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS)
  return all.filter((f) => f.companyId === companyId)
}

export async function fetchFeedbacksForCompany(companyId: string): Promise<PrivateFeedback[]> {
  if (!companyId) return []
  if (!isBrowser()) return getCompanyFeedbacks(companyId)

  try {
    const res = await fetch(`/api/feedbacks?companyId=${encodeURIComponent(companyId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data?.feedbacks)) {
        const current = getItem<PrivateFeedback[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS)
        const others = current.filter((f) => f.companyId !== companyId)
        const merged = [...data.feedbacks, ...others]
        setItem(STORAGE_KEYS.FEEDBACKS, merged)
        memoryFeedbacks = merged
        // Do NOT call notifyDataChange() here to prevent recursive re-fetch loops
        return data.feedbacks
      }
    }
  } catch (err) {
    // Graceful fallback: return local feedbacks or empty array without crashing
    console.warn('Could not fetch remote feedbacks, using local cache:', err)
  }

  return getCompanyFeedbacks(companyId) || []
}

export async function syncCompaniesFromServer(): Promise<Company[]> {
  if (!isBrowser()) return memoryCompanies
  try {
    const res = await fetch('/api/companies')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.companies) && data.companies.length > 0) {
        setItem(STORAGE_KEYS.COMPANIES, data.companies)
        memoryCompanies = data.companies
        notifyDataChange()
        return data.companies
      }
    }
  } catch (err) {
    console.error('Error syncing companies from server:', err)
  }
  return getAllCompanies()
}

// ==========================================
// 6. GLOBAL METRICS
// ==========================================

export function getGlobalPlatformStats(): GlobalStats {
  const companies = getAllCompanies()
  const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  const logs = getItem<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS)

  const totalPoints = logs.reduce((acc, log) => acc + (log.pointsChange || 0), 0)
  const totalRewardsEarned = logs.filter((l) => l.type === 'reward_earned').length
  const totalRewardsRedeemed = logs.filter((l) => l.type === 'reward_redeemed').length

  return {
    totalCompanies: companies.length,
    activeCompanies: companies.filter((c) => c.isActive).length,
    totalCustomers: customers.length,
    totalPointsDistributed: totalPoints,
    totalRewardsEarned,
    totalRewardsRedeemed,
  }
}

// ==========================================
// 7. DEMO DATA RESET
// ==========================================

export function resetDemoData(): void {
  if (!isBrowser()) return
  setItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES)
  setItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  setItem(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS)
  setItem(STORAGE_KEYS.LOGS, INITIAL_LOGS)
  setItem(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS)
  notifyDataChange()
}
