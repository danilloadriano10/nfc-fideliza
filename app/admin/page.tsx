import React from 'react'
import { Metadata } from 'next'
import { AdminPanelView } from '@/components/admin/admin-panel-view'

export const metadata: Metadata = {
  title: 'Painel Administrador Geral · NFC Fideliza',
  description: 'Controle de todas as empresas cadastradas, clientes, fidelidade e atividade global.',
}

export default function AdminPage() {
  return <AdminPanelView />
}
