'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import {
  Sparkles,
  Check,
  Save,
  Palette,
  Eye,
  Sliders,
  Image as ImageIcon,
  Sun,
  Moon,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Tag,
  ShoppingBag,
  MessageCircle,
  HelpCircle,
} from 'lucide-react'
import {
  Company,
  CustomThemeConfig,
  PublicPageThemeId,
  AdvancedColorsConfig,
} from '@/types/platform'
import {
  PUBLIC_THEME_LIST,
  PRESET_THEMES,
  getPublicTheme,
  isColorDark,
  PublicThemeDefinition,
} from '@/lib/public-themes'
import { sanitizeHex, hexToRgba, getContrastTextColor } from '@/lib/colors'

interface PageThemeSelectorProps {
  company: Company
  formData: Company
  setFormData: React.Dispatch<React.SetStateAction<Company>>
  isSaving: boolean
  onSaveTheme: () => Promise<void>
}

interface ColorControlItem {
  key: keyof AdvancedColorsConfig
  label: string
  subtitle: string
  hint: string
}

const COLOR_CONTROL_LIST: ColorControlItem[] = [
  {
    key: 'pageBg',
    label: 'Fundo da página',
    subtitle: 'Cor do plano de fundo geral',
    hint: 'Atrás do container e cards',
  },
  {
    key: 'cardBg',
    label: 'Fundo dos cards',
    subtitle: 'Superfície dos módulos e cartões',
    hint: 'Cards de serviços, produtos e links',
  },
  {
    key: 'primary',
    label: 'Cor principal',
    subtitle: 'Identidade e destaques primários',
    hint: 'Badges de status, realces e ícones',
  },
  {
    key: 'secondary',
    label: 'Cor secundária',
    subtitle: 'Elementos complementares e acentos',
    hint: 'Harmonização visual de apoio',
  },
  {
    key: 'buttonBg',
    label: 'Cor dos botões',
    subtitle: 'Fundo dos botões de ação',
    hint: 'Contraste do texto calculado automaticamente',
  },
  {
    key: 'priceColor',
    label: 'Cor dos preços',
    subtitle: 'Valores monetários (substitui vermelho fixo)',
    hint: 'Preços de produtos, serviços e cardápio',
  },
  {
    key: 'titleColor',
    label: 'Cor dos títulos',
    subtitle: 'Tipografia de títulos e cabeçalhos',
    hint: 'Nome da loja e títulos dos módulos',
  },
  {
    key: 'textColor',
    label: 'Cor dos textos',
    subtitle: 'Subtítulos, descrições e parágrafos',
    hint: 'Informações secundárias e descritivas',
  },
  {
    key: 'borderColor',
    label: 'Cor das bordas/detalhes',
    subtitle: 'Linhas divisórias e contornos dos cards',
    hint: 'Acabamentos e separadores visuais',
  },
]

export const PageThemeSelector: React.FC<PageThemeSelectorProps> = ({
  company,
  formData,
  setFormData,
  isSaving,
  onSaveTheme,
}) => {
  const currentThemeId = (formData.theme || 'dark') as PublicPageThemeId
  const customConfig = useMemo(
    () => formData.customThemeConfig || {},
    [formData.customThemeConfig]
  )
  const currentThemeColors = useMemo(
    () => formData.themeColors,
    [formData.themeColors]
  )

  // Resolve current active theme definition for live preview
  const resolvedActiveTheme = useMemo(() => {
    return getPublicTheme(currentThemeId, customConfig, currentThemeColors)
  }, [currentThemeId, customConfig, currentThemeColors])

  // Customizer tab for 'custom' theme background mode
  const [customBgTab, setCustomBgTab] = useState<'color' | 'gradient' | 'image'>(
    customConfig.bgType || 'color'
  )

  // Accordion state for Cores Avançadas (open by default so the user immediately sees it)
  const [isAdvancedColorsOpen, setIsAdvancedColorsOpen] = useState(true)

  // When selecting a preset theme, load its default colors as the baseline
  const handleSelectTheme = useCallback(
    (themeId: PublicPageThemeId) => {
      const preset = PRESET_THEMES[themeId] || PRESET_THEMES.dark
      setFormData((prev) => ({
        ...prev,
        theme: themeId,
        themeColors: {
          pageBg: preset.colors.pageBg,
          cardBg: preset.colors.cardBg,
          primary: preset.colors.primary,
          secondary: preset.colors.secondary,
          buttonBg: preset.colors.buttonBg,
          priceColor: preset.colors.priceColor,
          titleColor: preset.colors.titleColor,
          textColor: preset.colors.textColor,
          borderColor: preset.colors.borderColor,
        },
        primaryColor: preset.colors.primary,
        secondaryColor: preset.colors.secondary,
      }))
    },
    [setFormData]
  )

  // Update a single individual color in themeColors
  const updateIndividualColor = useCallback(
    (key: keyof AdvancedColorsConfig, value: string) => {
      setFormData((prev) => {
        const baseTheme = getPublicTheme(prev.theme || 'dark', prev.customThemeConfig)
        const currentColors: AdvancedColorsConfig = prev.themeColors || {
          pageBg: baseTheme.colors.pageBg,
          cardBg: baseTheme.colors.cardBg,
          primary: baseTheme.colors.primary,
          secondary: baseTheme.colors.secondary,
          buttonBg: baseTheme.colors.buttonBg,
          priceColor: baseTheme.colors.priceColor,
          titleColor: baseTheme.colors.titleColor,
          textColor: baseTheme.colors.textColor,
          borderColor: baseTheme.colors.borderColor,
        }

        const nextThemeColors: AdvancedColorsConfig = {
          ...currentColors,
          [key]: value,
        }

        const partialUpdate: Partial<Company> = {
          themeColors: nextThemeColors,
        }

        if (key === 'primary') {
          partialUpdate.primaryColor = value
        }
        if (key === 'secondary') {
          partialUpdate.secondaryColor = value
        }

        return {
          ...prev,
          ...partialUpdate,
        }
      })
    },
    [setFormData]
  )

  // Reset all 9 colors to the default preset colors of the active theme
  const handleResetToThemeDefaults = useCallback(() => {
    const preset = PRESET_THEMES[currentThemeId] || PRESET_THEMES.dark
    setFormData((prev) => ({
      ...prev,
      themeColors: {
        pageBg: preset.colors.pageBg,
        cardBg: preset.colors.cardBg,
        primary: preset.colors.primary,
        secondary: preset.colors.secondary,
        buttonBg: preset.colors.buttonBg,
        priceColor: preset.colors.priceColor,
        titleColor: preset.colors.titleColor,
        textColor: preset.colors.textColor,
        borderColor: preset.colors.borderColor,
      },
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
    }))
  }, [currentThemeId, setFormData])

  // Customizer helper for 'custom' theme background
  const updateCustomConfig = useCallback(
    (partial: Partial<CustomThemeConfig>) => {
      setFormData((prev) => {
        const nextCustom: CustomThemeConfig = {
          ...(prev.customThemeConfig || {}),
          ...partial,
        }
        if (partial.bgColor && partial.isDarkBase === undefined) {
          nextCustom.isDarkBase = isColorDark(partial.bgColor)
        }
        return {
          ...prev,
          theme: 'custom',
          customThemeConfig: nextCustom,
        }
      })
    },
    [setFormData]
  )

  // Gradient presets for custom theme
  const GRADIENT_PRESETS = [
    {
      id: 'violet-night',
      label: 'Violet Night',
      value: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #4c0519 100%)',
    },
    {
      id: 'aurora-emerald',
      label: 'Aurora Esmeralda',
      value: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f766e 100%)',
    },
    {
      id: 'sapphire-depths',
      label: 'Abismo Safira',
      value: 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #1e3a8a 100%)',
    },
    {
      id: 'golden-noir',
      label: 'Golden Noir',
      value: 'linear-gradient(135deg, #09090b 0%, #1c1917 50%, #78350f 100%)',
    },
    {
      id: 'warm-cashmere',
      label: 'Cashmere Nude',
      value: 'linear-gradient(135deg, #faf5f5 0%, #fdf2f4 50%, #fce7f3 100%)',
    },
    {
      id: 'cyber-sunset',
      label: 'Pôr do Sol Neon',
      value: 'linear-gradient(135deg, #4c1d95 0%, #be185d 50%, #f97316 100%)',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header com Status do Tema */}
      <div className="p-5 rounded-2xl bg-neutral-950 text-white shadow-md border border-neutral-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <label className="text-xs font-black text-white uppercase tracking-wider">
                TEMA DA PÁGINA PÚBLICA
              </label>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Escolha entre 10 atmosferas visuais com design profissional. Todas as cores podem ser ajustadas individualmente abaixo.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
              Salvo por Empresa ({company.name})
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Contraste Automático
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* GRID DE 10 TEMAS VISUAIS COM MINIATURA DE PRÉVIA */}
        {/* ======================================================== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300">10 Temas Prontos (carregam cores padrão):</span>
            <span className="text-[11px] text-neutral-500">Toque em qualquer tema para carregar</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {PUBLIC_THEME_LIST.map((theme, index) => {
              const isSelected =
                currentThemeId === theme.id ||
                (theme.id === 'clean' && currentThemeId === 'light') ||
                (theme.id === 'dark' && !formData.theme)

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`relative rounded-2xl p-3 border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 group overflow-hidden ${
                    isSelected
                      ? 'border-amber-400 bg-neutral-900 ring-2 ring-amber-400/30 shadow-lg scale-[1.01]'
                      : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  {/* Miniatura de Prévia do Tema */}
                  <div
                    className="w-full h-20 rounded-xl relative overflow-hidden border p-2 flex flex-col justify-between shadow-inner"
                    style={{
                      background: theme.preview.bgGradient,
                      borderColor: isSelected ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-xs">
                        #{index + 1}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-md">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Mini Cartão Simulado dentro da Prévia */}
                    <div
                      className="w-full rounded-lg p-1.5 border flex items-center justify-between text-[8px] font-bold shadow-xs z-10"
                      style={{
                        backgroundColor: theme.preview.cardBg,
                        borderColor: theme.preview.cardBorder,
                        color: theme.preview.textColor,
                      }}
                    >
                      <span className="truncate max-w-[65px]">Módulo</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: theme.preview.accentColor }}
                      />
                    </div>
                  </div>

                  {/* Nome e Descrição do Tema */}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">
                        {theme.name}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold shrink-0 ${
                          theme.isDarkBase
                            ? 'bg-neutral-800 text-neutral-300'
                            : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {theme.isDarkBase ? 'Escuro' : 'Claro'}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 line-clamp-1">
                      {theme.subtitle}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SEÇÃO: CORES AVANÇADAS (PERSONALIZAÇÃO INDIVIDUAL)       */}
        {/* ======================================================== */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 overflow-hidden transition-all">
          {/* Header do Accordion de Cores Avançadas */}
          <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 bg-neutral-900">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/25 shrink-0">
                <Palette className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Aparência da Página &gt; Cores avançadas
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Personalização Individual
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Personalize cada elemento individualmente. Os 10 temas continuam existindo e carregam cores padrão, mas você pode alterar qualquer cor aqui.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleResetToThemeDefaults}
                title="Restaura as cores padrão do tema ativo"
                className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 border border-neutral-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-neutral-400" />
                <span>Restaurar Padrão do Tema</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAdvancedColorsOpen((v) => !v)}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title={isAdvancedColorsOpen ? 'Recolher seção' : 'Expandir seção'}
                aria-label={isAdvancedColorsOpen ? 'Recolher seção' : 'Expandir seção'}
              >
                {isAdvancedColorsOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Conteúdo com os 9 Seletores Individuais de Cor */}
          {isAdvancedColorsOpen && (
            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {COLOR_CONTROL_LIST.map((ctrl) => {
                  const resolvedColor =
                    resolvedActiveTheme.colors[ctrl.key] || '#000000'
                  const isButton = ctrl.key === 'buttonBg'
                  const isPrice = ctrl.key === 'priceColor'
                  const isTitle = ctrl.key === 'titleColor'
                  const isText = ctrl.key === 'textColor'
                  const isBorder = ctrl.key === 'borderColor'

                  return (
                    <div
                      key={ctrl.key}
                      className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/90 hover:border-neutral-700 transition-all flex flex-col justify-between gap-3 shadow-xs"
                    >
                      {/* Top: Rótulo e Descrição */}
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          <label className="text-xs font-bold text-white tracking-tight">
                            {ctrl.label}
                          </label>

                          {/* Badge de contexto visual */}
                          {isButton && (
                            <span
                              className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md"
                              style={{
                                backgroundColor: resolvedColor,
                                color: resolvedActiveTheme.colors.buttonText,
                                border: '1px solid rgba(255,255,255,0.2)',
                              }}
                            >
                              Texto: {resolvedActiveTheme.colors.buttonText === '#ffffff' ? 'Branco' : 'Preto'}
                            </span>
                          )}

                          {isPrice && (
                            <span
                              className="text-[10px] font-black font-mono px-1.5 py-0.2 rounded-md bg-neutral-900 border border-neutral-700"
                              style={{ color: resolvedColor }}
                            >
                              R$ 49,90
                            </span>
                          )}

                          {isTitle && (
                            <span
                              className="text-[10px] font-black tracking-tight"
                              style={{ color: resolvedColor }}
                            >
                              Título Exemplo
                            </span>
                          )}

                          {isText && (
                            <span
                              className="text-[10px] font-medium"
                              style={{ color: resolvedColor }}
                            >
                              Texto padrão
                            </span>
                          )}

                          {isBorder && (
                            <span
                              className="w-5 h-3.5 rounded-sm border-2 bg-neutral-900"
                              style={{ borderColor: resolvedColor }}
                            />
                          )}
                        </div>

                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {ctrl.subtitle}
                        </p>
                      </div>

                      {/* Bottom: Seletor de cor personalizado com Preview Swatch e Input Hex */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-900">
                        <span className="text-[10px] text-neutral-500 truncate max-w-[120px]">
                          {ctrl.hint}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Amostra visual com input color embutido */}
                          <div
                            className="relative w-8 h-8 rounded-lg border shadow-xs overflow-hidden cursor-pointer shrink-0 transition-transform hover:scale-105 active:scale-95"
                            style={{
                              backgroundColor: resolvedColor,
                              borderColor: 'rgba(255, 255, 255, 0.25)',
                            }}
                            title={`Escolher ${ctrl.label}`}
                          >
                            <input
                              type="color"
                              aria-label={`Seletor de cor para ${ctrl.label}`}
                              value={sanitizeHex(resolvedColor, '#000000')}
                              onChange={(e) =>
                                updateIndividualColor(ctrl.key, e.target.value)
                              }
                              className="absolute -inset-2 w-12 h-12 opacity-0 cursor-pointer"
                            />
                          </div>

                          {/* Campo de texto Hexadecimal editável */}
                          <input
                            type="text"
                            aria-label={`Código hexadecimal para ${ctrl.label}`}
                            value={resolvedColor.toUpperCase()}
                            onChange={(e) => {
                              const val = e.target.value.trim()
                              updateIndividualColor(ctrl.key, val)
                            }}
                            placeholder="#000000"
                            maxLength={7}
                            className="w-20 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-mono text-white text-center tracking-wider focus:outline-none focus:border-amber-400 transition-colors uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Dica de contraste e legibilidade garantida */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-xs text-neutral-400 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Legibilidade garantida:</strong> A cor do texto dos botões e o contraste do container se ajustam automaticamente para garantir conformidade de acessibilidade (WCAG).
                  </span>
                </div>
                <span className="text-[11px] text-amber-400 font-medium">
                  Modo detectado: {resolvedActiveTheme.isDarkBase ? 'Fundo Escuro' : 'Fundo Claro'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* CUSTOMIZADOR AVANÇADO QUANDO TEMA 'CUSTOM' É ESCOLHIDO    */}
        {/* ======================================================== */}
        {currentThemeId === 'custom' && (
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Configurações do Tema Personalizado
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                Avançado
              </span>
            </div>

            {/* Abas: Cor Sólida, Gradiente, Imagem de Fundo */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-neutral-300 block">
                Tipo de Fundo Especial:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomBgTab('color')
                    updateCustomConfig({ bgType: 'color' })
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    customBgTab === 'color'
                      ? 'bg-amber-400 text-neutral-950 border-amber-400'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Cor Sólida</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomBgTab('gradient')
                    updateCustomConfig({
                      bgType: 'gradient',
                      bgGradient: customConfig.bgGradient || GRADIENT_PRESETS[0].value,
                    })
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    customBgTab === 'gradient'
                      ? 'bg-amber-400 text-neutral-950 border-amber-400'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gradiente</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomBgTab('image')
                    updateCustomConfig({ bgType: 'image' })
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    customBgTab === 'image'
                      ? 'bg-amber-400 text-neutral-950 border-amber-400'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Imagem</span>
                </button>
              </div>

              {/* Conteúdo da Aba: Gradiente */}
              {customBgTab === 'gradient' && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <span className="text-xs font-bold text-white">Selecione um Gradiente Sugerido</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GRADIENT_PRESETS.map((preset) => {
                      const isGradActive = customConfig.bgGradient === preset.value
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => updateCustomConfig({ bgGradient: preset.value })}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-14 ${
                            isGradActive
                              ? 'border-amber-400 ring-2 ring-amber-400/40'
                              : 'border-neutral-700 hover:border-neutral-500'
                          }`}
                          style={{ background: preset.value }}
                        >
                          <span className="text-[10px] font-bold text-white drop-shadow-md">
                            {preset.label}
                          </span>
                          {isGradActive && (
                            <div className="self-end w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Conteúdo da Aba: Imagem de Fundo */}
              {customBgTab === 'image' && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white">URL da Imagem de Fundo</label>
                    <input
                      type="url"
                      value={customConfig.bgImageUrl || ''}
                      onChange={(e) => updateCustomConfig({ bgImageUrl: e.target.value })}
                      placeholder="https://exemplo.com/imagem-fundo.jpg"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[11px] text-neutral-400">
                      Recomendado: imagem de alta resolução com tons neutros ou tema do seu negócio.
                    </p>
                  </div>

                  {customConfig.bgImageUrl && (
                    <div className="space-y-2 pt-2 border-t border-neutral-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">Desfoque da Imagem (Blur)</span>
                        <span className="font-mono text-amber-400 font-bold">
                          {customConfig.bgImageBlur || 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="16"
                        step="1"
                        value={customConfig.bgImageBlur || 0}
                        onChange={(e) =>
                          updateCustomConfig({ bgImageBlur: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Alternância Forçada de Contraste (Opcional) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <div className="flex items-center gap-2">
                {resolvedActiveTheme.isDarkBase ? (
                  <Moon className="w-4 h-4 text-violet-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                <div>
                  <span className="text-xs font-bold text-white">
                    Modo Base:{' '}
                    {resolvedActiveTheme.isDarkBase ? 'Escuro (Texto Branco)' : 'Claro (Texto Escuro)'}
                  </span>
                  <p className="text-[10px] text-neutral-400">
                    Calculado automaticamente para máxima legibilidade.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateCustomConfig({ isDarkBase: !resolvedActiveTheme.isDarkBase })
                }
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition-colors"
              >
                Inverter Modo
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PRÉVIA EM TEMPO REAL ANTES DE SALVAR                     */}
        {/* ======================================================== */}
        <div className="pt-4 border-t border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Prévia da Página Pública ({resolvedActiveTheme.name})
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tempo Real
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-neutral-500" />
              Simulador idêntico à visão do cliente
            </span>
          </div>

          {/* Moldura do Simulador Mobile com o Tema e Cores Ativas */}
          <div
            className="w-full rounded-2xl p-4 sm:p-6 flex justify-center transition-colors duration-200 relative overflow-hidden border border-neutral-800"
            style={resolvedActiveTheme.pageBgStyle}
          >
            {/* Overlay atmosférico no simulador */}
            {resolvedActiveTheme.textureOverlay && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={resolvedActiveTheme.textureOverlay.style}
              />
            )}

            {/* Container Mobile Centralizado */}
            <div
              className="w-full max-w-xs sm:max-w-sm rounded-3xl overflow-hidden shadow-2xl relative border flex flex-col transition-all duration-200"
              style={{
                ...resolvedActiveTheme.containerBgStyle,
                borderColor: resolvedActiveTheme.containerBorderColor,
                color: resolvedActiveTheme.textPrimary,
              }}
            >
              {/* Foto de Capa Simulada */}
              <div className="relative w-full h-32 bg-neutral-900 overflow-hidden">
                {company.coverUrl ? (
                  <Image
                    src={company.coverUrl}
                    alt={company.name}
                    fill
                    className="object-cover"
                    sizes="380px"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-bold text-white text-sm"
                    style={{
                      background: `linear-gradient(135deg, ${resolvedActiveTheme.colors.primary}, ${resolvedActiveTheme.colors.secondary})`,
                    }}
                  >
                    {company.name}
                  </div>
                )}
                {/* Gradiente de transição na base da foto */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
                  style={{ background: resolvedActiveTheme.heroTransitionGradient }}
                />
              </div>

              {/* Cabeçalho da Empresa */}
              <div className="px-4 pb-3 pt-3 relative z-10 flex flex-col items-center text-center space-y-1">
                <div>
                  <h3
                    className="text-sm font-extrabold tracking-tight"
                    style={{ color: resolvedActiveTheme.colors.titleColor }}
                  >
                    {company.name}
                  </h3>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: resolvedActiveTheme.colors.textColor }}
                  >
                    {company.tagline || company.category || 'Estabelecimento'}
                  </p>
                </div>

                {/* Cartões de Ação de Exemplo que Demonstram Todas as Cores */}
                <div className="w-full space-y-2 pt-2">
                  {/* Card de Produto / Preço Simulado */}
                  <div
                    className="w-full p-2.5 rounded-2xl border text-left flex items-center justify-between shadow-xs transition-colors"
                    style={{
                      backgroundColor: resolvedActiveTheme.colors.cardBg,
                      borderColor: resolvedActiveTheme.colors.borderColor,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border"
                        style={{
                          backgroundColor: hexToRgba(resolvedActiveTheme.colors.primary, 0.15),
                          borderColor: hexToRgba(resolvedActiveTheme.colors.primary, 0.3),
                          color: resolvedActiveTheme.colors.primary,
                        }}
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-xs font-bold truncate"
                          style={{ color: resolvedActiveTheme.colors.titleColor }}
                        >
                          Item em Destaque
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className="text-xs font-black font-mono"
                            style={{ color: resolvedActiveTheme.colors.priceColor }}
                          >
                            R$ 49,90
                          </span>
                          <span
                            className="text-[10px] truncate"
                            style={{ color: resolvedActiveTheme.colors.textColor }}
                          >
                            &bull; Disponível
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botão com Cor dos Botões configurada */}
                    <button
                      type="button"
                      className="text-[10px] font-extrabold px-3 py-1.5 rounded-xl shadow-xs shrink-0 transition-transform active:scale-95"
                      style={{
                        backgroundColor: resolvedActiveTheme.colors.buttonBg,
                        color: resolvedActiveTheme.colors.buttonText,
                      }}
                    >
                      + Pedir agora
                    </button>
                  </div>

                  {/* Card de Contato Oficial */}
                  <div
                    className="w-full p-2.5 rounded-2xl border text-left flex items-center justify-between shadow-xs transition-colors"
                    style={{
                      backgroundColor: resolvedActiveTheme.colors.cardBg,
                      borderColor: resolvedActiveTheme.colors.borderColor,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border"
                        style={{
                          backgroundColor: hexToRgba(resolvedActiveTheme.colors.secondary, 0.15),
                          borderColor: hexToRgba(resolvedActiveTheme.colors.secondary, 0.3),
                          color: resolvedActiveTheme.colors.secondary,
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-xs font-bold truncate"
                          style={{ color: resolvedActiveTheme.colors.titleColor }}
                        >
                          Atendimento WhatsApp
                        </div>
                        <div
                          className="text-[10px] truncate"
                          style={{ color: resolvedActiveTheme.colors.textColor }}
                        >
                          Fale direto com a equipe
                        </div>
                      </div>
                    </div>

                    <span
                      className="text-[10px] font-extrabold px-3 py-1.5 rounded-xl shadow-xs shrink-0"
                      style={{
                        backgroundColor: resolvedActiveTheme.colors.buttonBg,
                        color: resolvedActiveTheme.colors.buttonText,
                      }}
                    >
                      Conversar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BARRA DE AÇÃO INFERIOR: SALVAR TEMA POR EMPRESA          */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-400 font-medium">Tema Selecionado:</span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-neutral-950">
              {resolvedActiveTheme.name} ({resolvedActiveTheme.subtitle})
            </span>
            {formData.themeColors && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Cores personalizadas ativas
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {company.slug && (
              <a
                href={`/${company.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Página Pública</span>
              </a>
            )}

            <button
              type="button"
              disabled={isSaving}
              onClick={onSaveTheme}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando Tema e Cores...' : 'Salvar Tema da Página'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
