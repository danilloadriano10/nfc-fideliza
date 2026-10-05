'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
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
  Trash2,
  RefreshCw,
  Radio,
  Wifi,
  Star,
  MapPin,
  Phone,
  Instagram,
  Utensils,
  MessageSquare,
  Gift,
  QrCode as QrCodeIcon,
} from 'lucide-react'
import { Company, WifiSecurity } from '@/types/platform'
import { saveCompany, saveCompanyAsync, getAllCompanies } from '@/lib/storage'
import { slugify, formatPhone } from '@/lib/utils'
import { uploadCompanyImageFromClient, isBase64Image } from '@/lib/storage-client'
import QRCode from 'qrcode'

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

const CATEGORY_OPTIONS = [
  'Cafeteria / Bistrô',
  'Barbearia / Salão de Beleza',
  'Pizzaria / Restaurante',
  'Hamburgueria / Lanchonete',
  'Sorveteria / Açaí',
  'Saúde, Clínica & Estética',
  'Comércio, Loja & Varejo',
  'Outro Estabelecimento',
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

  // 1. IDENTIDADE
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('Cafeteria / Bistrô')
  const [tagline, setTagline] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [coverUrl, setCoverUrl] = useState('/images/cafe_central_banner_1791003956057.jpg')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('/images/cafe_central_banner_1791003956057.jpg')
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload')
  const [coverMode, setCoverMode] = useState<'upload' | 'presets' | 'url'>('upload')
  const [primaryColor, setPrimaryColor] = useState('#6D28D9')
  const [secondaryColor, setSecondaryColor] = useState('#18181B')

  // 2. CONTATO
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [addressText, setAddressText] = useState('')
  const [locationUrl, setLocationUrl] = useState('')

  // 3. EXPERIÊNCIA NFC & MÓDULOS
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
  const [googleReviewUrl, setGoogleReviewUrl] = useState('')
  const [menuUrl, setMenuUrl] = useState('')
  const [wifiSsid, setWifiSsid] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiSecurity, setWifiSecurity] = useState<WifiSecurity>('WPA/WPA2')
  const [loyaltyName, setLoyaltyName] = useState('Cartão Fidelidade VIP')
  const [loyaltyGoal, setLoyaltyGoal] = useState(10)
  const [loyaltyReward, setLoyaltyReward] = useState('1 Cortesia Especial')

  // 4. ACESSO DO PROPRIETÁRIO
  const [ownerUsername, setOwnerUsername] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  // Status de Envio
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  useEffect(() => {
    if (companyToEdit) {
      setName(companyToEdit.name || '')
      setSlug(companyToEdit.slug || '')
      setCategory(companyToEdit.category || 'Cafeteria / Bistrô')
      setTagline(companyToEdit.tagline || '')
      setLogoUrl(companyToEdit.logoUrl || '')
      setLogoPreview(companyToEdit.logoUrl || '')
      setLogoFile(null)
      setCoverUrl(companyToEdit.coverUrl || '/images/cafe_central_banner_1791003956057.jpg')
      setCoverPreview(companyToEdit.coverUrl || '/images/cafe_central_banner_1791003956057.jpg')
      setCoverFile(null)
      setPrimaryColor(companyToEdit.primaryColor || '#6D28D9')
      setSecondaryColor(companyToEdit.secondaryColor || '#18181B')
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
      setModules(companyToEdit.modules || {
        loyalty: true,
        googleReview: true,
        menu: true,
        wifi: true,
        whatsapp: true,
        location: true,
        feedback: true,
        instagram: true,
      })
      setLoyaltyName(companyToEdit.loyaltyProgram?.campaignName || 'Cartão Fidelidade')
      setLoyaltyGoal(companyToEdit.loyaltyProgram?.goalPoints || 10)
      setLoyaltyReward(companyToEdit.loyaltyProgram?.rewardDescription || '')
    } else {
      setName('')
      setSlug('')
      setCategory('Cafeteria / Bistrô')
      setTagline('')
      setLogoUrl('')
      setLogoPreview('')
      setLogoFile(null)
      setCoverUrl('/images/cafe_central_banner_1791003956057.jpg')
      setCoverPreview('/images/cafe_central_banner_1791003956057.jpg')
      setCoverFile(null)
      setPrimaryColor('#6D28D9')
      setSecondaryColor('#18181B')
      setWhatsapp('')
      setInstagram('')
      setGoogleReviewUrl('')
      setMenuUrl('')
      setLocationUrl('')
      setAddressText('')
      setWifiSsid('')
      setWifiPassword('')
      setWifiSecurity('WPA/WPA2')
      setOwnerUsername('')
      setOwnerPassword('')
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

  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEditing && !slug) {
      setSlug(slugify(val))
    }
    if (!ownerUsername && !isEditing) {
      setOwnerUsername(slugify(val).replace(/-/g, ''))
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A imagem da logo deve ter no máximo 5MB.')
      return
    }

    setLogoFile(file)
    const localUrl = URL.createObjectURL(file)
    setLogoPreview(localUrl)
    setLogoUrl('')
    setErrorMessage(null)
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A foto de capa deve ter no máximo 5MB.')
      return
    }

    setCoverFile(file)
    const localUrl = URL.createObjectURL(file)
    setCoverPreview(localUrl)
    setCoverUrl('')
    setErrorMessage(null)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoUrl('')
    setLogoPreview('')
  }

  const handleResetCover = () => {
    setCoverFile(null)
    setCoverUrl('/images/cafe_central_banner_1791003956057.jpg')
    setCoverPreview('/images/cafe_central_banner_1791003956057.jpg')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome do estabelecimento.')
      return
    }

    const cleanSlug = isEditing ? (slugify(slug) || companyToEdit?.slug || '') : slugify(slug || name)
    if (!cleanSlug) {
      setErrorMessage('Por favor, informe um slug válido para a URL permanente.')
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
    const targetCompanyId = companyToEdit?.id || `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`

    setIsSubmitting(true)

    let finalLogoUrl = logoUrl.trim()
    let finalCoverUrl = coverUrl.trim() || '/images/cafe_central_banner_1791003956057.jpg'

    // 1. Upload Logo
    if (logoFile) {
      setUploadStatus('Enviando foto da logo...')
      const logoRes = await uploadCompanyImageFromClient(targetCompanyId, 'logo', logoFile)
      if (logoRes.success && logoRes.url) {
        finalLogoUrl = logoRes.url
      } else {
        console.warn('[Aviso upload logo]:', logoRes.error)
        if (!finalLogoUrl) finalLogoUrl = logoUrl.trim() || ''
      }
    }

    // 2. Upload Capa
    if (coverFile) {
      setUploadStatus('Enviando foto de capa...')
      const coverRes = await uploadCompanyImageFromClient(targetCompanyId, 'cover', coverFile)
      if (coverRes.success && coverRes.url) {
        finalCoverUrl = coverRes.url
      } else {
        console.warn('[Aviso upload capa]:', coverRes.error)
        if (!finalCoverUrl || isBase64Image(finalCoverUrl)) {
          finalCoverUrl = coverUrl.trim() || '/images/cafe_central_banner_1791003956057.jpg'
        }
      }
    }

    // 3. Strict Defense: Never persist raw Base64 data strings in Firestore
    if (isBase64Image(finalLogoUrl)) finalLogoUrl = ''
    if (isBase64Image(finalCoverUrl)) finalCoverUrl = '/images/cafe_central_banner_1791003956057.jpg'

    setUploadStatus('Salvando dados no DiretoLink Cloud...')

    const targetCompany: Company = {
      id: targetCompanyId,
      name: name.trim(),
      slug: cleanSlug,
      category: category.trim() || 'Cafeteria / Bistrô',
      tagline: tagline.trim() || undefined,
      logoUrl: finalLogoUrl,
      coverUrl: finalCoverUrl,
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

    const saveRes = await saveCompanyAsync(targetCompany)
    if (!saveRes.success) {
      setIsSubmitting(false)
      setUploadStatus('')
      setErrorMessage(saveRes.error || 'Erro ao persistir estabelecimento.')
      return
    }

    // Generate production QR Code data URL
    if (typeof window !== 'undefined') {
      const publicNfcUrl = `${window.location.origin}/empresa/${targetCompany.slug}`
      try {
        const qrUrl = await QRCode.toDataURL(publicNfcUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#18181B',
            light: '#FFFFFF',
          },
        })
        setQrCodeDataUrl(qrUrl)
      } catch (err) {
        console.error('Erro ao gerar QRCode:', err)
      }
    }

    setIsSubmitting(false)
    setUploadStatus('')
    setCreatedCompany(targetCompany)
    setStep('success')
    onCreated(targetCompany)
  }

  const generatedNfcUrl =
    typeof window !== 'undefined' && createdCompany
      ? `${window.location.origin}/empresa/${createdCompany.slug}`
      : `/empresa/${slug || 'exemplo'}`

  const generatedOwnerPanelUrl =
    typeof window !== 'undefined' && createdCompany
      ? `${window.location.origin}/painel/${createdCompany.slug}`
      : `/painel/${slug || 'exemplo'}`

  const handleCopyNfcUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(generatedNfcUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const handleCopyCredentials = () => {
    if (createdCompany?.ownerAuth) {
      const text = `Acesso DiretoLink - ${createdCompany.name}\nPainel: ${generatedOwnerPanelUrl}\nUsuário: ${createdCompany.ownerAuth.username}\nSenha: ${createdCompany.ownerAuth.password}`
      navigator.clipboard.writeText(text)
      setCopiedCredentials(true)
      setTimeout(() => setCopiedCredentials(false), 2500)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl border border-neutral-200/90 shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-neutral-900 font-sans"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs">
              <Radio className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 leading-tight">
                {isEditing ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">
                DiretoLink · Cadastro e Configuração da Presença NFC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'success' && createdCompany ? (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900">
                  {isEditing ? 'Estabelecimento Atualizado!' : 'Estabelecimento Cadastrado no DiretoLink!'}
                </h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                  A página pública permanente da placa NFC e o acesso do proprietário estão ativos.
                </p>
              </div>

              {/* 5. LINK PÚBLICO DESTACADO */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-left space-y-3 max-w-lg mx-auto shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-violet-700 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    URL Permanente da Placa NFC (Para Clientes)
                  </span>
                  <button
                    onClick={handleCopyNfcUrl}
                    className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-neutral-200 font-mono text-xs font-bold text-neutral-900 break-all select-all">
                  {generatedNfcUrl}
                </div>

                {qrCodeDataUrl && (
                  <div className="pt-2 border-t border-neutral-200/80 flex flex-col sm:flex-row items-center gap-4">
                    <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-xs shrink-0">
                      <Image
                        src={qrCodeDataUrl}
                        alt="QR Code da Placa NFC"
                        width={100}
                        height={100}
                        className="rounded-lg"
                        unoptimized
                      />
                    </div>
                    <div className="text-xs text-neutral-600 space-y-1 text-center sm:text-left">
                      <p className="font-bold text-neutral-900 flex items-center justify-center sm:justify-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                        QR Code da Placa Física
                      </p>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        Grave este link no chip NFC físico ou imprima o QR Code no display acrílico de mesa/balcão.
                      </p>
                      <a
                        href={qrCodeDataUrl}
                        download={`qrcode-diretolink-${createdCompany.slug}.png`}
                        className="inline-block text-[11px] text-violet-700 hover:text-violet-800 font-semibold underline pt-0.5"
                      >
                        Baixar Imagem PNG do QR Code
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Credenciais do Proprietário */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-left space-y-2.5 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Credenciais de Acesso do Proprietário:
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
                  O proprietário acessa unicamente os dados desta empresa por: <span className="font-mono font-bold">{generatedOwnerPanelUrl}</span>
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  Concluir e Fechar
                </button>
                <a
                  href={`/empresa/${createdCompany.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-violet-100"
                >
                  <span>Abrir Página NFC</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold shrink-0">Atenção:</span>
                    <p className="leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* 1. SEÇÃO: IDENTIDADE                                 */}
              {/* ==================================================== */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-violet-600" />
                    1. Identidade
                  </h3>
                  <span className="text-[11px] text-neutral-400">Informações principais da marca</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Café Central Bistrô"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Categoria
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Slug da URL Permanente (Placa NFC) *
                    </label>
                    <div className="flex items-center">
                      <span className="bg-neutral-100 border border-r-0 border-neutral-200 text-neutral-500 px-2.5 py-2 text-xs rounded-l-xl font-mono">
                        /empresa/
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="cafe-central"
                        value={slug}
                        onChange={(e) => setSlug(slugify(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-r-xl border border-neutral-200 font-mono focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Slogan / Frase de Destaque
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Cafés especiais e momentos únicos"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                    />
                  </div>
                </div>

                {/* Upload Foto da Logo & Foto de Capa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Foto da Logo */}
                  <div className="bg-neutral-50/80 rounded-2xl p-3.5 border border-neutral-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-neutral-800">
                        Foto da Logo (Quadrada)
                      </label>
                      <div className="flex bg-neutral-200/70 p-0.5 rounded-lg text-[10px] font-medium">
                        <button
                          type="button"
                          onClick={() => setLogoMode('upload')}
                          className={`px-2 py-0.5 rounded-md transition-all ${
                            logoMode === 'upload'
                              ? 'bg-white text-neutral-900 shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoMode('url')}
                          className={`px-2 py-0.5 rounded-md transition-all ${
                            logoMode === 'url'
                              ? 'bg-white text-neutral-900 shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          Link / URL
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6 text-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {logoMode === 'upload' ? (
                          <div>
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium cursor-pointer transition-colors shadow-xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{logoPreview ? 'Trocar Foto' : 'Escolher Foto'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                              />
                            </label>
                            <p className="text-[10px] text-neutral-400 mt-1">PNG, JPG até 5MB</p>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/logo.png"
                              value={logoUrl}
                              onChange={(e) => {
                                const val = e.target.value
                                setLogoUrl(val)
                                setLogoPreview(val)
                                setLogoFile(null)
                              }}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-violet-600"
                            />
                          </div>
                        )}

                        {logoPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-medium"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remover</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Foto de Capa */}
                  <div className="bg-neutral-50/80 rounded-2xl p-3.5 border border-neutral-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-neutral-800">
                        Foto de Capa (Banner)
                      </label>
                      <div className="flex bg-neutral-200/70 p-0.5 rounded-lg text-[10px] font-medium">
                        <button
                          type="button"
                          onClick={() => setCoverMode('upload')}
                          className={`px-2 py-0.5 rounded-md transition-all ${
                            coverMode === 'upload'
                              ? 'bg-white text-neutral-900 shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoverMode('presets')}
                          className={`px-2 py-0.5 rounded-md transition-all ${
                            coverMode === 'presets'
                              ? 'bg-white text-neutral-900 shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          Prontas
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoverMode('url')}
                          className={`px-2 py-0.5 rounded-md transition-all ${
                            coverMode === 'url'
                              ? 'bg-white text-neutral-900 shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          Link / URL
                        </button>
                      </div>
                    </div>

                    <div className="relative h-20 rounded-xl bg-white border border-neutral-200 overflow-hidden shadow-xs">
                      {coverPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverPreview} alt="Capa" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                          Sem capa selecionada
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {coverMode === 'upload' && (
                        <div className="flex items-center justify-between">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium cursor-pointer transition-colors shadow-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{coverPreview ? 'Trocar Foto de Capa' : 'Escolher Foto de Capa'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverUpload}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[10px] text-neutral-400">1200×600 px recomendado</span>
                        </div>
                      )}

                      {coverMode === 'presets' && (
                        <div className="flex flex-wrap gap-1">
                          {PRESET_BANNERS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setCoverFile(null)
                                setCoverUrl(preset.url)
                                setCoverPreview(preset.url)
                              }}
                              className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                                coverPreview === preset.url
                                  ? 'border-violet-600 bg-violet-600 text-white font-medium shadow-xs'
                                  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {coverMode === 'url' && (
                        <div>
                          <input
                            type="url"
                            placeholder="https://exemplo.com/minha-capa.jpg"
                            value={coverUrl}
                            onChange={(e) => {
                              const val = e.target.value
                              setCoverUrl(val)
                              setCoverPreview(val)
                              setCoverFile(null)
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-violet-600"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={handleResetCover}
                          className="inline-flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-800"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Restaurar capa padrão</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cores da Empresa */}
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
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 font-mono uppercase bg-white"
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
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 font-mono uppercase bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================================================== */}
              {/* 2. SEÇÃO: CONTATO                                    */}
              {/* ==================================================== */}
              <div className="space-y-4 pt-3 border-t border-neutral-100">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-violet-600" />
                    2. Contato
                  </h3>
                  <span className="text-[11px] text-neutral-400">Canais de atendimento e endereço</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      WhatsApp do Estabelecimento (DDD + Número)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 62999998888"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Av. Central, 123 - Setor Bueno, Goiânia - GO"
                      value={addressText}
                      onChange={(e) => setAddressText(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Google Maps / Localização (Link)
                    </label>
                    <input
                      type="text"
                      placeholder="https://maps.app.goo.gl/... ou https://google.com/maps?q=..."
                      value={locationUrl}
                      onChange={(e) => setLocationUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* ==================================================== */}
              {/* 3. SEÇÃO: EXPERIÊNCIA NFC (CONFIGURAÇÃO DOS MÓDULOS) */}
              {/* ==================================================== */}
              <div className="space-y-4 pt-3 border-t border-neutral-100">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-violet-600" />
                    3. Experiência NFC (Módulos da Placa)
                  </h3>
                  <span className="text-[11px] text-neutral-400">Ative ou personalize cada recurso</span>
                </div>

                {/* Grid de Switches de Módulos */}
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
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-100/60 cursor-pointer text-xs transition-colors"
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

                {/* Detalhes: Google Review & Cardápio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Link Avaliação Google (Write Review)
                    </label>
                    <input
                      type="text"
                      placeholder="https://search.google.com/local/writereview?placeid=..."
                      value={googleReviewUrl}
                      onChange={(e) => setGoogleReviewUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white"
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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white"
                    />
                  </div>
                </div>

                {/* Detalhes: Conexão Wi-Fi */}
                <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-neutral-700 text-xs font-semibold">
                    <Wifi className="w-3.5 h-3.5 text-violet-600" />
                    <span>Configuração de Conexão Wi-Fi Fácil</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-neutral-500 mb-0.5">Nome da Rede (SSID)</label>
                      <input
                        type="text"
                        placeholder="Ex: Cafe_Central_Clientes"
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-500 mb-0.5">Senha do Wi-Fi</label>
                      <input
                        type="text"
                        placeholder="Ex: cafezinho2026"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-500 mb-0.5">Segurança</label>
                      <select
                        value={wifiSecurity}
                        onChange={(e) => setWifiSecurity(e.target.value as WifiSecurity)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white"
                      >
                        <option value="WPA/WPA2">WPA/WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="OPEN">Aberta (Sem Senha)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Detalhes: Fidelidade */}
                <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-neutral-700 text-xs font-semibold">
                    <Gift className="w-3.5 h-3.5 text-violet-600" />
                    <span>Regras do Cartão Fidelidade</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-neutral-500 mb-0.5">Nome da Campanha</label>
                      <input
                        type="text"
                        placeholder="Ex: Clube do Café"
                        value={loyaltyName}
                        onChange={(e) => setLoyaltyName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-500 mb-0.5">Meta de Pontos</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={loyaltyGoal}
                        onChange={(e) => setLoyaltyGoal(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-500 mb-0.5">Recompensa</label>
                      <input
                        type="text"
                        placeholder="Ex: 1 Cappuccino Especial"
                        value={loyaltyReward}
                        onChange={(e) => setLoyaltyReward(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================================================== */}
              {/* 4. SEÇÃO: ACESSO DO PROPRIETÁRIO                     */}
              {/* ==================================================== */}
              <div className="space-y-3 pt-3 border-t border-neutral-100 bg-violet-50/40 p-4 rounded-2xl border border-violet-100">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-violet-700" />
                  <h3 className="text-xs font-bold text-violet-900 uppercase tracking-wider">
                    4. Acesso do Proprietário (Login & Senha)
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  O proprietário terá acesso restrito <strong>SOMENTE</strong> aos dados desta empresa com isolamento completo de segurança.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-400" />
                      <span>Login do Proprietário *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: cafecentral"
                      value={ownerUsername}
                      onChange={(e) => setOwnerUsername(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-violet-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-neutral-400" />
                      <span>Senha de Acesso *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: cafe123"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-violet-600"
                    />
                  </div>
                </div>
              </div>

              {/* ==================================================== */}
              {/* 5. SEÇÃO: LINK PÚBLICO & NFC (PRÉVIA)                */}
              {/* ==================================================== */}
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-violet-600" />
                    5. Link Público Permanente
                  </h3>
                  <span className="text-[11px] text-neutral-400">URL oficial da placa física</span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                  <span className="text-neutral-700 truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/empresa/${slug || 'sua-empresa'}` : `/empresa/${slug || 'sua-empresa'}`}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-neutral-400 font-sans">
                      (Será ativado após salvar)
                    </span>
                  </div>
                </div>
              </div>

              {/* Status de Upload e Processamento */}
              {uploadStatus && (
                <div className="p-3 bg-violet-50 text-violet-900 border border-violet-200 rounded-xl text-xs flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin shrink-0" />
                  <span>{uploadStatus}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-50 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span>{uploadStatus || 'Processando...'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar no DiretoLink'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
