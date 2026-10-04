'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Star,
  Gift,
  CheckCircle2,
  Clock,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  RefreshCw,
  LogOut,
  AlertCircle,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { Company, Customer, PointRequest } from '@/types/platform'
import {
  getCustomerByPhone,
  saveLocalCustomerSession,
  clearLocalCustomerSession,
  getCompanyPointRequests,
  DATA_CHANGE_EVENT,
  submitPointRequestToServer,
  fetchPointRequestByIdFromServer,
  fetchCustomerByPhoneFromServer,
  registerCustomerOnServer,
} from '@/lib/storage'
import { formatPhone, normalizePhone } from '@/lib/utils'

interface LoyaltySheetProps {
  isOpen: boolean
  onClose: () => void
  company: Company
  initialCustomerPhone?: string | null
}

export const LoyaltySheet: React.FC<LoyaltySheetProps> = ({
  isOpen,
  onClose,
  company,
  initialCustomerPhone,
}) => {
  const triggerCelebration = React.useCallback(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: [company.primaryColor, company.secondaryColor, '#10B981', '#F59E0B'],
      })
    } catch {}
  }, [company.primaryColor, company.secondaryColor])

  const [customer, setCustomer] = useState<Customer | null>(() => {
    if (initialCustomerPhone) {
      return getCustomerByPhone(company.id, initialCustomerPhone)
    }
    return null
  })
  const [nameInput, setNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [isRegistering, setIsRegistering] = useState<boolean>(() => {
    if (initialCustomerPhone) {
      const found = getCustomerByPhone(company.id, initialCustomerPhone)
      return !found
    }
    return true
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isRequestingPoint, setIsRequestingPoint] = useState(false)
  const [pendingRequest, setPendingRequest] = useState<PointRequest | null>(null)
  const [isLoginMode, setIsLoginMode] = useState(false)

  // Sync when initialCustomerPhone or company changes
  useEffect(() => {
    if (!isOpen) return
    const phoneToFind = initialCustomerPhone
    if (phoneToFind) {
      // 1. Check local cache first for instant render
      const localFound = getCustomerByPhone(company.id, phoneToFind)
      if (localFound) {
        setCustomer(localFound)
        setIsRegistering(false)
        const requests = getCompanyPointRequests(company.id)
        const active = requests.find(
          (r) => r.customerId === localFound.id && r.status === 'pending'
        )
        setPendingRequest(active || null)
      }

      // 2. Fetch authoritative data from server
      fetchCustomerByPhoneFromServer(company.id, phoneToFind).then((serverCust) => {
        if (serverCust) {
          setCustomer(serverCust)
          setIsRegistering(false)
        }
      })
    }
  }, [isOpen, initialCustomerPhone, company.id])

  // Cross-device live polling: continuously listens to server approval
  useEffect(() => {
    if (!isOpen || !customer) return

    let isSubscribed = true

    const pollInterval = setInterval(async () => {
      if (!isSubscribed) return

      // 1. If there is a pending request, check if cashier approved or rejected on another device
      if (pendingRequest?.id) {
        try {
          const freshReq = await fetchPointRequestByIdFromServer(pendingRequest.id)
          if (freshReq && isSubscribed) {
            if (freshReq.status === 'approved') {
              triggerCelebration()
              setSuccessMessage('🎉 Ponto confirmado pelo caixa com sucesso!')
              setPendingRequest(null)
              setTimeout(() => setSuccessMessage(null), 5000)

              // Fetch updated customer points
              const updatedCust = await fetchCustomerByPhoneFromServer(company.id, customer.phone)
              if (updatedCust && isSubscribed) {
                setCustomer(updatedCust)
              }
              return
            } else if (freshReq.status === 'rejected') {
              setErrorMessage('A solicitação de ponto foi recusada pelo caixa.')
              setPendingRequest(null)
              return
            }
          }
        } catch (err) {
          console.warn('Silent polling error for pending request:', err)
        }
      }

      // 2. Also check if points changed on the server
      try {
        const freshCust = await fetchCustomerByPhoneFromServer(company.id, customer.phone)
        if (freshCust && isSubscribed) {
          if (
            freshCust.currentPoints > customer.currentPoints ||
            freshCust.availableRewards > customer.availableRewards
          ) {
            triggerCelebration()
            setSuccessMessage('🎉 Ponto creditado com sucesso!')
            setTimeout(() => setSuccessMessage(null), 4000)
            setCustomer(freshCust)
            setPendingRequest(null)
          }
        }
      } catch (err) {
        console.warn('Silent polling error for customer:', err)
      }
    }, 2000)

    const handleSync = () => {
      if (isOpen && customer) {
        const updated = getCustomerByPhone(company.id, customer.phone)
        if (updated) {
          if (
            updated.currentPoints > customer.currentPoints ||
            updated.availableRewards > customer.availableRewards
          ) {
            triggerCelebration()
            setSuccessMessage('🎉 Ponto confirmado pelo caixa!')
            setTimeout(() => setSuccessMessage(null), 4000)
          }
          setCustomer(updated)
          const requests = getCompanyPointRequests(company.id)
          const active = requests.find(
            (r) => r.customerId === updated.id && r.status === 'pending'
          )
          setPendingRequest(active || null)
        }
      }
    }

    window.addEventListener(DATA_CHANGE_EVENT, handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      isSubscribed = false
      clearInterval(pollInterval)
      window.removeEventListener(DATA_CHANGE_EVENT, handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [isOpen, customer, pendingRequest, company.id, triggerCelebration])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const normalized = normalizePhone(phoneInput)
    if (!nameInput.trim()) {
      setErrorMessage('Por favor, informe o seu nome completo.')
      return
    }
    if (normalized.length < 10) {
      setErrorMessage('Informe um WhatsApp válido com DDD (ex: 62 99999-9999).')
      return
    }

    const res = await registerCustomerOnServer(company.id, {
      name: nameInput,
      phone: phoneInput,
    })

    if (!res.success) {
      setErrorMessage(res.error || 'Não foi possível cadastrar.')
      return
    }

    if (res.customer) {
      setCustomer(res.customer)
      setIsRegistering(false)
      setNameInput('')
      setPhoneInput('')
      triggerCelebration()
    }
  }

  const handleSearchExisting = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    const normalized = normalizePhone(phoneInput)
    if (normalized.length < 10) {
      setErrorMessage('Informe seu WhatsApp com DDD.')
      return
    }

    // Check server first for central cross-device truth
    const found = await fetchCustomerByPhoneFromServer(company.id, normalized)
    if (found) {
      setCustomer(found)
      saveLocalCustomerSession(company.id, found.phone)
      setIsRegistering(false)
      setIsLoginMode(false)
      setPhoneInput('')
    } else {
      setErrorMessage('Nenhum cartão cadastrado com este WhatsApp neste estabelecimento. Crie o seu!')
      setIsLoginMode(false)
    }
  }

  const handleRequestPoint = async () => {
    if (!customer) return
    setIsRequestingPoint(true)
    setErrorMessage(null)

    // Call server API: validates company, customer, creates point request on DB
    const res = await submitPointRequestToServer(company.id, {
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
    })
    setIsRequestingPoint(false)

    // ONLY show "aguardando aprovação" after the server/DB confirms!
    if (res.success && res.request) {
      setPendingRequest(res.request)
      setSuccessMessage('Solicitação enviada com sucesso! Apresente seu celular ao caixa para confirmar.')
      setTimeout(() => setSuccessMessage(null), 5000)
    } else {
      // NEVER show false success
      setErrorMessage(res.error || 'Não foi possível solicitar o ponto no momento. Tente novamente.')
    }
  }

  const handleSwitchAccount = () => {
    clearLocalCustomerSession(company.id)
    setCustomer(null)
    setIsRegistering(true)
    setIsLoginMode(false)
    setPendingRequest(null)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  if (!isOpen) return null

  const goal = company.loyaltyProgram.goalPoints || 10
  const points = customer?.currentPoints || 0
  const remaining = Math.max(0, goal - points)
  const isGoalReached = points >= goal || (customer?.availableRewards || 0) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ y: '100%', opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
      >
        {/* Grab bar on mobile */}
        <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: company.primaryColor }}
            >
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 text-base leading-tight">
                {company.loyaltyProgram.campaignName || 'Cartão Fidelidade'}
              </h2>
              <p className="text-xs text-neutral-500">{company.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. REGISTRATION FORM (First Access) */}
          {isRegistering ? (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white shadow-sm mb-3"
                  style={{ backgroundColor: company.primaryColor }}
                >
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {isLoginMode ? 'Já sou cliente' : 'Crie seu cartão fidelidade'}
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">
                  {isLoginMode
                    ? 'Informe seu WhatsApp para carregar seus pontos.'
                    : 'Ganhe pontos a cada visita e troque por prêmios exclusivos! Sem senhas ou burocracia.'}
                </p>
              </div>

              {isLoginMode ? (
                <form onSubmit={handleSearchExisting} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      WhatsApp com DDD
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
                        placeholder="(62) 99999-9999"
                        className="w-full pl-9 pr-3 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ backgroundColor: company.primaryColor }}
                  >
                    Acessar meu cartão <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(false)
                      setErrorMessage(null)
                    }}
                    className="w-full py-2 text-xs font-medium text-neutral-500 hover:text-neutral-800 text-center"
                  >
                    Não tem cartão? Cadastre-se em 10 segundos
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Seu Nome Completo
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Ex: Maria Silva"
                        className="w-full pl-9 pr-3 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      WhatsApp com DDD
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
                        placeholder="(62) 99999-9999"
                        className="w-full pl-9 pr-3 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Usamos seu WhatsApp apenas para identificar seus pontos neste estabelecimento.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      style={{ backgroundColor: company.primaryColor }}
                    >
                      Criar Cartão Fidelidade Grátis <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginMode(true)
                        setErrorMessage(null)
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-800 underline underline-offset-2"
                    >
                      Já possui cadastro neste local? Entrar com meu número
                    </button>
                  </div>
                </form>
              )}

              {/* Reward preview banner */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
                    Recompensa do Programa
                  </span>
                  <p className="text-xs font-bold text-neutral-900">
                    {company.loyaltyProgram.rewardDescription}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Ao completar {goal} pontos
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* 2. ACTIVE LOYALTY CARD VIEW */
            <div className="space-y-4">
              {/* Header greeting */}
              <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-2xl border border-neutral-200/70">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: company.primaryColor }}
                  >
                    {customer?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 leading-tight">
                      Olá, {customer?.name.split(' ')[0]} 👋
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      {formatPhone(customer?.phone || '')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSwitchAccount}
                  className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-neutral-200/60 transition-colors"
                  title="Trocar de número"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Trocar</span>
                </button>
              </div>

              {/* REWARD READY CELEBRATION CARD */}
              {(customer?.availableRewards || 0) > 0 && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Recompensa Conquistada!
                    </span>
                    <span className="text-xs font-bold bg-white text-amber-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      DISPONÍVEL
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold flex items-center gap-2">
                      🎁 {company.loyaltyProgram.rewardDescription}
                    </h4>
                    <p className="text-xs text-amber-100 mt-1">
                      Apresente seu telefone no caixa para resgatar sua recompensa agora mesmo!
                    </p>
                  </div>
                </motion.div>
              )}

              {/* POINTS PROGRESS CARD */}
              <div
                className="p-5 rounded-2xl text-white shadow-md relative overflow-hidden space-y-4"
                style={{
                  background: `linear-gradient(135deg, ${company.primaryColor} 0%, #1e1e24 100%)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-semibold tracking-wide text-neutral-200">
                      Seu Cartão Fidelidade
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-300">
                    {points} de {goal} pontos
                  </span>
                </div>

                {/* VISUAL STAMP GRID */}
                <div className="grid grid-cols-5 gap-2 py-2">
                  {Array.from({ length: goal }).map((_, idx) => {
                    const isEarned = idx < points
                    const isLastReward = idx === goal - 1

                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                          isEarned
                            ? 'bg-amber-400 text-neutral-900 shadow-md font-bold'
                            : 'bg-white/10 text-white/50 border border-white/20'
                        }`}
                      >
                        {isLastReward ? (
                          <Gift
                            className={`w-4 h-4 ${
                              isEarned ? 'text-neutral-900 animate-bounce' : 'text-amber-300/80'
                            }`}
                          />
                        ) : (
                          <Star
                            className={`w-4 h-4 ${
                              isEarned ? 'fill-neutral-900 text-neutral-900' : 'text-white/40'
                            }`}
                          />
                        )}
                        <span className="text-[10px] mt-0.5 font-bold font-mono">
                          {idx + 1}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Progress bar and counter message */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (points / goal) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-200">
                    {remaining === 0 ? (
                      <span className="text-amber-300 font-bold">
                        Meta atingida! Peça seu prêmio no balcão.
                      </span>
                    ) : (
                      <>
                        Faltam <strong className="text-amber-300">{remaining}</strong> {remaining === 1 ? 'ponto' : 'pontos'} para ganhar:{' '}
                        <strong className="text-white">{company.loyaltyProgram.rewardDescription}</strong>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* ACTION: REQUEST POINT AT REGISTER (SAFETY ENFORCED) */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-900">
                    Acumular ponto desta visita
                  </span>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    Validação no Caixa
                  </span>
                </div>

                {pendingRequest ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                      <span>Solicitação aguardando aprovação no caixa</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-tight">
                      Apresente seu celular para o atendente no balcão. O ponto cairá no seu cartão assim que ele confirmar no Modo Caixa.
                    </p>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleRequestPoint}
                      disabled={isRequestingPoint}
                      className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:opacity-95"
                      style={{ backgroundColor: company.primaryColor }}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Solicitar Ponto da Visita no Balcão</span>
                    </button>
                    <p className="text-[11px] text-neutral-500 text-center mt-1.5">
                      Segurança: Seu ponto é computado após validação rápida pelo funcionário.
                    </p>
                  </div>
                )}
              </div>

              {/* Summary stats & history */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
                  <span className="text-[11px] text-neutral-500 block">Total de Visitas</span>
                  <span className="text-base font-bold text-neutral-900 font-mono">
                    {customer?.totalVisits || 0}
                  </span>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
                  <span className="text-[11px] text-neutral-500 block">Recompensas Resgatadas</span>
                  <span className="text-base font-bold text-neutral-900 font-mono">
                    {customer?.completedCycles || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
