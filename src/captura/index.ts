import fs from 'node:fs'
import path from 'node:path'
import type { Page } from 'playwright'
import { config } from '../config.ts'
import type { Anuncio, Portal } from '../tipos.ts'
import { extrairFotocasa, idFotocasa } from './fotocasa.ts'
import { extrairIdealista, idIdealista } from './idealista.ts'
import { abrirPagina } from './navegador.ts'

type Adaptador = {
  portal: Portal
  dominio: RegExp
  idDaUrl: (url: string) => string | undefined
  extrair: (pagina: Page, url: string) => Promise<Anuncio>
}

const adaptadores: Adaptador[] = [
  { portal: 'fotocasa', dominio: /(^|\.)fotocasa\.es$/, idDaUrl: idFotocasa, extrair: extrairFotocasa },
  { portal: 'idealista', dominio: /(^|\.)idealista\.com$/, idDaUrl: idIdealista, extrair: extrairIdealista },
]

export type Referencia = { portal: Portal; idNoPortal: string; url: string }

export function identificar(link: string): Referencia {
  let endereco: URL
  try {
    endereco = new URL(link.trim())
  } catch {
    throw new Error('Isso não parece um link válido.')
  }

  const adaptador = adaptadores.find((item) => item.dominio.test(endereco.hostname))
  if (!adaptador) {
    throw new Error(`Portal não suportado: ${endereco.hostname}. Por enquanto só Fotocasa e Idealista.`)
  }

  // Sem query e fragmento: são só rastreio, e o mesmo anúncio precisa virar sempre a mesma URL.
  const url = `${endereco.origin}${endereco.pathname}`
  const idNoPortal = adaptador.idDaUrl(url)
  if (!idNoPortal) throw new Error('O link não é de um anúncio (não achei o número do imóvel).')

  return { portal: adaptador.portal, idNoPortal, url }
}

function conferir(anuncio: Anuncio): void {
  const faltando = [
    anuncio.preco > 0 ? '' : 'preço',
    anuncio.cidade ? '' : 'cidade',
    anuncio.fotos.length > 0 ? '' : 'fotos',
  ].filter(Boolean)
  if (faltando.length > 0) throw new Error(`Captura incompleta, faltou: ${faltando.join(', ')}`)
}

async function guardarFalha(pagina: Page, referencia: Referencia): Promise<string> {
  const pasta = path.join(config.pastaDados, 'falhas')
  fs.mkdirSync(pasta, { recursive: true })
  const arquivo = path.join(pasta, `${referencia.portal}-${referencia.idNoPortal}.html`)
  fs.writeFileSync(arquivo, await pagina.content())
  return arquivo
}

export async function capturar(referencia: Referencia): Promise<Anuncio> {
  // O Idealista detecta o navegador automatizado e bloqueia o IP inteiro, inclusive para uso normal.
  if (referencia.portal === 'idealista' && !config.navegador.idealistaAutomatico) {
    throw new Error(
      'A captura automática do Idealista está desligada: o portal bloqueia o acesso. Por enquanto, use um anúncio equivalente no Fotocasa ou a entrada manual (npm run previa -- --manual anuncio.json).',
    )
  }

  const adaptador = adaptadores.find((item) => item.portal === referencia.portal)!
  const pagina = await abrirPagina(referencia.url)

  try {
    const anuncio = await adaptador.extrair(pagina, referencia.url)
    conferir(anuncio)
    return anuncio
  } catch (erro) {
    const arquivo = await guardarFalha(pagina, referencia).catch(() => undefined)
    const mensagem = erro instanceof Error ? erro.message : String(erro)
    throw new Error(arquivo ? `${mensagem} (página salva em ${arquivo})` : mensagem)
  } finally {
    await pagina.close()
  }
}
