'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import {
  Sparkles,
  Store,
  Phone,
  Radio,
  Gift,
  CheckCircle2,
  Copy,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Upload,
  RefreshCw,
  QrCode as QrCodeIcon,
  Wifi,
  Star,
  MapPin,
  Utensils,
  MessageSquare,
  Instagram,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import QRCode from 'qrcode'
import { Company, WifiSecurity } from '@/types/platform'
import { saveCompanyAsync } from '@/lib/storage'
import { uploadCompanyImageFromClient, isBase64Image } from '@/lib/storage-client'

interface CompanyOnboardingModalProps {
  isOpen: boolean
  company: Company
  onFinish: (updatedCompany: Company) => void
}

const PRESET_BANNERS = [
  { label: 'Cafeteria / Café', url: '/images/cafe_central_banner_1791003956057.jpg' },
  { label: 'Barbearia / Estilo', url: '/images/barbearia_banner_1791003968071.jpg' },
  { label: 'Pizzaria / Restaurante', url: '/images/pizzaria_banner_1791003982257.jpg' },
]

export const CompanyOnboardingModal: React.FC<CompanyOnboardingModalProps> = ({
  isOpen,
  company,
  onFinish,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isSaving, setIsSaving] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  // Step 1: Identidade
  const [tagline, setTagline] = useState(company.tagline || '')
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '')
  const [logoPreview, setLogoPreview] = useState(company.logoUrl || '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverUrl, setCoverUrl] = useState(company.coverUrl || '/images/cafe_central_banner_1791003956057.jpg')
  const [coverPreview, setCoverPreview] = useState(company.coverUrl || '/images/cafe_central_banner_1791003956057.jpg')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [primaryColor, setPrimaryColor] = useState(company.primaryColor || '#6D28D9')
  const [secondaryColor, setSecondaryColor] = useState(company.secondaryColor || '#18181B')

  // Step 2: Contato
  const [whatsapp, setWhatsapp] = useState(company.whatsapp || '')
  const [instagram, setInstagram] = useState(company.instagram || '')
  const [addressText, setAddressText] = useState(company.addressText || '')
  const [locationUrl, setLocationUrl] = useState(company.locationUrl || '')

  // Step 3: Recursos
  const [modules, setModules] = useState({
    loyalty: company.modules?.loyalty ?? true,
    googleReview: company.modules?.googleReview ?? true,
    menu: company.modules?.menu ?? false,
    wifi: company.modules?.wifi ?? true,
    whatsapp: company.modules?.whatsapp ?? true,
    location: company.modules?.location ?? false,
    feedback: company.modules?.feedback ?? true,
    instagram: company.modules?.instagram ?? false,
  })
  const [googleReviewUrl, setGoogleReviewUrl] = useState(company.googleReviewUrl || '')
  const [menuUrl, setMenuUrl] = useState(company.menuUrl || '')
  const [wifiSsid, setWifiSsid] = useState(company.wifi?.ssid || '')
  const [wifiPassword, setWifiPassword] = useState(company.wifi?.password || '')
  const [wifiSecurity, setWifiSecurity] = useState<WifiSecurity>(company.wifi?.security || 'WPA/WPA2')

  // Step 4: Fidelidade
  const [loyaltyActive, setLoyaltyActive] = useState(company.loyaltyProgram?.isActive ?? true)
  const [loyaltyName, setLoyaltyName] = useState(company.loyaltyProgram?.campaignName || 'Cartão Fidelidade VIP')
  const [loyaltyGoal, setLoyaltyGoal] = useState(company.loyaltyProgram?.goalPoints || 10)
  const [loyaltyReward, setLoyaltyReward] = useState(company.loyaltyProgram?.rewardDescription || '1 Cortesia Especial')

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/empresa/${company.slug}` : `/empresa/${company.slug}`

  // Generate QR Code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      QRCode.toDataURL(publicUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#18181B',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Error generating QR Code in onboarding:', err))
    }
  }, [publicUrl])

  if (!isOpen) return null

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleCopyPublicUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(publicUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const saveCurrentData = async (markComplete: boolean): Promise<Company> => {
    setIsSaving(true)

    let finalLogo = logoUrl
    if (logoFile) {
      const up = await uploadCompanyImageFromClient(company.id, 'logo', logoFile)
      if (up.success && up.url) finalLogo = up.url
    }

    let finalCover = coverUrl
    if (coverFile) {
      const up = await uploadCompanyImageFromClient(company.id, 'cover', coverFile)
      if (up.success && up.url) finalCover = up.url
    }

    if (isBase64Image(finalLogo)) finalLogo = ''
    if (isBase64Image(finalCover)) finalCover = '/images/cafe_central_banner_1791003956057.jpg'

    const updated: Company = {
      ...company,
      tagline: tagline.trim() || undefined,
      logoUrl: finalLogo,
      coverUrl: finalCover,
      primaryColor,
      secondaryColor,
      whatsapp: whatsapp.trim(),
      instagram: instagram.trim(),
      addressText: addressText.trim(),
      locationUrl: locationUrl.trim(),
      googleReviewUrl: googleReviewUrl.trim(),
      menuUrl: menuUrl.trim(),
      wifi: {
        ssid: wifiSsid.trim(),
        password: wifiPassword.trim() || undefined,
        security: wifiSecurity,
      },
      modules: {
        ...modules,
        loyalty: loyaltyActive,
      },
      loyaltyProgram: {
        isActive: loyaltyActive,
        campaignName: loyaltyName.trim() || 'Cartão Fidelidade',
        goalPoints: loyaltyGoal,
        rewardDescription: loyaltyReward.trim() || '1 Recompensa Especial',
      },
      onboardingCompleted: markComplete,
      updatedAt: new Date().toISOString(),
    }

    await saveCompanyAsync(updated)
    setIsSaving(false)
    return updated
  }

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1)
    } else if (currentStep === 4) {
      // Reached finalization step
      await saveCurrentData(true)
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
      setCurrentStep(5)
    }
  }

  const handleSkip = async () => {
    const updated = await saveCurrentData(true)
    onFinish(updated)
  }

  const handleFinish = async () => {
    const updated = await saveCurrentData(true)
    onFinish(updated)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl border border-neutral-200/90 shadow-2xl w-full max-w-2xl overflow-hidden text-neutral-900 font-sans my-auto flex flex-col max-h-[90vh]"
      >
        {/* Header with Progress Steps */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 bg-neutral-50/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Radio className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900 leading-tight">
                  Vamos configurar sua DiretoLink
                </h2>
                <p className="text-[11px] text-neutral-500 font-medium">
                  {currentStep === 1 && 'Etapa 1 de 4 — Identidade Visual'}
                  {currentStep === 2 && 'Etapa 2 de 4 — Informações de Contato'}
                  {currentStep === 3 && 'Etapa 3 de 4 — Recursos & Módulos NFC'}
                  {currentStep === 4 && 'Etapa 4 de 4 — Cartão Fidelidade'}
                  {currentStep === 5 && 'Sua DiretoLink está pronta!'}
                </p>
              </div>
            </div>

            {currentStep < 5 && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSaving}
                className="text-xs text-neutral-500 hover:text-neutral-800 underline font-medium whitespace-nowrap"
              >
                Pular configuração
              </button>
            )}
          </div>

          {/* Progress bar */}
          {currentStep < 5 && (
            <div className="w-full bg-neutral-200/70 h-1.5 rounded-full overflow-hidden mt-4">
              <div
                className="bg-violet-600 h-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Step Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* ==================================================== */}
          {/* ETAPA 1: IDENTIDADE                                  */}
          {/* ==================================================== */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Slogan ou Frase de Destaque
                </label>
                <input
                  type="text"
                  placeholder="Ex: O melhor café artesanal da cidade"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                />
              </div>

              {/* Logo e Capa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5">
                  <span className="text-xs font-semibold text-neutral-800 block">Logo da Empresa</span>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                      {logoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Escolher Foto</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <p className="text-[10px] text-neutral-400 mt-1">Quadrada recomendada</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5">
                  <span className="text-xs font-semibold text-neutral-800 block">Foto de Capa</span>
                  <div className="relative h-14 rounded-xl bg-white border border-neutral-200 overflow-hidden shadow-xs">
                    {coverPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverPreview} alt="Capa" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">Sem capa</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>Trocar Capa</span>
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    </label>
                    <span className="text-[10px] text-neutral-400">Banner da página</span>
                  </div>
                </div>
              </div>

              {/* Cores */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Cor Primária (Tema dos Botões)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-mono uppercase bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Cor Secundária (Destaques)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-mono uppercase bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* ETAPA 2: CONTATO                                     */}
          {/* ==================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    WhatsApp do Estabelecimento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 11999998888"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Instagram (@perfil)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: suamarca"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Link do Google Maps / Como Chegar (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/... ou https://google.com/maps?q=..."
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                />
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* ETAPA 3: RECURSOS                                    */}
          {/* ==================================================== */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-neutral-800 block mb-2">
                  Quais recursos deseja ativar na sua placa NFC?
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { key: 'loyalty', label: 'Fidelidade' },
                    { key: 'googleReview', label: 'Google Avaliações' },
                    { key: 'wifi', label: 'Wi-Fi' },
                    { key: 'whatsapp', label: 'WhatsApp' },
                    { key: 'menu', label: 'Cardápio' },
                    { key: 'location', label: 'Localização' },
                    { key: 'instagram', label: 'Instagram' },
                    { key: 'feedback', label: 'Feedback' },
                  ].map((mod) => (
                    <label
                      key={mod.key}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 cursor-pointer text-xs transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={modules[mod.key as keyof typeof modules]}
                        onChange={(e) =>
                          setModules({
                            ...modules,
                            [mod.key]: e.target.checked,
                          })
                        }
                        className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4"
                      />
                      <span className="font-medium text-neutral-800">{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Wi-Fi Details se ativo */}
              {modules.wifi && (
                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-neutral-800 text-xs font-semibold">
                    <Wifi className="w-3.5 h-3.5 text-violet-600" />
                    <span>Dados do Wi-Fi para Clientes Conectarem em 1 Toque</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-neutral-500 mb-0.5">Nome da Rede (SSID)</label>
                      <input
                        type="text"
                        placeholder="Ex: MinhaRede_Clientes"
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-500 mb-0.5">Senha do Wi-Fi</label>
                      <input
                        type="text"
                        placeholder="Ex: senha123"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Google Avaliações Link */}
              {modules.googleReview && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Link da Avaliação Google (Write Review)
                  </label>
                  <input
                    type="url"
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Gera avaliações 5 estrelas no seu Perfil de Empresa do Google.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* ETAPA 4: FIDELIDADE                                  */}
          {/* ==================================================== */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 text-xs block">Programa de Fidelidade Digital</span>
                  <span className="text-[11px] text-neutral-500">Permite clientes acumularem pontos pelo celular</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loyaltyActive}
                    onChange={(e) => setLoyaltyActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>

              {loyaltyActive && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Nome da Campanha
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Clube Fidelidade VIP"
                      value={loyaltyName}
                      onChange={(e) => setLoyaltyName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Meta de Pontos (Carimbos para Ganhar)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={loyaltyGoal}
                        onChange={(e) => setLoyaltyGoal(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Descrição da Recompensa
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 1 Café Especial Grátis"
                        value={loyaltyReward}
                        onChange={(e) => setLoyaltyReward(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-violet-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* ETAPA 5: FINALIZAÇÃO                                 */}
          {/* ==================================================== */}
          {currentStep === 5 && (
            <div className="py-4 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-neutral-900">
                  Sua DiretoLink está pronta!
                </h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                  Seu link público e QR Code já estão operando para conexões de clientes.
                </p>
              </div>

              {/* URL pública e QR Code */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-left space-y-3 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-violet-700 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    URL Permanente da sua Placa NFC
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPublicUrl}
                    className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-neutral-200 font-mono text-xs font-bold text-neutral-900 break-all select-all">
                  {publicUrl}
                </div>

                {qrCodeDataUrl && (
                  <div className="pt-2 border-t border-neutral-200 flex flex-col sm:flex-row items-center gap-3">
                    <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-xs shrink-0">
                      <Image
                        src={qrCodeDataUrl}
                        alt="QR Code da Empresa"
                        width={90}
                        height={90}
                        className="rounded-lg"
                        unoptimized
                      />
                    </div>
                    <div className="text-xs text-neutral-600 space-y-1 text-center sm:text-left">
                      <p className="font-bold text-neutral-900">QR Code da Placa Física</p>
                      <p className="text-[11px] text-neutral-500">
                        Grave este link no chip NFC ou imprima para exibir no balcão/mesas.
                      </p>
                      <a
                        href={qrCodeDataUrl}
                        download={`qrcode-diretolink-${company.slug}.png`}
                        className="inline-block text-[11px] text-violet-700 hover:text-violet-800 font-semibold underline pt-0.5"
                      >
                        Baixar Imagem PNG
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-3">
          {currentStep > 1 && currentStep < 5 ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-4 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ml-auto"
            >
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : currentStep === 4 ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ml-auto"
            >
              <span>{isSaving ? 'Gravando dados...' : 'Finalizar Configuração'}</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2 ml-auto">
              <a
                href={`/empresa/${company.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Página NFC</span>
              </a>

              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>Acessar Painel Agora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
