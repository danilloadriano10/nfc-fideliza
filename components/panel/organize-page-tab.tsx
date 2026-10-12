'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Sparkles,
  LayoutGrid,
  Scissors,
  UtensilsCrossed,
  Package,
  Gift,
  Star,
  MapPin,
  Save,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Eye,
  Smartphone,
  Info,
  Loader2,
} from 'lucide-react'
import { Company } from '@/types/platform'
import {
  PublicSectionDef,
  ALL_PUBLIC_SECTIONS,
  getActivePublicSections,
} from '@/lib/public-sections'
import { saveCompanyAsync } from '@/lib/storage'
import Link from 'next/link'

interface OrganizePageTabProps {
  company: Company
  onCompanyUpdate: (updated: Company) => void
  showToast: (type: 'success' | 'error', text: string) => void
}

export const OrganizePageTab: React.FC<OrganizePageTabProps> = ({
  company,
  onCompanyUpdate,
  showToast,
}) => {
  const [sections, setSections] = useState<PublicSectionDef[]>(() =>
    getActivePublicSections(company)
  )
  const [isSaving, setIsSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [touchDragging, setTouchDragging] = useState<number | null>(null)

  // Keep track of unsaved changes compared to company.publicSectionsOrder
  const savedOrderIds = (company.publicSectionsOrder || []).join(',')
  const currentOrderIds = sections.map((s) => s.id).join(',')
  const hasChanges = savedOrderIds !== currentOrderIds

  // Sync if company updates externally (e.g. modules toggled on/off)
  useEffect(() => {
    setSections(getActivePublicSections(company))
  }, [company])

  // Move helper
  const reorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= sections.length) return
    const updated = [...sections]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    setSections(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index > 0) reorder(index, index - 1)
  }

  const handleMoveDown = (index: number) => {
    if (index < sections.length - 1) reorder(index, index + 1)
  }

  // HTML5 Drag and Drop Handlers (Desktop & Mouse)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      reorder(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Touch Drag Support for Mobile Devices
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const touchStartY = useRef<number>(0)
  const touchStartIndex = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    touchStartY.current = e.touches[0].clientY
    touchStartIndex.current = index
    setTouchDragging(index)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartIndex.current === null) return
    const currentY = e.touches[0].clientY

    // Find which item is under the finger
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i]
      if (el) {
        const rect = el.getBoundingClientRect()
        if (currentY >= rect.top && currentY <= rect.bottom) {
          if (touchStartIndex.current !== i) {
            reorder(touchStartIndex.current, i)
            touchStartIndex.current = i
            setTouchDragging(i)
          }
          break
        }
      }
    }
  }

  const handleTouchEnd = () => {
    touchStartIndex.current = null
    setTouchDragging(null)
  }

  // Save to Firestore
  const handleSave = async () => {
    setIsSaving(true)
    const newOrder = sections.map((s) => s.id)
    const updatedCompany: Company = {
      ...company,
      publicSectionsOrder: newOrder,
    }

    try {
      const res = await saveCompanyAsync(updatedCompany)
      if (res.success) {
        const saved = res.company || updatedCompany
        onCompanyUpdate(saved)
        showToast('success', 'Ordem da página salva com sucesso no Firestore!')
      } else {
        showToast('error', res.error || 'Erro ao salvar a ordem da página.')
      }
    } catch (err) {
      console.error('Erro ao salvar ordem no Firestore:', err)
      showToast('error', 'Falha na comunicação ao salvar a ordem da página.')
    } finally {
      setIsSaving(false)
    }
  }

  // Reset to default platform sequence
  const handleResetDefault = () => {
    const active = ALL_PUBLIC_SECTIONS.filter((s) =>
      sections.some((cur) => cur.id === s.id)
    ).sort((a, b) => a.defaultOrder - b.defaultOrder)
    setSections(active)
  }

  // Render Icon helper
  const renderSectionIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className={className} />
      case 'LayoutGrid':
        return <LayoutGrid className={className} />
      case 'Scissors':
        return <Scissors className={className} />
      case 'UtensilsCrossed':
        return <UtensilsCrossed className={className} />
      case 'Package':
        return <Package className={className} />
      case 'Gift':
        return <Gift className={className} />
      case 'Star':
        return <Star className={className} />
      case 'MapPin':
        return <MapPin className={className} />
      default:
        return <LayoutGrid className={className} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-black">
              ☰
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                Organizar Página Pública
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Escolha a sequência em que as seções aparecem para os clientes no link público.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasChanges && (
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3.5 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Restaurar sequência padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Padrão</span>
            </button>
          )}

          <Link
            href={`/empresa/${company.slug}`}
            target="_blank"
            className="px-3.5 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-neutral-500" />
            <span>Ver Página</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              hasChanges
                ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/25 active:scale-95'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/60'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : hasChanges ? (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar ordem da página</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Ordem salva</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Como funciona:</span>
          Segure e arraste o ícone <strong>☰</strong> para cima ou para baixo, ou use as setas <strong>↑</strong> e <strong>↓</strong> no celular.
          Apenas os <strong>módulos ativos</strong> são exibidos. Quando você ativar novos recursos, eles entrarão na organização automaticamente.
        </div>
      </div>

      {/* Main Grid: Left Reordering List / Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Reorderable List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">
              Módulos Ativos ({sections.length})
            </h3>
            <span className="text-[11px] text-neutral-400">
              Arraste ou clique nas setas
            </span>
          </div>

          <div className="space-y-2.5">
            {sections.map((section, index) => {
              const isFirst = index === 0
              const isLast = index === sections.length - 1
              const isDraggingThis = draggedIndex === index || touchDragging === index
              const isOverThis = dragOverIndex === index

              return (
                <div
                  key={section.id}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`rounded-2xl p-3.5 sm:p-4 border transition-all select-none flex items-center justify-between gap-3 ${
                    isDraggingThis
                      ? 'opacity-40 scale-[0.98] border-violet-400 bg-violet-50/50 shadow-inner'
                      : isOverThis
                      ? 'border-violet-500 bg-violet-50/80 shadow-md ring-2 ring-violet-400/30'
                      : 'bg-white hover:border-neutral-300 border-neutral-200/90 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {/* Left: Handle, Position Badge & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Drag Handle (Touch + Mouse) */}
                    <div
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none shrink-0 transition-colors"
                      title="Segurar e arrastar"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Position Number Badge */}
                    <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {index + 1}º
                    </span>

                    {/* Section Icon Container */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-white"
                      style={{ backgroundColor: section.accentColor }}
                    >
                      {renderSectionIcon(section.iconName, 'w-4 h-4')}
                    </div>

                    {/* Section Titles */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-black text-neutral-900 tracking-tight truncate">
                          {section.title}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200/60 shrink-0">
                          {section.categoryTag}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Mobile/Desktop Alternative Move Buttons (↑ and ↓) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveUp(index)}
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isFirst
                          ? 'opacity-30 cursor-not-allowed border-neutral-200 text-neutral-400 bg-neutral-50'
                          : 'border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 active:scale-95 bg-white'
                      }`}
                      title="Subir posição"
                      aria-label={`Mover ${section.title} para cima`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveDown(index)}
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isLast
                          ? 'opacity-30 cursor-not-allowed border-neutral-200 text-neutral-400 bg-neutral-50'
                          : 'border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 active:scale-95 bg-white'
                      }`}
                      title="Descer posição"
                      aria-label={`Mover ${section.title} para baixo`}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom Save Reminder Bar */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {hasChanges ? (
                <span className="text-amber-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Alterações não salvas
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ordem sincronizada
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                hasChanges
                  ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/25 active:scale-95'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/60'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no Firestore...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar ordem da página</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Live Preview Mockup (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 bg-neutral-950 text-white rounded-3xl p-5 border border-neutral-800 shadow-xl space-y-4">
            
            {/* Preview Mockup Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300">
                  Prévia da Página Pública
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800/60">
                Ao Vivo
              </span>
            </div>

            {/* Smartphone Simulation Frame */}
            <div className="bg-[#0d0d12] rounded-2xl border border-neutral-800 overflow-hidden shadow-inner flex flex-col max-h-[520px] overflow-y-auto scrollbar-none">
              
              {/* Header Mini */}
              <div className="p-3 bg-neutral-900 border-b border-neutral-800/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-violet-300 border border-neutral-700">
                  {company.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    company.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-white truncate">
                    {company.name}
                  </h4>
                  <p className="text-[10px] text-neutral-400 truncate">
                    /empresa/{company.slug}
                  </p>
                </div>
              </div>

              {/* Stacked Ordered Cards Sequence */}
              <div className="p-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-0.5">
                  Sequência que os clientes verão:
                </p>

                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-2 transition-all hover:border-neutral-700"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-md bg-neutral-800 text-neutral-300 text-[9px] font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: sec.accentColor }}
                      >
                        {renderSectionIcon(sec.iconName, 'w-3 h-3')}
                      </div>
                      <span className="text-[11px] font-bold text-neutral-200 truncate">
                        {sec.title}
                      </span>
                    </div>

                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-neutral-800 text-neutral-400 shrink-0">
                      {idx === 0 ? '1º topo' : `${idx + 1}º lugar`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mini Footer */}
              <div className="p-2.5 text-center text-[9px] text-neutral-400 border-t border-neutral-800/80 bg-neutral-950/60 mt-auto">
                DiretoLink • Ordem em tempo real
              </div>
            </div>

            {/* Quick Link Button */}
            <Link
              href={`/empresa/${company.slug}`}
              target="_blank"
              className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-neutral-700/80"
            >
              <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
              <span>Testar na Página Pública</span>
            </Link>

          </div>
        </div>

      </div>
    </div>
  )
}
