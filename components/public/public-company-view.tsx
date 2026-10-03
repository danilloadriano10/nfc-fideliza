'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Gift,
  Star,
  BookOpen,
  Wifi,
  MessageCircle,
  MapPin,
  MessageSquareHeart,
  Store,
} from 'lucide-react'
import { Company } from '@/types/platform'
import { ActionCard } from './action-card'
import { LoyaltySheet } from './loyalty-sheet'
import { WifiSheet } from './wifi-sheet'
import { FeedbackSheet } from './feedback-sheet'
import { InstagramSection } from './instagram-section'
import { getLocalCustomerSession, getCustomerByPhone, DATA_CHANGE_EVENT } from '@/lib/storage'

interface PublicCompanyViewProps {
  company: Company
}

export const PublicCompanyView: React.FC<PublicCompanyViewProps> = ({ company }) => {
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false)
  const [isWifiOpen, setIsWifiOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [coverError, setCoverError] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const [customerSession, setCustomerSession] = useState<{
    phone: string | null
    name?: string
    points: number | null
    hasReward: boolean
  }>(() => {
    if (typeof window === 'undefined') {
      return { phone: null, points: null, hasReward: false }
    }
    const savedPhone = getLocalCustomerSession(company.id)
    if (savedPhone) {
      const cust = getCustomerByPhone(company.id, savedPhone)
      if (cust) {
        return {
          phone: savedPhone,
          name: cust.name,
          points: cust.currentPoints,
          hasReward: cust.availableRewards > 0,
        }
      }
    }
    return { phone: null, points: null, hasReward: false }
  })

  // Synchronize on platform data events
  useEffect(() => {
    const handleUpdate = () => {
      const savedPhone = getLocalCustomerSession(company.id)
      if (savedPhone) {
        const cust = getCustomerByPhone(company.id, savedPhone)
        if (cust) {
          setCustomerSession({
            phone: savedPhone,
            name: cust.name,
            points: cust.currentPoints,
            hasReward: cust.availableRewards > 0,
          })
          return
        }
      }
      setCustomerSession({ phone: null, points: null, hasReward: false })
    }

    window.addEventListener(DATA_CHANGE_EVENT, handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [company.id])

  const customerPhone = customerSession.phone
  const customerName = customerSession.name
  const customerPoints = customerSession.points
  const hasAvailableReward = customerSession.hasReward

  // Open Google Review
  const handleGoogleReview = () => {
    if (company.googleReviewUrl) {
      window.open(company.googleReviewUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Open Menu
  const handleOpenMenu = () => {
    if (company.menuUrl) {
      window.open(company.menuUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Open WhatsApp
  const handleOpenWhatsApp = () => {
    const phoneClean = company.whatsapp.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá! Estou visitando a ${company.name} e gostaria de falar com vocês.`
    )
    window.open(`https://wa.me/55${phoneClean}?text=${msg}`, '_blank', 'noopener,noreferrer')
  }

  // Open Location
  const handleOpenLocation = () => {
    if (company.locationUrl) {
      window.open(company.locationUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const { modules, loyaltyProgram } = company

  return (
    <div className="min-h-screen bg-neutral-100 flex justify-center selection:bg-neutral-900 selection:text-white">
      {/* Mobile-first Container constraint */}
      <main className="w-full max-w-md bg-white min-h-screen shadow-xl relative pb-10 flex flex-col">
        {/* 1. COVER PHOTO (Header) */}
        <div className="relative w-full h-48 sm:h-52 bg-neutral-900 overflow-hidden">
          {company.coverUrl && !coverError ? (
            <Image
              src={company.coverUrl}
              alt={company.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 480px) 100vw, 448px"
              referrerPolicy="no-referrer"
              onError={() => setCoverError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${company.primaryColor} 0%, #1e1e24 100%)`,
              }}
            >
              <Store className="w-12 h-12 text-white/30" />
            </div>
          )}

          {/* Gentle scrim gradient for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </div>

        {/* 2. OVERLAPPING LOGO & ESTABLISHMENT IDENTITY */}
        <div className="px-5 -mt-12 relative z-20 flex flex-col items-center text-center">
          {/* Logo container overlapping cover */}
          <div className="relative w-24 h-24 rounded-2xl bg-white p-1 shadow-lg ring-4 ring-white overflow-hidden flex items-center justify-center">
            {company.logoUrl && !logoError ? (
              <Image
                src={company.logoUrl}
                alt={`${company.name} logo`}
                width={88}
                height={88}
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className="w-full h-full rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-inner"
                style={{ backgroundColor: company.primaryColor }}
              >
                {company.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Business Name */}
          <h1 className="mt-3 text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-snug">
            {company.name}
          </h1>

          {/* Tagline / Address subtitle */}
          {company.tagline && (
            <p className="text-xs text-neutral-500 mt-1 max-w-xs font-normal">
              {company.tagline}
            </p>
          )}

          {company.addressText && (
            <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-400 mt-1.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[260px]">{company.addressText}</span>
            </div>
          )}
        </div>

        {/* 3. BIG ACTION CARDS (Order strictly followed according to specs) */}
        <div className="px-4 sm:px-5 mt-6 space-y-3 flex-1">
          {/* 1. 🎁 CARTÃO FIDELIDADE */}
          {modules.loyalty && loyaltyProgram.isActive && (
            <ActionCard
              icon={<Gift className="w-6 h-6 text-amber-300" />}
              title="Cartão Fidelidade"
              subtitle="Ganhe pontos e recompensas"
              accentColor={company.primaryColor}
              badgeText={
                hasAvailableReward
                  ? 'Prêmio Pronto!'
                  : customerPoints !== null
                  ? `${customerPoints}/${loyaltyProgram.goalPoints} pts`
                  : undefined
              }
              onClick={() => setIsLoyaltyOpen(true)}
            />
          )}

          {/* 2. ⭐ AVALIAR NO GOOGLE */}
          {modules.googleReview && company.googleReviewUrl && (
            <ActionCard
              icon={<Star className="w-6 h-6 text-amber-400 fill-amber-400" />}
              title="Avaliar no Google"
              subtitle="Conte como foi sua experiência"
              accentColor="#1F2937"
              onClick={handleGoogleReview}
            />
          )}

          {/* 3. 📖 CARDÁPIO */}
          {modules.menu && company.menuUrl && (
            <ActionCard
              icon={<BookOpen className="w-6 h-6 text-emerald-400" />}
              title="Cardápio"
              subtitle="Confira nosso cardápio"
              accentColor="#0F766E"
              onClick={handleOpenMenu}
            />
          )}

          {/* 4. 📶 WI-FI */}
          {modules.wifi && company.wifi.ssid && (
            <ActionCard
              icon={<Wifi className="w-6 h-6 text-sky-400" />}
              title="Wi-Fi"
              subtitle="Conecte-se à nossa rede"
              accentColor="#0369A1"
              onClick={() => setIsWifiOpen(true)}
            />
          )}

          {/* 5. 💬 WHATSAPP */}
          {modules.whatsapp && company.whatsapp && (
            <ActionCard
              icon={<MessageCircle className="w-6 h-6 text-emerald-300" />}
              title="WhatsApp"
              subtitle="Fale conosco"
              accentColor="#15803D"
              onClick={handleOpenWhatsApp}
            />
          )}

          {/* 6. 📍 LOCALIZAÇÃO */}
          {modules.location && company.locationUrl && (
            <ActionCard
              icon={<MapPin className="w-6 h-6 text-rose-400" />}
              title="Localização"
              subtitle="Como chegar"
              accentColor="#BE123C"
              onClick={handleOpenLocation}
            />
          )}

          {/* 7. 💭 FEEDBACK */}
          {modules.feedback && (
            <ActionCard
              icon={<MessageSquareHeart className="w-6 h-6 text-purple-300" />}
              title="Feedback"
              subtitle="Envie uma sugestão"
              accentColor="#6B21A8"
              onClick={() => setIsFeedbackOpen(true)}
            />
          )}

          {/* 4. INSTAGRAM SECTION (Distinctive design at the end of the page) */}
          {modules.instagram && company.instagram && (
            <InstagramSection
              instagramHandle={company.instagram}
              companyName={company.name}
            />
          )}
        </div>

        {/* Quiet Footer */}
        <footer className="mt-4 pt-4 border-t border-neutral-100 text-center text-[10px] text-neutral-400 px-6">
          <p>© {company.name} · Alimentado por Placa Inteligente NFC</p>
        </footer>

        {/* MODALS / SHEETS */}
        <LoyaltySheet
          isOpen={isLoyaltyOpen}
          onClose={() => setIsLoyaltyOpen(false)}
          company={company}
          initialCustomerPhone={customerPhone}
        />

        <WifiSheet
          isOpen={isWifiOpen}
          onClose={() => setIsWifiOpen(false)}
          wifi={company.wifi}
          companyName={company.name}
          primaryColor={company.primaryColor}
        />

        <FeedbackSheet
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          companyId={company.id}
          companyName={company.name}
          primaryColor={company.primaryColor}
          initialCustomerName={customerName}
          initialCustomerPhone={customerPhone || undefined}
        />
      </main>
    </div>
  )
}
