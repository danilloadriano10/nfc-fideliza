'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react'

export interface OrderableItem {
  id: string
  name: string
  photoUrl?: string
  category?: string
  subtitle?: string
}

interface OrganizeItemsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle: string
  itemTypeLabel: string // e.g. "produtos", "serviços", "itens do cardápio"
  items: OrderableItem[]
  defaultIcon: React.ReactNode
  accentColorClass?: string // e.g. "bg-violet-600 hover:bg-violet-700"
  onSave: (orderedIds: string[], silent?: boolean) => Promise<void>
}

export const OrganizeItemsModal: React.FC<OrganizeItemsModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  itemTypeLabel,
  items,
  defaultIcon,
  accentColorClass = 'bg-violet-600 hover:bg-violet-700',
  onSave,
}) => {
  const [orderedItems, setOrderedItems] = useState<OrderableItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null)

  // Initialize ordered items on modal open
  useEffect(() => {
    if (isOpen) {
      setOrderedItems([...items])
      setDraggedIndex(null)
      setDragOverIndex(null)
      setTouchDragIndex(null)
    }
  }, [isOpen, items])

  if (!isOpen) return null

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= orderedItems.length) return
    const updated = [...orderedItems]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    setOrderedItems(updated)

    // Auto-save immediately upon move so refreshing the page never reverts!
    const ids = updated.map((item) => item.id)
    onSave(ids, true).catch((err) => {
      console.error('Failed to auto-save item order:', err)
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const ids = orderedItems.map((item) => item.id)
      await onSave(ids, false)
      onClose()
    } catch (err) {
      console.error('Failed to save order:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRestoreInitial = () => {
    setOrderedItems([...items])
  }

  const initialIds = items.map((i) => i.id).join(',')
  const currentIds = orderedItems.map((i) => i.id).join(',')
  const hasChanges = initialIds !== currentIds

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-start justify-between gap-3 bg-neutral-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              {defaultIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight">
                  {title}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-800">
                  {orderedItems.length} {orderedItems.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tip banner */}
        <div className="px-4 sm:px-5 py-2.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between text-[11px] text-neutral-600 shrink-0">
          <span className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Arraste (⋮⋮) ou use as setas ▲ ▼ para definir a ordem</span>
          </span>
          {hasChanges && (
            <button
              type="button"
              onClick={handleRestoreInitial}
              className="text-violet-600 hover:text-violet-800 font-semibold flex items-center gap-1 text-[11px] cursor-pointer whitespace-nowrap ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Desfazer</span>
            </button>
          )}
        </div>

        {/* List of draggable/sortable items */}
        <div
          id="organize-items-list-container"
          className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2 min-h-[220px]"
        >
          {orderedItems.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-xs">
              Nenhum item cadastrado para organizar.
            </div>
          ) : (
            orderedItems.map((item, index) => {
              const isFirst = index === 0
              const isLast = index === orderedItems.length - 1
              const isBeingDragged = draggedIndex === index || touchDragIndex === index
              const isDragOver = dragOverIndex === index

              return (
                <div
                  key={item.id}
                  data-orderable-index={index}
                  draggable
                  onDragStart={(e) => {
                    setDraggedIndex(index)
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', String(index))
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    if (dragOverIndex !== index) setDragOverIndex(index)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedIndex !== null && draggedIndex !== index) {
                      handleMove(draggedIndex, index)
                    }
                    setDraggedIndex(null)
                    setDragOverIndex(null)
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null)
                    setDragOverIndex(null)
                  }}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all select-none ${
                    isBeingDragged
                      ? 'opacity-40 border-dashed border-violet-400 bg-violet-50/50 scale-[0.98]'
                      : isDragOver
                      ? 'border-violet-500 ring-2 ring-violet-200 bg-violet-50/80 shadow-md scale-[1.01]'
                      : 'bg-white border-neutral-200 hover:border-violet-300 hover:shadow-xs'
                  }`}
                >
                  {/* Left: Grip Handle, Position Badge, Photo/Icon, Name & Meta */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {/* Grip handle with touch and mouse support */}
                    <div
                      className="text-neutral-400 hover:text-neutral-800 active:text-violet-600 cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-neutral-100 transition-colors shrink-0 touch-none"
                      title="Arraste para mover (⋮⋮)"
                      onTouchStart={() => {
                        setTouchDragIndex(index)
                      }}
                      onTouchMove={(e) => {
                        const touch = e.touches[0]
                        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY)
                        if (targetElement) {
                          const cardEl = targetElement.closest('[data-orderable-index]')
                          if (cardEl) {
                            const overIdx = Number(cardEl.getAttribute('data-orderable-index'))
                            if (
                              !isNaN(overIdx) &&
                              overIdx !== index &&
                              overIdx >= 0 &&
                              overIdx < orderedItems.length
                            ) {
                              handleMove(index, overIdx)
                              setTouchDragIndex(overIdx)
                            }
                          }
                        }
                      }}
                      onTouchEnd={() => {
                        setTouchDragIndex(null)
                      }}
                    >
                      <GripVertical className="w-5 h-5 text-neutral-400" />
                    </div>

                    {/* Numeric Position Badge */}
                    <span className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-700 font-black text-[11px] flex items-center justify-center shrink-0 border border-neutral-200">
                      {index + 1}
                    </span>

                    {/* Thumbnail or Fallback Icon */}
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200/80 flex items-center justify-center relative">
                      {item.photoUrl ? (
                        <Image
                          src={item.photoUrl}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-neutral-400">{defaultIcon}</div>
                      )}
                    </div>

                    {/* Title and Category / Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                          {item.name}
                        </span>
                        {item.category && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 truncate max-w-[100px] shrink-0">
                            {item.category}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <span className="text-[11px] text-neutral-500 truncate block mt-0.5">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Up / Down arrows for 1-tap ordering on mobile & desktop */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleMove(index, index - 1)}
                      disabled={isFirst}
                      className="w-8 h-8 rounded-xl border border-neutral-200 hover:bg-neutral-100 active:bg-neutral-200 active:scale-90 text-neutral-700 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer"
                      title="Mover para cima"
                      aria-label={`Mover ${item.name} para cima`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, index + 1)}
                      disabled={isLast}
                      className="w-8 h-8 rounded-xl border border-neutral-200 hover:bg-neutral-100 active:bg-neutral-200 active:scale-90 text-neutral-700 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer"
                      title="Mover para baixo"
                      aria-label={`Mover ${item.name} para baixo`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-neutral-500">
            A ordem definida acima será aplicada imediatamente na vitrine pública.
          </p>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 active:scale-95 text-neutral-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || orderedItems.length === 0}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${accentColorClass}`}
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando ordem...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar ordem</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
