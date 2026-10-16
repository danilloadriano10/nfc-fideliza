'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  QrCode,
  Printer,
  Download,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  UtensilsCrossed,
  Sparkles,
  Info,
  Power,
  RotateCw,
} from 'lucide-react'
import QRCode from 'qrcode'
import { Company, CompanyTable } from '@/types/platform'
import {
  getCompanyTables,
  saveCompanyTableOnServerApi,
  toggleCompanyTableOnServerApi,
  deleteCompanyTableOnServerApi,
  fetchCompanyTablesFromServer,
  DATA_CHANGE_EVENT,
} from '@/lib/storage'
import { QRCodeView } from '@/components/common/qr-code'

interface TablesTabProps {
  company: Company
  onOpenTableOrders?: () => void
}

export const TablesTab: React.FC<TablesTabProps> = ({ company, onOpenTableOrders }) => {
  const [tables, setTables] = useState<CompanyTable[]>(() => getCompanyTables(company.id))
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Modal para Criar / Editar Mesa
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<CompanyTable | null>(null)
  const [tableName, setTableName] = useState('')
  const [tableIdentifier, setTableIdentifier] = useState('')
  const [tableNotes, setTableNotes] = useState('')
  const [tableIsActive, setTableIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Modal de Exibição / Impressão de QR Code da Mesa
  const [qrModalTable, setQrModalTable] = useState<CompanyTable | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Carregar mesas atualizadas do servidor
  const loadTables = useCallback(async () => {
    setIsLoading(true)
    try {
      const serverTables = await fetchCompanyTablesFromServer(company.id)
      setTables(serverTables)
    } finally {
      setIsLoading(false)
    }
  }, [company.id])

  useEffect(() => {
    loadTables()

    const onDataChange = () => {
      setTables(getCompanyTables(company.id))
    }
    window.addEventListener(DATA_CHANGE_EVENT, onDataChange)
    window.addEventListener('storage', onDataChange)
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, onDataChange)
      window.removeEventListener('storage', onDataChange)
    }
  }, [loadTables, company.id])

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Obter link exclusivo da mesa
  const getTableUrl = (ident: string) => {
    if (typeof window === 'undefined') {
      return `/empresa/${company.slug}/cardapio?mesa=${encodeURIComponent(ident)}`
    }
    const origin = window.location.origin
    return `${origin}/empresa/${company.slug}/cardapio?mesa=${encodeURIComponent(ident)}`
  }

  // Copiar link para o clipboard
  const handleCopyLink = async (ident: string) => {
    const url = getTableUrl(ident)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      showToast('Link exclusivo da mesa copiado!')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      showToast('Erro ao copiar link', 'error')
    }
  }

  // Baixar imagem do QR Code
  const handleDownloadQrCode = async (table: CompanyTable) => {
    setIsDownloading(true)
    try {
      const url = getTableUrl(table.identifier || table.name)
      const dataUrl = await QRCode.toDataURL(url, {
        width: 1000,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
      const link = document.createElement('a')
      const cleanName = (table.name || 'mesa').toLowerCase().replace(/\s+/g, '-')
      link.download = `qrcode-${company.slug}-${cleanName}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast(`QR Code da ${table.name} baixado com sucesso!`)
    } catch (err) {
      console.error('Erro ao gerar QR Code para download:', err)
      showToast('Erro ao baixar QR Code', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  // Imprimir display da mesa
  const handlePrintDisplay = (table: CompanyTable) => {
    const url = getTableUrl(table.identifier || table.name)
    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) {
      showToast('Não foi possível abrir janela de impressão. Permita pop-ups.', 'error')
      return
    }

    QRCode.toDataURL(
      url,
      {
        width: 600,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, qrDataUrl) => {
        if (err || !qrDataUrl) {
          showToast('Erro ao gerar imagem para impressão.', 'error')
          return
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Display de Mesa - ${table.name} - ${company.name}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f8fafc;
                color: #0f172a;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 95vh;
              }
              .card {
                background: white;
                border: 2px solid #e2e8f0;
                border-radius: 28px;
                padding: 40px 32px;
                max-width: 420px;
                width: 100%;
                text-align: center;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
              }
              .company-name {
                font-size: 20px;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 4px;
                letter-spacing: -0.5px;
              }
              .tagline {
                font-size: 13px;
                color: #64748b;
                margin-bottom: 24px;
              }
              .table-badge {
                display: inline-block;
                background: #0f172a;
                color: white;
                font-size: 26px;
                font-weight: 900;
                padding: 8px 24px;
                border-radius: 100px;
                margin-bottom: 24px;
                letter-spacing: -0.5px;
              }
              .qr-box {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                padding: 20px;
                margin: 0 auto 24px auto;
                width: 260px;
                height: 260px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .qr-box img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                border-radius: 12px;
              }
              .instructions {
                font-size: 15px;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 6px;
              }
              .sub-instructions {
                font-size: 12px;
                color: #64748b;
                line-height: 1.4;
              }
              .footer {
                margin-top: 28px;
                padding-top: 16px;
                border-top: 1px dashed #cbd5e1;
                font-size: 11px;
                color: #94a3b8;
                font-weight: 600;
              }
              @media print {
                body {
                  background: white;
                  padding: 0;
                }
                .card {
                  box-shadow: none;
                  border: 2px solid #000;
                }
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="company-name">${company.name}</div>
              <div class="tagline">Cardápio Digital no Salão</div>
              <div class="table-badge">${table.name}</div>
              
              <div class="qr-box">
                <img src="${qrDataUrl}" alt="QR Code ${table.name}" />
              </div>

              <div class="instructions">Aponte a câmera do celular</div>
              <div class="sub-instructions">
                Consulte pratos, preços, monte seu pedido e envie direto para nossa cozinha sem esperar!
              </div>

              <div class="footer">
                DiretoLink · Pedido Inteligente na Mesa
              </div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 300);
              };
            </script>
          </body>
          </html>
        `)
        printWindow.document.close()
      }
    )
  }

  // Abrir Modal de Edição ou Criação
  const handleOpenCreateModal = () => {
    setEditingTable(null)
    const nextNum = (tables.length + 1).toString().padStart(2, '0')
    setTableName(`Mesa ${nextNum}`)
    setTableIdentifier(nextNum)
    setTableNotes('')
    setTableIsActive(true)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (table: CompanyTable) => {
    setEditingTable(table)
    setTableName(table.name)
    setTableIdentifier(table.identifier || table.name.replace(/^(mesa|table)\s*/i, '').trim())
    setTableNotes(table.notes || '')
    setTableIsActive(table.isActive)
    setIsFormModalOpen(true)
  }

  // Salvar Mesa
  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tableName.trim()) {
      showToast('Por favor, informe o nome ou número da mesa.', 'error')
      return
    }

    const cleanIdent = (tableIdentifier.trim() || tableName.trim()).replace(/^(mesa|table)\s*/i, '').trim() || tableName.trim()

    setIsSaving(true)
    try {
      const tableData: CompanyTable = {
        id: editingTable?.id || `table_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        companyId: company.id,
        name: tableName.trim(),
        identifier: cleanIdent,
        isActive: tableIsActive,
        notes: tableNotes.trim() || undefined,
        createdAt: editingTable?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const res = await saveCompanyTableOnServerApi(tableData)
      if (res.success) {
        showToast(editingTable ? 'Mesa atualizada com sucesso!' : 'Mesa adicionada com sucesso!')
        setIsFormModalOpen(false)
        loadTables()
      } else {
        showToast(res.error || 'Erro ao salvar mesa', 'error')
      }
    } catch {
      showToast('Erro ao salvar mesa', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Ativar / Desativar Mesa
  const handleToggleStatus = async (table: CompanyTable) => {
    try {
      await toggleCompanyTableOnServerApi(table.id, company.id)
      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, isActive: !t.isActive } : t))
      )
      showToast(`Mesa ${table.name} ${!table.isActive ? 'ativada' : 'desativada'}!`)
    } catch {
      showToast('Erro ao alterar status da mesa', 'error')
    }
  }

  // Excluir Mesa
  const handleDeleteTable = async (table: CompanyTable) => {
    if (!confirm(`Tem certeza que deseja excluir a ${table.name}? Os pedidos históricos permanecerão registrados.`)) {
      return
    }

    try {
      await deleteCompanyTableOnServerApi(table.id, company.id)
      setTables((prev) => prev.filter((t) => t.id !== table.id))
      showToast(`${table.name} excluída com sucesso!`)
    } catch {
      showToast('Erro ao excluir mesa', 'error')
    }
  }

  // Adicionar lote de mesas (ex: Mesas 01 a 10)
  const handleQuickAddBatch = async () => {
    const existingCount = tables.length
    const startNum = existingCount + 1
    const endNum = existingCount + 5

    if (!confirm(`Deseja adicionar rapidamente 5 mesas (Mesa ${startNum.toString().padStart(2, '0')} a Mesa ${endNum.toString().padStart(2, '0')})?`)) {
      return
    }

    setIsLoading(true)
    try {
      for (let i = startNum; i <= endNum; i++) {
        const numStr = i.toString().padStart(2, '0')
        await saveCompanyTableOnServerApi({
          id: `table_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          companyId: company.id,
          name: `Mesa ${numStr}`,
          identifier: numStr,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
      showToast(`5 novas mesas adicionadas com sucesso!`)
      loadTables()
    } catch {
      showToast('Erro ao adicionar mesas em lote', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtro de busca
  const filteredTables = tables.filter((t) => {
    const q = search.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      (t.identifier && t.identifier.toLowerCase().includes(q)) ||
      (t.notes && t.notes.toLowerCase().includes(q))
    )
  })

  const activeCount = tables.filter((t) => t.isActive).length

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 py-2.5 px-4 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Informativo de Cardápio Único */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                  Mesas & Consumo no Local
                </h2>
                <p className="text-xs text-neutral-500">
                  Gerencie as mesas do salão, gere QR Codes individuais e links exclusivos para seus clientes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenTableOrders && (
              <button
                type="button"
                onClick={onOpenTableOrders}
                className="px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-teal-600" />
                <span>Ver Pedidos do Salão</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleQuickAddBatch}
              disabled={isLoading}
              className="px-3 py-2.5 rounded-xl border border-dashed border-teal-300 bg-teal-50/60 hover:bg-teal-100/60 text-teal-800 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Adiciona 5 mesas sequenciais automaticamente"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>+ 5 Mesas</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Mesa</span>
            </button>
          </div>
        </div>

        {/* Banner Informativo Multi-Mesa com Cardápio Único */}
        <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-3 text-xs text-teal-900">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Cada mesa utiliza o <strong>mesmo cardápio oficial</strong> de {company.name}.
            </p>
            <p className="text-teal-700 leading-relaxed text-[11px]">
              Ao ler o QR Code da mesa (ex: <code>/empresa/{company.slug}/cardapio?mesa=08</code>), o cliente visualiza seus pratos atuais e o sistema identifica automaticamente a mesa dele no momento do pedido. Não é necessário cadastrar produtos duplicados!
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Total de Mesas
            </span>
            <span className="text-xl font-black text-neutral-900 mt-0.5 block">
              {tables.length}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Mesas Ativas
            </span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block">
              {activeCount}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Link do Cardápio
              </span>
              <span className="text-xs font-bold text-neutral-700 block truncate max-w-[150px]">
                /empresa/{company.slug}/cardapio
              </span>
            </div>
            <button
              type="button"
              onClick={loadTables}
              disabled={isLoading}
              className="p-2 rounded-xl hover:bg-neutral-200/70 text-neutral-500 transition-all cursor-pointer"
              title="Recarregar mesas"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar mesa por nome, número ou observação..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-2xl text-xs sm:text-sm font-medium placeholder-neutral-400 focus:outline-hidden focus:border-teal-500 shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Grid de Mesas */}
      {filteredTables.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-neutral-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-neutral-800">
            {search ? 'Nenhuma mesa encontrada' : 'Nenhuma mesa cadastrada ainda'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {search
              ? 'Tente outro termo de busca ou limpe o campo.'
              : 'Cadastre suas mesas para gerar QR Codes individuais e receber pedidos direto na cozinha.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-500 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Primeira Mesa</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTables.map((table) => {
            const tableUrl = getTableUrl(table.identifier || table.name)
            return (
              <div
                key={table.id}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between gap-4 shadow-xs ${
                  table.isActive
                    ? 'border-neutral-200 hover:border-teal-400'
                    : 'border-neutral-200/60 opacity-60 bg-neutral-50/50'
                }`}
              >
                {/* Header do Card */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                          table.isActive
                            ? 'bg-teal-600 text-white'
                            : 'bg-neutral-200 text-neutral-500'
                        }`}
                      >
                        {table.identifier || 'M'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-neutral-900 text-base leading-tight">
                            {table.name}
                          </h3>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              table.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {table.isActive ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        {table.notes && (
                          <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                            {table.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botão Liga/Desliga */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(table)}
                      className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                        table.isActive
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-neutral-400 hover:bg-neutral-200'
                      }`}
                      title={table.isActive ? 'Desativar mesa' : 'Ativar mesa'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Link Exclusivo da Mesa */}
                  <div className="mt-3.5 p-2 rounded-xl bg-neutral-50 border border-neutral-150 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Link Exclusivo
                      </span>
                      <span className="text-xs font-mono text-neutral-600 truncate block">
                        ?mesa={table.identifier || table.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(table.identifier || table.name)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-white border border-transparent hover:border-neutral-200 transition-all cursor-pointer"
                        title="Copiar link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={tableUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-teal-700 hover:bg-white border border-transparent hover:border-neutral-200 transition-all cursor-pointer"
                        title="Abrir como cliente"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Footer do Card com Ações */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setQrModalTable(table)}
                    className="flex-1 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100/80 text-teal-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-teal-600" />
                    <span>Ver QR Code</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(table)}
                      className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-all cursor-pointer"
                      title="Editar dados da mesa"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTable(table)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-all cursor-pointer"
                      title="Excluir mesa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADICIONAR / EDITAR MESA                          */}
      {/* ========================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">
                    {editingTable ? 'Editar Mesa' : 'Nova Mesa no Salão'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Defina o número e identificação da mesa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Nome da Mesa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Ex: Mesa 01, Mesa 08, Varanda 02"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm font-medium focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Identificador / Número do Link
                </label>
                <input
                  type="text"
                  value={tableIdentifier}
                  onChange={(e) => setTableIdentifier(e.target.value)}
                  placeholder="Ex: 01, 08, VIP (usado no link ?mesa=...)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm font-medium focus:outline-hidden focus:border-teal-500 font-mono"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Prévia do link: <code>/empresa/{company.slug}/cardapio?mesa={tableIdentifier || tableName || '01'}</code>
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Localização / Observações Internas (opcional)
                </label>
                <input
                  type="text"
                  value={tableNotes}
                  onChange={(e) => setTableNotes(e.target.value)}
                  placeholder="Ex: Próximo à janela, Deck externo, Piso superior"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm font-medium focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tableActiveCheck"
                  checked={tableIsActive}
                  onChange={(e) => setTableIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="tableActiveCheck" className="text-xs font-semibold text-neutral-700 cursor-pointer">
                  Mesa ativa e disponível para pedidos
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingTable ? 'Salvar Alterações' : 'Criar Mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: QR CODE INDIVIDUAL, DOWNLOAD E IMPRESSÃO         */}
      {/* ========================================================= */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                QR Code Individual
              </span>
              <button
                type="button"
                onClick={() => setQrModalTable(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Display Card Mockup */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
              <span className="text-xs font-bold text-neutral-500 block truncate">
                {company.name}
              </span>
              <div className="inline-block px-3 py-1 bg-neutral-900 text-white rounded-full text-base font-black tracking-tight">
                {qrModalTable.name}
              </div>

              {/* QR Code Canvas */}
              <div className="flex justify-center my-2">
                <QRCodeView
                  value={getTableUrl(qrModalTable.identifier || qrModalTable.name)}
                  size={190}
                  className="shadow-sm border border-neutral-200/60"
                />
              </div>

              <div className="text-[11px] text-neutral-600 font-semibold">
                Aponte a câmera para abrir o cardápio
              </div>
            </div>

            {/* Link Exclusivo Copiável */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Link da Mesa
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={getTableUrl(qrModalTable.identifier || qrModalTable.name)}
                  className="flex-1 px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(qrModalTable.identifier || qrModalTable.name)}
                  className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-all cursor-pointer shrink-0"
                  title="Copiar link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Ações de Impressão e Download */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDownloadQrCode(qrModalTable)}
                disabled={isDownloading}
                className="py-2.5 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-teal-600" />
                <span>Baixar Imagem</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintDisplay(qrModalTable)}
                className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Display</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
