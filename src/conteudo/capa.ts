import sharp from 'sharp'
import { config } from '../config.ts'
import type { Anuncio } from '../tipos.ts'
import { encurtar, formatarPreco, localizacao, tipoComQuartos } from './formato.ts'

export const LARGURA = 1080
export const ALTURA = 1350

const ALTURA_FOTO = 870
const MARGEM = 64
const FONTE = 'Helvetica Neue, Helvetica, Arial, sans-serif'

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function painel(anuncio: Anuncio, codigo: string): Buffer {
  const { corFundo, corDestaque, nome } = config.marca
  const referencia = `REF ${codigo}`
  const larguraDaEtiqueta = referencia.length * 24 + 56

  return Buffer.from(`
    <svg width="${LARGURA}" height="${ALTURA}" xmlns="http://www.w3.org/2000/svg" font-family="${FONTE}">
      <rect x="0" y="${ALTURA_FOTO}" width="${LARGURA}" height="${ALTURA - ALTURA_FOTO}" fill="${corFundo}"/>
      <rect x="0" y="${ALTURA_FOTO}" width="${LARGURA}" height="8" fill="${corDestaque}"/>

      <text x="${MARGEM}" y="970" font-size="50" font-weight="700" fill="#FFFFFF">${escapar(encurtar(tipoComQuartos(anuncio), 34))}</text>
      <text x="${MARGEM}" y="1030" font-size="38" fill="#C9D1E3">${escapar(encurtar(localizacao(anuncio), 44))}</text>
      <text x="${MARGEM}" y="1160" font-size="96" font-weight="700" fill="${corDestaque}">${escapar(formatarPreco(anuncio))}</text>

      <rect x="${MARGEM}" y="1216" width="${larguraDaEtiqueta}" height="72" rx="36" fill="#FFFFFF"/>
      <text x="${MARGEM + larguraDaEtiqueta / 2}" y="1265" font-size="36" font-weight="700" fill="${corFundo}" text-anchor="middle">${escapar(referencia)}</text>

      <text x="${LARGURA - MARGEM}" y="1265" font-size="34" fill="#C9D1E3" text-anchor="end">${escapar(nome)}</text>
    </svg>`)
}

export async function montarCapa(foto: Buffer, anuncio: Anuncio, codigo: string): Promise<Buffer> {
  const recorte = await sharp(foto)
    .rotate()
    .resize(LARGURA, ALTURA_FOTO, { fit: 'cover', position: 'centre' })
    .toBuffer()

  return sharp({ create: { width: LARGURA, height: ALTURA, channels: 3, background: config.marca.corFundo } })
    .composite([
      { input: recorte, top: 0, left: 0 },
      { input: painel(anuncio, codigo), top: 0, left: 0 },
    ])
    .jpeg({ quality: 90 })
    .toBuffer()
}
