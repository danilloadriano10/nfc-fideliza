import { Company } from '@/types/platform'

export interface PublicSectionDef {
  id: string
  title: string
  shortTitle: string
  description: string
  iconName: 'Sparkles' | 'LayoutGrid' | 'Scissors' | 'UtensilsCrossed' | 'Package' | 'Gift' | 'Star' | 'MapPin' | 'Calendar'
  defaultOrder: number
  categoryTag: string
  accentColor: string
}

export const ALL_PUBLIC_SECTIONS: PublicSectionDef[] = [
  {
    id: 'featured',
    title: 'Destaque Principal',
    shortTitle: 'Destaque',
    description: 'Card hero em destaque no topo para conversão e ação rápida do cliente',
    iconName: 'Sparkles',
    defaultOrder: 1,
    categoryTag: 'Destaque',
    accentColor: '#8B5CF6',
  },
  {
    id: 'quick_access',
    title: 'Acessos Rápidos',
    shortTitle: 'Atalhos',
    description: 'Grade de botões diretos (WhatsApp, Wi-Fi, Redes Sociais, etc.)',
    iconName: 'LayoutGrid',
    defaultOrder: 2,
    categoryTag: 'Atalhos',
    accentColor: '#3B82F6',
  },
  {
    id: 'services',
    title: 'Serviços',
    shortTitle: 'Serviços',
    description: 'Vitrine visual de serviços com fotos grandes, valores e agendamento',
    iconName: 'Scissors',
    defaultOrder: 3,
    categoryTag: 'Serviços',
    accentColor: '#EC4899',
  },
  {
    id: 'menu',
    title: 'Cardápio',
    shortTitle: 'Cardápio',
    description: 'Cardápio digital interativo com categorias, fotos e pedidos',
    iconName: 'UtensilsCrossed',
    defaultOrder: 4,
    categoryTag: 'Cardápio',
    accentColor: '#10B981',
  },
  {
    id: 'products',
    title: 'Produtos',
    shortTitle: 'Produtos',
    description: 'Vitrine de produtos comerciais com preços, fotos e promoções',
    iconName: 'Package',
    defaultOrder: 5,
    categoryTag: 'Produtos',
    accentColor: '#F59E0B',
  },
  {
    id: 'loyalty',
    title: 'Fidelidade',
    shortTitle: 'Fidelidade',
    description: 'Cartão fidelidade com saldo de pontos, carimbos e prêmios',
    iconName: 'Gift',
    defaultOrder: 6,
    categoryTag: 'Fidelidade',
    accentColor: '#F97316',
  },
  {
    id: 'reviews',
    title: 'Avaliações',
    shortTitle: 'Avaliações',
    description: 'Avaliação no Google com nota por estrelas e link direto de feedback',
    iconName: 'Star',
    defaultOrder: 7,
    categoryTag: 'Google Reviews',
    accentColor: '#EAB308',
  },
  {
    id: 'location',
    title: 'Localização e Contato',
    shortTitle: 'Localização',
    description: 'Endereço físico do estabelecimento e botão de Como Chegar',
    iconName: 'MapPin',
    defaultOrder: 8,
    categoryTag: 'Localização',
    accentColor: '#EF4444',
  },
]

/**
 * Checks whether a given section is currently active for the specified company.
 * Only active sections will be displayed in the organizer and rendered on the public page.
 */
export function isSectionActiveForCompany(sectionId: string, company: Company): boolean {
  if (!company) return false

  switch (sectionId) {
    case 'featured':
      // Active unless company explicitly disables highlight
      return company.highlightModule !== 'none'

    case 'quick_access':
      // Always active as primary hub shortcuts
      return true

    case 'services':
      return company.modules?.services !== false

    case 'menu':
      return company.modules?.menu !== false

    case 'products':
      return company.modules?.products !== false

    case 'loyalty':
      return company.modules?.loyalty !== false

    case 'reviews':
      return company.modules?.googleReview !== false

    case 'location':
      return company.modules?.location !== false || Boolean(company.addressText)

    default:
      // Automatic support for future modules:
      // If a future module exists in company.modules, check its boolean flag
      const modKey = sectionId as keyof typeof company.modules
      if (company.modules && modKey in company.modules) {
        return company.modules[modKey] !== false
      }
      return true
  }
}

/**
 * Returns the list of active sections for a company, strictly following
 * company.publicSectionsOrder if saved in Firestore.
 * - Filters to only active modules.
 * - Any new/future active modules not in the saved order are automatically appended.
 */
export function getActivePublicSections(company: Company): PublicSectionDef[] {
  if (!company) return []

  // 1. Get all currently active sections
  const activeSections = ALL_PUBLIC_SECTIONS.filter((sec) =>
    isSectionActiveForCompany(sec.id, company)
  )

  const savedOrder = Array.isArray(company.publicSectionsOrder)
    ? company.publicSectionsOrder
    : null

  if (!savedOrder || savedOrder.length === 0) {
    // Default initial order
    return [...activeSections].sort((a, b) => a.defaultOrder - b.defaultOrder)
  }

  // 2. Sort by saved order in Firestore
  const ordered: PublicSectionDef[] = []
  const remaining = new Map(activeSections.map((s) => [s.id, s]))

  // Add items in saved order if they are currently active
  for (const id of savedOrder) {
    const sec = remaining.get(id)
    if (sec) {
      ordered.push(sec)
      remaining.delete(id)
    }
  }

  // Append any newly added active modules (e.g. future modules or newly enabled modules)
  // sorted by their default order so they integrate automatically
  const unplaced = Array.from(remaining.values()).sort((a, b) => a.defaultOrder - b.defaultOrder)
  ordered.push(...unplaced)

  return ordered
}

/**
 * Returns the ordered array of active section IDs for the public page.
 */
export function getEffectiveSectionsOrder(company: Company): string[] {
  return getActivePublicSections(company).map((s) => s.id)
}
