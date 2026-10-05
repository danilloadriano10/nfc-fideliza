'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLoginView } from '@/components/admin/admin-login-view'
import { isAdminAuthenticated } from '@/lib/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // If already authenticated in this session, go directly to /admin
    if (isAdminAuthenticated()) {
      router.replace('/admin')
    } else {
      setChecking(false)
    }
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AdminLoginView
      onSuccess={() => {
        router.replace('/admin')
      }}
    />
  )
}
