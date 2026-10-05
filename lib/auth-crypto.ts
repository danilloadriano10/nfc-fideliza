/**
 * Authentication and Password Hashing
 * Pure-JavaScript SHA-256 implementation with system salt.
 * 100% isomorphic and browser-safe (zero Node.js 'crypto' imports, zero webpack client errors).
 */

const SALT = 'taphub_secure_nfc_platform_salt_2026'

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

function sha256Pure(str: string): string {
  function ror(n: number, s: number) {
    return (n >>> s) | (n << (32 - s))
  }
  function ch(x: number, y: number, z: number) {
    return (x & y) ^ (~x & z)
  }
  function maj(x: number, y: number, z: number) {
    return (x & y) ^ (x & z) ^ (y & z)
  }
  function s0(x: number) {
    return ror(x, 2) ^ ror(x, 13) ^ ror(x, 22)
  }
  function s1(x: number) {
    return ror(x, 6) ^ ror(x, 11) ^ ror(x, 25)
  }
  function g0(x: number) {
    return ror(x, 7) ^ ror(x, 18) ^ (x >>> 3)
  }
  function g1(x: number) {
    return ror(x, 17) ^ ror(x, 19) ^ (x >>> 10)
  }

  // UTF-8 encode string to bytes
  const utf8: number[] = []
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i)
    if (charcode < 0x80) {
      utf8.push(charcode)
    } else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f))
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f))
    } else {
      i++
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff))
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      )
    }
  }

  const bitLen = utf8.length * 8
  utf8.push(0x80)
  while (utf8.length % 64 !== 56) {
    utf8.push(0)
  }

  // Append 64-bit length in big-endian
  const highBitLen = Math.floor(bitLen / 0x100000000)
  utf8.push(
    (highBitLen >>> 24) & 0xff,
    (highBitLen >>> 16) & 0xff,
    (highBitLen >>> 8) & 0xff,
    highBitLen & 0xff
  )
  utf8.push(
    (bitLen >>> 24) & 0xff,
    (bitLen >>> 16) & 0xff,
    (bitLen >>> 8) & 0xff,
    bitLen & 0xff
  )

  let H0 = 0x6a09e667,
    H1 = 0xbb67ae85,
    H2 = 0x3c6ef372,
    H3 = 0xa54ff53a
  let H4 = 0x510e527f,
    H5 = 0x9b05688c,
    H6 = 0x1f83d9ab,
    H7 = 0x5be0cd19

  const W = new Int32Array(64)

  for (let i = 0; i < utf8.length; i += 64) {
    for (let t = 0; t < 16; t++) {
      const idx = i + t * 4
      W[t] = (utf8[idx] << 24) | (utf8[idx + 1] << 16) | (utf8[idx + 2] << 8) | utf8[idx + 3]
    }
    for (let t = 16; t < 64; t++) {
      W[t] = (g1(W[t - 2]) + W[t - 7] + g0(W[t - 15]) + W[t - 16]) | 0
    }

    let a = H0,
      b = H1,
      c = H2,
      d = H3,
      e = H4,
      f = H5,
      g = H6,
      h = H7

    for (let t = 0; t < 64; t++) {
      const T1 = (h + s1(e) + ch(e, f, g) + K[t] + W[t]) | 0
      const T2 = (s0(a) + maj(a, b, c)) | 0
      h = g
      g = f
      f = e
      e = (d + T1) | 0
      d = c
      c = b
      b = a
      a = (T1 + T2) | 0
    }

    H0 = (H0 + a) | 0
    H1 = (H1 + b) | 0
    H2 = (H2 + c) | 0
    H3 = (H3 + d) | 0
    H4 = (H4 + e) | 0
    H5 = (H5 + f) | 0
    H6 = (H6 + g) | 0
    H7 = (H7 + h) | 0
  }

  function hex(n: number): string {
    return (n >>> 0).toString(16).padStart(8, '0')
  }

  return hex(H0) + hex(H1) + hex(H2) + hex(H3) + hex(H4) + hex(H5) + hex(H6) + hex(H7)
}

/**
 * Hashes a plaintext password using SHA-256 with the platform salt.
 */
export function hashPassword(plainText: string): string {
  if (!plainText) return ''
  return sha256Pure(`${SALT}:${plainText}`)
}

/**
 * Compares an entered password against a stored hash or legacy plaintext.
 */
export function verifyPassword(enteredPassword: string, storedCredential: string): boolean {
  if (!enteredPassword || !storedCredential) return false
  const hashedEntered = hashPassword(enteredPassword)
  if (hashedEntered === storedCredential) return true
  // Check if stored is still plaintext from legacy seed
  if (enteredPassword === storedCredential) return true
  return false
}
