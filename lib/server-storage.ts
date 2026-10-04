/**
 * Server-Side Data Layer Powered by Firebase Cloud Firestore.
 * Firestore is the STRICT and ONLY source of truth for TapHub.
 * No local JSON, no server memory, no mocked arrays.
 */

import {
  getFirestoreCompanies,
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
  ensureFirestoreInitialized,
} from './firestore-service'

import { Company, Customer, PointRequest, ActivityLog, PrivateFeedback } from '@/types/platform'

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

export async function getServerCompanyBySlug(slug: string): Promise<Company | null> {
  return await getFirestoreCompanyBySlug(slug)
}

export async function getServerCompanyById(id: string): Promise<Company | null> {
  return await getFirestoreCompanyById(id)
}

export async function saveServerCompany(
  company: Company
): Promise<{ success: boolean; error?: string }> {
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
