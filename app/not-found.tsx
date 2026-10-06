'use client'

import React from 'react'
import Link from 'next/link'
import { Radio, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center p-4 text-center selection:bg-violet-100 selection:text-violet-900 font-sans">
      <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center mx-auto shadow-xs mb-4">
        <Radio className="w-6 h-6 stroke-[2.5]" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900">Página Não Encontrada</h1>
      <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-6">
        O link que você tentou acessar não existe ou o estabelecimento foi alterado.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao DiretoLink</span>
      </Link>
    </div>
  )
}
