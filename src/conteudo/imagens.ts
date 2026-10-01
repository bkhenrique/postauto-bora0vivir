import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import type { Anuncio } from '../tipos.ts'
import { ALTURA, LARGURA, montarCapa } from './capa.ts'

const MAXIMO_NO_CARROSSEL = 10
const LARGURA_MINIMA = 500
// Abaixo dessa proporção a foto já é quase vertical e o corte perde pouco.
const PROPORCAO_PARA_CORTE = 0.95

async function carregar(origem: string): Promise<Buffer> {
  if (!/^https?:/.test(origem)) return fs.promises.readFile(origem)

  const resposta = await fetch(origem, { signal: AbortSignal.timeout(30_000) })
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
  return Buffer.from(await resposta.arrayBuffer())
}

async function ajustarAoFeed(foto: Buffer): Promise<Buffer> {
  const original = sharp(foto).rotate()
  const { width = 0, height = 1 } = await original.metadata()

  if (width / height <= PROPORCAO_PARA_CORTE) {
    return original.resize(LARGURA, ALTURA, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer()
  }

  // Foto horizontal: inteira no centro, sobre ela mesma desfocada, para não cortar o cômodo.
  const fundo = await sharp(foto)
    .rotate()
    .resize(LARGURA, ALTURA, { fit: 'cover' })
    .blur(40)
    .modulate({ brightness: 0.6 })
    .toBuffer()
  const frente = await sharp(foto).rotate().resize(LARGURA, ALTURA, { fit: 'inside' }).toBuffer()

  return sharp(fundo)
    .composite([{ input: frente, gravity: 'centre' }])
    .jpeg({ quality: 88 })
    .toBuffer()
}

async function baixarAproveitaveis(anuncio: Anuncio): Promise<Buffer[]> {
  const fotos: Buffer[] = []
  for (const origem of anuncio.fotos) {
    if (fotos.length === MAXIMO_NO_CARROSSEL) break
    try {
      const foto = await carregar(origem)
      const { width = 0 } = await sharp(foto).metadata()
      if (width >= LARGURA_MINIMA) fotos.push(foto)
    } catch (erro) {
      console.warn(`Foto ignorada (${erro instanceof Error ? erro.message : erro}): ${origem}`)
    }
  }
  return fotos
}

// Devolve os caminhos dos slides já no formato do feed: capa primeiro, depois as demais fotos.
export async function prepararFotos(anuncio: Anuncio, codigo: string, pasta: string): Promise<string[]> {
  const fotos = await baixarAproveitaveis(anuncio)
  const [primeira, ...demais] = fotos
  if (!primeira) throw new Error('Nenhuma foto do anúncio pôde ser baixada.')

  fs.mkdirSync(pasta, { recursive: true })
  const slides = [await montarCapa(primeira, anuncio, codigo), ...(await Promise.all(demais.map(ajustarAoFeed)))]

  // O Instagram exige pelo menos 2 itens num carrossel; com uma foto só, ela entra limpa depois da capa.
  if (slides.length === 1) slides.push(await ajustarAoFeed(primeira))

  return Promise.all(
    slides.map(async (slide, indice) => {
      const arquivo = path.join(pasta, `${String(indice + 1).padStart(2, '0')}.jpg`)
      await fs.promises.writeFile(arquivo, slide)
      return arquivo
    }),
  )
}
