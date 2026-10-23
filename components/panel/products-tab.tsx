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
  LayoutGrid,
  AlertCircle,
  Package,
  ExternalLink,
  ShoppingBag,
  ArrowUpDown,
  Check,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  Company,
  CompanyProduct,
  ProductVariationOption,
  ProductCatalogConfig,
} from '@/types/platform'
import {
  getCompanyProducts,
  saveCompanyProductOnServerApi,
  deleteCompanyProductOnServerApi,
  toggleCompanyProductOnServerApi,
  fetchCompanyProductsFromServer,
  saveCompanyLocally,
  saveCompany,
  saveCompanyAsync,
  saveCompanyProductsOrderOnServer,
  DATA_CHANGE_EVENT,
} from '@/lib/storage'
import { uploadCompanyImageFromClient, isBase64Image } from '@/lib/storage-client'
import {
  buildProductWhatsAppMessage,
  DEFAULT_PRODUCT_WHATSAPP_TEMPLATE,
} from '@/lib/product-whatsapp'
import { OrganizeItemsModal } from './organize-items-modal'

interface ProductsTabProps {
  company: Company
  onCompanyUpdate?: (updated: Company) => void
  onEnableModule?: () => void
  onOpenSettings?: () => void
}

const COMMON_PRODUCT_CATEGORIES = [
  'Geral',
  'Roupas & Vestuário',
  'Acessórios',
  'Beleza & Cosméticos',
  'Alimentos & Bebidas',
  'Eletrônicos',
  'Casa & Decoração',
  'Artesanato',
  'Cuidados Pessoais',
  'Papelaria',
  'Presentes',
  'Outros',
]

export const ProductsTab: React.FC<ProductsTabProps> = ({
  company,
  onCompanyUpdate,
  onEnableModule,
  onOpenSettings,
}) => {
  const [products, setProducts] = useState<CompanyProduct[]>(() => getCompanyProducts(company.id))
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')

  // Configuração: Mensagem do WhatsApp para produtos
  const initialWhatsAppTemplate =
    company.productWhatsAppTemplate ||
    company.productCatalog?.whatsappMessageTemplate ||
    ''
  const [whatsappTemplate, setWhatsappTemplate] = useState<string>(initialWhatsAppTemplate)
  const [isSavingWhatsAppConfig, setIsSavingWhatsAppConfig] = useState(false)
  const [isWhatsAppConfigOpen, setIsWhatsAppConfigOpen] = useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  // Sincroniza se a empresa for atualizada externamente
  useEffect(() => {
    const current =
      company.productWhatsAppTemplate ||
      company.productCatalog?.whatsappMessageTemplate ||
      ''
    setWhatsappTemplate(current)
  }, [company.productWhatsAppTemplate, company.productCatalog?.whatsappMessageTemplate])

  // Exemplo de produto para prévia realista no painel
  const previewSampleProduct = React.useMemo(() => {
    const first = products[0]
    return {
      name: first?.name || 'Hambúrguer Artesanal Especial',
      price: first?.promotionalPrice ?? first?.price ?? 38.9,
      promotionalPrice: first?.promotionalPrice,
      priceType: first?.priceType || 'fixed',
      variations:
        first?.variations && first.variations.length > 0
          ? first.variations
          : [{ id: '1', name: 'Tamanho Grande' }],
    }
  }, [products])

  const previewMessage = React.useMemo(() => {
    return buildProductWhatsAppMessage({
      template: whatsappTemplate.trim() ? whatsappTemplate : DEFAULT_PRODUCT_WHATSAPP_TEMPLATE,
      product: previewSampleProduct,
      companyName: company.name || 'Sua Empresa',
      selectedVariation: previewSampleProduct.variations?.[0]?.name || 'Tamanho Grande',
    })
  }, [whatsappTemplate, previewSampleProduct, company.name])

  const handleInsertVariable = (tag: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = whatsappTemplate
      const before = text.substring(0, start)
      const after = text.substring(end)
      const newText = `${before}${tag}${after}`
      setWhatsappTemplate(newText)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + tag.length, start + tag.length)
      }, 0)
    } else {
      setWhatsappTemplate((prev) => (prev ? `${prev} ${tag}` : tag))
    }
  }

  const handleSaveWhatsAppConfig = async () => {
    setIsSavingWhatsAppConfig(true)
    const trimmed = whatsappTemplate.trim()

    const updatedCatalog: ProductCatalogConfig = {
      ...(company.productCatalog || { mode: 'internal' }),
      mode: company.productCatalog?.mode || 'internal',
      whatsappMessageTemplate: trimmed,
    }

    const updatedCompany: Company = {
      ...company,
      productCatalog: updatedCatalog,
      productWhatsAppTemplate: trimmed,
    }

    try {
      saveCompanyLocally(updatedCompany)
      saveCompany(updatedCompany)
      if (onCompanyUpdate) onCompanyUpdate(updatedCompany)

      const res = await saveCompanyAsync(updatedCompany)
      if (res.success) {
        const saved = res.company || updatedCompany
        if (onCompanyUpdate) onCompanyUpdate(saved)
        showToast('success', 'Mensagem do WhatsApp para produtos salva com sucesso!')
      } else {
        showToast('error', res.error || 'Erro ao salvar configuração no servidor.')
      }
    } catch (err) {
      console.error('Erro ao salvar template do WhatsApp:', err)
      showToast('error', 'Falha ao salvar configuração.')
    } finally {
      setIsSavingWhatsAppConfig(false)
    }
  }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOrganizeModalOpen, setIsOrganizeModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<CompanyProduct | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form Fields
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Geral')
  const [customCategory, setCustomCategory] = useState('')
  const [description, setDescription] = useState('')
  const [priceType, setPriceType] = useState<'fixed' | 'consult'>('fixed')
  const [price, setPrice] = useState<string>('')
  const [promotionalPrice, setPromotionalPrice] = useState<string>('')
  const [isAvailable, setIsAvailable] = useState<boolean>(true)
  const [purchaseUrl, setPurchaseUrl] = useState<string>('')
  const [order, setOrder] = useState<number>(0)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload')
  const [isActive, setIsActive] = useState(true)
  const [variations, setVariations] = useState<ProductVariationOption[]>([])
  const [newVarName, setNewVarName] = useState('')
  const [newVarPrice, setNewVarPrice] = useState('')

  // Deletion modal
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Modo de exibição na Página Pública (full | card)
  const [productsDisplayMode, setProductsDisplayMode] = useState<'full' | 'card'>(
    company.productsDisplayMode || company.productCatalog?.displayMode || 'full'
  )
  const [isSavingDisplayMode, setIsSavingDisplayMode] = useState(false)

  useEffect(() => {
    setProductsDisplayMode(
      company.productsDisplayMode || company.productCatalog?.displayMode || 'full'
    )
  }, [company.productsDisplayMode, company.productCatalog?.displayMode])

  const handleSaveDisplayMode = async (mode: 'full' | 'card') => {
    setProductsDisplayMode(mode)
    setIsSavingDisplayMode(true)
    const updatedCompany: Company = {
      ...company,
      productsDisplayMode: mode,
      productCatalog: {
        mode: company.productCatalog?.mode || 'internal',
        ...(company.productCatalog || {}),
        displayMode: mode,
      },
    }
    saveCompanyLocally(updatedCompany)
    saveCompany(updatedCompany)
    if (onCompanyUpdate) {
      onCompanyUpdate(updatedCompany)
    }
    try {
      await saveCompanyAsync(updatedCompany)
      showToast('success', 'Modo de exibição do Catálogo atualizado com sucesso!')
    } catch (err) {
      console.error('Erro ao salvar modo de exibição de produtos:', err)
      showToast('error', 'Salvo localmente, erro ao sincronizar com servidor.')
    } finally {
      setIsSavingDisplayMode(false)
    }
  }

  // Variation helpers
  const handleAddVariation = (customName?: string) => {
    const valName = (customName || newVarName).trim()
    if (!valName) return

    if (variations.some((v) => v.name.toLowerCase() === valName.toLowerCase())) {
      showToast('error', `A variação "${valName}" já foi adicionada.`)
      return
    }

    const parsedP = newVarPrice.trim() !== '' ? parseFloat(newVarPrice.replace(',', '.')) : null
    const newOption: ProductVariationOption = {
      id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: valName,
      price: parsedP != null && !isNaN(parsedP) ? parsedP : null,
    }

    setVariations((prev) => [...prev, newOption])
    if (!customName) {
      setNewVarName('')
      setNewVarPrice('')
    }
  }

  const handleRemoveVariation = (varId: string) => {
    setVariations((prev) => prev.filter((v) => v.id !== varId))
  }

  const handleAddPresetVariations = (presetList: string[]) => {
    setVariations((prev) => {
      const existing = new Set(prev.map((v) => v.name.toLowerCase()))
      const toAdd: ProductVariationOption[] = []
      presetList.forEach((name) => {
        if (!existing.has(name.toLowerCase())) {
          existing.add(name.toLowerCase())
          toAdd.push({
            id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name,
            price: null,
          })
        }
      })
      return [...prev, ...toAdd]
    })
  }

  // Load and sync products
  const loadProducts = useCallback(() => {
    setProducts(getCompanyProducts(company.id))
  }, [company.id])

  useEffect(() => {
    loadProducts()
    fetchCompanyProductsFromServer(company.id).then(() => {
      loadProducts()
    })

    const onDataChange = () => {
      loadProducts()
    }
    window.addEventListener(DATA_CHANGE_EVENT, onDataChange)
    window.addEventListener('storage', onDataChange)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, onDataChange)
      window.removeEventListener('storage', onDataChange)
    }
  }, [company.id, loadProducts])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null)
    setName('')
    setCategory('Geral')
    setCustomCategory('')
    setDescription('')
    setPriceType('fixed')
    setPrice('')
    setPromotionalPrice('')
    setIsAvailable(true)
    setPurchaseUrl('')
    setOrder(products.length > 0 ? products.length + 1 : 1)
    setPhotoUrl('')
    setPhotoPreview('')
    setPhotoFile(null)
    setPhotoMode('upload')
    setIsActive(true)
    setVariations([])
    setNewVarName('')
    setNewVarPrice('')
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (prod: CompanyProduct) => {
    setEditingProduct(prod)
    setName(prod.name)
    const isStandardCat = COMMON_PRODUCT_CATEGORIES.includes(prod.category || '')
    if (isStandardCat) {
      setCategory(prod.category || 'Geral')
      setCustomCategory('')
    } else {
      setCategory('Outros')
      setCustomCategory(prod.category || '')
    }
    setDescription(prod.description || '')
    setPriceType(prod.priceType || (prod.price != null ? 'fixed' : 'consult'))
    setPrice(prod.price != null ? prod.price.toString() : '')
    setPromotionalPrice(prod.promotionalPrice != null ? prod.promotionalPrice.toString() : '')
    setIsAvailable(prod.isAvailable !== false)
    setPurchaseUrl(prod.purchaseUrl || '')
    setOrder(prod.order || 0)
    setPhotoUrl(prod.photoUrl || '')
    setPhotoPreview(prod.photoUrl || '')
    setPhotoFile(null)
    setPhotoMode('upload')
    setIsActive(prod.isActive !== false)
    setVariations(Array.isArray(prod.variations) ? prod.variations : [])
    setNewVarName('')
    setNewVarPrice('')
    setIsModalOpen(true)
  }

  // Handle Photo File selection
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'A imagem selecionada é muito grande. O limite máximo é de 5MB.')
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        setPhotoPreview(result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Save product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showToast('error', 'O nome do produto é obrigatório.')
      return
    }

    setIsSaving(true)

    try {
      let finalPhotoUrl = photoUrl.trim()

      // If a file was selected, upload via permanent storage API
      if (photoFile) {
        try {
          const uploadRes = await uploadCompanyImageFromClient(company.id, 'product', photoFile)
          if (uploadRes.success && uploadRes.url) {
            finalPhotoUrl = uploadRes.url
          } else if (photoPreview && photoPreview.startsWith('data:')) {
            finalPhotoUrl = photoPreview
          } else {
            console.warn('Upload result error, falling back:', uploadRes.error)
            if (photoPreview) {
              finalPhotoUrl = photoPreview
            }
          }
        } catch (uploadErr) {
          console.warn('Falha no upload de imagem:', uploadErr)
          if (photoPreview && photoPreview.startsWith('data:')) {
            finalPhotoUrl = photoPreview
          }
        }
      } else if (photoPreview && !finalPhotoUrl && !photoPreview.startsWith('blob:')) {
        finalPhotoUrl = photoPreview
      }

      const finalCategory = category === 'Outros' && customCategory.trim()
        ? customCategory.trim()
        : category

      const parsedPrice = priceType === 'fixed' && price.trim() !== ''
        ? parseFloat(price.replace(',', '.'))
        : null

      const parsedPromoPrice = promotionalPrice.trim() !== ''
        ? parseFloat(promotionalPrice.replace(',', '.'))
        : null

      const productPayload: CompanyProduct = {
        id: editingProduct?.id || `prd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        companyId: company.id,
        name: name.trim(),
        category: finalCategory,
        description: description.trim() || undefined,
        priceType,
        price: parsedPrice != null && !isNaN(parsedPrice) ? parsedPrice : null,
        promotionalPrice: parsedPromoPrice != null && !isNaN(parsedPromoPrice) ? parsedPromoPrice : null,
        variations: variations.map((v) => ({
          id: v.id,
          name: v.name.trim(),
          price: typeof v.price === 'number' && !isNaN(v.price) ? v.price : null,
        })),
        isAvailable,
        purchaseUrl: purchaseUrl.trim() || undefined,
        order: Number(order) || 0,
        photoUrl: finalPhotoUrl || undefined,
        isActive,
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const res = await saveCompanyProductOnServerApi(productPayload, Boolean(editingProduct))
      if (!res.success) {
        showToast('error', res.error || 'Erro ao salvar o produto.')
        setIsSaving(false)
        return
      }

      if (company.modules?.products !== true && company.modules?.products !== false) {
        const updatedComp: Company = {
          ...company,
          modules: { ...(company.modules || {}), products: true },
        }
        saveCompanyLocally(updatedComp)
        if (onEnableModule) {
          onEnableModule()
        }
      }

      loadProducts()
      setIsModalOpen(false)
      showToast('success', editingProduct ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!')
    } catch (err) {
      console.error('Error saving product:', err)
      showToast('error', 'Erro inesperado ao salvar o produto.')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete product
  const handleDeleteConfirm = async () => {
    if (!deletingProductId) return
    const success = await deleteCompanyProductOnServerApi(deletingProductId, company.id)
    if (success) {
      loadProducts()
      showToast('success', 'Produto removido com sucesso.')
    } else {
      showToast('error', 'Não foi possível remover o produto.')
    }
    setDeletingProductId(null)
  }

  // Fast toggle product active status
  const handleToggleActive = async (prod: CompanyProduct) => {
    await toggleCompanyProductOnServerApi(prod.id, company.id)
    loadProducts()
  }

  // Filter products
  const categoriesList = Array.from(new Set(products.map((p) => p.category || 'Geral').filter(Boolean)))
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'Todas' || (p.category || 'Geral') === selectedCategory
    const matchSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    return matchCategory && matchSearch
  })

  const isModuleActive = Boolean(company.modules?.products)
  const isExternalMode = company.productCatalog?.mode === 'external'

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950 border-rose-500/40 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Warning banner if module is disabled */}
      {!isModuleActive && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm">O módulo Catálogo de Produtos está desativado</h3>
              <p className="text-[11px] text-amber-700">
                Ative o recurso em Recursos da sua DiretoLink para exibi-lo na sua Página Pública.
              </p>
            </div>
          </div>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer"
            >
              Configurar Recursos
            </button>
          )}
        </div>
      )}

      {/* Info card if external catalog is currently configured */}
      {isModuleActive && isExternalMode && (
        <div className="p-4 sm:p-5 rounded-3xl bg-violet-50 border border-violet-200 text-violet-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm">Modo Ativo: Catálogo Externo</h3>
              <p className="text-[11px] text-violet-700">
                Sua página pública direciona os clientes para:{' '}
                <span className="font-semibold underline">
                  {company.productCatalog?.externalUrl || 'URL não configurada'}
                </span>{' '}
                com o botão &quot;{company.productCatalog?.externalButtonText || 'Ver Catálogo'}&quot;.
              </p>
            </div>
          </div>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer"
            >
              Alterar Modo / Link
            </button>
          )}
        </div>
      )}

      {/* Seletor de Modo de Exibição na Página Pública */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                Modo de Exibição na Página Pública
              </h3>
              <p className="text-[11px] text-neutral-500">
                Escolha individualmente como o Catálogo de Produtos é apresentado aos seus clientes.
              </p>
            </div>
          </div>
          {isSavingDisplayMode && (
            <span className="text-[10px] text-violet-600 font-bold animate-pulse">
              Salvando...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Opção 1: Exibir conteúdo */}
          <div
            onClick={() => handleSaveDisplayMode('full')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              productsDisplayMode === 'full'
                ? 'border-violet-600 bg-violet-50/60 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    productsDisplayMode === 'full'
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                    1. Exibir conteúdo
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Mostra a vitrine de produtos normalmente na Página Pública (busca, categorias e fotos).
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                  productsDisplayMode === 'full'
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-neutral-300 bg-white'
                }`}
              >
                {productsDisplayMode === 'full' && <Check className="w-3 h-3" />}
              </div>
            </div>
          </div>

          {/* Opção 2: Somente card */}
          <div
            onClick={() => handleSaveDisplayMode('card')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              productsDisplayMode === 'card'
                ? 'border-violet-600 bg-violet-50/60 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    productsDisplayMode === 'card'
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                    2. Somente card
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Mostra apenas um card compacto. Ao clicar, abre o Catálogo completo internamente sem sair da DiretoLink.
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                  productsDisplayMode === 'card'
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-neutral-300 bg-white'
                }`}
              >
                {productsDisplayMode === 'card' && <Check className="w-3 h-3" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-violet-600" />
            <span>Catálogo de Produtos</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cadastre os itens da sua vitrine própria na DiretoLink com fotos, preços e integração direta com WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsWhatsAppConfigOpen((prev) => !prev)}
            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border shadow-2xs transition-all cursor-pointer active:scale-95 ${
              isWhatsAppConfigOpen
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20'
                : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200/90 hover:border-emerald-300'
            }`}
            title="Configurar mensagem automática do WhatsApp ao clicar em Tenho interesse"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>Mensagem do WhatsApp</span>
            {whatsappTemplate.trim() ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Mensagem personalizada ativa" />
            ) : null}
          </button>

          {products.length > 1 && (
            <button
              type="button"
              onClick={() => setIsOrganizeModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-neutral-50 active:scale-95 text-neutral-800 font-bold text-xs flex items-center justify-center gap-2 border border-neutral-200/90 shadow-2xs hover:border-violet-300 transition-all cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4 text-violet-600" />
              <span>Organizar ordem</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONFIGURAÇÃO: MENSAGEM DO WHATSAPP PARA PRODUTOS         */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-2xs overflow-hidden transition-all">
        {/* Header do Card (clicável para expandir/recolher) */}
        <div
          onClick={() => setIsWhatsAppConfigOpen((prev) => !prev)}
          className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-neutral-50/70 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 leading-tight">
                  Mensagem do WhatsApp para produtos
                </h3>
                {whatsappTemplate.trim() ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Personalizada
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                    Padrão do Sistema
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                Texto enviado automaticamente quando o cliente clica em &quot;Tenho interesse&quot; em um produto na vitrine pública.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isWhatsAppConfigOpen ? 'Recolher' : 'Configurar'}</span>
              {isWhatsAppConfigOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Conteúdo Expandido da Configuração */}
        {isWhatsAppConfigOpen && (
          <div className="p-4 sm:p-6 border-t border-neutral-100 bg-neutral-50/40 space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Lado Esquerdo: Editor da Mensagem e Variáveis (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <span>Modelo da Mensagem</span>
                      <span className="text-[11px] font-normal text-neutral-500">
                        (clique nas tags abaixo para inserir)
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setWhatsappTemplate(
                          'Olá! Tenho interesse no {produto}, no valor de {preco}. Gostaria de mais informações.'
                        )
                      }
                      className="text-[11px] font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Inserir exemplo</span>
                    </button>
                  </div>

                  {/* Variáveis Disponíveis como Chips Clicáveis */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    <span className="text-[10px] font-bold text-neutral-400 mr-0.5">
                      Variáveis:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable('{produto}')}
                      className="px-2.5 py-1 rounded-lg bg-violet-100/90 hover:bg-violet-200 text-violet-800 text-xs font-mono font-bold transition-all border border-violet-200/90 cursor-pointer active:scale-95 flex items-center gap-1"
                      title="Substitui pelo nome do produto"
                    >
                      <span>{'{produto}'}</span>
                      <span className="text-[10px] opacity-70 font-sans font-normal">= nome</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable('{preco}')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100/90 hover:bg-emerald-200 text-emerald-800 text-xs font-mono font-bold transition-all border border-emerald-200/90 cursor-pointer active:scale-95 flex items-center gap-1"
                      title="Substitui pelo preço do produto ou variação"
                    >
                      <span>{'{preco}'}</span>
                      <span className="text-[10px] opacity-70 font-sans font-normal">= preço</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable('{variacao}')}
                      className="px-2.5 py-1 rounded-lg bg-blue-100/90 hover:bg-blue-200 text-blue-800 text-xs font-mono font-bold transition-all border border-blue-200/90 cursor-pointer active:scale-95 flex items-center gap-1"
                      title="Substitui pelo tamanho ou variação selecionada"
                    >
                      <span>{'{variacao}'}</span>
                      <span className="text-[10px] opacity-70 font-sans font-normal">= variação</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable('{empresa}')}
                      className="px-2.5 py-1 rounded-lg bg-amber-100/90 hover:bg-amber-200 text-amber-800 text-xs font-mono font-bold transition-all border border-amber-200/90 cursor-pointer active:scale-95 flex items-center gap-1"
                      title="Substitui pelo nome da empresa"
                    >
                      <span>{'{empresa}'}</span>
                      <span className="text-[10px] opacity-70 font-sans font-normal">= empresa</span>
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={whatsappTemplate}
                    onChange={(e) => setWhatsappTemplate(e.target.value)}
                    rows={4}
                    placeholder="Olá! Tenho interesse no {produto}, no valor de {preco}. Gostaria de mais informações."
                    className="w-full p-3.5 rounded-2xl bg-white border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs font-sans leading-relaxed resize-y"
                  />

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-1">
                    <span>
                      {whatsappTemplate.trim()
                        ? `${whatsappTemplate.length} caracteres digitados`
                        : 'Vazio: o sistema usará a mensagem padrão'}
                    </span>
                    {whatsappTemplate.trim() && (
                      <button
                        type="button"
                        onClick={() => setWhatsappTemplate('')}
                        className="text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Limpar (voltar ao padrão)
                      </button>
                    )}
                  </div>
                </div>

                {/* Botão de Salvar */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveWhatsAppConfig}
                    disabled={isSavingWhatsAppConfig}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingWhatsAppConfig ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Salvando configuração...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Salvar Mensagem do WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Lado Direito: Prévia Visual Realista do WhatsApp (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-white p-4 sm:p-4.5 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                      <span>Prévia da Mensagem</span>
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md">
                      Exemplo em tempo real
                    </span>
                  </div>

                  {/* Balão de Conversa WhatsApp */}
                  <div className="bg-[#EFEAE2] p-3.5 rounded-2xl border border-neutral-200/80 space-y-2 min-h-[140px] flex flex-col justify-end">
                    {/* Cabeçalho do Chat Simulado */}
                    <div className="flex items-center gap-2 pb-2 border-b border-black/5 text-[11px] text-neutral-600">
                      <div className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[10px] font-black">
                        WA
                      </div>
                      <span className="font-bold truncate text-neutral-800">
                        {company.name || 'Sua Empresa'}
                      </span>
                    </div>

                    {/* Balão Verde Estilo WhatsApp */}
                    <div className="bg-[#DCF8C6] text-[#111B21] rounded-2xl rounded-tr-xs p-3 shadow-xs text-xs leading-relaxed border border-emerald-300/40 self-end max-w-[95%]">
                      <p className="whitespace-pre-wrap break-words">{previewMessage}</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-neutral-500 mt-1 font-mono">
                        <span>12:45</span>
                        <span className="text-emerald-700 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-neutral-400 leading-tight">
                  Ao clicar em &quot;Tenho interesse&quot; na vitrine da Página Pública, o WhatsApp da sua empresa abrirá com essa mensagem pronta.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('Todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'Todas'
                ? 'bg-violet-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
            }`}
          >
            Todas ({products.length})
          </button>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-violet-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200/80 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-neutral-800 text-sm">
            {search || selectedCategory !== 'Todas'
              ? 'Nenhum produto encontrado com os filtros atuais.'
              : 'Nenhum produto cadastrado ainda.'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {search || selectedCategory !== 'Todas'
              ? 'Tente ajustar sua busca ou selecionar outra categoria.'
              : 'Clique no botão abaixo para adicionar o primeiro produto ao seu catálogo.'}
          </p>
          {!search && selectedCategory === 'Todas' && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Produto</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProducts.map((prod) => {
            const hasPromo = prod.promotionalPrice != null && prod.promotionalPrice > 0
            const isConsult = prod.priceType === 'consult' || prod.price == null

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-3xl p-4 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between relative overflow-hidden group ${
                  prod.isActive ? 'border-neutral-200/80' : 'border-neutral-200 opacity-60 bg-neutral-50/50'
                }`}
              >
                <div>
                  {/* Top row: Photo + Badges */}
                  <div className="flex items-start gap-3.5">
                    {/* Photo */}
                    {(() => {
                      const prodPhoto = prod.photoUrl || (prod as unknown as { imageUrl?: string; image?: string; photo?: string }).imageUrl || (prod as unknown as { image?: string }).image || (prod as unknown as { photo?: string }).photo || ''
                      return (
                        <div className="relative w-20 h-20 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 shadow-2xs">
                          {prodPhoto ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={prodPhoto}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                              <Package className="w-6 h-6 opacity-60" />
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Basic details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100">
                          {prod.category || 'Geral'}
                        </span>
                        {prod.isAvailable === false && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                            Esgotado
                          </span>
                        )}
                        {hasPromo && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Promoção
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-neutral-900 mt-1 line-clamp-1 leading-snug">
                        {prod.name}
                      </h4>

                      {/* Price Display */}
                      <div className="mt-1">
                        {isConsult ? (
                          <span className="text-xs font-bold text-violet-700">Sob consulta</span>
                        ) : hasPromo ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-emerald-600 font-mono">
                              R$ {prod.promotionalPrice?.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-xs text-neutral-400 line-through font-mono">
                              R$ {prod.price?.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-black text-neutral-900 font-mono">
                            R$ {prod.price?.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description preview */}
                  {prod.description && (
                    <p className="text-xs text-neutral-500 mt-3 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  )}

                  {/* Purchase link badge if present */}
                  {prod.purchaseUrl && (
                    <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-1 truncate">
                      <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="truncate">{prod.purchaseUrl}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  {/* Status Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(prod)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      prod.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        prod.isActive ? 'bg-emerald-500' : 'bg-neutral-400'
                      }`}
                    />
                    <span>{prod.isActive ? 'Ativo' : 'Pausado'}</span>
                  </button>

                  {/* Edit & Delete Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(prod)}
                      className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                      title="Editar Produto"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProductId(prod.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Excluir Produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Create or Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-200 overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Photo Upload Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-700">
                    Foto do Produto <span className="text-[10px] text-neutral-400 font-normal">(Opcional)</span>
                  </label>
                  <div className="flex bg-neutral-100 p-0.5 rounded-lg text-[10px] font-medium">
                    <button
                      type="button"
                      onClick={() => setPhotoMode('upload')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
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
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        photoMode === 'url'
                          ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Link / URL
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  {/* Photo Preview Thumbnail */}
                  <div className="w-20 h-20 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0 relative shadow-2xs">
                    {photoPreview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-neutral-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {photoMode === 'upload' ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Escolher Arquivo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoFileChange}
                              className="hidden"
                            />
                          </label>
                          {photoPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoFile(null)
                                setPhotoPreview('')
                                setPhotoUrl('')
                              }}
                              className="text-xs text-rose-600 hover:underline cursor-pointer"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Envie uma imagem do produto (JPG, PNG ou WebP, até 5MB).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="url"
                          placeholder="https://exemplo.com/foto-do-produto.jpg"
                          value={photoUrl}
                          onChange={(e) => {
                            const val = e.target.value
                            setPhotoUrl(val)
                            setPhotoPreview(val)
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-neutral-400">
                            Cole o link público direto da foto do produto.
                          </p>
                          {photoPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoFile(null)
                                setPhotoPreview('')
                                setPhotoUrl('')
                              }}
                              className="text-xs text-rose-600 hover:underline cursor-pointer"
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700">
                  Nome do Produto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pomada Modeladora Efeito Matte 150g"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700">Categoria</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {COMMON_PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {category === 'Outros' ? (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Nome da categoria"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  ) : (
                    <div className="text-[11px] text-neutral-400 flex items-center px-2">
                      Organiza os itens na vitrine pública.
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Type and Amounts */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800">Precificação</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="radio"
                        name="priceType"
                        checked={priceType === 'fixed'}
                        onChange={() => setPriceType('fixed')}
                        className="accent-violet-600"
                      />
                      <span>Preço Fixo</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="radio"
                        name="priceType"
                        checked={priceType === 'consult'}
                        onChange={() => setPriceType('consult')}
                        className="accent-violet-600"
                      />
                      <span>Sob consulta</span>
                    </label>
                  </div>
                </div>

                {priceType === 'fixed' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Preço Regular (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0,00"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Preço Promocional (R$, opcional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={promotionalPrice}
                        onChange={(e) => setPromotionalPrice(e.target.value)}
                        placeholder="0,00"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700">Descrição</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes, especificações, tamanho, ingredientes ou diferenciais..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Tamanhos e Variações Opcionais */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <span>Tamanhos e Variações</span>
                      <span className="text-[10px] text-neutral-400 font-normal">(Opcional)</span>
                    </label>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Adicione tamanhos (ex: P, M, G, 38, 40) ou variações disponíveis para o cliente escolher.
                    </p>
                  </div>
                  {variations.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      {variations.length} {variations.length === 1 ? 'variação' : 'variações'}
                    </span>
                  )}
                </div>

                {/* Atalhos Rápidos */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-neutral-400 font-medium">Adicionar atalhos:</span>
                  <button
                    type="button"
                    onClick={() => handleAddPresetVariations(['P', 'M', 'G', 'GG'])}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 cursor-pointer transition-colors"
                  >
                    + P, M, G, GG
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetVariations(['36', '38', '40', '42'])}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 cursor-pointer transition-colors"
                  >
                    + 36, 38, 40, 42
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetVariations(['Tamanho Único'])}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 cursor-pointer transition-colors"
                  >
                    + Tamanho Único
                  </button>
                </div>

                {/* Input de nova variação */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddVariation()
                      }
                    }}
                    placeholder="Nome da variação (ex: G, 42, Preto...)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newVarPrice}
                    onChange={(e) => setNewVarPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddVariation()
                      }
                    }}
                    placeholder="Preço (R$, opcional)"
                    className="w-28 px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddVariation()}
                    className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-colors active:scale-95"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Lista de Variações Cadastradas */}
                {variations.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {variations.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-800 shadow-2xs"
                      >
                        <span>{v.name}</span>
                        {v.price != null && (
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">
                            (R$ {v.price.toFixed(2).replace('.', ',')})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveVariation(v.id)}
                          className="w-3.5 h-3.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-rose-500 flex items-center justify-center cursor-pointer transition-colors"
                          title="Remover variação"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase URL (optional) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700">
                  Link de Compra Direta (Opcional)
                </label>
                <input
                  type="url"
                  value={purchaseUrl}
                  onChange={(e) => setPurchaseUrl(e.target.value)}
                  placeholder="https://sualoja.com.br/produto ou marketplace"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <p className="text-[10px] text-neutral-400">
                  Se informado, adiciona o botão &quot;Comprar&quot; ao detalhe do produto.
                </p>
              </div>

              {/* Display Order & Availability */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700">Ordem de Exibição</label>
                  <input
                    type="number"
                    min="0"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="text-[10px] text-neutral-400">Números menores aparecem primeiro.</p>
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="w-4 h-4 accent-violet-600 rounded"
                    />
                    <span className="text-xs font-semibold text-neutral-800">
                      Disponível para venda
                    </span>
                  </label>
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-violet-600 rounded"
                />
                <span className="text-xs font-semibold text-neutral-800">
                  Exibir produto no catálogo da página pública
                </span>
              </label>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isSaving ? 'Salvando...' : editingProduct ? 'Atualizar Produto' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-neutral-200 p-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900">Excluir Produto</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Tem certeza que deseja remover este produto do seu catálogo? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProductId(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organize Products Order Modal */}
      <OrganizeItemsModal
        isOpen={isOrganizeModalOpen}
        onClose={() => setIsOrganizeModalOpen(false)}
        title="Organizar Ordem dos Produtos"
        subtitle="Defina a sequência em que seus produtos aparecem na vitrine da Página Pública."
        itemTypeLabel="produtos"
        items={products.map((p) => ({
          id: p.id,
          name: p.name,
          photoUrl: p.photoUrl,
          category: p.category,
          subtitle: p.price != null ? `R$ ${p.price.toFixed(2).replace('.', ',')}` : 'Sob consulta',
        }))}
        defaultIcon={<Package className="w-5 h-5 text-violet-600" />}
        accentColorClass="bg-violet-600 hover:bg-violet-700"
        onSave={async (orderedIds, silent) => {
          await saveCompanyProductsOrderOnServer(company.id, orderedIds)
          const updated = getCompanyProducts(company.id)
          setProducts(updated)
          if (!silent) {
            showToast('success', 'Ordem dos produtos salva com sucesso!')
          }
        }}
      />
    </div>
  )
}
