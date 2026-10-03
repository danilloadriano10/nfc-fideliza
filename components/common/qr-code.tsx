'use client'

import React, { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeViewProps {
  value: string
  size?: number
  className?: string
  colorDark?: string
  colorLight?: string
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 180,
  className = '',
  colorDark = '#000000',
  colorLight = '#ffffff',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 1,
        color: {
          dark: colorDark,
          light: colorLight,
        },
      },
      (error) => {
        if (error) console.error('Error rendering QR code:', error)
      }
    )
  }, [value, size, colorDark, colorLight])

  return (
    <div className={`flex items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-neutral-100 ${className}`}>
      <canvas ref={canvasRef} className="rounded-lg max-w-full h-auto" />
    </div>
  )
}
