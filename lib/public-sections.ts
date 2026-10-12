import { Company } from '@/types/platform'

export interface PublicSectionDef {
  id: string
  title: string
  shortTitle: string
  description: string
  iconName: 'Sparkles' | 'LayoutGrid' | 'Scissors' | 'UtensilsCrossed' | 'Package' | 'Gift' | 'Star' | 'MapPin' | 'Calendar' | 'MessageCircle' | 'Wifi' | 'MessageSquare' | 'Instagram'
  defaultOrder: number
  categoryTag: string
  accentColor: string
}

export const ALL_PUBLIC_SECTIONS: PublicSectionDef[] = [
  {
    id: 'whatsapp',
    title: 'WhatsApp Oficial',
    shortTitle: 'WhatsApp',
    description: 'Atendimento direto e suporte rápido via WhatsApp',
    iconName: 'MessageCircle',
    defaultOrder: 1,
    categoryTag: 'Contato',
    accentColor: '#10B981',
  },
  {
    id: 'services',
    title: 'Serviços',
    shortTitle: 'Serviços',
    description: 'Vitrine visual de serviços com fotos grandes, valores e agendamento',
    iconName: 'Scissors',
    defaultOrder: 2,
    categoryTag: 'Serviços',
    accentColor: '#EC4899',
  },
  {
    id: 'products',
    title: 'Produtos',
    shortTitle: 'Produtos',
    description: 'Vitrine de produtos comerciais com preços, fotos e promoções',
    iconName: 'Package',
    defaultOrder: 3,
    categoryTag: 'Produtos',
    accentColor: '#F59E0B',
  },
  {
    id: 'appointments',
    title: 'Agendamento Online',
    shortTitle: 'Agendamento',
    description: 'Reserva de horários online para atendimento',
    iconName: 'Calendar',
    defaultOrder: 4,
    categoryTag: 'Agendamento',
    accentColor: '#6366F1',
  },
  {
    id: 'menu',
    title: 'Cardápio',
    shortTitle: 'Cardápio',
    description: 'Cardápio digital interativo com categorias, fotos e pedidos',
    iconName: 'UtensilsCrossed',
    defaultOrder: 5,
    categoryTag: 'Cardápio',
    accentColor: '#10B981',
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
    title: 'Avaliações do Google',
    shortTitle: 'Avaliações',
    description: 'Avaliação no Google com nota por estrelas e link direto de feedback',
    iconName: 'Star',
    defaultOrder: 7,
    categoryTag: 'Avaliações do Google',
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
  {
    id: 'wifi',
    title: 'Wi-Fi Grátis',
    shortTitle: 'Wi-Fi',
    description: 'Acesso à rede Wi-Fi e conexão rápida',
    iconName: 'Wifi',
    defaultOrder: 9,
    categoryTag: 'Conexão',
    accentColor: '#06B6D4',
  },
  {
    id: 'feedback',
    title: 'Feedback Privado',
    shortTitle: 'Feedback',
    description: 'Canal de elogios, sugestões e críticas à gerência',
    iconName: 'MessageSquare',
    defaultOrder: 10,
    categoryTag: 'Feedback',
    accentColor: '#A855F7',
  },
  {
    id: 'instagram',
    title: 'Instagram',
    shortTitle: 'Instagram',
    description: 'Perfil oficial nas redes sociais',
    iconName: 'Instagram',
    defaultOrder: 11,
    categoryTag: 'Redes Sociais',
    accentColor: '#EC4899',
  },
]

/**
 * Checks whether a given section is currently active for the specified company.
 * Only active sections will be displayed in the organizer and rendered on the public page.
 */
export function isSectionActiveForCompany(sectionId: string, company: Company): boolean {
  if (!company) return false

  switch (sectionId) {
    case 'whatsapp':
      return company.modules?.whatsapp !== false

    case 'services':
      return company.modules?.services !== false

    case 'products':
      return company.modules?.products !== false

    case 'appointments':
      return company.modules?.appointments !== false

    case 'menu':
      return company.modules?.menu !== false

    case 'loyalty':
      return company.modules?.loyalty !== false

    case 'reviews':
    case 'googleReview':
      return company.modules?.googleReview !== false

    case 'location':
    case 'contact':
      return company.modules?.location !== false || Boolean(company.addressText) || Boolean(company.locationUrl)

    case 'wifi':
      return company.modules?.wifi !== false

    case 'feedback':
      return company.modules?.feedback !== false

    case 'instagram':
      return company.modules?.instagram !== false || Boolean(company.instagram)

    default:
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
