import { Company } from '@/types/platform'
import { getAllCompanies } from './storage'

export const AUTH_CHANGE_EVENT = 'nfc_auth_change_event_v1'

const ADMIN_STORAGE_KEY = 'nfc_admin_session_auth_v1'
const OWNER_STORAGE_KEY_PREFIX = 'nfc_owner_session_v1_'

function notifyAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT))
  }
}

// ==========================================
// 1. ADMINISTRADOR GERAL AUTH (SERVER-VALIDATED)
// ==========================================

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const val = localStorage.getItem(ADMIN_STORAGE_KEY)
    return Boolean(val)
  } catch {
    return false
  }
}

export async function loginAdmin(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = emailInput.trim().toLowerCase()
  const cleanPass = passwordInput.trim()

  if (!cleanEmail || !cleanPass) {
    return { success: false, error: 'Por favor, preencha o e-mail e a senha do administrador.' }
  }

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPass,
      }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_STORAGE_KEY, data.token || 'authenticated')
        notifyAuthChange()
      }
      return { success: true }
    }

    return {
      success: false,
      error: data.error || 'Credenciais de administrador inválidas.',
    }
  } catch {
    return {
      success: false,
      error: 'Erro de comunicação ao validar credenciais no servidor.',
    }
  }
}

export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_STORAGE_KEY)
    notifyAuthChange()
  }
}

// ==========================================
// 2. PAINEL DO PROPRIETÁRIO AUTH (ISOLADO)
// ==========================================

export function isOwnerAuthenticated(companyId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const val = localStorage.getItem(`${OWNER_STORAGE_KEY_PREFIX}${companyId}`)
    return val === 'true'
  } catch {
    return false
  }
}

export async function loginOwnerAsync(
  company: Company,
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; error?: string }> {
  const cleanUser = usernameInput.trim().toLowerCase()
  const cleanPass = passwordInput.trim()

  if (!cleanUser || !cleanPass) {
    return { success: false, error: 'Por favor, informe seu usuário/e-mail e senha.' }
  }

  try {
    const res = await fetch('/api/owner/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: company.id,
        username: cleanUser,
        password: cleanPass,
      }),
    })
    const data = await res.json()
    if (res.ok && data.success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${OWNER_STORAGE_KEY_PREFIX}${company.id}`, 'true')
        notifyAuthChange()
      }
      return { success: true }
    }
    return { success: false, error: data.error || 'Credenciais inválidas.' }
  } catch (err) {
    console.warn('Fallback checking owner login locally:', err)
  }

  return loginOwner(company, usernameInput, passwordInput)
}

export function loginOwner(
  company: Company,
  usernameInput: string,
  passwordInput: string
): { success: boolean; error?: string } {
  const cleanUser = usernameInput.trim().toLowerCase()
  const cleanPass = passwordInput.trim()

  if (!cleanUser || !cleanPass) {
    return { success: false, error: 'Por favor, informe seu usuário/e-mail e senha.' }
  }

  // Company specific owner credentials
  const expectedUser = company.ownerAuth?.username?.toLowerCase() || company.slug
  const expectedPass = company.ownerAuth?.password || '123456'

  if (cleanUser === expectedUser && (cleanPass === expectedPass || !expectedPass)) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${OWNER_STORAGE_KEY_PREFIX}${company.id}`, 'true')
      notifyAuthChange()
    }
    return { success: true }
  }

  return {
    success: false,
    error: 'Credenciais de acesso incorretas para este estabelecimento.',
  }
}

export function logoutOwner(companyId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${OWNER_STORAGE_KEY_PREFIX}${companyId}`)
    notifyAuthChange()
  }
}

/**
 * Allows an owner to log in from a general portal and find their company
 */
export async function findCompanyByOwnerLoginAsync(
  usernameInput: string,
  passwordInput: string
): Promise<Company | null> {
  const cleanUser = usernameInput.trim().toLowerCase()
  const cleanPass = passwordInput.trim()
  if (!cleanUser || !cleanPass) return null

  try {
    const res = await fetch('/api/owner/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUser,
        password: cleanPass,
      }),
    })
    const data = await res.json()
    if (res.ok && data.success && data.company) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${OWNER_STORAGE_KEY_PREFIX}${data.company.id}`, 'true')
        notifyAuthChange()
      }
      return data.company
    }
  } catch (err) {
    console.warn('Fallback finding company locally:', err)
  }

  return findCompanyByOwnerLogin(usernameInput, passwordInput)
}

export function findCompanyByOwnerLogin(
  usernameInput: string,
  passwordInput: string
): Company | null {
  const cleanUser = usernameInput.trim().toLowerCase()
  const cleanPass = passwordInput.trim()
  if (!cleanUser || !cleanPass) return null

  const companies = getAllCompanies()
  for (const c of companies) {
    const expectedUser = c.ownerAuth?.username?.toLowerCase() || c.slug
    const expectedPass = c.ownerAuth?.password || '123456'
    if (cleanUser === expectedUser && cleanPass === expectedPass) {
      return c
    }
  }
  return null
}
