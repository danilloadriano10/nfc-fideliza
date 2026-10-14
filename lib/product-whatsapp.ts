import { CompanyProduct } from '@/types/platform'

export const DEFAULT_PRODUCT_WHATSAPP_TEMPLATE =
  'Olá! Tenho interesse no {produto}, no valor de {preco}. Gostaria de mais informações.'

export const SYSTEM_FALLBACK_PRODUCT_WHATSAPP_MESSAGE = (
  productName: string,
  varText: string,
  companyName: string
) =>
  `Olá! Tenho interesse no produto "${productName}"${varText} da ${companyName}. Gostaria de mais informações!`

/**
 * Formata um valor numérico para Moeda Brasileira BRL (ex: R$ 38,90)
 */
export function formatCurrencyBRL(value?: number | null): string {
  if (value == null) return 'Sob consulta'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Substitui as variáveis {produto}, {preco}, {variacao}, {empresa} na mensagem do WhatsApp.
 * Se nenhuma mensagem personalizada estiver configurada pela empresa, mantém a mensagem padrão atual.
 */
export function buildProductWhatsAppMessage(options: {
  template?: string | null
  product: Pick<CompanyProduct, 'name' | 'price' | 'promotionalPrice' | 'priceType' | 'variations'>
  companyName: string
  selectedVariation?: string | null
}): string {
  const { template, product, companyName, selectedVariation } = options

  // Se a empresa não configurar mensagem personalizada, manter a mensagem padrão atual
  if (!template || !template.trim()) {
    const varText = selectedVariation ? ` (Tamanho/Variação: ${selectedVariation})` : ''
    return SYSTEM_FALLBACK_PRODUCT_WHATSAPP_MESSAGE(product.name, varText, companyName)
  }

  // Preço efetivo: considera valor da variação selecionada, preço promocional ou preço normal
  let effectivePriceNum = product.promotionalPrice ?? product.price
  if (selectedVariation && Array.isArray(product.variations)) {
    const matchVar = product.variations.find((v) => v.name === selectedVariation)
    if (matchVar && matchVar.price != null) {
      effectivePriceNum = matchVar.price
    }
  }

  const isConsult =
    product.priceType === 'consult' || (product.price == null && effectivePriceNum == null)
  const precoStr = isConsult ? 'Sob consulta' : formatCurrencyBRL(effectivePriceNum)
  const produtoStr = product.name || ''
  const variacaoStr = selectedVariation || ''
  const empresaStr = companyName || ''

  let result = template
    .replace(/\{produto\}/gi, produtoStr)
    .replace(/\{preco\}|\{preço\}/gi, precoStr)
    .replace(/\{variacao\}|\{variação\}/gi, variacaoStr)
    .replace(/\{empresa\}/gi, empresaStr)

  // Remove espaços duplos residuais caso variação não esteja preenchida
  result = result.replace(/ {2,}/g, ' ').trim()

  return result
}
