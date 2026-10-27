'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'

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
  buttonTextColor = '#ffffff',
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

  // Resolver classes e estilos do botão de ação
  const getButtonStyles = (): { className: string; style?: React.CSSProperties } => {
    switch (actionVariant) {
      case 'whatsapp':
        return {
          className: 'bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xs',
          style: actionStyle,
        }
      case 'google':
        return {
          className: 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs',
          style: actionStyle,
        }
      case 'instagram':
        return {
          className: 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-xs hover:opacity-95',
          style: actionStyle,
        }
      case 'wifi':
        return {
          className: 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs',
          style: actionStyle,
        }
      case 'rose':
        return {
          className: 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs',
          style: actionStyle,
        }
      case 'secondary':
        return {
          className: 'text-white shadow-xs hover:opacity-90',
          style: {
            backgroundColor: secondaryColor || primaryColor,
            color: '#ffffff',
            ...actionStyle,
          },
        }
      case 'outline':
        return {
          className: isDark
            ? 'border border-white/15 hover:bg-white/10 text-white'
            : 'border border-neutral-300 hover:bg-neutral-100 text-neutral-800',
          style: actionStyle,
        }
      case 'theme':
      default:
        return {
          className: 'text-white shadow-xs hover:opacity-90',
          style: {
            backgroundColor: buttonBgColor || primaryColor,
            color: buttonTextColor,
            ...actionStyle,
          },
        }
    }
  }

  const buttonProps = getButtonStyles()

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

        {/* LADO DIREITO: Botão de Ação */}
        <button
          type="button"
          onClick={handleButtonClick}
          className={`px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap ${buttonProps.className} ${actionClassName || ''}`}
          style={buttonProps.style}
        >
          {actionIcon}
          <span>{actionText}</span>
        </button>
      </div>

      {children && <div className="mt-3 w-full">{children}</div>}
    </div>
  )
}

// Retrocompatibilidade caso algum arquivo use ActionCard
export const ActionCard = PublicCard
export default PublicCard
