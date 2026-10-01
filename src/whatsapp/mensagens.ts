import { formatarPreco, localizacao, tipoComQuartos } from '../conteudo/formato.ts'
import type { Previa } from '../pipeline/processar-link.ts'
import type { Imovel } from '../tipos.ts'

export const AJUDA = `Comandos:
• link do anúncio — gera a prévia
• ok — publica a última prévia
• refazer [instrução] — outra legenda ("refazer mais curto")
• cancelar — descarta a prévia
• MAD-0001 — mostra os dados do imóvel
• arquivar MAD-0001
• lista — últimos imóveis
Para agir sobre uma prévia que não é a última, inclua o código: "ok MAD-0001".`

function anunciante(imovel: Imovel): string {
  const { nome, telefone } = imovel.anuncio.anunciante
  return [nome, telefone].filter(Boolean).join(' · ') || 'não informado'
}

export function previa({ imovel, avisos }: Previa): string {
  return [
    `📋 Prévia — ${imovel.codigo}`,
    `${imovel.fotos.length} fotos · ${localizacao(imovel.anuncio)} · ${formatarPreco(imovel.anuncio)}`,
    ...avisos.map((aviso) => `⚠️ ${aviso}`),
    'Responda: ok · refazer · cancelar',
  ].join('\n')
}

export function controle(imovel: Imovel): string {
  return [
    `✅ Publicado — ${imovel.codigo}`,
    '',
    `🏠 ${tipoComQuartos(imovel.anuncio)} · ${localizacao(imovel.anuncio)}`,
    `💶 ${formatarPreco(imovel.anuncio)}`,
    '',
    `🔗 Anúncio: ${imovel.url}`,
    `📸 Post: ${imovel.igPermalink}`,
    `👤 Anunciante: ${anunciante(imovel)}`,
    `🗓 ${new Date().toLocaleDateString('pt-BR')}`,
  ].join('\n')
}

export function consulta(imovel: Imovel): string {
  return [
    `${imovel.codigo} — ${imovel.status}`,
    `🏠 ${tipoComQuartos(imovel.anuncio)} · ${localizacao(imovel.anuncio)}`,
    `💶 ${formatarPreco(imovel.anuncio)}`,
    `🔗 Anúncio: ${imovel.url}`,
    imovel.igPermalink ? `📸 Post: ${imovel.igPermalink}` : '',
    `👤 Anunciante: ${anunciante(imovel)}`,
    imovel.erro ? `❌ Último erro: ${imovel.erro}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function linhaDaLista(imovel: Imovel): string {
  return `${imovel.codigo} · ${imovel.status} · ${formatarPreco(imovel.anuncio)} · ${localizacao(imovel.anuncio)}`
}
