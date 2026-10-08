/**
 * Color utilities, contrast calculations and curated brand palettes.
 */

export interface ColorPreset {
  id: string
  name: string
  description?: string
  primary: string
  secondary: string
}

export const BRAND_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'gold-noir',
    name: 'Ouro Nobre & Preto',
    description: 'Elegância de alta classe inspirada em cartões VIP',
    primary: '#18181B',
    secondary: '#D4AF37',
  },
  {
    id: 'champagne-dark',
    name: 'Champagne & Noir',
    description: 'Dourado refinado sobre fundo escuro marcante',
    primary: '#0F172A',
    secondary: '#F59E0B',
  },
  {
    id: 'emerald-luxury',
    name: 'Esmeralda & Menta',
    description: 'Verde nobre com toques modernos e elegantes',
    primary: '#064E3B',
    secondary: '#10B981',
  },
  {
    id: 'wine-rose',
    name: 'Vinho & Rosé Gold',
    description: 'Bordô aveludado com rosé sofisticado',
    primary: '#4A044E',
    secondary: '#FB7185',
  },
  {
    id: 'sapphire-blue',
    name: 'Safira & Azul Royal',
    description: 'Azul executivo moderno e marcante',
    primary: '#0F172A',
    secondary: '#3B82F6',
  },
  {
    id: 'royal-purple',
    name: 'Roxo Real & Violeta',
    description: 'Vibrante e contemporâneo',
    primary: '#6D28D9',
    secondary: '#A855F7',
  },
  {
    id: 'espresso-amber',
    name: 'Café Espresso & Âmbar',
    description: 'Tons artesanais quentes e gastronômicos',
    primary: '#291B14',
    secondary: '#D97706',
  },
  {
    id: 'titanium-silver',
    name: 'Titânio & Prata',
    description: 'Minimalismo escuro com metal prateado',
    primary: '#18181B',
    secondary: '#71717A',
  },
]

export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{3}){1,2}$/.test(hex.trim())
}

export function sanitizeHex(hex?: string, fallback = '#6D28D9'): string {
  if (!hex || typeof hex !== 'string') return fallback
  const clean = hex.trim()
  if (isValidHex(clean)) return clean
  if (!clean.startsWith('#') && isValidHex(`#${clean}`)) return `#${clean}`
  return fallback
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const num = parseInt(clean, 16)
  if (isNaN(num) || clean.length !== 6) {
    return { r: 109, g: 40, b: 217 } // fallback #6D28D9
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  const safeAlpha = Math.max(0, Math.min(1, alpha))
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`
}

/**
 * Calculates WCAG relative luminance (0 = black, 1 = white)
 */
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  )
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Returns '#ffffff' (white) or '#171717' (dark/black) to ensure high readability
 * based on the background color luminance.
 */
export function getContrastTextColor(hexColor: string): '#ffffff' | '#171717' {
  const lum = getLuminance(hexColor)
  // Threshold 0.38 ensures great readability even for mid tones like gold or yellow
  return lum > 0.38 ? '#171717' : '#ffffff'
}

/**
 * Calculates readable text color for a linear gradient between two colors
 */
export function getGradientContrastTextColor(
  color1: string,
  color2: string
): '#ffffff' | '#171717' {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const avgLum = lum1 * 0.5 + lum2 * 0.5
  return avgLum > 0.38 ? '#171717' : '#ffffff'
}
