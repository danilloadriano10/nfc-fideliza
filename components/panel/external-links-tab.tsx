'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  GripVertical,
  ExternalLink,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Link2,
  UtensilsCrossed,
  Calendar,
  Bike,
  ShoppingBag,
  Package,
  Briefcase,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Star,
  MapPin,
  Globe,
  Music,
  Share2,
  Sparkles,
  Phone,
  Mail,
  Loader2,
} from 'lucide-react'
import {
  Company,
  CompanyExternalLink,
  ExternalLinkType,
  EXTERNAL_LINK_PRESETS,
  validateAndNormalizeExternalUrl,
} from '@/types/platform'
import {
  getCompanyExternalLinks,
  fetchCompanyExternalLinksFromServer,
  saveCompanyExternalLinkOnServerApi,
  deleteCompanyExternalLinkOnServerApi,
  toggleCompanyExternalLinkOnServerApi,
  saveCompanyExternalLinksOrderOnServerApi,
} from '@/lib/storage'

interface ExternalLinksTabProps {
  company: Company
  onCompanyUpdate?: (company: Company) => void
}

// Icon helper to render appropriate icon
export function renderExternalLinkIcon(iconName: string, className = 'w-5 h-5') {
  switch (iconName) {
    case 'UtensilsCrossed':
      return <UtensilsCrossed className={className} />
    case 'Calendar':
      return <Calendar className={className} />
    case 'Bike':
      return <Bike className={className} />
    case 'ShoppingBag':
      return <ShoppingBag className={className} />
    case 'Package':
      return <Package className={className} />
    case 'Briefcase':
      return <Briefcase className={className} />
    case 'MessageCircle':
      return <MessageCircle className={className} />
    case 'Instagram':
      return <Instagram className={className} />
    case 'Facebook':
      return <Facebook className={className} />
    case 'Music':
      return <Music className={className} />
    case 'Youtube':
      return <Youtube className={className} />
    case 'Star':
      return <Star className={className} />
    case 'MapPin':
      return <MapPin className={className} />
    case 'Globe':
      return <Globe className={className} />
    case 'Phone':
      return <Phone className={className} />
    case 'Mail':
      return <Mail className={className} />
    case 'Sparkles':
      return <Sparkles className={className} />
    case 'Share2':
      return <Share2 className={className} />
    case 'Link2':
    default:
      return <Link2 className={className} />
  }
}

const AVAILABLE_ICONS = [
  { name: 'Link2', label: 'Link Geral' },
  { name: 'Globe', label: 'Site / Web' },
  { name: 'UtensilsCrossed', label: 'Cardápio / Gastronomia' },
  { name: 'Calendar', label: 'Agendamento / Calendário' },
  { name: 'Bike', label: 'Delivery / Entrega' },
  { name: 'ShoppingBag', label: 'Loja / Compras' },
  { name: 'Package', label: 'Produtos / Pacote' },
  { name: 'Briefcase', label: 'Serviços / Negócios' },
  { name: 'MessageCircle', label: 'WhatsApp / Chat' },
  { name: 'Instagram', label: 'Instagram' },
  { name: 'Facebook', label: 'Facebook' },
  { name: 'Music', label: 'TikTok / Música' },
  { name: 'Youtube', label: 'YouTube / Vídeo' },
  { name: 'Star', label: 'Avaliações / Google' },
  { name: 'MapPin', label: 'Localização / Mapa' },
  { name: 'Phone', label: 'Telefone' },
  { name: 'Mail', label: 'E-mail' },
  { name: 'Sparkles', label: 'Destaque / Promoção' },
]

export function ExternalLinksTab({ company }: ExternalLinksTabProps) {
  const [links, setLinks] = useState<CompanyExternalLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Modals
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Current editing state
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    type: ExternalLinkType
    label: string
    description: string
    url: string
    icon: string
    enabled: boolean
  }>({
    type: 'custom',
    label: '',
    description: '',
    url: '',
    icon: 'Link2',
    enabled: true,
  })

  // URL validation live error
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null)

  // Load links from local storage & server
  useEffect(() => {
    let isMounted = true
    const local = getCompanyExternalLinks(company.id)
    if (local && local.length > 0) {
      setLinks(local)
      setIsLoading(false)
    }

    fetchCompanyExternalLinksFromServer(company.id)
      .then((serverLinks) => {
        if (isMounted) {
          setLinks(serverLinks)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [company.id])

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type })
    setTimeout(() => {
      setStatusMessage(null)
    }, 3500)
  }

  // Handle opening Preset Picker
  const handleOpenAddModal = () => {
    setIsPresetModalOpen(true)
  }

  // Select Preset and open Edit Form
  const handleSelectPreset = (preset: typeof EXTERNAL_LINK_PRESETS[0]) => {
    setIsPresetModalOpen(false)
    setEditingLinkId(null)
    setFormData({
      type: preset.type,
      label: preset.defaultLabel,
      description: preset.defaultDescription,
      url: preset.type === 'custom' ? '' : '',
      icon: preset.defaultIcon,
      enabled: true,
    })
    setUrlValidationError(null)
    setIsEditModalOpen(true)
  }

  // Handle Edit existing link
  const handleEditLink = (link: CompanyExternalLink) => {
    setEditingLinkId(link.id)
    setFormData({
      type: link.type,
      label: link.label,
      description: link.description || '',
      url: link.url,
      icon: link.icon || 'Link2',
      enabled: link.enabled !== false,
    })
    setUrlValidationError(null)
    setIsEditModalOpen(true)
  }

  // Live URL validation
  const handleUrlChange = (value: string) => {
    setFormData((prev) => ({ ...prev, url: value }))
    if (!value.trim()) {
      setUrlValidationError(null)
      return
    }
    const validation = validateAndNormalizeExternalUrl(value, formData.type)
    if (!validation.isValid) {
      setUrlValidationError(validation.error || 'URL inválida')
    } else {
      setUrlValidationError(null)
    }
  }

  // Save Link Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.label.trim()) {
      notify('Por favor, informe o nome exibido do link.', 'error')
      return
    }

    const validation = validateAndNormalizeExternalUrl(formData.url, formData.type)
    if (!validation.isValid || !validation.normalizedUrl) {
      setUrlValidationError(validation.error || 'URL inválida ou insegura.')
      return
    }

    setIsSaving(true)
    const isEdit = Boolean(editingLinkId)

    const payload: Partial<CompanyExternalLink> & { companyId: string } = {
      ...(editingLinkId ? { id: editingLinkId } : {}),
      companyId: company.id,
      type: formData.type,
      label: formData.label.trim(),
      description: formData.description.trim(),
      url: validation.normalizedUrl,
      icon: formData.icon,
      enabled: formData.enabled,
      order: isEdit
        ? links.find((l) => l.id === editingLinkId)?.order ?? links.length
        : links.length,
    }

    const res = await saveCompanyExternalLinkOnServerApi(payload, isEdit)
    setIsSaving(false)

    if (res.success && res.link) {
      if (isEdit) {
        setLinks((prev) => prev.map((l) => (l.id === res.link!.id ? res.link! : l)))
        notify('Link atualizado com sucesso!')
      } else {
        setLinks((prev) => [...prev, res.link!])
        notify('Link adicionado com sucesso!')
      }
      setIsEditModalOpen(false)
    } else {
      notify(res.error || 'Erro ao salvar o link.', 'error')
    }
  }

  // Toggle active status
  const handleToggleStatus = async (link: CompanyExternalLink) => {
    const newStatus = !link.enabled
    // Optimistic update
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, enabled: newStatus } : l))
    )

    const res = await toggleCompanyExternalLinkOnServerApi(link.id, company.id, newStatus)
    if (res.success && res.link) {
      notify(newStatus ? 'Link ativado!' : 'Link desativado.')
    } else {
      // Revert on error
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, enabled: !newStatus } : l))
      )
      notify('Não foi possível alterar o status do link.', 'error')
    }
  }

  // Delete link
  const handleDeleteLink = async (linkId: string) => {
    // Optimistic update
    setLinks((prev) => prev.filter((l) => l.id !== linkId))
    setDeleteConfirmId(null)

    const res = await deleteCompanyExternalLinkOnServerApi(linkId, company.id)
    if (res.success) {
      notify('Link removido com sucesso!')
    } else {
      notify('Erro ao excluir link no servidor.', 'error')
      // Refresh list
      const refreshed = await fetchCompanyExternalLinksFromServer(company.id)
      setLinks(refreshed)
    }
  }

  // Move Link Up
  const handleMoveUp = async (index: number) => {
    if (index <= 0) return
    const newLinks = [...links]
    const temp = newLinks[index - 1]
    newLinks[index - 1] = newLinks[index]
    newLinks[index] = temp

    // Update order numbers
    const updated = newLinks.map((l, i) => ({ ...l, order: i }))
    setLinks(updated)

    const ids = updated.map((l) => l.id)
    await saveCompanyExternalLinksOrderOnServerApi(company.id, ids)
    notify('Ordem dos links atualizada!')
  }

  // Move Link Down
  const handleMoveDown = async (index: number) => {
    if (index >= links.length - 1) return
    const newLinks = [...links]
    const temp = newLinks[index + 1]
    newLinks[index + 1] = newLinks[index]
    newLinks[index] = temp

    // Update order numbers
    const updated = newLinks.map((l, i) => ({ ...l, order: i }))
    setLinks(updated)

    const ids = updated.map((l) => l.id)
    await saveCompanyExternalLinksOrderOnServerApi(company.id, ids)
    notify('Ordem dos links atualizada!')
  }

  // Live preview preset details
  const currentPreset = useMemo(() => {
    return EXTERNAL_LINK_PRESETS.find((p) => p.type === formData.type) || EXTERNAL_LINK_PRESETS[EXTERNAL_LINK_PRESETS.length - 1]
  }, [formData.type])

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Link2 className="w-4 h-4" />
            <span>Página Pública</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            LINKS DA SUA PÁGINA
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gerencie os links que aparecem na sua Página Pública DiretoLink. Organize a ordem, ative ou desative quando quiser.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Adicionar Link</span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm">Carregando links cadastrados...</p>
        </div>
      ) : links.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Nenhum link cadastrado ainda
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Adicione links para seus canais como Cardápio Digital, Agendamento, Delivery, Redes Sociais, WhatsApp ou qualquer site parceiro para exibir na sua Página Pública.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Primeiro Link</span>
          </button>
        </div>
      ) : (
        /* Links List */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <span>{links.length} {links.length === 1 ? 'Link cadastrado' : 'Links cadastrados'}</span>
            <span>Ordem de exibição na Página Pública</span>
          </div>

          <div className="space-y-2.5">
            {links.map((link, index) => (
              <div
                key={link.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                  link.enabled !== false
                    ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 opacity-60'
                }`}
              >
                {/* Left section: drag handle / position, icon, title, description, url */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  {/* Position number */}
                  <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 shrink-0">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-xs font-bold w-4 text-center">{index + 1}</span>
                  </div>

                  {/* Icon badge */}
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shrink-0">
                    {renderExternalLinkIcon(link.icon || 'Link2', 'w-5 h-5')}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {link.label}
                      </h4>
                      {link.enabled === false && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          <EyeOff className="w-3 h-3" /> Inativo
                        </span>
                      )}
                      {link.type !== 'custom' && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                          {EXTERNAL_LINK_PRESETS.find((p) => p.type === link.type)?.defaultLabel || link.type}
                        </span>
                      )}
                    </div>

                    {link.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {link.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 mt-1 truncate">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{link.url}</span>
                    </div>
                  </div>
                </div>

                {/* Right section: Reorder arrows, Toggle, Edit, Delete */}
                <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                  {/* Up / Down reorder buttons */}
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      title="Mover para cima"
                      className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === links.length - 1}
                      onClick={() => handleMoveDown(index)}
                      title="Mover para baixo"
                      className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Toggle Active Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(link)}
                    title={link.enabled !== false ? 'Clique para desativar' : 'Clique para ativar'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      link.enabled !== false ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        link.enabled !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => handleEditLink(link)}
                    title="Editar link"
                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(link.id)}
                    title="Excluir link"
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset Picker Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Adicionar Link à sua Página
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Escolha um tipo de link pronto ou crie um link personalizado com seu próprio nome e ícone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EXTERNAL_LINK_PRESETS.map((preset) => (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-center shrink-0 transition-colors">
                    {renderExternalLinkIcon(preset.defaultIcon, 'w-5 h-5')}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {preset.defaultLabel}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                      {preset.defaultDescription || preset.placeholder}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Form Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  {renderExternalLinkIcon(formData.icon, 'w-5 h-5')}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {editingLinkId ? 'Editar Link' : 'Configurar Link'}
                  </h3>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Tipo: {currentPreset.defaultLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 overflow-y-auto space-y-4">
              {/* Nome Exibido */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nome Exibido no Card *
                </label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Ex: Cardápio Digital, Agendar Horário, Nosso WhatsApp"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  URL de Destino *
                </label>
                <input
                  type="text"
                  required
                  value={formData.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder={currentPreset.placeholder || 'https://exemplo.com'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 ${
                    urlValidationError
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-zinc-300 dark:border-zinc-700 focus:ring-emerald-500'
                  }`}
                />
                {urlValidationError ? (
                  <p className="flex items-center gap-1 text-xs text-rose-500 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{urlValidationError}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Aceita links seguros: https://, http://, wa.me, tel:, mailto:
                  </p>
                )}
              </div>

              {/* Descrição Curta (Opcional) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Descrição Curta (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Veja nosso cardápio completo, Atendimento direto"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Ícone */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Ícone do Card
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  {AVAILABLE_ICONS.map((iconItem) => (
                    <button
                      key={iconItem.name}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, icon: iconItem.name }))}
                      title={iconItem.label}
                      className={`p-2.5 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                        formData.icon === iconItem.name
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {renderExternalLinkIcon(iconItem.name, 'w-5 h-5')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Ativo / Inativo */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  {formData.enabled ? (
                    <Eye className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-zinc-400" />
                  )}
                  <div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Link Ativo
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Quando ativado, este link é exibido na sua Página Pública.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    formData.enabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Pré-visualização do Card */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Pré-visualização do Card na Página
                </label>
                <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-950 flex items-center justify-between gap-3 border border-zinc-200/60 dark:border-zinc-800/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                      {renderExternalLinkIcon(formData.icon, 'w-5 h-5')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {formData.label || 'Título do Link'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {formData.description || 'Descrição do card'}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-400 shrink-0" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{editingLinkId ? 'Salvar Alterações' : 'Adicionar à Página'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-zinc-900 dark:text-zinc-100 mb-2">
              Excluir este link?
            </h3>
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 mb-6">
              Esta ação removerá o link da sua Página Pública DiretoLink. Você poderá adicionar um novo a qualquer momento.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteLink(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
