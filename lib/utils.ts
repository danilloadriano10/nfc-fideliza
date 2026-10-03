import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes phone number to digits only (e.g., '(62) 99999-9999' -> '62999999999')
 */
export function normalizePhone(raw: string): string {
  if (!raw) return ""
  return raw.replace(/\D/g, "")
}

/**
 * Formats a phone number cleanly to (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export function formatPhone(raw: string): string {
  const digits = normalizePhone(raw)
  if (!digits) return ""
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Generates a clean URL slug from a business name
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^\w\s-]/g, "") // remove special chars
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}
