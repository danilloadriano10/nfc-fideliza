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
  BookingSettings,
  CompanyTable,
  TableOrder,
  TableOrderStatus,
  CompanyCourier,
  CompanySubscription,
  AsaasWebhookEventLog,
} from '@/types/platform'
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
  INITIAL_SERVICES,
  INITIAL_PROFESSIONALS,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_TABLE_ORDERS,
} from '@/lib/initial-data'

// Collection references
const COMPANIES_COLLECTION = 'companies'
const CUSTOMERS_COLLECTION = 'customers'
const REQUESTS_COLLECTION = 'pointRequests'
const FEEDBACKS_COLLECTION = 'feedbacks'
const LOGS_COLLECTION = 'activityLogs'
const SETTINGS_COLLECTION = 'settings'
const SERVICES_COLLECTION = 'services'
const PRODUCTS_COLLECTION = 'products'
const MENU_ITEMS_COLLECTION = 'menuItems'
const APPOINTMENTS_COLLECTION = 'appointments'
const PROFESSIONALS_COLLECTION = 'professionals'
const DELETED_COMPANIES_COLLECTION = 'deleted_companies'
const TABLES_COLLECTION = 'tables'
const TABLE_ORDERS_COLLECTION = 'tableOrders'
const COURIERS_COLLECTION = 'couriers'
const SUBSCRIPTIONS_COLLECTION = 'subscriptions'
const ASAAS_WEBHOOK_EVENTS_COLLECTION = 'asaasWebhookEvents'

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

      // Query any companies previously registered as deleted so they are never recreated
      const deletedIds = new Set<string>()
      try {
        const deletedSnap = await getDocs(collection(db, DELETED_COMPANIES_COLLECTION))
        deletedSnap.forEach((d) => {
          deletedIds.add(d.id.toLowerCase().trim())
          const data = d.data()
          if (data?.companyId) deletedIds.add(String(data.companyId).toLowerCase().trim())
          if (data?.slug) deletedIds.add(String(data.slug).toLowerCase().trim())
        })
      } catch {}

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

      // 3. Migrate Companies to Firestore (skip if previously deleted)
      for (const comp of legacyData.companies) {
        const idClean = comp.id.toLowerCase().trim()
        const slugClean = (comp.slug || '').toLowerCase().trim()
        if (deletedIds.has(idClean) || deletedIds.has(slugClean)) {
          continue // Never resurrect deleted company
        }
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

      // 8. Migrate Services
      for (const srv of INITIAL_SERVICES) {
        const srvRef = doc(db, SERVICES_COLLECTION, srv.id)
        const srvDoc = await getDoc(srvRef)
        if (!srvDoc.exists()) {
          await setDoc(srvRef, srv)
        }
      }

      // 9. Migrate Professionals
      for (const prof of INITIAL_PROFESSIONALS) {
        const profRef = doc(db, PROFESSIONALS_COLLECTION, prof.id)
        const profDoc = await getDoc(profRef)
        if (!profDoc.exists()) {
          await setDoc(profRef, prof)
        }
      }

      // 10. Migrate Menu Items
      for (const item of INITIAL_MENU_ITEMS) {
        const itemRef = doc(db, MENU_ITEMS_COLLECTION, item.id)
        const itemDoc = await getDoc(itemRef)
        if (!itemDoc.exists()) {
          await setDoc(itemRef, item)
        }
      }

      // 10.5 Migrate Tables
      for (const table of INITIAL_TABLES) {
        const tableRef = doc(db, TABLES_COLLECTION, table.id)
        const tableDoc = await getDoc(tableRef)
        if (!tableDoc.exists()) {
          await setDoc(tableRef, table)
        }
      }

      // 10.6 Migrate Initial Table Orders
      for (const ord of INITIAL_TABLE_ORDERS) {
        const ordRef = doc(db, TABLE_ORDERS_COLLECTION, ord.id)
        const ordDoc = await getDoc(ordRef)
        if (!ordDoc.exists()) {
          await setDoc(ordRef, ord)
        }
      }

      // 11. Mark migration as completed in Firestore
      await setDoc(settingsRef, {
        migrationCompleted: true,
        migratedAt: new Date().toISOString(),
        version: '2.1.0-firestore-production',
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

    const deletedIds = new Set<string>()
    try {
      const delSnap = await getDocs(collection(db, DELETED_COMPANIES_COLLECTION))
      delSnap.forEach((d) => {
        deletedIds.add(d.id.toLowerCase().trim())
        const data = d.data()
        if (data?.companyId) deletedIds.add(String(data.companyId).toLowerCase().trim())
        if (data?.slug) deletedIds.add(String(data.slug).toLowerCase().trim())
      })
    } catch {}

    const companies: Company[] = []
    snapshot.forEach((d) => {
      const comp = d.data() as Company
      const idClean = (comp.id || d.id || '').toLowerCase().trim()
      const slugClean = (comp.slug || '').toLowerCase().trim()
      if (!deletedIds.has(idClean) && !deletedIds.has(slugClean)) {
        companies.push({
          ...comp,
          id: comp.id || d.id,
        })
      }
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
    // Check if slug itself is in deleted_companies
    try {
      const slugDelSnap = await getDoc(doc(db, DELETED_COMPANIES_COLLECTION, clean))
      if (slugDelSnap.exists()) return null
    } catch {}

    const collRef = collection(db, COMPANIES_COLLECTION)
    const q = query(collRef, where('slug', '==', clean))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const comp = snapshot.docs[0].data() as Company

    // Check if company ID or slug is marked as deleted
    try {
      const delSnap = await getDoc(doc(db, DELETED_COMPANIES_COLLECTION, comp.id))
      if (delSnap.exists()) return null
      if (comp.slug) {
        const slugDel = await getDoc(doc(db, DELETED_COMPANIES_COLLECTION, comp.slug.toLowerCase().trim()))
        if (slugDel.exists()) return null
      }
    } catch {}

    return comp
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${COMPANIES_COLLECTION}?slug=${clean}`)
  }
}

export async function getFirestoreCompanyById(id: string): Promise<Company | null> {
  if (!id) return null
  await ensureFirestoreInitialized()
  const cleanId = id.trim()
  try {
    try {
      const delSnap = await getDoc(doc(db, DELETED_COMPANIES_COLLECTION, cleanId))
      if (delSnap.exists()) return null
    } catch {}

    const docRef = doc(db, COMPANIES_COLLECTION, cleanId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    const comp = snap.data() as Company

    try {
      if (comp.slug) {
        const slugDel = await getDoc(doc(db, DELETED_COMPANIES_COLLECTION, comp.slug.toLowerCase().trim()))
        if (slugDel.exists()) return null
      }
    } catch {}

    return comp
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${COMPANIES_COLLECTION}/${cleanId}`)
  }
}

export async function saveFirestoreCompany(
  company: Company
): Promise<{ success: boolean; company?: Company; error?: string }> {
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
    if (company.ownerAuth?.password && typeof company.ownerAuth.password === 'string' && company.ownerAuth.password.trim()) {
      const inputPass = company.ownerAuth.password.trim()
      const isAlreadyHashed = /^[0-9a-f]{64}$/i.test(inputPass)

      if (isAlreadyHashed) {
        // Password sent is already the SHA-256 hash: keep it intact
        finalCompany.ownerAuth = {
          ...existing.ownerAuth,
          ...company.ownerAuth,
          username: company.ownerAuth.username || existing.ownerAuth?.username || company.slug,
          password: inputPass,
        }
      } else {
        // Plaintext password provided: hash it with system salt and save
        finalCompany.ownerAuth = {
          ...existing.ownerAuth,
          ...company.ownerAuth,
          username: company.ownerAuth.username || existing.ownerAuth?.username || company.slug,
          password: hashPassword(inputPass),
        }
      }
    } else if (existing.ownerAuth) {
      finalCompany.ownerAuth = {
        ...existing.ownerAuth,
        ...(company.ownerAuth || {}),
        password: existing.ownerAuth.password,
      }
    }
    if (company.origin === undefined && existing.origin) {
      finalCompany.origin = existing.origin
    }
    if (company.onboardingCompleted === undefined && existing.onboardingCompleted !== undefined) {
      finalCompany.onboardingCompleted = existing.onboardingCompleted
    }
    const incomingSectionsOrder =
      company.publicSectionsOrder && Array.isArray(company.publicSectionsOrder) && company.publicSectionsOrder.length > 0
        ? company.publicSectionsOrder
        : company.cardOrder && Array.isArray(company.cardOrder) && company.cardOrder.length > 0
        ? company.cardOrder
        : null

    if (incomingSectionsOrder) {
      finalCompany.publicSectionsOrder = incomingSectionsOrder
      finalCompany.cardOrder = incomingSectionsOrder
    } else {
      if (existing.publicSectionsOrder && Array.isArray(existing.publicSectionsOrder)) {
        finalCompany.publicSectionsOrder = existing.publicSectionsOrder
      }
      if (existing.cardOrder && Array.isArray(existing.cardOrder)) {
        finalCompany.cardOrder = existing.cardOrder
      }
    }
    if (company.featuredCards && Array.isArray(company.featuredCards)) {
      finalCompany.featuredCards = company.featuredCards
    } else if (existing.featuredCards && Array.isArray(existing.featuredCards)) {
      finalCompany.featuredCards = existing.featuredCards
    }
    if (company.featuredCardsCount !== undefined) {
      finalCompany.featuredCardsCount = company.featuredCardsCount
    } else if (existing.featuredCardsCount !== undefined) {
      finalCompany.featuredCardsCount = existing.featuredCardsCount
    }
    if (company.productsOrder && Array.isArray(company.productsOrder)) {
      finalCompany.productsOrder = company.productsOrder
    } else if (existing.productsOrder && Array.isArray(existing.productsOrder)) {
      finalCompany.productsOrder = existing.productsOrder
    }
    if (company.servicesOrder && Array.isArray(company.servicesOrder)) {
      finalCompany.servicesOrder = company.servicesOrder
    } else if (existing.servicesOrder && Array.isArray(existing.servicesOrder)) {
      finalCompany.servicesOrder = existing.servicesOrder
    }
    if (company.menuItemsOrder && Array.isArray(company.menuItemsOrder)) {
      finalCompany.menuItemsOrder = company.menuItemsOrder
    } else if (existing.menuItemsOrder && Array.isArray(existing.menuItemsOrder)) {
      finalCompany.menuItemsOrder = existing.menuItemsOrder
    }
    if (company.productWhatsAppTemplate !== undefined) {
      finalCompany.productWhatsAppTemplate = company.productWhatsAppTemplate
    } else if (existing.productWhatsAppTemplate !== undefined) {
      finalCompany.productWhatsAppTemplate = existing.productWhatsAppTemplate
    }
    if (company.productCatalog !== undefined) {
      finalCompany.productCatalog = company.productCatalog
    } else if (existing.productCatalog !== undefined) {
      finalCompany.productCatalog = existing.productCatalog
    }
    if (company.menuDisplayMode !== undefined) {
      finalCompany.menuDisplayMode = company.menuDisplayMode
    } else if (existing.menuDisplayMode !== undefined) {
      finalCompany.menuDisplayMode = existing.menuDisplayMode
    }
    if (company.servicesDisplayMode !== undefined) {
      finalCompany.servicesDisplayMode = company.servicesDisplayMode
    } else if (existing.servicesDisplayMode !== undefined) {
      finalCompany.servicesDisplayMode = existing.servicesDisplayMode
    }
    if (company.productsDisplayMode !== undefined) {
      finalCompany.productsDisplayMode = company.productsDisplayMode
    } else if (existing.productsDisplayMode !== undefined) {
      finalCompany.productsDisplayMode = existing.productsDisplayMode
    }
    if (company.appointmentsDisplayMode !== undefined) {
      finalCompany.appointmentsDisplayMode = company.appointmentsDisplayMode
    } else if (existing.appointmentsDisplayMode !== undefined) {
      finalCompany.appointmentsDisplayMode = existing.appointmentsDisplayMode
    }
    if (company.menuConfig !== undefined) {
      finalCompany.menuConfig = company.menuConfig
    } else if (existing.menuConfig !== undefined) {
      finalCompany.menuConfig = existing.menuConfig
    }
    if (company.customThemeConfig !== undefined) {
      finalCompany.customThemeConfig = company.customThemeConfig
    } else if (existing.customThemeConfig !== undefined) {
      finalCompany.customThemeConfig = existing.customThemeConfig
    }
    if (company.themeColors !== undefined) {
      finalCompany.themeColors = company.themeColors
    } else if (existing.themeColors !== undefined) {
      finalCompany.themeColors = existing.themeColors
    }
  } else {
    // New company registration
    finalCompany.createdAt = company.createdAt || new Date().toISOString()
    finalCompany.origin = company.origin || 'admin'
    finalCompany.onboardingCompleted = company.onboardingCompleted ?? false
    if (company.productWhatsAppTemplate !== undefined) {
      finalCompany.productWhatsAppTemplate = company.productWhatsAppTemplate
    }
    if (company.productCatalog !== undefined) {
      finalCompany.productCatalog = company.productCatalog
    }
    if (company.publicSectionsOrder && Array.isArray(company.publicSectionsOrder)) {
      finalCompany.publicSectionsOrder = company.publicSectionsOrder
      finalCompany.cardOrder = company.cardOrder || company.publicSectionsOrder
    } else if (company.cardOrder && Array.isArray(company.cardOrder)) {
      finalCompany.cardOrder = company.cardOrder
      finalCompany.publicSectionsOrder = company.cardOrder
    }
    if (company.featuredCards && Array.isArray(company.featuredCards)) {
      finalCompany.featuredCards = company.featuredCards
    }
    if (company.featuredCardsCount !== undefined) {
      finalCompany.featuredCardsCount = company.featuredCardsCount
    }
    if (company.productsOrder && Array.isArray(company.productsOrder)) {
      finalCompany.productsOrder = company.productsOrder
    }
    if (company.servicesOrder && Array.isArray(company.servicesOrder)) {
      finalCompany.servicesOrder = company.servicesOrder
    }
    if (company.menuItemsOrder && Array.isArray(company.menuItemsOrder)) {
      finalCompany.menuItemsOrder = company.menuItemsOrder
    }
    if (company.menuDisplayMode !== undefined) {
      finalCompany.menuDisplayMode = company.menuDisplayMode
    }
    if (company.servicesDisplayMode !== undefined) {
      finalCompany.servicesDisplayMode = company.servicesDisplayMode
    }
    if (company.productsDisplayMode !== undefined) {
      finalCompany.productsDisplayMode = company.productsDisplayMode
    }
    if (company.appointmentsDisplayMode !== undefined) {
      finalCompany.appointmentsDisplayMode = company.appointmentsDisplayMode
    }
    if (finalCompany.ownerAuth?.password) {
      const pass = finalCompany.ownerAuth.password.trim()
      const isAlreadyHashed = /^[0-9a-f]{64}$/i.test(pass)
      finalCompany.ownerAuth = {
        ...finalCompany.ownerAuth,
        password: isAlreadyHashed ? pass : hashPassword(pass),
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
    return { success: true, company: finalCompany }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COMPANIES_COLLECTION}/${company.id}`)
  }
}

export async function getFirestoreDeletedCompanyIds(): Promise<string[]> {
  await ensureFirestoreInitialized()
  try {
    const delSnap = await getDocs(collection(db, DELETED_COMPANIES_COLLECTION))
    const ids = new Set<string>()
    delSnap.forEach((d) => {
      ids.add(d.id.toLowerCase().trim())
      const data = d.data()
      if (data?.companyId) ids.add(String(data.companyId).toLowerCase().trim())
      if (data?.slug) ids.add(String(data.slug).toLowerCase().trim())
      if (data?.id) ids.add(String(data.id).toLowerCase().trim())
    })
    return Array.from(ids).filter(Boolean)
  } catch (err) {
    console.error('Error fetching deleted company IDs from Firestore:', err)
    return []
  }
}

export async function deleteFirestoreCompany(companyId: string): Promise<boolean> {
  if (!companyId) return false
  await ensureFirestoreInitialized()

  try {
    // 1. Resolve real document ID and slug
    let realId = companyId
    let slug = ''

    const compDoc = await getDoc(doc(db, COMPANIES_COLLECTION, companyId))
    if (compDoc.exists()) {
      const data = compDoc.data() as Company
      realId = data.id || companyId
      slug = data.slug || ''
    } else {
      const q = query(
        collection(db, COMPANIES_COLLECTION),
        where('slug', '==', companyId.toLowerCase().trim())
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        realId = snap.docs[0].id
        slug = (snap.docs[0].data() as Company).slug || ''
      }
    }

    // 2. Permanently delete company document(s) from Firestore
    await deleteDoc(doc(db, COMPANIES_COLLECTION, realId))
    if (slug && slug !== realId) {
      try {
        await deleteDoc(doc(db, COMPANIES_COLLECTION, slug))
      } catch {}
    }

    // Delete any documents with matching slug or id in companies collection
    if (slug) {
      try {
        const qSlug = query(
          collection(db, COMPANIES_COLLECTION),
          where('slug', '==', slug.toLowerCase().trim())
        )
        const snapSlug = await getDocs(qSlug)
        for (const d of snapSlug.docs) {
          await deleteDoc(d.ref)
        }
      } catch {}
    }

    try {
      const qId = query(collection(db, COMPANIES_COLLECTION), where('id', '==', realId))
      const snapId = await getDocs(qId)
      for (const d of snapId.docs) {
        await deleteDoc(d.ref)
      }
    } catch {}

    // 3. Register tombstone in deleted_companies so it NEVER resurrects on reboot or sync
    const now = new Date().toISOString()
    const tombstones = Array.from(
      new Set([
        realId,
        realId.toLowerCase().trim(),
        slug,
        slug.toLowerCase().trim(),
        companyId,
        companyId.toLowerCase().trim(),
      ])
    ).filter(Boolean)

    for (const tId of tombstones) {
      try {
        await setDoc(doc(db, DELETED_COMPANIES_COLLECTION, tId), {
          id: realId,
          companyId: realId,
          slug: slug || realId,
          deletedAt: now,
        })
      } catch (err) {
        console.warn(`Failed writing tombstone ${tId}:`, err)
      }
    }

    // 4. Cascade delete ALL records linked exclusively to this companyId
    const targetIds = Array.from(
      new Set([
        realId,
        realId.toLowerCase().trim(),
        slug,
        slug.toLowerCase().trim(),
        companyId,
        companyId.toLowerCase().trim(),
      ])
    ).filter(Boolean)

    const collectionsToPurge = [
      CUSTOMERS_COLLECTION,
      REQUESTS_COLLECTION,
      FEEDBACKS_COLLECTION,
      LOGS_COLLECTION,
      SERVICES_COLLECTION,
      PRODUCTS_COLLECTION,
      MENU_ITEMS_COLLECTION,
      APPOINTMENTS_COLLECTION,
      PROFESSIONALS_COLLECTION,
    ]

    for (const collName of collectionsToPurge) {
      for (const targetId of targetIds) {
        try {
          const qDocs = query(collection(db, collName), where('companyId', '==', targetId))
          const snapDocs = await getDocs(qDocs)
          if (!snapDocs.empty) {
            let currentBatch = writeBatch(db)
            let opCount = 0
            for (const docItem of snapDocs.docs) {
              currentBatch.delete(docItem.ref)
              opCount++
              if (opCount >= 400) {
                await currentBatch.commit()
                currentBatch = writeBatch(db)
                opCount = 0
              }
            }
            if (opCount > 0) {
              await currentBatch.commit()
            }
          }
        } catch (err) {
          console.warn(`Error purging collection ${collName} for company ${targetId}:`, err)
        }
      }
    }

    return true
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COMPANIES_COLLECTION}/${companyId}`)
    return false
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
    let servicesOrder: string[] | undefined
    if (companyId) {
      const comp = await getFirestoreCompanyById(companyId)
      if (comp?.servicesOrder && Array.isArray(comp.servicesOrder)) {
        servicesOrder = comp.servicesOrder
      }
    }
    return list.sort((a, b) => {
      if (Array.isArray(servicesOrder) && servicesOrder.length > 0) {
        const idxA = servicesOrder.indexOf(a.id)
        const idxB = servicesOrder.indexOf(b.id)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
      }
      const orderA = typeof a.order === 'number' ? a.order : 0
      const orderB = typeof b.order === 'number' ? b.order : 0
      if (orderA !== orderB) return orderA - orderB
      return (a.name || '').localeCompare(b.name || '')
    })
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

  // Handle photoUrl with base64 defense and conversion
  let finalPhoto = service.photoUrl?.trim() || undefined
  if (finalPhoto && isBase64Image(finalPhoto)) {
    try {
      const { uploadCompanyFileServer } = await import('@/lib/storage-service')
      const matches = finalPhoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (matches && matches[2]) {
        const mime = matches[1]
        const buf = Buffer.from(matches[2], 'base64')
        const up = await uploadCompanyFileServer(service.companyId, 'service', buf, 'service.jpg', mime)
        finalPhoto = up.url || undefined
      }
    } catch {
      finalPhoto = undefined
    }
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

  if (typeof service.order === 'number' && !isNaN(service.order)) {
    serviceToSave.order = service.order
  }

  serviceToSave.photoUrl = finalPhoto || ''

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

// ==========================================
// 7. APPOINTMENTS & SCHEDULING (MULTI-TENANT)
// ==========================================

export async function getFirestoreAppointments(
  companyId: string,
  date?: string
): Promise<Appointment[]> {
  try {
    await ensureFirestoreInitialized()
    const colRef = collection(db, APPOINTMENTS_COLLECTION)
    let q = query(colRef, where('companyId', '==', companyId))
    if (date) {
      q = query(colRef, where('companyId', '==', companyId), where('date', '==', date))
    }
    const snap = await getDocs(q)
    const list: Appointment[] = []
    snap.forEach((d) => {
      list.push(d.data() as Appointment)
    })
    return list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time.localeCompare(b.time)
    })
  } catch (err) {
    console.warn('Could not read appointments from Firestore:', err)
    return []
  }
}

export async function createFirestoreAppointment(
  data: Appointment
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  if (!data.companyId || !data.serviceId || !data.date || !data.time || !data.customerName || !data.customerPhone) {
    return { success: false, error: 'Dados incompletos para realizar o agendamento.' }
  }

  try {
    await ensureFirestoreInitialized()
    const colRef = collection(db, APPOINTMENTS_COLLECTION)

    // BACKEND CONFLICT CHECK (Never allow double-booking on public booking)
    // Para agendamentos cadastrados manualmente pela empresa (origin === 'manual'), NÃO bloquear horários repetidos.
    if (data.origin !== 'manual') {
      const existingSnap = await getDocs(
        query(colRef, where('companyId', '==', data.companyId), where('date', '==', data.date))
      )

      const existingAppointments: Appointment[] = []
      existingSnap.forEach((d) => existingAppointments.push(d.data() as Appointment))

      const activeConflicting = existingAppointments.filter((app) => {
        if (app.status === 'cancelled') return false
        if (app.time !== data.time) return false

        if (data.professionalId) {
          return app.professionalId === data.professionalId
        } else {
          return !app.professionalId
        }
      })

      if (activeConflicting.length > 0) {
        return {
          success: false,
          error: data.professionalId
            ? 'Este profissional já possui um agendamento neste horário. Por favor, escolha outro horário.'
            : 'Este horário já está reservado. Por favor, escolha outro horário disponível.',
        }
      }
    }

    const apptId = data.id || `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()

    const sanitizedAppt: Record<string, unknown> = {
      id: apptId,
      companyId: data.companyId,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      date: data.date,
      time: data.time,
      customerName: data.customerName.trim(),
      customerPhone: normalizePhone(data.customerPhone),
      status: data.status || 'pending',
      origin: data.origin || 'public',
      createdAt: data.createdAt || now,
      updatedAt: now,
    }

    if (typeof data.servicePrice === 'number' && !isNaN(data.servicePrice)) {
      sanitizedAppt.servicePrice = data.servicePrice
    }
    if (typeof data.serviceDurationMinutes === 'number' && !isNaN(data.serviceDurationMinutes)) {
      sanitizedAppt.serviceDurationMinutes = data.serviceDurationMinutes
    }
    if (data.professionalId) sanitizedAppt.professionalId = data.professionalId
    if (data.professionalName) sanitizedAppt.professionalName = data.professionalName
    if (data.notes && data.notes.trim()) sanitizedAppt.notes = data.notes.trim()

    const docRef = doc(db, APPOINTMENTS_COLLECTION, apptId)
    await setDoc(docRef, sanitizedAppt)
    return { success: true, appointment: sanitizedAppt as unknown as Appointment }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, APPOINTMENTS_COLLECTION)
  }
}

export async function updateFirestoreAppointmentStatus(
  id: string,
  companyId: string,
  status: AppointmentStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureFirestoreInitialized()
    const docRef = doc(db, APPOINTMENTS_COLLECTION, id)
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      return { success: false, error: 'Agendamento não encontrado.' }
    }
    const data = snap.data() as Appointment
    if (data.companyId !== companyId) {
      return { success: false, error: 'Operação não autorizada.' }
    }

    await updateDoc(docRef, { status, updatedAt: new Date().toISOString() })
    return { success: true }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${APPOINTMENTS_COLLECTION}/${id}`)
  }
}

export async function updateFirestoreAppointment(
  id: string,
  companyId: string,
  patch: Partial<Appointment>
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    await ensureFirestoreInitialized()
    const docRef = doc(db, APPOINTMENTS_COLLECTION, id)
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      return { success: false, error: 'Agendamento não encontrado.' }
    }
    const data = snap.data() as Appointment
    if (data.companyId !== companyId) {
      return { success: false, error: 'Operação não autorizada.' }
    }

    const updated: Appointment = {
      ...data,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    const cleanPayload = JSON.parse(JSON.stringify(updated))
    await setDoc(docRef, cleanPayload, { merge: true })
    return { success: true, appointment: updated }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${APPOINTMENTS_COLLECTION}/${id}`)
    return { success: false, error: 'Erro ao atualizar agendamento.' }
  }
}

export async function deleteFirestoreAppointment(
  id: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureFirestoreInitialized()
    const docRef = doc(db, APPOINTMENTS_COLLECTION, id)
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      return { success: true }
    }
    const data = snap.data() as Appointment
    if (companyId && data.companyId && data.companyId !== companyId) {
      return { success: false, error: 'Operação não autorizada.' }
    }
    await deleteDoc(docRef)
    return { success: true }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${APPOINTMENTS_COLLECTION}/${id}`)
    return { success: false, error: 'Erro ao excluir agendamento.' }
  }
}

// ==========================================
// 8. PROFESSIONALS (MULTI-TENANT)
// ==========================================

export async function getFirestoreProfessionals(companyId: string): Promise<CompanyProfessional[]> {
  try {
    await ensureFirestoreInitialized()
    const colRef = collection(db, PROFESSIONALS_COLLECTION)
    const q = query(colRef, where('companyId', '==', companyId))
    const snap = await getDocs(q)
    const list: CompanyProfessional[] = []
    snap.forEach((d) => list.push(d.data() as CompanyProfessional))
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } catch (err) {
    console.warn('Could not read professionals from Firestore:', err)
    return []
  }
}

export async function saveFirestoreProfessional(
  prof: CompanyProfessional
): Promise<{ success: boolean; professional?: CompanyProfessional; error?: string }> {
  if (!prof.companyId || !prof.name || !prof.name.trim()) {
    return { success: false, error: 'Nome do profissional é obrigatório.' }
  }
  if (prof.photoUrl && isBase64Image(prof.photoUrl)) {
    return { success: false, error: 'Foto não pode ser Base64.' }
  }

  try {
    await ensureFirestoreInitialized()
    const profId = prof.id || `prf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const sanitized: Record<string, unknown> = {
      id: profId,
      companyId: prof.companyId,
      name: prof.name.trim(),
      isActive: prof.isActive !== false,
      serviceIds: Array.isArray(prof.serviceIds) ? prof.serviceIds : [],
      createdAt: prof.createdAt || new Date().toISOString(),
    }
    if (prof.role && prof.role.trim()) sanitized.role = prof.role.trim()
    if (prof.photoUrl && prof.photoUrl.trim()) sanitized.photoUrl = prof.photoUrl.trim()

    const docRef = doc(db, PROFESSIONALS_COLLECTION, profId)
    await setDoc(docRef, sanitized, { merge: true })
    return { success: true, professional: sanitized as unknown as CompanyProfessional }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PROFESSIONALS_COLLECTION}/${prof.id}`)
  }
}

export async function deleteFirestoreProfessional(
  profId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureFirestoreInitialized()
    const docRef = doc(db, PROFESSIONALS_COLLECTION, profId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return { success: true }
    const data = snap.data() as CompanyProfessional
    if (data.companyId !== companyId) {
      return { success: false, error: 'Operação não autorizada.' }
    }
    await deleteDoc(docRef)
    return { success: true }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PROFESSIONALS_COLLECTION}/${profId}`)
  }
}

// ==========================================
// 8. PRODUCTS (CATÁLOGO DE PRODUTOS)
// ==========================================

export async function getFirestoreProducts(companyId?: string): Promise<CompanyProduct[]> {
  try {
    await ensureFirestoreInitialized()
    const colRef = collection(db, PRODUCTS_COLLECTION)
    let q
    if (companyId) {
      q = query(colRef, where('companyId', '==', companyId))
    } else {
      q = colRef
    }
    const snap = await getDocs(q)
    const list: CompanyProduct[] = []
    snap.forEach((d) => {
      list.push(d.data() as CompanyProduct)
    })
    let productsOrder: string[] | undefined
    if (companyId) {
      const comp = await getFirestoreCompanyById(companyId)
      if (comp?.productsOrder && Array.isArray(comp.productsOrder)) {
        productsOrder = comp.productsOrder
      }
    }
    return list.sort((a, b) => {
      if (Array.isArray(productsOrder) && productsOrder.length > 0) {
        const idxA = productsOrder.indexOf(a.id)
        const idxB = productsOrder.indexOf(b.id)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
      }
      const orderA = typeof a.order === 'number' ? a.order : 0
      const orderB = typeof b.order === 'number' ? b.order : 0
      if (orderA !== orderB) return orderA - orderB
      return (b.createdAt || '').localeCompare(a.createdAt || '')
    })
  } catch (err) {
    console.warn('Could not read products from Firestore (returning empty list):', err)
    return []
  }
}

export async function getFirestoreProductById(
  companyId: string,
  productId: string
): Promise<CompanyProduct | null> {
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    const data = snap.data() as CompanyProduct
    if (data.companyId !== companyId) return null
    return data
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${PRODUCTS_COLLECTION}/${productId}`)
  }
}

export async function saveFirestoreProduct(
  product: CompanyProduct
): Promise<{ success: boolean; product?: CompanyProduct; error?: string }> {
  if (!product.name || !product.name.trim()) {
    return { success: false, error: 'Nome do produto é obrigatório.' }
  }
  if (!product.companyId) {
    return { success: false, error: 'companyId é obrigatório.' }
  }

  // Handle photoUrl with base64 defense and conversion
  let finalPhoto = product.photoUrl?.trim() || undefined
  if (finalPhoto && isBase64Image(finalPhoto)) {
    try {
      const { uploadCompanyFileServer } = await import('@/lib/storage-service')
      const matches = finalPhoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (matches && matches[2]) {
        const mime = matches[1]
        const buf = Buffer.from(matches[2], 'base64')
        const up = await uploadCompanyFileServer(product.companyId, 'product', buf, 'product.jpg', mime)
        finalPhoto = up.url || undefined
      }
    } catch {
      finalPhoto = undefined
    }
  }

  await ensureFirestoreInitialized()
  const now = new Date().toISOString()
  const productId = product.id || `prd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  
  const productToSave: Record<string, unknown> = {
    id: productId,
    companyId: product.companyId,
    name: product.name.trim(),
    category: product.category?.trim() || 'Geral',
    description: product.description?.trim() || '',
    price: typeof product.price === 'number' && !isNaN(product.price) ? product.price : null,
    priceType: product.priceType || (product.price != null ? 'fixed' : 'consult'),
    promotionalPrice: typeof product.promotionalPrice === 'number' && !isNaN(product.promotionalPrice) ? product.promotionalPrice : null,
    isAvailable: product.isAvailable !== false,
    purchaseUrl: product.purchaseUrl?.trim() || '',
    order: typeof product.order === 'number' && !isNaN(product.order) ? product.order : 0,
    isActive: product.isActive !== false,
    updatedAt: now,
    createdAt: product.createdAt || now,
    photoUrl: finalPhoto || '',
    photos: Array.isArray(product.photos) ? product.photos : (finalPhoto ? [finalPhoto] : []),
    variations: Array.isArray(product.variations) ? product.variations : [],
  }

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId)
    await setDoc(docRef, productToSave, { merge: true })
    return { success: true, product: productToSave as unknown as CompanyProduct }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PRODUCTS_COLLECTION}/${productId}`)
  }
}

export async function deleteFirestoreProduct(
  productId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      return { success: true }
    }
    const data = snap.data() as CompanyProduct
    // Security check: isolate per companyId
    if (data.companyId !== companyId) {
      return { success: false, error: 'Operação não autorizada para este produto.' }
    }
    await deleteDoc(docRef)
    return { success: true }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${productId}`)
  }
}

export async function toggleFirestoreProductStatus(
  productId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      return { success: false, error: 'Produto não encontrado.' }
    }
    const data = snap.data() as CompanyProduct
    if (data.companyId !== companyId) {
      return { success: false, error: 'Operação não autorizada.' }
    }
    await updateDoc(docRef, {
      isActive: !data.isActive,
      updatedAt: new Date().toISOString(),
    })
    return { success: true }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PRODUCTS_COLLECTION}/${productId}`)
  }
}

// ==========================================
// 9. MENU ITEMS (CARDÁPIO DIGITAL DIRETO LINK)
// ==========================================

export async function getFirestoreMenuItems(companyId?: string): Promise<MenuItem[]> {
  try {
    await ensureFirestoreInitialized()
    const colRef = collection(db, MENU_ITEMS_COLLECTION)
    let q
    if (companyId) {
      q = query(colRef, where('companyId', '==', companyId))
    } else {
      q = colRef
    }
    const snap = await getDocs(q)
    const list: MenuItem[] = []
    snap.forEach((d) => {
      list.push(d.data() as MenuItem)
    })

    // If Firestore has no menu items for this company yet, fallback to INITIAL_MENU_ITEMS if applicable
    if (list.length === 0 && companyId) {
      const initMatch = INITIAL_MENU_ITEMS.filter((i) => i.companyId === companyId)
      if (initMatch.length > 0) {
        return initMatch
      }
    }

    return list.sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 0
      const orderB = typeof b.order === 'number' ? b.order : 0
      if (orderA !== orderB) return orderA - orderB
      return (b.createdAt || '').localeCompare(a.createdAt || '')
    })
  } catch (err) {
    console.warn('Could not read menu items from Firestore (returning initial fallback):', err)
    if (companyId) {
      return INITIAL_MENU_ITEMS.filter((i) => i.companyId === companyId)
    }
    return INITIAL_MENU_ITEMS
  }
}

export async function getFirestoreMenuItemById(
  companyId: string,
  itemId: string
): Promise<MenuItem | null> {
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, MENU_ITEMS_COLLECTION, itemId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      // Fallback check initial
      const initItem = INITIAL_MENU_ITEMS.find((i) => i.id === itemId && i.companyId === companyId)
      return initItem || null
    }
    const data = snap.data() as MenuItem
    if (data.companyId !== companyId) return null
    return data
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${MENU_ITEMS_COLLECTION}/${itemId}`)
  }
}

export async function saveFirestoreMenuItem(
  item: MenuItem
): Promise<{ success: boolean; menuItem?: MenuItem; error?: string }> {
  if (!item.name || !item.name.trim()) {
    return { success: false, error: 'Nome do item do cardápio é obrigatório.' }
  }
  if (!item.companyId) {
    return { success: false, error: 'companyId é obrigatório.' }
  }

  // Handle photoUrl with base64 defense and conversion
  let finalPhoto = item.photoUrl?.trim() || undefined
  if (finalPhoto && isBase64Image(finalPhoto)) {
    try {
      const { uploadCompanyFileServer } = await import('@/lib/storage-service')
      const matches = finalPhoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (matches && matches[2]) {
        const mime = matches[1]
        const buf = Buffer.from(matches[2], 'base64')
        const up = await uploadCompanyFileServer(item.companyId, 'menu', buf, 'menu_item.jpg', mime)
        finalPhoto = up.url || undefined
      }
    } catch {
      finalPhoto = undefined
    }
  }

  await ensureFirestoreInitialized()
  const now = new Date().toISOString()
  const itemId = item.id || `mnu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  const itemToSave: Record<string, unknown> = {
    id: itemId,
    companyId: item.companyId,
    name: item.name.trim(),
    category: item.category?.trim() || 'Geral',
    description: item.description?.trim() || '',
    price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : null,
    priceType: item.priceType || (item.price != null ? 'fixed' : 'consult'),
    promotionalPrice:
      typeof item.promotionalPrice === 'number' && !isNaN(item.promotionalPrice)
        ? item.promotionalPrice
        : null,
    isAvailable: item.isAvailable !== false,
    isFeatured: Boolean(item.isFeatured),
    order: typeof item.order === 'number' && !isNaN(item.order) ? item.order : 0,
    sizes: Array.isArray(item.sizes) ? item.sizes : [],
    flavorsMax: typeof item.flavorsMax === 'number' ? item.flavorsMax : 1,
    flavors: Array.isArray(item.flavors) ? item.flavors : [],
    extras: Array.isArray(item.extras) ? item.extras : [],
    removableIngredients: Array.isArray(item.removableIngredients) ? item.removableIngredients : [],
    allowNotes: item.allowNotes !== false,
    isCustomBuilder: Boolean(item.isCustomBuilder),
    customSteps: Array.isArray(item.customSteps) ? item.customSteps : [],
    isActive: item.isActive !== false,
    updatedAt: now,
    createdAt: item.createdAt || now,
    photoUrl: finalPhoto || '',
  }

  try {
    const docRef = doc(db, MENU_ITEMS_COLLECTION, itemId)
    await setDoc(docRef, itemToSave, { merge: true })
    return { success: true, menuItem: itemToSave as unknown as MenuItem }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${MENU_ITEMS_COLLECTION}/${itemId}`)
  }
}

export async function deleteFirestoreMenuItem(
  itemId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, MENU_ITEMS_COLLECTION, itemId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      return { success: true }
    }
    const data = snap.data() as MenuItem
    if (data.companyId !== companyId) {
      return { success: false, error: 'Operação não autorizada para este item do cardápio.' }
    }
    await deleteDoc(docRef)
    return { success: true }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${MENU_ITEMS_COLLECTION}/${itemId}`)
  }
}

export async function toggleFirestoreMenuItemStatus(
  itemId: string,
  companyId: string
): Promise<{ success: boolean; isAvailable?: boolean; error?: string }> {
  await ensureFirestoreInitialized()
  try {
    const docRef = doc(db, MENU_ITEMS_COLLECTION, itemId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      return { success: false, error: 'Item do cardápio não encontrado.' }
    }
    const data = snap.data() as MenuItem
    if (data.companyId !== companyId) {
      return { success: false, error: 'Operação não autorizada.' }
    }
    const newAvailable = !data.isAvailable
    await updateDoc(docRef, {
      isAvailable: newAvailable,
      updatedAt: new Date().toISOString(),
    })
    return { success: true, isAvailable: newAvailable }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${MENU_ITEMS_COLLECTION}/${itemId}`)
  }
}

// ==========================================
// 10. REORDERING FUNCTIONS (PRODUCTS, SERVICES, MENU ITEMS)
// ==========================================

export async function saveFirestoreProductsOrder(
  companyId: string,
  orderedIds: string[]
): Promise<boolean> {
  if (!companyId || !Array.isArray(orderedIds)) return false
  try {
    await ensureFirestoreInitialized()
    const compRef = doc(db, COMPANIES_COLLECTION, companyId)
    await updateDoc(compRef, {
      productsOrder: orderedIds,
      updatedAt: new Date().toISOString(),
    }).catch(async () => {
      await setDoc(compRef, { productsOrder: orderedIds, updatedAt: new Date().toISOString() }, { merge: true })
    })

    await Promise.all(
      orderedIds.map((id, index) => {
        const prodRef = doc(db, PRODUCTS_COLLECTION, id)
        return updateDoc(prodRef, {
          order: index,
          updatedAt: new Date().toISOString(),
        }).catch(() => null)
      })
    )
    return true
  } catch (err) {
    console.error('Error saving products order to Firestore:', err)
    return false
  }
}

export async function saveFirestoreServicesOrder(
  companyId: string,
  orderedIds: string[]
): Promise<boolean> {
  if (!companyId || !Array.isArray(orderedIds)) return false
  try {
    await ensureFirestoreInitialized()
    const compRef = doc(db, COMPANIES_COLLECTION, companyId)
    await updateDoc(compRef, {
      servicesOrder: orderedIds,
      updatedAt: new Date().toISOString(),
    }).catch(async () => {
      await setDoc(compRef, { servicesOrder: orderedIds, updatedAt: new Date().toISOString() }, { merge: true })
    })

    await Promise.all(
      orderedIds.map((id, index) => {
        const srvRef = doc(db, SERVICES_COLLECTION, id)
        return updateDoc(srvRef, {
          order: index,
          updatedAt: new Date().toISOString(),
        }).catch(() => null)
      })
    )
    return true
  } catch (err) {
    console.error('Error saving services order to Firestore:', err)
    return false
  }
}

export async function saveFirestoreMenuItemsOrder(
  companyId: string,
  orderedIds: string[]
): Promise<boolean> {
  if (!companyId || !Array.isArray(orderedIds)) return false
  try {
    await ensureFirestoreInitialized()
    const compRef = doc(db, COMPANIES_COLLECTION, companyId)
    await updateDoc(compRef, {
      menuItemsOrder: orderedIds,
      updatedAt: new Date().toISOString(),
    }).catch(async () => {
      await setDoc(compRef, { menuItemsOrder: orderedIds, updatedAt: new Date().toISOString() }, { merge: true })
    })

    await Promise.all(
      orderedIds.map((id, index) => {
        const itemRef = doc(db, MENU_ITEMS_COLLECTION, id)
        return updateDoc(itemRef, {
          order: index,
          updatedAt: new Date().toISOString(),
        }).catch(() => null)
      })
    )
    return true
  } catch (err) {
    console.error('Error saving menu items order to Firestore:', err)
    return false
  }
}

// ==========================================
// 12. MESAS (MULTI-TENANT CRUD)
// ==========================================

export async function getFirestoreTables(companyId: string): Promise<CompanyTable[]> {
  try {
    await ensureFirestoreInitialized()
    const q = query(collection(db, TABLES_COLLECTION), where('companyId', '==', companyId))
    const snap = await getDocs(q)
    const list: CompanyTable[] = []
    snap.forEach((d) => {
      list.push(d.data() as CompanyTable)
    })

    if (list.length === 0 && companyId) {
      const initMatch = INITIAL_TABLES.filter((t) => t.companyId === companyId)
      if (initMatch.length > 0) return initMatch
    }

    return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  } catch (err) {
    console.warn('Could not read tables from Firestore (returning initial fallback):', err)
    if (companyId) {
      return INITIAL_TABLES.filter((t) => t.companyId === companyId)
    }
    return INITIAL_TABLES
  }
}

export async function saveFirestoreTable(table: CompanyTable): Promise<CompanyTable> {
  try {
    await ensureFirestoreInitialized()
    const cleanId = table.id || `table_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const toSave: CompanyTable = {
      ...table,
      id: cleanId,
      updatedAt: new Date().toISOString(),
      createdAt: table.createdAt || new Date().toISOString(),
    }
    const docRef = doc(db, TABLES_COLLECTION, cleanId)
    await setDoc(docRef, toSave, { merge: true })
    return toSave
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, TABLES_COLLECTION)
    throw err
  }
}

export async function deleteFirestoreTable(tableId: string): Promise<void> {
  try {
    await ensureFirestoreInitialized()
    const docRef = doc(db, TABLES_COLLECTION, tableId)
    await deleteDoc(docRef)
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, TABLES_COLLECTION)
    throw err
  }
}

export async function toggleFirestoreTableStatus(
  tableId: string,
  companyId: string
): Promise<boolean> {
  try {
    await ensureFirestoreInitialized()
    const docRef = doc(db, TABLES_COLLECTION, tableId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return false
    const data = snap.data() as CompanyTable
    if (data.companyId !== companyId) return false
    const nextStatus = !data.isActive
    await updateDoc(docRef, { isActive: nextStatus, updatedAt: new Date().toISOString() })
    return nextStatus
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, TABLES_COLLECTION)
    return false
  }
}

// ==========================================
// 13. PEDIDOS DO SALÃO (TABLE ORDERS)
// ==========================================

export async function getFirestoreTableOrders(companyId: string): Promise<TableOrder[]> {
  try {
    await ensureFirestoreInitialized()
    const q = query(collection(db, TABLE_ORDERS_COLLECTION), where('companyId', '==', companyId))
    const snap = await getDocs(q)
    const list: TableOrder[] = []
    snap.forEach((d) => {
      const data = d.data() as TableOrder
      list.push({
        ...data,
        items: Array.isArray(data?.items) ? data.items : [],
      })
    })

    if (list.length === 0 && companyId) {
      const initMatch = INITIAL_TABLE_ORDERS.filter((o) => o.companyId === companyId)
      if (initMatch.length > 0) return initMatch
    }

    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  } catch (err) {
    console.warn('Could not read table orders from Firestore (returning initial fallback):', err)
    if (companyId) {
      return INITIAL_TABLE_ORDERS.filter((o) => o.companyId === companyId)
    }
    return INITIAL_TABLE_ORDERS
  }
}

export async function saveFirestoreTableOrder(order: TableOrder): Promise<TableOrder> {
  try {
    await ensureFirestoreInitialized()
    const cleanId = order.id || `ord_table_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const toSave: TableOrder = {
      ...order,
      id: cleanId,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const docRef = doc(db, TABLE_ORDERS_COLLECTION, cleanId)
    const cleanPayload = JSON.parse(JSON.stringify(toSave))
    await setDoc(docRef, cleanPayload, { merge: true })
    return toSave
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, TABLE_ORDERS_COLLECTION)
    throw err
  }
}

export async function updateFirestoreTableOrderStatus(
  orderId: string,
  status: TableOrderStatus,
  companyId?: string
): Promise<void> {
  const cleanId = (orderId || '').trim()
  if (!cleanId) return

  try {
    await ensureFirestoreInitialized()
    const docRef = doc(db, TABLE_ORDERS_COLLECTION, cleanId)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      await updateDoc(docRef, {
        status,
        updatedAt: new Date().toISOString(),
      })
      return
    }

    const initialMatch = INITIAL_TABLE_ORDERS.find((o) => o.id === cleanId)
    if (initialMatch) {
      const payload = JSON.parse(
        JSON.stringify({
          ...initialMatch,
          status,
          updatedAt: new Date().toISOString(),
        })
      )
      await setDoc(docRef, payload)
      return
    }

    if (companyId) {
      try {
        const q = query(collection(db, TABLE_ORDERS_COLLECTION), where('companyId', '==', companyId))
        const snapQuery = await getDocs(q)
        const matchingDoc = snapQuery.docs.find((d) => d.id === cleanId || d.data()?.id === cleanId)
        if (matchingDoc) {
          await updateDoc(matchingDoc.ref, {
            status,
            updatedAt: new Date().toISOString(),
          })
          return
        }
      } catch (qErr) {
        console.warn('Could not query tableOrders by companyId:', qErr)
      }
    }

    const payload = JSON.parse(
      JSON.stringify({
        id: cleanId,
        ...(companyId ? { companyId } : {}),
        status,
        updatedAt: new Date().toISOString(),
      })
    )
    await setDoc(docRef, payload, { merge: true })
  } catch (err) {
    console.warn('Firestore updateDoc failed, attempting setDoc merge fallback:', err)
    try {
      const docRef = doc(db, TABLE_ORDERS_COLLECTION, cleanId)
      const payload = JSON.parse(
        JSON.stringify({
          id: cleanId,
          ...(companyId ? { companyId } : {}),
          status,
          updatedAt: new Date().toISOString(),
        })
      )
      await setDoc(docRef, payload, { merge: true })
    } catch (innerErr) {
      console.warn('Firestore fallback update also failed, keeping local contingency status:', innerErr)
    }
  }
}

export async function updateFirestoreTableOrderFull(order: TableOrder): Promise<TableOrder> {
  return await saveFirestoreTableOrder(order)
}

export async function deleteFirestoreTableOrder(
  orderId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const cleanId = (orderId || '').trim()
  if (!cleanId) return { success: false, error: 'ID do pedido é obrigatório.' }
  try {
    await ensureFirestoreInitialized()
    const docRef = doc(db, TABLE_ORDERS_COLLECTION, cleanId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      return { success: true }
    }
    const data = snap.data() as TableOrder
    if (companyId && data.companyId && data.companyId !== companyId) {
      return { success: false, error: 'Operação não autorizada.' }
    }
    await deleteDoc(docRef)
    return { success: true }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${TABLE_ORDERS_COLLECTION}/${cleanId}`)
    return { success: false, error: 'Erro ao excluir pedido.' }
  }
}

// ==========================================
// 14. MOTOBOYS / ENTREGADORES (COURIERS)
// ==========================================

export async function getFirestoreCouriers(companyId: string): Promise<CompanyCourier[]> {
  try {
    await ensureFirestoreInitialized()
    const q = query(collection(db, COURIERS_COLLECTION), where('companyId', '==', companyId))
    const snap = await getDocs(q)
    const list: CompanyCourier[] = []
    snap.forEach((d) => {
      list.push(d.data() as CompanyCourier)
    })
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } catch (err) {
    console.warn('Could not read couriers from Firestore:', err)
    return []
  }
}

export async function saveFirestoreCourier(courier: CompanyCourier): Promise<CompanyCourier> {
  try {
    await ensureFirestoreInitialized()
    const cleanId = courier.id || `courier_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const toSave: CompanyCourier = {
      ...courier,
      id: cleanId,
      createdAt: courier.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const docRef = doc(db, COURIERS_COLLECTION, cleanId)
    await setDoc(docRef, toSave, { merge: true })
    return toSave
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, COURIERS_COLLECTION)
    throw err
  }
}

export async function deleteFirestoreCourier(courierId: string): Promise<void> {
  try {
    await ensureFirestoreInitialized()
    const docRef = doc(db, COURIERS_COLLECTION, courierId)
    await deleteDoc(docRef)
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, COURIERS_COLLECTION)
    throw err
  }
}

// ==========================================
// 15. ASSINATURAS E WEBHOOK ASAAS (SANDBOX / PRODUÇÃO)
// ==========================================

export async function getFirestoreSubscription(companyId: string): Promise<CompanySubscription | null> {
  if (!companyId) return null
  try {
    await ensureFirestoreInitialized()
    const cleanId = companyId.trim()
    const docRef = doc(db, SUBSCRIPTIONS_COLLECTION, cleanId)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return snap.data() as CompanySubscription
    }

    // Fallback: verificar se já está gravada no documento da empresa
    const compRef = doc(db, COMPANIES_COLLECTION, cleanId)
    const compSnap = await getDoc(compRef)
    if (compSnap.exists() && compSnap.data()?.subscription) {
      return compSnap.data()?.subscription as CompanySubscription
    }

    // Fallback: buscar por query no campo companyId
    const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), where('companyId', '==', cleanId))
    const qSnap = await getDocs(q)
    if (!qSnap.empty) {
      return qSnap.docs[0].data() as CompanySubscription
    }

    return null
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, SUBSCRIPTIONS_COLLECTION)
    return null
  }
}

export async function saveFirestoreSubscription(sub: CompanySubscription): Promise<CompanySubscription> {
  if (!sub || !sub.companyId) {
    throw new Error('companyId é obrigatório na assinatura.')
  }
  try {
    await ensureFirestoreInitialized()
    const cleanCompanyId = sub.companyId.trim()
    const docId = cleanCompanyId // Indexado diretamente por companyId para acesso rápido e seguro
    const nowIso = new Date().toISOString()
    const toSave: CompanySubscription = {
      ...sub,
      id: sub.id || `sub_${cleanCompanyId}`,
      companyId: cleanCompanyId,
      updatedAt: nowIso,
      createdAt: sub.createdAt || nowIso,
    }

    const payload = JSON.parse(JSON.stringify(toSave))

    // 1. Grava na coleção dedicada subscriptions
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, docId)
    await setDoc(subRef, payload, { merge: true })

    // 2. Atualiza atomicamente o campo subscription no documento da empresa correspondente
    try {
      const compRef = doc(db, COMPANIES_COLLECTION, cleanCompanyId)
      await setDoc(compRef, { subscription: payload, updatedAt: nowIso }, { merge: true })
    } catch (compErr) {
      console.warn('Não foi possível sincronizar subscription no doc da empresa:', compErr)
    }

    return toSave
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, SUBSCRIPTIONS_COLLECTION)
    throw err
  }
}

export async function getFirestoreSubscriptionByAsaasId(
  asaasSubscriptionId: string
): Promise<CompanySubscription | null> {
  if (!asaasSubscriptionId) return null
  try {
    await ensureFirestoreInitialized()
    const cleanId = asaasSubscriptionId.trim()
    const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), where('asaasSubscriptionId', '==', cleanId))
    const qSnap = await getDocs(q)
    if (!qSnap.empty) {
      return qSnap.docs[0].data() as CompanySubscription
    }
    return null
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, SUBSCRIPTIONS_COLLECTION)
    return null
  }
}

export async function getFirestoreSubscriptionByAsaasCustomerId(
  asaasCustomerId: string
): Promise<CompanySubscription | null> {
  if (!asaasCustomerId) return null
  try {
    await ensureFirestoreInitialized()
    const cleanId = asaasCustomerId.trim()
    const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), where('asaasCustomerId', '==', cleanId))
    const qSnap = await getDocs(q)
    if (!qSnap.empty) {
      return qSnap.docs[0].data() as CompanySubscription
    }
    return null
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, SUBSCRIPTIONS_COLLECTION)
    return null
  }
}

export async function isAsaasWebhookEventProcessed(eventId: string): Promise<boolean> {
  if (!eventId) return false
  try {
    await ensureFirestoreInitialized()
    const docRef = doc(db, ASAAS_WEBHOOK_EVENTS_COLLECTION, eventId.trim())
    const snap = await getDoc(docRef)
    return snap.exists()
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, ASAAS_WEBHOOK_EVENTS_COLLECTION)
    return false
  }
}

export async function recordAsaasWebhookEvent(
  eventId: string,
  event: string,
  payload: unknown,
  companyId?: string
): Promise<void> {
  if (!eventId) return
  try {
    await ensureFirestoreInitialized()
    const nowIso = new Date().toISOString()
    const docRef = doc(db, ASAAS_WEBHOOK_EVENTS_COLLECTION, eventId.trim())
    const log: AsaasWebhookEventLog = {
      id: eventId.trim(),
      event,
      dateCreated: nowIso,
      processedAt: nowIso,
      companyId: companyId || undefined,
      status: 'PROCESSED',
    }
    const cleanPayload = JSON.parse(JSON.stringify({ ...log, rawPayload: payload }))
    await setDoc(docRef, cleanPayload, { merge: true })
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, ASAAS_WEBHOOK_EVENTS_COLLECTION)
  }
}



