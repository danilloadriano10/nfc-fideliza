/**
 * Server-Side Data Layer Powered by Firebase Cloud Firestore.
 * Firestore is the STRICT and ONLY source of truth for TapHub.
 * No local JSON, no server memory, no mocked arrays.
 */

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

export async function getServerCompanyBySlug(slug: string): Promise<Company | null> {
  return await getFirestoreCompanyBySlug(slug)
}

export async function getServerCompanyById(id: string): Promise<Company | null> {
  return await getFirestoreCompanyById(id)
}

export async function saveServerCompany(
  company: Company
): Promise<{ success: boolean; company?: Company; error?: string }> {
  return await saveFirestoreCompany(company)
}

export async function deleteServerCompany(companyId: string): Promise<boolean> {
  return await deleteFirestoreCompany(companyId)
}

export async function toggleServerCompanyStatus(companyId: string): Promise<boolean> {
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

export async function getServerServices(companyId?: string): Promise<CompanyService[]> {
  return await getFirestoreServices(companyId)
}

export async function getServerServiceById(
  companyId: string,
  serviceId: string
): Promise<CompanyService | null> {
  return await getFirestoreServiceById(companyId, serviceId)
}

export async function saveServerService(
  service: CompanyService
): Promise<{ success: boolean; service?: CompanyService; error?: string }> {
  return await saveFirestoreService(service)
}

export async function deleteServerService(
  serviceId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  return await deleteFirestoreService(serviceId, companyId)
}

export async function toggleServerServiceStatus(
  serviceId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  return await toggleFirestoreServiceStatus(serviceId, companyId)
}

// ==========================================
// 6.1 PRODUCTS (CATÁLOGO DE PRODUTOS)
// ==========================================

export async function getServerProducts(companyId?: string): Promise<CompanyProduct[]> {
  return await getFirestoreProducts(companyId)
}

export async function getServerProductById(
  companyId: string,
  productId: string
): Promise<CompanyProduct | null> {
  return await getFirestoreProductById(companyId, productId)
}

export async function saveServerProduct(
  product: CompanyProduct
): Promise<{ success: boolean; product?: CompanyProduct; error?: string }> {
  return await saveFirestoreProduct(product)
}

export async function deleteServerProduct(
  productId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  return await deleteFirestoreProduct(productId, companyId)
}

export async function toggleServerProductStatus(
  productId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  return await toggleFirestoreProductStatus(productId, companyId)
}

// ==========================================
// 6.2 MENU ITEMS (CARDÁPIO DIGITAL DIRETO LINK)
// ==========================================

export async function getServerMenuItems(companyId?: string): Promise<MenuItem[]> {
  return await getFirestoreMenuItems(companyId)
}

export async function getServerMenuItemById(
  companyId: string,
  itemId: string
): Promise<MenuItem | null> {
  return await getFirestoreMenuItemById(companyId, itemId)
}

export async function saveServerMenuItem(
  item: MenuItem
): Promise<{ success: boolean; menuItem?: MenuItem; error?: string }> {
  return await saveFirestoreMenuItem(item)
}

export async function deleteServerMenuItem(
  itemId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  return await deleteFirestoreMenuItem(itemId, companyId)
}

export async function toggleServerMenuItemStatus(
  itemId: string,
  companyId: string
): Promise<{ success: boolean; isAvailable?: boolean; error?: string }> {
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

