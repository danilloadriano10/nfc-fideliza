'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Smartphone,
  ShieldCheck,
  Store,
  ArrowRight,
  Gift,
  Star,
  Wifi,
  Sparkles,
  Award,
  CheckCircle2,
  Radio,
  Menu,
  X,
  ChevronRight,
  QrCode,
  Globe,
  Share2,
  MessageCircle,
  Calendar,
  ShoppingBag,
  Utensils,
  MapPin,
  MessageSquare,
  Users,
  Printer,
  Compass,
  Layers,
} from 'lucide-react'
import { RegisterCompanyModal } from '@/components/auth/register-company-modal'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)

  const benefits = [
    {
      icon: Users,
      title: 'Facilitar o contato com clientes',
      desc: 'Botão direto para WhatsApp, Instagram e chamadas em um toque, sem atrito.',
      badge: 'Contato',
    },
    {
      icon: Star,
      title: 'Aumentar avaliações no Google',
      desc: 'Direcione clientes satisfeitos direto para a página de 5 estrelas do seu perfil no Google.',
      badge: 'Reputação',
    },
    {
      icon: Gift,
      title: 'Fidelizar clientes',
      desc: 'Cartão fidelidade digital com pontuação ágil e recompensas que incentivam o retorno.',
      badge: 'Retenção',
    },
    {
      icon: Compass,
      title: 'Divulgar serviços',
      desc: 'Apresente os principais procedimentos e serviços da sua empresa de forma clara e visual.',
      badge: 'Serviços',
    },
    {
      icon: ShoppingBag,
      title: 'Apresentar produtos',
      desc: 'Destaque lançamentos, itens mais vendidos e promoções exclusivas da sua marca.',
      badge: 'Vendas',
    },
    {
      icon: Calendar,
      title: 'Facilitar agendamentos',
      desc: 'Canal rápido para clientes solicitarem atendimento, agendarem horários e confirmarem visitas.',
      badge: 'Agilidade',
    },
    {
      icon: MapPin,
      title: 'Centralizar WhatsApp, Instagram e localização',
      desc: 'Reúna todas as redes sociais e a rota no Google Maps em um único endereço inteligente.',
      badge: 'Canais',
    },
    {
      icon: MessageSquare,
      title: 'Receber feedbacks',
      desc: 'Caixa de sugestões e opiniões privadas para ouvir seu cliente e melhorar constantemente.',
      badge: 'Melhoria',
    },
    {
      icon: Utensils,
      title: 'Facilitar acesso ao cardápio',
      desc: 'Cardápio digital sempre atualizado, acessível em segundos pelo smartphone do cliente.',
      badge: 'Cardápio',
    },
    {
      icon: Wifi,
      title: 'Conectar clientes ao Wi-Fi',
      desc: 'Conexão instantânea para quem frequenta seu espaço, sem precisar soletrar senhas difíceis.',
      badge: 'Conveniência',
    },
  ]

  const channels = [
    {
      icon: Globe,
      name: 'Link na Bio',
      context: 'Instagram, TikTok e Redes',
      detail: 'O endereço oficial do seu negócio na internet, pronto para converter seguidores em clientes.',
    },
    {
      icon: MessageCircle,
      name: 'WhatsApp',
      context: 'Mensagens e Atendimento',
      detail: 'Envie nas conversas, respostas rápidas ou no status para centralizar todas as opções.',
    },
    {
      icon: QrCode,
      name: 'QR Code',
      context: 'Mesas, Balcões e Displays',
      detail: 'Escaneamento instantâneo com a câmera de qualquer smartphone, sem instalar nada.',
    },
    {
      icon: Radio,
      name: 'NFC',
      context: 'Placas por Aproximação',
      detail: 'O cliente apenas encosta o smartphone na placa inteligente e a mágica acontece na hora.',
    },
    {
      icon: Printer,
      name: 'Materiais Impressos',
      context: 'Panfletos, Cartões e Banners',
      detail: 'Aplique o QR Code ou URL curta em embalagens, folhetos e cartões de visita.',
    },
    {
      icon: Share2,
      name: 'Campanhas',
      context: 'Anúncios e Divulgações',
      detail: 'Direcione tráfego pago, parcerias e promoções para uma página focada em conversão.',
    },
  ]

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-violet-100 selection:text-violet-900 font-sans w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <header className="border-b border-neutral-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 w-full max-w-full overflow-x-hidden">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-2 px-3.5 sm:px-8 py-3.5 sm:py-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 leading-tight truncate">
                DiretoLink
              </span>
              <span className="hidden sm:block text-[10px] text-neutral-500 font-medium tracking-wide">
                Um link. Várias possibilidades.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/painel"
              className="px-3.5 py-2 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:text-neutral-900 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5"
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

          {/* Mobile Navigation Controls */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            <Link
              href="/painel"
              className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-800 hover:bg-neutral-200 font-semibold text-[11px] border border-neutral-200/80 transition-colors flex items-center gap-1"
            >
              <Store className="w-3 h-3 text-neutral-600" />
              <span>Entrar</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-8 h-8 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs cursor-pointer"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-neutral-900" />
              ) : (
                <Menu className="w-4 h-4 text-neutral-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white px-3.5 py-4 space-y-3 shadow-lg w-full max-w-full overflow-x-hidden animate-fade-in">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
              <span>Navegação DiretoLink</span>
              <span className="text-violet-600 font-bold">Plataforma Digital</span>
            </div>

            <div className="space-y-2">
              {/* Primary action: Criar minha empresa */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setIsRegisterModalOpen(true)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-left active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-violet-950 block truncate">
                      Criar minha empresa
                    </span>
                    <span className="text-[9px] font-bold uppercase bg-violet-600 text-white px-1.5 py-0.2 rounded-md">
                      Grátis
                    </span>
                  </div>
                  <span className="text-[11px] text-violet-700 block truncate">
                    Crie o link oficial da sua empresa em 1 minuto
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-violet-400 shrink-0" />
              </button>

              {/* Secondary action: Entrar */}
              <Link
                href="/painel"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 active:scale-[0.99] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-neutral-900 block truncate">
                    Entrar no Painel
                  </span>
                  <span className="text-[11px] text-neutral-500 block truncate">
                    Acesso exclusivo para estabelecimentos cadastrados
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </Link>
            </div>

            {/* Discreto: Administrador Master */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[11px] text-neutral-400 hover:text-neutral-700 flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                <span>Administrador Master</span>
              </Link>
              <span className="text-[10px] text-neutral-400">
                Um link. Várias possibilidades.
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-14 sm:pt-16 sm:pb-20 px-3.5 sm:px-8 overflow-hidden bg-neutral-50/60 border-b border-neutral-200/60 w-full max-w-full">
        <div className="w-full max-w-4xl mx-auto text-center space-y-5 sm:space-y-6">
          {/* Slogan Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-violet-200/80 text-[11px] sm:text-xs text-violet-900 shadow-xs max-w-full leading-snug">
            <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse shrink-0" />
            <span className="font-semibold tracking-wide">Um link. Várias possibilidades.</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight leading-[1.18] break-words text-balance px-1">
            Tudo do seu negócio em um só lugar.
          </h1>

          {/* Hero Description */}
          <p className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl mx-auto font-normal leading-relaxed break-words px-1">
            Crie uma experiência digital completa para seus clientes. Reúna serviços, produtos, agendamentos, avaliações, fidelidade, WhatsApp e muito mais em um único link.
          </p>

          {/* Complement */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-violet-700">
            <span>Compartilhe por link, QR Code ou NFC.</span>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3.5 pt-2 w-full max-w-md sm:max-w-none mx-auto">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Criar minha empresa</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <Link
              href="/painel"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-xs border border-neutral-200 shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4 text-violet-600 shrink-0" />
              <span>Entrar no Painel</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SEÇÃO: COMO DIVULGAR (O mesmo DiretoLink compartilhado onde você quiser) */}
      <section className="py-12 sm:py-16 px-3.5 sm:px-8 max-w-6xl mx-auto w-full max-w-full space-y-10 sm:space-y-12 overflow-x-hidden border-b border-neutral-200/60">
        <div className="text-center space-y-2.5 px-1 max-w-2xl mx-auto">
          <span className="text-[10px] sm:text-[11px] font-bold text-violet-600 uppercase tracking-widest block">
            Alcance Total
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight break-words">
            O mesmo link, divulgado onde você quiser
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
            Seus clientes chegam por canais digitais ou no balcão físico. A DiretoLink conecta todas essas portas de entrada a uma página inteligente e sem fricção.
          </p>
        </div>

        {/* Visual Flow Logic */}
        <div className="bg-neutral-50/80 border border-neutral-200/90 rounded-3xl p-4 sm:p-6 shadow-xs">
          <div className="text-center pb-4 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Como funciona na prática:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center sm:text-left">
            <div className="p-3.5 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-violet-50 text-violet-700 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">Início</span>
              </div>
              <h3 className="font-bold text-neutral-900 text-xs">Divulgue onde quiser</h3>
              <p className="text-[11px] text-neutral-500 leading-normal">
                Na bio, no WhatsApp, em mesas com QR Code, placas NFC ou folhetos impressos.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-violet-50 text-violet-700 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">Acesso</span>
              </div>
              <h3 className="font-bold text-neutral-900 text-xs">Cliente acessa</h3>
              <p className="text-[11px] text-neutral-500 leading-normal">
                Em 1 segundo direto no navegador do smartphone, sem ter que baixar aplicativos.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-violet-50 text-violet-700 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">Ponto de Encontro</span>
              </div>
              <h3 className="font-bold text-neutral-900 text-xs">DiretoLink conecta</h3>
              <p className="text-[11px] text-neutral-500 leading-normal">
                Apresenta a marca, canais, serviços, produtos e opções com visual profissional.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-violet-200 bg-violet-50/40 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <span className="text-[10px] text-violet-700 font-semibold">Resultado</span>
              </div>
              <h3 className="font-bold text-neutral-900 text-xs">Cliente realiza uma ação</h3>
              <p className="text-[11px] text-neutral-600 leading-normal">
                Avalia no Google, pontua fidelidade, inicia conversa, agenda ou consulta o cardápio.
              </p>
            </div>
          </div>
        </div>

        {/* 6 Canais de Divulgação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full max-w-full">
          {channels.map((ch, idx) => {
            const Icon = ch.icon
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-neutral-200/80 hover:border-violet-200 hover:shadow-xs transition-all space-y-2.5 break-words"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-100 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-neutral-900 text-sm truncate">{ch.name}</h3>
                    <span className="text-[11px] text-violet-600 font-medium block truncate">
                      {ch.context}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{ch.detail}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* SEÇÃO: BENEFÍCIOS ("O que a DiretoLink pode fazer pelo seu negócio?") */}
      <section className="py-12 sm:py-16 px-3.5 sm:px-8 max-w-6xl mx-auto w-full max-w-full space-y-10 sm:space-y-12 overflow-x-hidden">
        <div className="text-center space-y-2.5 px-1 max-w-2xl mx-auto">
          <span className="text-[10px] sm:text-[11px] font-bold text-violet-600 uppercase tracking-widest block">
            Recursos e Benefícios
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight break-words">
            O que a DiretoLink pode fazer pelo seu negócio?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
            Uma plataforma versátil pensada para o comércio local, prestadores de serviços, clínicas, restaurantes e lojas que querem vender mais e encantar seus clientes.
          </p>
        </div>

        {/* 10 Benefícios Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full max-w-full">
          {benefits.map((b, idx) => {
            const Icon = b.icon
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:border-violet-300 hover:shadow-sm transition-all space-y-2.5 flex flex-col justify-between break-words"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-100">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {b.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Banner Modular Futuro da Plataforma */}
        <div className="p-6 sm:p-8 rounded-3xl bg-neutral-50 border border-neutral-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-bold uppercase tracking-wider">
              <Layers className="w-3 h-3" />
              <span>Plataforma Modular</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900">
              Pronta para crescer junto com a sua empresa
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              A DiretoLink é estruturada para receber novas ferramentas conforme seu negócio evolui: catálogo de produtos, agendamentos automáticos, cardápios interativos e promoções sazonais — tudo integrado ao mesmo link que você já divulga.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shrink-0 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Começar com a DiretoLink</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Portais de Acesso Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2 w-full max-w-full">
          {/* Card 1: Autocadastro de Empresa */}
          <div className="p-5 sm:p-8 rounded-3xl bg-neutral-50 border border-neutral-200/80 space-y-4 sm:space-y-5 flex flex-col justify-between break-words">
            <div className="space-y-2.5 sm:space-y-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                Criar Minha Empresa
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Cadastre sua empresa em menos de 1 minuto. Crie seu link exclusivo, personalize com sua identidade visual e comece a divulgar por bio, QR Code ou NFC.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="py-3 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs text-center transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Criar Minha Empresa Agora</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Card 2: Login no Painel do Estabelecimento */}
          <div className="p-5 sm:p-8 rounded-3xl bg-neutral-50 border border-neutral-200/80 space-y-4 sm:space-y-5 flex flex-col justify-between break-words">
            <div className="space-y-2.5 sm:space-y-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white text-neutral-800 flex items-center justify-center border border-neutral-200 shadow-xs">
                <Store className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                Já possui cadastro? Entrar
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Área para empresas e operadores acessarem seu painel. Gerencie fidelidade, valide pontuações dos clientes, atualize informações e responda feedbacks.
              </p>
            </div>
            <Link
              href="/painel"
              className="py-3 px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs text-center transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Acessar Painel do Estabelecimento</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200/80 py-6 sm:py-8 px-3.5 sm:px-4 text-center text-xs text-neutral-500 bg-white w-full max-w-full overflow-x-hidden">
        <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center text-white text-[10px] shrink-0">
              <Radio className="w-3 h-3" />
            </div>
            <span className="font-semibold text-neutral-800">DiretoLink</span>
            <span className="text-neutral-400">· Um link. Várias possibilidades.</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-5 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="hover:text-neutral-900 transition-colors font-medium cursor-pointer"
            >
              Criar Minha Empresa
            </button>
            <Link href="/painel" className="hover:text-neutral-900 transition-colors font-medium">
              Entrar no Painel
            </Link>
            <Link
              href="/admin/login"
              className="text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-1"
              title="Acesso Administrativo Master"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Administração</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Autocadastro Modal */}
      <RegisterCompanyModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  )
}
