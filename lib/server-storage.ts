/**
 * Server-Side Data Layer Powered by Firebase Cloud Firestore.
 * Firestore is the STRICT and ONLY source of truth for TapHub.
 * No local JSON, no server memory, no mocked arrays.
 */

import { cache } from 'react'

// Cache em memória com TTL para consultas públicas, eliminando queries repetidas ao Firestore
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

function getMemoryCached<T>(key: string): T | null {
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key)
    return null
  }
  return entry.data as T
}

function setMemoryCached<T>(key: string, data: T, ttlMs: number = 60_000): void {
  if (memoryCache.size > 2000) {
    const oldestKey = memoryCache.keys().next().value
    if (oldestKey) memoryCache.delete(oldestKey)
  }
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

export function invalidateServerStorageCache(prefix: string): void {
  const clean = prefix.toLowerCase().trim()
  for (const key of memoryCache.keys()) {
    if (key.includes(clean)) {
      memoryCache.delete(key)
    }
  }
}

import {
  getFirestoreCompanies,
  getFirestoreDeletedCompanyIds,
  getFirestoreCompanyBySlug,
  getFirestoreCompanyById,
  saveFirestoreCompany,
  deleteFirestoreCompany,
  toggleFirestoreCompanyStatus,
  getFirestoreCompanyCustomers,
  getFirestoreCustomerByPhone,
  getFirestoreCustomerById,
  registerFirestoreCustomer,
  directAddPointInFirestore,
  redeemRewardInFirestore,
  getFirestorePointRequests,
  getFirestorePointRequestById,
  createPointRequestInFirestore,
  approvePointRequestInFirestore,
  rejectPointRequestInFirestore,
  getFirestoreCompanyLogs,
  addFirestoreActivityLog,
  getFirestoreFeedbacks,
  saveFirestoreFeedback,
  getFirestoreServices,
  getFirestoreServiceById,
  saveFirestoreService,
  deleteFirestoreService,
  toggleFirestoreServiceStatus,
  getFirestoreProducts,
  getFirestoreProductById,
  saveFirestoreProduct,
  deleteFirestoreProduct,
  toggleFirestoreProductStatus,
  getFirestoreMenuItems,
  getFirestoreMenuItemById,
  saveFirestoreMenuItem,
  deleteFirestoreMenuItem,
  toggleFirestoreMenuItemStatus,
  getFirestoreAppointments,
  createFirestoreAppointment,
  updateFirestoreAppointmentStatus,
  updateFirestoreAppointment,
  deleteFirestoreAppointment,
  getFirestoreProfessionals,
  saveFirestoreProfessional,
  deleteFirestoreProfessional,
  saveFirestoreProductsOrder,
  saveFirestoreServicesOrder,
  saveFirestoreMenuItemsOrder,
  getFirestoreTables,
  saveFirestoreTable,
  deleteFirestoreTable,
  toggleFirestoreTableStatus,
  getFirestoreTableOrders,
  saveFirestoreTableOrder,
  updateFirestoreTableOrderStatus,
  updateFirestoreTableOrderFull,
  deleteFirestoreTableOrder,
  getFirestoreCouriers,
  saveFirestoreCourier,
  deleteFirestoreCourier,
  getFirestoreSubscription,
  saveFirestoreSubscription,
  getFirestoreSubscriptionByAsaasId,
  getFirestoreSubscriptionByAsaasCustomerId,
  getFirestoreSubscriptionByMpPreapprovalId,
  recordMpWebhookEvent,
  recordAsaasWebhookEvent,
  isAsaasWebhookEventProcessed,
  getFirestoreExternalLinks,
  getFirestoreExternalLinkById,
  saveFirestoreExternalLink,
  deleteFirestoreExternalLink,
  toggleFirestoreExternalLinkStatus,
  saveFirestoreExternalLinksOrder,
  ensureFirestoreInitialized,
} from './firestore-service'

import {
  Company,
  Customer,
  PointRequest,
  ActivityLog,
  PrivateFeedback,
  CompanyService,
  CompanyProduct,
  MenuItem,
  Appointment,
  AppointmentStatus,
  CompanyProfessional,
  CompanyTable,
  TableOrder,
  TableOrderStatus,
  CompanyCourier,
  CompanySubscription,
  CompanyExternalLink,
} from '@/types/platform'

// Ensure system migration is initialized on startup
ensureFirestoreInitialized().catch((err) => {
  console.error('Initialization error in Firestore service:', err)
})

// ==========================================
// 1. COMPANIES (MULTI-TENANT FIRESTORE)
// ==========================================

export async function getServerCompanies(): Promise<Company[]> {
  return await getFirestoreCompanies()
}

export async function getServerDeletedCompanyIds(): Promise<string[]> {
  return await getFirestoreDeletedCompanyIds()
}

export const getServerCompanyBySlug = cache(async (slug: string): Promise<Company | null> => {
  if (!slug) return null
  const cacheKey = `comp:slug:${slug.toLowerCase().trim()}`
  const cached = getMemoryCached<Company>(cacheKey)
  if (cached) return cached

  const comp = await getFirestoreCompanyBySlug(slug)
  if (comp) {
    setMemoryCached(cacheKey, comp, 60_000)
    setMemoryCached(`comp:id:${comp.id}`, comp, 60_000)
  }
  return comp
})

export const getServerCompanyById = cache(async (id: string): Promise<Company | null> => {
  if (!id) return null
  const cacheKey = `comp:id:${id.trim()}`
  const cached = getMemoryCached<Company>(cacheKey)
  if (cached) return cached

  const comp = await getFirestoreCompanyById(id)
  if (comp) {
    setMemoryCached(cacheKey, comp, 60_000)
    if (comp.slug) setMemoryCached(`comp:slug:${comp.slug.toLowerCase().trim()}`, comp, 60_000)
  }
  return comp
})

export async function saveServerCompany(
  company: Company
): Promise<{ success: boolean; company?: Company; error?: string }> {
  invalidateServerStorageCache(company.id)
  if (company.slug) invalidateServerStorageCache(company.slug)
  return await saveFirestoreCompany(company)
}

export async function deleteServerCompany(companyId: string): Promise<boolean> {
  invalidateServerStorageCache(companyId)
  return await deleteFirestoreCompany(companyId)
}

export async function toggleServerCompanyStatus(companyId: string): Promise<boolean> {
  invalidateServerStorageCache(companyId)
  return await toggleFirestoreCompanyStatus(companyId)
}

// ==========================================
// 2. CUSTOMERS (MULTI-TENANT & PERSISTENT)
// ==========================================

export async function getServerCompanyCustomers(companyId: string): Promise<Customer[]> {
  return await getFirestoreCompanyCustomers(companyId)
}

export async function getServerCustomerByPhone(
  companyId: string,
  rawPhone: string
): Promise<Customer | null> {
  return await getFirestoreCustomerByPhone(companyId, rawPhone)
}

export async function getServerCustomerById(
  companyId: string,
  customerId: string
): Promise<Customer | null> {
  return await getFirestoreCustomerById(companyId, customerId)
}

export async function registerServerCustomer(
  companyId: string,
  data: { name: string; phone: string }
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  return await registerFirestoreCustomer(companyId, data)
}

export async function directAddPointOnServer(
  companyId: string,
  customerId: string,
  operatorName: string = 'Caixa Balcão'
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  return await directAddPointInFirestore(companyId, customerId, operatorName)
}

export async function redeemRewardOnServer(
  companyId: string,
  customerId: string,
  operatorName: string = 'Gerente / Caixa'
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  return await redeemRewardInFirestore(companyId, customerId, operatorName)
}

// ==========================================
// 3. POINT REQUESTS (CROSS-DEVICE ATOMIC)
// ==========================================

export async function getServerPointRequests(
  companyId: string,
  status?: 'pending' | 'approved' | 'rejected'
): Promise<PointRequest[]> {
  return await getFirestorePointRequests(companyId, status)
}

export async function getServerPointRequestById(requestId: string): Promise<PointRequest | null> {
  return await getFirestorePointRequestById(requestId)
}

export async function createPointRequestOnServer(
  companyId: string,
  data: {
    customerId?: string
    name: string
    phone: string
  }
): Promise<{ success: boolean; request?: PointRequest; customer?: Customer; error?: string }> {
  return await createPointRequestInFirestore(companyId, data)
}

export async function approvePointRequestOnServer(
  requestId: string,
  operatorName: string = 'Caixa Balcão'
): Promise<{ success: boolean; request?: PointRequest; customer?: Customer; error?: string }> {
  return await approvePointRequestInFirestore(requestId, operatorName)
}

export async function rejectPointRequestOnServer(
  requestId: string,
  operatorName: string = 'Caixa Balcão'
): Promise<{ success: boolean; request?: PointRequest; error?: string }> {
  return await rejectPointRequestInFirestore(requestId, operatorName)
}

// ==========================================
// 4. ACTIVITY LOGS
// ==========================================

export async function getServerCompanyLogs(companyId: string): Promise<ActivityLog[]> {
  return await getFirestoreCompanyLogs(companyId)
}

export async function addServerActivityLog(logData: {
  companyId: string
  customerId?: string
  type: ActivityLog['type']
  customerName: string
  customerPhone?: string
  pointsChange?: number
  description: string
  operatorName?: string
}): Promise<ActivityLog> {
  return await addFirestoreActivityLog(logData)
}

// ==========================================
// 5. FEEDBACKS (STRICT TENANT ISOLATION)
// ==========================================

export async function getServerFeedbacks(companyId: string): Promise<PrivateFeedback[]> {
  return await getFirestoreFeedbacks(companyId)
}

export async function saveServerFeedback(data: {
  companyId: string
  rating?: number
  message: string
  customerName?: string
  customerPhone?: string
}): Promise<{ success: boolean; feedback?: PrivateFeedback; error?: string }> {
  return await saveFirestoreFeedback(data)
}

// ==========================================
// 6. SERVICES (MULTI-TENANT & ISOLATED)
// ==========================================

export const getServerServices = cache(async (companyId?: string): Promise<CompanyService[]> => {
  if (!companyId) return await getFirestoreServices()
  const cacheKey = `srv:${companyId}`
  const cached = getMemoryCached<CompanyService[]>(cacheKey)
  if (cached) return cached

  const items = await getFirestoreServices(companyId)
  setMemoryCached(cacheKey, items, 60_000)
  return items
})

export async function getServerServiceById(
  companyId: string,
  serviceId: string
): Promise<CompanyService | null> {
  return await getFirestoreServiceById(companyId, serviceId)
}

export async function saveServerService(
  service: CompanyService
): Promise<{ success: boolean; service?: CompanyService; error?: string }> {
  invalidateServerStorageCache(`srv:${service.companyId}`)
  return await saveFirestoreService(service)
}

export async function deleteServerService(
  serviceId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  invalidateServerStorageCache(`srv:${companyId}`)
  return await deleteFirestoreService(serviceId, companyId)
}

export async function toggleServerServiceStatus(
  serviceId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  invalidateServerStorageCache(`srv:${companyId}`)
  return await toggleFirestoreServiceStatus(serviceId, companyId)
}

// ==========================================
// 6.1 PRODUCTS (CATÁLOGO DE PRODUTOS)
// ==========================================

export const getServerProducts = cache(async (companyId?: string): Promise<CompanyProduct[]> => {
  if (!companyId) return await getFirestoreProducts()
  const cacheKey = `prod:${companyId}`
  const cached = getMemoryCached<CompanyProduct[]>(cacheKey)
  if (cached) return cached

  const items = await getFirestoreProducts(companyId)
  setMemoryCached(cacheKey, items, 60_000)
  return items
})

export async function getServerProductById(
  companyId: string,
  productId: string
): Promise<CompanyProduct | null> {
  return await getFirestoreProductById(companyId, productId)
}

export async function saveServerProduct(
  product: CompanyProduct
): Promise<{ success: boolean; product?: CompanyProduct; error?: string }> {
  invalidateServerStorageCache(`prod:${product.companyId}`)
  return await saveFirestoreProduct(product)
}

export async function deleteServerProduct(
  productId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  invalidateServerStorageCache(`prod:${companyId}`)
  return await deleteFirestoreProduct(productId, companyId)
}

export async function toggleServerProductStatus(
  productId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  invalidateServerStorageCache(`prod:${companyId}`)
  return await toggleFirestoreProductStatus(productId, companyId)
}

// ==========================================
// 6.2 MENU ITEMS (CARDÁPIO DIGITAL DIRETO LINK)
// ==========================================

export const getServerMenuItems = cache(async (companyId?: string): Promise<MenuItem[]> => {
  if (!companyId) return await getFirestoreMenuItems()
  const cacheKey = `menu:${companyId}`
  const cached = getMemoryCached<MenuItem[]>(cacheKey)
  if (cached) return cached

  const items = await getFirestoreMenuItems(companyId)
  setMemoryCached(cacheKey, items, 60_000)
  return items
})

export async function getServerMenuItemById(
  companyId: string,
  itemId: string
): Promise<MenuItem | null> {
  return await getFirestoreMenuItemById(companyId, itemId)
}

export async function saveServerMenuItem(
  item: MenuItem
): Promise<{ success: boolean; menuItem?: MenuItem; error?: string }> {
  invalidateServerStorageCache(`menu:${item.companyId}`)
  return await saveFirestoreMenuItem(item)
}

export async function deleteServerMenuItem(
  itemId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  invalidateServerStorageCache(`menu:${companyId}`)
  return await deleteFirestoreMenuItem(itemId, companyId)
}

export async function toggleServerMenuItemStatus(
  itemId: string,
  companyId: string
): Promise<{ success: boolean; isAvailable?: boolean; error?: string }> {
  invalidateServerStorageCache(`menu:${companyId}`)
  return await toggleFirestoreMenuItemStatus(itemId, companyId)
}

// ==========================================
// 7. APPOINTMENTS & SCHEDULING (MULTI-TENANT)
// ==========================================

export async function getServerAppointments(
  companyId: string,
  date?: string
): Promise<Appointment[]> {
  return await getFirestoreAppointments(companyId, date)
}

export async function createServerAppointment(
  data: Appointment
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  return await createFirestoreAppointment(data)
}

export async function updateServerAppointmentStatus(
  id: string,
  companyId: string,
  status: AppointmentStatus
): Promise<{ success: boolean; error?: string }> {
  return await updateFirestoreAppointmentStatus(id, companyId, status)
}

export async function updateServerAppointment(
  id: string,
  companyId: string,
  patch: Partial<Appointment>
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  return await updateFirestoreAppointment(id, companyId, patch)
}

export async function deleteServerAppointment(
  id: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  return await deleteFirestoreAppointment(id, companyId)
}

export async function getServerProfessionals(companyId: string): Promise<CompanyProfessional[]> {
  return await getFirestoreProfessionals(companyId)
}

export async function saveServerProfessional(
  prof: CompanyProfessional
): Promise<{ success: boolean; professional?: CompanyProfessional; error?: string }> {
  return await saveFirestoreProfessional(prof)
}

export async function deleteServerProfessional(
  profId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  return await deleteFirestoreProfessional(profId, companyId)
}

export async function saveServerProductsOrder(
  companyId: string,
  orderedIds: string[]
): Promise<boolean> {
  return await saveFirestoreProductsOrder(companyId, orderedIds)
}

export async function saveServerServicesOrder(
  companyId: string,
  orderedIds: string[]
): Promise<boolean> {
  return await saveFirestoreServicesOrder(companyId, orderedIds)
}

export async function saveServerMenuItemsOrder(
  companyId: string,
  orderedIds: string[]
): Promise<boolean> {
  return await saveFirestoreMenuItemsOrder(companyId, orderedIds)
}

// ==========================================
// MESAS E PEDIDOS DO SALÃO
// ==========================================

export async function getServerTables(companyId: string): Promise<CompanyTable[]> {
  return await getFirestoreTables(companyId)
}

export async function saveServerTable(table: CompanyTable): Promise<CompanyTable> {
  return await saveFirestoreTable(table)
}

export async function deleteServerTable(tableId: string): Promise<void> {
  return await deleteFirestoreTable(tableId)
}

export async function toggleServerTableStatus(tableId: string, companyId: string): Promise<boolean> {
  return await toggleFirestoreTableStatus(tableId, companyId)
}

export async function getServerTableOrders(companyId: string): Promise<TableOrder[]> {
  return await getFirestoreTableOrders(companyId)
}

export async function saveServerTableOrder(order: TableOrder): Promise<TableOrder> {
  return await saveFirestoreTableOrder(order)
}

export async function updateServerTableOrderStatus(
  orderId: string,
  status: TableOrderStatus,
  companyId?: string
): Promise<void> {
  return await updateFirestoreTableOrderStatus(orderId, status, companyId)
}

export async function updateServerTableOrderFull(order: TableOrder): Promise<TableOrder> {
  return await updateFirestoreTableOrderFull(order)
}

export async function deleteServerTableOrder(
  orderId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  return await deleteFirestoreTableOrder(orderId, companyId)
}

// ==========================================
// MOTOBOYS / ENTREGADORES (COURIERS)
// ==========================================

export async function getServerCouriers(companyId: string): Promise<CompanyCourier[]> {
  return await getFirestoreCouriers(companyId)
}

export async function saveServerCourier(courier: CompanyCourier): Promise<CompanyCourier> {
  return await saveFirestoreCourier(courier)
}

export async function deleteServerCourier(courierId: string): Promise<void> {
  return await deleteFirestoreCourier(courierId)
}

// ==========================================
// ASSINATURAS E WEBHOOK ASAAS (SANDBOX / PRODUÇÃO)
// ==========================================

export async function getServerSubscription(companyId: string): Promise<CompanySubscription | null> {
  return await getFirestoreSubscription(companyId)
}

export async function saveServerSubscription(sub: CompanySubscription): Promise<CompanySubscription> {
  return await saveFirestoreSubscription(sub)
}

export async function getServerSubscriptionByAsaasId(asaasSubId: string): Promise<CompanySubscription | null> {
  return await getFirestoreSubscriptionByAsaasId(asaasSubId)
}

export async function getServerSubscriptionByAsaasCustomerId(asaasCustomerId: string): Promise<CompanySubscription | null> {
  return await getFirestoreSubscriptionByAsaasCustomerId(asaasCustomerId)
}

export async function getServerSubscriptionByMpPreapprovalId(
  mpPreapprovalId: string
): Promise<CompanySubscription | null> {
  return await getFirestoreSubscriptionByMpPreapprovalId(mpPreapprovalId)
}

export async function isServerWebhookEventProcessed(eventId: string): Promise<boolean> {
  return await isAsaasWebhookEventProcessed(eventId)
}

export async function recordServerWebhookEvent(
  eventId: string,
  event: string,
  payload: unknown,
  companyId?: string
): Promise<void> {
  return await recordAsaasWebhookEvent(eventId, event, payload, companyId)
}

export async function recordServerMpWebhookEvent(
  eventId: string,
  event: string,
  payload: unknown,
  companyId?: string
): Promise<void> {
  return await recordMpWebhookEvent(eventId, event, payload, companyId)
}

// ==========================================
// 12. GERENCIADOR DE LINKS EXTERNOS
// ==========================================

export const getServerExternalLinks = cache(async (companyId: string): Promise<CompanyExternalLink[]> => {
  if (!companyId) return []
  const cacheKey = `links:${companyId}`
  const cached = getMemoryCached<CompanyExternalLink[]>(cacheKey)
  if (cached) return cached

  const items = await getFirestoreExternalLinks(companyId)
  setMemoryCached(cacheKey, items, 60_000)
  return items
})

export async function getServerExternalLinkById(
  companyId: string,
  linkId: string
): Promise<CompanyExternalLink | null> {
  return await getFirestoreExternalLinkById(companyId, linkId)
}

export async function saveServerExternalLink(
  link: CompanyExternalLink
): Promise<{ success: boolean; link?: CompanyExternalLink; error?: string }> {
  invalidateServerStorageCache(`links:${link.companyId}`)
  return await saveFirestoreExternalLink(link)
}

export async function deleteServerExternalLink(
  linkId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  invalidateServerStorageCache(`links:${companyId}`)
  return await deleteFirestoreExternalLink(linkId, companyId)
}

export async function toggleServerExternalLinkStatus(
  linkId: string,
  companyId: string
): Promise<{ success: boolean; enabled?: boolean; error?: string }> {
  invalidateServerStorageCache(`links:${companyId}`)
  return await toggleFirestoreExternalLinkStatus(linkId, companyId)
}

export async function saveServerExternalLinksOrder(
  companyId: string,
  orderedLinkIds: string[]
): Promise<{ success: boolean; error?: string }> {
  invalidateServerStorageCache(`links:${companyId}`)
  return await saveFirestoreExternalLinksOrder(companyId, orderedLinkIds)
}


