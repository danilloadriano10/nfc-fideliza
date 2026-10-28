'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  QrCode,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Save,
  HelpCircle,
  Sparkles,
  Info,
} from 'lucide-react'
import { Company, CompanyPaymentConfig, PixKeyType } from '@/types/platform'
import { getDefaultCompanyPaymentConfig } from '@/lib/order-delivery'
import { saveCompanyLocally } from '@/lib/storage'

interface PaymentSettingsSectionProps {
  company: Company
  onCompanyUpdate?: (updated: Company) => void
}

export const PaymentSettingsSection: React.FC<PaymentSettingsSectionProps> = ({
  company,
  onCompanyUpdate,
}) => {
  const [config, setConfig] = useState<CompanyPaymentConfig>(() =>
    getDefaultCompanyPaymentConfig(company)
  )
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleToggle = (key: keyof CompanyPaymentConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    // Validação básica se Pix estiver ativo
    if (config.acceptPix && !config.pixKey?.trim()) {
      showToast('Por favor, informe a Chave Pix da sua empresa ou desative o Pix.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const updatedCompany: Company = {
        ...company,
        paymentConfig: {
          ...config,
          pixReceiverName: config.pixReceiverName?.trim() || company.name,
          pixKey: config.pixKey?.trim() || '',
        },
        updatedAt: new Date().toISOString(),
      }

      saveCompanyLocally(updatedCompany)

      const res = await fetch('/api/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCompany),
      })

      if (res.ok) {
        showToast('Formas de pagamento salvas com sucesso!')
        if (onCompanyUpdate) {
          onCompanyUpdate(updatedCompany)
        }
      } else {
        showToast('Configurações salvas localmente com sucesso!')
        if (onCompanyUpdate) {
          onCompanyUpdate(updatedCompany)
        }
      }
    } catch (err) {
      console.error('Error saving payment config:', err)
      showToast('Erro ao salvar no servidor, mantido localmente.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs space-y-6">
      {/* Header da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-base">
              Formas de Pagamento
            </h3>
            <p className="text-xs text-neutral-500">
              Configure as opções que seus clientes verão na finalização de pedidos do cardápio digital.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Salvando...' : 'Salvar Formas de Pagamento'}</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid de Formas de Pagamento Habilitadas */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
          Selecione as formas aceitas pelo seu estabelecimento:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. Pix */}
          <div
            onClick={() => handleToggle('acceptPix')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              config.acceptPix
                ? 'bg-teal-50/60 border-teal-300 ring-1 ring-teal-400/20'
                : 'bg-neutral-50 border-neutral-200 opacity-70 hover:opacity-100'
            }`}
          >
            <input
              type="checkbox"
              checked={config.acceptPix}
              onChange={() => {}} // handled by parent onClick
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-neutral-900 block flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-teal-600" />
                <span>Pix</span>
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Pagamento instantâneo com chave Pix e envio de comprovante.
              </p>
            </div>
          </div>

          {/* 2. Dinheiro */}
          <div
            onClick={() => handleToggle('acceptCash')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              config.acceptCash
                ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20'
                : 'bg-neutral-50 border-neutral-200 opacity-70 hover:opacity-100'
            }`}
          >
            <input
              type="checkbox"
              checked={config.acceptCash}
              onChange={() => {}}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-neutral-900 block flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dinheiro</span>
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Pagamento em dinheiro na entrega/retirada com opção de troco.
              </p>
            </div>
          </div>

          {/* 3. Cartão de Débito */}
          <div
            onClick={() => handleToggle('acceptDebitCard')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              config.acceptDebitCard
                ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/20'
                : 'bg-neutral-50 border-neutral-200 opacity-70 hover:opacity-100'
            }`}
          >
            <input
              type="checkbox"
              checked={config.acceptDebitCard}
              onChange={() => {}}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-neutral-900 block flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Cartão de Débito</span>
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Pagamento na maquininha na entrega, retirada ou mesa.
              </p>
            </div>
          </div>

          {/* 4. Cartão de Crédito */}
          <div
            onClick={() => handleToggle('acceptCreditCard')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              config.acceptCreditCard
                ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-400/20'
                : 'bg-neutral-50 border-neutral-200 opacity-70 hover:opacity-100'
            }`}
          >
            <input
              type="checkbox"
              checked={config.acceptCreditCard}
              onChange={() => {}}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-neutral-900 block flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cartão de Crédito</span>
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Pagamento na maquininha na entrega, retirada ou mesa.
              </p>
            </div>
          </div>

          {/* 5. Vale-refeição */}
          <div
            onClick={() => handleToggle('acceptMealVoucher')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              config.acceptMealVoucher
                ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400/20'
                : 'bg-neutral-50 border-neutral-200 opacity-70 hover:opacity-100'
            }`}
          >
            <input
              type="checkbox"
              checked={config.acceptMealVoucher}
              onChange={() => {}}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-neutral-900 block flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span>Vale-Refeição / VR</span>
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Alelo, VR, Sodexo, Ticket ou Ben na maquininha na entrega/retirada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes do Pix (quando ativado) */}
      {config.acceptPix && (
        <div className="p-4 sm:p-5 rounded-2xl border border-teal-200 bg-teal-50/30 space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-teal-900">
            <QrCode className="w-4 h-4 text-teal-700" />
            <h4 className="font-bold text-xs uppercase tracking-wider">
              Dados da Conta Pix da Empresa ({company.name})
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Nome do Favorecido */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                Nome do Favorecido *
              </label>
              <input
                type="text"
                value={config.pixReceiverName || ''}
                onChange={(e) => setConfig({ ...config, pixReceiverName: e.target.value })}
                placeholder="Ex: Razão Social ou Nome do Titular"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
              />
            </div>

            {/* Tipo de Chave */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                Tipo da Chave Pix *
              </label>
              <select
                value={config.pixKeyType || 'phone'}
                onChange={(e) => setConfig({ ...config, pixKeyType: e.target.value as PixKeyType })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-medium focus:outline-hidden focus:border-teal-500 cursor-pointer"
              >
                <option value="cpf_cnpj">CPF / CNPJ</option>
                <option value="phone">Telefone / Celular</option>
                <option value="email">E-mail</option>
                <option value="random">Chave Aleatória (EVP)</option>
              </select>
            </div>

            {/* Chave Pix */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                Chave Pix *
              </label>
              <input
                type="text"
                value={config.pixKey || ''}
                onChange={(e) => setConfig({ ...config, pixKey: e.target.value })}
                placeholder={
                  config.pixKeyType === 'cpf_cnpj'
                    ? 'Ex: 12.345.678/0001-90'
                    : config.pixKeyType === 'phone'
                    ? 'Ex: (11) 98765-4321'
                    : config.pixKeyType === 'email'
                    ? 'Ex: pix@empresa.com.br'
                    : 'Ex: 123e4567-e89b-12d3-a456-426614174000'
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Opção Exibir Pix para Pagamento Antecipado */}
          <div className="pt-2 border-t border-teal-200/60 flex items-start sm:items-center justify-between gap-3">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-neutral-800">
              <input
                type="checkbox"
                checked={config.pixShowUpfront !== false}
                onChange={(e) => setConfig({ ...config, pixShowUpfront: e.target.checked })}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <div>
                <span>Exibir Pix para pagamento antecipado no checkout</span>
                <p className="text-[11px] font-normal text-neutral-500">
                  Mostra a chave com botão &quot;Copiar Chave Pix&quot; e campo para o cliente anexar o comprovante antes de finalizar o pedido.
                </p>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
