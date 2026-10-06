import { NextRequest, NextResponse } from 'next/server'
import {
  getServerAppointments,
  createServerAppointment,
  updateServerAppointmentStatus,
  getServerCompanyById,
  getServerCompanyBySlug,
  getServerProfessionals,
  getServerServices,
  saveServerCompany,
} from '@/lib/server-storage'
import { Appointment, AppointmentStatus, DaySchedule } from '@/types/platform'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper to generate time slot strings (e.g. "09:00", "09:30")
function generateSlots(
  openTime: string,
  closeTime: string,
  stepMinutes: number,
  breakStart?: string,
  breakEnd?: string
): string[] {
  const slots: string[] = []
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)

  let currentTotal = openH * 60 + openM
  const closeTotal = closeH * 60 + closeM

  let breakStartTotal = -1
  let breakEndTotal = -1
  if (breakStart && breakEnd) {
    const [bsh, bsm] = breakStart.split(':').map(Number)
    const [beh, bem] = breakEnd.split(':').map(Number)
    breakStartTotal = bsh * 60 + bsm
    breakEndTotal = beh * 60 + bem
  }

  while (currentTotal + stepMinutes <= closeTotal) {
    // Check if slot falls in break
    const isInBreak =
      breakStartTotal >= 0 &&
      currentTotal >= breakStartTotal &&
      currentTotal < breakEndTotal

    if (!isInBreak) {
      const h = Math.floor(currentTotal / 60)
        .toString()
        .padStart(2, '0')
      const m = (currentTotal % 60).toString().padStart(2, '0')
      slots.push(`${h}:${m}`)
    }
    currentTotal += stepMinutes
  }

  return slots
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const companyIdOrSlug = searchParams.get('companyId') || searchParams.get('slug')
    const date = searchParams.get('date') || undefined
    const checkAvailability = searchParams.get('availableSlots') === 'true'
    const professionalId = searchParams.get('professionalId') || undefined
    const serviceId = searchParams.get('serviceId') || undefined

    if (!companyIdOrSlug) {
      return NextResponse.json(
        { success: false, error: 'companyId ou slug é obrigatório.' },
        { status: 400 }
      )
    }

    let company = await getServerCompanyById(companyIdOrSlug)
    if (!company) {
      company = await getServerCompanyBySlug(companyIdOrSlug)
    }

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não encontrado.' },
        { status: 404 }
      )
    }

    const companyId = company.id

    // Availability computation endpoint for public page
    if (checkAvailability && date) {
      // 1. Get weekday of date (0 = Sunday, 1 = Monday, etc.)
      const [year, month, day] = date.split('-').map(Number)
      const dateObj = new Date(year, month - 1, day)
      const dayOfWeek = dateObj.getDay()

      // Default schedule: Mon-Sat 08:00 - 18:00, lunch break 12:00 - 13:00, Sunday closed
      const defaultDays: DaySchedule[] = [
        { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '13:00' },
        { dayOfWeek: 1, isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
        { dayOfWeek: 2, isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
        { dayOfWeek: 3, isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
        { dayOfWeek: 4, isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
        { dayOfWeek: 5, isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
        { dayOfWeek: 6, isOpen: true, openTime: '08:00', closeTime: '17:00' },
      ]

      const scheduleDays = company.bookingSettings?.days || defaultDays
      const dayConfig = scheduleDays.find((d) => d.dayOfWeek === dayOfWeek)

      // If business is closed on this day, or blocked
      if (!dayConfig || !dayConfig.isOpen) {
        return NextResponse.json({ success: true, availableSlots: [] }, { status: 200 })
      }

      if (company.bookingSettings?.blockedDates?.includes(date)) {
        return NextResponse.json({ success: true, availableSlots: [] }, { status: 200 })
      }

      // Check service duration to adapt slot step
      let slotDuration = company.bookingSettings?.slotDurationMinutes || 30
      if (serviceId) {
        const services = await getServerServices(companyId)
        const srv = services.find((s) => s.id === serviceId)
        if (srv && srv.durationMinutes && srv.durationMinutes > 0) {
          slotDuration = srv.durationMinutes
        }
      }

      const allSlots = generateSlots(
        dayConfig.openTime || '08:00',
        dayConfig.closeTime || '18:00',
        slotDuration,
        dayConfig.breakStart,
        dayConfig.breakEnd
      )

      // 2. Fetch existing non-cancelled appointments for this company on this date
      const appointments = await getServerAppointments(companyId, date)
      const activeAppointments = appointments.filter((a) => a.status !== 'cancelled')

      // 3. Filter out conflicted slots
      const availableSlots = allSlots.filter((slotTime) => {
        if (professionalId) {
          // If a professional was selected: slot is blocked only if THIS professional is already booked
          const hasProfConflict = activeAppointments.some(
            (a) => a.time === slotTime && a.professionalId === professionalId
          )
          return !hasProfConflict
        } else {
          // If no professional selected: slot is blocked if company is booked without professional
          const hasCompanyConflict = activeAppointments.some(
            (a) => a.time === slotTime && !a.professionalId
          )
          return !hasCompanyConflict
        }
      })

      return NextResponse.json({ success: true, availableSlots }, { status: 200 })
    }

    // Standard list
    const appointments = await getServerAppointments(companyId, date)
    return NextResponse.json({ success: true, appointments }, { status: 200 })
  } catch (err) {
    console.error('Error in GET /api/appointments:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao buscar agendamentos.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      companyId,
      serviceId,
      serviceName,
      servicePrice,
      serviceDurationMinutes,
      professionalId,
      professionalName,
      date,
      time,
      customerName,
      customerPhone,
      notes,
    } = body || {}

    if (!companyId || !serviceId || !date || !time || !customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Por favor, preencha todos os campos obrigatórios.' },
        { status: 400 }
      )
    }

    // Verify company exists
    const company = await getServerCompanyById(companyId)
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não encontrado.' },
        { status: 404 }
      )
    }

    // If professionalId provided, verify it belongs to this company
    let resolvedProfName = professionalName
    if (professionalId) {
      const profs = await getServerProfessionals(companyId)
      const found = profs.find((p) => p.id === professionalId && p.isActive !== false)
      if (found) {
        resolvedProfName = found.name
      }
    }

    const appt: Appointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId,
      serviceId,
      serviceName: serviceName || 'Serviço',
      servicePrice: typeof servicePrice === 'number' ? servicePrice : null,
      serviceDurationMinutes: typeof serviceDurationMinutes === 'number' ? serviceDurationMinutes : null,
      professionalId: professionalId || undefined,
      professionalName: resolvedProfName || undefined,
      date,
      time,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      status: 'pending',
      notes: notes && typeof notes === 'string' ? notes.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const res = await createServerAppointment(appt)
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Erro ao realizar agendamento.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ success: true, appointment: res.appointment || appt }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/appointments:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno ao agendar.' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, companyId, status, bookingSettings } = body || {}

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId é obrigatório.' },
        { status: 400 }
      )
    }

    // 1. Update Appointment Status
    if (id && status) {
      const validStatuses: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Status de agendamento inválido.' },
          { status: 400 }
        )
      }

      const res = await updateServerAppointmentStatus(id, companyId, status)
      if (!res.success) {
        return NextResponse.json(
          { success: false, error: res.error || 'Erro ao atualizar status do agendamento.' },
          { status: 400 }
        )
      }
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // 2. Update Booking Settings (Hours, days, blocked dates)
    if (bookingSettings) {
      const comp = await getServerCompanyById(companyId)
      if (!comp) {
        return NextResponse.json(
          { success: false, error: 'Empresa não encontrada.' },
          { status: 404 }
        )
      }
      // Save settings in company doc
      comp.bookingSettings = bookingSettings
      await saveServerCompany(comp)
      return NextResponse.json({ success: true, bookingSettings }, { status: 200 })
    }

    return NextResponse.json(
      { success: false, error: 'Ação não especificada.' },
      { status: 400 }
    )
  } catch (err) {
    console.error('Error in PUT /api/appointments:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno.' },
      { status: 500 }
    )
  }
}
