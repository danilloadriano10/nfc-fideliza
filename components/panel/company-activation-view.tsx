'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Lock,
  LogOut,
  Radio,
  ArrowRight,
  X,
  HelpCircle,
  CheckCheck,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import {
  Company,
  CompanySubscription,
  getCompanyPlan,
  getPlanPrice,
  getPlanLabel,
} from '@/types/platform'
import {
  fetchCompanySubscriptionFromServer,
  createCompanySubscriptionOnServerApi,
  saveCompanyLocally,
  saveCompany,
} from '@/lib/storage'
import { formatMoneyBRL } from '@/lib/order-delivery'

interface CompanyActivationViewProps {
  company: Company
  onCompanyUpdate: (updated: Company) => void
  onLogout: () => void
}

export const CompanyActivationView: React.FC<CompanyActivationViewProps> = ({
  company,
  onCompanyUpdate,
  onLogout,
}) => {
  const [subscription, setSubscription] = useState<CompanySubscription | null>(
    () => company.subscription || null
  )
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [toastFeedback, setToastFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const currentPlan = subscription?.plan || getCompanyPlan(company)
  const currentPrice = subscription?.value || getPlanPrice(currentPlan)
  const planLabel = getPlanLabel(currentPlan)

  // Payment view states: 'choice' | 'pix' | 'card'
  const [selectedMethod, setSelectedMethod] = useState<'choice' | 'pix' | 'card'>(() => {
    if (subscription?.paymentMethod === 'PIX' && subscription?.pixCopiaECola) {
      return 'pix'
    }
    return 'choice'
  })

  // PIX Data
  const [pixData, setPixData] = useState<{
    encodedImage: string
    payload: string
    expirationDate: string
  } | null>(() => {
    if (subscription?.pixCopiaECola) {
      return {
        encodedImage: (subscription.pixQrCodeUrl || '').replace('data:image/png;base64,', ''),
        payload: subscription.pixCopiaECola,
        expirationDate: subscription.pixExpirationDate || '',
      }
    }
    return null
  })
  const [copiedPix, setCopiedPix] = useState(false)
  const [isGeneratingPix, setIsGeneratingPix] = useState(false)

  // Card Form State
  const [cardHolderName, setCardHolderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCcv, setCardCcv] = useState('')
  const [cardCpfCnpj, setCardCpfCnpj] = useState('')
  const [cardPostalCode, setCardPostalCode] = useState('')
  const [cardAddressNumber, setCardAddressNumber] = useState('')
  const [cardPhone, setCardPhone] = useState('')
  const [isSubmittingCard, setIsSubmittingCard] = useState(false)

  // Sandbox simulation state
  const [isSimulatingSandbox, setIsSimulatingSandbox] = useState(false)

  const isUnlockedRef = useRef(false)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastFeedback({ text, type })
    setTimeout(() => setToastFeedback(null), 4000)
  }

  // Poll status from server
  const checkStatus = async (silent = false) => {
    if (isUnlockedRef.current) return
    if (!silent) setIsCheckingPayment(true)

    try {
      const res = await fetchCompanySubscriptionFromServer(company.id)
      if (res.success) {
        if (res.environment) setEnvironment(res.environment)
        if (res.subscription) {
          const freshSub = res.subscription
          setSubscription(freshSub)

          if (freshSub.status === 'ACTIVE' || res.isUnlocked) {
            isUnlockedRef.current = true
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
            showToast('Assinatura ativada com sucesso! Liberando seu painel...', 'success')

            const updatedCompany: Company = {
              ...company,
              subscription: freshSub,
            }
            saveCompanyLocally(updatedCompany)
            saveCompany(updatedCompany)
            setTimeout(() => {
              onCompanyUpdate(updatedCompany)
            }, 800)
          } else if (freshSub.pixCopiaECola && !pixData) {
            setPixData({
              encodedImage: (freshSub.pixQrCodeUrl || '').replace('data:image/png;base64,', ''),
              payload: freshSub.pixCopiaECola,
              expirationDate: freshSub.pixExpirationDate || '',
            })
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao verificar status da assinatura:', err)
    } finally {
      if (!silent) setIsCheckingPayment(false)
    }
  }

  // Initial load
  useEffect(() => {
    checkStatus(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id])

  // Continuous polling while waiting
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus(true)
    }, 3500)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id])

  // Iniciar PIX
  const handleStartPix = async () => {
    setSelectedMethod('pix')
    if (pixData?.payload) return // Já tem dados do Pix gerados

    setIsGeneratingPix(true)
    try {
      const res = await createCompanySubscriptionOnServerApi({
        companyId: company.id,
        paymentMethod: 'PIX',
        billingInfo: {
          name: company.ownerAuth?.ownerName || company.name,
          email: company.ownerAuth?.ownerEmail || `${company.slug}@diretolink.com.br`,
          phone: company.ownerAuth?.ownerPhone || company.whatsapp,
        },
      })

      if (res.success && res.subscription) {
        setSubscription(res.subscription)
        if (res.pix) {
          setPixData(res.pix)
        }
        showToast('Cobrança PIX gerada com sucesso!', 'success')
      } else {
        showToast(res.error || 'Erro ao gerar PIX no Asaas.', 'error')
      }
    } catch {
      showToast('Falha na comunicação com o servidor.', 'error')
    } finally {
      setIsGeneratingPix(false)
    }
  }

  // Submeter Cartão de Crédito
  const handleStartCard = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanCard = cardNumber.replace(/\D/g, '')
    if (cleanCard.length < 13) {
      showToast('Número de cartão inválido.', 'error')
      return
    }

    const [expMonth, expYearRaw] = cardExpiry.split('/')
    if (!expMonth || !expYearRaw) {
      showToast('Validade inválida (use MM/AA).', 'error')
      return
    }
    const expYear = expYearRaw.length === 2 ? `20${expYearRaw}` : expYearRaw

    setIsSubmittingCard(true)
    try {
      const res = await createCompanySubscriptionOnServerApi({
        companyId: company.id,
        paymentMethod: 'CREDIT_CARD',
        creditCard: {
          holderName: cardHolderName.trim(),
          number: cleanCard,
          expiryMonth: expMonth.trim(),
          expiryYear: expYear.trim(),
          ccv: cardCcv.trim(),
        },
        creditCardHolderInfo: {
          name: cardHolderName.trim(),
          email: company.ownerAuth?.ownerEmail || `${company.slug}@diretolink.com.br`,
          cpfCnpj: cardCpfCnpj.replace(/\D/g, '') || '00000000000',
          postalCode: cardPostalCode.replace(/\D/g, '') || '89201000',
          addressNumber: cardAddressNumber.trim() || '100',
          phone: cardPhone.replace(/\D/g, '') || company.whatsapp || '47999999999',
        },
      })

      if (res.success && res.subscription) {
        setSubscription(res.subscription)
        if (res.subscription.status === 'ACTIVE') {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
          showToast('Cartão aprovado com sucesso! Liberando painel...', 'success')
          const updatedCompany: Company = {
            ...company,
            subscription: res.subscription,
          }
          saveCompanyLocally(updatedCompany)
          saveCompany(updatedCompany)
          setTimeout(() => {
            onCompanyUpdate(updatedCompany)
          }, 800)
        } else {
          showToast('Cartão processado. Aguardando confirmação da operadora...', 'success')
          checkStatus(false)
        }
      } else {
        showToast(res.error || 'Erro ao processar cartão no Asaas.', 'error')
      }
    } catch {
      showToast('Falha na comunicação com o servidor.', 'error')
    } finally {
      setIsSubmittingCard(false)
    }
  }

  // Copiar código Copia e Cola
  const handleCopyPix = () => {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload)
      setCopiedPix(true)
      showToast('Código Pix copiado para a área de transferência!', 'success')
      setTimeout(() => setCopiedPix(false), 2500)
    }
  }

  // Simular Pagamento no Sandbox (1 clique para testes)
  const handleSimulateSandboxPayment = async () => {
    setIsSimulatingSandbox(true)
    try {
      const res = await fetch('/api/asaas/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `evt_sim_${Date.now()}`,
          event: 'PAYMENT_RECEIVED',
          dateCreated: new Date().toISOString(),
          payment: {
            id: `pay_sim_${Date.now()}`,
            subscription: subscription?.asaasSubscriptionId || `sub_${company.id}`,
            customer: subscription?.asaasCustomerId || '',
            status: 'RECEIVED',
            billingType: 'PIX',
            value: currentPrice,
            externalReference: company.id,
            paymentDate: new Date().toISOString(),
          },
        }),
      })

      if (res.ok) {
        showToast('Confirmação simulada com sucesso! Atualizando...', 'success')
        await checkStatus(false)
      } else {
        showToast('Erro ao simular webhook no Sandbox.', 'error')
      }
    } catch {
      showToast('Erro ao disparar simulação.', 'error')
    } finally {
      setIsSimulatingSandbox(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900 selection:bg-violet-100 selection:text-violet-900">
      {/* Toast Feedback */}
      {toastFeedback && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border ${
              toastFeedback.type === 'success'
                ? 'bg-neutral-900 text-white border-neutral-800'
                : 'bg-red-900 text-white border-red-800'
            }`}
          >
            {toastFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{toastFeedback.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <Radio className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-900 leading-tight">
                  {company.name}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                  Aguardando Ativação
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium">
                painel.diretolink.com.br/{company.slug}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair da conta</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Activation Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hero Banner */}
        <div className="text-center space-y-2 py-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Passo final para liberar sua DiretoLink</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
            Ative sua DiretoLink
          </h1>

          <p className="text-xs sm:text-sm text-neutral-600 max-w-xl mx-auto font-medium">
            Seu estabelecimento foi criado com sucesso! Para desbloquear o painel completo, links e ferramentas, conclua a ativação da sua assinatura.
          </p>
        </div>

        {/* Selected Plan Summary Card */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                  {currentPlan === 'links' ? 'DIRETOLINK LINKS' : 'DIRETOLINK PRO'}
                </span>
                <span className="text-[11px] text-neutral-400 font-medium">
                  Assinatura Mensal Recorrente
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-950 mt-1">
                {planLabel}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {currentPlan === 'links'
                  ? 'Sua página pública profissional, links externos ilimitados, personalização e QR Code/NFC.'
                  : 'Sua página completa + Cardápio digital, Pedidos, Agendamento, Catálogo, Mesas e Fidelidade.'}
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-neutral-950 font-mono">
                {formatMoneyBRL(currentPrice)}
              </span>
              <span className="text-xs text-neutral-500 block font-medium">por mês</span>
            </div>
          </div>

          {/* Action Choice Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleStartPix}
              disabled={isGeneratingPix}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedMethod === 'pix'
                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-md'
                  : 'bg-neutral-50/80 hover:bg-neutral-100 border-neutral-200 text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedMethod === 'pix' ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">PAGAR COM PIX</span>
                  <span
                    className={`text-[11px] font-medium block ${
                      selectedMethod === 'pix' ? 'text-neutral-300' : 'text-neutral-500'
                    }`}
                  >
                    Liberação instantânea via QR Code
                  </span>
                </div>
              </div>
              <ArrowRight
                className={`w-4 h-4 shrink-0 ${
                  selectedMethod === 'pix' ? 'text-white' : 'text-neutral-400'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedMethod === 'card'
                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-md'
                  : 'bg-neutral-50/80 hover:bg-neutral-100 border-neutral-200 text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedMethod === 'card' ? 'bg-white/10 text-white' : 'bg-violet-50 text-violet-600 border border-violet-200'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">PAGAR COM CARTÃO</span>
                  <span
                    className={`text-[11px] font-medium block ${
                      selectedMethod === 'card' ? 'text-neutral-300' : 'text-neutral-500'
                    }`}
                  >
                    Renovação mensal automática no cartão
                  </span>
                </div>
              </div>
              <ArrowRight
                className={`w-4 h-4 shrink-0 ${
                  selectedMethod === 'card' ? 'text-white' : 'text-neutral-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 1. SEÇÃO PIX */}
        {selectedMethod === 'pix' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Pagamento via PIX · {planLabel}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Escaneie o QR Code ou copie a chave Copia e Cola no app do seu banco.
                  </p>
                </div>
              </div>

              {/* Status "Aguardando pagamento" */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Aguardando pagamento</span>
              </div>
            </div>

            {isGeneratingPix ? (
              <div className="py-12 text-center space-y-3">
                <RotateCw className="w-8 h-8 animate-spin text-neutral-800 mx-auto" />
                <p className="text-xs text-neutral-500 font-medium">
                  Gerando cobrança PIX com Asaas...
                </p>
              </div>
            ) : pixData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-6 bg-neutral-50 rounded-2xl border border-neutral-200/80">
                  {pixData.encodedImage ? (
                    <div className="p-3 bg-white rounded-xl shadow-xs border border-neutral-200">
                      <Image
                        src={`data:image/png;base64,${pixData.encodedImage}`}
                        alt="QR Code Pix"
                        width={200}
                        height={200}
                        className="w-48 h-48 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-neutral-200 rounded-lg flex items-center justify-center text-xs text-neutral-500">
                      QR Code indisponível
                    </div>
                  )}

                  <div className="mt-3 text-center">
                    <span className="text-base font-black text-neutral-900 font-mono">
                      {formatMoneyBRL(currentPrice)}
                    </span>
                    <span className="text-[11px] text-neutral-500 block">
                      Vencimento: {pixData.expirationDate ? new Date(pixData.expirationDate).toLocaleDateString('pt-BR') : 'Hoje'}
                    </span>
                  </div>
                </div>

                {/* Copia e Cola & Live Status */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 block mb-1">
                      Código PIX Copia e Cola
                    </label>
                    <div className="relative">
                      <textarea
                        readOnly
                        value={pixData.payload}
                        rows={3}
                        className="w-full p-2.5 text-[11px] font-mono bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-700 focus:outline-hidden resize-none select-all"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="mt-2 w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      {copiedPix ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Código Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Código PIX</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Live status check */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Verificação Automática</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => checkStatus(false)}
                        disabled={isCheckingPayment}
                        className="text-xs font-semibold text-violet-700 hover:text-violet-900 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isCheckingPayment ? 'animate-spin' : ''}`} />
                        <span>Verificar Agora</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Assim que o pagamento for confirmado pelo banco ou gateway, seu painel será liberado automaticamente em poucos segundos.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <button
                  type="button"
                  onClick={handleStartPix}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Gerar QR Code PIX
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. SEÇÃO CARTÃO DE CRÉDITO */}
        {selectedMethod === 'card' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Assinatura Recorrente no Cartão de Crédito
                </h3>
                <p className="text-xs text-neutral-500">
                  Cobrança mensal automática de {formatMoneyBRL(currentPrice)}/mês. Cancele quando quiser.
                </p>
              </div>
            </div>

            <form onSubmit={handleStartCard} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                    Nome Impresso no Cartão *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CARLOS SILVA"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                    Número do Cartão *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()
                      setCardNumber(v)
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                    Validade (MM/AA) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="12/28"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '')
                      if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`
                      setCardExpiry(v)
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                    CVV / Código de Segurança *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="123"
                    maxLength={4}
                    value={cardCcv}
                    onChange={(e) => setCardCcv(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                    CPF ou CNPJ do Titular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cardCpfCnpj}
                    onChange={(e) => setCardCpfCnpj(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                    Telefone de Contato *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-8888"
                    value={cardPhone || company.whatsapp}
                    onChange={(e) => setCardPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                    CEP do Titular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="89201-000"
                    value={cardPostalCode}
                    onChange={(e) => setCardPostalCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                    Número do Endereço *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 100"
                    value={cardAddressNumber}
                    onChange={(e) => setCardAddressNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingCard}
                  className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCard ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Processando assinatura no Asaas...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirmar Assinatura ({formatMoneyBRL(currentPrice)}/mês)</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-neutral-500 text-center flex items-center justify-center gap-1.5 pt-1">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Dados de cartão transmitidos de forma segura e tokenizados diretamente pelo Asaas.</span>
              </p>
            </form>
          </div>
        )}

        {/* Sandbox Test Helper */}
        {environment === 'SANDBOX' && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Ambiente de Testes Sandbox Ativo</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                Asaas Sandbox
              </span>
            </div>

            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              Você está testando no ambiente seguro Sandbox da Asaas. Para validar a liberação automática do painel sem precisar abrir o app do banco, você pode simular a confirmação imediata do pagamento abaixo:
            </p>

            <button
              type="button"
              onClick={handleSimulateSandboxPayment}
              disabled={isSimulatingSandbox}
              className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>
                {isSimulatingSandbox
                  ? 'Simulando pagamento no Sandbox...'
                  : 'Simular Confirmação de Pagamento PIX (Sandbox)'}
              </span>
            </button>
          </div>
        )}

        {/* Security & Logout Bar */}
        <div className="text-center pt-2 pb-6 space-y-2">
          <p className="text-xs text-neutral-500">
            Deseja utilizar outra conta?{' '}
            <button
              type="button"
              onClick={onLogout}
              className="font-bold text-neutral-900 hover:underline cursor-pointer"
            >
              Sair desta empresa
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
