'use client'

import React, { useState, useEffect } from 'react'
import { UtensilsCrossed, Scissors, Package, Store, User, ImageIcon } from 'lucide-react'
import { normalizeImageUrl, isImgbbErrorImage } from '@/lib/image-utils'

export type SafeImagePlaceholderType = 'food' | 'service' | 'product' | 'cover' | 'avatar' | 'general'

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
  alt?: string
  className?: string
  containerClassName?: string
  placeholderType?: SafeImagePlaceholderType
  placeholderLabel?: string
  priority?: boolean
  objectFit?: 'cover' | 'contain'
  fallbackColor?: string
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full',
  placeholderType = 'general',
  placeholderLabel,
  priority = false,
  objectFit = 'cover',
  fallbackColor,
  style,
  ...props
}) => {
  const normalizedSrc = normalizeImageUrl(src)
  const [hasError, setHasError] = useState(!normalizedSrc)
  const [isLoaded, setIsLoaded] = useState(false)

  // Reset error/loaded states if src changes
  useEffect(() => {
    if (!normalizedSrc) {
      setHasError(true)
      setIsLoaded(false)
    } else {
      setHasError(false)
      setIsLoaded(false)
    }
  }, [normalizedSrc])

  const renderPlaceholderIcon = () => {
    const iconClass = 'w-7 h-7 sm:w-8 sm:h-8 opacity-40 mb-1'
    switch (placeholderType) {
      case 'food':
        return <UtensilsCrossed className={iconClass} />
      case 'service':
        return <Scissors className={iconClass} />
      case 'product':
        return <Package className={iconClass} />
      case 'cover':
        return <Store className={iconClass} />
      case 'avatar':
        return <User className={iconClass} />
      default:
        return <ImageIcon className={iconClass} />
    }
  }

  const defaultLabel = () => {
    if (placeholderLabel) return placeholderLabel
    switch (placeholderType) {
      case 'food':
        return 'Sem foto'
      case 'service':
        return 'Serviço'
      case 'product':
        return 'Sem foto'
      case 'avatar':
        return ''
      case 'cover':
        return ''
      default:
        return 'Sem imagem'
    }
  }

  // Se não houver URL ou ocorreu erro no carregamento
  if (hasError || !normalizedSrc) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-2 text-center select-none bg-neutral-100/90 dark:bg-neutral-800/60 text-neutral-400 dark:text-neutral-500 transition-colors ${containerClassName}`}
        style={fallbackColor ? { backgroundColor: fallbackColor } : undefined}
      >
        {renderPlaceholderIcon()}
        {defaultLabel() && (
          <span className="text-[10px] font-medium leading-tight">
            {defaultLabel()}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Skeleton / Shimmer suave enquanto a imagem carrega no celular */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-200/70 dark:bg-neutral-800/80 animate-pulse pointer-events-none z-0" />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={normalizedSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          if (isImgbbErrorImage(e.currentTarget)) {
            setHasError(true)
          } else {
            setIsLoaded(true)
          }
        }}
        onError={() => {
          setHasError(true)
        }}
        className={`${className} ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={style}
        {...props}
      />
    </div>
  )
}
