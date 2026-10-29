import React from 'react'
import { PublicPageThemeId, CustomThemeConfig, AdvancedColorsConfig } from '@/types/platform'
import { hexToRgba, getLuminance, sanitizeHex, getContrastTextColor } from './colors'

export interface ThemePreview {
  bgGradient: string
  cardBg: string
  cardBorder: string
  accentColor: string
  textColor: string
  secondaryAccent?: string
}

export interface ResolvedThemeColors {
  pageBg: string
  cardBg: string
  primary: string
  secondary: string
  buttonBg: string
  buttonText: string
  priceColor: string
  titleColor: string
  textColor: string
  borderColor: string
}

export interface PublicThemeDefinition {
  id: PublicPageThemeId
  name: string
  subtitle: string
  description: string
  isDarkBase: boolean
  badgeText?: string
  preview: ThemePreview
  colors: ResolvedThemeColors
  pageBgStyle: React.CSSProperties
  pageBgClass?: string
  containerBgStyle: React.CSSProperties
  containerBorderColor: string
  containerShadow: string
  textureOverlay?: {
    type: string
    style: React.CSSProperties
  }
  cardBg: string
  cardBorder: string
  cardHoverBg: string
  cardShadow?: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  accentColor: string
  badgeBg: string
  badgeTextCol: string
  heroTransitionGradient: string
  secondaryBg?: string
  modalBg?: string
  fixedAreaBg?: string
}

export function isColorDark(hex: string): boolean {
  try {
    const clean = sanitizeHex(hex, '#0d0d12')
    return getLuminance(clean) < 0.42
  } catch {
    return true
  }
}

/**
 * 10 Curated Visual Themes for DiretoLink Public Page
 */
export const PRESET_THEMES: Record<string, PublicThemeDefinition> = {
  // 1. Clean — branco e minimalista
  clean: {
    id: 'clean',
    name: 'Clean',
    subtitle: 'Branco e minimalista',
    description: 'Visual ultra limpo com fundo branco puro, tipografia nítida e cartões com sombras suaves.',
    isDarkBase: false,
    badgeText: 'Minimalista',
    preview: {
      bgGradient: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      accentColor: '#4f46e5',
      textColor: '#0f172a',
      secondaryAccent: '#06b6d4',
    },
    colors: {
      pageBg: '#f8fafc',
      cardBg: '#ffffff',
      primary: '#4f46e5',
      secondary: '#06b6d4',
      buttonBg: '#4f46e5',
      buttonText: '#ffffff',
      priceColor: '#16a34a',
      titleColor: '#0f172a',
      textColor: '#475569',
      borderColor: '#e2e8f0',
    },
    pageBgStyle: {
      backgroundColor: '#f8fafc',
      backgroundImage: 'radial-gradient(circle at 50% 0%, #f1f5f9 0%, #f8fafc 100%)',
    },
    pageBgClass: 'bg-slate-50',
    containerBgStyle: {
      backgroundColor: '#ffffff',
    },
    containerBorderColor: '#e2e8f0',
    containerShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.1)',
    textureOverlay: {
      type: 'mesh',
      style: {
        backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.6,
      },
    },
    cardBg: '#ffffff',
    cardBorder: '#eef2f6',
    cardHoverBg: '#f8fafc',
    cardShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    accentColor: '#4f46e5',
    badgeBg: '#f1f5f9',
    badgeTextCol: '#0f172a',
    heroTransitionGradient: 'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0.85) 55%, transparent 100%)',
  },

  // 2. Verde Natural — verde profundo com textura suave
  'natural-green': {
    id: 'natural-green',
    name: 'Verde Natural',
    subtitle: 'Verde profundo com textura suave',
    description: 'Estética botânica e orgânica em tons de verde esmeralda e folha profunda com textura sutil.',
    isDarkBase: true,
    badgeText: 'Orgânico',
    preview: {
      bgGradient: 'linear-gradient(135deg, #06170f 0%, #0c2b1c 50%, #10b981 100%)',
      cardBg: '#0f291c',
      cardBorder: '#1e4d35',
      accentColor: '#10b981',
      textColor: '#f0fdf4',
      secondaryAccent: '#34d399',
    },
    colors: {
      pageBg: '#05120c',
      cardBg: '#10291e',
      primary: '#10b981',
      secondary: '#34d399',
      buttonBg: '#10b981',
      buttonText: '#ffffff',
      priceColor: '#34d399',
      titleColor: '#f0fdf4',
      textColor: '#a7f3d0',
      borderColor: '#1b4d35',
    },
    pageBgStyle: {
      backgroundColor: '#05120c',
      backgroundImage: 'radial-gradient(circle at 50% 10%, #113824 0%, #05120c 90%)',
    },
    pageBgClass: 'bg-[#05120c]',
    containerBgStyle: {
      backgroundColor: '#0a2016',
      backgroundImage: 'linear-gradient(180deg, #0d271b 0%, #0a2016 100%)',
    },
    containerBorderColor: '#1b4d35',
    containerShadow: '0 25px 50px -12px rgba(5, 18, 12, 0.85)',
    textureOverlay: {
      type: 'botanical',
      style: {
        backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.14) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(52, 211, 153, 0.08) 0%, transparent 50%)',
        opacity: 0.9,
      },
    },
    cardBg: '#10291e',
    cardBorder: 'rgba(52, 211, 153, 0.18)',
    cardHoverBg: '#163628',
    cardShadow: '0 4px 14px -3px rgba(0, 0, 0, 0.35)',
    textPrimary: '#f0fdf4',
    textSecondary: '#a7f3d0',
    textMuted: '#6ee7b7',
    accentColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeTextCol: '#6ee7b7',
    heroTransitionGradient: 'linear-gradient(to top, #0a2016 0%, rgba(10,32,22,0.85) 55%, transparent 100%)',
  },

  // 3. Escuro Premium — preto/grafite elegante
  dark: {
    id: 'dark',
    name: 'Escuro Premium',
    subtitle: 'Preto e grafite elegante',
    description: 'Visual escuro de alto padrão com preto profundo, grafite fosco e detalhes contrastantes.',
    isDarkBase: true,
    badgeText: 'Mais Escolhido',
    preview: {
      bgGradient: 'linear-gradient(135deg, #070709 0%, #18181f 50%, #272732 100%)',
      cardBg: '#141419',
      cardBorder: '#272733',
      accentColor: '#8b5cf6',
      textColor: '#ffffff',
      secondaryAccent: '#a855f7',
    },
    colors: {
      pageBg: '#070709',
      cardBg: '#141419',
      primary: '#8b5cf6',
      secondary: '#a855f7',
      buttonBg: '#8b5cf6',
      buttonText: '#ffffff',
      priceColor: '#38bdf8',
      titleColor: '#ffffff',
      textColor: '#cbd5e1',
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    pageBgStyle: {
      backgroundColor: '#070709',
      backgroundImage: 'radial-gradient(circle at 50% 0%, #15151c 0%, #070709 100%)',
    },
    pageBgClass: 'bg-[#070709]',
    containerBgStyle: {
      backgroundColor: '#0d0d12',
    },
    containerBorderColor: 'rgba(255, 255, 255, 0.08)',
    containerShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
    textureOverlay: {
      type: 'mesh',
      style: {
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        opacity: 0.5,
      },
    },
    cardBg: '#141419',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardHoverBg: '#1a1a21',
    cardShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.4)',
    textPrimary: '#ffffff',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    accentColor: '#8b5cf6',
    badgeBg: 'rgba(255, 255, 255, 0.08)',
    badgeTextCol: '#e2e8f0',
    heroTransitionGradient: 'linear-gradient(to top, #0d0d12 0%, rgba(13,13,18,0.85) 55%, transparent 100%)',
  },

  // 4. Rústico — madeira e tons quentes
  rustic: {
    id: 'rustic',
    name: 'Rústico',
    subtitle: 'Madeira e tons quentes',
    description: 'Clima aconchegante e artesanal com tons quentes de café, canela, madeira e detalhes dourados.',
    isDarkBase: true,
    badgeText: 'Artesanal',
    preview: {
      bgGradient: 'linear-gradient(135deg, #160c07 0%, #2f190e 50%, #d97706 100%)',
      cardBg: '#27170e',
      cardBorder: '#4a2d1b',
      accentColor: '#f59e0b',
      textColor: '#fffbeb',
      secondaryAccent: '#ea580c',
    },
    colors: {
      pageBg: '#120904',
      cardBg: '#27170e',
      primary: '#f59e0b',
      secondary: '#ea580c',
      buttonBg: '#d97706',
      buttonText: '#ffffff',
      priceColor: '#fbbf24',
      titleColor: '#fffbeb',
      textColor: '#fed7aa',
      borderColor: 'rgba(245, 158, 11, 0.22)',
    },
    pageBgStyle: {
      backgroundColor: '#120904',
      backgroundImage: 'radial-gradient(circle at 50% 0%, #2d170d 0%, #120904 100%)',
    },
    pageBgClass: 'bg-[#120904]',
    containerBgStyle: {
      backgroundColor: '#1c1008',
      backgroundImage: 'linear-gradient(180deg, #23140b 0%, #1c1008 100%)',
    },
    containerBorderColor: '#422818',
    containerShadow: '0 25px 50px -12px rgba(18, 9, 4, 0.9)',
    textureOverlay: {
      type: 'wood',
      style: {
        backgroundImage: 'radial-gradient(circle at 90% 15%, rgba(245, 158, 11, 0.1) 0%, transparent 60%), radial-gradient(circle at 10% 85%, rgba(234, 88, 12, 0.08) 0%, transparent 50%)',
        opacity: 0.85,
      },
    },
    cardBg: '#27170e',
    cardBorder: 'rgba(245, 158, 11, 0.22)',
    cardHoverBg: '#331e12',
    cardShadow: '0 4px 14px -3px rgba(0, 0, 0, 0.45)',
    textPrimary: '#fffbeb',
    textSecondary: '#fed7aa',
    textMuted: '#d6b08d',
    accentColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.18)',
    badgeTextCol: '#fef3c7',
    heroTransitionGradient: 'linear-gradient(to top, #1c1008 0%, rgba(28,16,8,0.85) 55%, transparent 100%)',
  },

  // 5. Dourado Luxo — preto com detalhes dourados
  'gold-luxury': {
    id: 'gold-luxury',
    name: 'Dourado Luxo',
    subtitle: 'Preto com detalhes dourados',
    description: 'Preto acetinado luxuoso com bordas refinadas em ouro champanhe, brilho suave e aura VIP.',
    isDarkBase: true,
    badgeText: 'Premium VIP',
    preview: {
      bgGradient: 'linear-gradient(135deg, #0a0a0c 0%, #1a1710 50%, #d4af37 100%)',
      cardBg: '#17161c',
      cardBorder: '#d4af37',
      accentColor: '#d4af37',
      textColor: '#ffffff',
      secondaryAccent: '#f59e0b',
    },
    colors: {
      pageBg: '#08080a',
      cardBg: '#16161c',
      primary: '#d4af37',
      secondary: '#f59e0b',
      buttonBg: '#d4af37',
      buttonText: '#000000',
      priceColor: '#fef08a',
      titleColor: '#ffffff',
      textColor: '#e4d8b4',
      borderColor: 'rgba(212, 175, 55, 0.28)',
    },
    pageBgStyle: {
      backgroundColor: '#08080a',
      backgroundImage: 'radial-gradient(circle at 50% 0%, #241f12 0%, #08080a 100%)',
    },
    pageBgClass: 'bg-[#08080a]',
    containerBgStyle: {
      backgroundColor: '#0f0f13',
    },
    containerBorderColor: 'rgba(212, 175, 55, 0.35)',
    containerShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 25px -5px rgba(212, 175, 55, 0.15)',
    textureOverlay: {
      type: 'luxury',
      style: {
        backgroundImage: 'radial-gradient(circle at 25% 20%, rgba(212, 175, 55, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 60%)',
        opacity: 0.9,
      },
    },
    cardBg: '#16161c',
    cardBorder: 'rgba(212, 175, 55, 0.25)',
    cardHoverBg: '#1f1e26',
    cardShadow: '0 4px 14px -3px rgba(0, 0, 0, 0.5)',
    textPrimary: '#ffffff',
    textSecondary: '#e4d8b4',
    textMuted: '#c5b58d',
    accentColor: '#d4af37',
    badgeBg: 'rgba(212, 175, 55, 0.18)',
    badgeTextCol: '#fef08a',
    heroTransitionGradient: 'linear-gradient(to top, #0f0f13 0%, rgba(15,15,19,0.85) 55%, transparent 100%)',
  },

  // 6. Azul Profissional — azul profundo moderno
  'professional-blue': {
    id: 'professional-blue',
    name: 'Azul Profissional',
    subtitle: 'Azul profundo moderno',
    description: 'Tons modernos de azul petróleo, safira e marinho profundo, transmitindo confiança e tecnologia.',
    isDarkBase: true,
    badgeText: 'Corporativo',
    preview: {
      bgGradient: 'linear-gradient(135deg, #050c18 0%, #0d2242 50%, #3b82f6 100%)',
      cardBg: '#0f2038',
      cardBorder: '#1e3d68',
      accentColor: '#3b82f6',
      textColor: '#ffffff',
      secondaryAccent: '#60a5fa',
    },
    colors: {
      pageBg: '#050a14',
      cardBg: '#10223d',
      primary: '#3b82f6',
      secondary: '#60a5fa',
      buttonBg: '#2563eb',
      buttonText: '#ffffff',
      priceColor: '#38bdf8',
      titleColor: '#ffffff',
      textColor: '#bfdbfe',
      borderColor: 'rgba(59, 130, 246, 0.22)',
    },
    pageBgStyle: {
      backgroundColor: '#050a14',
      backgroundImage: 'radial-gradient(circle at 50% 0%, #0d2144 0%, #050a14 100%)',
    },
    pageBgClass: 'bg-[#050a14]',
    containerBgStyle: {
      backgroundColor: '#0a1628',
      backgroundImage: 'linear-gradient(180deg, #0d1c33 0%, #0a1628 100%)',
    },
    containerBorderColor: '#1e3860',
    containerShadow: '0 25px 50px -12px rgba(5, 10, 20, 0.9)',
    textureOverlay: {
      type: 'mesh',
      style: {
        backgroundImage: 'radial-gradient(circle at 80% 10%, rgba(59, 130, 246, 0.14) 0%, transparent 60%), radial-gradient(circle at 10% 90%, rgba(96, 165, 250, 0.08) 0%, transparent 50%)',
        opacity: 0.85,
      },
    },
    cardBg: '#10223d',
    cardBorder: 'rgba(59, 130, 246, 0.22)',
    cardHoverBg: '#172e52',
    cardShadow: '0 4px 14px -3px rgba(0, 0, 0, 0.4)',
    textPrimary: '#ffffff',
    textSecondary: '#bfdbfe',
    textMuted: '#93c5fd',
    accentColor: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.18)',
    badgeTextCol: '#93c5fd',
    heroTransitionGradient: 'linear-gradient(to top, #0a1628 0%, rgba(10,22,40,0.85) 55%, transparent 100%)',
  },

  // 7. Rosa Elegante — rosé/nude sofisticado
  'elegant-rose': {
    id: 'elegant-rose',
    name: 'Rosa Elegante',
    subtitle: 'Rosé e nude sofisticado',
    description: 'Estética feminina e sofisticada em tons rosé suave, nude aveludado e detalhes rubi/champanhe.',
    isDarkBase: false,
    badgeText: 'Sofisticado',
    preview: {
      bgGradient: 'linear-gradient(135deg, #fff1f2 0%, #fce7f3 50%, #f43f5e 100%)',
      cardBg: '#ffffff',
      cardBorder: '#fbcfe8',
      accentColor: '#e11d48',
      textColor: '#4c0519',
      secondaryAccent: '#f43f5e',
    },
    colors: {
      pageBg: '#fdf2f4',
      cardBg: '#ffffff',
      primary: '#e11d48',
      secondary: '#f43f5e',
      buttonBg: '#e11d48',
      buttonText: '#ffffff',
      priceColor: '#be185d',
      titleColor: '#4c0519',
      textColor: '#881337',
      borderColor: '#f9dce2',
    },
    pageBgStyle: {
      backgroundColor: '#fdf2f4',
      backgroundImage: 'radial-gradient(circle at 50% 0%, #ffe4e8 0%, #fdf2f4 100%)',
    },
    pageBgClass: 'bg-[#fdf2f4]',
    containerBgStyle: {
      backgroundColor: '#ffffff',
      backgroundImage: 'linear-gradient(180deg, #fff5f7 0%, #ffffff 100%)',
    },
    containerBorderColor: '#f7d0d7',
    containerShadow: '0 25px 50px -12px rgba(225, 29, 72, 0.12)',
    textureOverlay: {
      type: 'glow',
      style: {
        backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(244, 63, 94, 0.08) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(251, 113, 133, 0.08) 0%, transparent 50%)',
        opacity: 0.85,
      },
    },
    cardBg: '#ffffff',
    cardBorder: '#f9dce2',
    cardHoverBg: '#fff5f7',
    cardShadow: '0 2px 10px -2px rgba(225, 29, 72, 0.08)',
    textPrimary: '#4c0519',
    textSecondary: '#881337',
    textMuted: '#9f1239',
    accentColor: '#e11d48',
    badgeBg: '#ffe4e8',
    badgeTextCol: '#9f1239',
    heroTransitionGradient: 'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0.85) 55%, transparent 100%)',
  },

  // 8. Terra — bege, marrom e tons naturais
  earth: {
    id: 'earth',
    name: 'Terra',
    subtitle: 'Bege, marrom e tons naturais',
    description: 'Paleta terrosa e orgânica em tons de areia quente, terracota suave, linho e argila natural.',
    isDarkBase: false,
    badgeText: 'Aconchego',
    preview: {
      bgGradient: 'linear-gradient(135deg, #f5efe6 0%, #e8dfd3 50%, #c2593f 100%)',
      cardBg: '#faf7f2',
      cardBorder: '#dfd3c4',
      accentColor: '#c2593f',
      textColor: '#291e17',
      secondaryAccent: '#92400e',
    },
    colors: {
      pageBg: '#f3ece3',
      cardBg: '#ffffff',
      primary: '#c2593f',
      secondary: '#92400e',
      buttonBg: '#c2593f',
      buttonText: '#ffffff',
      priceColor: '#9a3412',
      titleColor: '#291e17',
      textColor: '#5a4639',
      borderColor: '#ebdcd0',
    },
    pageBgStyle: {
      backgroundColor: '#f3ece3',
      backgroundImage: 'radial-gradient(circle at 50% 0%, #faf6f0 0%, #ede3d7 100%)',
    },
    pageBgClass: 'bg-[#f3ece3]',
    containerBgStyle: {
      backgroundColor: '#faf7f2',
    },
    containerBorderColor: '#dfd2c3',
    containerShadow: '0 25px 50px -12px rgba(67, 44, 30, 0.12)',
    textureOverlay: {
      type: 'mesh',
      style: {
        backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(194, 89, 63, 0.08) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(146, 64, 14, 0.06) 0%, transparent 50%)',
        opacity: 0.8,
      },
    },
    cardBg: '#ffffff',
    cardBorder: '#ebdcd0',
    cardHoverBg: '#f7f2eb',
    cardShadow: '0 2px 8px -2px rgba(67, 44, 30, 0.06)',
    textPrimary: '#291e17',
    textSecondary: '#5a4639',
    textMuted: '#786253',
    accentColor: '#c2593f',
    badgeBg: '#f3ece3',
    badgeTextCol: '#78350f',
    heroTransitionGradient: 'linear-gradient(to top, #faf7f2 0%, rgba(250,247,242,0.85) 55%, transparent 100%)',
  },

  // 9. Vibrante — gradiente moderno
  vibrant: {
    id: 'vibrant',
    name: 'Vibrante',
    subtitle: 'Gradiente moderno',
    description: 'Energia e dinamismo com gradientes ultra modernos em tons violeta, magenta e neon vibrante.',
    isDarkBase: true,
    badgeText: 'Impacto',
    preview: {
      bgGradient: 'linear-gradient(135deg, #4c1d95 0%, #c026d3 50%, #f43f5e 100%)',
      cardBg: '#1f0d38',
      cardBorder: '#5b21b6',
      accentColor: '#e879f9',
      textColor: '#ffffff',
      secondaryAccent: '#fb7185',
    },
    colors: {
      pageBg: '#0b0214',
      cardBg: '#1e0a35',
      primary: '#e879f9',
      secondary: '#fb7185',
      buttonBg: '#c026d3',
      buttonText: '#ffffff',
      priceColor: '#38bdf8',
      titleColor: '#ffffff',
      textColor: '#e9d5ff',
      borderColor: 'rgba(168, 85, 247, 0.26)',
    },
    pageBgStyle: {
      backgroundColor: '#0b0214',
      backgroundImage: 'radial-gradient(at 0% 0%, #4c1d95 0%, transparent 50%), radial-gradient(at 100% 100%, #be185d 0%, #0b0214 70%)',
    },
    pageBgClass: 'bg-[#0b0214]',
    containerBgStyle: {
      backgroundColor: '#140624',
      backgroundImage: 'linear-gradient(180deg, #1c0833 0%, #140624 100%)',
    },
    containerBorderColor: '#581c87',
    containerShadow: '0 25px 50px -12px rgba(76, 29, 149, 0.5), 0 0 25px -5px rgba(236, 72, 153, 0.25)',
    textureOverlay: {
      type: 'glow',
      style: {
        backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.16) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.14) 0%, transparent 50%)',
        opacity: 0.95,
      },
    },
    cardBg: '#1e0a35',
    cardBorder: 'rgba(168, 85, 247, 0.26)',
    cardHoverBg: '#270e45',
    cardShadow: '0 4px 16px -3px rgba(0, 0, 0, 0.5)',
    textPrimary: '#ffffff',
    textSecondary: '#e9d5ff',
    textMuted: '#c084fc',
    accentColor: '#e879f9',
    badgeBg: 'rgba(168, 85, 247, 0.2)',
    badgeTextCol: '#f0abfc',
    heroTransitionGradient: 'linear-gradient(to top, #140624 0%, rgba(20,6,36,0.85) 55%, transparent 100%)',
  },

  // 10. Personalizado — escolher cores e imagem de fundo
  custom: {
    id: 'custom',
    name: 'Personalizado',
    subtitle: 'Escolher cores e imagem de fundo',
    description: 'Crie a atmosfera única da sua marca escolhendo a cor ou imagem de fundo, cor dos cards e destaque.',
    isDarkBase: true,
    badgeText: 'Total Liberdade',
    preview: {
      bgGradient: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #4338ca 100%)',
      cardBg: '#181822',
      cardBorder: '#3730a3',
      accentColor: '#6366f1',
      textColor: '#ffffff',
      secondaryAccent: '#818cf8',
    },
    colors: {
      pageBg: '#09090b',
      cardBg: '#181822',
      primary: '#6366f1',
      secondary: '#818cf8',
      buttonBg: '#6366f1',
      buttonText: '#ffffff',
      priceColor: '#10b981',
      titleColor: '#ffffff',
      textColor: '#cbd5e1',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    pageBgStyle: {
      backgroundColor: '#09090b',
    },
    pageBgClass: 'bg-neutral-950',
    containerBgStyle: {
      backgroundColor: '#111116',
    },
    containerBorderColor: 'rgba(255, 255, 255, 0.12)',
    containerShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
    cardBg: '#181822',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    cardHoverBg: '#22222e',
    textPrimary: '#ffffff',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    accentColor: '#6366f1',
    badgeBg: 'rgba(255, 255, 255, 0.1)',
    badgeTextCol: '#ffffff',
    heroTransitionGradient: 'linear-gradient(to top, #111116 0%, rgba(17,17,22,0.85) 55%, transparent 100%)',
  },

  // 11. Preto Absoluto — preto puro (#000000), moderno e sofisticado
  'absolute-black': {
    id: 'absolute-black',
    name: 'Preto Absoluto',
    subtitle: 'Preto puro, moderno e sofisticado',
    description: 'Preto absoluto (#000000) ultra sofisticado, com superfícies em preto puro, cartões em #080808 e contrastes perfeitos.',
    isDarkBase: true,
    badgeText: 'Preto Puro',
    preview: {
      bgGradient: '#000000',
      cardBg: '#080808',
      cardBorder: '#202020',
      accentColor: '#ffffff',
      textColor: '#ffffff',
      secondaryAccent: '#bdbdbd',
    },
    colors: {
      pageBg: '#000000',
      cardBg: '#080808',
      primary: '#ffffff',
      secondary: '#bdbdbd',
      buttonBg: '#ffffff',
      buttonText: '#000000',
      priceColor: '#22c55e',
      titleColor: '#ffffff',
      textColor: '#bdbdbd',
      borderColor: '#202020',
    },
    pageBgStyle: {
      backgroundColor: '#000000',
    },
    pageBgClass: 'bg-black',
    containerBgStyle: {
      backgroundColor: '#000000',
    },
    containerBorderColor: '#202020',
    containerShadow: '0 25px 50px -12px rgba(0, 0, 0, 1)',
    cardBg: '#080808',
    cardBorder: '#202020',
    cardHoverBg: '#121212',
    cardShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.95)',
    textPrimary: '#ffffff',
    textSecondary: '#bdbdbd',
    textMuted: '#8a8a8a',
    accentColor: '#ffffff',
    badgeBg: '#141414',
    badgeTextCol: '#ffffff',
    heroTransitionGradient: 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.85) 55%, transparent 100%)',
    secondaryBg: '#050505',
    modalBg: '#050505',
    fixedAreaBg: '#000000',
  },
}

export const PUBLIC_THEME_LIST: PublicThemeDefinition[] = [
  PRESET_THEMES.clean,
  PRESET_THEMES['natural-green'],
  PRESET_THEMES.dark,
  PRESET_THEMES.rustic,
  PRESET_THEMES['gold-luxury'],
  PRESET_THEMES['professional-blue'],
  PRESET_THEMES['elegant-rose'],
  PRESET_THEMES.earth,
  PRESET_THEMES.vibrant,
  PRESET_THEMES.custom,
  PRESET_THEMES['absolute-black'],
]

/**
 * Resolves full theme definition with automatic contrast guarantee and individual custom overrides.
 */
export function getPublicTheme(
  themeId?: string,
  customConfig?: CustomThemeConfig,
  themeColors?: AdvancedColorsConfig
): PublicThemeDefinition {
  // Normalize alias
  let cleanId: string = (themeId || 'dark').toLowerCase().trim()
  if (cleanId === 'light') cleanId = 'clean'
  if (cleanId === 'preto-absoluto' || cleanId === 'black' || cleanId === 'preto') {
    cleanId = 'absolute-black'
  }

  const base = PRESET_THEMES[cleanId] || PRESET_THEMES.dark

  // 1. Initial color tokens derived from the base theme
  let pageBg = base.colors.pageBg
  let cardBg = base.colors.cardBg
  let primary = base.colors.primary
  let secondary = base.colors.secondary
  let buttonBg = base.colors.buttonBg
  let priceColor = base.colors.priceColor
  let titleColor = base.colors.titleColor
  let textColor = base.colors.textColor
  let borderColor = base.colors.borderColor

  // Handle 'custom' theme base overrides if defined in customThemeConfig
  if (cleanId === 'custom' && customConfig) {
    if (customConfig.bgColor) pageBg = customConfig.bgColor
    if (customConfig.cardBgColor) cardBg = customConfig.cardBgColor
    if (customConfig.accentColor) {
      primary = customConfig.accentColor
      secondary = customConfig.accentColor
      buttonBg = customConfig.accentColor
    }
  }

  // 2. Individual overrides from "Cores avançadas" (themeColors)
  if (themeColors) {
    if (themeColors.pageBg) pageBg = sanitizeHex(themeColors.pageBg, pageBg)
    if (themeColors.cardBg) cardBg = sanitizeHex(themeColors.cardBg, cardBg)
    if (themeColors.primary) primary = sanitizeHex(themeColors.primary, primary)
    if (themeColors.secondary) secondary = sanitizeHex(themeColors.secondary, secondary)
    if (themeColors.buttonBg) buttonBg = sanitizeHex(themeColors.buttonBg, buttonBg)
    if (themeColors.priceColor) priceColor = sanitizeHex(themeColors.priceColor, priceColor)
    if (themeColors.titleColor) titleColor = sanitizeHex(themeColors.titleColor, titleColor)
    if (themeColors.textColor) textColor = sanitizeHex(themeColors.textColor, textColor)
    if (themeColors.borderColor) borderColor = sanitizeHex(themeColors.borderColor, borderColor)
  }

  // 3. Contrast calculation
  // Calculate button text automatically to guarantee contrast
  const buttonText = getContrastTextColor(buttonBg)

  // Determine dark or light mode base from card background and page background
  const isDark = isColorDark(cardBg) || isColorDark(pageBg)
  const isAbsoluteBlack = cleanId === 'absolute-black' || base.id === 'absolute-black'

  const resolvedColors: ResolvedThemeColors = {
    pageBg,
    cardBg,
    primary,
    secondary,
    buttonBg,
    buttonText,
    priceColor,
    titleColor,
    textColor,
    borderColor,
  }

  // Page background style
  let pageBgStyle: React.CSSProperties = {
    backgroundColor: pageBg,
  }

  let textureOverlay = base.textureOverlay

  // If custom theme with image or gradient
  if (cleanId === 'custom' && customConfig) {
    if (customConfig.bgType === 'gradient' && customConfig.bgGradient) {
      pageBgStyle = {
        background: customConfig.bgGradient,
      }
    } else if (customConfig.bgType === 'image' && customConfig.bgImageUrl) {
      pageBgStyle = {
        backgroundImage: `url(${customConfig.bgImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundColor: pageBg,
      }
      if (customConfig.bgImageBlur || customConfig.bgImageOpacity !== undefined) {
        textureOverlay = {
          type: 'image-filter',
          style: {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.45)',
            backdropFilter: customConfig.bgImageBlur ? `blur(${customConfig.bgImageBlur}px)` : undefined,
          },
        }
      }
    }
  }

  const containerBg = isAbsoluteBlack ? '#000000' : (isDark ? '#0d0d14' : '#ffffff')
  const containerBorderColor = isAbsoluteBlack
    ? (themeColors?.borderColor || '#202020')
    : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)')

  return {
    ...base,
    isDarkBase: isDark,
    colors: resolvedColors,
    preview: {
      bgGradient:
        isAbsoluteBlack && (!themeColors?.pageBg || themeColors.pageBg === '#000000')
          ? '#000000'
          : `linear-gradient(135deg, ${pageBg} 0%, ${primary} 100%)`,
      cardBg,
      cardBorder: borderColor,
      accentColor: primary,
      textColor: titleColor,
      secondaryAccent: secondary,
    },
    pageBgStyle:
      isAbsoluteBlack && (!themeColors?.pageBg || themeColors.pageBg === '#000000')
        ? { backgroundColor: '#000000' }
        : pageBgStyle,
    pageBgClass: isAbsoluteBlack ? 'bg-black' : base.pageBgClass,
    containerBgStyle: {
      backgroundColor: containerBg,
    },
    containerBorderColor,
    containerShadow: isAbsoluteBlack
      ? '0 25px 50px -12px rgba(0, 0, 0, 1)'
      : isDark
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.95)'
      : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    textureOverlay: isAbsoluteBlack ? undefined : textureOverlay,
    cardBg,
    cardBorder: borderColor,
    cardHoverBg: isAbsoluteBlack ? '#121212' : (isDark ? '#1d1d28' : '#f8fafc'),
    textPrimary: titleColor,
    textSecondary: textColor,
    textMuted: isAbsoluteBlack ? '#8a8a8a' : (isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'),
    accentColor: primary,
    badgeBg: isAbsoluteBlack ? '#141414' : hexToRgba(primary, 0.15),
    badgeTextCol: isAbsoluteBlack ? '#ffffff' : primary,
    heroTransitionGradient: isAbsoluteBlack
      ? 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.85) 55%, transparent 100%)'
      : `linear-gradient(to top, ${containerBg} 0%, ${hexToRgba(containerBg, 0.85)} 55%, transparent 100%)`,
    secondaryBg: isAbsoluteBlack ? '#050505' : (isDark ? '#0f0f14' : '#f8fafc'),
    modalBg: isAbsoluteBlack ? '#050505' : (isDark ? '#121217' : '#ffffff'),
    fixedAreaBg: isAbsoluteBlack ? '#000000' : (isDark ? '#0f0f14' : '#ffffff'),
  }
}
