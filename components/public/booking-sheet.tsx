'use client'

import React, { useState, useEffect } from 'react'
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
import { formatPhone, normalizePhone } from '@/lib/utils'

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
  const getUpcomingDates = () => {
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
  }

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
    // If no professionals exist for this service, skip directly to step 3 (Date)
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

  const upcomingDates = getUpcomingDates()
  const primaryColor = company.primaryColor || '#6D28D9'

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

      {/* Sheet Content */}
      <motion.div
        initial={{ y: '100%', opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 p-5 sm:p-6 space-y-4 max-h-[88vh] flex flex-col"
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base leading-tight">
                Agendar Horário
              </h3>
              <p className="text-[11px] text-neutral-500">
                {company.name} · Reserva online em tempo real
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 5 && (
          <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-neutral-400 border-b border-neutral-100 pb-2 shrink-0">
            <span className={step >= 1 ? 'text-violet-700 font-bold' : ''}>1. Serviço</span>
            <span>→</span>
            {availableProfessionalsForService.length > 0 && (
              <>
                <span className={step >= 2 ? 'text-violet-700 font-bold' : ''}>2. Profissional</span>
                <span>→</span>
              </>
            )}
            <span className={step >= 3 ? 'text-violet-700 font-bold' : ''}>3. Data & Horário</span>
            <span>→</span>
            <span className={step >= 4 ? 'text-violet-700 font-bold' : ''}>4. Seus Dados</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: SERVIÇOS */}
        {step === 1 && (
          <div className="space-y-3 overflow-y-auto flex-1 pr-0.5 scrollbar-thin">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">Selecione o serviço desejado:</span>
            </div>

            {services.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-400 space-y-1">
                <Scissors className="w-8 h-8 mx-auto opacity-30" />
                <p>Nenhum serviço disponível para agendamento no momento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {services.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => handleSelectService(srv)}
                    className="w-full text-left p-3.5 rounded-2xl bg-neutral-50 hover:bg-violet-50/50 border border-neutral-200/80 hover:border-violet-300 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-neutral-900 text-xs sm:text-sm group-hover:text-violet-900 truncate">
                        {srv.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                        {srv.price != null ? (
                          <span className="font-bold text-neutral-900 font-mono">
                            R$ {srv.price.toFixed(2).replace('.', ',')}
                          </span>
                        ) : (
                          <span className="text-violet-700 font-medium">Consulte</span>
                        )}
                        {srv.durationMinutes && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            {srv.durationMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-violet-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PROFISSIONAL (SE HOUVER) */}
        {step === 2 && (
          <div className="space-y-3 overflow-y-auto flex-1 pr-0.5 scrollbar-thin">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                Escolha o profissional:
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-0.5 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Voltar</span>
              </button>
            </div>

            <div className="space-y-2">
              {/* Option: Any Professional */}
              <button
                type="button"
                onClick={() => handleSelectProf(null)}
                className="w-full text-left p-3.5 rounded-2xl bg-neutral-50 hover:bg-violet-50/50 border border-neutral-200/80 hover:border-violet-300 transition-all flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-xs sm:text-sm group-hover:text-violet-900">
                      Primeiro Horário Disponível
                    </h4>
                    <p className="text-[11px] text-neutral-500">Qualquer profissional da equipe</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-violet-600 shrink-0" />
              </button>

              {availableProfessionalsForService.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProf(p)}
                  className="w-full text-left p-3.5 rounded-2xl bg-neutral-50 hover:bg-violet-50/50 border border-neutral-200/80 hover:border-violet-300 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-xs sm:text-sm group-hover:text-violet-900 truncate">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500">{p.role || 'Profissional'}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-violet-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: DATA & HORÁRIO DISPONÍVEL */}
        {step === 3 && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-0.5 scrollbar-thin">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                Selecione o dia e o horário:
              </span>
              <button
                type="button"
                onClick={() => setStep(availableProfessionalsForService.length > 0 ? 2 : 1)}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-0.5 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Voltar</span>
              </button>
            </div>

            {/* Horizontal Dates List */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {upcomingDates.map((d) => {
                const isSelected = selectedDate === d.dateString
                return (
                  <button
                    key={d.dateString}
                    type="button"
                    onClick={() => setSelectedDate(d.dateString)}
                    className={`p-2.5 rounded-2xl text-center min-w-[70px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    <span className="block text-[10px] uppercase font-bold text-neutral-400">
                      {d.weekday}
                    </span>
                    <span className="block text-xs font-bold mt-0.5">{d.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-neutral-500 block">
                {selectedDate
                  ? 'Horários disponíveis nesta data:'
                  : 'Selecione uma data acima para carregar os horários.'}
              </span>

              {isLoadingSlots ? (
                <div className="py-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                  <span>Verificando horários disponíveis...</span>
                </div>
              ) : selectedDate && availableSlots.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl p-4">
                  <p className="font-semibold text-neutral-600">Nenhum horário livre nesta data.</p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Todos os horários estão ocupados ou o estabelecimento está fechado neste dia.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleSelectDateTime(selectedDate, slot)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                            : 'bg-neutral-50 hover:bg-violet-50 text-neutral-800 border-neutral-200'
                        }`}
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

        {/* STEP 4: DADOS DO CLIENTE */}
        {step === 4 && (
          <form onSubmit={handleSubmitBooking} className="space-y-4 overflow-y-auto flex-1 pr-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                Quase lá! Confirme seus dados:
              </span>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-0.5 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Voltar</span>
              </button>
            </div>

            {/* Summary Box */}
            <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200/80 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900">{selectedService?.name}</span>
                {selectedService?.price != null && (
                  <span className="font-mono font-bold text-neutral-900">
                    R$ {selectedService.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 flex items-center gap-2">
                <span>Data: {selectedDate}</span>
                <span>·</span>
                <span className="font-bold text-violet-700">Horário: {selectedTime}</span>
              </p>
              {selectedProf && (
                <p className="text-[11px] text-neutral-500">
                  Profissional: <span className="font-semibold text-neutral-800">{selectedProf.name}</span>
                </p>
              )}
            </div>

            {/* Input Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Seu Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Maria Oliveira"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600"
              />
            </div>

            {/* Input WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Seu WhatsApp (com DDD) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Ex: 11999998888"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 font-mono focus:outline-none focus:border-violet-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirmando agendamento...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Agendamento</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 5: SUCESSO & WHATSAPP */}
        {step === 5 && createdAppointment && (
          <div className="py-4 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-bold text-neutral-900 text-base">
                Agendamento Solicitado com Sucesso!
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">
                Sua reserva para <strong>{createdAppointment.serviceName}</strong> em{' '}
                <strong>
                  {createdAppointment.date} às {createdAppointment.time}
                </strong>{' '}
                foi registrada.
              </p>
            </div>

            {/* Notify via WhatsApp button */}
            {company.whatsapp && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNotifyWhatsApp}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Avisar o estabelecimento no WhatsApp</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Concluir e Fechar
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
