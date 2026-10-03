'use client'

import React from 'react'
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
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-400 selection:text-neutral-950">
      {/* Top Header */}
      <header className="border-b border-neutral-800/80 px-4 sm:px-8 py-4 backdrop-blur-md bg-neutral-950/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="text-base font-bold tracking-tight text-white flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <span className="tracking-tight">NFC Fideliza</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/painel"
              className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-800 font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Acesso do Proprietário</span>
            </Link>

            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Administrador Geral</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-8 overflow-hidden border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Plataforma Inteligente de Placas NFC & Fidelidade Digital</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.18] text-balance">
            A presença digital e o programa de fidelidade do seu negócio em um único toque.
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Placas físicas com aproximação NFC instantânea. O consumidor encosta o celular e acessa o cartão de fidelidade, avalia no Google, conecta no Wi-Fi e confere o cardápio sem precisar instalar nenhum aplicativo.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              href="/painel"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-400/10 transition-all flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>Acessar Painel do Proprietário</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs border border-neutral-800 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Acesso do Administrador</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Overview */}
      <section className="py-16 px-4 sm:px-8 max-w-5xl mx-auto w-full space-y-12">
        <div className="text-center space-y-1.5">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">
            Vantagens da Solução
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Como o NFC Fideliza Impulsiona Estabelecimentos
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl mx-auto">
            Projetado para cafeterias, barbearias, pizzarias, restaurantes e clínicas que buscam fidelizar clientes de forma simples e moderna.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Sem Aplicativos para Baixar</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              O cliente apenas aproxima o smartphone ou escaneia o QR Code na mesa/balcão para abrir a página oficial permanente da empresa.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Gift className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Cartão Fidelidade por WhatsApp</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Cadastro único e ágil por WhatsApp. Pontuações acumuladas de forma segura com validação direta do estabelecimento.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Avaliações e Presença Local</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Incentivo direto para o cliente avaliar 5 estrelas no Google, conectar ao Wi-Fi sem digitar senhas e compartilhar pelo WhatsApp.
            </p>
          </div>
        </div>

        {/* Portais de Acesso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
          {/* Card 1: Proprietário */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Portal do Proprietário</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Área exclusiva para lojistas e gestores de cada estabelecimento comercial. Acesse com seu usuário e senha para gerenciar seus clientes, validar pontos e acompanhar feedbacks.
              </p>
            </div>
            <Link
              href="/painel"
              className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5"
            >
              <span>Entrar como Proprietário</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Administrador */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Administrador Geral</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Área central da gerência da plataforma para cadastrar novos estabelecimentos, definir módulos, criar credenciais dos proprietários e acompanhar a atividade global.
              </p>
            </div>
            <Link
              href="/admin"
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5"
            >
              <span>Entrar como Administrador</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800/80 py-8 px-4 text-center text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} NFC Fideliza · Plataforma Multiempresa de Placas Inteligentes.</p>
          <div className="flex items-center gap-5">
            <Link href="/painel" className="hover:text-neutral-300 transition-colors">
              Portal do Proprietário
            </Link>
            <Link href="/admin" className="hover:text-neutral-300 transition-colors">
              Administrador Geral
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
