'use client'

import React from 'react'

interface InstagramSectionProps {
  instagramHandle: string
  companyName: string
}

export const InstagramSection: React.FC<InstagramSectionProps> = ({
  instagramHandle,
  companyName,
}) => {
  if (!instagramHandle || !instagramHandle.trim()) return null

  // Clean handle dynamically from this company's saved data
  // Strips "@", "https://instagram.com/", query parameters, trailing slashes
  const raw = instagramHandle.trim()
  const cleanHandle = raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .split('/')[0]
    .split('?')[0]
    .trim()

  if (!cleanHandle) return null

  // Direct universal URL for the establishment's profile
  // On iOS and Android, this directly opens the target profile in the Instagram app
  // On desktop or browser, it opens the target profile in a new tab
  const targetProfileUrl = `https://www.instagram.com/${cleanHandle}/`

  const handleInstagramClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.open(targetProfileUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="pt-6 pb-8 text-center space-y-3">
      <div className="flex items-center justify-center gap-3">
        <div className="h-px bg-neutral-200 flex-1 max-w-[80px]" />
        <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
          Siga-nos no Instagram
        </span>
        <div className="h-px bg-neutral-200 flex-1 max-w-[80px]" />
      </div>

      <div className="flex flex-col items-center justify-center">
        <a
          href={targetProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleInstagramClick}
          aria-label={`Seguir ${companyName} (@${cleanHandle}) no Instagram`}
          className="group relative flex items-center justify-center w-16 h-16 rounded-2xl p-0.5 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] hover:scale-105"
        >
          <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center group-hover:bg-transparent transition-colors">
            {/* Recognizable Instagram Glyph SVG */}
            <svg
              className="w-8 h-8 text-[#e1306c] group-hover:text-white transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </div>
        </a>

        <a
          href={targetProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 mt-2 block hover:underline"
        >
          @{cleanHandle}
        </a>
      </div>
    </div>
  )
}
