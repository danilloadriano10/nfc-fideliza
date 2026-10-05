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
  Award,
  MessageSquare,
  Radio,
  Clock,
} from 'lucide-react'
import { Company, Customer, ActivityLog, GlobalStats, PointRequest, PrivateFeedback } from '@/types/platform'
import {
  getAllCompanies,
  syncCompaniesFromServer,
  getGlobalPlatformStats,
  getAllActivityLogs,
  getAllPointRequests,
  getAllPrivateFeedbacks,
  toggleCompanyStatus,
  deleteCompany,
  deleteCompanyAsync,
  resetDemoData,
  DATA_CHANGE_EVENT,
} from '@/lib/storage'
import { formatPhone } from '@/lib/utils'
import { isAdminAuthenticated, logoutAdmin, AUTH_CHANGE_EVENT } from '@/lib/auth'
import { NewCompanyModal } from './new-company-modal'
import { AdminLoginView } from './admin-login-view'

type AdminTab = 'dashboard' | 'companies' | 'customers' | 'activity' | 'delete_company' | 'settings'

export const AdminPanelView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [companies, setCompanies] = useState<Company[]>([])
  const [requests, setRequests] = useState<PointRequest[]>([])
  const [feedbacks, setFeedbacks] = useState<PrivateFeedback[]>([])
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
    setCompanies(getAllCompanies() || [])
    setStats(getGlobalPlatformStats())
    setLogs(getAllActivityLogs() || [])
    setRequests(getAllPointRequests() || [])
    setFeedbacks(getAllPrivateFeedbacks() || [])
  }

  useEffect(() => {
    loadData()
    syncCompaniesFromServer().then(() => loadData())
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
    notify(`Status de ${name || 'empresa'} alterado com sucesso.`)
  }

  const handleDeleteCompany = async (id: string, name: string) => {
    if (
      confirm(
        `Atenção: Tem certeza que deseja EXCLUIR a empresa "${name}"? Esta ação removerá a empresa e seus registros de clientes e fidelidade permanentemente.`
      )
    ) {
      const res = await deleteCompanyAsync(id)
      if (res) {
        loadData()
        notify(`Empresa "${name}" excluída com sucesso.`)
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
    notify(`URL pública de "${name}" copiada com sucesso!`)
  }

  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados de demonstração iniciais das 3 empresas e clientes de teste?')) {
      resetDemoData()
      loadData()
      notify('Dados de demonstração restaurados!')
    }
  }

  const filteredCompanies = companies.filter((c) => {
    if (!c) return false
    if (!searchFilter.trim()) return true
    const term = searchFilter.toLowerCase().trim()
    const name = (c.name || '').toLowerCase()
    const slug = (c.slug || '').toLowerCase()
    return name.includes(term) || slug.includes(term)
  })

  const pendingRequestsCount = requests.filter((r) => r && r.status === 'pending').length
  const activeCompaniesCount = companies.filter((c) => c && c.isActive !== false).length

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
    <div className="min-h-screen bg-neutral-50/70 flex flex-col selection:bg-violet-100 selection:text-violet-900 font-sans text-neutral-900 w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toastText && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-neutral-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-violet-400" />
            <span>{toastText}</span>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-white border-b border-neutral-200/80 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: DiretoLink Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 text-xs font-semibold transition-colors shrink-0"
              title="Voltar ao site"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs">
                <Radio className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-neutral-900 leading-tight">
                  DiretoLink
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">
                  Painel Administrativo
                </span>
              </div>
            </Link>
          </div>

          {/* Zone 2: Navigation Areas */}
          <nav className="hidden lg:flex items-center gap-1 bg-neutral-100/80 p-1 rounded-2xl border border-neutral-200/70 text-xs font-medium text-neutral-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                  : 'hover:text-neutral-900'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'companies'
                  ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                  : 'hover:text-neutral-900'
              }`}
            >
              Empresas ({companies.length})
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-3 py-1.5 rounded-xl hover:text-violet-700 hover:bg-white/60 transition-all flex items-center gap-1 text-violet-600 font-semibold"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Criar Empresa</span>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'customers'
                  ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                  : 'hover:text-neutral-900'
              }`}
            >
              Clientes ({stats.totalCustomers})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'activity'
                  ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                  : 'hover:text-neutral-900'
              }`}
            >
              Atividades ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                  : 'hover:text-neutral-900'
              }`}
            >
              Configurações
            </button>
          </nav>

          {/* Zone 3: Actions & Logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nova Empresa</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-white hover:bg-red-50 hover:text-red-700 text-neutral-600 font-medium text-xs transition-all flex items-center gap-1.5 border border-neutral-200 shadow-xs"
              title="Sair do painel administrativo"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pt-2.5 max-w-7xl mx-auto border-t border-neutral-100 mt-2 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded-lg shrink-0 ${
              activeTab === 'dashboard' ? 'bg-violet-600 text-white font-medium' : 'text-neutral-600'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-2.5 py-1 rounded-lg shrink-0 ${
              activeTab === 'companies' ? 'bg-violet-600 text-white font-medium' : 'text-neutral-600'
            }`}
          >
            Empresas ({companies.length})
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-2.5 py-1 rounded-lg shrink-0 text-violet-700 font-medium bg-violet-50"
          >
            + Criar
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-2.5 py-1 rounded-lg shrink-0 ${
              activeTab === 'customers' ? 'bg-violet-600 text-white font-medium' : 'text-neutral-600'
            }`}
          >
            Clientes
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-2.5 py-1 rounded-lg shrink-0 ${
              activeTab === 'activity' ? 'bg-violet-600 text-white font-medium' : 'text-neutral-600'
            }`}
          >
            Atividades
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-2.5 py-1 rounded-lg shrink-0 ${
              activeTab === 'settings' ? 'bg-violet-600 text-white font-medium' : 'text-neutral-600'
            }`}
          >
            Configurações
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 space-y-6">
        {/* ============================================== */}
        {/* 1. VISÃO GERAL (DASHBOARD) */}
        {/* ============================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Metric Cards - Professional SaaS Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* 1. Total de Empresas */}
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="text-[11px] font-medium">Total de Empresas</span>
                  <Building2 className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <p className="text-2xl font-bold text-neutral-900 font-mono">{companies.length}</p>
                <span className="text-[10px] text-neutral-400">Cadastradas no sistema</span>
              </div>

              {/* 2. Empresas Ativas */}
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="text-[11px] font-medium">Empresas Ativas</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-emerald-600 font-mono">{activeCompaniesCount}</p>
                <span className="text-[10px] text-emerald-600 font-medium">Placas operando</span>
              </div>

              {/* 3. Clientes Cadastrados */}
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="text-[11px] font-medium">Clientes Cadastrados</span>
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-neutral-900 font-mono">{stats.totalCustomers}</p>
                <span className="text-[10px] text-neutral-400">Base total de fidelidade</span>
              </div>

              {/* 4. Solicitações de Pontos */}
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="text-[11px] font-medium">Solicitações de Pontos</span>
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-neutral-900 font-mono">{requests.length}</p>
                <span className={`text-[10px] font-medium ${pendingRequestsCount > 0 ? 'text-amber-600' : 'text-neutral-400'}`}>
                  {pendingRequestsCount} aguardando caixa
                </span>
              </div>

              {/* 5. Feedbacks */}
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="text-[11px] font-medium">Feedbacks</span>
                  <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <p className="text-2xl font-bold text-neutral-900 font-mono">{feedbacks.length}</p>
                <span className="text-[10px] text-neutral-400">Avaliações privadas</span>
              </div>

              {/* 6. Atividades Recentes */}
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="text-[11px] font-medium">Atividades</span>
                  <Activity className="w-3.5 h-3.5 text-neutral-600" />
                </div>
                <p className="text-2xl font-bold text-neutral-900 font-mono">{logs.length}</p>
                <span className="text-[10px] text-neutral-400">Registros em auditoria</span>
              </div>
            </div>

            {/* Quick Companies Showcase */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">
                    Estabelecimentos Conectados na DiretoLink
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Cada estabelecimento possui uma URL pública permanente programada em suas placas inteligentes NFC.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 font-semibold text-xs border border-violet-100 transition-colors w-fit"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Cadastrar Empresa</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {companies.map((comp) => {
                  if (!comp) return null
                  const compName = comp.name || 'Estabelecimento'
                  const compSlug = comp.slug || comp.id
                  const primaryColor = comp.primaryColor || '#6D28D9'
                  const isActive = comp.isActive !== false

                  return (
                    <div
                      key={comp.id}
                      className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/40 hover:bg-white hover:shadow-xs transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs overflow-hidden"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {comp.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={comp.logoUrl} alt={compName} className="w-full h-full object-cover" />
                            ) : (
                              compName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-neutral-900 text-sm truncate">
                              {compName}
                            </h3>
                            <span className="text-[11px] text-neutral-400 font-mono block truncate">
                              /empresa/{compSlug}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleStatus(comp.id, compName)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200'
                          }`}
                          title="Clique para alternar entre Ativo e Pausado"
                        >
                          {isActive ? 'Ativo' : 'Pausado'}
                        </button>
                      </div>

                      <div className="text-xs text-neutral-600 space-y-1 pt-1 border-t border-neutral-200/60">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400 text-[11px]">Origem:</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium text-[10px] ${
                              comp.origin === 'self_service'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                            }`}
                          >
                            {comp.origin === 'self_service'
                              ? 'Autocadastro'
                              : 'Cadastrada pelo Administrador'}
                          </span>
                        </div>
                        {comp.ownerAuth?.ownerName && (
                          <div className="flex justify-between">
                            <span className="text-neutral-400 text-[11px]">Responsável:</span>
                            <span className="font-medium truncate max-w-[140px] text-neutral-700">
                              {comp.ownerAuth.ownerName}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-neutral-400 text-[11px]">Campanha:</span>
                          <span className="font-medium truncate max-w-[150px]">
                            {comp.loyaltyProgram?.campaignName || 'Cartão Fidelidade'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400 text-[11px]">Meta de Pontos:</span>
                          <span className="font-bold font-mono text-neutral-800">
                            {comp.loyaltyProgram?.goalPoints ?? 10} pontos
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-1.5 pt-1 border-t border-neutral-200/60">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(comp)}
                            className="py-1.5 px-2 text-center rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-[11px] font-medium transition-all flex items-center justify-center gap-1 shadow-xs"
                            title="Editar dados"
                          >
                            <Edit className="w-3 h-3 text-neutral-500" />
                            <span>Editar</span>
                          </button>

                          <Link
                            href={`/empresa/${compSlug}`}
                            target="_blank"
                            className="py-1.5 px-2 text-center rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-[11px] font-medium transition-all flex items-center justify-center gap-1 shadow-xs"
                            title="Ver página pública NFC"
                          >
                            <ExternalLink className="w-3 h-3 text-neutral-500" />
                            <span>Página NFC</span>
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleCopyNfcUrl(compSlug, compName)}
                            className="py-1.5 px-2 text-center rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-[11px] font-medium transition-all flex items-center justify-center gap-1 shadow-xs"
                            title="Copiar URL"
                          >
                            <Copy className="w-3 h-3 text-neutral-500" />
                            <span>Copiar Link</span>
                          </button>

                          <Link
                            href={`/painel/${compSlug}`}
                            className="py-1.5 px-2 text-center rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold transition-all flex items-center justify-center gap-1 shadow-xs"
                            title="Acessar painel do proprietário"
                          >
                            <Store className="w-3 h-3" />
                            <span>Painel</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent Global Activity Feed */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">
                    Atividades Recentes na Plataforma
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Histórico de movimentações em tempo real dos cartões de fidelidade e resgates.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('activity')}
                  className="text-xs text-violet-700 font-semibold hover:underline"
                >
                  Ver todas as atividades →
                </button>
              </div>

              <div className="space-y-2">
                {logs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-900">{log.customerName || 'Cliente'}</span>
                        <p className="text-neutral-500 text-[11px]">{log.description || 'Movimentação'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 font-mono block">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : '-'}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-medium">{log.approvedBy || 'Sistema'}</span>
                    </div>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="text-center py-8 text-neutral-400 text-xs">
                    Nenhuma atividade registrada até o momento.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* 2. TABELA DE EMPRESAS */}
        {/* ============================================== */}
        {activeTab === 'companies' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Gerenciamento de Empresas
                </h2>
                <p className="text-xs text-neutral-500">
                  Lista completa dos estabelecimentos parceiros com acesso a links e credenciais.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar por nome ou slug..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                  />
                </div>

                <button
                  onClick={handleOpenCreate}
                  className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Criar Empresa</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Empresa</th>
                    <th className="py-3 px-3">URL Pública (NFC)</th>
                    <th className="py-3 px-3">Login do Proprietário</th>
                    <th className="py-3 px-3">Fidelidade</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredCompanies.map((c) => {
                    if (!c) return null
                    const compName = c.name || 'Sem Nome'
                    const compSlug = c.slug || c.id
                    const primaryColor = c.primaryColor || '#6D28D9'
                    const isActive = c.isActive !== false

                    return (
                      <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-xs overflow-hidden"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {c.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={c.logoUrl} alt={compName} className="w-full h-full object-cover" />
                              ) : (
                                compName.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-neutral-900 block">{compName}</span>
                              <span className="text-[10px] text-neutral-400">{formatPhone(c.whatsapp) || 'Sem telefone'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-neutral-600">
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-700">/empresa/{compSlug}</span>
                            <button
                              onClick={() => handleCopyNfcUrl(compSlug, compName)}
                              className="p-1 rounded hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 transition-colors"
                              title="Copiar URL NFC"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="bg-neutral-100/70 px-2.5 py-1.5 rounded-lg border border-neutral-200 font-mono text-[11px] space-y-0.5 max-w-[200px]">
                            <div className="text-neutral-800 flex items-center gap-1">
                              <span className="text-[9px] text-neutral-400 uppercase font-medium">User:</span>
                              <span className="font-bold truncate">{c.ownerAuth?.username || compSlug}</span>
                            </div>
                            <div className="text-neutral-800 flex items-center gap-1">
                              <span className="text-[9px] text-neutral-400 uppercase font-medium">Senha:</span>
                              <span className="font-semibold">{c.ownerAuth?.password || '••••••'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-neutral-600">
                          {c.loyaltyProgram?.isActive ? (
                            <span>
                              {c.loyaltyProgram?.goalPoints ?? 10} pts · {c.loyaltyProgram?.rewardDescription || 'Recompensa'}
                            </span>
                          ) : (
                            <span className="text-neutral-400">Desativada</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleToggleStatus(c.id, compName)}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                            }`}
                            title="Alternar status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                            <span>{isActive ? 'Ativo' : 'Pausado'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="px-2 py-1 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-[11px] font-medium transition-colors flex items-center gap-1 shadow-xs"
                              title="Editar"
                            >
                              <Edit className="w-3 h-3 text-neutral-500" />
                              <span>Editar</span>
                            </button>

                            <Link
                              href={`/empresa/${compSlug}`}
                              target="_blank"
                              className="px-2 py-1 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-[11px] font-medium transition-colors flex items-center gap-1 shadow-xs"
                              title="Ver página pública"
                            >
                              <ExternalLink className="w-3 h-3 text-neutral-500" />
                              <span>Página</span>
                            </Link>

                            <Link
                              href={`/painel/${compSlug}`}
                              className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
                              title="Painel do Proprietário"
                            >
                              <Store className="w-3 h-3" />
                              <span>Painel</span>
                            </Link>

                            <button
                              onClick={() => handleDeleteCompany(c.id, compName)}
                              className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-colors"
                              title="Excluir empresa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* 3. CLIENTES CONSOLIDADOS */}
        {/* ============================================== */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Gestão Consolidada de Clientes
              </h2>
              <p className="text-xs text-neutral-500">
                Cada empresa possui sua base independente de clientes cadastrados por WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((comp) => {
                if (!comp) return null
                const compName = comp.name || 'Empresa'
                const compSlug = comp.slug || comp.id
                const primaryColor = comp.primaryColor || '#6D28D9'

                return (
                  <div key={comp.id} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {compName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-neutral-900 text-xs">
                          {compName}
                        </span>
                      </div>
                      <Link
                        href={`/painel/${compSlug}`}
                        className="text-xs text-violet-700 hover:text-violet-800 font-semibold flex items-center gap-1"
                      >
                        <span>Acessar Painel</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Gerencie a lista de clientes, saldo de pontos e histórico de validações no painel individual da empresa.
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* 4. ATIVIDADES GLOBAIS */}
        {/* ============================================== */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Trilha de Auditoria e Atividades
                </h2>
                <p className="text-xs text-neutral-500">
                  Histórico completo de pontos adicionados, resgates e ações de caixa registradas no sistema.
                </p>
              </div>
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-xl">
                {logs.length} registros
              </span>
            </div>

            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-900">{log.customerName || 'Cliente'}</span>
                      <p className="text-neutral-600 text-[11px]">{log.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 font-mono block">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : '-'}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-medium">{log.approvedBy || 'Sistema'}</span>
                  </div>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  Nenhuma atividade registrada até o momento.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* 5. CONFIGURAÇÕES DA PLATAFORMA */}
        {/* ============================================== */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-6 max-w-3xl">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Configurações da Plataforma DiretoLink
              </h2>
              <p className="text-xs text-neutral-500">
                Gerencie parâmetros centrais e dados de demonstração da plataforma multiempresa.
              </p>
            </div>

            {/* Informações da Plataforma */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2">
              <h4 className="text-xs font-bold text-neutral-900">Sobre o DiretoLink</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Plataforma SaaS que conecta estabelecimentos comerciais aos seus clientes por aproximação física NFC e QR Code inteligente, com fidelização, avaliações Google 5 estrelas e conexão Wi-Fi.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-500">
                <span className="font-semibold text-violet-700">Conceito:</span>
                <span>Um toque conecta o cliente à empresa.</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                <span className="font-semibold text-violet-700">Assinatura:</span>
                <span>Aproxime. Conecte. Pronto.</span>
              </div>
            </div>

            {/* Reset Demo Data */}
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
              <div>
                <h4 className="font-bold text-xs text-amber-900">
                  Restaurar Estabelecimentos de Demonstração
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Recarrega os 3 estabelecimentos padrão (Café Central, Barbearia Júnior, Pizzaria Bella Italia) e clientes de teste para demonstrações comerciais.
                </p>
              </div>

              <button
                onClick={handleResetData}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all"
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
