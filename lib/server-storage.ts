import fs from 'fs'
import path from 'path'
import { Company, Customer, PointRequest, ActivityLog, PrivateFeedback } from '@/types/platform'
import {
  INITIAL_COMPANIES,
  INITIAL_CUSTOMERS,
  INITIAL_REQUESTS,
  INITIAL_LOGS,
  INITIAL_FEEDBACKS,
} from '@/lib/initial-data'

interface PlatformDatabase {
  companies: Company[]
  customers: Customer[]
  requests: PointRequest[]
  logs: ActivityLog[]
  feedbacks: PrivateFeedback[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'platform-db.json')

// In-memory cache for fast access
let memoryDb: PlatformDatabase | null = null

function ensureDb(): PlatformDatabase {
  if (memoryDb) return memoryDb

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8')
      const parsed = JSON.parse(content)
      memoryDb = {
        companies: Array.isArray(parsed.companies) && parsed.companies.length > 0 ? parsed.companies : INITIAL_COMPANIES,
        customers: Array.isArray(parsed.customers) ? parsed.customers : INITIAL_CUSTOMERS,
        requests: Array.isArray(parsed.requests) ? parsed.requests : INITIAL_REQUESTS,
        logs: Array.isArray(parsed.logs) ? parsed.logs : INITIAL_LOGS,
        feedbacks: Array.isArray(parsed.feedbacks) ? parsed.feedbacks : INITIAL_FEEDBACKS,
      }
      return memoryDb
    }
  } catch (err) {
    console.error('Error reading platform-db.json:', err)
  }

  // Fallback to initial seed
  memoryDb = {
    companies: INITIAL_COMPANIES,
    customers: INITIAL_CUSTOMERS,
    requests: INITIAL_REQUESTS,
    logs: INITIAL_LOGS,
    feedbacks: INITIAL_FEEDBACKS,
  }

  persistDb(memoryDb)
  return memoryDb
}

function persistDb(db: PlatformDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
  } catch (err) {
    console.error('Error saving platform-db.json:', err)
  }
}

// ==========================================
// COMPANIES
// ==========================================

export function getServerCompanies(): Company[] {
  const db = ensureDb()
  return db.companies
}

export function getServerCompanyBySlug(slug: string): Company | null {
  const clean = slug.toLowerCase().trim()
  const companies = getServerCompanies()
  return companies.find((c) => c.slug.toLowerCase() === clean) || null
}

export function getServerCompanyById(id: string): Company | null {
  const companies = getServerCompanies()
  return companies.find((c) => c.id === id) || null
}

export function saveServerCompany(company: Company): { success: boolean; error?: string } {
  const db = ensureDb()
  const cleanSlug = company.slug.toLowerCase().trim()

  const existingWithSlug = db.companies.find(
    (c) => c.slug.toLowerCase() === cleanSlug && c.id !== company.id
  )
  if (existingWithSlug) {
    return { success: false, error: 'Já existe outro estabelecimento utilizando este slug.' }
  }

  const index = db.companies.findIndex((c) => c.id === company.id)
  if (index >= 0) {
    db.companies[index] = {
      ...company,
      updatedAt: new Date().toISOString(),
    }
  } else {
    db.companies.push({
      ...company,
      createdAt: company.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  persistDb(db)
  return { success: true }
}

export function deleteServerCompany(companyId: string): boolean {
  const db = ensureDb()
  const initialLength = db.companies.length
  db.companies = db.companies.filter((c) => c.id !== companyId)
  if (db.companies.length === initialLength) return false

  // Cascade delete
  db.customers = db.customers.filter((c) => c.companyId !== companyId)
  db.requests = db.requests.filter((r) => r.companyId !== companyId)
  db.logs = db.logs.filter((l) => l.companyId !== companyId)
  db.feedbacks = db.feedbacks.filter((f) => f.companyId !== companyId)

  persistDb(db)
  return true
}

export function toggleServerCompanyStatus(companyId: string): boolean {
  const db = ensureDb()
  const comp = db.companies.find((c) => c.id === companyId)
  if (!comp) return false

  comp.isActive = !comp.isActive
  comp.updatedAt = new Date().toISOString()
  persistDb(db)
  return true
}

// ==========================================
// FEEDBACKS (STRICT TENANT ISOLATION)
// ==========================================

export function getServerFeedbacks(companyId: string): PrivateFeedback[] {
  if (!companyId) return []
  const db = ensureDb()
  if (!Array.isArray(db.feedbacks)) {
    db.feedbacks = []
  }
  return db.feedbacks.filter((f) => f && f.companyId === companyId)
}

export function saveServerFeedback(data: {
  companyId: string
  rating?: number
  message: string
  customerName?: string
  customerPhone?: string
}): { success: boolean; feedback?: PrivateFeedback; error?: string } {
  if (!data.message || !data.message.trim()) {
    return { success: false, error: 'Mensagem de feedback não informada.' }
  }

  const db = ensureDb()
  const newFeedback: PrivateFeedback = {
    id: `feed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId: data.companyId,
    rating: data.rating,
    message: data.message.trim(),
    customerName: data.customerName?.trim() || undefined,
    customerPhone: data.customerPhone?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }

  db.feedbacks.unshift(newFeedback)
  persistDb(db)
  return { success: true, feedback: newFeedback }
}
