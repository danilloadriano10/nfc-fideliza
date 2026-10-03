'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  Settings,
  Plus,
  ExternalLink,
  SlidersHorizontal,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Store,
  Copy,
  ChevronRight,
  Edit,
  Trash2,
  LogOut,
  ShieldCheck,
  KeyRound,
  Lock,
  ArrowLeft,
  Gift,
} from 'lucide-react'
import { Company, Customer, ActivityLog, GlobalStats } from '@/types/platform'
import {
  getAllCompanies,
  getGlobalPlatformStats,
  getAllActivityLogs,
  toggleCompanyStatus,
  deleteCompany,
  resetDemoData,
  DATA_CHANGE_EVENT,
} from '@/lib/storage'
import { formatPhone } from '@/lib/utils'
import { isAdminAuthenticated, logoutAdmin, AUTH_CHANGE_EVENT } from '@/lib/auth'
import { NewCompanyModal } from './new-company-modal'
import { AdminLoginView } from './admin-login-view'

type AdminTab = 'dashboard' | 'companies' | 'customers' | 'activity' | 'settings'

export const AdminPanelView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [companies, setCompanies] = useState<Company[]>([])
  const [stats, setStats] = useState<GlobalStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    totalCustomers: 0,
    totalPointsDistributed: 0,
    totalRewardsEarned: 0,
    totalRewardsRedeemed: 0,
  })
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [searchFilter, setSearchFilter] = useState('')
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [toastText, setToastText] = useState<string | null>(null)

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? isAdminAuthenticated() : false
  })

  const loadData = () => {
    setCompanies(getAllCompanies())
    setStats(getGlobalPlatformStats())
    setLogs(getAllActivityLogs())
  }

  useEffect(() => {
    loadData()
    const handleAuth = () => {
      setIsAuthenticated(isAdminAuthenticated())
    }

    window.addEventListener(DATA_CHANGE_EVENT, loadData)
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuth)
    window.addEventListener('storage', loadData)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, loadData)
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuth)
      window.removeEventListener('storage', loadData)
    }
  }, [])

  const notify = (msg: string) => {
    setToastText(msg)
    setTimeout(() => setToastText(null), 3500)
  }

  const handleLogout = () => {
    logoutAdmin()
    setIsAuthenticated(false)
    notify('Sessão encerrada com sucesso.')
  }

  const handleToggleStatus = (id: string, name: string) => {
    toggleCompanyStatus(id)
    loadData()
    notify(`Status de ${name} alterado com sucesso.`)
  }

  const handleDeleteCompany = (id: string, name: string) => {
    if (confirm(`Atenção: Tem certeza que deseja EXCLUIR a empresa "${name}"? Esta ação removerá a empresa e todos os seus registros de clientes e fidelidade.`)) {
      const res = deleteCompany(id)
      if (res) {
        loadData()
        notify(`Empresa "${name}" excluída do sistema.`)
      }
    }
  }

  const handleOpenEdit = (comp: Company) => {
    setEditingCompany(comp)
    setIsNewModalOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingCompany(null)
    setIsNewModalOpen(true)
  }

  const handleCopyNfcUrl = (slug: string, name: string) => {
    const url = `${window.location.origin}/empresa/${slug}`
    navigator.clipboard.writeText(url)
    notify(`URL NFC de "${name}" copiada com sucesso!`)
  }

  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados de demonstração iniciais das 3 empresas e clientes de teste?')) {
      resetDemoData()
      loadData()
      notify('Dados de demonstração restaurados!')
    }
  }

  const filteredCompanies = companies.filter((c) => {
    if (!searchFilter.trim()) return true
    const term = searchFilter.toLowerCase().trim()
    return c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)
  })

  if (!isAuthenticated) {
    return (
      <AdminLoginView
        onSuccess={() => {
          setIsAuthenticated(true)
          loadData()
          notify('Acesso de Administrador confirmado.')
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col selection:bg-neutral-900 selection:text-white">
      {/* Toast */}
      {toastText && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-neutral-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastText}</span>
          </div>
        </div>
      )}

      {/* Top Bar Contract (1-row 3-zones) */}
      <header className="bg-white border-b border-neutral-200/80 px-4 sm:px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Zone 1: Back to home + Brand title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors shrink-0"
              title="Voltar à página inicial"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">← Voltar</span>
            </Link>

            <Link href="/admin" className="text-base font-bold tracking-tight text-neutral-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>NFC Fideliza Admin</span>
            </Link>
          </div>

          {/* Zone 2: Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-neutral-900 transition-colors ${activeTab === 'dashboard' ? 'text-neutral-900 underline underline-offset-8 font-bold' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`hover:text-neutral-900 transition-colors ${activeTab === 'companies' ? 'text-neutral-900 underline underline-offset-8 font-bold' : ''}`}
            >
              Empresas ({companies.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`hover:text-neutral-900 transition-colors ${activeTab === 'customers' ? 'text-neutral-900 underline underline-offset-8 font-bold' : ''}`}
            >
              Clientes ({stats.totalCustomers})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`hover:text-neutral-900 transition-colors ${activeTab === 'activity' ? 'text-neutral-900 underline underline-offset-8 font-bold' : ''}`}
            >
              Atividade Global
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`hover:text-neutral-900 transition-colors ${activeTab === 'settings' ? 'text-neutral-900 underline underline-offset-8 font-bold' : ''}`}
            >
              Configurações
            </button>
          </nav>

          {/* Zone 3: Primary Action & Logout */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin Geral</span>
            </div>

            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Nova Empresa</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-red-50 hover:text-red-700 text-neutral-600 font-semibold text-xs transition-all flex items-center gap-1.5 border border-neutral-200"
              title="Sair do painel administrativo"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto pt-3 border-t border-neutral-100 mt-2">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'companies', label: `Empresas (${companies.length})` },
            { id: 'customers', label: `Clientes (${stats.totalCustomers})` },
            { id: 'activity', label: 'Atividade' },
            { id: 'settings', label: 'Configurações' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as AdminTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === t.id ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 space-y-6">
        {/* ============================================== */}
        {/* 1. DASHBOARD */}
        {/* ============================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm">
                <span className="text-[11px] text-neutral-500 font-medium">Total de Empresas</span>
                <p className="text-2xl font-bold text-neutral-900 font-mono mt-1">{stats.totalCompanies}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm">
                <span className="text-[11px] text-neutral-500 font-medium">Empresas Ativas</span>
                <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">{stats.activeCompanies}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm">
                <span className="text-[11px] text-neutral-500 font-medium">Total de Clientes</span>
                <p className="text-2xl font-bold text-neutral-900 font-mono mt-1">{stats.totalCustomers}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm">
                <span className="text-[11px] text-neutral-500 font-medium">Total de Pontos</span>
                <p className="text-2xl font-bold text-amber-600 font-mono mt-1">{stats.totalPointsDistributed}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm">
                <span className="text-[11px] text-neutral-500 font-medium">Recompensas Liberadas</span>
                <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">{stats.totalRewardsEarned}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm">
                <span className="text-[11px] text-neutral-500 font-medium">Recompensas Resgatadas</span>
                <p className="text-2xl font-bold text-purple-600 font-mono mt-1">{stats.totalRewardsRedeemed}</p>
              </div>
            </div>

            {/* Quick Companies Grid Showcase */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Estabelecimentos Cadastrados na Plataforma
                </h2>
                <p className="text-xs text-neutral-500">
                  Cada estabelecimento possui uma URL pública permanente programada no chip NFC.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {companies.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                          style={{ backgroundColor: comp.primaryColor }}
                        >
                          {comp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-neutral-900 text-sm truncate">
                            {comp.name}
                          </h3>
                          <span className="text-[11px] text-neutral-400 font-mono block truncate">
                            /empresa/{comp.slug}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(comp.id, comp.name)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                          comp.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                        }`}
                        title="Clique para alternar entre Ativo e Pausado"
                      >
                        {comp.isActive ? 'Ativo' : 'Pausado'}
                      </button>
                    </div>

                    <div className="text-xs text-neutral-600 space-y-1 pt-1 border-t border-neutral-200/60">
                      <div className="flex justify-between">
                        <span className="text-neutral-400 text-[11px]">Campanha:</span>
                        <span className="font-medium truncate max-w-[150px]">{comp.loyaltyProgram.campaignName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400 text-[11px]">Meta:</span>
                        <span className="font-bold font-mono text-neutral-800">{comp.loyaltyProgram.goalPoints} pontos</span>
                      </div>
                    </div>

                    {/* 5 required actions */}
                    <div className="space-y-1.5 pt-1 border-t border-neutral-200/60">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(comp)}
                          className="py-1.5 px-2 text-center rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
                          title="Editar estabelecimento"
                        >
                          <Edit className="w-3 h-3 text-neutral-600" />
                          <span>Editar</span>
                        </button>

                        <Link
                          href={`/empresa/${comp.slug}`}
                          target="_blank"
                          className="py-1.5 px-2 text-center rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
                          title="Ver página pública NFC"
                        >
                          <ExternalLink className="w-3 h-3 text-neutral-600" />
                          <span>Página NFC</span>
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleCopyNfcUrl(comp.slug, comp.name)}
                          className="py-1.5 px-2 text-center rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
                          title="Copiar URL permanente da placa NFC"
                        >
                          <Copy className="w-3 h-3 text-neutral-600" />
                          <span>Copiar URL</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(comp.id, comp.name)}
                          className={`py-1.5 px-2 text-center rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                            comp.isActive ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                          title="Ativar ou pausar empresa"
                        >
                          <span>{comp.isActive ? 'Pausar' : 'Ativar'}</span>
                        </button>
                      </div>

                      <Link
                        href={`/painel/${comp.slug}`}
                        className="w-full py-1.5 px-2 text-center rounded-lg bg-neutral-900 text-white text-[11px] font-semibold hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5"
                        title="Acessar gestão de fidelidade e clientes da empresa"
                      >
                        <Gift className="w-3 h-3 text-amber-400" />
                        <span>Gerenciar Fidelidade</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Global Activity Feed */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 text-sm">
                  Atividade Recente em Todas as Empresas
                </h3>
                <span className="text-xs text-neutral-400 font-mono">Auditoria multi-tenant</span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-6 text-center">Nenhum evento registrado.</p>
                ) : (
                  logs.slice(0, 15).map((log) => {
                    const comp = companies.find((c) => c.id === log.companyId)

                    return (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-between text-xs gap-3"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900">{log.customerName}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">{formatPhone(log.customerPhone)}</span>
                            {comp && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">
                                {comp.name}
                              </span>
                            )}
                          </div>
                          <p className="text-neutral-600 text-[11px] truncate">{log.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-medium">{log.approvedBy}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* 2. EMPRESAS (TABELA COMPLETA) */}
        {/* ============================================== */}
        {activeTab === 'companies' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Gerenciamento de Estabelecimentos
                </h2>
                <p className="text-xs text-neutral-500">
                  Controle total sobre as empresas parceiras e suas páginas NFC.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar por nome ou slug..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Empresa</th>
                    <th className="py-3 px-3">URL Slug (NFC)</th>
                    <th className="py-3 px-3">Login do Proprietário</th>
                    <th className="py-3 px-3">Fidelidade</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Ações do Administrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredCompanies.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-sm"
                            style={{ backgroundColor: c.primaryColor }}
                          >
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 block">{c.name}</span>
                            <span className="text-[10px] text-neutral-400">{formatPhone(c.whatsapp)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-700">/empresa/{c.slug}</span>
                          <button
                            onClick={() => handleCopyNfcUrl(c.slug, c.name)}
                            className="p-1 rounded hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 transition-colors"
                            title="Copiar URL NFC"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200/80 font-mono text-[11px] space-y-0.5 max-w-[200px]">
                          <div className="text-amber-900 flex items-center gap-1">
                            <span className="text-[9px] text-neutral-500 uppercase font-medium">User:</span>
                            <span className="font-bold truncate">{c.ownerAuth?.username || c.slug}</span>
                          </div>
                          <div className="text-amber-900 flex items-center gap-1">
                            <span className="text-[9px] text-neutral-500 uppercase font-medium">Senha:</span>
                            <span className="font-semibold">{c.ownerAuth?.password || 'empresa123'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-600">
                        {c.loyaltyProgram.isActive ? (
                          <span>{c.loyaltyProgram.goalPoints} pts · {c.loyaltyProgram.rewardDescription}</span>
                        ) : (
                          <span className="text-neutral-400">Desativada</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleStatus(c.id, c.name)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
                            c.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                          }`}
                          title="Clique para pausar ou ativar"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
                          <span>{c.isActive ? 'Ativo' : 'Pausado'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Editar dados da empresa, fotos ou credenciais"
                          >
                            <Edit className="w-3 h-3 text-neutral-600" />
                            <span>Editar</span>
                          </button>

                          <Link
                            href={`/empresa/${c.slug}`}
                            target="_blank"
                            className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Ver página pública aberta pelo chip NFC"
                          >
                            <ExternalLink className="w-3 h-3 text-neutral-600" />
                            <span>Ver Página</span>
                          </Link>

                          <button
                            onClick={() => handleCopyNfcUrl(c.slug, c.name)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Copiar link permanente da placa NFC"
                          >
                            <Copy className="w-3 h-3 text-neutral-600" />
                            <span>Copiar NFC</span>
                          </button>

                          <Link
                            href={`/painel/${c.slug}`}
                            className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Gerenciar programa de fidelidade e clientes da empresa"
                          >
                            <Gift className="w-3 h-3 text-amber-400" />
                            <span>Fidelidade</span>
                          </Link>

                          <button
                            onClick={() => handleDeleteCompany(c.id, c.name)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Excluir empresa permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* 3. CLIENTES CONSOLIDADOS */}
        {/* ============================================== */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Visão Geral dos Clientes no Sistema
              </h2>
              <p className="text-xs text-neutral-500">
                Lembrete da Regra de Negócio: O mesmo número de WhatsApp pode ter cadastros independentes em empresas distintas, mas jamais duplicado dentro do mesmo estabelecimento.
              </p>
            </div>

            <div className="space-y-3">
              {companies.map((comp) => (
                <div key={comp.id} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 text-xs">
                      {comp.name}
                    </span>
                    <Link
                      href={`/painel/${comp.slug}`}
                      className="text-[11px] text-neutral-600 hover:text-neutral-900 underline"
                    >
                      Gerenciar clientes desta empresa →
                    </Link>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Acesse o painel individual da empresa para visualizar e buscar todos os clientes com isolamento seguro de dados.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* 4. ATIVIDADE GLOBAL */}
        {/* ============================================== */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900">
              Trilha de Auditoria e Atividades Globais
            </h2>
            <div className="space-y-2.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-neutral-900">{log.customerName}</span>
                    <p className="text-neutral-600 text-[11px]">{log.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 font-mono block">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-neutral-500">{log.approvedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* 5. CONFIGURAÇÕES DA PLATAFORMA */}
        {/* ============================================== */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Configurações da Plataforma Multi-Tenant
              </h2>
              <p className="text-xs text-neutral-500">
                Gerencie parâmetros centrais e restaure os dados de demonstração a qualquer momento.
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
              <div>
                <h4 className="font-bold text-xs text-amber-900">
                  Restaurar Dados de Demonstração
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Recarrega os 3 estabelecimentos padrão (Café Central, Barbearia Júnior, Pizzaria Bella Italia) e os clientes com pontos e recompensas para testes.
                </p>
              </div>

              <button
                onClick={handleResetData}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Dados Iniciais de Demonstração</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* New / Edit Company Modal */}
      <NewCompanyModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false)
          setEditingCompany(null)
        }}
        onCreated={() => {
          loadData()
          setIsNewModalOpen(false)
          setEditingCompany(null)
          notify(editingCompany ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!')
        }}
        companyToEdit={editingCompany}
      />
    </div>
  )
}
