'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Scissors,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react'
import {
  Company,
  CompanyService,
  CompanyProfessional,
  Appointment,
} from '@/types/platform'
import {
  getCompanyServices,
  getCompanyProfessionals,
  createAppointmentOnServerApi,
} from '@/lib/storage'
import { normalizePhone } from '@/lib/utils'
import { getPublicTheme } from '@/lib/public-themes'

interface BookingSheetProps {
  isOpen: boolean
  onClose: () => void
  company: Company
  initialService?: CompanyService | null
}

export const BookingSheet: React.FC<BookingSheetProps> = ({
  isOpen,
  onClose,
  company,
  initialService,
}) => {
  // Steps: 1 = Service, 2 = Professional, 3 = Date & Time, 4 = Contact, 5 = Success
  const [step, setStep] = useState<number>(1)
  const [services, setServices] = useState<CompanyService[]>([])
  const [professionals, setProfessionals] = useState<CompanyProfessional[]>([])

  // Selections
  const [selectedService, setSelectedService] = useState<CompanyService | null>(null)
  const [selectedProf, setSelectedProf] = useState<CompanyProfessional | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')

  // Slot availability
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null)

  // Theme configuration
  const activeTheme = useMemo(
    () => getPublicTheme(company.theme, company.customThemeConfig, company.themeColors),
    [company.theme, company.customThemeConfig, company.themeColors]
  )
  const isDark = activeTheme.isDarkBase ?? false
  const primaryColor = activeTheme.colors.primary || company.primaryColor || '#6D28D9'
  const buttonBg = activeTheme.colors.buttonBg || primaryColor
  const buttonText = activeTheme.colors.buttonText || '#FFFFFF'
  const priceColor = activeTheme.colors.priceColor || (isDark ? '#34D399' : '#059669')

  // Load services & professionals on open
  useEffect(() => {
    if (isOpen) {
      const activeServices = getCompanyServices(company.id).filter((s) => s.isActive !== false)
      setServices(activeServices)

      const activeProfs = getCompanyProfessionals(company.id).filter((p) => p.isActive !== false)
      setProfessionals(activeProfs)

      // Reset state or apply initialService
      if (initialService) {
        setSelectedService(initialService)
        const profs = activeProfs.filter((p) => {
          if (!p.serviceIds || p.serviceIds.length === 0) return true
          return p.serviceIds.includes(initialService.id)
        })
        if (profs.length > 0) {
          setStep(2)
        } else {
          setSelectedProf(null)
          setStep(3)
        }
      } else {
        setStep(1)
        setSelectedService(null)
        setSelectedProf(null)
      }

      setSelectedDate('')
      setSelectedTime('')
      setCustomerName('')
      setCustomerPhone('')
      setErrorMessage(null)
      setCreatedAppointment(null)
    }
  }, [isOpen, company.id, initialService])

  // Available dates (Today + next 14 days)
  const upcomingDates = useMemo(() => {
    const list: { dateString: string; label: string; weekday: string }[] = []
    const now = new Date()

    const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]

    for (let i = 0; i < 14; i++) {
      const d = new Date()
      d.setDate(now.getDate() + i)

      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateString = `${y}-${m}-${day}`

      const weekday = weekdayNames[d.getDay()]
      const label = `${d.getDate()} ${monthNames[d.getMonth()]}`

      list.push({ dateString, label, weekday })
    }
    return list
  }, [])

  // Fetch available slots from backend whenever date or professional changes
  useEffect(() => {
    if (!selectedDate || !selectedService) return

    let isMounted = true
    setIsLoadingSlots(true)
    setErrorMessage(null)
    setSelectedTime('')

    const fetchSlots = async () => {
      try {
        let url = `/api/appointments?companyId=${encodeURIComponent(company.id)}&date=${encodeURIComponent(selectedDate)}&availableSlots=true&serviceId=${encodeURIComponent(selectedService.id)}`
        if (selectedProf) {
          url += `&professionalId=${encodeURIComponent(selectedProf.id)}`
        }

        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.success && Array.isArray(data.availableSlots)) {
            setAvailableSlots(data.availableSlots)
          }
        }
      } catch (err) {
        console.error('Error fetching slots:', err)
      } finally {
        if (isMounted) setIsLoadingSlots(false)
      }
    }

    fetchSlots()
    return () => {
      isMounted = false
    }
  }, [selectedDate, selectedService, selectedProf, company.id])

  if (!isOpen) return null

  // Professionals capable of performing selected service
  const availableProfessionalsForService = selectedService
    ? professionals.filter((p) => {
        if (!p.serviceIds || p.serviceIds.length === 0) return true
        return p.serviceIds.includes(selectedService.id)
      })
    : []

  // Handlers
  const handleSelectService = (srv: CompanyService) => {
    setSelectedService(srv)
    const profs = professionals.filter((p) => {
      if (!p.serviceIds || p.serviceIds.length === 0) return true
      return p.serviceIds.includes(srv.id)
    })
    if (profs.length > 0) {
      setStep(2)
    } else {
      setSelectedProf(null)
      setStep(3)
    }
  }

  const handleSelectProf = (p: CompanyProfessional | null) => {
    setSelectedProf(p)
    setStep(3)
  }

  const handleSelectDateTime = (date: string, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setStep(4)
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService || !selectedDate || !selectedTime || !customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Por favor, preencha todos os dados.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const appt: Appointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId: company.id,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      serviceDurationMinutes: selectedService.durationMinutes,
      professionalId: selectedProf?.id,
      professionalName: selectedProf?.name,
      date: selectedDate,
      time: selectedTime,
      customerName: customerName.trim(),
      customerPhone: normalizePhone(customerPhone),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const res = await createAppointmentOnServerApi(appt)
    setIsSubmitting(false)

    if (res.success && res.appointment) {
      setCreatedAppointment(res.appointment)
      setStep(5)
    } else {
      setErrorMessage(res.error || 'Erro ao realizar agendamento. Tente outro horário.')
    }
  }

  // Notify WhatsApp
  const handleNotifyWhatsApp = () => {
    if (!createdAppointment) return
    const cleanPhone = normalizePhone(company.whatsapp)
    if (!cleanPhone) return

    const [y, m, d] = createdAppointment.date.split('-')
    const formattedDate = `${d}/${m}/${y}`
    const profText = createdAppointment.professionalName ? ` com ${createdAppointment.professionalName}` : ''
    const msg = `Olá! Acabei de solicitar um agendamento na DiretoLink para o serviço "${createdAppointment.serviceName}"${profText} no dia ${formattedDate} às ${createdAppointment.time}. Meu nome é ${createdAppointment.customerName}.`
    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    const url = `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Sheet Container - Padronizado igual ao Cardápio Digital */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className={`relative w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] h-[92vh] sm:h-auto sm:max-h-[88vh] border ${
            isDark ? 'bg-[#121217] border-white/10 text-white' : 'bg-white border-neutral-200 text-neutral-900'
          }`}
          style={{
            backgroundColor: activeTheme.modalBg,
            borderColor: activeTheme.containerBorderColor,
          }}
        >
          {/* Header Superior Fixo */}
          <div
            className={`p-3.5 sm:p-4 border-b shrink-0 flex items-center justify-between gap-3 ${
              isDark ? 'bg-[#15151c] border-white/[0.08]' : 'bg-neutral-50 border-neutral-200'
            }`}
            style={{
              backgroundColor: activeTheme.fixedAreaBg,
              borderColor: activeTheme.containerBorderColor,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base sm:text-lg tracking-tight truncate">
                    Agendamento Online
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isDark ? 'bg-white/10 text-neutral-300' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    Reserva Online
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {company.name} · Escolha serviço, profissional e horário
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Barra de Etapas (Step Progress) */}
          {step < 5 && (
            <div
              className={`px-4 py-2.5 border-b shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs font-semibold ${
                isDark ? 'bg-[#101015] border-white/[0.06]' : 'bg-neutral-50/70 border-neutral-100'
              }`}
            >
              <div
                className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-xl transition-all ${
                  step === 1
                    ? 'text-white shadow-2xs font-bold'
                    : step > 1
                    ? isDark ? 'text-neutral-300' : 'text-neutral-700'
                    : isDark ? 'text-neutral-600' : 'text-neutral-400'
                }`}
                style={step === 1 ? { backgroundColor: primaryColor } : undefined}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                  1
                </span>
                <span>Serviço</span>
              </div>

              <span className={`text-[10px] ${isDark ? 'text-neutral-600' : 'text-neutral-300'}`}>→</span>

              {availableProfessionalsForService.length > 0 && (
                <>
                  <div
                    className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-xl transition-all ${
                      step === 2
                        ? 'text-white shadow-2xs font-bold'
                        : step > 2
                        ? isDark ? 'text-neutral-300' : 'text-neutral-700'
                        : isDark ? 'text-neutral-600' : 'text-neutral-400'
                    }`}
                    style={step === 2 ? { backgroundColor: primaryColor } : undefined}
                  >
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                      2
                    </span>
                    <span>Profissional</span>
                  </div>
                  <span className={`text-[10px] ${isDark ? 'text-neutral-600' : 'text-neutral-300'}`}>→</span>
                </>
              )}

              <div
                className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-xl transition-all ${
                  step === 3
                    ? 'text-white shadow-2xs font-bold'
                    : step > 3
                    ? isDark ? 'text-neutral-300' : 'text-neutral-700'
                    : isDark ? 'text-neutral-600' : 'text-neutral-400'
                }`}
                style={step === 3 ? { backgroundColor: primaryColor } : undefined}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                  {availableProfessionalsForService.length > 0 ? '3' : '2'}
                </span>
                <span>Data & Horário</span>
              </div>

              <span className={`text-[10px] ${isDark ? 'text-neutral-600' : 'text-neutral-300'}`}>→</span>

              <div
                className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-xl transition-all ${
                  step === 4
                    ? 'text-white shadow-2xs font-bold'
                    : isDark ? 'text-neutral-600' : 'text-neutral-400'
                }`}
                style={step === 4 ? { backgroundColor: primaryColor } : undefined}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                  {availableProfessionalsForService.length > 0 ? '4' : '3'}
                </span>
                <span>Confirmação</span>
              </div>
            </div>
          )}

          {/* Conteúdo Scrollável Amplo */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
            {/* Mensagem de Erro */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-500 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ETAPA 1: SERVIÇOS DISPONÍVEIS */}
            {step === 1 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm sm:text-base font-black">
                      Selecione o serviço que deseja agendar:
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Clique sobre o serviço para escolher o horário
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isDark ? 'bg-white/10 text-neutral-300' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {services.length} {services.length === 1 ? 'opção' : 'opções'}
                  </span>
                </div>

                {services.length === 0 ? (
                  <div
                    className={`py-16 text-center rounded-3xl border border-dashed ${
                      isDark ? 'border-white/10 text-neutral-500' : 'border-neutral-200 text-neutral-400'
                    }`}
                  >
                    <Scissors className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <p className="font-bold text-sm">Nenhum serviço disponível no momento</p>
                    <p className="text-xs mt-1">Volte em instantes ou entre em contato pelo WhatsApp.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                    {services.map((srv) => {
                      const srvPhoto = srv.photoUrl || (srv as unknown as { imageUrl?: string }).imageUrl || ''
                      const isConsult = srv.priceType === 'consult' || srv.price == null

                      return (
                        <div
                          key={srv.id}
                          onClick={() => handleSelectService(srv)}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex gap-3.5 items-center justify-between group active:scale-[0.99] ${
                            isDark
                              ? 'bg-[#15151c] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]'
                              : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            {srvPhoto ? (
                              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={srvPhoto}
                                  alt={srv.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div
                                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: `${primaryColor}18`,
                                  color: primaryColor,
                                }}
                              >
                                <Scissors className="w-6 h-6 opacity-80" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              {srv.category && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block truncate">
                                  {srv.category}
                                </span>
                              )}
                              <h4 className="font-bold text-xs sm:text-sm leading-snug truncate mt-0.5">
                                {srv.name}
                              </h4>
                              {srv.description && (
                                <p className={`text-[11px] line-clamp-1 mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                  {srv.description}
                                </p>
                              )}

                              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                                <span
                                  className="font-black text-xs sm:text-sm font-mono"
                                  style={{ color: priceColor }}
                                >
                                  {isConsult
                                    ? 'Sob consulta'
                                    : `R$ ${srv.price?.toFixed(2).replace('.', ',')}`}
                                </span>

                                {srv.durationMinutes && (
                                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md ${
                                    isDark ? 'bg-white/5 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                                  }`}>
                                    <Clock className="w-3 h-3 text-neutral-400" />
                                    <span>{srv.durationMinutes} min</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 2: PROFISSIONAL */}
            {step === 2 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm sm:text-base font-black">
                      Escolha o profissional:
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Serviço selecionado: <strong>{selectedService?.name}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Mudar serviço</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  {/* Opção: Sem preferência / Primeiro horário */}
                  <div
                    onClick={() => handleSelectProf(null)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] ${
                      isDark
                        ? 'bg-[#15151c] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]'
                        : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm">
                          Primeiro Horário Disponível
                        </h4>
                        <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          Sem preferência de profissional
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-white shrink-0" />
                  </div>

                  {availableProfessionalsForService.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProf(p)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] ${
                        isDark
                          ? 'bg-[#15151c] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]'
                          : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-white font-black text-sm flex items-center justify-center shrink-0">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm truncate">
                            {p.name}
                          </h4>
                          <p className={`text-xs truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            {p.role || 'Profissional da equipe'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-white shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ETAPA 3: DATA E HORÁRIO */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm sm:text-base font-black">
                      Selecione o dia e o horário:
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {selectedService?.name} {selectedProf ? `com ${selectedProf.name}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(availableProfessionalsForService.length > 0 ? 2 : 1)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar</span>
                  </button>
                </div>

                {/* Lista Horizontal de Dias com boa área de toque */}
                <div className="space-y-1.5">
                  <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    1. Escolha o dia
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1 touch-pan-x">
                    {upcomingDates.map((d) => {
                      const isSelected = selectedDate === d.dateString
                      return (
                        <button
                          key={d.dateString}
                          type="button"
                          onClick={() => setSelectedDate(d.dateString)}
                          className={`p-3 rounded-2xl text-center min-w-[78px] border transition-all cursor-pointer shrink-0 ${
                            isSelected
                              ? 'text-white shadow-md scale-[1.02]'
                              : isDark
                              ? 'bg-[#15151c] text-neutral-300 border-white/10 hover:bg-white/10'
                              : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50'
                          }`}
                          style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                        >
                          <span className={`block text-[10px] uppercase font-bold ${
                            isSelected ? 'text-white/80' : isDark ? 'text-neutral-500' : 'text-neutral-400'
                          }`}>
                            {d.weekday}
                          </span>
                          <span className="block text-xs sm:text-sm font-black mt-0.5">
                            {d.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Grade Ampla de Horários Disponíveis */}
                <div className="space-y-2 pt-1">
                  <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    2. Escolha o horário
                  </span>

                  {isLoadingSlots ? (
                    <div className="py-12 text-center text-xs flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 dark:border-white/10">
                      <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                      <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                        Verificando horários livres nesta data...
                      </span>
                    </div>
                  ) : !selectedDate ? (
                    <div className={`py-12 text-center text-xs rounded-2xl border border-dashed ${
                      isDark ? 'border-white/10 text-neutral-500' : 'border-neutral-200 text-neutral-400'
                    }`}>
                      <CalendarIcon className="w-8 h-8 mx-auto opacity-40 mb-1" />
                      <span>Selecione uma data acima para visualizar os horários disponíveis.</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className={`py-10 text-center text-xs rounded-2xl border border-dashed p-4 ${
                      isDark ? 'border-white/10 bg-white/[0.02]' : 'border-neutral-200 bg-neutral-50'
                    }`}>
                      <Clock className="w-7 h-7 mx-auto opacity-40 mb-1 text-amber-500" />
                      <p className="font-bold text-sm">Nenhum horário livre nesta data</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Todos os horários estão preenchidos ou o estabelecimento não atende neste dia. Tente outra data.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleSelectDateTime(selectedDate, slot)}
                            className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer border text-center shadow-2xs ${
                              isSelected
                                ? 'text-white shadow-sm scale-105'
                                : isDark
                                ? 'bg-[#15151c] hover:bg-white/10 text-white border-white/10'
                                : 'bg-white hover:bg-neutral-50 text-neutral-900 border-neutral-200'
                            }`}
                            style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                          >
                            {slot}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ETAPA 4: CONFIRMAÇÃO & DADOS DO CLIENTE */}
            {step === 4 && (
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm sm:text-base font-black">
                      Confirme seus dados para agendar:
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Seu agendamento será registrado imediatamente
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Mudar horário</span>
                  </button>
                </div>

                {/* Resumo Completo e Amplo do Agendamento */}
                <div
                  className={`p-4 rounded-2xl border space-y-2 text-xs ${
                    isDark ? 'bg-[#15151c] border-white/[0.08]' : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Serviço
                      </span>
                      <span className="font-black text-sm">{selectedService?.name}</span>
                    </div>
                    {selectedService?.price != null && (
                      <span className="font-mono font-black text-sm" style={{ color: priceColor }}>
                        R$ {selectedService.price.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Data Selecionada
                      </span>
                      <span className="font-bold text-xs">{selectedDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Horário Marcado
                      </span>
                      <span className="font-bold text-xs font-mono" style={{ color: priceColor }}>
                        {selectedTime}
                      </span>
                    </div>
                  </div>

                  {selectedProf && (
                    <div className="pt-1 border-t border-black/5 dark:border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Profissional
                      </span>
                      <span className="font-bold text-xs">{selectedProf.name}</span>
                    </div>
                  )}
                </div>

                {/* Campos de Nome e WhatsApp */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Seu Nome Completo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Maria Santos"
                      value={customerName || ''}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder-neutral-500'
                          : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Seu WhatsApp com DDD <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 11999998888"
                      value={customerPhone || ''}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm font-mono transition-all focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder-neutral-500'
                          : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                    style={{ backgroundColor: buttonBg, color: buttonText }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirmando agendamento...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Confirmar Agendamento</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ETAPA 5: SUCESSO & WHATSAPP */}
            {step === 5 && createdAppointment && (
              <div className="py-6 space-y-4 text-center">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-xs border border-emerald-500/25">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-lg sm:text-xl">
                    Agendamento Solicitado com Sucesso!
                  </h3>
                  <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Sua reserva para <strong>{createdAppointment.serviceName}</strong> em{' '}
                    <strong>
                      {createdAppointment.date} às {createdAppointment.time}
                    </strong>{' '}
                    foi registrada no sistema.
                  </p>
                </div>

                {company.whatsapp && (
                  <div className="pt-2 max-w-md mx-auto">
                    <button
                      type="button"
                      onClick={handleNotifyWhatsApp}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Avisar o estabelecimento no WhatsApp</span>
                    </button>
                  </div>
                )}

                <div className="pt-2 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`w-full py-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      isDark
                        ? 'border-white/10 hover:bg-white/10 text-white'
                        : 'border-neutral-300 hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    Concluir e Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
