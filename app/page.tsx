'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Radio,
  Store,
  Sparkles,
  ArrowRight,
  Check,
  Minus,
  Utensils,
  Scissors,
  ShoppingBag,
  Building2,
  Calendar,
  Star,
  Gift,
  Link2,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Layers,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'
import { RegisterCompanyModal } from '@/components/auth/register-company-modal'
import { CompanyPlan } from '@/types/platform'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [registerPlan, setRegisterPlan] = useState<CompanyPlan>('pro')

  const scrollToPlans = () => {
    const el = document.getElementById('planos')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const comparisonItems = [
    { name: 'Página pública profissional', links: true, pro: true },
    { name: 'Links externos ilimitados', links: true, pro: true },
    { name: 'Personalização de cores e capa', links: true, pro: true },
    { name: 'QR Code e NFC oficial', links: true, pro: true },
    { name: 'Cardápio interno DiretoLink', links: false, pro: true },
    { name: 'Pedidos pela DiretoLink (Mesa, Retirada, Delivery)', links: false, pro: true },
    { name: 'Central de Pedidos em tempo real', links: false, pro: true },
    { name: 'Agendamento online interno', links: false, pro: true },
    { name: 'Cadastro e gestão de serviços', links: false, pro: true },
    { name: 'Catálogo e vitrine interna de produtos', links: false, pro: true },
    { name: 'Cartão Fidelidade e pontuação digital', links: false, pro: true },
    { name: 'Feedback Privado à gerência', links: false, pro: true },
  ]

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-violet-100 selection:text-violet-900 font-sans w-full max-w-full overflow-x-hidden">
      {/* 1. Header Limpo e Moderno */}
      <header className="border-b border-neutral-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 w-full max-w-full">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-2 px-4 sm:px-8 py-3.5 sm:py-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink-0 min-w-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Radio className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold tracking-tight text-neutral-900 leading-tight">
                DiretoLink
              </span>
              <span className="text-[11px] text-neutral-500 font-medium tracking-normal hidden sm:block">
                Uma conexão. Tudo mais perto.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation & Actions */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <button
              type="button"
              onClick={scrollToPlans}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              Conhecer os planos
            </button>

            <div className="h-4 w-px bg-neutral-200" />

            <Link
              href="/painel"
              className="px-4 py-2 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:text-neutral-900 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-neutral-500" />
              <span>Entrar no Painel</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Criar minha empresa</span>
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <Link
              href="/painel"
              className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-800 hover:bg-neutral-200 font-semibold text-xs border border-neutral-200/80 transition-colors flex items-center gap-1"
            >
              <Store className="w-3 h-3 text-neutral-600" />
              <span>Entrar</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-8 h-8 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-neutral-900" /> : <Menu className="w-4 h-4 text-neutral-800" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-2.5 shadow-lg w-full max-w-full">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                setIsRegisterModalOpen(true)
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-left transition-all cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-violet-950 block">Criar minha empresa</span>
                <span className="text-[11px] text-violet-700 block truncate">
                  Comece em poucos minutos
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-violet-400 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                scrollToPlans()
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 text-left transition-all cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-neutral-900 block">Conhecer os Planos</span>
                <span className="text-[11px] text-neutral-500 block truncate">
                  Links ou Pro para sua empresa
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </button>

            <Link
              href="/painel"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-neutral-900 block">Entrar no Painel</span>
                <span className="text-[11px] text-neutral-500 block truncate">
                  Acessar conta já cadastrada
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </Link>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[11px] text-neutral-400 hover:text-neutral-700 flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                <span>Administrador Master</span>
              </Link>
              <span className="text-[10px] text-neutral-400">Uma conexão. Tudo mais perto.</span>
            </div>
          </div>
        )}
      </header>

      {/* ==================================================
          1. HERO
          ================================================== */}
      <section className="relative pt-16 pb-16 sm:pt-24 sm:pb-24 px-4 sm:px-8 bg-white border-b border-neutral-100 w-full max-w-full">
        <div className="w-full max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* TÍTULO */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-neutral-900 tracking-tight leading-[1.08] text-balance">
            Seu negócio inteiro em um só link.
          </h1>

          {/* DESCRIÇÃO */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto font-normal leading-relaxed text-balance">
            Reúna tudo o que seu cliente precisa em uma página profissional — ou use as ferramentas completas da DiretoLink para receber pedidos, organizar agendamentos e gerenciar seu negócio.
          </p>

          {/* BOTÕES */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-md sm:max-w-none mx-auto">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Criar minha empresa</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={scrollToPlans}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-sm border border-neutral-200 hover:border-neutral-300 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Conhecer os planos</span>
            </button>
          </div>

          {/* FRASE CURTA */}
          <div className="pt-2">
            <p className="text-xs sm:text-sm font-medium text-neutral-500 tracking-wide">
              Uma conexão. Tudo mais perto.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          2. EXPLICAR AS DUAS FORMAS DE USAR
          ================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-neutral-50/50 border-b border-neutral-200/60 w-full max-w-full">
        <div className="w-full max-w-5xl mx-auto space-y-12">
          {/* Cabeçalho da Seção */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-violet-700 uppercase tracking-widest block">
              Flexibilidade total
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight text-balance">
              ESCOLHA COMO QUER USAR A DIRETOLINK
            </h2>
            <div className="space-y-1 pt-1 text-sm sm:text-base text-neutral-600 leading-relaxed">
              <p>
                <strong>Já usa outras plataformas?</strong> Centralize seus links em uma página profissional.
              </p>
              <p>
                <strong>Quer fazer tudo pela DiretoLink?</strong> Use nossas ferramentas integradas para atender e gerenciar seus clientes.
              </p>
            </div>
          </div>

          {/* Dois caminhos visuais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Caminho 1: DiretoLink Links */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-neutral-200/90 shadow-xs flex flex-col justify-between space-y-6 text-left hover:border-neutral-300 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold">
                  <Link2 className="w-6 h-6 text-neutral-700" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                    Caminho 1
                  </span>
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tight mt-0.5">
                    DIRETOLINK LINKS
                  </h3>
                </div>
                <p className="text-base font-semibold text-neutral-800">
                  Sua página. Seus links. Tudo organizado.
                </p>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Perfeito para quem já usa sistemas externos como iFood, Trinks, Calendly, Anota AI ou WhatsApp e quer reuni-los em uma vitrine limpa, ágil e compatível com QR Code e placas NFC.
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500">
                  Ideal para centralizar ferramentas existentes
                </span>
                <button
                  type="button"
                  onClick={scrollToPlans}
                  className="text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver detalhes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Caminho 2: DiretoLink Pro */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border-2 border-violet-600 shadow-sm flex flex-col justify-between space-y-6 text-left relative overflow-hidden">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Radio className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-violet-700 uppercase tracking-wider block">
                    Caminho 2
                  </span>
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tight mt-0.5">
                    DIRETOLINK PRO
                  </h3>
                </div>
                <p className="text-base font-semibold text-violet-950">
                  Sua página + ferramentas completas para o seu negócio.
                </p>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Tudo do plano Links mais um ecossistema completo: cardápio próprio, central de pedidos na mesa e delivery, agendamento de serviços, controle de fidelidade e gestão em tempo real.
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-700">
                  Ecossistema operacional completo
                </span>
                <button
                  type="button"
                  onClick={scrollToPlans}
                  className="text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver detalhes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          3. PLANOS
          ================================================== */}
      <section id="planos" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-neutral-200/60 w-full max-w-full scroll-mt-16">
        <div className="w-full max-w-5xl mx-auto space-y-12">
          {/* Header da Seção de Planos */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-violet-700 uppercase tracking-widest block">
              Planos Transparentes
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
              Escolha o plano ideal para a sua empresa
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              Comece organizando seus links ou gerencie toda a operação do seu negócio em uma única plataforma.
            </p>
          </div>

          {/* Cards dos Planos lado a lado no desktop e empilhados no mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* ---------------------------------------------
                CARD PLANO LINKS
                --------------------------------------------- */}
            <div className="p-8 sm:p-10 rounded-3xl bg-neutral-50/70 border border-neutral-200 flex flex-col justify-between space-y-8 text-left transition-all hover:bg-neutral-50">
              <div className="space-y-6">
                {/* Cabeçalho do Card */}
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                    DiretoLink Links
                  </h3>
                  <div className="flex items-baseline gap-2 pt-1 pb-1">
                    <span className="text-3xl sm:text-4xl font-black text-neutral-900 font-mono tracking-tight">
                      R$ 29,99
                    </span>
                    <span className="text-xs sm:text-sm text-neutral-500 font-medium">/ mês</span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-neutral-700">
                    Tudo que sua empresa já usa, reunido em um só lugar.
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed pt-1">
                    Crie uma página profissional para sua empresa e conecte seus clientes às plataformas que você já utiliza.
                  </p>
                </div>

                <div className="h-px bg-neutral-200" />

                {/* Lista de Recursos */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                    O que está incluso:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-neutral-700">
                    {[
                      'Página pública profissional',
                      'Link exclusivo da empresa',
                      'Capa personalizada',
                      'Temas e cores da marca',
                      'Organização dos cards',
                      'QR Code oficial gerado',
                      'Compatível com chip NFC',
                      'Links externos ilimitados',
                      'Cardápio externo (iFood, etc)',
                      'Agendamento externo',
                      'Delivery externo',
                      'Loja virtual / E-commerce',
                      'Catálogo externo em PDF/Link',
                      'WhatsApp direto',
                      'Instagram oficial',
                      'Facebook',
                      'TikTok',
                      'Canal do YouTube',
                      'Avaliações no Google 5★',
                      'Localização e Waze/Maps',
                      'Site próprio da empresa',
                      'Links personalizados',
                    ].map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Box de Esclarecimento */}
                <div className="p-4 rounded-2xl bg-white border border-neutral-200 text-xs text-neutral-600 leading-relaxed">
                  <strong className="text-neutral-900 block mb-0.5">Sem trocar de sistema:</strong>
                  Você continua usando seus sistemas atuais. A DiretoLink reúne tudo em uma única página para seus clientes.
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterPlan('links')
                    setIsRegisterModalOpen(true)
                  }}
                  className="w-full py-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Começar com Links</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            {/* ---------------------------------------------
                CARD PLANO PRO
                --------------------------------------------- */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border-2 border-violet-600 shadow-xl flex flex-col justify-between space-y-8 text-left relative overflow-hidden">
              {/* Destaque visual MAIS COMPLETO */}
              <div className="absolute top-0 right-0 bg-violet-600 text-white text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl shadow-xs">
                MAIS COMPLETO
              </div>

              <div className="space-y-6 pt-2">
                {/* Cabeçalho do Card */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                      DiretoLink Pro
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-2 pt-1 pb-1">
                    <span className="text-3xl sm:text-4xl font-black text-violet-600 font-mono tracking-tight">
                      R$ 69,99
                    </span>
                    <span className="text-xs sm:text-sm text-neutral-500 font-medium">/ mês</span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-violet-950">
                    Muito mais que uma página. Uma ferramenta para o seu negócio.
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed pt-1">
                    Além de reunir seus canais em um único lugar, utilize as ferramentas internas da DiretoLink para atender, vender e organizar sua operação.
                  </p>
                </div>

                <div className="h-px bg-neutral-200" />

                {/* Lista de Recursos PRO */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-violet-950 uppercase tracking-wider block">
                    Tudo do Plano Links, mais ferramentas internas:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-neutral-800">
                    {[
                      'Tudo do Plano Links incluso',
                      'Cardápio Digital DiretoLink',
                      'Pedidos online direto no sistema',
                      'Central de Pedidos em tempo real',
                      'Pedidos para mesa com QR Code',
                      'Retirada no balcão',
                      'Delivery próprio com taxa',
                      'Gestão de mesas do salão',
                      'Agendamento online nativo',
                      'Gestão de horários e equipe',
                      'Cadastro completo de serviços',
                      'Catálogo e vitrine de produtos',
                      'Cartão Fidelidade integrado',
                      'Feedback Privado à gerência',
                      'Personalização visual completa',
                      'Links externos gerenciáveis',
                      'Recursos operacionais do Pro',
                    ].map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                        <span className="font-medium leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Box de Destaque PRO */}
                <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200/80 text-xs text-violet-950 leading-relaxed">
                  <strong className="text-violet-950 block mb-0.5">Operação unificada:</strong>
                  Centralize pedidos, agendamentos, clientes e fidelidade direto no seu painel sem mensalidades adicionais por módulos.
                </div>
              </div>

              {/* Botão de Ação PRO */}
              <div className="pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterPlan('pro')
                    setIsRegisterModalOpen(true)
                  }}
                  className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Quero o DiretoLink Pro</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          4. COMPARAÇÃO SIMPLES
          ================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-neutral-50/60 border-b border-neutral-200/60 w-full max-w-full">
        <div className="w-full max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-bold text-violet-700 uppercase tracking-widest block">
              Comparativo direto
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight text-balance">
              Qual plano combina com sua empresa?
            </h2>
            <p className="text-sm text-neutral-600">
              Veja lado a lado a diferença entre a centralizadora de links e a plataforma operacional.
            </p>
          </div>

          {/* Tabela Limpa e Leve (Totalmente responsiva no mobile) */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
            {/* Header das Colunas */}
            <div className="grid grid-cols-12 items-center p-4 sm:p-5 bg-neutral-100/70 border-b border-neutral-200 text-xs font-bold">
              <div className="col-span-6 sm:col-span-6 text-neutral-600 uppercase tracking-wider">
                Recursos
              </div>
              <div className="col-span-3 sm:col-span-3 text-center text-neutral-800 uppercase tracking-wider">
                LINKS
              </div>
              <div className="col-span-3 sm:col-span-3 text-center text-violet-700 uppercase tracking-wider">
                PRO
              </div>
            </div>

            {/* Linhas de Comparação */}
            <div className="divide-y divide-neutral-100 text-xs sm:text-sm">
              {comparisonItems.map((item) => (
                <div
                  key={item.name}
                  className="grid grid-cols-12 items-center p-3.5 sm:p-4.5 hover:bg-neutral-50/80 transition-colors"
                >
                  <div className="col-span-6 sm:col-span-6 text-neutral-800 font-medium pr-2">
                    {item.name}
                  </div>
                  <div className="col-span-3 sm:col-span-3 flex items-center justify-center">
                    {item.links ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <span className="text-neutral-300 font-bold text-base">—</span>
                    )}
                  </div>
                  <div className="col-span-3 sm:col-span-3 flex items-center justify-center">
                    {item.pro ? (
                      <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    ) : (
                      <span className="text-neutral-300 font-bold text-base">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé do Comparativo com CTAs Rápidos */}
            <div className="grid grid-cols-12 items-center p-4 sm:p-5 bg-neutral-50/80 border-t border-neutral-200 gap-2">
              <div className="col-span-6 sm:col-span-6 text-xs text-neutral-500 font-medium">
                Escolha o plano certo hoje e faça upgrade a qualquer momento.
              </div>
              <div className="col-span-3 sm:col-span-3 text-center">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full py-2 px-2 rounded-lg bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-800 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Links
                </button>
              </div>
              <div className="col-span-3 sm:col-span-3 text-center">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full py-2 px-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          5. EXEMPLOS
          ================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-neutral-200/60 w-full max-w-full">
        <div className="w-full max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-violet-700 uppercase tracking-widest block">
              Versatilidade
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight text-balance">
              UMA DIRETOLINK PARA CADA NEGÓCIO
            </h2>
            <p className="text-sm text-neutral-600">
              Personalize a página para o seu segmento e ofereça exatamente o que seu público procura.
            </p>
          </div>

          {/* 4 Blocos Sem Imagens Genéricas de IA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Restaurantes */}
            <div className="p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200/90 hover:border-violet-300 transition-all space-y-3 flex flex-col justify-between text-left">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg border border-red-100">
                  <Utensils className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-neutral-900 text-base">Restaurantes</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Cardápio, pedidos, mesas, retirada e delivery.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-200/60 text-[11px] font-semibold text-neutral-500">
                Pizzarias, cafés e bares
              </div>
            </div>

            {/* 2. Barbearias e Salões */}
            <div className="p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200/90 hover:border-violet-300 transition-all space-y-3 flex flex-col justify-between text-left">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-100">
                  <Scissors className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-neutral-900 text-base">Barbearias e Salões</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Serviços, agendamentos, WhatsApp e fidelidade.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-200/60 text-[11px] font-semibold text-neutral-500">
                Estética, manicure e beleza
              </div>
            </div>

            {/* 3. Lojas */}
            <div className="p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200/90 hover:border-violet-300 transition-all space-y-3 flex flex-col justify-between text-left">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg border border-emerald-100">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-neutral-900 text-base">Lojas</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Produtos, catálogo, WhatsApp e links de compra.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-200/60 text-[11px] font-semibold text-neutral-500">
                Boutiques, roupas e varejo
              </div>
            </div>

            {/* 4. Outras empresas */}
            <div className="p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200/90 hover:border-violet-300 transition-all space-y-3 flex flex-col justify-between text-left">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg border border-blue-100">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-neutral-900 text-base">Outras empresas</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Links, serviços, localização, avaliações e contato.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-200/60 text-[11px] font-semibold text-neutral-500">
                Clínicas, consultórios e serviços
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          6. EXPLICAÇÃO DA DIFERENÇA
          ================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-neutral-50/50 border-b border-neutral-200/60 w-full max-w-full">
        <div className="w-full max-w-3xl mx-auto text-center space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-bold text-violet-700 uppercase tracking-widest block">
              Em resumo
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              LINKS OU PRO?
            </h2>
          </div>

          {/* Dois Boxes Diretos e Claros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-900" />
                <h3 className="font-black text-lg text-neutral-900">DiretoLink Links:</h3>
              </div>
              <p className="text-base sm:text-lg font-medium text-neutral-700 leading-relaxed italic">
                “Eu já tenho meus sistemas. Quero apenas organizar tudo em um único link.”
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border-2 border-violet-600 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-600" />
                <h3 className="font-black text-lg text-violet-950">DiretoLink Pro:</h3>
              </div>
              <p className="text-base sm:text-lg font-medium text-neutral-900 leading-relaxed italic">
                “Quero usar a própria DiretoLink para organizar e atender meus clientes.”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          7. CTA FINAL
          ================================================== */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 bg-white w-full max-w-full">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight text-balance leading-tight">
            Sua empresa merece mais do que vários links espalhados.
          </h2>

          <p className="text-base sm:text-lg text-neutral-600 max-w-xl mx-auto leading-relaxed">
            Coloque tudo em um só lugar e escolha a DiretoLink que combina com o momento do seu negócio.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 w-full max-w-md sm:max-w-none mx-auto">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Criar minha empresa</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={scrollToPlans}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-sm border border-neutral-200 hover:border-neutral-300 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Conhecer o Pro</span>
            </button>
          </div>

          <div className="pt-8">
            <div className="inline-flex flex-col items-center gap-1 text-center">
              <span className="text-sm font-bold text-neutral-900">DiretoLink</span>
              <span className="text-xs text-neutral-500 font-medium">Uma conexão. Tudo mais perto.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Discreto */}
      <footer className="border-t border-neutral-200/80 py-6 sm:py-8 px-4 sm:px-8 text-xs text-neutral-500 bg-white w-full max-w-full">
        <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center text-white text-[10px] shrink-0">
              <Radio className="w-3 h-3" />
            </div>
            <span className="font-bold text-neutral-800">DiretoLink</span>
            <span className="text-neutral-400">· Uma conexão. Tudo mais perto.</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="hover:text-neutral-900 transition-colors font-medium cursor-pointer"
            >
              Criar minha empresa
            </button>
            <Link href="/painel" className="hover:text-neutral-900 transition-colors font-medium">
              Entrar no Painel
            </Link>
            <Link
              href="/admin/login"
              className="text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-1"
              title="Acesso Administrativo Master"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administração</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Autocadastro Modal */}
      <RegisterCompanyModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        initialPlan={registerPlan}
      />
    </div>
  )
}
