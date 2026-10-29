'use client'

import React from 'react'
import {
  SlidersHorizontal,
  RotateCcw,
  Palette,
  Check,
  ShieldCheck,
  Tag,
  DollarSign,
  Type,
  Square,
  Sparkles,
} from 'lucide-react'
import { AdvancedColorsConfig, PublicPageThemeId } from '@/types/platform'
import { ResolvedThemeColors, PRESET_THEMES } from '@/lib/public-themes'
import { sanitizeHex, getContrastTextColor } from '@/lib/colors'

interface AdvancedColorsSectionProps {
  currentThemeId: PublicPageThemeId
  themeColors: AdvancedColorsConfig
  resolvedColors: ResolvedThemeColors
  onColorChange: (key: keyof AdvancedColorsConfig, value: string) => void
  onResetToThemeDefault: () => void
}

interface ColorControlDef {
  key: keyof AdvancedColorsConfig
  label: string
  description: string
  icon: React.ReactNode
  presetChips: string[]
  sampleType?: 'text' | 'price' | 'button' | 'card' | 'border'
}

export const AdvancedColorsSection: React.FC<AdvancedColorsSectionProps> = ({
  currentThemeId,
  themeColors,
  resolvedColors,
  onColorChange,
  onResetToThemeDefault,
}) => {
  const baseTheme = PRESET_THEMES[currentThemeId] || PRESET_THEMES.dark

  const COLOR_CONTROLS: ColorControlDef[] = [
    {
      key: 'pageBg',
      label: 'Fundo da página',
      description: 'Cor principal de fundo em tela cheia no mobile e desktop',
      icon: <Square className="w-4 h-4 text-sky-400" />,
      presetChips: ['#000000', '#070709', '#05120c', '#120904', '#08080a', '#050a14', '#f8fafc', '#fdf2f4', '#f3ece3'],
    },
    {
      key: 'cardBg',
      label: 'Fundo dos cards',
      description: 'Superfície dos módulos, vitrine de serviços e produtos',
      icon: <Square className="w-4 h-4 text-violet-400" />,
      presetChips: ['#080808', '#141419', '#10291e', '#27170e', '#16161c', '#10223d', '#ffffff', '#faf7f2', '#181822'],
      sampleType: 'card',
    },
    {
      key: 'primary',
      label: 'Cor principal',
      description: 'Identidade da marca, ícones de destaque e elementos nobres',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      presetChips: ['#8b5cf6', '#10b981', '#f59e0b', '#d4af37', '#3b82f6', '#e11d48', '#c2593f', '#4f46e5'],
    },
    {
      key: 'secondary',
      label: 'Cor secundária',
      description: 'Gradientes de apoio, brilhos de fundo e realces sutis',
      icon: <Palette className="w-4 h-4 text-fuchsia-400" />,
      presetChips: ['#a855f7', '#34d399', '#ea580c', '#60a5fa', '#f43f5e', '#92400e', '#fb7185', '#06b6d4'],
    },
    {
      key: 'buttonBg',
      label: 'Cor dos botões',
      description: 'Botões de ação direta ("Pedir", "Conversar", "Agendar", "Ver todos")',
      icon: <Tag className="w-4 h-4 text-emerald-400" />,
      presetChips: ['#10b981', '#8b5cf6', '#d97706', '#d4af37', '#2563eb', '#e11d48', '#c2593f', '#0f172a'],
      sampleType: 'button',
    },
    {
      key: 'priceColor',
      label: 'Cor dos preços',
      description: 'Valores monetários no cardápio, catálogo e serviços (sem vermelho ou verde fixo)',
      icon: <DollarSign className="w-4 h-4 text-teal-400" />,
      presetChips: ['#10b981', '#38bdf8', '#fbbf24', '#fef08a', '#be185d', '#9a3412', '#22c55e', '#e879f9'],
      sampleType: 'price',
    },
    {
      key: 'titleColor',
      label: 'Cor dos títulos',
      description: 'Nome do negócio, títulos de seções e nomes dos produtos/serviços',
      icon: <Type className="w-4 h-4 text-neutral-200" />,
      presetChips: ['#ffffff', '#0f172a', '#f0fdf4', '#fffbeb', '#bfdbfe', '#4c0519', '#291e17', '#e2e8f0'],
      sampleType: 'text',
    },
    {
      key: 'textColor',
      label: 'Cor dos textos',
      description: 'Descrições de produtos, endereços, horários e subtítulos',
      icon: <Type className="w-4 h-4 text-neutral-400" />,
      presetChips: ['#cbd5e1', '#475569', '#a7f3d0', '#fed7aa', '#e4d8b4', '#881337', '#5a4639', '#94a3b8'],
      sampleType: 'text',
    },
    {
      key: 'borderColor',
      label: 'Cor das bordas/detalhes',
      description: 'Linhas divisórias, contornos dos cartões e anéis decorativos',
      icon: <Square className="w-4 h-4 text-neutral-400" />,
      presetChips: ['#202020', 'rgba(255, 255, 255, 0.08)', '#e2e8f0', '#1b4d35', 'rgba(245, 158, 11, 0.22)', 'rgba(212, 175, 55, 0.28)', 'rgba(59, 130, 246, 0.22)', '#f9dce2', '#ebdcd0'],
      sampleType: 'border',
    },
  ]

  return (
    <div className="p-5 rounded-2xl bg-neutral-950 text-white shadow-md border border-neutral-800 space-y-5 animate-in fade-in duration-300">
      {/* Header da Seção de Cores Avançadas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              CORES AVANÇADAS DA PÁGINA PÚBLICA
            </h4>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Personalize qualquer cor individual. As alterações abaixo têm prioridade sobre o tema base selecionado ({baseTheme.name}).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onResetToThemeDefault}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restaura as cores para o padrão original do tema atual"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Padrão de {baseTheme.name}</span>
          </button>
        </div>
      </div>

      {/* Grid com os 9 Seletores de Cor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {COLOR_CONTROLS.map((ctrl) => {
          const rawValue = (themeColors as Record<string, string | undefined>)[ctrl.key]
          const currentValue = (resolvedColors as unknown as Record<string, string>)[ctrl.key] || '#ffffff'
          const isOverridden = !!rawValue

          // Sanitize for color picker input (requires #RRGGBB)
          const safePickerValue = sanitizeHex(currentValue, '#8b5cf6')

          return (
            <div
              key={ctrl.key}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                isOverridden
                  ? 'bg-neutral-900 border-amber-400/40 ring-1 ring-amber-400/20'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {/* Topo do Card de Controle */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-neutral-800/80 shrink-0">
                    {ctrl.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white leading-tight">
                        {ctrl.label}
                      </span>
                      {isOverridden && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          Editado
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                      {ctrl.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Seletor Visual + Input HEX + Amostra */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/80">
                <div className="flex items-center gap-2">
                  {/* Seletor de Cor Nativo com Borda */}
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-neutral-700 shrink-0 shadow-inner">
                    <input
                      type="color"
                      value={safePickerValue}
                      onChange={(e) => onColorChange(ctrl.key, e.target.value)}
                      className="absolute -inset-2 w-12 h-12 cursor-pointer border-0 p-0"
                    />
                  </div>

                  {/* Input Hexadecimal de Texto */}
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => onColorChange(ctrl.key, e.target.value)}
                    placeholder="#000000"
                    className="w-24 px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-700 text-xs font-mono text-white text-center focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Demonstração rápida do elemento com a cor aplicada */}
                {ctrl.sampleType === 'button' ? (
                  <div
                    className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold shadow-xs transition-colors shrink-0"
                    style={{
                      backgroundColor: resolvedColors.buttonBg,
                      color: resolvedColors.buttonText,
                    }}
                  >
                    Botão
                  </div>
                ) : ctrl.sampleType === 'price' ? (
                  <span
                    className="text-xs font-black font-mono shrink-0"
                    style={{ color: resolvedColors.priceColor }}
                  >
                    R$ 29,90
                  </span>
                ) : ctrl.sampleType === 'card' ? (
                  <div
                    className="w-12 h-6 rounded-md border flex items-center justify-center text-[8px] font-bold shrink-0"
                    style={{
                      backgroundColor: resolvedColors.cardBg,
                      borderColor: resolvedColors.borderColor,
                      color: resolvedColors.titleColor,
                    }}
                  >
                    Card
                  </div>
                ) : (
                  <div
                    className="w-5 h-5 rounded-md border border-white/20 shrink-0 shadow-inner"
                    style={{ backgroundColor: currentValue }}
                  />
                )}
              </div>

              {/* Chips rápidos de cores sugeridas */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                <span className="text-[9px] text-neutral-400 font-bold uppercase shrink-0">
                  Sugestões:
                </span>
                {ctrl.presetChips.map((chip, idx) => {
                  const isCurrent = currentValue.toLowerCase() === chip.toLowerCase()
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onColorChange(ctrl.key, chip)}
                      className={`w-4 h-4 rounded-full border transition-all shrink-0 cursor-pointer ${
                        isCurrent
                          ? 'border-amber-400 ring-2 ring-amber-400/50 scale-110'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: chip }}
                      title={`Aplicar ${chip}`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Barra de Verificação de Acessibilidade & Contraste Automático */}
      <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              Contraste Automático WCAG Ativo
            </span>
            <p className="text-[11px] text-neutral-400">
              O texto dos botões se ajusta automaticamente para{' '}
              <strong className="text-amber-300">
                {resolvedColors.buttonText === '#ffffff' ? 'Branco (#ffffff)' : 'Preto (#171717)'}
              </strong>{' '}
              garantindo 100% de legibilidade para seus clientes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-neutral-950 text-neutral-300 border border-neutral-800">
            Preço: <span style={{ color: resolvedColors.priceColor }}>R$</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-neutral-950 text-neutral-300 border border-neutral-800">
            Título: <span style={{ color: resolvedColors.titleColor }}>Aa</span>
          </span>
        </div>
      </div>
    </div>
  )
}
