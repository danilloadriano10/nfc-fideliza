'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'

interface ActionCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
  accentColor?: string
  badgeText?: string
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  subtitle,
  onClick,
  accentColor,
  badgeText,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full group text-left relative flex items-center justify-between p-4 sm:p-4.5 bg-white rounded-2xl border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-neutral-300 transition-all duration-200 active:scale-[0.985] min-h-[72px]"
      style={{
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pr-2">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-medium shadow-sm transition-transform group-hover:scale-105"
          style={{ backgroundColor: accentColor || '#18181B' }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-900 text-base leading-tight truncate">
              {title}
            </h3>
            {badgeText && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                {badgeText}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>
      <div className="text-neutral-400 group-hover:text-neutral-700 transition-colors shrink-0 pl-1">
        <ChevronRight className="w-5 h-5 stroke-[2]" />
      </div>
    </button>
  )
}
