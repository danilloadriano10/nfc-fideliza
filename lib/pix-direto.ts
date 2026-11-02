import QRCode from 'qrcode'
import { CompanyPlan, getPlanPrice } from '@/types/platform'

export const PIX_CHAVE_EMAIL = 'oficialdiretolink@gmail.com'
export const PIX_BENEFICIARIO = 'DIRETOLINK'
export const PIX_CIDADE = 'BRASILIA'

/**
 * Formata um campo no padrão TLV (Tag-Length-Value) do padrão EMV BR Code do Banco Central.
 */
function formatTlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

/**
 * Calcula o CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF) exigido pelo padrão Pix.
 */
function calculateCrc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Gera a string Pix Copia e Cola (BR Code) oficial de acordo com as especificações do Banco Central do Brasil.
 */
export function generatePixCopiaECola(params: {
  chave: string
  nomeBeneficiario: string
  cidade: string
  valor: number
  identificador?: string
}): string {
  const chave = params.chave.trim()
  const nome = params.nomeBeneficiario.trim().slice(0, 25).toUpperCase()
  const cidade = params.cidade.trim().slice(0, 15).toUpperCase()
  const valorFormatado = params.valor.toFixed(2)
  const txid = (params.identificador || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***'

  // Merchant Account Information (Tag 26)
  const gui = formatTlv('00', 'br.gov.bcb.pix')
  const key = formatTlv('01', chave)
  const tag26 = formatTlv('26', `${gui}${key}`)

  // Additional Data Field Template (Tag 62)
  const tag62 = formatTlv('62', formatTlv('05', txid))

  // Montagem do payload parcial antes do CRC16
  const payloadSemCrc =
    formatTlv('00', '01') + // Payload Format Indicator
    tag26 + // Informações da conta Pix
    formatTlv('52', '0000') + // Merchant Category Code
    formatTlv('53', '986') + // Moeda BRL
    formatTlv('54', valorFormatado) + // Valor
    formatTlv('58', 'BR') + // País
    formatTlv('59', nome) + // Nome
    formatTlv('60', cidade) + // Cidade
    tag62 + // TXID
    '6304' // Tag do CRC16

  const crc = calculateCrc16(payloadSemCrc)
  return `${payloadSemCrc}${crc}`
}

/**
 * Gera os dados completos do PIX Direto (Copia e Cola e QR Code Base64).
 */
export async function generatePixDiretoData(params: {
  plan: CompanyPlan
  companyId: string
}): Promise<{
  copiaECola: string
  qrCodeBase64: string
  valor: number
  chavePix: string
}> {
  const valor = getPlanPrice(params.plan)
  const identificador = `DL${params.companyId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}`

  const copiaECola = generatePixCopiaECola({
    chave: PIX_CHAVE_EMAIL,
    nomeBeneficiario: PIX_BENEFICIARIO,
    cidade: PIX_CIDADE,
    valor,
    identificador,
  })

  // Gera o QR Code com alta densidade e margem adequada
  const qrCodeBase64 = await QRCode.toDataURL(copiaECola, {
    width: 320,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })

  return {
    copiaECola,
    qrCodeBase64,
    valor,
    chavePix: PIX_CHAVE_EMAIL,
  }
}
