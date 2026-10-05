'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Check,
  X,
  Search,
  Plus,
  Gift,
  Clock,
  User,
  Phone,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  History,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { Company, Customer, PointRequest, ActivityLog } from '@/types/platform'
import {
  getCompanyPointRequests,
  getCompanyCustomers,
  getCompanyActivityLogs,
  DATA_CHANGE_EVENT,
  fetchCompanyRequestsFromServer,
  fetchCompanyCustomersFromServer,
  approvePointRequestOnServerApi,
  rejectPointRequestOnServerApi,
  directAddPointOnServerApi,
  redeemRewardOnServerApi,
} from '@/lib/storage'
import { formatPhone, normalizePhone } from '@/lib/utils'

interface ModoCaixaViewProps {
  company: Company
}

export const ModoCaixaView: React.FC<ModoCaixaViewProps> = ({ company }) => {
  const [requests, setRequests] = useState<PointRequest[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [cashierName, setCashierName] = useState('Caixa Balcão')
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [processingIds, setProcessingIds] = useState<string[]>([])

  const loadData = React.useCallback(async () => {
    setRequests(getCompanyPointRequests(company.id))
    setCustomers(getCompanyCustomers(company.id))
    setLogs(getCompanyActivityLogs(company.id).slice(0, 10))

    // Pull from central server
    try {
      const serverReqs = await fetchCompanyRequestsFromServer(company.id, 'pending')
      if (Array.isArray(serverReqs)) {
        setRequests(serverReqs)
      }
      const serverCusts = await fetchCompanyCustomersFromServer(company.id)
      if (Array.isArray(serverCusts)) {
        setCustomers(serverCusts)
      }
    } catch (err) {
      console.warn('Error fetching server data in ModoCaixa:', err)
    }
  }, [company.id])

  useEffect(() => {
    loadData()

    // Real-time server polling: checks for new requests every 2 seconds
    const interval = setInterval(async () => {
      try {
        const fresh = await fetchCompanyRequestsFromServer(company.id, 'pending')
        if (Array.isArray(fresh)) {
          setRequests(fresh)
        }
      } catch (err) {
        console.warn('Polling error in ModoCaixa:', err)
      }
    }, 2000)

    window.addEventListener(DATA_CHANGE_EVENT, loadData)
    window.addEventListener('storage', loadData)
    return () => {
      clearInterval(interval)
      window.removeEventListener(DATA_CHANGE_EVENT, loadData)
      window.removeEventListener('storage', loadData)
    }
  }, [loadData, company.id])

  const showNotice = (type: 'success' | 'error', text: string) => {
    setFeedbackNotice({ type, text })
    setTimeout(() => setFeedbackNotice(null), 4000)
  }

  // Handle live request approve
  const handleApprove = async (req: PointRequest) => {
    if (processingIds.includes(req.id)) return
    setProcessingIds((prev) => [...prev, req.id])

    // Calls central server to add exactly 1 point and mark approved
    const res = await approvePointRequestOnServerApi(req.id, cashierName)
    if (res.success) {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      })
      showNotice('success', `+1 Ponto confirmado para ${req.customerName}!`)
      await loadData()
    } else {
      showNotice('error', res.error || 'Erro ao aprovar solicitação.')
    }

    setTimeout(() => {
      setProcessingIds((prev) => prev.filter((id) => id !== req.id))
    }, 1500)
  }

  // Handle live request reject
  const handleReject = async (req: PointRequest) => {
    const res = await rejectPointRequestOnServerApi(req.id, cashierName)
    if (res.success) {
      showNotice('error', `Solicitação de ${req.customerName} recusada.`)
      await loadData()
    } else {
      showNotice('error', res.error || 'Erro ao rejeitar.')
    }
  }

  // Handle direct point credit from search
  const handleDirectAdd = async (customerId: string, custName: string) => {
    const res = await directAddPointOnServerApi(company.id, customerId, cashierName)
    if (res.success) {
      confetti({
        particleCount: 40,
        spread: 40,
        origin: { y: 0.6 },
      })
      showNotice('success', `+1 Ponto creditado com sucesso para ${custName}!`)
      await loadData()
    } else {
      showNotice('error', res.error || 'Não foi possível adicionar o ponto.')
    }
  }

  // Handle reward redemption
  const handleRedeem = async (customerId: string, custName: string) => {
    const res = await redeemRewardOnServerApi(company.id, customerId, cashierName)
    if (res.success) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      })
      showNotice('success', `🎁 Recompensa resgatada para ${custName}!`)
      await loadData()
      setSelectedCustomer(null)
    } else {
      showNotice('error', res.error || 'Não foi possível resgatar o prêmio.')
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')

  // Filter customers by search term
  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm.trim()) return false
    const term = searchTerm.toLowerCase().trim()
    const norm = normalizePhone(term)
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(norm || term)
    )
  })

  const goal = company.loyaltyProgram?.goalPoints || 10

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-900">
      {/* Top Bar for Cashier */}
      <header className="bg-neutral-950 border-b border-neutral-800 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/painel/${company.slug}`}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Voltar ao Painel do Proprietário"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Voltar ao Painel</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Modo Caixa · {company.name}
              </h1>
            </div>
            <p className="text-[11px] text-neutral-400">
              Terminal rápido de validação de pontos e resgates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/empresa/${company.slug}`}
            target="_blank"
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
          >
            Ver Página NFC
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 bg-neutral-800/80 px-2.5 py-1 rounded-lg border border-neutral-700 text-xs text-neutral-300">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              className="bg-transparent border-none text-xs text-white focus:outline-none w-24"
              placeholder="Nome do Caixa"
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live NFC Point Requests & Fast Search (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Feedback banner */}
          {feedbackNotice && (
            <div
              className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 transition-all ${
                feedbackNotice.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/80 border-red-500/50 text-red-200'
              }`}
            >
              {feedbackNotice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span>{feedbackNotice.text}</span>
            </div>
          )}

          {/* 1. REAL-TIME PENDING NFC REQUESTS SECTION */}
          <div className="bg-neutral-950 rounded-3xl border border-neutral-800 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Solicitações no Balcão
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                  {pendingRequests.length} pendente{pendingRequests.length === 1 ? '' : 's'}
                </span>
              </div>
              <span className="text-xs text-neutral-400">Tempo real</span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-neutral-300">
                  Nenhuma solicitação pendente no momento
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Quando o cliente tocar em &quot;Solicitar Ponto&quot; na página pública NFC, ela aparecerá aqui instantaneamente para validação.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => {
                  const cust = customers.find((c) => c.id === req.customerId)
                  const currentPts = cust?.currentPoints || 0
                  const hasRewardReady = (cust?.availableRewards || 0) > 0

                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700/80 hover:border-neutral-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-white">
                            {req.customerName}
                          </h3>
                          {hasRewardReady && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 uppercase tracking-wider">
                              Recompensa Pronta!
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-neutral-500" />
                          {formatPhone(req.customerPhone)}
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-xs text-amber-300 font-medium">
                          <span>
                            Pontuação atual: <strong>{currentPts}/{goal} pontos</strong>
                          </span>
                          <span className="text-neutral-500">·</span>
                          <span className="text-neutral-400 text-[11px]">
                            {currentPts + 1 >= goal ? '⚠️ Atingirá a meta com este ponto!' : `Ficará com ${currentPts + 1}/${goal}`}
                          </span>
                        </div>
                      </div>

                      {/* Cashier Action Buttons */}
                      <div className="flex items-center gap-2 sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleReject(req)}
                          className="px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-red-950/40 text-neutral-300 hover:text-red-400 text-xs font-semibold border border-neutral-700 hover:border-red-800 transition-all flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          <span>Recusar</span>
                        </button>

                        <button
                          type="button"
                          disabled={processingIds.includes(req.id)}
                          onClick={() => handleApprove(req)}
                          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-neutral-950 font-bold text-sm shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{processingIds.includes(req.id) ? 'Validando...' : '+1 PONTO'}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 2. DIRECT SEARCH / MANUAL BALANCE CREDIT */}
          <div className="bg-neutral-950 rounded-3xl border border-neutral-800 p-5 sm:p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Buscar Cliente no Balcão
              </h2>
              <p className="text-xs text-neutral-400">
                Localize por nome ou WhatsApp para creditar ponto ou resgatar prêmio diretamente.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome ou telefone (ex: 62999999999 ou Maria)..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Search results list */}
            {searchTerm.trim() && (
              <div className="space-y-2 pt-1">
                {filteredCustomers.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-3 text-center">
                    Nenhum cliente encontrado com esse termo.
                  </p>
                ) : (
                  filteredCustomers.map((cust) => {
                    const hasReward = cust.availableRewards > 0

                    return (
                      <div
                        key={cust.id}
                        className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{cust.name}</span>
                            {hasReward && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                🎁 {cust.availableRewards} Prêmio Disponível
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 font-mono">
                            {formatPhone(cust.phone)} · {cust.currentPoints}/{goal} pontos
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasReward && (
                            <button
                              onClick={() => handleRedeem(cust.id, cust.name)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>Resgatar Prêmio</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDirectAdd(cust.id, cust.name)}
                            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>+1 Ponto Direto</span>
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Audited Logs & Reward Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Program Quick Specs */}
          <div className="bg-neutral-950 rounded-3xl border border-neutral-800 p-5 space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
              Regras do Programa Atual
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Campanha:</span>
                <span className="font-semibold text-white">{company.loyaltyProgram?.campaignName || 'Cartão Fidelidade'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Meta para Resgate:</span>
                <span className="font-bold text-amber-400 font-mono">{goal} pontos</span>
              </div>
              <div className="py-1">
                <span className="text-neutral-400 block mb-1">Recompensa:</span>
                <span className="font-bold text-white bg-neutral-900 p-2 rounded-xl block border border-neutral-800">
                  🎁 {company.loyaltyProgram?.rewardDescription || 'Recompensa de Fidelidade'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit trail / Activity Feed */}
          <div className="bg-neutral-950 rounded-3xl border border-neutral-800 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <History className="w-4 h-4 text-neutral-400" />
                <span>Auditoria Recente</span>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">Últimas ações</span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-4">
                  Nenhuma atividade registrada ainda.
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate max-w-[150px]">
                        {log.customerName}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-tight">
                      {log.description}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      Por: {log.approvedBy}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
