'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
} from 'lucide-react'
import { Company } from '@/types/platform'

interface CoverAdjustModalProps {
  company: Company
  coverUrl: string
  isOpen: boolean
  onClose: () => void
  onSave: (adjustments: {
    coverFit: 'cover' | 'contain' | 'logo'
    coverPositionX: string
    coverPositionY: string
    coverZoom: number
  }) => void
}

function parsePositionPercent(val?: string | number, defaultVal = 50): number {
  if (val == null) return defaultVal
  if (typeof val === 'number') return Math.max(0, Math.min(100, Math.round(val)))
  const str = String(val).toLowerCase().trim()
  if (str === 'left' || str === 'top') return 0
  if (str === 'center') return 50
  if (str === 'right' || str === 'bottom') return 100
  const match = str.match(/^(-?\d+(\.\d+)?)%?$/)
  if (match) {
    const num = parseFloat(match[1])
    return isNaN(num) ? defaultVal : Math.max(0, Math.min(100, Math.round(num)))
  }
  return defaultVal
}

function parseZoom(val?: number, defaultVal = 1): number {
  if (val == null || isNaN(val) || val < 1) return defaultVal
  return Math.min(2.5, Math.max(1, Number(val.toFixed(2))))
}

export const CoverAdjustModal: React.FC<CoverAdjustModalProps> = ({
  company,
  coverUrl,
  isOpen,
  onClose,
  onSave,
}) => {
  const [posX, setPosX] = useState<number>(() =>
    parsePositionPercent(company.coverPositionX, 50)
  )
  const [posY, setPosY] = useState<number>(() =>
    parsePositionPercent(company.coverPositionY, 50)
  )
  const [zoom, setZoom] = useState<number>(() => parseZoom(company.coverZoom, 1))
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const previewRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)

  // Reset values when opened for a new company or cover
  useEffect(() => {
    if (isOpen) {
      setPosX(parsePositionPercent(company.coverPositionX, 50))
      setPosY(parsePositionPercent(company.coverPositionY, 50))
      setZoom(parseZoom(company.coverZoom, 1))
    }
  }, [isOpen, company.coverPositionX, company.coverPositionY, company.coverZoom])

  if (!isOpen) return null

  const handleReset = () => {
    setPosX(50)
    setPosY(50)
    setZoom(1)
  }

  const handleSave = () => {
    setIsSaving(true)
    onSave({
      coverFit: 'cover', // Sempre object-fit: cover conforme regra estrita da capa
      coverPositionX: `${posX}%`,
      coverPositionY: `${posY}%`,
      coverZoom: Number(zoom.toFixed(2)),
    })
    setIsSaving(false)
    onClose()
  }

  // --- ARRASTE INTERATIVO (MOUSE & TOUCH) COM LIMITES RÍGIDOS ---
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true)
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      startPosX: posX,
      startPosY: posY,
    }
  }

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !previewRef.current) return
    const rect = previewRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const deltaX = clientX - dragStartRef.current.startX
    const deltaY = clientY - dragStartRef.current.startY

    // Inversão natural: arrastar a foto para a direita revela o lado esquerdo (diminui posX)
    // Sensibilidade escalada de acordo com as dimensões do preview
    const percentDeltaX = (deltaX / rect.width) * 100 * (1 / zoom)
    const percentDeltaY = (deltaY / rect.height) * 100 * (1 / zoom)

    const nextX = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startPosX - percentDeltaX)))
    const nextY = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startPosY - percentDeltaY)))

    setPosX(nextX)
    setPosY(nextY)
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    dragStartRef.current = null
  }

  // Quick Nudge Buttons (ajuste fino de 5% por clique)
  const nudge = (dx: number, dy: number) => {
    setPosX((prev) => Math.max(0, Math.min(100, prev + dx)))
    setPosY((prev) => Math.max(0, Math.min(100, prev + dy)))
  }

  // Presets da grade de enquadramento (9 pontos de foco profissionais)
  const setPreset = (x: number, y: number) => {
    setPosX(x)
    setPosY(y)
  }

  const objectPositionStyle = `${posX}% ${posY}%`

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onMouseUp={handlePointerUp}
      onTouchEnd={handlePointerUp}
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[96vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                Arraste a foto ou use os controles para definir a posição ideal na proporção 2:1.
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
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* PRÉ-VISUALIZAÇÃO 2:1 MOBILE COM SUPORTE A ARRASTE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>Pré-visualização 2:1 (Arraste a foto)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full font-mono">
                  Posição: {posX}% • {posY}%
                </span>
                <span className="text-[11px] font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-full font-mono">
                  {zoom.toFixed(2)}x
                </span>
              </div>
            </div>

            {/* Container do Mockup (Fiel à Página Pública) */}
            <div className="max-w-md mx-auto rounded-3xl border-2 border-neutral-300 bg-neutral-900 p-2 shadow-xl">
              <div
                ref={previewRef}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handlePointerDown(e.clientX, e.clientY)
                }}
                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onTouchStart={(e) => {
                  const t = e.touches[0]
                  if (t) handlePointerDown(t.clientX, t.clientY)
                }}
                onTouchMove={(e) => {
                  const t = e.touches[0]
                  if (t) handlePointerMove(t.clientX, t.clientY)
                }}
                className={`relative w-full aspect-[2/1] rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center select-none touch-none ${
                  isDragging ? 'cursor-grabbing ring-2 ring-violet-500' : 'cursor-grab hover:ring-1 hover:ring-white/40'
                }`}
                title="Clique e arraste para reposicionar a foto"
              >
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt={company.name}
                    className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-75"
                    style={{
                      objectPosition: objectPositionStyle,
                      transform: zoom > 1 ? `scale(${zoom})` : undefined,
                      transformOrigin: objectPositionStyle,
                    }}
                    draggable={false}
                  />
                ) : (
                  <span className="text-xs text-neutral-500">Sem imagem de capa</span>
                )}

                {/* Overlay instrucional ao passar o mouse ou antes de arrastar */}
                <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white shadow-xs">
                  <Move className="w-3 h-3 text-violet-400" />
                  <span>Arraste para mover</span>
                </div>

                {/* Ponto focal sutil no centro de mira */}
                <div
                  className="absolute pointer-events-none z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
                  style={{ left: `${posX}%`, top: `${posY}%` }}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-white/80 bg-violet-600/40 shadow-xs flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>

                {/* Gradiente sutil inferior como na página pública */}
                <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-neutral-950/80 to-transparent pointer-events-none" />

                {/* Badge com nome da empresa para dar realismo */}
                <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-2 pointer-events-none">
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

            <p className="text-[11px] text-center text-neutral-500">
              💡 A foto preenche 100% da área sem faixas pretas ou brancas. Arraste para o melhor ângulo.
            </p>
          </div>

          {/* CONTROLES: GRADE DE FOCO + AJUSTES DIRECIONAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Grade de Foco Rápido (9 Posições) */}
            <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-700 uppercase flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-violet-600" />
                  Ponto de Foco Rápido
                </span>
                <span className="text-[10px] text-neutral-400">9 quadrantes</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto">
                {[
                  { label: '↖', x: 0, y: 0, title: 'Superior Esquerdo' },
                  { label: '↑ Topo', x: 50, y: 0, title: 'Topo Central' },
                  { label: '↗', x: 100, y: 0, title: 'Superior Direito' },
                  { label: '← Esq', x: 0, y: 50, title: 'Centro Esquerdo' },
                  { label: '• Centro', x: 50, y: 50, title: 'Centro Absoluto' },
                  { label: 'Dir →', x: 100, y: 50, title: 'Centro Direito' },
                  { label: '↙', x: 0, y: 100, title: 'Inferior Esquerdo' },
                  { label: '↓ Base', x: 50, y: 100, title: 'Base Central' },
                  { label: '↘', x: 100, y: 100, title: 'Inferior Direito' },
                ].map((item) => {
                  const isActive = posX === item.x && posY === item.y
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setPreset(item.x, item.y)}
                      title={item.title}
                      className={`h-8 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center ${
                        isActive
                          ? 'bg-violet-600 text-white border-violet-600 shadow-2xs font-black'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Ajuste Fino Direcional */}
            <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/70 space-y-2">
              <span className="text-[11px] font-bold text-neutral-700 uppercase block">
                Ajuste Fino Direcional (±5%)
              </span>

              <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                <button
                  type="button"
                  onClick={() => nudge(0, -5)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Mover para cima"
                >
                  <ArrowUp className="w-3.5 h-3.5" /> Subir
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => nudge(-5, 0)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Mover para esquerda"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Esquerda
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPosX(50)
                      setPosY(50)
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-[10px] font-black text-neutral-800 cursor-pointer"
                    title="Centralizar"
                  >
                    Centro
                  </button>

                  <button
                    type="button"
                    onClick={() => nudge(5, 0)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Mover para direita"
                  >
                    Direita <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => nudge(0, 5)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Mover para baixo"
                >
                  <ArrowDown className="w-3.5 h-3.5" /> Descer
                </button>
              </div>
            </div>
          </div>

          {/* 3. ZOOM (Mínimo 1.00x para impedir bordas vazias) */}
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-violet-600" />
                <span>Nível de Zoom ({zoom.toFixed(2)}x)</span>
              </label>

              <button
                type="button"
                onClick={() => setZoom(1)}
                className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Redefinir Zoom (1.00x)</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(1, Number((prev - 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                title="Diminuir zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(2.5, Number((prev + 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>1.00x (Padrão 100% Cobertura)</span>
              <span>1.75x</span>
              <span>2.50x (Aproximação Máxima)</span>
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
            <span>Redefinir</span>
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
