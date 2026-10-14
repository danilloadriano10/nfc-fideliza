'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Plus,
  Search,
  Clock,
  Tag,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  Upload,
  ImageIcon,
  Sparkles,
  Layers,
  AlertCircle,
  HelpCircle,
  Scissors,
  Check,
  Calendar,
  ArrowUpDown,
} from 'lucide-react'
import { Company, CompanyService } from '@/types/platform'
import {
  getCompanyServices,
  saveCompanyServiceOnServerApi,
  deleteCompanyServiceOnServerApi,
  toggleCompanyServiceOnServerApi,
  fetchCompanyServicesFromServer,
  saveCompanyServicesOrderOnServer,
  DATA_CHANGE_EVENT,
} from '@/lib/storage'
import { uploadCompanyImageFromClient, isBase64Image } from '@/lib/storage-client'
import { OrganizeItemsModal } from './organize-items-modal'

interface ServicesTabProps {
  company: Company
  onEnableModule?: () => void
}

const COMMON_CATEGORIES = [
  'Geral',
  'Cabelo',
  'Barba',
  'Estética',
  'Unhas',
  'Massagem',
  'Consultoria',
  'Saúde',
  'Tatuagem',
  'Manutenção',
]

const DURATION_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hora', value: 60 },
  { label: '1h 30min', value: 90 },
  { label: '2 horas', value: 120 },
  { label: '3 horas', value: 180 },
]

export const ServicesTab: React.FC<ServicesTabProps> = ({ company, onEnableModule }) => {
  const [services, setServices] = useState<CompanyService[]>(() => getCompanyServices(company.id))
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOrganizeModalOpen, setIsOrganizeModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<CompanyService | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form Fields
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Geral')
  const [customCategory, setCustomCategory] = useState('')
  const [description, setDescription] = useState('')
  const [priceType, setPriceType] = useState<'fixed' | 'consult'>('fixed')
  const [price, setPrice] = useState<string>('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(30)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload')
  const [isActive, setIsActive] = useState(true)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load and sync services
  const loadServices = useCallback(() => {
    setServices(getCompanyServices(company.id))
  }, [company.id])

  useEffect(() => {
    loadServices()
    fetchCompanyServicesFromServer(company.id).then(() => {
      loadServices()
    })

    const onDataChange = () => {
      loadServices()
    }
    window.addEventListener(DATA_CHANGE_EVENT, onDataChange)
    window.addEventListener('storage', onDataChange)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, onDataChange)
      window.removeEventListener('storage', onDataChange)
    }
  }, [company.id, loadServices])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingService(null)
    setName('')
    setCategory('Geral')
    setCustomCategory('')
    setDescription('')
    setPriceType('fixed')
    setPrice('')
    setDurationMinutes(30)
    setPhotoUrl('')
    setPhotoPreview('')
    setPhotoFile(null)
    setPhotoMode('upload')
    setIsActive(true)
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (srv: CompanyService) => {
    setEditingService(srv)
    setName(srv.name || '')
    const cat = srv.category || 'Geral'
    if (COMMON_CATEGORIES.includes(cat)) {
      setCategory(cat)
      setCustomCategory('')
    } else {
      setCategory('Outra')
      setCustomCategory(cat)
    }
    setDescription(srv.description || '')
    setPriceType(srv.priceType || (srv.price != null ? 'fixed' : 'consult'))
    setPrice(srv.price != null ? String(srv.price) : '')
    setDurationMinutes(srv.durationMinutes ?? '')
    const currentPhoto = srv.photoUrl || (srv as unknown as { imageUrl?: string }).imageUrl || ''
    setPhotoUrl(currentPhoto)
    setPhotoPreview(currentPhoto)
    setPhotoFile(null)
    setPhotoMode(currentPhoto && !currentPhoto.startsWith('data:') && !currentPhoto.startsWith('/api/') ? 'url' : 'upload')
    setIsActive(srv.isActive !== false)
    setIsModalOpen(true)
  }

  // Image File selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Selecione um arquivo de imagem válido (PNG, JPG, WebP).')
      return
    }
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setPhotoPreview(ev.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Submit Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast('error', 'Informe o nome do serviço.')
      return
    }

    setIsSaving(true)
    let finalPhotoUrl = photoUrl.trim()

    // Upload image if a new file was chosen
    if (photoFile) {
      try {
        const uploadRes = await uploadCompanyImageFromClient(company.id, 'service', photoFile)
        if (uploadRes.success && uploadRes.url) {
          finalPhotoUrl = uploadRes.url
        } else if (photoPreview && photoPreview.startsWith('data:')) {
          // Pass data url so server converts it via uploadCompanyFileServer
          finalPhotoUrl = photoPreview
        } else {
          showToast('error', uploadRes.error || 'Erro ao fazer upload da foto. Tentando salvar...')
        }
      } catch (err) {
        console.error('Photo upload error:', err)
        if (photoPreview && photoPreview.startsWith('data:')) {
          finalPhotoUrl = photoPreview
        }
      }
    } else if (photoPreview && !finalPhotoUrl) {
      finalPhotoUrl = photoPreview
    }

    let parsedPrice: number | null = null
    if (priceType === 'fixed' && price.trim() !== '') {
      const cleanNum = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'))
      if (!isNaN(cleanNum)) {
        parsedPrice = cleanNum
      }
    }

    const finalCategory = category === 'Outra' ? (customCategory.trim() || 'Geral') : category

    const serviceData: CompanyService = {
      id: editingService ? editingService.id : `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId: company.id,
      name: name.trim(),
      category: finalCategory,
      description: description.trim(),
      price: priceType === 'consult' ? null : parsedPrice,
      priceType: priceType,
      durationMinutes: typeof durationMinutes === 'number' ? durationMinutes : null,
      photoUrl: finalPhotoUrl || undefined,
      isActive,
      createdAt: editingService ? editingService.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const res = await saveCompanyServiceOnServerApi(serviceData, Boolean(editingService))
    setIsSaving(false)

    if (res.success) {
      showToast('success', editingService ? 'Serviço atualizado com sucesso!' : 'Serviço cadastrado com sucesso!')
      setIsModalOpen(false)
      loadServices()
    } else {
      showToast('error', res.error || 'Erro ao salvar serviço.')
    }
  }

  // Toggle Active/Inactive
  const handleToggle = async (srv: CompanyService) => {
    await toggleCompanyServiceOnServerApi(srv.id, company.id)
    loadServices()
    showToast('success', `Status de "${srv.name}" alterado.`)
  }

  // Delete
  const handleDelete = async (srv: CompanyService) => {
    if (!confirm(`Deseja realmente excluir o serviço "${srv.name}"? Esta ação não pode ser desfeita.`)) {
      return
    }
    await deleteCompanyServiceOnServerApi(srv.id, company.id)
    loadServices()
    showToast('success', `Serviço "${srv.name}" excluído.`)
  }

  // Categories list
  const existingCategories = Array.from(
    new Set(services.map((s) => s.category || 'Geral').filter(Boolean))
  )
  const categoryFilters = ['Todas', ...existingCategories]

  // Filtered services
  const filteredServices = services.filter((srv) => {
    if (selectedCategory !== 'Todas' && srv.category !== selectedCategory) {
      return false
    }
    if (search.trim()) {
      const term = search.toLowerCase()
      const matchName = (srv.name || '').toLowerCase().includes(term)
      const matchDesc = (srv.description || '').toLowerCase().includes(term)
      const matchCat = (srv.category || '').toLowerCase().includes(term)
      return matchName || matchDesc || matchCat
    }
    return true
  })

  const isModuleActive = company.modules?.services === true

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

      {/* Module Status Notice if disabled */}
      {!isModuleActive && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold">
                O recurso Serviços está desativado na página pública
              </h4>
              <p className="text-[11px] text-amber-800">
                Você pode cadastrar e organizar seus serviços agora. Para exibi-los aos seus clientes na página oficial, ative o recurso na aba Configurações.
              </p>
            </div>
          </div>
          {onEnableModule && (
            <button
              type="button"
              onClick={onEnableModule}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              Ir para Recursos
            </button>
          )}
        </div>
      )}

      {/* Top Action Header */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                Catálogo de Serviços
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full">
                {services.length} {services.length === 1 ? 'cadastrado' : 'cadastrados'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Cadastre seus procedimentos, valores e durações para encantar clientes e preparar sua empresa para agendamentos.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {services.length > 1 && (
              <button
                type="button"
                onClick={() => setIsOrganizeModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-50 active:scale-95 text-neutral-800 font-bold text-xs flex items-center justify-center gap-2 border border-neutral-200/90 shadow-2xs hover:border-violet-300 transition-all cursor-pointer"
              >
                <ArrowUpDown className="w-4 h-4 text-violet-600" />
                <span>Organizar ordem</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Serviço</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por nome, categoria ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-violet-600 transition-colors"
            />
          </div>

          {/* Category Tabs */}
          {categoryFilters.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categoryFilters.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Services Grid List */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto border border-violet-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-sm">
              {search || selectedCategory !== 'Todas'
                ? 'Nenhum serviço encontrado com esse filtro'
                : 'Nenhum serviço cadastrado ainda'}
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              {search || selectedCategory !== 'Todas'
                ? 'Tente limpar a busca ou selecionar outra categoria.'
                : 'Cadastre os serviços oferecidos pela sua empresa para exibir valores, duração e fotos aos clientes.'}
            </p>
          </div>
          {!search && selectedCategory === 'Todas' && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Primeiro Serviço</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((srv) => {
            const servicePhoto = srv.photoUrl || (srv as unknown as { imageUrl?: string }).imageUrl || ''
            const hasPhoto = Boolean(servicePhoto && servicePhoto.trim().length > 0)
            const isConsult = srv.priceType === 'consult' || srv.price == null
            return (
              <div
                key={srv.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-sm ${
                  srv.isActive ? 'border-neutral-200/90' : 'border-neutral-200 bg-neutral-50/50 opacity-75'
                }`}
              >
                {/* Header with Photo / Fallback */}
                <div className="relative w-full h-36 bg-neutral-100 overflow-hidden">
                  {hasPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={servicePhoto}
                      alt={srv.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-50">
                      <Scissors className="w-8 h-8 opacity-40 mb-1" />
                      <span className="text-[10px] font-medium text-neutral-400">Sem foto</span>
                    </div>
                  )}

                  {/* Category Pill Over Photo */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-medium text-[10px]">
                    {srv.category || 'Geral'}
                  </span>

                  {/* Active / Inactive Badge Button */}
                  <button
                    type="button"
                    onClick={() => handleToggle(srv)}
                    className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs cursor-pointer transition-colors ${
                      srv.isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-800/80 text-neutral-300'
                    }`}
                    title="Alternar Ativo/Pausado"
                  >
                    {srv.isActive ? 'Ativo' : 'Pausado'}
                  </button>
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-neutral-900 text-sm leading-snug line-clamp-1">
                      {srv.name}
                    </h3>
                    {srv.description ? (
                      <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                        {srv.description}
                      </p>
                    ) : (
                      <p className="text-[11px] text-neutral-400 italic">Sem descrição informada.</p>
                    )}
                  </div>

                  {/* Price and Duration Row */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <div>
                      {isConsult ? (
                        <span className="font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md text-[11px]">
                          Sob Consulta
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] text-neutral-400">a partir de</span>
                          <span className="font-bold text-neutral-900 text-sm font-mono">
                            R$ {srv.price?.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      )}
                    </div>

                    {srv.durationMinutes ? (
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span>{srv.durationMinutes} min</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="px-4 py-2.5 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(srv)}
                    className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 transition-colors cursor-pointer"
                    title="Editar serviço"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(srv)}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Excluir serviço"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-2xl max-w-lg w-full overflow-hidden my-6">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">
                    {editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Preencha as informações que serão exibidas na sua página pública.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome do Serviço <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degrade, Escova Modelada, Consultoria..."
                  value={name ?? ''}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600 shadow-2xs"
                />
              </div>

              {/* Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category ?? 'Geral'}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:border-violet-600"
                  >
                    {COMMON_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Outra">+ Outra categoria...</option>
                  </select>
                </div>

                {category === 'Outra' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Nova Categoria
                    </label>
                    <input
                      type="text"
                      placeholder="Digite a categoria..."
                      value={customCategory ?? ''}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600 shadow-2xs"
                    />
                  </div>
                )}
              </div>

              {/* Preço & Tipo */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-800">Definição de Preço</span>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priceType === 'consult'}
                      onChange={(e) => setPriceType(e.target.checked ? 'consult' : 'fixed')}
                      className="accent-violet-600 rounded"
                    />
                    <span>Sob Consulta</span>
                  </label>
                </div>

                {priceType === 'fixed' ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold text-xs">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={price ?? ''}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-white rounded-xl border border-neutral-300 text-xs text-neutral-900 font-mono focus:outline-none focus:border-violet-600"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-500 italic">
                    O valor não será divulgado em números; será exibido o selo &quot;Sob Consulta&quot; na página pública.
                  </p>
                )}
              </div>

              {/* Duração aproximada */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                  <span>Duração Estimada</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Opcional</span>
                </label>
                <select
                  value={durationMinutes ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    setDurationMinutes(val === '' ? '' : parseInt(val, 10))
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:border-violet-600"
                >
                  <option value="">Não informar duração</option>
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label} ({d.value} minutos)
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                  <span>Descrição do Serviço</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Opcional</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Explique o que inclui o serviço, benefícios ou recomendações..."
                  value={description ?? ''}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-violet-600 shadow-2xs"
                />
              </div>

              {/* Foto do Serviço */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Foto do Serviço <span className="text-[10px] text-neutral-400 font-normal">(Opcional)</span>
                  </label>
                  <div className="flex bg-neutral-100 p-0.5 rounded-lg text-[10px] font-medium">
                    <button
                      type="button"
                      onClick={() => setPhotoMode('upload')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        photoMode === 'upload'
                          ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Enviar Arquivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoMode('url')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        photoMode === 'url'
                          ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Link / URL
                    </button>
                  </div>
                </div>

                {photoPreview ? (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 group shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl('')
                          setPhotoPreview('')
                          setPhotoFile(null)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md flex items-center gap-1 transition-colors cursor-pointer"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover Foto</span>
                      </button>
                    </div>
                  </div>
                ) : photoMode === 'upload' ? (
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-neutral-300 hover:border-violet-500 rounded-2xl cursor-pointer bg-neutral-50 hover:bg-violet-50/30 transition-all text-center group">
                    <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 group-hover:text-violet-600 group-hover:border-violet-300 transition-colors shadow-2xs mb-1.5">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-neutral-800 group-hover:text-violet-900">
                      Clique para escolher a foto do serviço
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">
                      PNG, JPG ou WebP (compressão e salvamento automáticos)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/foto-do-servico.jpg"
                      value={photoUrl ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setPhotoUrl(val)
                        setPhotoPreview(val)
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 font-mono focus:outline-none focus:border-violet-600 shadow-2xs"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Cole o link direto da imagem na internet (ex: Unsplash, banco de imagens ou seu site).
                    </p>
                  </div>
                )}
              </div>

              {/* Status Ativo Toggle */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-800 block">
                    Disponível para clientes
                  </span>
                  <span className="text-[10px] text-neutral-400 block">
                    Quando desativado, o serviço não aparece na página pública.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(isActive ?? true)}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingService ? 'Atualizar Serviço' : 'Salvar Serviço'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organize Services Order Modal */}
      <OrganizeItemsModal
        isOpen={isOrganizeModalOpen}
        onClose={() => setIsOrganizeModalOpen(false)}
        title="Organizar Ordem dos Serviços"
        subtitle="Defina a sequência em que seus serviços aparecem na lista da Página Pública."
        itemTypeLabel="serviços"
        items={services.map((s) => ({
          id: s.id,
          name: s.name,
          photoUrl: s.photoUrl,
          category: s.category,
          subtitle: s.price != null ? `R$ ${s.price.toFixed(2).replace('.', ',')}` : 'Sob consulta',
        }))}
        defaultIcon={<Scissors className="w-5 h-5 text-violet-600" />}
        accentColorClass="bg-violet-600 hover:bg-violet-700"
        onSave={async (orderedIds, silent) => {
          await saveCompanyServicesOrderOnServer(company.id, orderedIds)
          const updated = getCompanyServices(company.id)
          setServices(updated)
          if (!silent) {
            showToast('success', 'Ordem dos serviços salva com sucesso!')
          }
        }}
      />
    </div>
  )
}
