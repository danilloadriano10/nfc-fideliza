import React from 'react'
import { Metadata } from 'next'
import { AdminPanelView } from '@/components/admin/admin-panel-view'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Painel Administrativo Master · DiretoLink',
  description: 'Controle de todas as empresas cadastradas, clientes, fidelidade e atividade global na plataforma DiretoLink.',
}

export default function AdminPage() {
  return <AdminPanelView />
}
