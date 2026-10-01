import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { Anuncio } from '../tipos.ts'

// Entrada manual: um JSON com os campos do anúncio e, opcionalmente, fotos locais.
// Caminhos de foto relativos valem a partir da pasta do próprio JSON.
export function lerAnuncioManual(arquivo: string): Anuncio {
  const dados = JSON.parse(fs.readFileSync(arquivo, 'utf8')) as Partial<Anuncio>
  const pasta = path.dirname(path.resolve(arquivo))
  const url = dados.url ?? ''

  return {
    portal: 'manual',
    idNoPortal: dados.idNoPortal ?? crypto.createHash('sha1').update(url || arquivo).digest('hex').slice(0, 12),
    url,
    operacao: dados.operacao ?? 'aluguel',
    tipo: dados.tipo ?? 'imóvel',
    titulo: dados.titulo ?? '',
    descricao: dados.descricao ?? '',
    preco: Number(dados.preco ?? 0),
    cidade: dados.cidade ?? '',
    bairro: dados.bairro,
    quartos: dados.quartos,
    banheiros: dados.banheiros,
    areaM2: dados.areaM2,
    andar: dados.andar,
    extras: dados.extras ?? [],
    fotos: (dados.fotos ?? []).map((foto) => (/^https?:/.test(foto) ? foto : path.resolve(pasta, foto))),
    anunciante: dados.anunciante ?? {},
  }
}
