import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  runTransaction,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Company, Customer, PointRequest, ActivityLog, PrivateFeedback, CompanyService } from '@/types/platform'
import { normalizePhone } from '@/lib/utils'
import { hashPassword } from '@/lib/auth-crypto'
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors'
import { isBase64Image } from '@/lib/storage-client'
import {
  INITIAL_COMPANIES,
  INITIAL_CUSTOMERS,
  INITIAL_REQUESTS,
  INITIAL_LOGS,
  INITIAL_FEEDBACKS,
} from '@/lib/initial-data'

// Collection references
const COMPANIES_COLLECTION = 'companies'
const CUSTOMERS_COLLECTION = 'customers'
const REQUESTS_COLLECTION = 'pointRequests'
const FEEDBACKS_COLLECTION = 'feedbacks'
const LOGS_COLLECTION = 'activityLogs'
const SETTINGS_COLLECTION = 'settings'
const SERVICES_COLLECTION = 'services'

let migrationPromise: Promise<void> | null = null

/**
 * Ensures Firestore is connected and existing data from platform-db.json is migrated once.
 * Thread-safe and memoized.
 */
export async function ensureFirestoreInitialized(): Promise<void> {
  if (migrationPromise) return migrationPromise

  migrationPromise = (async () => {
    try {
      // 1. Check if migration has already been executed in Firestore
      const settingsRef = doc(db, SETTINGS_COLLECTION, 'system')
      let settingsSnap
      try {
        settingsSnap = await getDoc(settingsRef)
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `${SETTINGS_COLLECTION}/system`)
      }

      if (settingsSnap.exists() && settingsSnap.data()?.migrationCompleted) {
        return // Migration already completed
      }

      console.log('🔄 Iniciando migração de dados do platform-db.json para o Firebase Cloud Firestore...')

      // 2. Load existing data from data/platform-db.json or initial seeds
      let legacyData: {
        companies: Company[]
        customers: Customer[]
        requests: PointRequest[]
        logs: ActivityLog[]
        feedbacks: PrivateFeedback[]
      } = {
        companies: INITIAL_COMPANIES,
        customers: INITIAL_CUSTOMERS,
        requests: INITIAL_REQUESTS,
        logs: INITIAL_LOGS,
        feedbacks: INITIAL_FEEDBACKS,
      }

      // 3. Migrate Companies to Firestore
      for (const comp of legacyData.companies) {
        const compRef = doc(db, COMPANIES_COLLECTION, comp.id)
        const compDoc = await getDoc(compRef)
        if (!compDoc.exists()) {
          const securedComp: Company = {
            ...comp,
            ownerAuth: {
              username: comp.ownerAuth?.username || comp.slug,
              password: hashPassword(comp.ownerAuth?.password || '123'),
            },
            createdAt: comp.createdAt || new Date().toISOString(),
            updatedAt: comp.updatedAt || new Date().toISOString(),
          }
          await setDoc(compRef, securedComp)
        }
      }

      // 4. Migrate Customers
      for (const cust of legacyData.customers) {
        const custRef = doc(db, CUSTOMERS_COLLECTION, cust.id)
        const custDoc = await getDoc(custRef)
        if (!custDoc.exists()) {
          await setDoc(custRef, cust)
        }
      }

      // 5. Migrate Requests
      for (const req of legacyData.requests) {
        const reqRef = doc(db, REQUESTS_COLLECTION, req.id)
        const reqDoc = await getDoc(reqRef)
        if (!reqDoc.exists()) {
          await setDoc(reqRef, req)
        }
      }

      // 6. Migrate Feedbacks
      for (const feed of legacyData.feedbacks) {
        const feedRef = doc(db, FEEDBACKS_COLLECTION, feed.id)
        const feedDoc = await getDoc(feedRef)
        if (!feedDoc.exists()) {
          await setDoc(feedRef, feed)
        }
      }

      // 7. Migrate Activity Logs
      for (const logItem of legacyData.logs.slice(0, 100)) {
        const logRef = doc(db, LOGS_COLLECTION, logItem.id)
        const logDoc = await getDoc(logRef)
        if (!logDoc.exists()) {
          await setDoc(logRef, logItem)
        }
      }

      // 8. Mark migration as completed in Firestore
      await setDoc(settingsRef, {
        migrationCompleted: true,
        migratedAt: new Date().toISOString(),
        version: '2.0.0-firestore-production',
      })

      console.log('✅ Migração para o Firebase Cloud Firestore concluída com sucesso!')
    } catch (err) {
      console.error('Falha na inicialização do Firestore:', err)
      migrationPromise = null
      throw err
    }
  })()

  return migrationPromise
}

// ==========================================
// 1. COMPANIES (MULTI-TENANT FIRESTORE)
// ==========================================

export async function getFirestoreCompanies(): Promise<Company[]> {
  await ensureFirestoreInitialized()
  try {
    const collRef = collection(db, COMPANIES_COLLECTION)
    const snapshot = await getDocs(collRef)
    const companies: Company[] = []
    snapshot.forEach((d) => {
      companies.push(d.data() as Company)
    })
    return companies.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COMPANIES_COLLECTION)
  }
}

export async function getFirestoreCompanyBySlug(slug: string): Promise<Company | null> {
  if (!slug) return null
  await ensureFirestoreInitialized()
  const clean = slug.toLowerCase().trim()
  try {
    const collRef = collection(db, COMPANIES_COLLECTION)
    const q = query(collRef, where('slug', '==', clean))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return snapshot.docs[0].data() as Company
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${COMPANIES_COLLECTION}?slug=${clean}`)
  }
}

export async function getFirestoreCompanyById(id: string): Promise<Company | null> {
  if (!id) return null
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, COMPANIES_COLLECTION, id)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    return snap.data() as Company
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${COMPANIES_COLLECTION}/${id}`)
  }
}

export async function saveFirestoreCompany(
  company: Company
): Promise<{ success: boolean; error?: string }> {
  await ensureFirestoreInitialized()
  const cleanSlug = company.slug.toLowerCase().trim()

  // 1. Check slug uniqueness
  try {
    const collRef = collection(db, COMPANIES_COLLECTION)
    const q = query(collRef, where('slug', '==', cleanSlug))
    const snap = await getDocs(q)
    const conflict = snap.docs.find((d) => d.id !== company.id)
    if (conflict) {
      return { success: false, error: 'Já existe outro estabelecimento utilizando este slug.' }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, COMPANIES_COLLECTION)
  }

  // 2. Preserve immutable slug if already exists to protect pre-printed NFC cards
  const docRef = doc(db, COMPANIES_COLLECTION, company.id)
  const existingSnap = await getDoc(docRef)

  let finalCompany: Company = {
    ...company,
    slug: cleanSlug,
    updatedAt: new Date().toISOString(),
  }

  if (existingSnap.exists()) {
    const existing = existingSnap.data() as Company
    // If slug was already set, maintain stability
    if (existing.slug && existing.slug !== cleanSlug) {
      console.warn(`[NFC Stability] Preserving original slug "${existing.slug}" for company ${company.id}`)
      finalCompany.slug = existing.slug
    }
    // Hash password if updated and not already a hash
    if (company.ownerAuth?.password) {
      if (company.ownerAuth.password !== existing.ownerAuth?.password) {
        finalCompany.ownerAuth = {
          ...existing.ownerAuth,
          ...company.ownerAuth,
          username: company.ownerAuth.username || company.slug,
          password: hashPassword(company.ownerAuth.password),
        }
      } else {
        finalCompany.ownerAuth = {
          ...existing.ownerAuth,
          ...company.ownerAuth,
        }
      }
    } else if (existing.ownerAuth) {
      finalCompany.ownerAuth = {
        ...existing.ownerAuth,
        ...(company.ownerAuth || {}),
      }
    }
    if (company.origin === undefined && existing.origin) {
      finalCompany.origin = existing.origin
    }
    if (company.onboardingCompleted === undefined && existing.onboardingCompleted !== undefined) {
      finalCompany.onboardingCompleted = existing.onboardingCompleted
    }
  } else {
    // New company registration
    finalCompany.createdAt = company.createdAt || new Date().toISOString()
    finalCompany.origin = company.origin || 'admin'
    finalCompany.onboardingCompleted = company.onboardingCompleted ?? false
    if (finalCompany.ownerAuth?.password) {
      finalCompany.ownerAuth = {
        ...finalCompany.ownerAuth,
        password: hashPassword(finalCompany.ownerAuth.password),
      }
    }
  }

  // 3. Strict Base64 Defense: Never persist raw Base64 in Firestore documents
  if (isBase64Image(finalCompany.logoUrl)) {
    finalCompany.logoUrl = ''
  }

  if (isBase64Image(finalCompany.coverUrl)) {
    finalCompany.coverUrl = '/images/cafe_central_banner_1791003956057.jpg'
  }

  try {
    await setDoc(docRef, finalCompany, { merge: true })
    return { success: true }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COMPANIES_COLLECTION}/${company.id}`)
  }
}

export async function deleteFirestoreCompany(companyId: string): Promise<boolean> {
  if (!companyId) return false
  await ensureFirestoreInitialized()

  try {
    // 1. Delete Company document
    const compRef = doc(db, COMPANIES_COLLECTION, companyId)
    await deleteDoc(compRef)

    // 2. Cascade delete customers
    const custColl = collection(db, CUSTOMERS_COLLECTION)
    const custSnap = await getDocs(query(custColl, where('companyId', '==', companyId)))
    const batch = writeBatch(db)
    custSnap.forEach((d) => batch.delete(d.ref))

    // 3. Cascade delete requests
    const reqColl = collection(db, REQUESTS_COLLECTION)
    const reqSnap = await getDocs(query(reqColl, where('companyId', '==', companyId)))
    reqSnap.forEach((d) => batch.delete(d.ref))

    // 4. Cascade delete feedbacks
    const feedColl = collection(db, FEEDBACKS_COLLECTION)
    const feedSnap = await getDocs(query(feedColl, where('companyId', '==', companyId)))
    feedSnap.forEach((d) => batch.delete(d.ref))

    // 5. Cascade delete logs
    const logColl = collection(db, LOGS_COLLECTION)
    const logSnap = await getDocs(query(logColl, where('companyId', '==', companyId)))
    logSnap.forEach((d) => batch.delete(d.ref))

    await batch.commit()
    return true
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COMPANIES_COLLECTION}/${companyId}`)
  }
}

export async function toggleFirestoreCompanyStatus(companyId: string): Promise<boolean> {
  if (!companyId) return false
  await ensureFirestoreInitialized()
  try {
    const compRef = doc(db, COMPANIES_COLLECTION, companyId)
    const snap = await getDoc(compRef)
    if (!snap.exists()) return false

    const comp = snap.data() as Company
    const updatedStatus = !comp.isActive
    await updateDoc(compRef, {
      isActive: updatedStatus,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COMPANIES_COLLECTION}/${companyId}`)
  }
}

// ==========================================
// 2. CUSTOMERS (MULTI-TENANT & PERSISTENT)
// ==========================================

export async function getFirestoreCompanyCustomers(companyId: string): Promise<Customer[]> {
  if (!companyId) return []
  await ensureFirestoreInitialized()
  try {
    const coll = collection(db, CUSTOMERS_COLLECTION)
    const q = query(coll, where('companyId', '==', companyId))
    const snap = await getDocs(q)
    const customers: Customer[] = []
    snap.forEach((d) => customers.push(d.data() as Customer))
    return customers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `${CUSTOMERS_COLLECTION}?companyId=${companyId}`)
  }
}

export async function getFirestoreCustomerByPhone(
  companyId: string,
  rawPhone: string
): Promise<Customer | null> {
  if (!companyId || !rawPhone) return null
  await ensureFirestoreInitialized()
  const normalized = normalizePhone(rawPhone)
  if (!normalized) return null

  try {
    const coll = collection(db, CUSTOMERS_COLLECTION)
    const q = query(
      coll,
      where('companyId', '==', companyId),
      where('phone', '==', normalized)
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return snap.docs[0].data() as Customer
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${CUSTOMERS_COLLECTION}?phone=${normalized}`)
  }
}

export async function getFirestoreCustomerById(
  companyId: string,
  customerId: string
): Promise<Customer | null> {
  if (!companyId || !customerId) return null
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    const cust = snap.data() as Customer
    if (cust.companyId !== companyId) return null
    return cust
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${CUSTOMERS_COLLECTION}/${customerId}`)
  }
}

export async function registerFirestoreCustomer(
  companyId: string,
  data: { name: string; phone: string }
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  if (!companyId) return { success: false, error: 'ID da empresa não informado.' }

  const normalized = normalizePhone(data.phone)
  if (!normalized || normalized.length < 10) {
    return { success: false, error: 'Por favor, informe um número de WhatsApp válido com DDD.' }
  }
  if (!data.name || !data.name.trim()) {
    return { success: false, error: 'Por favor, informe o seu nome.' }
  }

  await ensureFirestoreInitialized()

  // Check if customer already exists for this establishment
  const existing = await getFirestoreCustomerByPhone(companyId, normalized)
  if (existing) {
    return { success: true, customer: existing }
  }

  const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const newCustomer: Customer = {
    id: customerId,
    companyId,
    name: data.name.trim(),
    phone: normalized,
    currentPoints: 0,
    totalVisits: 1,
    completedCycles: 0,
    availableRewards: 0,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  }

  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId)
    await setDoc(docRef, newCustomer)

    // Add activity log
    await addFirestoreActivityLog({
      companyId,
      customerId,
      type: 'customer_created',
      customerName: newCustomer.name,
      customerPhone: newCustomer.phone,
      description: 'Novo cliente cadastrado no cartão fidelidade via NFC.',
      operatorName: 'Autoatendimento NFC',
    })

    return { success: true, customer: newCustomer }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${CUSTOMERS_COLLECTION}/${customerId}`)
  }
}

export async function directAddPointInFirestore(
  companyId: string,
  customerId: string,
  operatorName: string = 'Caixa Balcão'
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  await ensureFirestoreInitialized()

  const custRef = doc(db, CUSTOMERS_COLLECTION, customerId)
  const compRef = doc(db, COMPANIES_COLLECTION, companyId)

  try {
    const result = await runTransaction(db, async (txn) => {
      const custSnap = await txn.get(custRef)
      if (!custSnap.exists()) {
        throw new Error('Cliente não encontrado no Firestore.')
      }

      const cust = custSnap.data() as Customer
      if (cust.companyId !== companyId) {
        throw new Error('Cliente pertence a outra empresa.')
      }

      const compSnap = await txn.get(compRef)
      const comp = compSnap.exists() ? (compSnap.data() as Company) : null
      const goal = comp?.loyaltyProgram?.goalPoints || 10

      let newPoints = cust.currentPoints + 1
      let newRewards = cust.availableRewards || 0
      let newCycles = cust.completedCycles || 0
      let rewardEarned = false

      if (newPoints >= goal) {
        newRewards += 1
        newCycles += 1
        newPoints -= goal
        rewardEarned = true
      }

      const updatedCustomer: Customer = {
        ...cust,
        currentPoints: newPoints,
        availableRewards: newRewards,
        completedCycles: newCycles,
        totalVisits: (cust.totalVisits || 0) + 1,
        lastActivityAt: new Date().toISOString(),
      }

      txn.set(custRef, updatedCustomer)
      return { updatedCustomer, rewardEarned, goal }
    })

    await addFirestoreActivityLog({
      companyId,
      customerId,
      type: 'point_added',
      customerName: result.updatedCustomer.name,
      customerPhone: result.updatedCustomer.phone,
      pointsChange: 1,
      description: result.rewardEarned
        ? `+1 Ponto creditado por ${operatorName}. META ATINGIDA: Prêmio liberado!`
        : `+1 Ponto creditado por ${operatorName}. Saldo atual: ${result.updatedCustomer.currentPoints}/${result.goal}`,
      operatorName,
    })

    return { success: true, customer: result.updatedCustomer }
  } catch (err) {
    console.error('Error in directAddPointInFirestore:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Erro na transação de pontos.' }
  }
}

export async function redeemRewardInFirestore(
  companyId: string,
  customerId: string,
  operatorName: string = 'Gerente / Caixa'
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  await ensureFirestoreInitialized()
  const custRef = doc(db, CUSTOMERS_COLLECTION, customerId)
  const comp = await getFirestoreCompanyById(companyId)
  const rewardName = comp?.loyaltyProgram?.rewardDescription || 'Recompensa do Cartão'

  try {
    const updatedCustomer = await runTransaction(db, async (txn) => {
      const snap = await txn.get(custRef)
      if (!snap.exists()) {
        throw new Error('Cliente não encontrado.')
      }
      const cust = snap.data() as Customer
      if (cust.companyId !== companyId) {
        throw new Error('Cliente não pertence a esta empresa.')
      }
      if ((cust.availableRewards || 0) <= 0) {
        throw new Error('Este cliente não possui recompensas disponíveis para resgate.')
      }

      const updated: Customer = {
        ...cust,
        availableRewards: cust.availableRewards - 1,
        lastActivityAt: new Date().toISOString(),
      }

      txn.set(custRef, updated)
      return updated
    })

    await addFirestoreActivityLog({
      companyId,
      customerId,
      type: 'reward_redeemed',
      customerName: updatedCustomer.name,
      customerPhone: updatedCustomer.phone,
      description: `Recompensa resgatada: "${rewardName}" por ${operatorName}.`,
      operatorName,
    })

    return { success: true, customer: updatedCustomer }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao resgatar recompensa.' }
  }
}

// ==========================================
// 3. POINT REQUESTS (CROSS-DEVICE ATOMIC)
// ==========================================

export async function getFirestorePointRequests(
  companyId: string,
  status?: 'pending' | 'approved' | 'rejected'
): Promise<PointRequest[]> {
  if (!companyId) return []
  await ensureFirestoreInitialized()
  try {
    const coll = collection(db, REQUESTS_COLLECTION)
    let q
    if (status) {
      q = query(coll, where('companyId', '==', companyId), where('status', '==', status))
    } else {
      q = query(coll, where('companyId', '==', companyId))
    }
    const snap = await getDocs(q)
    const list: PointRequest[] = []
    snap.forEach((d) => list.push(d.data() as PointRequest))
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `${REQUESTS_COLLECTION}?companyId=${companyId}`)
  }
}

export async function getFirestorePointRequestById(requestId: string): Promise<PointRequest | null> {
  if (!requestId) return null
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    return snap.data() as PointRequest
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${REQUESTS_COLLECTION}/${requestId}`)
  }
}

export async function createPointRequestInFirestore(
  companyId: string,
  data: {
    customerId?: string
    name: string
    phone: string
  }
): Promise<{ success: boolean; request?: PointRequest; customer?: Customer; error?: string }> {
  if (!companyId) {
    return { success: false, error: 'Empresa não identificada.' }
  }

  const normalized = normalizePhone(data.phone)
  if (!normalized || normalized.length < 10) {
    return { success: false, error: 'Por favor, informe seu WhatsApp completo com DDD.' }
  }

  await ensureFirestoreInitialized()

  // 1. Identify or register customer
  let customer: Customer | null = null
  if (data.customerId) {
    customer = await getFirestoreCustomerById(companyId, data.customerId)
  }
  if (!customer) {
    customer = await getFirestoreCustomerByPhone(companyId, normalized)
  }
  if (!customer) {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: 'Por favor, informe seu nome para criar seu cartão fidelidade.' }
    }
    const regRes = await registerFirestoreCustomer(companyId, { name: data.name, phone: normalized })
    if (!regRes.success || !regRes.customer) {
      return { success: false, error: regRes.error || 'Erro ao registrar cliente no Firestore.' }
    }
    customer = regRes.customer
  }

  // 2. Check if there's already an active pending request for this customer in this company
  try {
    const reqColl = collection(db, REQUESTS_COLLECTION)
    const activeQ = query(
      reqColl,
      where('companyId', '==', companyId),
      where('customerId', '==', customer.id),
      where('status', '==', 'pending')
    )
    const activeSnap = await getDocs(activeQ)
    if (!activeSnap.empty) {
      const activePending = activeSnap.docs[0].data() as PointRequest
      return {
        success: true,
        request: activePending,
        customer,
      }
    }
  } catch (err) {
    console.warn('Check active pending request warning:', err)
  }

  // 3. Create persistent request in Firestore
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const newRequest: PointRequest = {
    id: requestId,
    companyId,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  try {
    const reqDocRef = doc(db, REQUESTS_COLLECTION, requestId)
    await setDoc(reqDocRef, newRequest)

    return {
      success: true,
      request: newRequest,
      customer,
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${REQUESTS_COLLECTION}/${requestId}`)
  }
}

/**
 * ATOMIC & IDEMPOTENT Approval of Point Request in Firestore.
 * Mathematically protects against race conditions or multiple rapid clicks.
 */
export async function approvePointRequestInFirestore(
  requestId: string,
  operatorName: string = 'Caixa Balcão'
): Promise<{ success: boolean; request?: PointRequest; customer?: Customer; error?: string }> {
  if (!requestId) {
    return { success: false, error: 'ID da solicitação não informado.' }
  }

  await ensureFirestoreInitialized()
  const reqDocRef = doc(db, REQUESTS_COLLECTION, requestId)

  try {
    const txnResult = await runTransaction(db, async (txn) => {
      // 1. Read request
      const reqSnap = await txn.get(reqDocRef)
      if (!reqSnap.exists()) {
        throw new Error('Solicitação de ponto não encontrada no Firestore.')
      }

      const reqData = reqSnap.data() as PointRequest

      // IDEMPOTENCY: If already approved, return without re-adding points
      if (reqData.status === 'approved') {
        const custSnap = await txn.get(doc(db, CUSTOMERS_COLLECTION, reqData.customerId))
        const cust = custSnap.exists() ? (custSnap.data() as Customer) : undefined
        return { isAlreadyApproved: true, request: reqData, customer: cust }
      }

      if (reqData.status !== 'pending') {
        throw new Error(`Esta solicitação já foi finalizada como "${reqData.status}".`)
      }

      // 2. Read customer
      const custDocRef = doc(db, CUSTOMERS_COLLECTION, reqData.customerId)
      const custSnap = await txn.get(custDocRef)
      if (!custSnap.exists()) {
        throw new Error('Cliente vinculado à solicitação não encontrado.')
      }

      const customer = custSnap.data() as Customer
      if (customer.companyId !== reqData.companyId) {
        throw new Error('Conflito de integridade multi-tenant.')
      }

      // 3. Read company goal
      const compDocRef = doc(db, COMPANIES_COLLECTION, reqData.companyId)
      const compSnap = await txn.get(compDocRef)
      const company = compSnap.exists() ? (compSnap.data() as Company) : null
      const goal = company?.loyaltyProgram?.goalPoints || 10

      // 4. Calculate point
      let newPoints = customer.currentPoints + 1
      let newRewards = customer.availableRewards || 0
      let newCycles = customer.completedCycles || 0
      let rewardEarned = false

      if (newPoints >= goal) {
        newRewards += 1
        newCycles += 1
        newPoints -= goal
        rewardEarned = true
      }

      const updatedCustomer: Customer = {
        ...customer,
        currentPoints: newPoints,
        availableRewards: newRewards,
        completedCycles: newCycles,
        totalVisits: (customer.totalVisits || 0) + 1,
        lastActivityAt: new Date().toISOString(),
      }

      const updatedRequest: PointRequest = {
        ...reqData,
        status: 'approved',
        updatedAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
        approvedBy: operatorName,
      }

      // 5. Atomic writes
      txn.set(custDocRef, updatedCustomer)
      txn.set(reqDocRef, updatedRequest)

      return {
        isAlreadyApproved: false,
        request: updatedRequest,
        customer: updatedCustomer,
        rewardEarned,
        goal,
      }
    })

    if (!txnResult.isAlreadyApproved && txnResult.request && txnResult.customer) {
      await addFirestoreActivityLog({
        companyId: txnResult.request.companyId,
        customerId: txnResult.customer.id,
        type: 'point_added',
        customerName: txnResult.customer.name,
        customerPhone: txnResult.customer.phone,
        pointsChange: 1,
        description: txnResult.rewardEarned
          ? `+1 Ponto confirmado pelo Caixa (${operatorName}). META ATINGIDA: Prêmio liberado!`
          : `+1 Ponto confirmado pelo Caixa (${operatorName}). Saldo: ${txnResult.customer.currentPoints}/${txnResult.goal}`,
        operatorName,
      })
    }

    return {
      success: true,
      request: txnResult.request,
      customer: txnResult.customer,
    }
  } catch (err) {
    console.error('Error approving point in Firestore:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao processar aprovação no Firestore.',
    }
  }
}

export async function rejectPointRequestInFirestore(
  requestId: string,
  operatorName: string = 'Caixa Balcão'
): Promise<{ success: boolean; request?: PointRequest; error?: string }> {
  if (!requestId) {
    return { success: false, error: 'ID da solicitação não informado.' }
  }

  await ensureFirestoreInitialized()
  const reqDocRef = doc(db, REQUESTS_COLLECTION, requestId)

  try {
    const snap = await getDoc(reqDocRef)
    if (!snap.exists()) {
      return { success: false, error: 'Solicitação de ponto não encontrada.' }
    }

    const reqData = snap.data() as PointRequest
    if (reqData.status !== 'pending') {
      return { success: false, error: 'Esta solicitação já foi processada anteriormente.' }
    }

    const updatedRequest: PointRequest = {
      ...reqData,
      status: 'rejected',
      updatedAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString(),
      rejectedBy: operatorName,
    }

    await setDoc(reqDocRef, updatedRequest)
    return { success: true, request: updatedRequest }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${REQUESTS_COLLECTION}/${requestId}`)
  }
}

// ==========================================
// 4. ACTIVITY LOGS
// ==========================================

export async function getFirestoreCompanyLogs(companyId: string): Promise<ActivityLog[]> {
  if (!companyId) return []
  await ensureFirestoreInitialized()
  try {
    const coll = collection(db, LOGS_COLLECTION)
    const q = query(coll, where('companyId', '==', companyId))
    const snap = await getDocs(q)
    const logs: ActivityLog[] = []
    snap.forEach((d) => logs.push(d.data() as ActivityLog))
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `${LOGS_COLLECTION}?companyId=${companyId}`)
  }
}

export async function addFirestoreActivityLog(logData: {
  companyId: string
  customerId?: string
  type: ActivityLog['type']
  customerName: string
  customerPhone?: string
  pointsChange?: number
  description: string
  operatorName?: string
}): Promise<ActivityLog> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  const newLog: ActivityLog = {
    id: logId,
    companyId: logData.companyId,
    customerId: logData.customerId || '',
    type: logData.type,
    customerName: logData.customerName,
    customerPhone: logData.customerPhone || '',
    pointsChange: logData.pointsChange,
    description: logData.description,
    approvedBy: logData.operatorName || 'Sistema',
    timestamp: new Date().toISOString(),
  }

  try {
    const docRef = doc(db, LOGS_COLLECTION, logId)
    await setDoc(docRef, newLog)
    return newLog
  } catch (err) {
    console.error('Failed to write activity log to Firestore:', err)
    return newLog
  }
}

// ==========================================
// 5. FEEDBACKS (STRICT TENANT ISOLATION)
// ==========================================

export async function getFirestoreFeedbacks(companyId: string): Promise<PrivateFeedback[]> {
  if (!companyId) return []
  await ensureFirestoreInitialized()
  try {
    const coll = collection(db, FEEDBACKS_COLLECTION)
    const q = query(coll, where('companyId', '==', companyId))
    const snap = await getDocs(q)
    const list: PrivateFeedback[] = []
    snap.forEach((d) => list.push(d.data() as PrivateFeedback))
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `${FEEDBACKS_COLLECTION}?companyId=${companyId}`)
  }
}

export async function saveFirestoreFeedback(data: {
  companyId: string
  rating?: number
  message: string
  customerName?: string
  customerPhone?: string
}): Promise<{ success: boolean; feedback?: PrivateFeedback; error?: string }> {
  if (!data.message || !data.message.trim()) {
    return { success: false, error: 'Mensagem de feedback não informada.' }
  }

  await ensureFirestoreInitialized()
  const feedId = `feed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  const newFeedback: PrivateFeedback = {
    id: feedId,
    companyId: data.companyId,
    message: data.message.trim(),
    createdAt: new Date().toISOString(),
  }
  if (typeof data.rating === 'number') {
    newFeedback.rating = data.rating
  }
  if (data.customerName && data.customerName.trim()) {
    newFeedback.customerName = data.customerName.trim()
  }
  if (data.customerPhone && data.customerPhone.trim()) {
    newFeedback.customerPhone = data.customerPhone.trim()
  }

  try {
    const docRef = doc(db, FEEDBACKS_COLLECTION, feedId)
    await setDoc(docRef, newFeedback)
    return { success: true, feedback: newFeedback }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${FEEDBACKS_COLLECTION}/${feedId}`)
  }
}

// ==========================================
// 6. SERVICES (MULTI-TENANT & PREPARED FOR BOOKING)
// ==========================================

export async function getFirestoreServices(companyId?: string): Promise<CompanyService[]> {
  try {
    await ensureFirestoreInitialized()
    const colRef = collection(db, SERVICES_COLLECTION)
    let q
    if (companyId) {
      q = query(colRef, where('companyId', '==', companyId))
    } else {
      q = colRef
    }
    const snap = await getDocs(q)
    const list: CompanyService[] = []
    snap.forEach((d) => {
      list.push(d.data() as CompanyService)
    })
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } catch (err) {
    console.warn('Could not read services from Firestore (returning empty list):', err)
    return []
  }
}

export async function getFirestoreServiceById(
  companyId: string,
  serviceId: string
): Promise<CompanyService | null> {
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    const data = snap.data() as CompanyService
    if (data.companyId !== companyId) return null
    return data
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${SERVICES_COLLECTION}/${serviceId}`)
  }
}

export async function saveFirestoreService(
  service: CompanyService
): Promise<{ success: boolean; service?: CompanyService; error?: string }> {
  if (!service.name || !service.name.trim()) {
    return { success: false, error: 'Nome do serviço é obrigatório.' }
  }
  if (!service.companyId) {
    return { success: false, error: 'companyId é obrigatório.' }
  }

  // Ensure no base64 in photoUrl
  if (service.photoUrl && isBase64Image(service.photoUrl)) {
    return { success: false, error: 'Foto não pode ser Base64. Utilize o upload oficial.' }
  }

  await ensureFirestoreInitialized()
  const now = new Date().toISOString()
  const serviceToSave: Record<string, unknown> = {
    id: service.id,
    companyId: service.companyId,
    name: service.name.trim(),
    description: service.description?.trim() || '',
    category: service.category?.trim() || 'Geral',
    price: typeof service.price === 'number' && !isNaN(service.price) ? service.price : null,
    priceType: service.priceType || (service.price != null ? 'fixed' : 'consult'),
    durationMinutes: typeof service.durationMinutes === 'number' && !isNaN(service.durationMinutes) ? service.durationMinutes : null,
    isActive: service.isActive !== false,
    updatedAt: now,
    createdAt: service.createdAt || now,
  }

  if (service.photoUrl && typeof service.photoUrl === 'string' && service.photoUrl.trim()) {
    serviceToSave.photoUrl = service.photoUrl.trim()
  }

  try {
    const docRef = doc(db, SERVICES_COLLECTION, service.id)
    await setDoc(docRef, serviceToSave, { merge: true })
    return { success: true, service: serviceToSave as unknown as CompanyService }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SERVICES_COLLECTION}/${service.id}`)
  }
}

export async function deleteFirestoreService(
  serviceId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      return { success: true }
    }
    const data = snap.data() as CompanyService
    // Security check: isolate per companyId
    if (data.companyId !== companyId) {
      return { success: false, error: 'Operação não autorizada para este serviço.' }
    }
    await deleteDoc(docRef)
    return { success: true }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${SERVICES_COLLECTION}/${serviceId}`)
  }
}

export async function toggleFirestoreServiceStatus(
  serviceId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      return { success: false, error: 'Serviço não encontrado.' }
    }
    const data = snap.data() as CompanyService
    if (data.companyId !== companyId) {
      return { success: false, error: 'Operação não autorizada para este serviço.' }
    }
    const newStatus = !data.isActive
    await updateDoc(docRef, { isActive: newStatus, updatedAt: new Date().toISOString() })
    return { success: true }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SERVICES_COLLECTION}/${serviceId}`)
  }
}
