import fs from 'node:fs'
import path from 'node:path'
import { atualizarImovel, buscarPorAnuncio, buscarPorCodigo, criarImovel } from '../armazenamento/imoveis.ts'
import { capturar, identificar } from '../captura/index.ts'
import { config } from '../config.ts'
import { gerarCodigo } from '../conteudo/codigo-referencia.ts'
import { prepararFotos } from '../conteudo/imagens.ts'
import { montarLegenda, problemasDaLegenda, tituloPadrao } from '../conteudo/legenda.ts'
import { gerarTexto, type Revisao } from '../conteudo/texto-ia.ts'
import type { Anuncio, Imovel, StatusImovel } from '../tipos.ts'

export type Opcoes = { semIa?: boolean }
export type Previa = { imovel: Imovel; jaExistia: boolean; avisos: string[] }

const PODE_RETOMAR: StatusImovel[] = ['capturado', 'falhou', 'cancelado']

function pastaDoImovel(codigo: string): string {
  return path.join(config.pastaSaida, codigo)
}

function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro)
}

function salvarPrevia(imovel: Imovel, texto: string, fotos: string[]): Previa {
  const legenda = montarLegenda(imovel.anuncio, imovel.codigo, texto)
  fs.mkdirSync(pastaDoImovel(imovel.codigo), { recursive: true })
  fs.writeFileSync(path.join(pastaDoImovel(imovel.codigo), 'legenda.txt'), legenda)

  return {
    imovel: atualizarImovel(imovel.codigo, { texto, legenda, fotos, status: 'aguardando_aprovacao', erro: null }),
    jaExistia: false,
    avisos: problemasDaLegenda(legenda, imovel.anuncio, imovel.codigo).map((problema) => `A legenda ${problema}.`),
  }
}

async function montarPrevia(imovel: Imovel, opcoes: Opcoes): Promise<Previa> {
  try {
    const fotos = await prepararFotos(imovel.anuncio, imovel.codigo, pastaDoImovel(imovel.codigo))
    const texto = opcoes.semIa ? tituloPadrao(imovel.anuncio) : await gerarTexto(imovel.anuncio)
    return salvarPrevia(imovel, texto, fotos)
  } catch (erro) {
    atualizarImovel(imovel.codigo, { status: 'falhou', erro: mensagemDe(erro) })
    throw erro
  }
}

export async function registrarAnuncio(anuncio: Anuncio, opcoes: Opcoes = {}): Promise<Previa> {
  const existente = buscarPorAnuncio(anuncio.portal, anuncio.idNoPortal)
  if (existente) return retomarOuDevolver(existente, opcoes)

  return montarPrevia(criarImovel(gerarCodigo(anuncio.cidade), anuncio), opcoes)
}

// Anúncio que falhou ou foi cancelado volta a gerar prévia com o mesmo código, sem capturar de novo.
async function retomarOuDevolver(existente: Imovel, opcoes: Opcoes): Promise<Previa> {
  if (PODE_RETOMAR.includes(existente.status)) return montarPrevia(existente, opcoes)
  return { imovel: existente, jaExistia: true, avisos: [] }
}

export async function processarLink(link: string, opcoes: Opcoes = {}): Promise<Previa> {
  const referencia = identificar(link)
  const existente = buscarPorAnuncio(referencia.portal, referencia.idNoPortal)
  if (existente) return retomarOuDevolver(existente, opcoes)

  return registrarAnuncio(await capturar(referencia), opcoes)
}

function exigir(codigo: string): Imovel {
  const imovel = buscarPorCodigo(codigo)
  if (!imovel) throw new Error(`Não achei nenhum imóvel com o código ${codigo}.`)
  return imovel
}

export async function refazerLegenda(codigo: string, instrucao?: string): Promise<Previa> {
  const imovel = exigir(codigo)
  if (imovel.status !== 'aguardando_aprovacao') {
    throw new Error(`${imovel.codigo} está como "${imovel.status}"; só dá para refazer uma prévia pendente.`)
  }

  const revisao: Revisao | undefined = imovel.texto
    ? { textoAnterior: imovel.texto, instrucao: instrucao?.trim() || 'escreva outra versão, com uma abertura diferente.' }
    : undefined
  return salvarPrevia(imovel, await gerarTexto(imovel.anuncio, revisao), imovel.fotos)
}

export function mudarStatus(codigo: string, status: 'cancelado' | 'arquivado'): Imovel {
  return atualizarImovel(exigir(codigo).codigo, { status })
}
