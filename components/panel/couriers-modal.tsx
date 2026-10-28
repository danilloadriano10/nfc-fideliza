'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Bike,
  Plus,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  MessageCircle,
  Power,
  RotateCw,
} from 'lucide-react'
import { Company, CompanyCourier } from '@/types/platform'
import {
  getCompanyCouriers,
  fetchCompanyCouriersFromServer,
  saveCompanyCourierOnServerApi,
  deleteCompanyCourierOnServerApi,
} from '@/lib/storage'
import { formatPhone, getWhatsappLink } from '@/lib/utils'

interface CouriersModalProps {
  company: Company
  isOpen: boolean
  onClose: () => void
  onSelectCourier?: (courier: CompanyCourier) => void
}

export const CouriersModal: React.FC<CouriersModalProps> = ({
  company,
  isOpen,
  onClose,
  onSelectCourier,
}) => {
  const [couriers, setCouriers] = useState<CompanyCourier[]>(() =>
    getCompanyCouriers(company.id)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCourier, setEditingCourier] = useState<CompanyCourier | null>(null)
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type })
    setTimeout(() => setFeedback(null), 3000)
  }

  const loadCouriers = useCallback(async () => {
    if (!company?.id) return
    setIsLoading(true)
    try {
      const serverList = await fetchCompanyCouriersFromServer(company.id)
      if (serverList) {
        setCouriers(serverList)
      }
    } catch {
      setCouriers(getCompanyCouriers(company.id))
    } finally {
      setIsLoading(false)
    }
  }, [company.id])

  useEffect(() => {
    if (isOpen) {
      loadCouriers()
    }
  }, [isOpen, loadCouriers])

  if (!isOpen) return null

  const handleOpenAddForm = () => {
    setEditingCourier(null)
    setFormName('')
    setFormPhone('')
    setFormNotes('')
    setFormActive(true)
    setIsFormOpen(true)
  }

  const handleOpenEditForm = (c: CompanyCourier) => {
    setEditingCourier(c)
    setFormName(c.name || '')
    setFormPhone(c.phone || '')
    setFormNotes(c.notes || '')
    setFormActive(c.isActive !== false)
    setIsFormOpen(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      showToast('O nome do motoboy é obrigatório.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const toSave: CompanyCourier = {
        id: editingCourier ? editingCourier.id : '',
        companyId: company.id,
        name: formName.trim(),
        phone: formPhone.trim(),
        notes: formNotes.trim() || undefined,
        isActive: formActive,
        createdAt: editingCourier?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const res = await saveCompanyCourierOnServerApi(toSave)
      if (res.success) {
        showToast(editingCourier ? 'Motoboy atualizado com sucesso!' : 'Motoboy cadastrado com sucesso!')
        setIsFormOpen(false)
        await loadCouriers()
      } else {
        showToast(res.error || 'Erro ao salvar motoboy.', 'error')
      }
    } catch (err) {
      console.error('Error saving courier:', err)
      showToast('Erro ao salvar motoboy.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (c: CompanyCourier) => {
    try {
      const updated: CompanyCourier = {
        ...c,
        isActive: !c.isActive,
        updatedAt: new Date().toISOString(),
      }
      await saveCompanyCourierOnServerApi(updated)
      setCouriers((prev) => prev.map((item) => (item.id === c.id ? updated : item)))
      showToast(`Motoboy ${updated.isActive ? 'ativado' : 'desativado'}.`)
    } catch {
      showToast('Erro ao alterar status.', 'error')
    }
  }

  const handleDelete = async (c: CompanyCourier) => {
    if (!window.confirm(`Deseja remover o motoboy "${c.name}"?`)) return
    try {
      const ok = await deleteCompanyCourierOnServerApi(c.id, company.id)
      if (ok) {
        setCouriers((prev) => prev.filter((item) => item.id !== c.id))
        showToast('Motoboy removido com sucesso.')
      } else {
        showToast('Erro ao remover motoboy.', 'error')
      }
    } catch {
      showToast('Erro ao remover motoboy.', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
              <Bike className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">
                Gerenciamento de Motoboys
              </h3>
              <p className="text-xs text-neutral-500">
                Cadastre e atribua entregadores para pedidos de entrega (delivery).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Toast */}
        {feedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Conteúdo */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Barra de Ações do Modal */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              {couriers.length} Entregador{couriers.length === 1 ? '' : 'es'} Cadastrado{couriers.length === 1 ? '' : 's'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadCouriers}
                disabled={isLoading}
                className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs"
                title="Atualizar"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              {!isFormOpen && (
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Motoboy</span>
                </button>
              )}
            </div>
          </div>

          {/* Formulário de Adicionar / Editar */}
          {isFormOpen && (
            <form
              onSubmit={handleSaveForm}
              className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                <span className="text-xs font-bold text-teal-900">
                  {editingCourier ? 'Editar Motoboy' : 'Cadastrar Novo Motoboy'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                  Observação Opcional (Moto, Placa, Turno)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Honda CG 160 Fan - Placa ABC1D23 - Turno da Noite"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Motoboy ativo para entregas</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingCourier ? 'Atualizar' : 'Salvar Motoboy'}
                </button>
              </div>
            </form>
          )}

          {/* Lista de Motoboys */}
          {couriers.length === 0 ? (
            <div className="p-8 rounded-2xl border border-neutral-200 text-center space-y-2 bg-neutral-50/50">
              <Bike className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-xs font-semibold text-neutral-700">
                Nenhum motoboy cadastrado ainda.
              </p>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                Cadastre seus entregadores para poder enviar detalhes do pedido e rota direto pelo WhatsApp.
              </p>
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="mt-2 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Primeiro Motoboy</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white overflow-hidden">
              {couriers.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    !c.isActive ? 'bg-neutral-50/80 opacity-75' : 'hover:bg-neutral-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        c.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                      }`}
                    >
                      <Bike className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                          {c.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {c.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{formatPhone(c.phone) || c.phone}</span>
                      </div>

                      {c.notes && (
                        <p className="text-[11px] text-neutral-400 italic mt-0.5">
                          {c.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                    {onSelectCourier && c.isActive && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCourier(c)
                          onClose()
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold transition-all shadow-xs"
                      >
                        Selecionar
                      </button>
                    )}

                    {c.phone && (
                      <a
                        href={getWhatsappLink(c.phone, `Olá ${c.name}, mensagem da ${company.name}:`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        title="Falar no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        c.isActive
                          ? 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                      title={c.isActive ? 'Desativar motoboy' : 'Ativar motoboy'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditForm(c)}
                      className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
