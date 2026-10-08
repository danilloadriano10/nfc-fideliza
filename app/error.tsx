'use client'

import React, { useEffect } from 'react'

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // If it's a ChunkLoadError, trigger a fresh page reload
    if (
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk')
    ) {
      try {
        const key = '_chunk_retry_ts'
        const last = sessionStorage.getItem(key)
        const now = Date.now()
        if (!last || now - parseInt(last, 10) > 8000) {
          sessionStorage.setItem(key, String(now))
          window.location.reload()
          return
        }
      } catch {}
    }
  }, [error])

  const isChunkError =
    error?.name === 'ChunkLoadError' ||
    error?.message?.includes('ChunkLoadError') ||
    error?.message?.includes('Loading chunk')

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6 bg-white text-neutral-900 font-sans">
      <div className="max-w-md w-full bg-neutral-50 rounded-3xl p-6 border border-neutral-200 text-center space-y-4">
        <h2 className="text-base font-bold text-neutral-900">
          {isChunkError ? 'Atualizando recursos do aplicativo...' : 'Ocorreu um erro inesperado'}
        </h2>
        <p className="text-xs text-neutral-500">
          {isChunkError
            ? 'Uma nova versão foi carregada. Clique para recarregar.'
            : 'Clique no botão abaixo para tentar novamente.'}
        </p>
        <button
          type="button"
          onClick={() => {
            if (isChunkError) {
              window.location.reload()
            } else {
              reset()
            }
          }}
          className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          {isChunkError ? 'Recarregar página' : 'Tentar novamente'}
        </button>
      </div>
    </div>
  )
}
