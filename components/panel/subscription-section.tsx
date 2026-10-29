'use client'

import React, { useState, useEffect } from 'react'
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
  ExternalLink,
  Sparkles,
  Info,
  Calendar,
  X,
  Trash2,
} from 'lucide-react'
import { Company, CompanySubscription } from '@/types/platform'
import {
  fetchCompanySubscriptionFromServer,
  createCompanySubscriptionOnServerApi,
  cancelCompanySubscriptionOnServerApi,
} from '@/lib/storage'
import { formatMoneyBRL } from '@/lib/order-delivery'

interface SubscriptionSectionProps {
  company: Company
  onCompanyUpdate?: (updated: Company) => void
}

export const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  company,
  onCompanyUpdate,
}) => {
  const [subscription, setSubscription] = useState<CompanySubscription | null>(
    () => company.subscription || null
  )
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX')
  const [isConfigured, setIsConfigured] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Modais de pagamento
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [pixData, setPixData] = useState<{
    encodedImage: string
    payload: string
    expirationDate: string
  } | null>(null)
  const [copiedPayload, setCopiedPayload] = useState(false)

  // Formulário do Cartão de Crédito
  const [cardHolderName, setCardHolderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('') // MM/AA
  const [cardCcv, setCardCcv] = useState('')
  const [cardCpfCnpj, setCardCpfCnpj] = useState('')
  const [cardPostalCode, setCardPostalCode] = useState('')
  const [cardAddressNumber, setCardAddressNumber] = useState('')
  const [cardPhone, setCardPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type })
    setTimeout(() => setFeedback(null), 4000)
  }

  // Carrega status da assinatura no servidor
  const loadSubscription = async () => {
    setIsLoading(true)
    const res = await fetchCompanySubscriptionFromServer(company.id)
    setIsLoading(false)
    if (res.success) {
      if (res.subscription) {
        setSubscription(res.subscription)
        if (onCompanyUpdate) {
          onCompanyUpdate({ ...company, subscription: res.subscription })
        }
      }
      if (res.environment) setEnvironment(res.environment)
      if (res.isConfigured !== undefined) setIsConfigured(res.isConfigured)
    }
  }

  useEffect(() => {
    loadSubscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id])

  // Iniciar Assinatura PIX Automático / Recorrente (R$ 69,99)
  const handleStartPixSubscription = async () => {
    setIsSubmitting(true)
    const res = await createCompanySubscriptionOnServerApi({
      companyId: company.id,
      paymentMethod: 'PIX',
      billingInfo: {
        name: company.ownerAuth?.ownerName || company.name,
        email: company.ownerAuth?.ownerEmail || `${company.slug}@diretolink.com.br`,
        phone: company.ownerAuth?.ownerPhone || company.whatsapp,
      },
    })
    setIsSubmitting(false)

    if (res.success && res.subscription) {
      setSubscription(res.subscription)
      if (onCompanyUpdate) {
        onCompanyUpdate({ ...company, subscription: res.subscription })
      }
      if (res.pix) {
        setPixData(res.pix)
        setIsPixModalOpen(true)
      }
      showToast('Assinatura gerada no Asaas com sucesso!', 'success')
    } else {
      showToast(res.error || 'Erro ao gerar assinatura PIX.', 'error')
    }
  }

  // Iniciar Assinatura Cartão de Crédito Recorrente (R$ 69,99)
  const handleStartCardSubscription = async (e: React.FormEvent) => {
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

    setIsSubmitting(true)
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
    setIsSubmitting(false)

    if (res.success && res.subscription) {
      setSubscription(res.subscription)
      if (onCompanyUpdate) {
        onCompanyUpdate({ ...company, subscription: res.subscription })
      }
      setIsCardModalOpen(false)
      showToast('Assinatura com Cartão Recorrente cadastrada no Asaas!', 'success')
    } else {
      showToast(res.error || 'Erro ao processar cartão no Asaas.', 'error')
    }
  }

  // Cancelar Assinatura
  const handleCancelSubscription = async () => {
    setIsSubmitting(true)
    const res = await cancelCompanySubscriptionOnServerApi(company.id)
    setIsSubmitting(false)
    setIsCancelModalOpen(false)

    if (res.success && res.subscription) {
      setSubscription(res.subscription)
      if (onCompanyUpdate) {
        onCompanyUpdate({ ...company, subscription: res.subscription })
      }
      showToast('Assinatura cancelada com sucesso.', 'success')
    } else {
      showToast(res.error || 'Erro ao cancelar assinatura.', 'error')
    }
  }

  const copyPixCode = () => {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload)
      setCopiedPayload(true)
      setTimeout(() => setCopiedPayload(false), 2500)
    }
  }

  const isSubActive = subscription?.status === 'ACTIVE'
  const isSubPending = subscription?.status === 'PENDING'
  const isSubOverdue = subscription?.status === 'OVERDUE'
  const isSubCancelled = subscription?.status === 'CANCELLED'

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header com Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-neutral-900">
                Assinatura do Plano DiretoLink
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                ASAAS {environment}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Gestão de mensalidade recorrente e integração com gateway Asaas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadSubscription}
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          title="Recarregar dados do servidor Asaas"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar Status</span>
        </button>
      </div>

      {/* Card Principal do Plano */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100/60 border border-neutral-200/90 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Plano Selecionado
            </span>
            {isSubActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ativo</span>
              </span>
            ) : isSubPending ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Aguardando Pagamento</span>
              </span>
            ) : isSubOverdue ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Em Atraso</span>
              </span>
            ) : isSubCancelled ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-200 text-neutral-700">
                <span>Cancelado</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <span>Disponível para Teste</span>
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <h3 className="text-xl sm:text-2xl font-black text-neutral-900">
              DiretoLink Pro
            </h3>
            <span className="text-xl sm:text-2xl font-black text-teal-600 font-mono">
              R$ 69,99
            </span>
            <span className="text-xs text-neutral-500 font-medium">/ mês</span>
          </div>

          <p className="text-xs text-neutral-600 max-w-lg">
            Acesso ilimitado ao Cardápio Digital, Central de Pedidos, Agendamento Online, Mesas, Fidelidade e Motoboys.
          </p>

          {/* Dados da Assinatura se existente */}
          {subscription && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 font-medium">
              {subscription.nextDueDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    Próximo Vencimento: <strong className="text-neutral-900 font-mono">{subscription.nextDueDate.split('-').reverse().join('/')}</strong>
                  </span>
                </div>
              )}
              {subscription.paymentMethod && (
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    Método:{' '}
                    <strong className="text-neutral-900">
                      {subscription.paymentMethod === 'PIX' ? 'Pix Automático' : 'Cartão Recorrente'}
                    </strong>
                  </span>
                </div>
              )}
              {subscription.asaasSubscriptionId && (
                <div className="text-[11px] font-mono text-neutral-400">
                  ID Asaas: {subscription.asaasSubscriptionId}
                </div>
              )}
              {subscription.lastPaymentDate && (
                <div className="text-[11px] text-emerald-700">
                  Último pagamento: {new Date(subscription.lastPaymentDate).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botões de Ação do Plano */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
          {!isSubActive && (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleStartPixSubscription}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                <span>Assinar via Pix Automático</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsCardModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>Assinar via Cartão Recorrente</span>
              </button>
            </>
          )}

          {subscription?.pixCopiaECola && !isSubActive && (
            <button
              type="button"
              onClick={() => {
                setPixData({
                  encodedImage: subscription.pixQrCodeUrl ? subscription.pixQrCodeUrl.replace('data:image/png;base64,', '') : '',
                  payload: subscription.pixCopiaECola || '',
                  expirationDate: subscription.pixExpirationDate || '',
                })
                setIsPixModalOpen(true)
              }}
              className="px-4 py-2.5 rounded-xl border border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-teal-600" />
              <span>Ver QR Code Pix Atual</span>
            </button>
          )}

          {subscription && !isSubCancelled && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsCancelModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancelar Assinatura</span>
            </button>
          )}
        </div>
      </div>

      {/* Informações Técnicas da Integração Sandbox */}
      <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs text-neutral-600">
        <div className="flex items-center gap-2 font-bold text-neutral-800">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Configuração da Integração Asaas ({environment})</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          • <strong>Ambiente Atual:</strong> {environment} (Sem cobranças reais no cartão ou Pix).<br />
          • <strong>Endpoint do Webhook:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-mono text-neutral-800">/api/asaas/webhook</code> (Idempotência e atualização de status ativas).<br />
          • <strong>Segurança:</strong> Chaves de API mantidas exclusivamente no servidor via process.env.ASAAS_API_KEY.<br />
          • <strong>Política Operacional:</strong> O bloqueio de empresas ainda não está ativo para garantir a continuidade dos testes.
        </p>
      </div>

      {/* MODAL: QR CODE PIX */}
      {isPixModalOpen && pixData && (
        <div className="fixed inset-0 z-60 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 text-center">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-teal-50 text-teal-700 border border-teal-200">
                Pix Asaas • R$ 69,99
              </span>
              <button
                type="button"
                onClick={() => setIsPixModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="font-bold text-base text-neutral-900">
                Pagamento via Pix
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Escaneie o QR Code ou copie o código Pix abaixo no app do seu banco para ativar a assinatura.
              </p>
            </div>

            {/* Imagem do QR Code */}
            {pixData.encodedImage && (
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 inline-block mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${pixData.encodedImage}`}
                  alt="QR Code Pix Asaas"
                  className="w-48 h-48 object-contain mx-auto rounded-lg"
                />
              </div>
            )}

            {/* Linha digitável Copia e Cola */}
            {pixData.payload && (
              <div className="space-y-2 text-left">
                <label className="block text-[11px] font-bold text-neutral-700 uppercase">
                  Pix Copia e Cola
                </label>
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-[11px] text-neutral-700 break-all max-h-20 overflow-y-auto">
                  {pixData.payload}
                </div>
                <button
                  type="button"
                  onClick={copyPixCode}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Código Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Código Pix</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPixModalOpen(false)
                  loadSubscription()
                }}
                className="w-full py-2 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-semibold hover:bg-neutral-50"
              >
                Fechar e Conferir Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CARTÃO DE CRÉDITO RECORRENTE */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-60 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-neutral-900 text-white">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">
                  Assinar com Cartão Recorrente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCardModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Valor da assinatura: <strong className="text-neutral-900">R$ 69,99 / mês</strong>. No ambiente Sandbox, utilize dados de teste do Asaas.
            </p>

            <form onSubmit={handleStartCardSubscription} className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Nome Impresso no Cartão *
                </label>
                <input
                  type="text"
                  required
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  placeholder="NOME COMPLETO"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 uppercase focus:outline-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Número do Cartão *
                </label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Validade (MM/AA) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="12/28"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-center focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    CVV *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={cardCcv}
                    onChange={(e) => setCardCcv(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-center focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  CPF/CNPJ do Titular *
                </label>
                <input
                  type="text"
                  required
                  value={cardCpfCnpj}
                  onChange={(e) => setCardCpfCnpj(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    CEP *
                  </label>
                  <input
                    type="text"
                    required
                    value={cardPostalCode}
                    onChange={(e) => setCardPostalCode(e.target.value)}
                    placeholder="89200-000"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Número do Endereço *
                  </label>
                  <input
                    type="text"
                    required
                    value={cardAddressNumber}
                    onChange={(e) => setCardAddressNumber(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-xs hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processando no Asaas...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirmar Assinatura R$ 69,99/mês</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CANCELAMENTO */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-60 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>

            <div>
              <h4 className="font-bold text-base text-neutral-900">
                Cancelar Assinatura?
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                A assinatura será inativada no Asaas. No ambiente Sandbox, você pode reativar ou criar uma nova assinatura a qualquer momento.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-semibold hover:bg-neutral-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCancelSubscription}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelando...' : 'Sim, Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
