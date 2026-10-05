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
  CheckCircle,
  Zap,
  Radio,
  Layers,
  Menu,
  X,
  ChevronRight,
  PlusCircle,
} from 'lucide-react'
import { RegisterCompanyModal } from '@/components/auth/register-company-modal'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)

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
                Aproxime. Conecte. Pronto.
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
              <span>Entrar</span>
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
              <span className="text-violet-600 font-bold">Plataforma NFC</span>
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
                    Cadastre e configure sua placa NFC em 1 minuto
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
                    Acesso para estabelecimentos cadastrados
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </Link>
            </div>

            {/* Discreto: Administrador Master */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[11px] text-neutral-400 hover:text-neutral-700 flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                <span>Administrador Master</span>
              </Link>
              <span className="text-[10px] text-neutral-400">
                Aproxime. Conecte. Pronto.
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-14 sm:pt-16 sm:pb-20 px-3.5 sm:px-8 overflow-hidden bg-neutral-50/60 border-b border-neutral-200/60 w-full max-w-full">
        <div className="w-full max-w-4xl mx-auto text-center space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200 text-[11px] sm:text-xs text-neutral-700 shadow-xs max-w-full leading-snug">
            <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse shrink-0" />
            <span className="font-medium truncate">Plataforma SaaS de Presença Física e Fidelidade NFC</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight leading-[1.18] break-words text-balance px-1">
            Um toque conecta o cliente à empresa.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl mx-auto font-normal leading-relaxed break-words px-1">
            Placas inteligentes com aproximação NFC instantânea. Seu cliente encosta o smartphone e acessa cartão de fidelidade, avaliações no Google, Wi-Fi e cardápio sem instalar nada.
          </p>

          <p className="text-xs sm:text-sm font-semibold text-violet-700 tracking-wider uppercase">
            Aproxime. Conecte. Pronto.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3.5 pt-3 w-full max-w-md sm:max-w-none mx-auto">
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

      {/* Benefits Overview */}
      <section className="py-12 sm:py-16 px-3.5 sm:px-8 max-w-5xl mx-auto w-full max-w-full space-y-10 sm:space-y-12 overflow-x-hidden">
        <div className="text-center space-y-2 px-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-violet-600 uppercase tracking-widest block">
            Diferenciais DiretoLink
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight break-words">
            Tecnologia de aproximação que gera resultados reais
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto break-words">
            Projetada para cafeterias, barbearias, restaurantes, consultórios e varejo local que buscam conexões diretas e recorrentes com seus clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-2.5 break-words">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">Sem Aplicativos para Baixar</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              O cliente apenas aproxima o smartphone na placa ou escaneia o QR Code no balcão para abrir instantaneamente a página oficial da empresa.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-2.5 break-words">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">Cartão Fidelidade Digital</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Cadastro ágil via WhatsApp. Pontuação com validação antifraude diretamente pela equipe de caixa, sem atrito ou cartões de papel perdidos.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-2.5 break-words">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">Avaliações 5 Estrelas no Google</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Direcione clientes satisfeitos diretamente para a tela de avaliação do Google, conecte ao Wi-Fi em 1 clique e canalize feedbacks privados.
            </p>
          </div>
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
                Cadastre sua empresa em menos de 1 minuto. Crie seu link exclusivo, configure as cores e ative a fidelidade digital para colocar na sua placa NFC.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="py-3 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs text-center transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Começar Agora • Criar Empresa</span>
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
                Área para lojistas e operadores acessarem seu estabelecimento. Valide pontos de fidelidade dos clientes, responda feedbacks e configure horários.
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
            <span className="text-neutral-400">· Aproxime. Conecte. Pronto.</span>
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
              Entrar
            </Link>
            <Link
              href="/admin"
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
