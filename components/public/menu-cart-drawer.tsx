'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  X,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  MessageCircle,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  FileText,
  Upload,
  AlertCircle,
  Banknote,
  CreditCard,
  QrCode,
  ShieldCheck,
} from 'lucide-react'
import { Company, TableOrderHistoryEvent } from '@/types/platform'
import { CartItem } from './menu-item-modal'
import { DeliveryOptionsForm } from './delivery-options-form'
import {
  OrderDeliveryInfo,
  buildMenuOrderWhatsAppMessage,
  formatMoneyBRL,
  getDefaultCompanyPaymentConfig,
  loadSavedDeliveryInfo,
  openOrderInWhatsApp,
  saveDeliveryInfo,
} from '@/lib/order-delivery'
import { saveCompanyTableOrderOnServerApi } from '@/lib/storage'

interface MenuCartDrawerProps {
  isOpen: boolean
  cart: CartItem[]
  company: Company
  isDark: boolean
  initialStep?: 'items' | 'delivery'
  initialCustomerName?: string
  initialCustomerPhone?: string
  autoDetectedTable?: string | null
  onClose: () => void
  onUpdateQuantity: (cartItemId: string, newQty: number) => void
  onRemoveItem: (cartItemId: string) => void
  onClearCart: () => void
}

function createHistoryEventId(suffix: string): string {
  return `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${suffix}`
}

export const MenuCartDrawer: React.FC<MenuCartDrawerProps> = ({
  isOpen,
  cart,
  company,
  isDark,
  initialStep = 'items',
  initialCustomerName,
  initialCustomerPhone,
  autoDetectedTable,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [step, setStep] = useState<'items' | 'delivery' | 'payment'>(initialStep)
  const [deliveryInfo, setDeliveryInfo] = useState<OrderDeliveryInfo>(() => {
    const saved = loadSavedDeliveryInfo(company.id)
    return {
      deliveryType: autoDetectedTable ? 'dine_in' : (saved.deliveryType || 'delivery'),
      customerName: initialCustomerName || saved.customerName || '',
      customerPhone: initialCustomerPhone || saved.customerPhone || '',
      tableNumber: autoDetectedTable || saved.tableNumber || '',
      address: saved.address || '',
      number: saved.number || '',
      neighborhood: saved.neighborhood || '',
      complement: saved.complement || '',
      reference: saved.reference || '',
      locationCoordinates: null,
      locationUrl: null,
    }
  })

  // Synchronize detected table from QR
  useEffect(() => {
    if (autoDetectedTable) {
      setDeliveryInfo((prev) => ({
        ...prev,
        deliveryType: 'dine_in',
        tableNumber: autoDetectedTable,
      }))
    }
  }, [autoDetectedTable])

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Configurações de pagamento da empresa
  const paymentConfig = useMemo(() => getDefaultCompanyPaymentConfig(company), [company])

  // Métodos habilitados pelo estabelecimento
  const availablePaymentMethods = useMemo(() => {
    const methods: Array<{
      id: 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'vale_refeicao'
      name: string
      icon: React.ComponentType<{ className?: string }>
      subtitle: (deliveryType: string) => string
    }> = []

    if (paymentConfig.acceptPix) {
      methods.push({
        id: 'pix',
        name: 'Pix',
        icon: QrCode,
        subtitle: () => 'Pague agora e envie o comprovante',
      })
    }

    if (paymentConfig.acceptCash) {
      methods.push({
        id: 'dinheiro',
        name: 'Dinheiro',
        icon: Banknote,
        subtitle: (dt) =>
          dt === 'delivery'
            ? 'Pagamento na entrega'
            : dt === 'pickup'
            ? 'Pagamento na retirada'
            : 'Pagamento no local',
      })
    }

    if (paymentConfig.acceptDebitCard) {
      methods.push({
        id: 'cartao_debito',
        name: 'Cartão de Débito',
        icon: CreditCard,
        subtitle: (dt) =>
          dt === 'delivery'
            ? 'Pagamento na entrega'
            : dt === 'pickup'
            ? 'Pagamento na retirada'
            : 'Pagamento no local',
      })
    }

    if (paymentConfig.acceptCreditCard) {
      methods.push({
        id: 'cartao_credito',
        name: 'Cartão de Crédito',
        icon: CreditCard,
        subtitle: (dt) =>
          dt === 'delivery'
            ? 'Pagamento na entrega'
            : dt === 'pickup'
            ? 'Pagamento na retirada'
            : 'Pagamento no local',
      })
    }

    if (paymentConfig.acceptMealVoucher) {
      methods.push({
        id: 'vale_refeicao',
        name: 'Vale-Refeição',
        icon: CreditCard,
        subtitle: (dt) =>
          dt === 'delivery'
            ? 'Pagamento na entrega'
            : dt === 'pickup'
            ? 'Pagamento na retirada'
            : 'Pagamento no local',
      })
    }

    // Se nenhuma estiver explicitamente ativa, ativa as padrões para não bloquear o cliente
    if (methods.length === 0) {
      return [
        {
          id: 'pix' as const,
          name: 'Pix',
          icon: QrCode,
          subtitle: () => 'Pague agora e envie o comprovante',
        },
        {
          id: 'dinheiro' as const,
          name: 'Dinheiro',
          icon: Banknote,
          subtitle: (dt: string) =>
            dt === 'delivery'
              ? 'Pagamento na entrega'
              : dt === 'pickup'
              ? 'Pagamento na retirada'
              : 'Pagamento no local',
        },
        {
          id: 'cartao_debito' as const,
          name: 'Cartão de Débito',
          icon: CreditCard,
          subtitle: (dt: string) =>
            dt === 'delivery'
              ? 'Pagamento na entrega'
              : dt === 'pickup'
              ? 'Pagamento na retirada'
              : 'Pagamento no local',
        },
        {
          id: 'cartao_credito' as const,
          name: 'Cartão de Crédito',
          icon: CreditCard,
          subtitle: (dt: string) =>
            dt === 'delivery'
              ? 'Pagamento na entrega'
              : dt === 'pickup'
              ? 'Pagamento na retirada'
              : 'Pagamento no local',
        },
      ]
    }

    return methods
  }, [paymentConfig])

  // Estado da forma de pagamento selecionada
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'vale_refeicao'
  >('pix')

  // Ao carregar ou alterar os métodos, garante que o selecionado seja válido
  useEffect(() => {
    if (availablePaymentMethods.length > 0) {
      const exists = availablePaymentMethods.some((m) => m.id === selectedPaymentMethod)
      if (!exists) {
        setSelectedPaymentMethod(availablePaymentMethods[0].id)
      }
    }
  }, [availablePaymentMethods, selectedPaymentMethod])

  // Estado do troco para dinheiro
  const [needsChange, setNeedsChange] = useState<boolean>(false)
  const [changeForInput, setChangeForInput] = useState<string>('')
  const [changeError, setChangeError] = useState<string | null>(null)

  // Estado do Pix e Comprovante
  const [copiedPixKey, setCopiedPixKey] = useState(false)
  const [receiptFile, setReceiptFile] = useState<{
    dataUrl: string
    name: string
    size: number
    type: 'image' | 'pdf'
  } | null>(null)
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset or update step when opening
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep)
      setFormErrors({})
      setReceiptFile(null)
      setReceiptUploadError(null)
      setNeedsChange(false)
      setChangeForInput('')
      setChangeError(null)

      setDeliveryInfo((prev) => {
        const saved = loadSavedDeliveryInfo(company.id)
        return {
          ...prev,
          customerName: prev.customerName || initialCustomerName || saved.customerName || '',
          customerPhone: prev.customerPhone || initialCustomerPhone || saved.customerPhone || '',
          address: prev.address || saved.address || '',
          number: prev.number || saved.number || '',
          neighborhood: prev.neighborhood || saved.neighborhood || '',
          complement: prev.complement || saved.complement || '',
          reference: prev.reference || saved.reference || '',
        }
      })
    }
  }, [isOpen, initialStep, initialCustomerName, initialCustomerPhone, company.id])

  const totalOrder = cart.reduce((acc, item) => acc + item.totalPrice, 0)
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  // Troco numérico calculado
  const parsedChangeFor = parseFloat(changeForInput.replace(/\./g, '').replace(',', '.')) || 0

  const handleCopyPixKey = async () => {
    if (!paymentConfig.pixKey) return
    try {
      await navigator.clipboard.writeText(paymentConfig.pixKey)
      setCopiedPixKey(true)
      setTimeout(() => setCopiedPixKey(false), 2500)
    } catch {
      // Fallback
      setCopiedPixKey(true)
      setTimeout(() => setCopiedPixKey(false), 2500)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setReceiptUploadError(null)

    // Validar tipo: imagem ou PDF
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    if (!isImage && !isPdf) {
      setReceiptUploadError('Formato inválido. Por favor, envie uma foto (JPG, PNG) ou arquivo PDF.')
      return
    }

    // Limite de 5MB
    if (file.size > 5 * 1024 * 1024) {
      setReceiptUploadError('O arquivo é muito grande. O limite máximo é de 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setReceiptFile({
        dataUrl: result,
        name: file.name,
        size: file.size,
        type: isPdf ? 'pdf' : 'image',
      })
    }
    reader.onerror = () => {
      setReceiptUploadError('Erro ao carregar arquivo. Tente novamente.')
    }
    reader.readAsDataURL(file)
  }

  const validateDeliveryForm = useCallback((): boolean => {
    const errs: Record<string, string> = {}

    if (!deliveryInfo.customerName || !deliveryInfo.customerName.trim()) {
      errs.customerName = 'Por favor, informe seu nome completo.'
    }

    if (!deliveryInfo.customerPhone || !deliveryInfo.customerPhone.trim()) {
      errs.customerPhone = 'Por favor, informe seu telefone com DDD.'
    } else {
      const digits = deliveryInfo.customerPhone.replace(/\D/g, '')
      if (digits.length < 10) {
        errs.customerPhone = 'Telefone incompleto (informe DDD + número).'
      }
    }

    if (deliveryInfo.deliveryType === 'delivery') {
      if (!deliveryInfo.address || !deliveryInfo.address.trim()) {
        errs.address = 'Informe a rua ou avenida de entrega.'
      }
      if (!deliveryInfo.number || !deliveryInfo.number.trim()) {
        errs.number = 'Informe o número ou S/N.'
      }
      if (!deliveryInfo.neighborhood || !deliveryInfo.neighborhood.trim()) {
        errs.neighborhood = 'Informe o bairro.'
      }
    }

    if (deliveryInfo.deliveryType === 'dine_in') {
      const activeTable = deliveryInfo.tableNumber || autoDetectedTable
      if (!activeTable || !activeTable.trim()) {
        errs.tableNumber = 'Por favor, informe o número da sua mesa.'
      }
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }, [deliveryInfo, autoDetectedTable])

  const handleAdvanceToPayment = () => {
    if (!validateDeliveryForm()) return
    saveDeliveryInfo(deliveryInfo, company.id)
    setStep('payment')
  }

  // Finalizar e Enviar para o WhatsApp
  const handleFinalizeWhatsAppOrder = useCallback(() => {
    if (cart.length === 0) return
    if (!validateDeliveryForm()) {
      setStep('delivery')
      return
    }

    // Validação de troco para dinheiro
    if (selectedPaymentMethod === 'dinheiro' && needsChange) {
      if (!changeForInput.trim()) {
        setChangeError('Informe o valor para o qual precisa de troco.')
        return
      }
      if (parsedChangeFor < totalOrder) {
        setChangeError(
          `O valor do troco (${formatMoneyBRL(parsedChangeFor)}) deve ser maior ou igual ao total do pedido (${formatMoneyBRL(totalOrder)}).`
        )
        return
      }
    }
    setChangeError(null)

    // Persist delivery info for customer convenience
    saveDeliveryInfo(deliveryInfo, company.id)

    const orderItems = cart.map((c) => ({
      id: c.id,
      menuItemId: c.menuItem.id,
      name: c.menuItem.name,
      quantity: c.quantity,
      unitPrice: c.totalPrice / (c.quantity || 1),
      totalPrice: c.totalPrice,
      sizeName: c.options.size?.name,
      flavors: c.options.flavors,
      extras: c.options.extras?.map((e) => e.name),
      removals: c.options.removals,
      notes: c.options.notes,
      customSteps: c.options.customSteps?.map((cs) => ({
        stepTitle: cs.stepTitle,
        options: cs.selected.map((s) => s.name),
      })),
    }))

    const orderType =
      deliveryInfo.deliveryType === 'delivery'
        ? 'entrega'
        : deliveryInfo.deliveryType === 'pickup'
        ? 'retirada'
        : 'mesa'

    const activeTable =
      orderType === 'mesa'
        ? deliveryInfo.tableNumber || autoDetectedTable || 'Mesa do Salão'
        : orderType === 'retirada'
        ? 'Retirada no Balcão'
        : 'Entrega Delivery'

    const formattedAddress =
      orderType === 'entrega'
        ? `${deliveryInfo.address || ''}, ${deliveryInfo.number || 'S/N'}${
            deliveryInfo.complement ? ` (${deliveryInfo.complement})` : ''
          } - ${deliveryInfo.neighborhood || ''}${
            deliveryInfo.city ? `, ${deliveryInfo.city}` : ''
          }${deliveryInfo.reference ? ` [Ref: ${deliveryInfo.reference}]` : ''}`
        : undefined

    // Determina o status financeiro inicial
    let paymentStatus: 'pending' | 'awaiting_confirmation' | 'paid' | 'not_found' | 'payment_on_delivery' =
      'payment_on_delivery'

    if (selectedPaymentMethod === 'pix') {
      paymentStatus = receiptFile ? 'awaiting_confirmation' : 'pending'
    }

    const paymentMethodLabel =
      selectedPaymentMethod === 'pix'
        ? 'Pix'
        : selectedPaymentMethod === 'dinheiro'
        ? 'Dinheiro'
        : selectedPaymentMethod === 'cartao_debito'
        ? 'Cartão de Débito'
        : selectedPaymentMethod === 'cartao_credito'
        ? 'Cartão de Crédito'
        : 'Vale-Refeição'

    const nowIso = new Date().toISOString()
    const historyEvents: TableOrderHistoryEvent[] = [
      {
        id: createHistoryEventId('created'),
        timestamp: nowIso,
        action: 'pedido criado',
        description: `Pedido criado pelo cardápio digital (${
          orderType === 'mesa' ? 'Consumo Local' : orderType === 'retirada' ? 'Retirada' : 'Entrega'
        })`,
        performedBy: deliveryInfo.customerName || 'Cliente',
      },
      {
        id: createHistoryEventId('paymethod'),
        timestamp: nowIso,
        action: `forma de pagamento: ${paymentMethodLabel}`,
        description:
          selectedPaymentMethod === 'dinheiro' && needsChange && parsedChangeFor > 0
            ? `Forma de pagamento selecionada: Dinheiro com troco para ${formatMoneyBRL(parsedChangeFor)}`
            : `Forma de pagamento selecionada: ${paymentMethodLabel}`,
        performedBy: deliveryInfo.customerName || 'Cliente',
      },
    ]

    if (selectedPaymentMethod === 'pix') {
      if (receiptFile) {
        historyEvents.push({
          id: createHistoryEventId('receipt'),
          timestamp: nowIso,
          action: 'comprovante anexado',
          description: `Comprovante de pagamento Pix anexado pelo cliente (${receiptFile.name})`,
          performedBy: deliveryInfo.customerName || 'Cliente',
        })
      } else {
        historyEvents.push({
          id: createHistoryEventId('noreceipt'),
          timestamp: nowIso,
          action: 'pix sem comprovante',
          description: 'Pix selecionado - comprovante não anexado no checkout',
          performedBy: deliveryInfo.customerName || 'Cliente',
        })
      }
    }

    const isAutoAccept = company.autoAcceptOrders === true
    const initialOrderStatus: 'novo' | 'preparo' = isAutoAccept ? 'preparo' : 'novo'

    if (isAutoAccept) {
      historyEvents.push({
        id: createHistoryEventId('auto_accept'),
        timestamp: nowIso,
        action: 'pedido aceito automaticamente',
        description: 'Pedido aceito automaticamente',
        performedBy: 'Sistema',
      })
    }

    // Salvar pedido completo na Central de Pedidos da empresa
    saveCompanyTableOrderOnServerApi({
      id: '',
      companyId: company.id,
      orderType,
      origin: orderType,
      tableNumber: activeTable,
      deliveryAddress: formattedAddress,
      address: deliveryInfo.address,
      addressNumber: deliveryInfo.number,
      neighborhood: deliveryInfo.neighborhood,
      complement: deliveryInfo.complement,
      referencePoint: deliveryInfo.reference,
      customerName: deliveryInfo.customerName,
      customerPhone: deliveryInfo.customerPhone,
      items: orderItems,
      totalAmount: totalOrder,
      notes: deliveryInfo.notes,
      paymentMethod: selectedPaymentMethod,
      paymentStatus,
      paymentChangeFor:
        selectedPaymentMethod === 'dinheiro' && needsChange && parsedChangeFor > 0
          ? parsedChangeFor
          : undefined,
      receiptUrl: receiptFile?.dataUrl,
      receiptName: receiptFile?.name,
      receiptType: receiptFile?.type,
      receiptUploadedAt: receiptFile ? nowIso : undefined,
      history: historyEvents,
      status: initialOrderStatus,
      createdAt: nowIso,
    }).catch((err) => console.error('Erro ao registrar pedido na Central de Pedidos:', err))

    // Montar mensagem detalhada do WhatsApp
    const message = buildMenuOrderWhatsAppMessage({
      companyName: company.name,
      cart,
      totalOrder,
      deliveryInfo: {
        ...deliveryInfo,
        tableNumber: deliveryInfo.tableNumber || autoDetectedTable || '',
        paymentMethod: selectedPaymentMethod,
        needsChange,
        paymentChangeFor:
          selectedPaymentMethod === 'dinheiro' && needsChange && parsedChangeFor > 0
            ? parsedChangeFor
            : null,
        receiptUrl: receiptFile?.dataUrl,
        receiptName: receiptFile?.name,
        receiptType: receiptFile?.type,
      },
    })

    openOrderInWhatsApp(company.whatsapp, message)
    onClose()
  }, [
    cart,
    company,
    deliveryInfo,
    selectedPaymentMethod,
    needsChange,
    changeForInput,
    parsedChangeFor,
    totalOrder,
    autoDetectedTable,
    receiptFile,
    validateDeliveryForm,
    onClose,
  ])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md h-full flex flex-col shadow-2xl border-l transition-all animate-in slide-in-from-right duration-200 ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-neutral-800 bg-neutral-950/40' : 'border-neutral-100 bg-neutral-50/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {step === 'delivery' ? (
              <button
                type="button"
                onClick={() => setStep('items')}
                className="p-1.5 rounded-xl hover:bg-neutral-800/60 text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                title="Voltar aos itens"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-semibold">Itens</span>
              </button>
            ) : step === 'payment' ? (
              <button
                type="button"
                onClick={() => setStep('delivery')}
                className="p-1.5 rounded-xl hover:bg-neutral-800/60 text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                title="Voltar para opções de entrega"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-semibold">Entrega</span>
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold">
                {step === 'payment'
                  ? 'Como você deseja pagar?'
                  : step === 'delivery'
                  ? 'Opções de Entrega'
                  : 'Seu Pedido'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {step === 'payment'
                  ? `Etapa 3 de 3 • ${formatMoneyBRL(totalOrder)}`
                  : step === 'delivery'
                  ? `Etapa 2 de 3 • ${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'itens'}`
                  : `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'itens'} adicionados`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'items' && cart.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-[11px] text-neutral-400 hover:text-red-400 transition-all px-2 py-1 cursor-pointer"
                title="Limpar sacola"
              >
                Limpar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* PASSO 1: ITENS DO CARRINHO */}
          {step === 'items' ? (
            cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-3 text-neutral-500">
                  <UtensilsCrossed className="w-8 h-8 opacity-40" />
                </div>
                <h4 className="text-sm font-bold text-neutral-300">Sua sacola está vazia</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                  Adicione pratos deliciosos e bebidas do cardápio para fazer o seu pedido.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isDark
                        ? 'bg-neutral-800/40 border-neutral-700/60'
                        : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold leading-snug">
                          {item.menuItem.name}
                        </h4>
                        <span className="text-xs font-semibold text-teal-500 block mt-0.5">
                          {formatMoneyBRL(item.totalPrice)}
                        </span>
                      </div>

                      {/* Quantity Controller & Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          className={`flex items-center rounded-xl border ${
                            isDark
                              ? 'border-neutral-700 bg-neutral-800'
                              : 'border-neutral-200 bg-white'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-neutral-400 hover:text-white transition-all cursor-pointer"
                            aria-label="Diminuir"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-neutral-400 hover:text-white transition-all cursor-pointer"
                            aria-label="Aumentar"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 text-neutral-400 hover:text-red-400 transition-all cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Detalhes / Customizações do item */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-700/40 space-y-1 text-[11px] text-neutral-400">
                      {item.options.size && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-neutral-300">Tamanho:</span>
                          <span>
                            {item.options.size.name}
                            {item.options.size.price > 0 &&
                              ` (${formatMoneyBRL(item.options.size.price)})`}
                          </span>
                        </div>
                      )}

                      {item.options.flavors && item.options.flavors.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-neutral-300">Sabores:</span>
                          <span>{item.options.flavors.join(', ')}</span>
                        </div>
                      )}

                      {item.options.customSteps &&
                        item.options.customSteps.map((st, i) => (
                          <div key={i} className="flex flex-col gap-0.5">
                            <span className="font-semibold text-teal-400">
                              {st.stepTitle}:
                            </span>
                            <span className="pl-2">
                              {st.selected
                                .map(
                                  (o) =>
                                    `${o.name}${o.price > 0 ? ` (+${formatMoneyBRL(o.price)})` : ''}`
                                )
                                .join(', ')}
                            </span>
                          </div>
                        ))}

                      {item.options.extras && item.options.extras.length > 0 && (
                        <div className="flex items-start gap-1">
                          <span className="font-semibold text-neutral-300">Adicionais:</span>
                          <span>
                            {item.options.extras
                              .map((e) => `${e.name} (+${formatMoneyBRL(e.price)})`)
                              .join(', ')}
                          </span>
                        </div>
                      )}

                      {item.options.removals && item.options.removals.length > 0 && (
                        <div className="flex items-start gap-1 text-red-400">
                          <span className="font-semibold">Sem:</span>
                          <span>{item.options.removals.join(', ')}</span>
                        </div>
                      )}

                      {item.options.notes && (
                        <div className="pt-0.5 italic text-neutral-400">
                          &quot;{item.options.notes}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : step === 'delivery' ? (
            /* PASSO 2: FORMULÁRIO DE ENTREGA / RETIRADA */
            <div className="space-y-4">
              <div
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                  isDark ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    Resumo do Pedido
                  </span>
                  <span className="font-semibold">
                    {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'} no carrinho
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    Total
                  </span>
                  <span className="text-base font-black text-teal-500 font-mono">
                    {formatMoneyBRL(totalOrder)}
                  </span>
                </div>
              </div>

              <DeliveryOptionsForm
                info={deliveryInfo}
                onChange={setDeliveryInfo}
                isDark={isDark}
                errors={formErrors}
                autoDetectedTable={autoDetectedTable}
              />
            </div>
          ) : (
            /* PASSO 3: CHECKOUT DE FORMAS DE PAGAMENTO */
            <div className="space-y-5">
              {/* Resumo do tipo e total */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isDark
                    ? 'bg-neutral-800/40 border-neutral-700/60'
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-600 block tracking-wider">
                    {deliveryInfo.deliveryType === 'delivery'
                      ? 'Entrega Delivery'
                      : deliveryInfo.deliveryType === 'pickup'
                      ? 'Retirada no Balcão'
                      : `Mesa ${deliveryInfo.tableNumber || ''}`}
                  </span>
                  <span className="text-xs font-semibold text-neutral-400">
                    Cliente: {deliveryInfo.customerName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    Total a Pagar
                  </span>
                  <span className="text-lg font-black text-teal-500 font-mono">
                    {formatMoneyBRL(totalOrder)}
                  </span>
                </div>
              </div>

              {/* SELEÇÃO DAS FORMAS DE PAGAMENTO */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                  Escolha como deseja pagar:
                </label>

                <div className="grid grid-cols-1 gap-2">
                  {availablePaymentMethods.map((method) => {
                    const isSelected = selectedPaymentMethod === method.id
                    const IconComponent = method.icon

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setSelectedPaymentMethod(method.id)
                          setChangeError(null)
                        }}
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                          isSelected
                            ? isDark
                              ? 'bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/30'
                              : 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20'
                            : isDark
                            ? 'bg-neutral-800/30 border-neutral-700 hover:border-neutral-600'
                            : 'bg-white border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-xs'
                              : isDark
                              ? 'bg-neutral-800 text-neutral-400'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold block">{method.name}</span>
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-teal-500 bg-teal-500 text-white'
                                  : 'border-neutral-400'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {method.subtitle(deliveryInfo.deliveryType)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* DETALHES ESPECÍFICOS DE PAGAMENTO */}

              {/* 1. DINHEIRO & TROCO */}
              {selectedPaymentMethod === 'dinheiro' && (
                <div
                  className={`p-4 rounded-2xl border space-y-3 animate-in fade-in ${
                    isDark
                      ? 'bg-neutral-800/40 border-neutral-700'
                      : 'bg-neutral-50/90 border-neutral-200'
                  }`}
                >
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                    Precisa de troco?
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNeedsChange(false)
                        setChangeError(null)
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        !needsChange
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : isDark
                          ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                          : 'bg-white border-neutral-300 text-neutral-700'
                      }`}
                    >
                      Não preciso
                    </button>

                    <button
                      type="button"
                      onClick={() => setNeedsChange(true)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        needsChange
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : isDark
                          ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                          : 'bg-white border-neutral-300 text-neutral-700'
                      }`}
                    >
                      Sim, preciso
                    </button>
                  </div>

                  {needsChange && (
                    <div className="pt-2 border-t border-neutral-700/30 space-y-2 animate-in fade-in">
                      <label className="text-xs font-bold text-neutral-300 block">
                        Troco para quanto? (R$)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-400">
                          R$
                        </span>
                        <input
                          type="text"
                          value={changeForInput}
                          onChange={(e) => {
                            setChangeForInput(e.target.value)
                            setChangeError(null)
                          }}
                          placeholder={`Ex: ${(Math.ceil(totalOrder / 10) * 10).toFixed(2).replace('.', ',')}`}
                          className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border font-mono font-bold focus:outline-hidden ${
                            isDark
                              ? 'bg-neutral-800 border-neutral-700 text-white focus:border-teal-500'
                              : 'bg-white border-neutral-300 text-neutral-900 focus:border-teal-500'
                          }`}
                        />
                      </div>

                      {/* Feedback do troco calculado */}
                      {parsedChangeFor > 0 && (
                        <div>
                          {parsedChangeFor >= totalOrder ? (
                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between">
                              <span>Troco a devolver:</span>
                              <strong className="text-emerald-400 font-mono font-bold">
                                {formatMoneyBRL(parsedChangeFor - totalOrder)}
                              </strong>
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>
                                O valor deve ser maior ou igual ao total ({formatMoneyBRL(totalOrder)}).
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {changeError && (
                        <p className="text-xs text-rose-500 font-medium">{changeError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. CARTÕES NA ENTREGA / RETIRADA */}
              {(selectedPaymentMethod === 'cartao_credito' ||
                selectedPaymentMethod === 'cartao_debito' ||
                selectedPaymentMethod === 'vale_refeicao') && (
                <div
                  className={`p-4 rounded-2xl border space-y-2 text-xs leading-relaxed animate-in fade-in ${
                    isDark
                      ? 'bg-neutral-800/40 border-neutral-700 text-neutral-300'
                      : 'bg-blue-50/70 border-blue-200 text-blue-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-teal-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pagamento Seguro no Recebimento</span>
                  </div>
                  <p>
                    O pagamento será processado diretamente na maquininha pelo entregador ou no
                    balcão no momento da retirada.
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    🔒 Não solicitamos nem armazenamos senhas ou números de cartão online.
                  </p>
                </div>
              )}

              {/* 3. PIX ANTECIPADO & COMPROVANTE */}
              {selectedPaymentMethod === 'pix' && (
                <div
                  className={`p-4 rounded-2xl border space-y-4 animate-in fade-in ${
                    isDark
                      ? 'bg-neutral-800/40 border-neutral-700'
                      : 'bg-teal-50/50 border-teal-200/80'
                  }`}
                >
                  {paymentConfig.pixShowUpfront && paymentConfig.pixKey ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 flex items-center gap-1.5">
                          <QrCode className="w-4 h-4" />
                          <span>Pagar com Chave Pix</span>
                        </span>
                        <span className="text-[11px] font-mono font-bold text-neutral-400">
                          {paymentConfig.pixKeyType === 'cpf_cnpj'
                            ? 'CPF / CNPJ'
                            : paymentConfig.pixKeyType === 'phone'
                            ? 'Telefone'
                            : paymentConfig.pixKeyType === 'email'
                            ? 'E-mail'
                            : 'Chave Aleatória'}
                        </span>
                      </div>

                      {/* Favorecido & Chave */}
                      <div
                        className={`p-3 rounded-xl border space-y-1.5 ${
                          isDark
                            ? 'bg-neutral-900/60 border-neutral-700'
                            : 'bg-white border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400">Favorecido:</span>
                          <span className="font-bold text-neutral-200">
                            {paymentConfig.pixReceiverName || company.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400">Valor Total:</span>
                          <span className="font-bold text-teal-500 font-mono">
                            {formatMoneyBRL(totalOrder)}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-neutral-700/30 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                              Chave Pix:
                            </span>
                            <span className="text-xs font-mono font-bold truncate block select-all">
                              {paymentConfig.pixKey}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyPixKey}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-xs ${
                              copiedPixKey
                                ? 'bg-emerald-600 text-white'
                                : 'bg-teal-600 hover:bg-teal-500 text-white'
                            }`}
                          >
                            {copiedPixKey ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Copiada!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Chave</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Copie a chave acima, faça o Pix no seu banco e anexe o comprovante abaixo
                        para agilizar a liberação do seu pedido.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400">
                      O estabelecimento confirmará os dados do Pix após o envio do pedido no
                      WhatsApp.
                    </p>
                  )}

                  {/* Uploader de Comprovante */}
                  <div className="pt-3 border-t border-neutral-700/30 space-y-2">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block flex items-center justify-between">
                      <span>Anexar Comprovante (Opcional)</span>
                      <span className="text-[10px] text-neutral-400 font-normal lowercase">
                        JPG, PNG ou PDF
                      </span>
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {receiptFile ? (
                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                          isDark
                            ? 'bg-neutral-900/60 border-neutral-700'
                            : 'bg-white border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {receiptFile.type === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={receiptFile.dataUrl}
                              alt="Comprovante"
                              className="w-10 h-10 rounded-lg object-cover border border-neutral-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <span className="text-xs font-bold truncate block">
                              {receiptFile.name}
                            </span>
                            <span className="text-[10px] text-emerald-500 font-semibold block">
                              ✓ Arquivo pronto para envio
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="p-1.5 text-neutral-400 hover:text-rose-500 rounded-lg hover:bg-neutral-800 transition-colors"
                          title="Remover comprovante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full py-3 px-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold ${
                          isDark
                            ? 'border-neutral-700 hover:border-teal-500 text-neutral-400 hover:text-white bg-neutral-900/20'
                            : 'border-neutral-300 hover:border-teal-500 text-neutral-600 hover:text-teal-700 bg-white'
                        }`}
                      >
                        <Upload className="w-4 h-4 text-teal-500" />
                        <span>Clique para selecionar foto ou PDF do comprovante</span>
                      </button>
                    )}

                    {receiptUploadError && (
                      <p className="text-xs text-rose-500 font-medium">{receiptUploadError}</p>
                    )}

                    <p className="text-[10px] text-neutral-400 leading-tight">
                      * O envio do comprovante não marca o pedido como pago automaticamente. A loja
                      fará a conferência e confirmação.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div
            className={`p-4 border-t space-y-3 shrink-0 ${
              isDark ? 'border-neutral-800 bg-neutral-950/70' : 'border-neutral-100 bg-neutral-50'
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-neutral-400 font-semibold">
                Total do Pedido:
              </span>
              <span className="text-xl font-black text-teal-500 font-mono">
                {formatMoneyBRL(totalOrder)}
              </span>
            </div>

            {step === 'items' ? (
              <button
                type="button"
                onClick={() => setStep('delivery')}
                className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Avançar para Opções de Entrega</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            ) : step === 'delivery' ? (
              <button
                type="button"
                onClick={handleAdvanceToPayment}
                className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Avançar para Forma de Pagamento</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalizeWhatsAppOrder}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4.5 h-4.5 fill-white shrink-0" />
                <span>Confirmar e Pedir no WhatsApp</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            )}

            <p className="text-[10px] text-center text-neutral-400">
              {step === 'items'
                ? 'Você escolherá entrega, retirada ou mesa no próximo passo.'
                : step === 'delivery'
                ? 'Em seguida, você escolherá como deseja realizar o pagamento.'
                : 'O pedido detalhado será enviado diretamente para o WhatsApp do estabelecimento.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
