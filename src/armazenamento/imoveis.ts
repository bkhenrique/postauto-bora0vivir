import type { Anuncio, Imovel, StatusImovel } from '../tipos.ts'
import { banco } from './banco.ts'

type Linha = {
  id: number
  codigo: string
  portal: string
  id_no_portal: string
  url: string
  anuncio: string
  texto: string | null
  legenda: string | null
  fotos: string
  status: string
  ig_media_id: string | null
  ig_permalink: string | null
  erro: string | null
  criado_em: string
  publicado_em: string | null
}

function paraImovel(linha: Linha): Imovel {
  return {
    id: linha.id,
    codigo: linha.codigo,
    portal: linha.portal as Imovel['portal'],
    idNoPortal: linha.id_no_portal,
    url: linha.url,
    anuncio: JSON.parse(linha.anuncio) as Anuncio,
    texto: linha.texto,
    legenda: linha.legenda,
    fotos: JSON.parse(linha.fotos) as string[],
    status: linha.status as StatusImovel,
    igMediaId: linha.ig_media_id,
    igPermalink: linha.ig_permalink,
    erro: linha.erro,
    criadoEm: linha.criado_em,
    publicadoEm: linha.publicado_em,
  }
}

export function criarImovel(codigo: string, anuncio: Anuncio): Imovel {
  banco()
    .prepare(
      `INSERT INTO imoveis (codigo, portal, id_no_portal, url, anuncio, status)
       VALUES (?, ?, ?, ?, ?, 'capturado')`,
    )
    .run(codigo, anuncio.portal, anuncio.idNoPortal, anuncio.url, JSON.stringify(anuncio))
  return buscarPorCodigo(codigo)!
}

export function buscarPorCodigo(codigo: string): Imovel | undefined {
  const linha = banco()
    .prepare('SELECT * FROM imoveis WHERE codigo = ?')
    .get(codigo.toUpperCase()) as Linha | undefined
  return linha && paraImovel(linha)
}

export function buscarPorAnuncio(portal: string, idNoPortal: string): Imovel | undefined {
  const linha = banco()
    .prepare('SELECT * FROM imoveis WHERE portal = ? AND id_no_portal = ?')
    .get(portal, idNoPortal) as Linha | undefined
  return linha && paraImovel(linha)
}

export function listarRecentes(limite = 10): Imovel[] {
  const linhas = banco()
    .prepare('SELECT * FROM imoveis ORDER BY id DESC LIMIT ?')
    .all(limite) as Linha[]
  return linhas.map(paraImovel)
}

export function ultimoAguardando(): Imovel | undefined {
  const linha = banco()
    .prepare(`SELECT * FROM imoveis WHERE status = 'aguardando_aprovacao' ORDER BY id DESC LIMIT 1`)
    .get() as Linha | undefined
  return linha && paraImovel(linha)
}

type Alteracoes = Partial<{
  texto: string
  legenda: string
  fotos: string[]
  status: StatusImovel
  igMediaId: string
  igPermalink: string
  erro: string | null
  publicadoEm: string
}>

const colunas: Record<keyof Alteracoes, string> = {
  texto: 'texto',
  legenda: 'legenda',
  fotos: 'fotos',
  status: 'status',
  igMediaId: 'ig_media_id',
  igPermalink: 'ig_permalink',
  erro: 'erro',
  publicadoEm: 'publicado_em',
}

export function atualizarImovel(codigo: string, alteracoes: Alteracoes): Imovel {
  const campos = Object.keys(alteracoes) as (keyof Alteracoes)[]
  if (campos.length > 0) {
    const atribuicoes = campos.map((campo) => `${colunas[campo]} = ?`).join(', ')
    const valores = campos.map((campo) => {
      const valor = alteracoes[campo]
      return Array.isArray(valor) ? JSON.stringify(valor) : (valor ?? null)
    })
    banco()
      .prepare(`UPDATE imoveis SET ${atribuicoes} WHERE codigo = ?`)
      .run(...valores, codigo)
  }
  return buscarPorCodigo(codigo)!
}

export function proximoNumero(prefixo: string): number {
  const linha = banco()
    .prepare(
      `INSERT INTO sequencias (prefixo, ultimo) VALUES (?, 1)
       ON CONFLICT (prefixo) DO UPDATE SET ultimo = ultimo + 1
       RETURNING ultimo`,
    )
    .get(prefixo) as { ultimo: number }
  return linha.ultimo
}
