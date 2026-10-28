'use client'

import React from 'react'
import { sanitizeHex, getContrastTextColor } from '@/lib/colors'

export interface PublicCardProps {
  id?: string
  // Left icon
  icon: React.ReactNode
  iconContainerClass?: string
  iconContainerStyle?: React.CSSProperties

  // Center content
  title: string
  subtitle?: React.ReactNode
  badgeText?: string
  badgeVariant?: 'theme' | 'amber' | 'emerald' | 'violet'
  badgeStyle?: React.CSSProperties

  // Right action button
  actionText: string
  actionIcon?: React.ReactNode
  onAction?: (e: React.MouseEvent) => void
  actionVariant?: 'theme' | 'whatsapp' | 'google' | 'instagram' | 'wifi' | 'rose' | 'secondary' | 'outline'
  actionStyle?: React.CSSProperties
  actionClassName?: string

  // Overall card interaction & styling
  onClick?: () => void
  isDark?: boolean
  cardStyle?: React.CSSProperties
  primaryColor?: string
  secondaryColor?: string
  buttonBgColor?: string
  buttonTextColor?: string
  className?: string
  children?: React.ReactNode
}

export const PublicCard: React.FC<PublicCardProps> = ({
  icon,
  iconContainerClass,
  iconContainerStyle,
  title,
  subtitle,
  badgeText,
  badgeVariant = 'theme',
  badgeStyle,
  actionText,
  actionIcon,
  onAction,
  actionVariant = 'theme',
  actionStyle,
  actionClassName,
  onClick,
  isDark = false,
  cardStyle,
  primaryColor = '#6D28D9',
  secondaryColor,
  buttonBgColor,
  buttonTextColor,
  className = '',
  children,
}) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick()
    } else if (onAction) {
      onAction({} as React.MouseEvent)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAction) {
      onAction(e)
    } else if (onClick) {
      onClick()
    }
  }

  // Resolver cor principal e contraste para o botão de ação padronizado
  const resolvedBg = sanitizeHex(buttonBgColor || primaryColor, '#6D28D9')
  const resolvedTextColor = buttonTextColor || getContrastTextColor(resolvedBg)
  const isOutline = actionVariant === 'outline'

  const buttonStyle: React.CSSProperties = isOutline
    ? actionStyle || {}
    : {
        backgroundColor: resolvedBg,
        color: resolvedTextColor,
        ...actionStyle,
      }

  // Badge styles
  const getBadgeClasses = () => {
    switch (badgeVariant) {
      case 'amber':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
      case 'emerald':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
      case 'violet':
        return 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30'
      case 'theme':
      default:
        return isDark
          ? 'bg-white/10 text-white border border-white/10'
          : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={`group w-full text-left relative flex flex-col justify-center rounded-2xl sm:rounded-3xl border transition-all duration-200 shadow-xs hover:shadow-md active:scale-[0.99] min-h-[72px] sm:min-h-[76px] p-3.5 sm:p-4 cursor-pointer select-none ${className}`}
      style={{
        WebkitTapHighlightColor: 'transparent',
        ...cardStyle,
      }}
    >
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 w-full">
        {/* LADO ESQUERDO: Ícone */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105 ${
              iconContainerClass || ''
            }`}
            style={iconContainerStyle}
          >
            {icon}
          </div>

          {/* CENTRO: Título, badges e descrição */}
          <div className="min-w-0 flex-1 pr-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`font-bold text-xs sm:text-sm leading-snug tracking-tight truncate ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {title}
              </h4>
              {badgeText && (
                <span
                  className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 leading-none ${getBadgeClasses()}`}
                  style={badgeStyle}
                >
                  {badgeText}
                </span>
              )}
            </div>

            {subtitle && (
              <div
                className={`text-[11px] sm:text-xs truncate mt-0.5 leading-normal ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO: Botão de Ação Padronizado */}
        <button
          type="button"
          onClick={handleButtonClick}
          className={`w-[124px] sm:w-[132px] h-9 sm:h-[38px] rounded-xl px-2 sm:px-2.5 text-[11px] sm:text-xs font-bold shrink-0 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs hover:opacity-90 select-none ${
            isOutline
              ? isDark
                ? 'border border-white/20 hover:bg-white/10 text-white'
                : 'border border-neutral-300 hover:bg-neutral-100 text-neutral-800'
              : ''
          } ${actionClassName || ''}`}
          style={buttonStyle}
        >
          {actionIcon && (
            <span
              className="shrink-0 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:stroke-[2.2]"
              style={{ color: isOutline ? undefined : resolvedTextColor }}
            >
              {actionIcon}
            </span>
          )}
          <span className="truncate">{actionText}</span>
        </button>
      </div>

      {children && <div className="mt-3 w-full">{children}</div>}
    </div>
  )
}

// Retrocompatibilidade caso algum arquivo use ActionCard
export const ActionCard = PublicCard
export default PublicCard
