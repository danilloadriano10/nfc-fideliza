'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { CompanyLoginView } from '@/components/panel/company-login-view'
import { Company } from '@/types/platform'

export default function GeneralPainelLoginPage() {
  const router = useRouter()

  const handleSuccess = (company: Company) => {
    router.push(`/painel/${company.slug}`)
  }

  return <CompanyLoginView onSuccess={handleSuccess} />
}
