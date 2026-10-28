'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Radio,
  Store,
  Sparkles,
  ArrowRight,
  Utensils,
  Scissors,
  ShoppingBag,
  Building2,
  Calendar,
  Star,
  Gift,
  Wifi,
  Check,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
  MapPin,
  Clock,
  Smartphone,
} from 'lucide-react'
import { RegisterCompanyModal } from '@/components/auth/register-company-modal'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)

  const scrollToDemo = () => {
    const el = document.getElementById('demonstracao')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-violet-100 selection:text-violet-900 font-sans w-full max-w-full overflow-x-hidden">
      {/* 1. Header Limpo */}
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
                Um link. Várias possibilidades.
              </span>
            </div>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
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

            <Link
              href="/painel"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-neutral-900 block">Entrar no Painel</span>
                <span className="text-[11px] text-neutral-500 block truncate">
                  Gerenciar cardápio, pedidos e clientes
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
              <span className="text-[10px] text-neutral-400">Um link. Várias possibilidades.</span>
            </div>
          </div>
        )}
      </header>

      {/* ==================================================
          1. HERO / PRIMEIRA TELA
          ================================================== */}
      <section className="relative pt-12 pb-14 sm:pt-16 sm:pb-20 px-4 sm:px-8 overflow-hidden bg-neutral-50/60 border-b border-neutral-200/60 w-full max-w-full">
        <div className="w-full max-w-3xl mx-auto text-center space-y-5 sm:space-y-6">
          {/* TÍTULO */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight leading-[1.12] text-balance">
            Seu negócio inteiro em um só link.
          </h1>

          {/* SUBTÍTULO */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto font-normal leading-relaxed text-balance">
            Receba pedidos, agendamentos, avaliações e clientes em uma página profissional feita para sua empresa.
          </p>

          {/* BOTÕES */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-md sm:max-w-none mx-auto">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Criar minha empresa</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={scrollToDemo}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-sm border border-neutral-200 hover:border-neutral-300 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-violet-600 shrink-0" />
              <span>Ver demonstração</span>
            </button>
          </div>

          {/* LISTA DISCRETA (Sem caixas nem pílulas) */}
          <div className="pt-4 text-xs sm:text-sm text-neutral-500 font-medium flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>Cardápio</span>
            <span className="text-neutral-300">•</span>
            <span>Produtos</span>
            <span className="text-neutral-300">•</span>
            <span>Serviços</span>
            <span className="text-neutral-300">•</span>
            <span>Agendamentos</span>
            <span className="text-neutral-300">•</span>
            <span>WhatsApp</span>
            <span className="text-neutral-300">•</span>
            <span>Avaliações</span>
            <span className="text-neutral-300">•</span>
            <span>Fidelidade</span>
          </div>
        </div>
      </section>

      {/* ==================================================
          2. MOSTRAR O PRODUTO
          ================================================== */}
      <section id="demonstracao" className="py-14 sm:py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full max-w-full space-y-10 border-b border-neutral-200/60">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Seu cliente encontra tudo em um só lugar
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            Conhece sua empresa, vê produtos e serviços, faz pedidos, agenda horários, chama no WhatsApp e avalia no Google.
          </p>
          <div className="pt-1">
            <span className="inline-block text-xs sm:text-sm font-bold text-violet-700 bg-violet-50 border border-violet-200/70 px-3.5 py-1 rounded-full">
              Sem baixar aplicativo.
            </span>
          </div>
        </div>

        {/* Visual Showcase: Smartphone Mockup + Concise Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-4">
          {/* Smartphone Mockup */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[340px] bg-neutral-900 rounded-[44px] p-3 shadow-2xl border-4 border-neutral-800">
              {/* Phone Speaker & Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-neutral-950 rounded-full z-20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-neutral-900 mr-2" />
                <div className="w-8 h-1 rounded-full bg-neutral-800" />
              </div>

              {/* Screen Content */}
              <div className="bg-white rounded-[36px] overflow-hidden border border-neutral-100 flex flex-col min-h-[560px]">
                {/* Phone Top Status */}
                <div className="pt-3 px-6 pb-2 flex items-center justify-between text-[10px] text-neutral-400 font-semibold bg-neutral-900 text-white">
                  <span>19:42</span>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3 h-3" />
                    <span className="text-[9px]">100%</span>
                  </div>
                </div>

                {/* Cover Banner Mockup */}
                <div className="relative h-28 bg-gradient-to-r from-red-800 via-red-700 to-amber-700 p-3 flex items-end">
                  <div className="absolute inset-0 bg-black/25" />
                  <div className="relative z-10 flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md border border-white shrink-0 flex items-center justify-center font-black text-red-700 text-lg">
                      🍕
                    </div>
                    <div className="text-white min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm leading-tight truncate">Pizzaria Bella Italia</span>
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      </div>
                      <p className="text-[10px] text-neutral-200 line-clamp-1">Forno a lenha & massas artesanais</p>
                    </div>
                  </div>
                </div>

                {/* Mockup Store Body */}
                <div className="p-3.5 space-y-2.5 bg-neutral-50 flex-1 flex flex-col justify-between">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[10px] bg-white px-2.5 py-1.5 rounded-xl border border-neutral-200/80">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Aberto agora
                    </span>
                    <span className="text-neutral-500 font-medium">Entrega • Balcão • Mesa</span>
                  </div>

                  {/* Standardized Action Buttons in Store Primary Theme */}
                  <div className="space-y-2">
                    <div className="w-full py-2.5 px-3 rounded-xl bg-red-800 text-white font-semibold text-xs flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Ver Cardápio & Fazer Pedido</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                    </div>

                    <div className="w-full py-2.5 px-3 rounded-xl bg-red-800 text-white font-semibold text-xs flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Pedir no WhatsApp</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                    </div>

                    <div className="w-full py-2.5 px-3 rounded-xl bg-red-800 text-white font-semibold text-xs flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5" />
                        <span>Avaliar no Google (5.0 ★)</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                    </div>

                    <div className="w-full py-2.5 px-3 rounded-xl bg-red-800 text-white font-semibold text-xs flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5" />
                        <span>Clube de Fidelidade (10 pts)</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                    </div>

                    <div className="w-full py-2.5 px-3 rounded-xl bg-red-800 text-white font-semibold text-xs flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Como Chegar (Maps)</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </div>

                  {/* Mockup Footer Link */}
                  <div className="text-center pt-2">
                    <span className="text-[9px] text-neutral-400 font-semibold tracking-wider uppercase">
                      Página Pública DiretoLink
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Link to live public demo page */}
            <div className="mt-4">
              <Link
                href="/empresa/pizzaria-italia"
                target="_blank"
                className="text-xs font-semibold text-violet-700 hover:text-violet-800 inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Abrir demonstração ao vivo em tela cheia</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Concise Benefits beside Smartphone */}
          <div className="lg:col-span-6 space-y-3.5 sm:space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 hover:border-violet-300 transition-all shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 border border-violet-100">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-neutral-900">Cardápio & Pedidos Online</h3>
                <p className="text-xs text-neutral-600 leading-relaxed mt-0.5">
                  Receba pedidos para mesa, retirada ou delivery com taxa, adicionais e status operacional direto na tela.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 hover:border-violet-300 transition-all shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 border border-violet-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-neutral-900">Agendamentos de Horários</h3>
                <p className="text-xs text-neutral-600 leading-relaxed mt-0.5">
                  Sem conflito de horários: o cliente escolhe o serviço, o profissional e recebe a confirmação.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 hover:border-violet-300 transition-all shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 border border-violet-100">
                <Star className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-neutral-900">Avaliações 5 Estrelas no Google</h3>
                <p className="text-xs text-neutral-600 leading-relaxed mt-0.5">
                  Direcione clientes satisfeitos direto para a avaliação no Google e aumente sua relevância nas buscas locais.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 hover:border-violet-300 transition-all shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 border border-violet-100">
                <Gift className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-neutral-900">Cartão Fidelidade Digital</h3>
                <p className="text-xs text-neutral-600 leading-relaxed mt-0.5">
                  Incentive o retorno frequente com pontuação rápida por telefone ou QR Code, sem precisar de papel.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 hover:border-violet-300 transition-all shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 border border-violet-100">
                <Wifi className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-neutral-900">Wi-Fi & Todos os Canais de Contato</h3>
                <p className="text-xs text-neutral-600 leading-relaxed mt-0.5">
                  WhatsApp, rota no Google Maps, Instagram e conexão ao Wi-Fi em um clique, sem soletrar senhas difíceis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          3. PARA QUEM É
          ================================================== */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full max-w-full space-y-10 border-b border-neutral-200/60">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Uma DiretoLink para cada tipo de negócio
          </h2>
          <p className="text-sm sm:text-base text-neutral-600">
            A plataforma se molda exatamente aos recursos que seu segmento necessita.
          </p>
        </div>

        {/* 4 Cards Modernos e Visuais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full max-w-full">
          {/* Card 1: Restaurantes */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-violet-400 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xl border border-red-100">
                🍕
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                  Gastronomia
                </span>
                <h3 className="font-bold text-neutral-900 text-base">Restaurantes & Bares</h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Cardápio digital, pedidos online, mesas, balcão e delivery com controle operacional em tempo real.
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-100 text-[11px] font-semibold text-neutral-500">
              Cardápio • Pedidos • Mesas • Delivery
            </div>
          </div>

          {/* Card 2: Barbearias e Salões */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-violet-400 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl border border-amber-100">
                ✂️
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                  Beleza & Estética
                </span>
                <h3 className="font-bold text-neutral-900 text-base">Barbearias & Salões</h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Apresentação de serviços, agendamento de horários sem conflito e cartão fidelidade para clientes fiéis.
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-100 text-[11px] font-semibold text-neutral-500">
              Serviços • Agenda • Fidelidade
            </div>
          </div>

          {/* Card 3: Lojas */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-violet-400 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl border border-emerald-100">
                🛍️
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Varejo & Comércio
                </span>
                <h3 className="font-bold text-neutral-900 text-base">Lojas & Boutiques</h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Catálogo visual de produtos, lançamentos, promoções e pedidos enviados direto para o WhatsApp.
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-100 text-[11px] font-semibold text-neutral-500">
              Catálogo • Produtos • WhatsApp
            </div>
          </div>

          {/* Card 4: Outras Empresas */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-violet-400 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl border border-blue-100">
                🏢
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                  Serviços Gerais
                </span>
                <h3 className="font-bold text-neutral-900 text-base">Outras Empresas</h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Clínicas, consultorias e prestadores: serviços, avaliações no Google, contato e presença digital oficial.
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-100 text-[11px] font-semibold text-neutral-500">
              Serviços • Avaliações • Contato
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          4. COMO FUNCIONA
          ================================================== */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full max-w-full space-y-10 border-b border-neutral-200/60">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Comece em 3 passos
          </h2>
          <p className="text-sm sm:text-base text-neutral-600">
            Simples de configurar, rápido de ativar e pronto para divulgar hoje mesmo.
          </p>
        </div>

        {/* 3 passos horizontais no desktop, verticais no mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 w-full max-w-full">
          {/* Passo 1 */}
          <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-3 text-left relative">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
              1
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Crie sua empresa</h3>
              <p className="text-xs sm:text-sm font-semibold text-violet-700 mt-0.5">
                Configure sua página.
              </p>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Defina o nome da sua empresa, escolha a cor principal da sua marca e personalize suas informações básicas em menos de 1 minuto.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-3 text-left relative">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
              2
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Ative seus recursos</h3>
              <p className="text-xs sm:text-sm font-semibold text-violet-700 mt-0.5">
                Escolha o que sua empresa precisa.
              </p>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Ative cardápio, produtos, serviços, agenda, pedidos, Wi-Fi, fidelidade ou avaliações no Google com apenas um clique.
            </p>
          </div>

          {/* Passo 3 */}
          <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-3 text-left relative">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
              3
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Divulgue</h3>
              <p className="text-xs sm:text-sm font-semibold text-violet-700 mt-0.5">
                Compartilhe por link, QR Code ou NFC.
              </p>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Coloque o link na bio do Instagram, envie no WhatsApp ou use em placas de balcão e mesas para acesso instantâneo.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          5. CTA FINAL
          ================================================== */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-neutral-50/70 w-full max-w-full">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight text-balance">
            Sua empresa pode estar online em poucos minutos.
          </h2>

          <p className="text-base sm:text-lg text-neutral-600 max-w-xl mx-auto">
            Crie sua DiretoLink e comece a divulgar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 w-full max-w-md sm:max-w-none mx-auto">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Criar minha empresa</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <Link
              href="/painel"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-sm border border-neutral-200 hover:border-neutral-300 shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4 text-violet-600 shrink-0" />
              <span>Entrar no Painel</span>
            </Link>
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
            <span className="text-neutral-400">· Um link. Várias possibilidades.</span>
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
      />
    </div>
  )
}
