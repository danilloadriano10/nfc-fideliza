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
  ExternalLink,
  Mail,
  MessageCircle,
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
  createMercadoPagoSubscriptionOnServer,
  fetchMercadoPagoSubscriptionFromServer,
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
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('PRODUCTION')
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [toastFeedback, setToastFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const currentPlan = subscription?.plan || getCompanyPlan(company)
  const currentPrice = subscription?.value || getPlanPrice(currentPlan)
  const planLabel = getPlanLabel(currentPlan)

  // Apenas as duas opções oficiais solicitadas: Mercado Pago e Pix Direto
  const [selectedMethod, setSelectedMethod] = useState<'mercadopago' | 'pix'>('mercadopago')

  // Mercado Pago Data
  const [mpInitPoint, setMpInitPoint] = useState<string | null>(
    () => subscription?.mpInitPoint || null
  )
  const [isGeneratingMp, setIsGeneratingMp] = useState(false)

  // PIX Direto Data (oficialdiretolink@gmail.com)
  const [pixData, setPixData] = useState<{
    encodedImage: string
    payload: string
    expirationDate: string
  } | null>(() => {
    if (
      subscription?.gateway === 'pix_direto' &&
      subscription?.pixCopiaECola &&
      subscription.pixCopiaECola.includes('oficialdiretolink@gmail.com')
    ) {
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

  const isUnlockedRef = useRef(false)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastFeedback({ text, type })
    setTimeout(() => setToastFeedback(null), 4000)
  }

  // Poll status from server (Mercado Pago + Asaas)
  const checkStatus = async (silent = false) => {
    if (isUnlockedRef.current) return
    if (!silent) setIsCheckingPayment(true)

    try {
      // 1. Consulta Mercado Pago primeiro (se gateway MP ou novo fluxo)
      const mpRes = await fetchMercadoPagoSubscriptionFromServer(company.id).catch(() => null)
      // 2. Consulta Asaas / Firestore
      const res = await fetchCompanySubscriptionFromServer(company.id).catch(() => null)

      const activeSub =
        (mpRes?.subscription?.status === 'ACTIVE' ? mpRes.subscription : null) ||
        (res?.subscription?.status === 'ACTIVE' ? res.subscription : null) ||
        mpRes?.subscription ||
        res?.subscription

      const isUnlocked = Boolean(res?.isUnlocked || mpRes?.isUnlocked || activeSub?.status === 'ACTIVE')

      if (res?.environment) setEnvironment(res.environment)

      if (activeSub) {
        setSubscription(activeSub)
        if (activeSub.mpInitPoint && !mpInitPoint) {
          setMpInitPoint(activeSub.mpInitPoint)
        }

        if (isUnlocked) {
          isUnlockedRef.current = true
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
          showToast('Assinatura ativada com sucesso! Liberando seu painel...', 'success')

          const updatedCompany: Company = {
            ...company,
            subscription: activeSub,
          }
          saveCompanyLocally(updatedCompany)
          saveCompany(updatedCompany)
          setTimeout(() => {
            onCompanyUpdate(updatedCompany)
          }, 800)
          return
        } else if (
          activeSub.gateway === 'pix_direto' &&
          activeSub.pixCopiaECola &&
          activeSub.pixCopiaECola.includes('oficialdiretolink@gmail.com') &&
          !pixData
        ) {
          setPixData({
            encodedImage: (activeSub.pixQrCodeUrl || '').replace('data:image/png;base64,', ''),
            payload: activeSub.pixCopiaECola,
            expirationDate: activeSub.pixExpirationDate || '',
          })
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

  // Iniciar Assinatura no Mercado Pago
  const handleStartMercadoPago = async () => {
    setSelectedMethod('mercadopago')
    if (mpInitPoint) {
      window.open(mpInitPoint, '_blank')
      return
    }

    setIsGeneratingMp(true)
    try {
      const res = await createMercadoPagoSubscriptionOnServer({
        companyId: company.id,
        payerEmail: company.ownerAuth?.ownerEmail,
      })

      if (res.success && res.initPoint) {
        setMpInitPoint(res.initPoint)
        if (res.subscription) setSubscription(res.subscription)
        showToast('Link do Mercado Pago gerado com sucesso! Abrindo...', 'success')
        window.open(res.initPoint, '_blank')
      } else {
        showToast(res.error || 'Erro ao gerar checkout do Mercado Pago.', 'error')
      }
    } catch {
      showToast('Falha na comunicação com o servidor.', 'error')
    } finally {
      setIsGeneratingMp(false)
    }
  }

  // Iniciar PIX Direto (oficialdiretolink@gmail.com)
  const handleStartPix = async () => {
    setSelectedMethod('pix')
    if (pixData?.payload) return // Já tem dados do Pix gerados

    setIsGeneratingPix(true)
    try {
      const res = await fetch('/api/pix-direto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setPixData({
          encodedImage: data.qrCodeBase64.replace('data:image/png;base64,', ''),
          payload: data.copiaECola,
          expirationDate: '',
        })
        if (data.subscription) {
          setSubscription(data.subscription)
        }
        showToast('PIX Direto gerado com sucesso! Aguardando confirmação.', 'success')
      } else {
        showToast(data.error || 'Erro ao gerar PIX Direto.', 'error')
      }
    } catch {
      showToast('Falha na comunicação com o servidor.', 'error')
    } finally {
      setIsGeneratingPix(false)
    }
  }

  // Copiar chave PIX oficial (oficialdiretolink@gmail.com)
  const handleCopyPix = () => {
    navigator.clipboard.writeText('oficialdiretolink@gmail.com')
    setCopiedPix(true)
    showToast('Chave PIX copiada!', 'success')
    setTimeout(() => setCopiedPix(false), 2500)
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

          {/* Action Choice Buttons: Apenas Mercado Pago e PIX Direto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleStartMercadoPago}
              disabled={isGeneratingMp}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                selectedMethod === 'mercadopago'
                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-md ring-2 ring-violet-500/20'
                  : 'bg-neutral-50/80 hover:bg-neutral-100 border-neutral-200 text-neutral-900'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedMethod === 'mercadopago'
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'bg-sky-50 text-sky-600 border border-sky-200'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-600 text-white">
                  Recomendado
                </span>
              </div>
              <div>
                <span className="text-xs font-bold block">MERCADO PAGO</span>
                <span
                  className={`text-[11px] font-medium block mt-0.5 ${
                    selectedMethod === 'mercadopago' ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  Cartão de Crédito ou Pix com liberação automática
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleStartPix}
              disabled={isGeneratingPix}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                selectedMethod === 'pix'
                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-neutral-50/80 hover:bg-neutral-100 border-neutral-200 text-neutral-900'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedMethod === 'pix' ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}
              >
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block">PIX DIRETO</span>
                <span
                  className={`text-[11px] font-medium block mt-0.5 ${
                    selectedMethod === 'pix' ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  QR Code e Chave Pix oficial (e-mail)
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 0. SEÇÃO MERCADO PAGO */}
        {selectedMethod === 'mercadopago' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Assinatura via Mercado Pago · {planLabel}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Pague com Cartão de Crédito ou PIX no ambiente seguro do Mercado Pago.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Aguardando ativação</span>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-neutral-50 to-neutral-100/60 rounded-2xl border border-neutral-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                    Valor da Assinatura Mensal
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-neutral-950 font-mono">
                      {formatMoneyBRL(currentPrice)}
                    </span>
                    <span className="text-xs text-neutral-500 font-medium">/ mês</span>
                  </div>
                  <span className="text-xs text-neutral-600 block mt-1 font-medium">
                    Plano selecionado:{' '}
                    <strong className="text-neutral-900">{planLabel}</strong>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {mpInitPoint ? (
                    <a
                      href={mpInitPoint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span>Abrir Checkout Seguro Mercado Pago</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartMercadoPago}
                      disabled={isGeneratingMp}
                      className="px-5 py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingMp ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Gerando link no Mercado Pago...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-sky-400" />
                          <span>Gerar Pagamento Mercado Pago</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => checkStatus(false)}
                    disabled={isCheckingPayment}
                    className="px-4 py-3 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white text-xs font-bold text-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw
                      className={`w-4 h-4 ${isCheckingPayment ? 'animate-spin text-neutral-900' : 'text-neutral-500'}`}
                    />
                    <span>Já paguei, verificar</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200/70 text-[11px] text-neutral-500 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Liberação automática: assim que o Mercado Pago confirmar o pagamento pelo webhook, seu painel será desbloqueado em instantes.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 1. SEÇÃO PIX DIRETO (oficialdiretolink@gmail.com) */}
        {selectedMethod === 'pix' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Pagamento via PIX Direto · {planLabel}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-neutral-500">
                      Chave PIX Oficial (E-mail): <strong className="text-neutral-800 font-mono">oficialdiretolink@gmail.com</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('oficialdiretolink@gmail.com')
                        showToast('Chave PIX copiada!', 'success')
                      }}
                      className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-[11px] font-semibold text-neutral-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copiar chave PIX"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar Chave</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status: AGUARDANDO CONFIRMAÇÃO */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>AGUARDANDO CONFIRMAÇÃO</span>
              </div>
            </div>

            {isGeneratingPix ? (
              <div className="py-12 text-center space-y-3">
                <RotateCw className="w-8 h-8 animate-spin text-neutral-800 mx-auto" />
                <p className="text-xs text-neutral-500 font-medium">
                  Gerando QR Code do PIX Direto...
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

                  <div className="mt-3 text-center space-y-1">
                    <span className="text-base font-black text-neutral-900 font-mono block">
                      {formatMoneyBRL(currentPrice)}
                    </span>
                    <span className="text-[11px] text-neutral-600 block font-medium">
                      Plano: {planLabel}
                    </span>
                  </div>
                </div>

                {/* Ações PIX */}
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    {copiedPix ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Chave PIX copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Chave PIX</span>
                      </>
                    )}
                  </button>

                  {/* Mensagem obrigatória de confirmação manual */}
                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Aguardando confirmação do pagamento</span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                      Após realizar o PIX, aguarde a confirmação do pagamento. Assim que confirmado, seu acesso será liberado.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <button
                  type="button"
                  onClick={handleStartPix}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Gerar QR Code e Copia e Cola PIX
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. SUPORTE DISCRETO AO CLIENTE */}
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs text-center space-y-3 max-w-xl mx-auto">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Precisa de ajuda com seu pagamento?
            </h4>
            <p className="text-[11px] text-neutral-500 font-medium">
              Nossa equipe está disponível para tirar dúvidas e ajudar na ativação da sua empresa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <a
              href="https://wa.me/5562993449462?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20a%20ativa%C3%A7%C3%A3o%20da%20minha%20DiretoLink."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp: (62) 99344-9462</span>
            </a>

            <a
              href="mailto:oficialdiretolink@gmail.com"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4 text-violet-600" />
              <span>E-mail: oficialdiretolink@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Sair da conta */}
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
