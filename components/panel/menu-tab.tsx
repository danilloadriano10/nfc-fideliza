'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Plus,
  Search,
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
  UtensilsCrossed,
  ExternalLink,
  Check,
  Globe,
  Sliders,
  ChevronDown,
  ChevronUp,
  Copy,
  Info,
  ArrowUpDown,
} from 'lucide-react'
import {
  Company,
  MenuItem,
  MenuMode,
  MenuSizeOption,
  MenuFlavorOption,
  MenuExtraOption,
  MenuCustomStep,
  MenuCustomStepOption,
} from '@/types/platform'
import {
  getCompanyMenuItems,
  saveCompanyMenuItemOnServerApi,
  deleteCompanyMenuItemOnServerApi,
  toggleCompanyMenuItemStatusOnServerApi,
  fetchCompanyMenuItemsFromServer,
  saveCompanyLocally,
  saveCompanyMenuItemsOrderOnServer,
  DATA_CHANGE_EVENT,
} from '@/lib/storage'
import { uploadCompanyImageFromClient, isBase64Image } from '@/lib/storage-client'
import { INITIAL_MENU_ITEMS } from '@/lib/initial-data'
import { OrganizeItemsModal } from './organize-items-modal'

interface MenuTabProps {
  company: Company
  onCompanyUpdate?: (updated: Company) => void
}

const COMMON_MENU_CATEGORIES = [
  'Lanches & Burgers',
  'Pizzas',
  'Porções & Petiscos',
  'Pratos Executivos',
  'Monte seu pedido',
  'Bebidas & Cafés',
  'Sucos & Drinks',
  'Sobremesas & Doces',
  'Combos & Promoções',
  'Geral',
]

export const MenuTab: React.FC<MenuTabProps> = ({ company, onCompanyUpdate }) => {
  // Mode: External link vs Internal DiretoLink
  const [menuMode, setMenuMode] = useState<MenuMode>(
    company.menuMode || (company.menuUrl ? 'external' : 'internal')
  )
  const [externalUrl, setExternalUrl] = useState(company.menuUrl || '')
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  // Items State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() =>
    getCompanyMenuItems(company.id)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOrganizeModalOpen, setIsOrganizeModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)

  // Form Fields
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Lanches & Burgers')
  const [customCategory, setCustomCategory] = useState('')
  const [description, setDescription] = useState('')
  const [priceType, setPriceType] = useState<'fixed' | 'consult'>('fixed')
  const [price, setPrice] = useState<string>('')
  const [promotionalPrice, setPromotionalPrice] = useState<string>('')
  const [isAvailable, setIsAvailable] = useState<boolean>(true)
  const [isFeatured, setIsFeatured] = useState<boolean>(false)
  const [order, setOrder] = useState<number>(0)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload')
  const [allowNotes, setAllowNotes] = useState(true)

  // Options & Additions
  const [hasSizes, setHasSizes] = useState(false)
  const [sizes, setSizes] = useState<MenuSizeOption[]>([])

  const [hasFlavors, setHasFlavors] = useState(false)
  const [flavorsMax, setFlavorsMax] = useState<number>(2)
  const [flavors, setFlavors] = useState<MenuFlavorOption[]>([])

  const [hasExtras, setHasExtras] = useState(false)
  const [extras, setExtras] = useState<MenuExtraOption[]>([])

  const [hasRemovable, setHasRemovable] = useState(false)
  const [removableIngredients, setRemovableIngredients] = useState<string[]>([])

  // Monte seu Pedido (Custom Steps)
  const [isCustomBuilder, setIsCustomBuilder] = useState(false)
  const [customSteps, setCustomSteps] = useState<MenuCustomStep[]>([])

  // Deletion modal
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load and sync items
  const loadItems = useCallback(() => {
    const list = getCompanyMenuItems(company.id)
    setMenuItems(list)
  }, [company.id])

  useEffect(() => {
    loadItems()
    setIsLoading(true)
    fetchCompanyMenuItemsFromServer(company.id)
      .then((items) => {
        setMenuItems(items)
      })
      .finally(() => setIsLoading(false))

    const handleSync = () => loadItems()
    window.addEventListener(DATA_CHANGE_EVENT, handleSync)
    return () => window.removeEventListener(DATA_CHANGE_EVENT, handleSync)
  }, [company.id, loadItems])

  // Save Company Menu Mode & External URL
  const handleSaveMenuModeConfig = async (newMode: MenuMode, urlToSave?: string) => {
    setIsSavingConfig(true)
    const finalUrl = urlToSave !== undefined ? urlToSave : externalUrl

    const updatedCompany: Company = {
      ...company,
      menuMode: newMode,
      menuUrl: finalUrl.trim(),
      modules: {
        ...company.modules,
        menu: true,
      },
    }

    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          updateMenuConfig: true,
          menuMode: newMode,
          menuUrl: finalUrl.trim(),
        }),
      })

      if (res.ok) {
        saveCompanyLocally(updatedCompany)
        if (onCompanyUpdate) onCompanyUpdate(updatedCompany)
        setMenuMode(newMode)
        showToast(
          'success',
          newMode === 'internal'
            ? 'Cardápio DiretoLink ativado com sucesso!'
            : 'Modo Link Externo salvo com sucesso!'
        )
      } else {
        saveCompanyLocally(updatedCompany)
        if (onCompanyUpdate) onCompanyUpdate(updatedCompany)
        setMenuMode(newMode)
        showToast('success', 'Configurações do cardápio salvas com sucesso!')
      }
    } catch {
      saveCompanyLocally(updatedCompany)
      if (onCompanyUpdate) onCompanyUpdate(updatedCompany)
      setMenuMode(newMode)
      showToast('success', 'Configurações atualizadas!')
    } finally {
      setIsSavingConfig(false)
    }
  }

  // Load sample demo items for restaurants/cafeterias if merchant has no items yet
  const handleSeedDemoItems = async () => {
    setIsLoading(true)
    try {
      const samples = INITIAL_MENU_ITEMS.slice(0, 3)
      for (const sample of samples) {
        const itemCopy: MenuItem = {
          ...sample,
          id: `mnu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          companyId: company.id,
        }
        await saveCompanyMenuItemOnServerApi(itemCopy, false)
      }
      loadItems()
      showToast('success', '3 itens de exemplo carregados no cardápio!')
    } catch {
      showToast('error', 'Erro ao carregar exemplos.')
    } finally {
      setIsLoading(false)
    }
  }

  // Open modal for new item
  const handleOpenNewModal = () => {
    setEditingItem(null)
    setName('')
    setCategory('Lanches & Burgers')
    setCustomCategory('')
    setDescription('')
    setPriceType('fixed')
    setPrice('')
    setPromotionalPrice('')
    setIsAvailable(true)
    setIsFeatured(false)
    setOrder(menuItems.length + 1)
    setPhotoUrl('')
    setPhotoPreview('')
    setPhotoFile(null)
    setPhotoMode('upload')
    setAllowNotes(true)

    setHasSizes(false)
    setSizes([])

    setHasFlavors(false)
    setFlavorsMax(2)
    setFlavors([])

    setHasExtras(false)
    setExtras([])

    setHasRemovable(false)
    setRemovableIngredients([])

    setIsCustomBuilder(false)
    setCustomSteps([])

    setIsModalOpen(true)
  }

  // Open modal for editing
  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item)
    setName(item.name)
    if (COMMON_MENU_CATEGORIES.includes(item.category)) {
      setCategory(item.category)
      setCustomCategory('')
    } else {
      setCategory('Outra')
      setCustomCategory(item.category)
    }
    setDescription(item.description || '')
    setPriceType(item.priceType || 'fixed')
    setPrice(item.price != null ? item.price.toString() : '')
    setPromotionalPrice(
      item.promotionalPrice != null ? item.promotionalPrice.toString() : ''
    )
    setIsAvailable(item.isAvailable !== false)
    setIsFeatured(Boolean(item.isFeatured))
    setOrder(item.order || 0)
    setPhotoUrl(item.photoUrl || '')
    setPhotoPreview(item.photoUrl || '')
    setPhotoFile(null)
    setPhotoMode(item.photoUrl ? 'url' : 'upload')
    setAllowNotes(item.allowNotes !== false)

    // Options
    setHasSizes(Array.isArray(item.sizes) && item.sizes.length > 0)
    setSizes(Array.isArray(item.sizes) ? [...item.sizes] : [])

    setHasFlavors(Array.isArray(item.flavors) && item.flavors.length > 0)
    setFlavorsMax(item.flavorsMax || 2)
    setFlavors(Array.isArray(item.flavors) ? [...item.flavors] : [])

    setHasExtras(Array.isArray(item.extras) && item.extras.length > 0)
    setExtras(Array.isArray(item.extras) ? [...item.extras] : [])

    setHasRemovable(
      Array.isArray(item.removableIngredients) &&
        item.removableIngredients.length > 0
    )
    setRemovableIngredients(
      Array.isArray(item.removableIngredients)
        ? [...item.removableIngredients]
        : []
    )

    // Custom Builder
    setIsCustomBuilder(Boolean(item.isCustomBuilder))
    setCustomSteps(Array.isArray(item.customSteps) ? [...item.customSteps] : [])

    setIsModalOpen(true)
  }

  // Duplicate an existing item
  const handleDuplicateItem = async (item: MenuItem) => {
    const duplicated: MenuItem = {
      ...item,
      id: `mnu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${item.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await saveCompanyMenuItemOnServerApi(duplicated, false)
    loadItems()
    showToast('success', `Item "${item.name}" duplicado com sucesso!`)
  }

  // Quick toggle availability (Disponível/Esgotado)
  const handleToggleAvailability = async (item: MenuItem) => {
    const newStatus = !item.isAvailable
    await toggleCompanyMenuItemStatusOnServerApi(item.id, company.id)
    loadItems()
    showToast(
      'success',
      newStatus
        ? `"${item.name}" marcado como Disponível.`
        : `"${item.name}" marcado como Esgotado.`
    )
  }

  // Save Item (Create or Edit)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast('error', 'Informe o nome do item.')
      return
    }

    const finalCategory =
      category === 'Outra' ? customCategory.trim() || 'Geral' : category

    setIsSaving(true)

    try {
      let finalPhotoUrl = photoUrl.trim()

      if (photoMode === 'upload' && photoFile) {
        const uploadRes = await uploadCompanyImageFromClient(
          company.id,
          'menu',
          photoFile
        )
        if (uploadRes.success && uploadRes.url) {
          finalPhotoUrl = uploadRes.url
        } else {
          showToast(
            'error',
            uploadRes.error || 'Erro no upload da imagem. Salvando sem ela.'
          )
        }
      }

      const parsedPrice = price.trim()
        ? parseFloat(price.replace(',', '.'))
        : null
      const parsedPromo = promotionalPrice.trim()
        ? parseFloat(promotionalPrice.replace(',', '.'))
        : null

      const itemToSave: MenuItem = {
        id: editingItem ? editingItem.id : '',
        companyId: company.id,
        name: name.trim(),
        category: finalCategory,
        description: description.trim() || undefined,
        price: parsedPrice,
        priceType,
        promotionalPrice: parsedPromo,
        isAvailable,
        isFeatured,
        order: Number(order) || 0,
        photoUrl: finalPhotoUrl || undefined,
        allowNotes,

        // Options & Additions
        sizes: hasSizes ? sizes.filter((s) => s.name.trim()) : [],
        flavorsMax: hasFlavors ? Number(flavorsMax) || 1 : 1,
        flavors: hasFlavors ? flavors.filter((f) => f.name.trim()) : [],
        extras: hasExtras ? extras.filter((e) => e.name.trim()) : [],
        removableIngredients: hasRemovable
          ? removableIngredients.filter((r) => r.trim())
          : [],

        // Custom Builder
        isCustomBuilder,
        customSteps: isCustomBuilder ? customSteps : [],

        isActive: true,
        createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const res = await saveCompanyMenuItemOnServerApi(
        itemToSave,
        Boolean(editingItem)
      )

      if (res.success) {
        showToast(
          'success',
          editingItem
            ? 'Item atualizado com sucesso!'
            : 'Novo item adicionado ao cardápio!'
        )
        setIsModalOpen(false)
        loadItems()
      } else {
        showToast('error', res.error || 'Erro ao salvar item.')
      }
    } catch (err) {
      console.error('Error saving item:', err)
      showToast('error', 'Ocorreu um erro ao salvar o item.')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteCompanyMenuItemOnServerApi(itemId, company.id)
      showToast('success', 'Item removido do cardápio.')
      setDeletingItemId(null)
      loadItems()
    } catch {
      showToast('error', 'Erro ao excluir item.')
    }
  }

  // Filter items
  const categoriesList = Array.from(
    new Set(menuItems.map((i) => i.category || 'Geral'))
  ).filter(Boolean)

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(search.toLowerCase())) ||
      (item.category &&
        item.category.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory =
      selectedCategory === 'Todas' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Format price helper
  const formatMoney = (val?: number | null) => {
    if (val == null || isNaN(val)) return 'Sob consulta'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold text-white animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 border border-emerald-500'
              : 'bg-red-600 border border-red-500'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-teal-500/10 via-emerald-500/5 to-amber-500/10 border border-teal-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-500/20 shrink-0">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
                  Módulo Cardápio
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {menuMode === 'internal' ? 'Cardápio DiretoLink' : 'Link Externo'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
                Configure como seus clientes acessarão seu cardápio na página
                pública: use seu link externo existente ou crie seu cardápio digital
                interativo completo na DiretoLink com opções, etapas e pedidos direto
                no WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/empresa/${company.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver na Página Pública</span>
            </a>
          </div>
        </div>
      </div>

      {/* MODE SELECTOR (OPÇÃO 1 vs OPÇÃO 2) */}
      <div className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-600" />
            <span>Como deseja exibir o Cardápio na sua página?</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Alterne entre link externo ou cardápio digital nativo a qualquer momento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Opção 1: Link Externo */}
          <div
            onClick={() => handleSaveMenuModeConfig('external')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              menuMode === 'external'
                ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    menuMode === 'external'
                      ? 'bg-teal-600 text-white'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                    1. Usar link de cardápio externo
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Abre seu cardápio em PDF, Anota Aí, iFood ou site próprio
                  </p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  menuMode === 'external'
                    ? 'border-teal-600 bg-teal-600'
                    : 'border-neutral-300'
                }`}
              >
                {menuMode === 'external' && (
                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                )}
              </div>
            </div>

            {menuMode === 'external' && (
              <div
                className="mt-3.5 pt-3 border-t border-teal-200/60 space-y-2"
                onClick={(e) => e.stopPropagation()}
              >
                <label className="block text-[11px] font-semibold text-neutral-700">
                  URL do Cardápio Externo:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://cardapio.meusite.com.br"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-teal-500 font-mono"
                  />
                  <button
                    onClick={() => handleSaveMenuModeConfig('external', externalUrl)}
                    disabled={isSavingConfig}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition-all disabled:opacity-50"
                  >
                    {isSavingConfig ? 'Salvando...' : 'Salvar URL'}
                  </button>
                </div>
                {externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-medium hover:underline pt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Testar abertura do link</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Opção 2: Criar Cardápio na DiretoLink */}
          <div
            onClick={() => handleSaveMenuModeConfig('internal')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              menuMode === 'internal'
                ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    menuMode === 'internal'
                      ? 'bg-teal-600 text-white'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                    2. Criar Cardápio na DiretoLink
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Cardápio digital integrado com adicionais e pedido no WhatsApp
                  </p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  menuMode === 'internal'
                    ? 'border-teal-600 bg-teal-600'
                    : 'border-neutral-300'
                }`}
              >
                {menuMode === 'internal' && (
                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                )}
              </div>
            </div>

            {menuMode === 'internal' && (
              <div className="mt-3.5 pt-3 border-t border-teal-200/60 flex items-center justify-between text-[11px] text-teal-800 font-medium">
                <span>
                  ✓ {menuItems.length} {menuItems.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
                </span>
                <span className="text-teal-600">Ativo na página pública</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GESTÃO DO CARDÁPIO INTERNO */}
      {menuMode === 'internal' && (
        <div className="space-y-4">
          {/* Action & Stats Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenNewModal}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Item do Cardápio</span>
              </button>

              {menuItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsOrganizeModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-50 active:scale-95 text-neutral-800 font-bold text-xs flex items-center justify-center gap-2 border border-neutral-200/90 shadow-2xs hover:border-teal-300 transition-all cursor-pointer"
                >
                  <ArrowUpDown className="w-4 h-4 text-teal-600" />
                  <span>Organizar ordem</span>
                </button>
              )}

              {menuItems.length === 0 && (
                <button
                  onClick={handleSeedDemoItems}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Carregar Exemplos Prontos</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="font-semibold text-neutral-800">
                {menuItems.length}
              </span>{' '}
              itens no total •{' '}
              <span className="font-semibold text-emerald-600">
                {menuItems.filter((i) => i.isAvailable !== false).length}
              </span>{' '}
              disponíveis
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, categoria ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs focus:outline-teal-500 shadow-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {['Todas', ...categoriesList].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-neutral-50 border border-dashed border-neutral-300">
              <UtensilsCrossed className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-neutral-700">
                Nenhum item encontrado
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                {search || selectedCategory !== 'Todas'
                  ? 'Nenhum item corresponde aos filtros selecionados.'
                  : 'Seu cardápio ainda não tem itens cadastrados. Adicione seu primeiro item agora!'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={handleOpenNewModal}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Primeiro Item</span>
                </button>
                {menuItems.length === 0 && (
                  <button
                    onClick={handleSeedDemoItems}
                    className="px-3.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold text-xs rounded-xl transition-all"
                  >
                    Carregar Exemplos
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const hasPromo =
                  item.promotionalPrice != null &&
                  typeof item.price === 'number' &&
                  item.promotionalPrice < item.price

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden bg-white shadow-xs ${
                      item.isAvailable === false
                        ? 'border-neutral-200 opacity-75'
                        : 'border-neutral-200 hover:border-teal-300 hover:shadow-md'
                    }`}
                  >
                    {/* Top: Image & Header info */}
                    <div>
                      <div className="relative h-44 w-full bg-neutral-100 overflow-hidden">
                        {item.photoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.photoUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // Fallback if image fails
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-100">
                            <UtensilsCrossed className="w-8 h-8 opacity-40 mb-1" />
                            <span className="text-[10px]">Sem foto</span>
                          </div>
                        )}

                        {/* Badges Over Image */}
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                          {item.isFeatured && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Destaque</span>
                            </span>
                          )}
                          {item.isCustomBuilder && (
                            <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              <span>Monte seu pedido</span>
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            title="Clique para alternar Disponível / Esgotado"
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all shadow-xs cursor-pointer ${
                              item.isAvailable !== false
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-800 text-white'
                            }`}
                          >
                            {item.isAvailable !== false ? 'Disponível' : 'Esgotado'}
                          </button>
                        </div>

                        {/* Category tag */}
                        <div className="absolute bottom-2.5 left-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-neutral-900 leading-tight">
                            {item.name}
                          </h4>
                        </div>

                        {item.description && (
                          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Prices */}
                        <div className="pt-1 flex items-baseline gap-2">
                          {hasPromo ? (
                            <>
                              <span className="text-base font-extrabold text-emerald-600">
                                {formatMoney(item.promotionalPrice)}
                              </span>
                              <span className="text-xs text-neutral-400 line-through">
                                {formatMoney(item.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-base font-extrabold text-neutral-900">
                              {formatMoney(item.price)}
                            </span>
                          )}
                        </div>

                        {/* Options Pills Info */}
                        <div className="pt-2 border-t border-neutral-100 flex flex-wrap gap-1.5 text-[10px] text-neutral-500">
                          {item.sizes && item.sizes.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-neutral-100 font-medium">
                              {item.sizes.length} {item.sizes.length === 1 ? 'tamanho' : 'tamanhos'}
                            </span>
                          )}
                          {item.flavors && item.flavors.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-neutral-100 font-medium">
                              {item.flavors.length} sabores
                            </span>
                          )}
                          {item.extras && item.extras.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-medium">
                              +{item.extras.length} adicionais
                            </span>
                          )}
                          {item.removableIngredients &&
                            item.removableIngredients.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-neutral-100 font-medium">
                                -{item.removableIngredients.length} ingredientes
                              </span>
                            )}
                          {item.isCustomBuilder &&
                            item.customSteps &&
                            item.customSteps.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 font-bold">
                                {item.customSteps.length} etapas
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-3 bg-neutral-50/60 border-t border-neutral-100 flex items-center justify-between gap-1">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-all ${
                          item.isAvailable !== false
                            ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {item.isAvailable !== false
                          ? 'Marcar Esgotado'
                          : 'Reativar'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicateItem(item)}
                          title="Duplicar Item"
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Editar Item"
                          className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItemId(item.id)}
                          title="Excluir Item"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR ITEM DO CARDÁPIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-neutral-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-neutral-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {editingItem ? 'Editar Item do Cardápio' : 'Novo Item do Cardápio'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Preencha os detalhes, opções, adicionais ou etapas do item.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form
              onSubmit={handleSaveItem}
              className="p-5 overflow-y-auto flex-1 space-y-5"
            >
              {/* DADOS BÁSICOS */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Dados Principais
                </h4>

                {/* Nome */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Nome do Item *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: X-Burguer Especial, Pizza Calabresa, Combo Família..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-teal-500 font-medium"
                  />
                </div>

                {/* Categoria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-teal-500 bg-white"
                    >
                      {COMMON_MENU_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="Outra">+ Nova categoria personalizada</option>
                    </select>
                  </div>

                  {category === 'Outra' && (
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Nome da Nova Categoria
                      </label>
                      <input
                        type="text"
                        required
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Ex: Massas Artesanais, Salgados..."
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-teal-500"
                      />
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Descrição dos Ingredientes e Detalhes
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Blend bovino 180g, queijo cheddar inglês derretido, cebola caramelizada e maionese defumada no pão brioche."
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-teal-500 leading-relaxed"
                  />
                </div>

                {/* PREÇOS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Tipo de Preço
                    </label>
                    <select
                      value={priceType}
                      onChange={(e) =>
                        setPriceType(e.target.value as 'fixed' | 'consult')
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 text-xs bg-white"
                    >
                      <option value="fixed">Preço Fixo</option>
                      <option value="consult">Sob Consulta</option>
                    </select>
                  </div>

                  {priceType === 'fixed' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          Preço Normal (R$)
                        </label>
                        <input
                          type="text"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="Ex: 34.90"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                          <span>Preço Promo (R$)</span>
                          <span className="text-[10px] text-amber-600 font-normal">
                            Opcional
                          </span>
                        </label>
                        <input
                          type="text"
                          value={promotionalPrice}
                          onChange={(e) => setPromotionalPrice(e.target.value)}
                          placeholder="Ex: 29.90"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* STATUS & DESTAQUE */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-neutral-300"
                    />
                    <span className="text-xs font-semibold text-neutral-800">
                      Disponível para Pedidos
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded border-neutral-300"
                    />
                    <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Item em Destaque</span>
                    </span>
                  </label>
                </div>

                {/* FOTO DO ITEM */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Foto do Item
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setPhotoMode('upload')}
                      className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                        photoMode === 'upload'
                          ? 'bg-teal-600 text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      Upload do Computador/Celular
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoMode('url')}
                      className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                        photoMode === 'url'
                          ? 'bg-teal-600 text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      URL da Imagem
                    </button>
                  </div>

                  {photoMode === 'upload' ? (
                    <div className="flex items-center gap-3">
                      <label className="flex-1 border-2 border-dashed border-neutral-300 hover:border-teal-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-neutral-50/50">
                        <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                        <span className="text-xs font-medium text-neutral-600">
                          {photoFile ? photoFile.name : 'Selecionar foto do prato'}
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-0.5">
                          JPG, PNG, WebP (comprimido automaticamente)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setPhotoFile(file)
                              setPhotoPreview(URL.createObjectURL(file))
                            }
                          }}
                        />
                      </label>
                      {photoPreview && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 shrink-0 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={(e) => {
                          setPhotoUrl(e.target.value)
                          setPhotoPreview(e.target.value)
                        }}
                        placeholder="https://exemplo.com/foto-hamburguer.jpg"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-teal-500 font-mono"
                      />
                      {photoPreview && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-neutral-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* OPÇÕES E ADICIONAIS */}
              <div className="space-y-4 pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Opções e Adicionais
                  </h4>
                  <span className="text-[11px] text-neutral-500">
                    Personalize para o cliente
                  </span>
                </div>

                {/* 1. TAMANHO */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-neutral-800">
                      <input
                        type="checkbox"
                        checked={hasSizes}
                        onChange={(e) => {
                          setHasSizes(e.target.checked)
                          if (e.target.checked && sizes.length === 0) {
                            const parsed = parseFloat(price) || 0
                            setSizes([
                              { id: 'sz_1', name: 'Individual', price: parsed > 0 ? parsed : 29.9 },
                              { id: 'sz_2', name: 'Grande', price: parsed > 0 ? parsed + 15 : 44.9 },
                            ])
                          }
                        }}
                        className="w-4 h-4 text-teal-600 rounded border-neutral-300"
                      />
                      <span>Tamanhos (Ex: Individual, Médio, Grande, 1 Litro...)</span>
                    </label>
                  </div>

                  {hasSizes && (
                    <div className="space-y-2 pt-1">
                      {sizes.map((sz, idx) => (
                        <div key={sz.id || idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nome (Ex: Médio 300g)"
                            value={sz.name}
                            onChange={(e) => {
                              const copy = [...sizes]
                              copy[idx].name = e.target.value
                              setSizes(copy)
                            }}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 text-xs bg-white"
                          />
                          <div className="w-32 flex items-center gap-1">
                            <span className="text-[11px] text-neutral-400 font-semibold">R$</span>
                            <input
                              type="number"
                              step="0.5"
                              placeholder="0.00"
                              value={sz.price ?? ''}
                              onChange={(e) => {
                                const copy = [...sizes]
                                copy[idx].price = parseFloat(e.target.value) || 0
                                setSizes(copy)
                              }}
                              className="w-full px-2 py-1.5 rounded-xl border border-neutral-300 text-xs font-mono bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setSizes(sizes.filter((_, i) => i !== idx))}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setSizes([
                            ...sizes,
                            { id: `sz_${Date.now()}`, name: '', price: 0 },
                          ])
                        }
                        className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar outro tamanho</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. SABORES */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-neutral-800">
                      <input
                        type="checkbox"
                        checked={hasFlavors}
                        onChange={(e) => {
                          setHasFlavors(e.target.checked)
                          if (e.target.checked && flavors.length === 0) {
                            setFlavors([
                              { id: 'fl_1', name: 'Calabresa Especial' },
                              { id: 'fl_2', name: 'Quatro Queijos' },
                            ])
                          }
                        }}
                        className="w-4 h-4 text-teal-600 rounded border-neutral-300"
                      />
                      <span>
                        Sabores (Ex: Escolha até 2 sabores para Pizza ou Açaí)
                      </span>
                    </label>
                  </div>

                  {hasFlavors && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs text-neutral-600 font-medium">
                          Máximo de sabores permitidos:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={flavorsMax}
                          onChange={(e) => setFlavorsMax(parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 rounded-lg border border-neutral-300 text-xs bg-white font-mono"
                        />
                      </div>

                      {flavors.map((fl, idx) => (
                        <div key={fl.id || idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nome do sabor (Ex: Marguerita Especial)"
                            value={fl.name}
                            onChange={(e) => {
                              const copy = [...flavors]
                              copy[idx].name = e.target.value
                              setFlavors(copy)
                            }}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFlavors(flavors.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setFlavors([
                            ...flavors,
                            { id: `fl_${Date.now()}`, name: '' },
                          ])
                        }
                        className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar sabor</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. ADICIONAIS COM VALOR EXTRA */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-neutral-800">
                      <input
                        type="checkbox"
                        checked={hasExtras}
                        onChange={(e) => {
                          setHasExtras(e.target.checked)
                          if (e.target.checked && extras.length === 0) {
                            setExtras([
                              { id: 'ext_1', name: 'Bacon Crocante', price: 4.5 },
                              { id: 'ext_2', name: 'Queijo Cheddar Duplo', price: 4.0 },
                            ])
                          }
                        }}
                        className="w-4 h-4 text-teal-600 rounded border-neutral-300"
                      />
                      <span>Adicionais com Valor Extra (Ex: Bacon +R$ 4,50)</span>
                    </label>
                  </div>

                  {hasExtras && (
                    <div className="space-y-2 pt-1">
                      {extras.map((ext, idx) => (
                        <div key={ext.id || idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nome do adicional (Ex: Ovo frito caipira)"
                            value={ext.name}
                            onChange={(e) => {
                              const copy = [...extras]
                              copy[idx].name = e.target.value
                              setExtras(copy)
                            }}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 text-xs bg-white"
                          />
                          <div className="w-32 flex items-center gap-1">
                            <span className="text-[11px] text-neutral-400">+R$</span>
                            <input
                              type="number"
                              step="0.5"
                              placeholder="0.00"
                              value={ext.price ?? ''}
                              onChange={(e) => {
                                const copy = [...extras]
                                copy[idx].price = parseFloat(e.target.value) || 0
                                setExtras(copy)
                              }}
                              className="w-full px-2 py-1.5 rounded-xl border border-neutral-300 text-xs font-mono bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setExtras(extras.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setExtras([
                            ...extras,
                            { id: `ext_${Date.now()}`, name: '', price: 0 },
                          ])
                        }
                        className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar outro adicional</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. REMOVER INGREDIENTES */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-neutral-800">
                      <input
                        type="checkbox"
                        checked={hasRemovable}
                        onChange={(e) => {
                          setHasRemovable(e.target.checked)
                          if (e.target.checked && removableIngredients.length === 0) {
                            setRemovableIngredients([
                              'Sem cebola',
                              'Sem maionese',
                              'Sem picles',
                            ])
                          }
                        }}
                        className="w-4 h-4 text-teal-600 rounded border-neutral-300"
                      />
                      <span>
                        Remover Ingredientes (Opções que o cliente pode retirar)
                      </span>
                    </label>
                  </div>

                  {hasRemovable && (
                    <div className="space-y-2 pt-1">
                      {removableIngredients.map((itemRem, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Ex: Sem cebola, Sem mostarda, Sem tomate..."
                            value={itemRem}
                            onChange={(e) => {
                              const copy = [...removableIngredients]
                              copy[idx] = e.target.value
                              setRemovableIngredients(copy)
                            }}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setRemovableIngredients(
                                removableIngredients.filter((_, i) => i !== idx)
                              )
                            }
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setRemovableIngredients([...removableIngredients, ''])
                        }
                        className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar ingrediente removível</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. OBSERVAÇÕES LIVRES */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-neutral-800">
                    <input
                      type="checkbox"
                      checked={allowNotes}
                      onChange={(e) => setAllowNotes(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-neutral-300"
                    />
                    <span>Permitir campo de observações livres para o cliente</span>
                  </label>
                </div>
              </div>

              {/* MONTE SEU PEDIDO (ETAPAS) */}
              <div className="space-y-4 pt-4 border-t border-neutral-200">
                <div className="p-4 rounded-2xl bg-violet-50/70 border-2 border-violet-200 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCustomBuilder}
                        onChange={(e) => {
                          setIsCustomBuilder(e.target.checked)
                          if (e.target.checked && customSteps.length === 0) {
                            setCustomSteps([
                              {
                                id: 'stp_1',
                                title: '1. Escolha a proteína',
                                description: 'Escolha 1 opção',
                                minSelection: 1,
                                maxSelection: 1,
                                required: true,
                                options: [
                                  { id: 'op_carne', name: 'Carne Bovina 180g', price: 0 },
                                  { id: 'op_frango', name: 'Frango Empanado Crocante', price: 0 },
                                  { id: 'op_vegano', name: 'Opção Vegana (Grão de Bico)', price: 2 },
                                ],
                              },
                              {
                                id: 'stp_2',
                                title: '2. Escolha acompanhamentos',
                                description: 'Escolha até 2 opções',
                                minSelection: 1,
                                maxSelection: 2,
                                required: true,
                                options: [
                                  { id: 'op_batata', name: 'Batata Rústica', price: 0 },
                                  { id: 'op_onion', name: 'Anéis de Cebola', price: 3 },
                                  { id: 'op_salada', name: 'Mini Salada Fresca', price: 0 },
                                ],
                              },
                              {
                                id: 'stp_3',
                                title: '3. Escolha adicionais',
                                description: 'Opcionais para enriquecer seu pedido',
                                minSelection: 0,
                                maxSelection: 3,
                                required: false,
                                options: [
                                  { id: 'op_bacon', name: 'Bacon Crocante', price: 4.5 },
                                  { id: 'op_cheddar', name: 'Cheddar Cremoso Quente', price: 4.0 },
                                ],
                              },
                            ])
                          }
                        }}
                        className="w-4 h-4 text-violet-600 rounded border-neutral-300 mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-bold text-violet-950 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-violet-700" />
                          <span>Ativar opção &quot;Monte seu pedido&quot; neste item</span>
                        </span>
                        <p className="text-[11px] text-violet-800/80 mt-0.5 leading-relaxed">
                          Permite criar fluxo em etapas (Ex: 1. Escolha a proteína, 2. Escolha acompanhamentos, 3. Escolha adicionais) com soma automática de valores extras.
                        </p>
                      </div>
                    </label>
                  </div>

                  {isCustomBuilder && (
                    <div className="space-y-4 pt-2">
                      {customSteps.map((step, sIdx) => (
                        <div
                          key={step.id || sIdx}
                          className="p-3.5 rounded-xl bg-white border border-violet-200/90 shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => {
                                const copy = [...customSteps]
                                copy[sIdx].title = e.target.value
                                setCustomSteps(copy)
                              }}
                              placeholder="Título da etapa (Ex: 1. Escolha a proteína)"
                              className="font-bold text-xs text-neutral-900 border-b border-neutral-200 focus:border-violet-500 outline-none pb-1 flex-1 bg-transparent"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setCustomSteps(
                                  customSteps.filter((_, idx) => idx !== sIdx)
                                )
                              }
                              className="text-red-500 hover:bg-red-50 p-1 rounded-md text-xs font-semibold flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remover etapa</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-neutral-500 block mb-0.5">
                                Mín. seleções:
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={5}
                                value={step.minSelection}
                                onChange={(e) => {
                                  const copy = [...customSteps]
                                  copy[sIdx].minSelection =
                                    parseInt(e.target.value) || 0
                                  setCustomSteps(copy)
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-neutral-300 text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-neutral-500 block mb-0.5">
                                Máx. seleções:
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={step.maxSelection}
                                onChange={(e) => {
                                  const copy = [...customSteps]
                                  copy[sIdx].maxSelection =
                                    parseInt(e.target.value) || 1
                                  setCustomSteps(copy)
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-neutral-300 text-xs font-mono"
                              />
                            </div>
                            <div className="flex items-center pt-3">
                              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-700 font-medium">
                                <input
                                  type="checkbox"
                                  checked={step.required}
                                  onChange={(e) => {
                                    const copy = [...customSteps]
                                    copy[sIdx].required = e.target.checked
                                    setCustomSteps(copy)
                                  }}
                                  className="w-3.5 h-3.5 text-violet-600 rounded"
                                />
                                <span>Obrigatório</span>
                              </label>
                            </div>
                          </div>

                          {/* Options of this step */}
                          <div className="space-y-2 pt-2 border-t border-neutral-100">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                              Opções desta etapa:
                            </span>
                            {step.options.map((opt, oIdx) => (
                              <div
                                key={opt.id || oIdx}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="text"
                                  placeholder="Nome da opção (Ex: Filé Mignon)"
                                  value={opt.name}
                                  onChange={(e) => {
                                    const copy = [...customSteps]
                                    copy[sIdx].options[oIdx].name = e.target.value
                                    setCustomSteps(copy)
                                  }}
                                  className="flex-1 px-2.5 py-1 rounded-lg border border-neutral-200 text-xs bg-neutral-50/50"
                                />
                                <div className="w-28 flex items-center gap-1">
                                  <span className="text-[10px] text-neutral-400">+R$</span>
                                  <input
                                    type="number"
                                    step="0.5"
                                    placeholder="0.00"
                                    value={opt.price ?? ''}
                                    onChange={(e) => {
                                      const copy = [...customSteps]
                                      copy[sIdx].options[oIdx].price =
                                        parseFloat(e.target.value) || 0
                                      setCustomSteps(copy)
                                    }}
                                    className="w-full px-1.5 py-1 rounded-lg border border-neutral-200 text-xs font-mono"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = [...customSteps]
                                    copy[sIdx].options = copy[sIdx].options.filter(
                                      (_, i) => i !== oIdx
                                    )
                                    setCustomSteps(copy)
                                  }}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => {
                                const copy = [...customSteps]
                                copy[sIdx].options.push({
                                  id: `opt_${Date.now()}`,
                                  name: '',
                                  price: 0,
                                })
                                setCustomSteps(copy)
                              }}
                              className="text-[11px] text-violet-700 font-semibold hover:underline flex items-center gap-1 pt-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar opção nesta etapa</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          setCustomSteps([
                            ...customSteps,
                            {
                              id: `stp_${Date.now()}`,
                              title: `${customSteps.length + 1}. Nova Etapa`,
                              minSelection: 0,
                              maxSelection: 1,
                              required: false,
                              options: [{ id: `opt_${Date.now()}`, name: '', price: 0 }],
                            },
                          ])
                        }
                        className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Nova Etapa</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingItem ? 'Salvar Alterações' : 'Cadastrar Item'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-neutral-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Excluir este item?
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Esta ação removerá o item do cardápio permanentemente.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingItemId(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-xs hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteItem(deletingItemId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organize Menu Items Order Modal */}
      <OrganizeItemsModal
        isOpen={isOrganizeModalOpen}
        onClose={() => setIsOrganizeModalOpen(false)}
        title="Organizar Ordem do Cardápio"
        subtitle="Defina a sequência em que os pratos e itens aparecem no cardápio da Página Pública."
        itemTypeLabel="itens do cardápio"
        items={menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          photoUrl: item.photoUrl,
          category: item.category,
          subtitle: item.price != null ? `R$ ${item.price.toFixed(2).replace('.', ',')}` : 'Sob consulta',
        }))}
        defaultIcon={<UtensilsCrossed className="w-5 h-5 text-teal-600" />}
        accentColorClass="bg-teal-600 hover:bg-teal-700"
        onSave={async (orderedIds, silent) => {
          await saveCompanyMenuItemsOrderOnServer(company.id, orderedIds)
          const updated = getCompanyMenuItems(company.id)
          setMenuItems(updated)
          if (!silent) {
            showToast('success', 'Ordem do cardápio salva com sucesso!')
          }
        }}
      />
    </div>
  )
}
