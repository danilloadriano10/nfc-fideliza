'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  Gift,
  Award,
  MessageSquare,
  SlidersHorizontal,
  Settings,
  ExternalLink,
  Search,
  Check,
  X,
  Plus,
  Star,
  Phone,
  Calendar,
  Lock,
  Wifi,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowLeft,
  ArrowRight,
  Store,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Upload,
  ImageIcon,
  Trash2,
  Sparkles,
  Scissors,
  Layers,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import {
  Company,
  Customer,
  ActivityLog,
  PrivateFeedback,
  WifiSecurity,
  PointRequest,
} from '@/types/platform'
import {
  getCompanyCustomers,
  getCompanyServices,
  getCompanyActivityLogs,
  getCompanyFeedbacks,
  fetchFeedbacksForCompany,
  fetchCompanyCustomersFromServer,
  saveCompany,
  directAddPoint,
  redeemReward,
  toggleCompanyStatus,
  DATA_CHANGE_EVENT,
  fetchCompanyRequestsFromServer,
  approvePointRequestOnServerApi,
  rejectPointRequestOnServerApi,
} from '@/lib/storage'
import { uploadCompanyImageFromClient } from '@/lib/storage-client'
import { formatPhone, normalizePhone } from '@/lib/utils'
import { QRCodeView } from '@/components/common/qr-code'
import { isOwnerAuthenticated, logoutOwner, AUTH_CHANGE_EVENT } from '@/lib/auth'
import { CompanyLoginView } from './company-login-view'
import { CompanyOnboardingModal } from './company-onboarding-modal'
import { ServicesTab } from './services-tab'

const PRESET_BANNERS = [
  { label: '☕ Cafeteria / Café', url: '/images/cafe_central_banner_1791003956057.jpg' },
  { label: '✂️ Barbearia / Estilo', url: '/images/barbearia_banner_1791003968071.jpg' },
  { label: '🍕 Pizzaria / Restaurante', url: '/images/pizzaria_banner_1791003982257.jpg' },
]

interface CompanyPanelViewProps {
  initialCompany: Company
}

type TabType =
  | 'dashboard'
  | 'services'
  | 'customers'
  | 'loyalty'
  | 'rewards'
  | 'feedbacks'
  | 'settings'

export const CompanyPanelView: React.FC<CompanyPanelViewProps> = ({
  initialCompany,
}) => {
  const [company, setCompany] = useState<Company>(initialCompany)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [feedbacks, setFeedbacks] = useState<PrivateFeedback[]>([])
  const [pendingRequests, setPendingRequests] = useState<PointRequest[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(
    () => initialCompany.onboardingCompleted === false
  )

  // Settings form state
  const [formData, setFormData] = useState<Company>(() => ({
    ...initialCompany,
    modules: {
      ...initialCompany.modules,
      services: initialCompany.modules?.services ?? false,
    },
    loyaltyProgram: initialCompany.loyaltyProgram || {
      isActive: true,
      goalPoints: 10,
      rewardDescription: 'Recompensa de Fidelidade',
      campaignName: 'Cartão Fidelidade',
    },
  }))
  const [isSaving, setIsSaving] = useState(false)

  // Visual identity (Logo & Cover) states
  const [logoPreview, setLogoPreview] = useState<string>(initialCompany.logoUrl || '')
  const [coverPreview, setCoverPreview] = useState<string>(
    initialCompany.coverUrl || '/images/cafe_central_banner_1791003956057.jpg'
  )
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload')
  const [coverMode, setCoverMode] = useState<'upload' | 'presets' | 'url'>('upload')

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const tempUrl = URL.createObjectURL(file)
    setLogoPreview(tempUrl)
    setIsUploadingLogo(true)

    const res = await uploadCompanyImageFromClient(company.id, 'logo', file)
    setIsUploadingLogo(false)

    if (res.success && res.url) {
      const validUrl = res.url
      setFormData((prev) => ({ ...prev, logoUrl: validUrl }))
      setLogoPreview(validUrl)
      showToast('success', 'Foto da logo atualizada com sucesso!')
    } else {
      showToast('error', res.error || 'Erro ao enviar foto da logo.')
    }
  }

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const tempUrl = URL.createObjectURL(file)
    setCoverPreview(tempUrl)
    setIsUploadingCover(true)

    const res = await uploadCompanyImageFromClient(company.id, 'cover', file)
    setIsUploadingCover(false)

    if (res.success && res.url) {
      const validUrl = res.url
      setFormData((prev) => ({ ...prev, coverUrl: validUrl }))
      setCoverPreview(validUrl)
      showToast('success', 'Foto de capa atualizada com sucesso!')
    } else {
      showToast('error', res.error || 'Erro ao enviar foto de capa.')
    }
  }

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: '' }))
    setLogoPreview('')
    showToast('success', 'Foto da logo removida.')
  }

  const handleResetCover = () => {
    const defaultCover = '/images/cafe_central_banner_1791003956057.jpg'
    setFormData((prev) => ({ ...prev, coverUrl: defaultCover }))
    setCoverPreview(defaultCover)
    showToast('success', 'Foto de capa redefinida para o padrão.')
  }

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? isOwnerAuthenticated(initialCompany.id) : false
  })

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(isOwnerAuthenticated(company.id))
    }
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
    window.addEventListener('storage', handleAuthChange)
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
      window.removeEventListener('storage', handleAuthChange)
    }
  }, [company.id])

  const handleLogout = () => {
    logoutOwner(company.id)
    setIsAuthenticated(false)
  }

  const loadData = React.useCallback(() => {
    setCustomers(getCompanyCustomers(company.id))
    setLogs(getCompanyActivityLogs(company.id))
    setFeedbacks(getCompanyFeedbacks(company.id))
    fetchCompanyRequestsFromServer(company.id, 'pending').then((reqs) => {
      if (Array.isArray(reqs)) setPendingRequests(reqs)
    })
    fetchCompanyCustomersFromServer(company.id).then((custs) => {
      if (Array.isArray(custs)) setCustomers(custs)
    })
  }, [company.id])

  // Live polling for requests every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const fresh = await fetchCompanyRequestsFromServer(company.id, 'pending')
        if (Array.isArray(fresh)) {
          setPendingRequests(fresh)
        }
      } catch (err) {
        console.warn('Silent polling error in CompanyPanelView:', err)
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [company.id])

  const handleApproveRequest = async (req: PointRequest) => {
    const res = await approvePointRequestOnServerApi(req.id, 'Painel do Estabelecimento')
    if (res.success) {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } })
      showToast('success', `+1 Ponto confirmado para ${req.customerName}!`)
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id))
      loadData()
    } else {
      showToast('error', res.error || 'Erro ao aprovar solicitação.')
    }
  }

  const handleRejectRequest = async (req: PointRequest) => {
    const res = await rejectPointRequestOnServerApi(req.id, 'Painel do Estabelecimento')
    if (res.success) {
      showToast('error', `Solicitação de ${req.customerName} recusada.`)
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id))
      loadData()
    } else {
      showToast('error', res.error || 'Erro ao recusar solicitação.')
    }
  }

  useEffect(() => {
    loadData()

    fetchFeedbacksForCompany(company.id)
      .then((fresh) => {
        if (Array.isArray(fresh)) {
          setFeedbacks(fresh)
        }
      })
      .catch((err) => {
        console.warn('Error loading feedbacks:', err)
      })

    window.addEventListener(DATA_CHANGE_EVENT, loadData)
    window.addEventListener('storage', loadData)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, loadData)
      window.removeEventListener('storage', loadData)
    }
  }, [company.id, loadData])

  useEffect(() => {
    if (activeTab === 'feedbacks') {
      fetchFeedbacksForCompany(company.id)
        .then((fresh) => {
          if (Array.isArray(fresh)) {
            setFeedbacks(fresh)
          }
        })
        .catch(() => {})
    }
  }, [activeTab, company.id])

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleCopyNfcUrl = () => {
    const fullUrl = `${window.location.origin}/empresa/${company.slug}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
    showToast('success', 'URL da placa NFC copiada!')
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const res = saveCompany(formData)
    setIsSaving(false)

    if (res.success) {
      setCompany(formData)
      showToast(
        'success',
        'Configurações salvas com sucesso! A URL da sua placa NFC permanece exatamente a mesma.'
      )
    } else {
      showToast('error', res.error || 'Erro ao salvar configurações.')
    }
  }

  const handleToggleActive = () => {
    const updated = { ...company, isActive: !company.isActive }
    saveCompany(updated)
    setCompany(updated)
    setFormData(updated)
    showToast(
      'success',
      `Estabelecimento ${updated.isActive ? 'ativado' : 'desativado'} com sucesso.`
    )
  }

  // Cashier quick actions within panel
  const handleQuickAddPoint = (customerId: string, name: string) => {
    const res = directAddPoint(company.id, customerId, 'Painel Administrativo')
    if (res.success) {
      confetti({ particleCount: 40, spread: 40, origin: { y: 0.6 } })
      showToast('success', `+1 Ponto creditado para ${name}`)
      loadData()
    } else {
      showToast('error', res.error || 'Erro ao creditar ponto.')
    }
  }

  const handleQuickRedeem = (customerId: string, name: string) => {
    const res = redeemReward(company.id, customerId, 'Gerente / Painel')
    if (res.success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } })
      showToast('success', `🎁 Recompensa resgatada para ${name}! Novo ciclo iniciado.`)
      loadData()
    } else {
      showToast('error', res.error || 'Erro ao resgatar recompensa.')
    }
  }

  // Metrics
  const totalCustomers = customers.length
  const servicesCount = getCompanyServices(company.id).length
  const totalPoints = logs.reduce((acc, l) => acc + (l.pointsChange || 0), 0)
  const rewardsAvailable = customers.reduce((acc, c) => acc + c.availableRewards, 0)
  const rewardsRedeemed = logs.filter((l) => l.type === 'reward_redeemed').length
  const totalFeedbacks = feedbacks.length
  const goal = company.loyaltyProgram?.goalPoints || 10

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true
    const term = customerSearch.toLowerCase().trim()
    const norm = normalizePhone(term)
    return c.name.toLowerCase().includes(term) || c.phone.includes(norm || term)
  })

  const nfcUrl = typeof window !== 'undefined' ? `${window.location.origin}/empresa/${company.slug}` : `/empresa/${company.slug}`

  if (!isAuthenticated) {
    return (
      <CompanyLoginView
        company={company}
        onSuccess={() => {
          setIsAuthenticated(true)
          showToast('success', `Bem-vindo ao Painel de ${company.name}`)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50/70 flex flex-col selection:bg-violet-100 selection:text-violet-900 font-sans text-neutral-900 w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border ${
              toastMessage.type === 'success'
                ? 'bg-neutral-900 text-white border-neutral-800'
                : 'bg-red-900 text-white border-red-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-violet-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200/80 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/painel"
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 text-xs font-semibold transition-colors shrink-0"
              title="Voltar ao portal de seleção"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 overflow-hidden"
                style={{ backgroundColor: company.primaryColor || '#6D28D9' }}
              >
                {company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  company.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-violet-700 font-bold uppercase tracking-wider bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                    DiretoLink
                  </span>
                  <h1 className="font-bold text-neutral-900 text-base leading-tight">
                    {company.name}
                  </h1>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      company.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}
                  >
                    {company.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5">
                  <span>/empresa/{company.slug}</span>
                  <button
                    onClick={handleCopyNfcUrl}
                    className="hover:text-neutral-900 flex items-center gap-1 text-[11px] underline underline-offset-2"
                  >
                    {copiedLink ? 'Copiado!' : 'Copiar URL'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/empresa/${company.slug}/caixa`}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Modo Caixa</span>
            </Link>

            <Link
              href={`/empresa/${company.slug}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Página NFC</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-white hover:bg-red-50 hover:text-red-700 text-neutral-600 font-medium text-xs transition-all flex items-center gap-1.5 border border-neutral-200 shadow-xs"
              title="Sair do Painel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto pt-3 mt-1 border-t border-neutral-100">
          {[
            { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
            { id: 'services', label: 'Serviços', count: servicesCount > 0 ? servicesCount : undefined, icon: Scissors },
            { id: 'customers', label: 'Clientes', count: totalCustomers, icon: Users },
            { id: 'loyalty', label: 'Fidelidade', icon: Gift },
            {
              id: 'rewards',
              label: 'Solicitações de Pontos',
              count: pendingRequests.length > 0 ? pendingRequests.length : undefined,
              icon: Award,
            },
            { id: 'feedbacks', label: 'Feedbacks', count: totalFeedbacks, icon: MessageSquare },
            { id: 'settings', label: 'Configurações', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-800'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}

          <Link
            href={`/empresa/${company.slug}`}
            target="_blank"
            className="px-3 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80 flex items-center gap-1.5 whitespace-nowrap transition-all ml-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Página Pública</span>
          </Link>
        </div>
      </header>

      {/* Main Tab View */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 space-y-6">
        {/* ============================================== */}
        {/* TAB 1: DASHBOARD */}
        {/* ============================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Onboarding Welcome Banner if not yet completed */}
            {company.onboardingCompleted !== true && (
              <div className="p-4 sm:p-5 rounded-3xl bg-violet-50/80 border border-violet-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-violet-950">
                      Vamos configurar sua DiretoLink
                    </h3>
                    <p className="text-[11px] text-violet-800">
                      Personalize logo, capa, contatos e fidelidade para deixar sua placa NFC pronta.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOnboardingOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shrink-0 shadow-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <span>Iniciar Assistente</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Live Pending Point Requests Alert (Multi-device Real-time) */}
            {pendingRequests.length > 0 && (
              <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                      Solicitações de Pontos em Tempo Real ({pendingRequests.length})
                    </h3>
                  </div>
                  <Link
                    href={`/empresa/${company.slug}/caixa`}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-2 flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>Abrir Modo Caixa Completo</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 text-xs truncate">
                          {req.customerName}
                        </p>
                        <p className="text-[11px] font-mono text-neutral-500">
                          {formatPhone(req.customerPhone)}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {new Date(req.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRejectRequest(req)}
                          className="p-2 rounded-xl bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-600 transition-colors"
                          title="Recusar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApproveRequest(req)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprovar (+1)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm space-y-1">
                <span className="text-[11px] font-medium text-neutral-500">Clientes Cadastrados</span>
                <p className="text-2xl font-bold text-neutral-900 font-mono">{totalCustomers}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm space-y-1">
                <span className="text-[11px] font-medium text-neutral-500">Pontos Distribuídos</span>
                <p className="text-2xl font-bold text-amber-600 font-mono">{totalPoints}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm space-y-1">
                <span className="text-[11px] font-medium text-neutral-500">Prêmios Prontos</span>
                <p className="text-2xl font-bold text-emerald-600 font-mono">{rewardsAvailable}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm space-y-1">
                <span className="text-[11px] font-medium text-neutral-500">Prêmios Resgatados</span>
                <p className="text-2xl font-bold text-neutral-800 font-mono">{rewardsRedeemed}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm space-y-1">
                <span className="text-[11px] font-medium text-neutral-500">Feedbacks Recebidos</span>
                <p className="text-2xl font-bold text-purple-600 font-mono">{totalFeedbacks}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm space-y-1">
                <span className="text-[11px] font-medium text-neutral-500">Status da Placa NFC</span>
                <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 pt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Operacional
                </p>
              </div>
            </div>

            {/* Middle Grid: NFC Tag Showcase & Quick Cashier shortcut */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* NFC Physical Setup Card (5 cols) */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neutral-900 text-sm">
                    Placa NFC do Estabelecimento
                  </h3>
                  <button
                    onClick={handleCopyNfcUrl}
                    className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copiada!' : 'Copiar URL'}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/60">
                  <QRCodeView value={nfcUrl} size={130} />
                  <div className="space-y-1.5 text-center sm:text-left">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
                      URL de Gravação NFC
                    </span>
                    <p className="text-xs font-mono font-bold text-neutral-900 break-all">
                      {nfcUrl}
                    </p>
                    <p className="text-[11px] text-neutral-500 leading-tight">
                      Grave esta URL no chip NFC NTAG213/215. Ao aproximar o celular, o consumidor cai direto na sua página.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-xs text-amber-800 space-y-1">
                  <p className="font-bold">Garantia de Estabilidade da Placa:</p>
                  <p className="text-[11px]">
                    Você pode alterar horário, capa, Wi-Fi, cardápio e prêmios a qualquer momento. A URL continua a mesma e você nunca precisará reprogramar sua placa física!
                  </p>
                </div>
              </div>

              {/* Recent Activity Log Feed (7 cols) */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neutral-900 text-sm">
                    Atividades e Pontuações Recentes
                  </h3>
                  <span className="text-xs text-neutral-400 font-mono">Tempo real</span>
                </div>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {logs.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-6 text-center">
                      Nenhuma atividade registrada ainda.
                    </p>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-between text-xs gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900 truncate">
                              {log.customerName}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {formatPhone(log.customerPhone)}
                            </span>
                          </div>
                          <p className="text-neutral-600 text-[11px] truncate">
                            {log.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] font-semibold text-neutral-500">
                            {log.approvedBy}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 1.5: SERVIÇOS */}
        {/* ============================================== */}
        {activeTab === 'services' && (
          <ServicesTab
            company={company}
            onEnableModule={() => setActiveTab('settings')}
          />
        )}

        {/* ============================================== */}
        {/* TAB 2: CLIENTES */}
        {/* ============================================== */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Base de Clientes Cadastrados
                </h2>
                <p className="text-xs text-neutral-500">
                  Consumidores identificados através da placa NFC nesta empresa.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Buscar por nome ou WhatsApp..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">WhatsApp</th>
                    <th className="py-3 px-3">Pontos</th>
                    <th className="py-3 px-3">Total Visitas</th>
                    <th className="py-3 px-3">Recompensa</th>
                    <th className="py-3 px-3">Última Atividade</th>
                    <th className="py-3 px-3 text-right">Ação Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-normal">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-400">
                        Nenhum cliente encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const hasReward = cust.availableRewards > 0

                      return (
                        <tr key={cust.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-3 px-3 font-bold text-neutral-900">
                            {cust.name}
                          </td>
                          <td className="py-3 px-3 font-mono text-neutral-600">
                            {formatPhone(cust.phone)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-neutral-900 font-mono">
                              {cust.currentPoints}
                            </span>
                            <span className="text-neutral-400 font-mono">/{goal}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-neutral-600">
                            {cust.totalVisits}
                          </td>
                          <td className="py-3 px-3">
                            {hasReward ? (
                              <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                🎁 {cust.availableRewards} Disponível
                              </span>
                            ) : (
                              <span className="text-neutral-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-neutral-500 font-mono text-[11px]">
                            {new Date(cust.lastActivityAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {hasReward && (
                                <button
                                  onClick={() => handleQuickRedeem(cust.id, cust.name)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 transition-colors shadow-sm"
                                  title="Resgatar recompensa"
                                >
                                  Resgatar
                                </button>
                              )}
                              <button
                                onClick={() => handleQuickAddPoint(cust.id, cust.name)}
                                className="px-2.5 py-1 rounded-lg bg-amber-400 text-neutral-950 font-bold text-[11px] hover:bg-amber-300 transition-colors shadow-sm"
                                title="Adicionar +1 ponto"
                              >
                                +1 Ponto
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 3: FIDELIDADE (CONFIGURAÇÕES DO PROGRAMA) */}
        {/* ============================================== */}
        {activeTab === 'loyalty' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Configuração do Programa de Fidelidade
              </h2>
              <p className="text-xs text-neutral-500">
                Defina a meta de pontos e a recompensa que seus clientes ganharão via NFC.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {(() => {
                const lp = formData.loyaltyProgram
                const currentLoyalty = {
                  isActive: lp?.isActive ?? true,
                  goalPoints: lp?.goalPoints ?? 10,
                  rewardDescription: lp?.rewardDescription || 'Recompensa de Fidelidade',
                  campaignName: lp?.campaignName || 'Cartão Fidelidade',
                }
                return (
                  <>
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <div>
                        <span className="font-bold text-sm text-neutral-900 block">
                          Programa de Fidelidade Ativo
                        </span>
                        <p className="text-xs text-neutral-500">
                          Exibe o cartão fidelidade na página pública NFC.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={currentLoyalty.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            loyaltyProgram: {
                              ...currentLoyalty,
                              isActive: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5 accent-neutral-900 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Nome da Campanha
                      </label>
                      <input
                        type="text"
                        required
                        value={currentLoyalty.campaignName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            loyaltyProgram: {
                              ...currentLoyalty,
                              campaignName: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: Clube do Café, VIP Barber Club..."
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Meta de Pontos para Resgate
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="50"
                        required
                        value={currentLoyalty.goalPoints}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            loyaltyProgram: {
                              ...currentLoyalty,
                              goalPoints: parseInt(e.target.value) || 10,
                            },
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Quantidade de visitas/pontos necessários para liberar o prêmio.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Descrição da Recompensa
                      </label>
                      <input
                        type="text"
                        required
                        value={currentLoyalty.rewardDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            loyaltyProgram: {
                              ...currentLoyalty,
                              rewardDescription: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: 1 Café Especial grátis, 1 Corte de Cabelo..."
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                  </>
                )
              })()}

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Regras de Fidelidade</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 4: RECOMPENSAS */}
        {/* ============================================== */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
                <span className="text-xs text-neutral-500 font-medium">Recompensas Prontas para Uso</span>
                <p className="text-3xl font-bold text-emerald-600 font-mono mt-1">{rewardsAvailable}</p>
                <p className="text-[11px] text-neutral-400 mt-1">Clientes aptos a retirar prêmio</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
                <span className="text-xs text-neutral-500 font-medium">Total de Prêmios Entregues</span>
                <p className="text-3xl font-bold text-neutral-900 font-mono mt-1">{rewardsRedeemed}</p>
                <p className="text-[11px] text-neutral-400 mt-1">Resgates realizados no caixa</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
                <span className="text-xs text-neutral-500 font-medium">Recompensa Vigente</span>
                <p className="text-sm font-bold text-neutral-900 mt-1 truncate">
                  🎁 {company.loyaltyProgram?.rewardDescription || 'Recompensa de Fidelidade'}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">Ao atingir {goal} pontos</p>
              </div>
            </div>

            {/* List of redeemed logs */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-neutral-900 text-sm">
                Histórico de Resgates Auditados
              </h3>

              <div className="space-y-2.5">
                {logs.filter((l) => l.type === 'reward_redeemed').length === 0 ? (
                  <p className="text-xs text-neutral-400 py-6 text-center">
                    Nenhum resgate realizado ainda.
                  </p>
                ) : (
                  logs
                    .filter((l) => l.type === 'reward_redeemed')
                    .map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900">{log.customerName}</span>
                            <span className="font-mono text-neutral-500 text-[11px]">
                              {formatPhone(log.customerPhone)}
                            </span>
                          </div>
                          <p className="text-emerald-700 font-semibold">{log.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[11px] text-neutral-500 block">
                            {new Date(log.timestamp).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            Autorizado por: {log.approvedBy}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 5: FEEDBACKS */}
        {/* ============================================== */}
        {activeTab === 'feedbacks' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Feedbacks Privados Recebidos
              </h2>
              <p className="text-xs text-neutral-500">
                Mensagens enviadas diretamente pelos clientes na página NFC. Apenas você visualiza estas informações.
              </p>
            </div>

            <div className="space-y-3">
              {feedbacks.length === 0 ? (
                <p className="text-xs text-neutral-400 py-10 text-center">
                  Nenhum feedback recebido ainda.
                </p>
              ) : (
                feedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 text-xs">
                          {f.customerName ? f.customerName : 'Cliente Anônimo'}
                        </span>
                        {f.customerPhone && (
                          <span className="text-[11px] font-mono text-neutral-500">
                            · {formatPhone(f.customerPhone)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {f.rating && (
                          <div className="flex items-center text-amber-400 mr-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < (f.rating || 0)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-neutral-200'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(f.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed">
                      &quot;{f.message}&quot;
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 6: CONFIGURAÇÕES GERAIS DA EMPRESA */}
        {/* ============================================== */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Identidade e Dados do Estabelecimento
                </h2>
                <p className="text-xs text-neutral-500">
                  Atualize qualquer informação abaixo. A URL da placa NFC continua sempre a mesma: <strong className="font-mono text-neutral-800">/empresa/{company.slug}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nome do Estabelecimento
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Slug da URL (Placa NFC)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-neutral-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Frase / Subtítulo
                  </label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Ex: Cafés especiais e momentos únicos"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={formData.addressText || ''}
                    onChange={(e) => setFormData({ ...formData, addressText: e.target.value })}
                    placeholder="Ex: Av. Central, 123 - Setor Bueno"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Cor Principal (Hexadecimal)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-neutral-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Foto da Logo e Foto de Capa (Identidade Visual) */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-neutral-900 text-white shadow-sm">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm">
                      Identidade Visual: Foto da Logo e Foto de Capa
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Personalize as fotos que aparecem na tela do smartphone quando o cliente aproxima na placa NFC.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. SEÇÃO DE FOTO DA LOGO */}
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-neutral-700" />
                        Foto da Logo (Avatar)
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Foto quadrada do estabelecimento ou marca.
                      </p>
                    </div>

                    {/* Modos: Upload ou URL */}
                    <div className="flex bg-neutral-200/70 p-0.5 rounded-lg text-[10px] font-medium">
                      <button
                        type="button"
                        onClick={() => setLogoMode('upload')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          logoMode === 'upload'
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        Enviar Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoMode('url')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          logoMode === 'url'
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        Link / URL
                      </button>
                    </div>
                  </div>

                  {/* Preview da Logo */}
                  <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-xs">
                    <div className="relative w-20 h-20 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                      {logoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-8 h-8 text-neutral-400" />
                      )}
                      {isUploadingLogo && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[10px] font-medium">
                          <RefreshCw className="w-4 h-4 animate-spin mb-1" />
                          <span>Enviando...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      {logoMode === 'upload' ? (
                        <div>
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{logoPreview ? 'Trocar Foto da Logo' : 'Escolher Foto da Logo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingLogo}
                              onChange={handleLogoFileChange}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-neutral-400 mt-1">
                            Formatos PNG, JPG ou WebP (compressão automática).
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                            Cole o Link direto da imagem da logo:
                          </label>
                          <input
                            type="url"
                            placeholder="https://exemplo.com/minha-logo.png"
                            value={formData.logoUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setFormData({ ...formData, logoUrl: val })
                              setLogoPreview(val)
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                          />
                        </div>
                      )}

                      {logoPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remover foto da logo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. SEÇÃO DE FOTO DE CAPA */}
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-neutral-700" />
                        Foto de Capa (Banner Superior)
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Banner de destaque no topo da página de aproximação.
                      </p>
                    </div>

                    {/* Modos: Upload, Capas Prontas ou URL */}
                    <div className="flex bg-neutral-200/70 p-0.5 rounded-lg text-[10px] font-medium">
                      <button
                        type="button"
                        onClick={() => setCoverMode('upload')}
                        className={`px-2 py-1 rounded-md transition-all ${
                          coverMode === 'upload'
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        Enviar Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverMode('presets')}
                        className={`px-2 py-1 rounded-md transition-all ${
                          coverMode === 'presets'
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        Prontas
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverMode('url')}
                        className={`px-2 py-1 rounded-md transition-all ${
                          coverMode === 'url'
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        Link / URL
                      </button>
                    </div>
                  </div>

                  {/* Preview da Capa */}
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-xs">
                    <div className="relative h-24 sm:h-28 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shadow-inner">
                      {coverPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverPreview}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-neutral-400 text-xs flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" /> Sem capa selecionada
                        </div>
                      )}
                      {isUploadingCover && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-xs font-medium">
                          <RefreshCw className="w-5 h-5 animate-spin mb-1" />
                          <span>Enviando foto de capa...</span>
                        </div>
                      )}
                    </div>

                    {coverMode === 'upload' && (
                      <div className="flex items-center justify-between gap-3">
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{coverPreview ? 'Trocar Foto de Capa' : 'Escolher Foto de Capa'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingCover}
                            onChange={handleCoverFileChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-neutral-400">
                          Resolução recomendada: 1200×600 px.
                        </p>
                      </div>
                    )}

                    {coverMode === 'presets' && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-neutral-500 uppercase">
                          Escolha um banner temático pronto:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_BANNERS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, coverUrl: preset.url }))
                                setCoverPreview(preset.url)
                                showToast('success', `Capa definida: ${preset.label}`)
                              }}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                                coverPreview === preset.url
                                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                                  : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-white'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {coverMode === 'url' && (
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                          Cole o Link direto da foto de capa:
                        </label>
                        <input
                          type="url"
                          placeholder="https://exemplo.com/minha-capa.jpg"
                          value={formData.coverUrl || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setFormData({ ...formData, coverUrl: val })
                            setCoverPreview(val)
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-neutral-400">
                        Foto atualizada em tempo real na página do cliente
                      </span>
                      <button
                        type="button"
                        onClick={handleResetCover}
                        className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Restaurar padrão</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Links and Contact Details */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-neutral-900 text-sm">
                Canais de Contato e Links
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    WhatsApp (DDD + Número)
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="62999999999"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Instagram (@usuário)
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="seuestabelecimento"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Link de Avaliação do Google
                  </label>
                  <input
                    type="url"
                    value={formData.googleReviewUrl}
                    onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                    placeholder="https://g.page/r/.../review"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Link do Cardápio
                  </label>
                  <input
                    type="url"
                    value={formData.menuUrl}
                    onChange={(e) => setFormData({ ...formData, menuUrl: e.target.value })}
                    placeholder="https://cardapio.meusite.com.br"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Link do Google Maps (Localização)
                  </label>
                  <input
                    type="url"
                    value={formData.locationUrl}
                    onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Wi-Fi Settings */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-neutral-900 text-sm">
                Configurações da Rede Wi-Fi
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nome da Rede (SSID)
                  </label>
                  <input
                    type="text"
                    value={formData.wifi.ssid}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wifi: { ...formData.wifi, ssid: e.target.value },
                      })
                    }
                    placeholder="Ex: MinhaEmpresa_Clientes"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Senha da Rede
                  </label>
                  <input
                    type="text"
                    value={formData.wifi.password || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wifi: { ...formData.wifi, password: e.target.value },
                      })
                    }
                    placeholder="Senha do Wi-Fi"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Segurança
                  </label>
                  <select
                    value={formData.wifi.security}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wifi: {
                          ...formData.wifi,
                          security: e.target.value as WifiSecurity,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white"
                  >
                    <option value="WPA/WPA2">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="OPEN">Aberta (Sem Senha)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recursos da sua DiretoLink */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-5">
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">
                  Recursos da sua DiretoLink
                </h3>
                <p className="text-xs text-neutral-500">
                  Ative apenas os recursos que deseja disponibilizar aos seus clientes.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'services', label: 'Serviços' },
                  { key: 'loyalty', label: 'Cartão Fidelidade' },
                  { key: 'googleReview', label: 'Avaliação Google' },
                  { key: 'menu', label: 'Cardápio' },
                  { key: 'wifi', label: 'Wi-Fi' },
                  { key: 'whatsapp', label: 'WhatsApp' },
                  { key: 'location', label: 'Localização' },
                  { key: 'feedback', label: 'Feedback Privado' },
                  { key: 'instagram', label: 'Instagram' },
                ].map((mod) => (
                  <label
                    key={mod.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                  >
                    <span className="text-xs font-medium text-neutral-800">{mod.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.modules?.[mod.key as keyof typeof formData.modules])}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          modules: {
                            ...formData.modules,
                            [mod.key]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-neutral-900 rounded"
                    />
                  </label>
                ))}
              </div>

              {/* Próximos Recursos Preview */}
              <div className="pt-4 border-t border-neutral-100 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <h4 className="text-xs font-bold text-neutral-800">
                    Próximos Recursos (Em desenvolvimento)
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: 'Agendamento', icon: Calendar, tag: 'Em breve' },
                    { label: 'Catálogo de Produtos', icon: Layers, tag: 'Em breve' },
                    { label: 'Promoções', icon: Sparkles, tag: 'Em breve' },
                    { label: 'Portfólio / Galeria', icon: ImageIcon, tag: 'Em breve' },
                    { label: 'Cupons de Desconto', icon: Gift, tag: 'Em breve' },
                    { label: 'Outros Recursos', icon: Plus, tag: 'Em breve' },
                  ].map((feat) => {
                    const FeatIcon = feat.icon
                    return (
                      <div
                        key={feat.label}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/70 border border-neutral-200/60 opacity-65"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FeatIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="text-xs text-neutral-600 font-medium truncate">
                            {feat.label}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md shrink-0">
                          {feat.tag}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleToggleActive}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                {company.isActive ? 'Desativar Estabelecimento' : 'Ativar Estabelecimento'}
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Todas as Configurações</span>
              </button>
            </div>
          </form>
        )}
      </main>

      {/* First Access Onboarding Modal */}
      <CompanyOnboardingModal
        isOpen={isOnboardingOpen}
        company={company}
        onFinish={(updated) => {
          setIsOnboardingOpen(false)
          setCompany(updated)
          setFormData(updated)
          loadData()
          showToast('success', 'Configurações da DiretoLink salvas!')
        }}
      />
    </div>
  )
}
