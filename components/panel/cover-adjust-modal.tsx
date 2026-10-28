'use client'

import React, { useState } from 'react'
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react'
import { Company } from '@/types/platform'

interface CoverAdjustModalProps {
  company: Company
  coverUrl: string
  isOpen: boolean
  onClose: () => void
  onSave: (adjustments: {
    coverFit: 'cover' | 'contain'
    coverPositionX: string
    coverPositionY: string
    coverZoom: number
  }) => void
}

export const CoverAdjustModal: React.FC<CoverAdjustModalProps> = ({
  company,
  coverUrl,
  isOpen,
  onClose,
  onSave,
}) => {
  const [coverFit, setCoverFit] = useState<'cover' | 'contain'>(
    company.coverFit || 'cover'
  )
  const [coverPositionX, setCoverPositionX] = useState<string>(
    company.coverPositionX || 'center'
  )
  const [coverPositionY, setCoverPositionY] = useState<string>(
    company.coverPositionY || 'center'
  )
  const [coverZoom, setCoverZoom] = useState<number>(company.coverZoom ?? 1)
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleReset = () => {
    setCoverFit('cover')
    setCoverPositionX('center')
    setCoverPositionY('center')
    setCoverZoom(1)
  }

  const handleSave = () => {
    setIsSaving(true)
    onSave({
      coverFit,
      coverPositionX,
      coverPositionY,
      coverZoom,
    })
    setIsSaving(false)
    onClose()
  }

  // Obter css background ou object position string
  const objectPositionStyle = `${coverPositionX} ${coverPositionY}`

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/90 gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-600 text-white shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-neutral-900 text-base sm:text-lg">
                Ajustar Enquadramento da Capa
              </h3>
              <p className="text-xs text-neutral-500">
                Ajuste como a fotografia de capa será exibida na página pública do seu estabelecimento.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Preview e Controles */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* PRÉ-VISUALIZAÇÃO MOBILE (Formato do cabeçalho da página pública) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>Pré-visualização Mobile (Cabeçalho Real)</span>
              </label>
              <span className="text-[11px] text-neutral-400">
                Como seu cliente verá no smartphone
              </span>
            </div>

            {/* Mockup do Topo da Página */}
            <div className="max-w-sm mx-auto rounded-3xl border-2 border-neutral-300 bg-neutral-900 p-2 shadow-xl">
              <div className="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt={company.name}
                    className={`w-full h-full transition-transform duration-100 select-none ${
                      coverFit === 'contain' ? 'object-contain' : 'object-cover'
                    }`}
                    style={{
                      objectPosition: objectPositionStyle,
                      transform: `scale(${coverZoom})`,
                    }}
                  />
                ) : (
                  <span className="text-xs text-neutral-500">Sem imagem de capa</span>
                )}

                {/* Gradiente sutil inferior como na página pública */}
                <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-neutral-950/80 to-transparent pointer-events-none" />

                {/* Badge com nome da empresa para dar realismo */}
                <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-2">
                  {company.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-7 h-7 rounded-full object-cover border border-white/40 shadow-xs"
                    />
                  )}
                  <span className="text-xs font-bold text-white drop-shadow-md">
                    {company.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 1. MODO DE EXIBIÇÃO: PREENCHER OU ENCAIXAR INTEIRA */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
              1. Modo de Exibição
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCoverFit('cover')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  coverFit === 'cover'
                    ? 'border-violet-600 bg-violet-50 text-violet-900 ring-2 ring-violet-500/20 shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Maximize2 className="w-4 h-4 text-violet-600" />
                <div className="text-left">
                  <span className="block font-bold">Preencher (Cover)</span>
                  <span className="text-[10px] text-neutral-500 font-normal">
                    Ocupa 100% da área sem faixas
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCoverFit('contain')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  coverFit === 'contain'
                    ? 'border-violet-600 bg-violet-50 text-violet-900 ring-2 ring-violet-500/20 shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Minimize2 className="w-4 h-4 text-violet-600" />
                <div className="text-left">
                  <span className="block font-bold">Encaixar Inteira (Contain)</span>
                  <span className="text-[10px] text-neutral-500 font-normal">
                    Mostra a foto inteira sem nenhum corte
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. POSIÇÃO DA IMAGEM: HORIZONTAL E VERTICAL */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
              2. Alinhamento da Foto
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Posição Horizontal */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-2">
                <span className="text-[11px] font-bold text-neutral-600 uppercase block">
                  Posição Horizontal
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCoverPositionX('left')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      coverPositionX === 'left'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Esquerda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCoverPositionX('center')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      coverPositionX === 'center'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span>Centro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCoverPositionX('right')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      coverPositionX === 'right'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span>Direita</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Posição Vertical */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-2">
                <span className="text-[11px] font-bold text-neutral-600 uppercase block">
                  Posição Vertical
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCoverPositionY('top')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      coverPositionY === 'top'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Topo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCoverPositionY('center')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      coverPositionY === 'center'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span>Centro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCoverPositionY('bottom')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      coverPositionY === 'bottom'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span>Fundo</span>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. ZOOM */}
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-violet-600" />
                <span>Nível de Zoom ({coverZoom.toFixed(2)}x)</span>
              </label>

              <button
                type="button"
                onClick={() => setCoverZoom(1)}
                className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Redefinir Zoom</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={coverZoom}
                onChange={(e) => setCoverZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
              <ZoomIn className="w-4 h-4 text-neutral-400 shrink-0" />
            </div>

            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>0.50x (Afastar)</span>
              <span>1.00x (Padrão)</span>
              <span>2.50x (Aproximar)</span>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Redefinir Tudo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Enquadramento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
