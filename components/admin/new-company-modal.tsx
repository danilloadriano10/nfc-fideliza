'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  X,
  Plus,
  Store,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  Copy,
  ArrowRight,
  Upload,
  Lock,
  User,
  Image as ImageIcon,
  KeyRound,
} from 'lucide-react'
import { Company, WifiSecurity } from '@/types/platform'
import { saveCompany, getAllCompanies } from '@/lib/storage'
import { slugify } from '@/lib/utils'

interface NewCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (company: Company) => void
  companyToEdit?: Company | null
}

const PRESET_BANNERS = [
  { label: 'Cafeteria / Café', url: '/images/cafe_central_banner_1791003956057.jpg' },
  { label: 'Barbearia / Estilo', url: '/images/barbearia_banner_1791003968071.jpg' },
  { label: 'Pizzaria / Restaurante', url: '/images/pizzaria_banner_1791003982257.jpg' },
]

export const NewCompanyModal: React.FC<NewCompanyModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  companyToEdit,
}) => {
  const isEditing = Boolean(companyToEdit)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCredentials, setCopiedCredentials] = useState(false)
  const [createdCompany, setCreatedCompany] = useState<Company | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [tagline, setTagline] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('/images/cafe_central_banner_1791003956057.jpg')
  const [primaryColor, setPrimaryColor] = useState('#18181B')
  const [secondaryColor, setSecondaryColor] = useState('#D97706')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [googleReviewUrl, setGoogleReviewUrl] = useState('')
  const [menuUrl, setMenuUrl] = useState('')
  const [locationUrl, setLocationUrl] = useState('')
  const [addressText, setAddressText] = useState('')

  // Wi-Fi
  const [wifiSsid, setWifiSsid] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiSecurity, setWifiSecurity] = useState<WifiSecurity>('WPA/WPA2')

  // Owner Auth credentials
  const [ownerUsername, setOwnerUsername] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  // Modules
  const [modules, setModules] = useState({
    loyalty: true,
    googleReview: true,
    menu: true,
    wifi: true,
    whatsapp: true,
    location: true,
    feedback: true,
    instagram: true,
  })

  // Loyalty Program
  const [loyaltyName, setLoyaltyName] = useState('Cartão Fidelidade VIP')
  const [loyaltyGoal, setLoyaltyGoal] = useState(10)
  const [loyaltyReward, setLoyaltyReward] = useState('1 Cortesia Especial')

  useEffect(() => {
    if (companyToEdit) {
      setName(companyToEdit.name)
      setSlug(companyToEdit.slug)
      setTagline(companyToEdit.tagline || '')
      setLogoUrl(companyToEdit.logoUrl || '')
      setCoverUrl(companyToEdit.coverUrl || '')
      setPrimaryColor(companyToEdit.primaryColor || '#18181B')
      setSecondaryColor(companyToEdit.secondaryColor || '#D97706')
      setWhatsapp(companyToEdit.whatsapp || '')
      setInstagram(companyToEdit.instagram || '')
      setGoogleReviewUrl(companyToEdit.googleReviewUrl || '')
      setMenuUrl(companyToEdit.menuUrl || '')
      setLocationUrl(companyToEdit.locationUrl || '')
      setAddressText(companyToEdit.addressText || '')
      setWifiSsid(companyToEdit.wifi?.ssid || '')
      setWifiPassword(companyToEdit.wifi?.password || '')
      setWifiSecurity(companyToEdit.wifi?.security || 'WPA/WPA2')
      setOwnerUsername(companyToEdit.ownerAuth?.username || companyToEdit.slug)
      setOwnerPassword(companyToEdit.ownerAuth?.password || 'empresa123')
      setModules(companyToEdit.modules)
      setLoyaltyName(companyToEdit.loyaltyProgram?.campaignName || 'Cartão Fidelidade')
      setLoyaltyGoal(companyToEdit.loyaltyProgram?.goalPoints || 10)
      setLoyaltyReward(companyToEdit.loyaltyProgram?.rewardDescription || '')
    } else {
      setName('')
      setSlug('')
      setTagline('')
      setLogoUrl('')
      setCoverUrl('/images/cafe_central_banner_1791003956057.jpg')
      setPrimaryColor('#18181B')
      setSecondaryColor('#D97706')
      setWhatsapp('')
      setInstagram('')
      setGoogleReviewUrl('')
      setMenuUrl('')
      setLocationUrl('')
      setAddressText('')
      setWifiSsid('')
      setWifiPassword('')
      setOwnerUsername('')
      setOwnerPassword('empresa123')
      setModules({
        loyalty: true,
        googleReview: true,
        menu: true,
        wifi: true,
        whatsapp: true,
        location: true,
        feedback: true,
        instagram: true,
      })
      setLoyaltyName('Cartão Fidelidade VIP')
      setLoyaltyGoal(10)
      setLoyaltyReward('1 Cortesia Especial')
    }
    setStep('form')
    setErrorMessage(null)
  }, [companyToEdit, isOpen])

  if (!isOpen) return null

  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEditing && (!slug || slug === slugify(name))) {
      const autoSlug = slugify(val)
      setSlug(autoSlug)
      if (!ownerUsername || ownerUsername === slug) {
        setOwnerUsername(autoSlug)
      }
    }
  }

  // File upload for Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('A imagem da logo deve ter no máximo 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // File upload for Cover
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('A foto de capa deve ter no máximo 3MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome do estabelecimento.')
      return
    }

    const cleanSlug = slugify(slug || name)
    if (!cleanSlug) {
      setErrorMessage('Por favor, informe um slug válido.')
      return
    }

    const companies = getAllCompanies()
    const duplicate = companies.find(
      (c) => c.slug.toLowerCase() === cleanSlug.toLowerCase() && c.id !== companyToEdit?.id
    )
    if (duplicate) {
      setErrorMessage('Já existe um estabelecimento com este slug. Escolha outro.')
      return
    }

    const cleanOwnerUser = ownerUsername.trim() || cleanSlug
    const cleanOwnerPass = ownerPassword.trim() || 'empresa123'

    const targetCompany: Company = {
      id: companyToEdit?.id || `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      slug: cleanSlug,
      tagline: tagline.trim() || undefined,
      logoUrl: logoUrl.trim() || '',
      coverUrl: coverUrl.trim() || '/images/cafe_central_banner_1791003956057.jpg',
      primaryColor,
      secondaryColor,
      whatsapp: whatsapp.trim(),
      instagram: instagram.trim(),
      googleReviewUrl: googleReviewUrl.trim(),
      menuUrl: menuUrl.trim(),
      locationUrl: locationUrl.trim(),
      addressText: addressText.trim(),
      isActive: companyToEdit ? companyToEdit.isActive : true,
      wifi: {
        ssid: wifiSsid.trim(),
        password: wifiPassword.trim() || undefined,
        security: wifiSecurity,
      },
      modules,
      loyaltyProgram: {
        isActive: modules.loyalty,
        campaignName: loyaltyName.trim() || 'Cartão Fidelidade',
        goalPoints: loyaltyGoal,
        rewardDescription: loyaltyReward.trim() || '1 Recompensa Especial',
      },
      ownerAuth: {
        username: cleanOwnerUser,
        password: cleanOwnerPass,
      },
      createdAt: companyToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const res = saveCompany(targetCompany)
    if (res.success) {
      setCreatedCompany(targetCompany)
      setStep('success')
      onCreated(targetCompany)
    } else {
      setErrorMessage(res.error || 'Erro ao salvar estabelecimento.')
    }
  }

  const generatedNfcUrl = createdCompany
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/empresa/${createdCompany.slug}`
    : ''

  const generatedOwnerPanelUrl = createdCompany
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/painel/${createdCompany.slug}`
    : ''

  const handleCopyNfcUrl = () => {
    navigator.clipboard.writeText(generatedNfcUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleCopyCredentials = () => {
    if (!createdCompany?.ownerAuth) return
    const text = `Acesso do Proprietário:\nPainel: ${generatedOwnerPanelUrl}\nUsuário: ${createdCompany.ownerAuth.username}\nSenha: ${createdCompany.ownerAuth.password}`
    navigator.clipboard.writeText(text)
    setCopiedCredentials(true)
    setTimeout(() => setCopiedCredentials(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 text-base leading-tight">
                {isEditing ? 'Editar Estabelecimento' : 'Cadastrar Novo Estabelecimento'}
              </h2>
              <p className="text-xs text-neutral-500">
                {isEditing
                  ? 'Atualize dados, fotos e credenciais sem alterar a URL da placa NFC'
                  : 'Gera a página pública NFC e as credenciais isoladas do proprietário'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'success' && createdCompany ? (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900">
                  {isEditing ? 'Estabelecimento Atualizado!' : 'Estabelecimento Cadastrado com Sucesso!'}
                </h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                  A página pública permanente e o acesso do proprietário estão prontos para uso.
                </p>
              </div>

              {/* 1. URL NFC Display */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-left space-y-2 max-w-lg mx-auto">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 block">
                  1. URL Permanente da Placa NFC (Para Clientes):
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-neutral-900 truncate">
                    {generatedNfcUrl}
                  </span>
                  <button
                    onClick={handleCopyNfcUrl}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shrink-0 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Owner Credentials Card */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-left space-y-2.5 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    2. Credenciais de Acesso do Proprietário:
                  </span>
                  <button
                    onClick={handleCopyCredentials}
                    className="text-xs font-semibold text-amber-900 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCredentials ? 'Copiadas!' : 'Copiar Dados'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] text-neutral-500 block uppercase font-medium">Usuário / Login:</span>
                    <span className="font-mono font-bold text-neutral-900">{createdCompany.ownerAuth?.username}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] text-neutral-500 block uppercase font-medium">Senha:</span>
                    <span className="font-mono font-bold text-neutral-900">{createdCompany.ownerAuth?.password}</span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-700">
                  O proprietário gerencia unicamente esta empresa pelo link: <span className="font-mono font-bold">{generatedOwnerPanelUrl}</span>
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Concluir e Fechar
                </button>
                <a
                  href={`/empresa/${createdCompany.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Abrir Página NFC</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                  {errorMessage}
                </div>
              )}

              {/* 1. Informações Básicas */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  1. Identidade do Estabelecimento
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Café Central Bistrô"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Slug NFC (URL Permanente) *
                    </label>
                    <div className="flex items-center">
                      <span className="bg-neutral-100 border border-r-0 border-neutral-200 text-neutral-500 px-2 py-2 text-xs rounded-l-xl font-mono">
                        /empresa/
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="cafe-central"
                        value={slug}
                        onChange={(e) => setSlug(slugify(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-r-xl border border-neutral-200 font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Descrição Curta / Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Cafés especiais, brunch e momentos que inspiram"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* 2. Upload de LOGO e FOTO DE CAPA */}
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  2. Upload da Logo e Foto de Capa
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Upload Logo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-neutral-700">
                      Logo do Estabelecimento (Quadrada)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6 text-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium cursor-pointer transition-colors shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Fazer Upload da Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-neutral-400">PNG, JPG até 2MB</p>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Ou cole o link direto da imagem"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-neutral-200 text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  {/* Upload Capa */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-neutral-700">
                      Foto de Capa (Banner Superior)
                    </label>
                    <div className="relative h-16 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                          Sem capa
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white text-xs font-medium cursor-pointer transition-all gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Fazer Upload de Capa</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      {PRESET_BANNERS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setCoverUrl(preset.url)}
                          className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                            coverUrl === preset.url
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cores */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Cor Primária (Identidade)
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
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 font-mono"
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
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. LOGIN E SENHA DO PROPRIETÁRIO */}
              <div className="space-y-3 pt-2 border-t border-neutral-100 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    3. Acesso Exclusivo do Proprietário (Login & Senha)
                  </h3>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  O proprietário terá acesso <strong>SOMENTE</strong> aos dados desta empresa. Ele nunca poderá visualizar outras empresas nem o painel geral.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-400" />
                      <span>Usuário / Login do Proprietário *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: cafecentral"
                      value={ownerUsername}
                      onChange={(e) => setOwnerUsername(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-neutral-400" />
                      <span>Senha de Acesso do Proprietário *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: cafe123"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Canais & Redes */}
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  4. Contatos, Wi-Fi & Avaliação Google
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      WhatsApp do Estabelecimento
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 62998877112"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Instagram (@perfil)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: cafecentral"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Link Avaliação Google (Write Review)
                    </label>
                    <input
                      type="text"
                      placeholder="https://search.google.com/local/writereview?placeid=..."
                      value={googleReviewUrl}
                      onChange={(e) => setGoogleReviewUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Link do Cardápio Digital (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="https://menu.empresa.com"
                      value={menuUrl}
                      onChange={(e) => setMenuUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200"
                    />
                  </div>
                </div>

                {/* Wi-Fi Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Nome da Rede Wi-Fi (SSID)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: CafeCentral_Clientes"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Senha do Wi-Fi
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: cafezinho2026"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Segurança
                    </label>
                    <select
                      value={wifiSecurity}
                      onChange={(e) => setWifiSecurity(e.target.value as WifiSecurity)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white"
                    >
                      <option value="WPA/WPA2">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="OPEN">Aberta (Sem Senha)</option>
                    </select>
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Av. T-4, 123 - Setor Bueno, Goiânia - GO"
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200"
                  />
                </div>
              </div>

              {/* 5. Programa de Fidelidade */}
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  5. Programa de Fidelidade do Estabelecimento
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Nome da Campanha
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Clube do Café"
                      value={loyaltyName}
                      onChange={(e) => setLoyaltyName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Meta de Pontos (Carimbos)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={loyaltyGoal}
                      onChange={(e) => setLoyaltyGoal(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Descrição da Recompensa
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 1 Cappuccino Especial Grátis"
                      value={loyaltyReward}
                      onChange={(e) => setLoyaltyReward(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Estabelecimento'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
