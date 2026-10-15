'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageCircle,
  Plus,
  Trash2,
  Edit,
  Save,
  Check,
  X,
  Filter,
  Sparkles,
  Scissors,
  Coffee,
  CalendarCheck,
  Phone,
  Layers,
  ChevronRight,
  UserPlus,
  Settings,
  CalendarPlus,
  RotateCcw,
  Info,
  Send,
} from 'lucide-react'
import {
  Company,
  Appointment,
  AppointmentStatus,
  CompanyProfessional,
  BookingSettings,
  BookingMode,
  DaySchedule,
  CompanyService,
} from '@/types/platform'
import {
  getCompanyAppointments,
  fetchCompanyAppointmentsFromServer,
  updateAppointmentStatusOnServerApi,
  createAppointmentOnServerApi,
  getCompanyProfessionals,
  fetchCompanyProfessionalsFromServer,
  saveCompanyProfessionalOnServerApi,
  deleteCompanyProfessionalOnServerApi,
  getCompanyServices,
  saveCompany,
  DATA_CHANGE_EVENT,
} from '@/lib/storage'
import { formatPhone, normalizePhone } from '@/lib/utils'

interface AppointmentsTabProps {
  company: Company
  onUpdateCompany: (updated: Company) => void
}

const DEFAULT_WHATSAPP_BOOKING_TEMPLATE =
  'Olá! Gostaria de agendar um horário na {empresa}. Poderia me informar os horários disponíveis?'

const DEFAULT_CONFIRMATION_TEMPLATE =
  'Olá {cliente}! Confirmamos o seu agendamento de {servico} na {empresa} para {data} às {horario}. Aguardamos você!'

const WEEKDAYS = [
  { index: 0, label: 'Domingo', short: 'Dom' },
  { index: 1, label: 'Segunda-feira', short: 'Seg' },
  { index: 2, label: 'Terça-feira', short: 'Ter' },
  { index: 3, label: 'Quarta-feira', short: 'Qua' },
  { index: 4, label: 'Quinta-feira', short: 'Qui' },
  { index: 5, label: 'Sexta-feira', short: 'Sex' },
  { index: 6, label: 'Sábado', short: 'Sáb' },
]

const DEFAULT_DAYS: DaySchedule[] = [
  { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '13:00' },
  { dayOfWeek: 1, isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 2, isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 3, isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 4, isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 5, isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 6, isOpen: true, openTime: '08:00', closeTime: '17:00' },
]

type SubTabType = 'list' | 'settings' | 'hours' | 'professionals'

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  company,
  onUpdateCompany,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('list')
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    getCompanyAppointments(company.id)
  )
  const [professionals, setProfessionals] = useState<CompanyProfessional[]>(() =>
    getCompanyProfessionals(company.id)
  )
  const [services, setServices] = useState<CompanyService[]>(() =>
    getCompanyServices(company.id)
  )

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Booking settings state
  const [settings, setSettings] = useState<BookingSettings>(() => {
    return (
      company.bookingSettings || {
        mode: 'diretolink',
        whatsappMessageTemplate: DEFAULT_WHATSAPP_BOOKING_TEMPLATE,
        confirmationWhatsAppTemplate: DEFAULT_CONFIRMATION_TEMPLATE,
        slotDurationMinutes: 30,
        days: DEFAULT_DAYS,
        blockedDates: [],
      }
    )
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [newBlockedDate, setNewBlockedDate] = useState('')

  // Professional modal state
  const [isProfModalOpen, setIsProfModalOpen] = useState(false)
  const [editingProf, setEditingProf] = useState<CompanyProfessional | null>(null)
  const [profName, setProfName] = useState('')
  const [profRole, setProfRole] = useState('')
  const [profServices, setProfServices] = useState<string[]>([])
  const [isSavingProf, setIsSavingProf] = useState(false)

  // Manual appointment modal state (Requirement 2)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [manualCustomerName, setManualCustomerName] = useState('')
  const [manualCustomerPhone, setManualCustomerPhone] = useState('')
  const [manualServiceSelection, setManualServiceSelection] = useState<string>('')
  const [manualCustomServiceName, setManualCustomServiceName] = useState('')
  const [manualCustomServicePrice, setManualCustomServicePrice] = useState<string>('')
  const [manualCustomDuration, setManualCustomDuration] = useState<string>('30')
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0])
  const [manualTime, setManualTime] = useState('09:00')
  const [manualProfessionalId, setManualProfessionalId] = useState('')
  const [manualNotes, setManualNotes] = useState('')
  const [manualStatus, setManualStatus] = useState<AppointmentStatus>('confirmed')
  const [isSavingManual, setIsSavingManual] = useState(false)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadData = useCallback(() => {
    setAppointments(getCompanyAppointments(company.id))
    setProfessionals(getCompanyProfessionals(company.id))
    setServices(getCompanyServices(company.id))
  }, [company.id])

  useEffect(() => {
    loadData()
    fetchCompanyAppointmentsFromServer(company.id).then(() => loadData())
    fetchCompanyProfessionalsFromServer(company.id).then(() => loadData())

    const handleSync = () => loadData()
    window.addEventListener(DATA_CHANGE_EVENT, handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [company.id, loadData])

  // Toggle Module Status
  const handleToggleModule = async () => {
    const current = Boolean(company.modules?.appointments)
    const updated: Company = {
      ...company,
      modules: {
        ...company.modules,
        appointments: !current,
      },
    }
    await saveCompany(updated)
    onUpdateCompany(updated)
    showToast('success', !current ? 'Módulo de Agendamento ativado!' : 'Módulo de Agendamento desativado.')
  }

  // Update Appointment Status
  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    const ok = await updateAppointmentStatusOnServerApi(id, company.id, status)
    if (ok) {
      showToast('success', `Status atualizado para: ${status.toUpperCase()}`)
      loadData()
    } else {
      showToast('error', 'Erro ao atualizar status.')
    }
  }

  // Contact Customer on WhatsApp
  const handleContactWhatsApp = (appt: Appointment) => {
    const raw = appt.customerPhone || ''
    const clean = normalizePhone(raw)
    if (!clean) {
      showToast('error', 'Telefone do cliente inválido.')
      return
    }

    const [year, month, day] = appt.date.split('-')
    const formattedDate = `${day}/${month}/${year}`
    const message = `Olá, ${appt.customerName}! Aqui é da ${company.name}. Estou entrando em contato sobre o seu agendamento de "${appt.serviceName}" marcado para ${formattedDate} às ${appt.time}.`
    const phoneWithDDI = clean.startsWith('55') ? clean : `55${clean}`
    const url = `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Confirm Appointment with Customer on WhatsApp (Requirement 3)
  const handleConfirmWhatsApp = async (appt: Appointment) => {
    const raw = appt.customerPhone || ''
    const clean = normalizePhone(raw)
    if (!clean) {
      showToast('error', 'Telefone do cliente inválido.')
      return
    }

    const [year, month, day] = appt.date.split('-')
    const formattedDate = `${day}/${month}/${year}`

    const template =
      company.bookingSettings?.confirmationWhatsAppTemplate?.trim() ||
      settings.confirmationWhatsAppTemplate?.trim() ||
      DEFAULT_CONFIRMATION_TEMPLATE

    const message = template
      .replace(/{cliente}/gi, appt.customerName)
      .replace(/{servico}/gi, appt.serviceName)
      .replace(/{data}/gi, formattedDate)
      .replace(/{horario}/gi, appt.time)
      .replace(/{empresa}/gi, company.name)

    const phoneWithDDI = clean.startsWith('55') ? clean : `55${clean}`
    const url = `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')

    // Se estiver pendente, confirma automaticamente o agendamento
    if (appt.status === 'pending') {
      await handleUpdateStatus(appt.id, 'confirmed')
      showToast('success', 'Mensagem enviada e agendamento confirmado!')
    } else {
      showToast('success', 'WhatsApp aberto com mensagem de confirmação!')
    }
  }

  // Create Manual Appointment (Requirement 2: Não bloquear horários repetidos)
  const handleCreateManualAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCustomerName.trim()) {
      showToast('error', 'Nome do cliente é obrigatório.')
      return
    }
    const cleanPhone = normalizePhone(manualCustomerPhone)
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('error', 'Informe um telefone válido com DDD.')
      return
    }
    if (!manualDate || !manualTime) {
      showToast('error', 'Data e horário são obrigatórios.')
      return
    }

    let serviceId = ''
    let serviceName = ''
    let servicePrice: number | null = null
    let serviceDuration: number | null = null

    if (manualServiceSelection === 'custom' || services.length === 0) {
      if (!manualCustomServiceName.trim()) {
        showToast('error', 'Nome do serviço é obrigatório.')
        return
      }
      serviceId = `srv_custom_${Date.now()}`
      serviceName = manualCustomServiceName.trim()
      servicePrice = manualCustomServicePrice ? parseFloat(manualCustomServicePrice) : null
      serviceDuration = manualCustomDuration ? parseInt(manualCustomDuration, 10) : 30
    } else {
      const selected = services.find((s) => s.id === manualServiceSelection)
      if (!selected) {
        showToast('error', 'Por favor, selecione um serviço.')
        return
      }
      serviceId = selected.id
      serviceName = selected.name
      servicePrice = selected.price ?? null
      serviceDuration = selected.durationMinutes ?? 30
    }

    let resolvedProfName: string | undefined = undefined
    if (manualProfessionalId) {
      const prof = professionals.find((p) => p.id === manualProfessionalId)
      if (prof) resolvedProfName = prof.name
    }

    setIsSavingManual(true)
    const newAppt: Appointment = {
      id: `apt_man_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId: company.id,
      serviceId,
      serviceName,
      servicePrice,
      serviceDurationMinutes: serviceDuration,
      professionalId: manualProfessionalId || undefined,
      professionalName: resolvedProfName,
      date: manualDate,
      time: manualTime,
      customerName: manualCustomerName.trim(),
      customerPhone: cleanPhone,
      status: manualStatus,
      notes: manualNotes.trim() || undefined,
      origin: 'manual', // Backend skips conflict check for manual appointments
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const res = await createAppointmentOnServerApi(newAppt)
    setIsSavingManual(false)

    if (res.success) {
      showToast('success', 'Agendamento cadastrado com sucesso!')
      setIsManualModalOpen(false)
      // Reset form
      setManualCustomerName('')
      setManualCustomerPhone('')
      setManualCustomServiceName('')
      setManualCustomServicePrice('')
      setManualNotes('')
      setManualProfessionalId('')
      setManualStatus('confirmed')
      loadData()
    } else {
      showToast('error', res.error || 'Erro ao salvar agendamento manual.')
    }
  }

  // Save Booking Settings (Mode & Custom WhatsApp Templates)
  const handleSaveBookingConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    const updatedCompany: Company = {
      ...company,
      bookingSettings: settings,
    }
    await saveCompany(updatedCompany)
    try {
      await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          bookingSettings: settings,
        }),
      })
    } catch (err) {
      console.error('Error syncing booking settings to server:', err)
    }
    onUpdateCompany(updatedCompany)
    setIsSavingSettings(false)
    showToast('success', 'Configurações de agendamento salvas com sucesso!')
  }

  // Save Schedule Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    const updatedCompany: Company = {
      ...company,
      bookingSettings: settings,
    }
    await saveCompany(updatedCompany)
    onUpdateCompany(updatedCompany)
    setIsSavingSettings(false)
    showToast('success', 'Horários e pausas salvos com sucesso!')
  }

  // Add Blocked Date
  const handleAddBlockedDate = () => {
    if (!newBlockedDate) return
    const current = settings.blockedDates || []
    if (current.includes(newBlockedDate)) {
      showToast('error', 'Esta data já está bloqueada.')
      return
    }
    setSettings({
      ...settings,
      blockedDates: [...current, newBlockedDate].sort(),
    })
    setNewBlockedDate('')
  }

  // Remove Blocked Date
  const handleRemoveBlockedDate = (d: string) => {
    setSettings({
      ...settings,
      blockedDates: (settings.blockedDates || []).filter((item) => item !== d),
    })
  }

  // Professional Modal Handlers
  const handleOpenAddProf = () => {
    setEditingProf(null)
    setProfName('')
    setProfRole('')
    setProfServices([])
    setIsProfModalOpen(true)
  }

  const handleOpenEditProf = (p: CompanyProfessional) => {
    setEditingProf(p)
    setProfName(p.name || '')
    setProfRole(p.role || '')
    setProfServices(p.serviceIds || [])
    setIsProfModalOpen(true)
  }

  const handleSaveProf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profName.trim()) {
      showToast('error', 'Nome do profissional é obrigatório.')
      return
    }

    setIsSavingProf(true)
    const prof: CompanyProfessional = {
      id: editingProf ? editingProf.id : `prf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId: company.id,
      name: profName.trim(),
      role: profRole.trim(),
      serviceIds: profServices,
      isActive: editingProf ? editingProf.isActive : true,
      createdAt: editingProf?.createdAt || new Date().toISOString(),
    }

    const res = await saveCompanyProfessionalOnServerApi(prof)
    setIsSavingProf(false)
    if (res.success) {
      showToast('success', editingProf ? 'Profissional atualizado!' : 'Profissional cadastrado!')
      setIsProfModalOpen(false)
      loadData()
    } else {
      showToast('error', res.error || 'Erro ao salvar profissional.')
    }
  }

  const handleDeleteProf = async (p: CompanyProfessional) => {
    if (!confirm(`Deseja remover o profissional "${p.name}"?`)) return
    await deleteCompanyProfessionalOnServerApi(p.id, company.id)
    showToast('success', `Profissional "${p.name}" removido.`)
    loadData()
  }

  // Filtered Appointments
  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    if (dateFilter && a.date !== dateFilter) return false
    return true
  })

  const isModuleActive = Boolean(company.modules?.appointments)

  const pendingCount = appointments.filter((a) => a.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 ${
              toastMessage.type === 'success'
                ? 'bg-neutral-900 border border-neutral-800'
                : 'bg-red-600 border border-red-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-violet-400" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Top Header & Module Switch */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                Agendamento de Horários
              </h2>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isModuleActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {isModuleActive ? 'Módulo Ativo' : 'Módulo Desativado'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Permita que seus clientes reservem serviços online sem duplicidade de horários ou profissionais.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleModule}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto ${
              isModuleActive
                ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {isModuleActive ? 'Desativar Agendamento' : 'Ativar Agendamento na Página'}
          </button>
        </div>

        {/* Sub-tabs navigation */}
        <div className="flex items-center gap-2 pt-3 border-t border-neutral-100 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSubTab('list')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeSubTab === 'list'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Agendamentos</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-neutral-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Modo & WhatsApp</span>
            <span
              className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                settings.mode === 'whatsapp'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-violet-100 text-violet-700'
              }`}
            >
              {settings.mode === 'whatsapp' ? 'WhatsApp' : 'DiretoLink'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('hours')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeSubTab === 'hours'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Horários & Pausas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('professionals')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeSubTab === 'professionals'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Profissionais (Opcional)</span>
            <span className="text-[10px] text-neutral-400 bg-white/40 px-1.5 py-0.2 rounded-full border border-neutral-200/50">
              {professionals.length}
            </span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: LISTA DE AGENDAMENTOS */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'pending', label: 'Pendentes' },
                { id: 'confirmed', label: 'Confirmados' },
                { id: 'completed', label: 'Concluídos' },
                { id: 'cancelled', label: 'Cancelados' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setFilterStatus(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filterStatus === st.id
                      ? 'bg-violet-600 text-white font-semibold shadow-2xs'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={dateFilter || ''}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:outline-none focus:border-violet-600 cursor-pointer"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                  title="Limpar filtro de data"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setManualDate(new Date().toISOString().split('T')[0])
                  setManualTime('09:00')
                  setManualCustomerName('')
                  setManualCustomerPhone('')
                  setManualServiceSelection(services[0]?.id || 'custom')
                  setManualCustomServiceName('')
                  setManualCustomServicePrice('')
                  setManualCustomDuration('30')
                  setManualNotes('')
                  setManualProfessionalId('')
                  setManualStatus('confirmed')
                  setIsManualModalOpen(true)
                }}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Agendamento</span>
              </button>
            </div>
          </div>

          {/* Appointments Grid / List */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  Quando seus clientes agendarem horários pela sua página pública, as solicitações aparecerão aqui em tempo real.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map((appt) => {
                const [y, m, d] = appt.date.split('-')
                const formattedDate = `${d}/${m}/${y}`

                const statusStyles = {
                  pending: 'bg-amber-50 text-amber-800 border-amber-200',
                  confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  completed: 'bg-blue-50 text-blue-800 border-blue-200',
                  cancelled: 'bg-neutral-100 text-neutral-500 border-neutral-200',
                }

                const statusLabels = {
                  pending: 'Pendente',
                  confirmed: 'Confirmado',
                  completed: 'Concluído',
                  cancelled: 'Cancelado',
                }

                return (
                  <div
                    key={appt.id}
                    className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-4 flex flex-col justify-between space-y-4 hover:border-neutral-300 transition-all"
                  >
                    {/* Top row: Customer and Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          <h4 className="font-bold text-neutral-900 text-sm leading-snug">
                            {appt.customerName}
                          </h4>
                          {appt.origin === 'manual' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              Manual
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-neutral-500 mt-0.5">
                          {formatPhone(appt.customerPhone)}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          statusStyles[appt.status]
                        }`}
                      >
                        {statusLabels[appt.status]}
                      </span>
                    </div>

                    {/* Service & Schedule details */}
                    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-violet-600" />
                          {appt.serviceName}
                        </span>
                        {appt.servicePrice != null && (
                          <span className="font-mono font-bold text-neutral-900">
                            R$ {appt.servicePrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-neutral-600 text-[11px]">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-neutral-400" />
                          {formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {appt.time}
                        </span>
                        {appt.professionalName && (
                          <span className="flex items-center gap-1 text-violet-700 font-medium">
                            <User className="w-3 h-3 text-violet-500" />
                            {appt.professionalName}
                          </span>
                        )}
                      </div>

                      {appt.notes && (
                        <p className="text-[11px] text-neutral-500 italic pt-1 border-t border-neutral-200/50">
                          Obs: {appt.notes}
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* WhatsApp Confirm Button (Requirement 3) */}
                        <button
                          type="button"
                          onClick={() => handleConfirmWhatsApp(appt)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          title="Abrir WhatsApp com mensagem pronta de confirmação"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Confirmar pelo WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleContactWhatsApp(appt)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs transition-colors cursor-pointer"
                          title="Falar no WhatsApp sem mensagem de confirmação"
                        >
                          <Send className="w-3 h-3 text-neutral-500" />
                          <span>Falar</span>
                        </button>
                      </div>

                      {/* Status Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {appt.status !== 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'pending')}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Marcar como pendente"
                          >
                            Pendente
                          </button>
                        )}
                        {appt.status !== 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Confirmar agendamento"
                          >
                            Confirmar
                          </button>
                        )}
                        {appt.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'completed')}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Marcar como concluído"
                          >
                            Concluir
                          </button>
                        )}
                        {appt.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-700 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Cancelar agendamento"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: MODO DE AGENDAMENTO & WHATSAPP (Requirement 1 & 3) */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveBookingConfig} className="space-y-6">
          {/* Card 1: Seleção de Modo */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-600" />
                <h3 className="font-bold text-neutral-900 text-sm">
                  Modo de Agendamento
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Escolha como os clientes vão interagir com o botão &quot;Agendar Horário&quot; na sua Página Pública.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {/* Option 1: Agendamento pela DiretoLink */}
              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                  (settings.mode || 'diretolink') === 'diretolink'
                    ? 'bg-violet-50/40 border-violet-600 shadow-xs'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-neutral-900">
                        Agendamento pela DiretoLink
                      </h4>
                      <span className="text-[10px] font-semibold text-violet-700 bg-violet-100 px-2 py-0.2 rounded-full inline-block mt-0.5">
                        Página Pública Completa
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="bookingMode"
                    value="diretolink"
                    checked={(settings.mode || 'diretolink') === 'diretolink'}
                    onChange={() => setSettings({ ...settings, mode: 'diretolink' })}
                    className="w-4 h-4 accent-violet-600 cursor-pointer mt-1"
                  />
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  O cliente escolhe o serviço, profissional (opcional), data e horário disponível direto na sua página pública com validação de horários em tempo real.
                </p>
                <div className="text-[11px] font-semibold text-violet-800 bg-violet-100/70 p-2.5 rounded-xl">
                  ✓ Mantém exatamente o agendamento atual da DiretoLink
                </div>
              </label>

              {/* Option 2: Agendamento pelo WhatsApp */}
              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                  settings.mode === 'whatsapp'
                    ? 'bg-emerald-50/40 border-emerald-600 shadow-xs'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-neutral-900">
                        Agendamento pelo WhatsApp
                      </h4>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full inline-block mt-0.5">
                        Contato Direto
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="bookingMode"
                    value="whatsapp"
                    checked={settings.mode === 'whatsapp'}
                    onChange={() => setSettings({ ...settings, mode: 'whatsapp' })}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer mt-1"
                  />
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  O botão &quot;Agendar Horário&quot; da Página Pública abre diretamente o WhatsApp da empresa. Não solicita profissional, data ou horário na página pública.
                </p>
                <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 p-2.5 rounded-xl">
                  ✓ O cliente envia uma mensagem personalizada direto no seu WhatsApp
                </div>
              </label>
            </div>
          </div>

          {/* Card 2: Mensagem para o cliente agendar pelo WhatsApp */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-neutral-900 text-sm">
                  Mensagem de Agendamento pelo WhatsApp
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Configure a mensagem que será enviada pelo cliente ao clicar em &quot;Agendar Horário&quot; na Página Pública (usada quando o modo WhatsApp estiver ativo).
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700">
                Texto da mensagem
              </label>
              <textarea
                rows={3}
                value={settings.whatsappMessageTemplate ?? DEFAULT_WHATSAPP_BOOKING_TEMPLATE}
                onChange={(e) =>
                  setSettings({ ...settings, whatsappMessageTemplate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600 font-mono"
                placeholder={DEFAULT_WHATSAPP_BOOKING_TEMPLATE}
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-neutral-400 font-medium">Inserir variável:</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = settings.whatsappMessageTemplate ?? DEFAULT_WHATSAPP_BOOKING_TEMPLATE
                    setSettings({ ...settings, whatsappMessageTemplate: `${current} {empresa}` })
                  }}
                  className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-[10px] font-mono cursor-pointer"
                >
                  {'{empresa}'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const current = settings.whatsappMessageTemplate ?? DEFAULT_WHATSAPP_BOOKING_TEMPLATE
                    setSettings({ ...settings, whatsappMessageTemplate: `${current} {servico}` })
                  }}
                  className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-[10px] font-mono cursor-pointer"
                >
                  {'{servico}'}
                </button>
              </div>

              {/* Prévia */}
              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/70 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Exemplo de mensagem que o cliente enviará:
                </span>
                <p className="text-neutral-800 italic">
                  &ldquo;
                  {(settings.whatsappMessageTemplate || DEFAULT_WHATSAPP_BOOKING_TEMPLATE)
                    .replace(/{empresa}/gi, company.name)
                    .replace(/{servico}/gi, services[0]?.name || 'Corte e Barba')}
                  &rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Mensagem de "Confirmar pelo WhatsApp" (Requirement 3) */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-neutral-900 text-sm">
                  Mensagem de Confirmação pelo WhatsApp
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Mensagem que sua empresa envia para o cliente ao clicar em &quot;Confirmar pelo WhatsApp&quot; na lista de agendamentos do painel.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700">
                Texto da mensagem de confirmação
              </label>
              <textarea
                rows={3}
                value={settings.confirmationWhatsAppTemplate ?? DEFAULT_CONFIRMATION_TEMPLATE}
                onChange={(e) =>
                  setSettings({ ...settings, confirmationWhatsAppTemplate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600 font-mono"
                placeholder={DEFAULT_CONFIRMATION_TEMPLATE}
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-neutral-400 font-medium">Inserir variável:</span>
                {[
                  { tag: '{cliente}', label: 'Nome do cliente' },
                  { tag: '{servico}', label: 'Serviço' },
                  { tag: '{data}', label: 'Data' },
                  { tag: '{horario}', label: 'Horário' },
                  { tag: '{empresa}', label: 'Nome da empresa' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      const current = settings.confirmationWhatsAppTemplate ?? DEFAULT_CONFIRMATION_TEMPLATE
                      setSettings({ ...settings, confirmationWhatsAppTemplate: `${current} ${item.tag}` })
                    }}
                    className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-[10px] font-mono cursor-pointer"
                    title={item.label}
                  >
                    {item.tag}
                  </button>
                ))}
              </div>

              {/* Prévia */}
              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/70 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Exemplo de mensagem de confirmação que o cliente receberá:
                </span>
                <p className="text-neutral-800 italic">
                  &ldquo;
                  {(settings.confirmationWhatsAppTemplate || DEFAULT_CONFIRMATION_TEMPLATE)
                    .replace(/{cliente}/gi, 'Mariana Silva')
                    .replace(/{servico}/gi, services[0]?.name || 'Pé e Mão')
                    .replace(/{data}/gi, '15/10/2026')
                    .replace(/{horario}/gi, '09:00')
                    .replace(/{empresa}/gi, company.name)}
                  &rdquo;
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setSettings({
                    ...settings,
                    whatsappMessageTemplate: DEFAULT_WHATSAPP_BOOKING_TEMPLATE,
                    confirmationWhatsAppTemplate: DEFAULT_CONFIRMATION_TEMPLATE,
                  })
                  showToast('success', 'Mensagens redefinidas para o padrão.')
                }}
                className="text-xs text-neutral-500 hover:text-neutral-800 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Mensagens Padrão</span>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Salvando...' : 'Salvar Configurações de Agendamento'}</span>
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 2: HORÁRIOS & DIAS DE ATENDIMENTO */}
      {activeSubTab === 'hours' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="font-bold text-neutral-900 text-sm">
                Dias de Atendimento e Horários
              </h3>
              <p className="text-xs text-neutral-500">
                Defina os dias em que sua empresa atende, horário de início e término e pausa para almoço.
              </p>
            </div>

            {/* Weekly Days List */}
            <div className="space-y-3">
              {WEEKDAYS.map((wd) => {
                const dayConfig =
                  settings.days.find((d) => d.dayOfWeek === wd.index) || {
                    dayOfWeek: wd.index,
                    isOpen: false,
                    openTime: '08:00',
                    closeTime: '18:00',
                  }

                const handleToggleDay = (checked: boolean) => {
                  const updatedDays = settings.days.map((d) =>
                    d.dayOfWeek === wd.index ? { ...d, isOpen: checked } : d
                  )
                  if (!settings.days.some((d) => d.dayOfWeek === wd.index)) {
                    updatedDays.push({ ...dayConfig, isOpen: checked })
                  }
                  setSettings({ ...settings, days: updatedDays })
                }

                const handleUpdateTimes = (field: string, val: string) => {
                  const updatedDays = settings.days.map((d) =>
                    d.dayOfWeek === wd.index ? { ...d, [field]: val } : d
                  )
                  setSettings({ ...settings, days: updatedDays })
                }

                return (
                  <div
                    key={wd.index}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      dayConfig.isOpen
                        ? 'bg-neutral-50/80 border-neutral-200'
                        : 'bg-neutral-50/30 border-neutral-200/50 opacity-60'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer min-w-[140px]">
                      <input
                        type="checkbox"
                        checked={Boolean(dayConfig?.isOpen ?? false)}
                        onChange={(e) => handleToggleDay(e.target.checked)}
                        className="w-4 h-4 accent-violet-600 rounded"
                      />
                      <span className="text-xs font-bold text-neutral-900">
                        {wd.label}
                      </span>
                    </label>

                    {dayConfig.isOpen && (
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                        {/* Open and Close */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-500 text-[11px]">Abre:</span>
                          <input
                            type="time"
                            value={dayConfig.openTime || '08:00'}
                            onChange={(e) => handleUpdateTimes('openTime', e.target.value)}
                            className="px-2 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-500 text-[11px]">Fecha:</span>
                          <input
                            type="time"
                            value={dayConfig.closeTime || '18:00'}
                            onChange={(e) => handleUpdateTimes('closeTime', e.target.value)}
                            className="px-2 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-mono"
                          />
                        </div>

                        {/* Lunch Break */}
                        <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-neutral-200">
                          <span className="text-neutral-400 text-[11px]">Pausa:</span>
                          <input
                            type="time"
                            value={dayConfig.breakStart || ''}
                            onChange={(e) => handleUpdateTimes('breakStart', e.target.value)}
                            className="px-2 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-mono"
                            placeholder="12:00"
                          />
                          <span className="text-neutral-400 text-[11px]">às</span>
                          <input
                            type="time"
                            value={dayConfig.breakEnd || ''}
                            onChange={(e) => handleUpdateTimes('breakEnd', e.target.value)}
                            className="px-2 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-mono"
                            placeholder="13:00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Slot duration interval */}
            <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800">
                  Intervalo Padrão entre Horários
                </label>
                <p className="text-[11px] text-neutral-500">
                  Se o serviço não possuir duração cadastrada, este intervalo será utilizado para gerar os horários.
                </p>
              </div>
              <select
                value={settings.slotDurationMinutes || 30}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    slotDurationMinutes: parseInt(e.target.value, 10),
                  })
                }
                className="px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white text-neutral-800 font-semibold cursor-pointer"
              >
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos (recomendado)</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1 hora)</option>
              </select>
            </div>

            {/* Blocked Dates */}
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800">
                  Bloquear Datas Específicas (Feriados / Folgas)
                </label>
                <p className="text-[11px] text-neutral-500">
                  Clientes não poderão agendar horários nos dias bloqueados.
                </p>
              </div>

              <div className="flex items-center gap-2 max-w-sm">
                <input
                  type="date"
                  value={newBlockedDate || ''}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-800 focus:outline-none focus:border-violet-600"
                />
                <button
                  type="button"
                  onClick={handleAddBlockedDate}
                  className="px-3.5 py-2 rounded-xl bg-neutral-900 text-white font-semibold text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Bloquear Dia
                </button>
              </div>

              {settings.blockedDates && settings.blockedDates.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {settings.blockedDates.map((d) => {
                    const [y, m, day] = d.split('-')
                    return (
                      <span
                        key={d}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-mono font-medium"
                      >
                        <span>
                          {day}/{m}/{y}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedDate(d)}
                          className="hover:text-red-900 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? 'Salvando...' : 'Salvar Configurações de Horário'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUBTAB 3: PROFISSIONAIS (OPCIONAL) */}
      {activeSubTab === 'professionals' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">
                  Profissionais da Equipe
                </h3>
                <p className="text-xs text-neutral-500">
                  Cadastrar profissionais é opcional. Se cadastrados, o cliente poderá escolher com quem deseja ser atendido.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddProf}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>Adicionar Profissional</span>
              </button>
            </div>
          </div>

          {professionals.length === 0 ? (
            <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">
                  Nenhum profissional cadastrado
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  Se você atende sozinho ou sua empresa não precisa de divisão por profissional, os agendamentos serão feitos diretamente na agenda da empresa.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {professionals.map((prof) => (
                <div
                  key={prof.id}
                  className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3 flex flex-col justify-between shadow-xs hover:border-neutral-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {prof.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-neutral-900 text-sm truncate">
                          {prof.name}
                        </h4>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {prof.role || 'Profissional'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
                      {prof.serviceIds && prof.serviceIds.length > 0 ? (
                        <span>
                          Atende {prof.serviceIds.length} {prof.serviceIds.length === 1 ? 'serviço' : 'serviços'}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Atende todos os serviços</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProf(prof)}
                      className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                      title="Editar profissional"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProf(prof)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remover profissional"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROFESSIONAL MODAL */}
      {isProfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-2xl max-w-md w-full overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900 text-sm">
                {editingProf ? 'Editar Profissional' : 'Novo Profissional'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProfModalOpen(false)}
                className="w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProf} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome do Profissional <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva, Dra. Juliana..."
                  value={profName ?? ''}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Especialidade / Cargo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Barbeiro Especialista, Esteticista..."
                  value={profRole ?? ''}
                  onChange={(e) => setProfRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600"
                />
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center justify-between">
                  <span>Serviços que este profissional realiza</span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    {profServices.length === 0 ? 'Todos' : `${profServices.length} selecionados`}
                  </span>
                </label>

                {services.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">
                    Nenhum serviço cadastrado ainda. Cadastre serviços na aba &quot;Serviços&quot;.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
                    {services.map((srv) => {
                      const isSelected = profServices.includes(srv.id)
                      return (
                        <label
                          key={srv.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-neutral-200/80 cursor-pointer text-xs"
                        >
                          <span className="font-medium text-neutral-800">{srv.name}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProfServices([...profServices, srv.id])
                              } else {
                                setProfServices(profServices.filter((id) => id !== srv.id))
                              }
                            }}
                            className="w-4 h-4 accent-violet-600 rounded"
                          />
                        </label>
                      )
                    })}
                  </div>
                )}
                <p className="text-[10px] text-neutral-400 mt-1">
                  Deixe vazio para que o profissional atenda todos os serviços cadastrados.
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProf}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingProf ? 'Salvando...' : 'Salvar Profissional'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL APPOINTMENT MODAL (Requirement 2) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-2xl max-w-lg w-full overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-violet-600" />
                <h3 className="font-bold text-neutral-900 text-sm">
                  Novo Agendamento Manual
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualAppointment} className="p-6 space-y-4">
              {/* Info banner about repeated hours */}
              <div className="bg-violet-50/70 border border-violet-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-violet-900">
                <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Horários repetidos permitidos:</span> Você pode cadastrar quantos atendimentos precisar no mesmo horário (ex: 09:00 - Cliente 1, 09:00 - Cliente 2, 09:00 - Cliente 3). Não há bloqueio no cadastro manual.
                </div>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo do cliente"
                  value={manualCustomerName}
                  onChange={(e) => setManualCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Telefone / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(62) 99999-9999"
                  value={manualCustomerPhone}
                  onChange={(e) => setManualCustomerPhone(formatPhone(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600 font-mono"
                />
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Serviço <span className="text-red-500">*</span>
                </label>
                {services.length > 0 ? (
                  <select
                    value={manualServiceSelection}
                    onChange={(e) => setManualServiceSelection(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600 cursor-pointer bg-white"
                  >
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} {srv.price != null ? `(R$ ${srv.price.toFixed(2).replace('.', ',')})` : ''}
                      </option>
                    ))}
                    <option value="custom">+ Outro serviço (personalizado)</option>
                  </select>
                ) : null}

                {(services.length === 0 || manualServiceSelection === 'custom') && (
                  <div className="mt-2 space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Nome do Serviço Personalizado <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={manualServiceSelection === 'custom' || services.length === 0}
                        placeholder="Ex: Pé e Mão, Corte e Escova..."
                        value={manualCustomServiceName}
                        onChange={(e) => setManualCustomServiceName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:border-violet-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={manualCustomServicePrice}
                          onChange={(e) => setManualCustomServicePrice(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:border-violet-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                          Duração (minutos)
                        </label>
                        <input
                          type="number"
                          placeholder="30"
                          value={manualCustomDuration}
                          onChange={(e) => setManualCustomDuration(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:border-violet-600 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600 cursor-pointer bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Horário <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600 font-mono bg-white"
                  />
                </div>
              </div>

              {/* Horários rápidos sugestões */}
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 block mb-1">
                  Horários rápidos:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '14:00', '14:30', '15:00', '16:00', '17:00'].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setManualTime(h)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono cursor-pointer transition-colors ${
                        manualTime === h
                          ? 'bg-violet-600 text-white font-bold'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profissional (opcional) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Profissional <span className="text-neutral-400 font-normal">(opcional)</span>
                </label>
                <select
                  value={manualProfessionalId}
                  onChange={(e) => setManualProfessionalId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600 cursor-pointer bg-white"
                >
                  <option value="">Sem profissional específico / Nenhum</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.role ? `(${p.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observação (opcional) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Observação <span className="text-neutral-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Primeira visita, preferência por esmalte vermelho..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600"
                />
              </div>

              {/* Status inicial */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Status Inicial
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-neutral-800 cursor-pointer">
                    <input
                      type="radio"
                      name="manualStatus"
                      value="confirmed"
                      checked={manualStatus === 'confirmed'}
                      onChange={() => setManualStatus('confirmed')}
                      className="accent-emerald-600"
                    />
                    <span>Confirmado</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-800 cursor-pointer">
                    <input
                      type="radio"
                      name="manualStatus"
                      value="pending"
                      checked={manualStatus === 'pending'}
                      onChange={() => setManualStatus('pending')}
                      className="accent-amber-600"
                    />
                    <span>Pendente</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingManual ? 'Cadastrando...' : 'Cadastrar Agendamento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
