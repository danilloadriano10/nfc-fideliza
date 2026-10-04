import crypto from 'crypto'

const SALT = 'taphub_secure_nfc_platform_salt_2026'

/**
 * Hashes a plaintext password using SHA-256 with a system salt.
 * Never stores plaintext passwords.
 */
export function hashPassword(plainText: string): string {
  if (!plainText) return ''
  return crypto.createHash('sha256').update(`${SALT}:${plainText}`).digest('hex')
}

/**
 * Compares an entered password against a stored hash or legacy plaintext.
 * Seamlessly handles legacy passwords during migration.
 */
export function verifyPassword(enteredPassword: string, storedCredential: string): boolean {
  if (!enteredPassword || !storedCredential) return false
  const hashedEntered = hashPassword(enteredPassword)
  if (hashedEntered === storedCredential) return true
  // Check if stored is still plaintext from legacy seed
  if (enteredPassword === storedCredential) return true
  return false
}
