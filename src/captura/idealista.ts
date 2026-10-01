import type { Page } from 'playwright'
import type { Anuncio } from '../tipos.ts'

export function idIdealista(url: string): string | undefined {
  return url.match(/\/inmueble\/(\d+)/)?.[1]
}

type Bruto = {
  titulo: string
  local: string
  preco: string
  resumo: string[]
  detalhes: string[]
  descricao: string
  fotos: string[]
  anunciante: string
  telefone: string
  particular: boolean
}

function numero(texto: string | undefined): number | undefined {
  const valor = Number(texto?.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(valor) && valor > 0 ? valor : undefined
}

function tipoPeloTitulo(titulo: string): string {
  const t = titulo.toLowerCase()
  if (t.includes('ático')) return 'ático'
  if (t.includes('estudio')) return 'estúdio'
  if (t.includes('dúplex')) return 'duplex'
  if (t.includes('chalet') || t.includes('casa')) return 'casa'
  if (t.includes('piso') || t.includes('apartamento')) return 'apartamento'
  return 'imóvel'
}

const EXTRAS = [
  'ascensor',
  'terraza',
  'balcón',
  'amueblado',
  'aire acondicionado',
  'calefacción',
  'garaje',
  'trastero',
  'piscina',
  'armarios empotrados',
  'jardín',
  'exterior',
]

export async function extrairIdealista(pagina: Page, url: string): Promise<Anuncio> {
  const bruto: Bruto = await pagina.evaluate(() => {
    const texto = (seletor: string) => document.querySelector(seletor)?.textContent?.trim() ?? ''
    const textos = (seletor: string) =>
      [...document.querySelectorAll(seletor)].map((el) => el.textContent?.trim() ?? '').filter(Boolean)

    const galeria = (window as any).adMultimediasInfo?.fullScreenGalleryPics as
      | { imageDataService?: string; imageUrl?: string }[]
      | undefined
    const daGaleria = (galeria ?? []).map((foto) => foto.imageDataService ?? foto.imageUrl ?? '')
    const doHtml = [...document.querySelectorAll<HTMLImageElement>('#main-multimedia img, .detail-multimedia img')].map(
      (img) => img.src,
    )
    const capa = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? ''

    return {
      titulo: texto('.main-info__title-main'),
      local: texto('.main-info__title-minor'),
      preco: texto('.info-data-price .txt-bold') || texto('.info-data-price'),
      resumo: textos('.info-features > span'),
      detalhes: textos('.details-property_features li'),
      descricao: texto('.comment .adCommentsLanguage') || texto('.comment'),
      fotos: [...new Set([...daGaleria, ...doHtml, capa].filter((src) => src.startsWith('http')))],
      anunciante: texto('.professional-name .name') || texto('.about-advertiser-name'),
      telefone: texto('.phone-number-block .hidden-contact-phones_text') || '',
      particular: texto('.professional-name .name') === '' ,
    }
  })

  // "Barrio, Madrid" ou "Distrito, Barrio, Madrid": a cidade é sempre o último trecho.
  const partesDoLocal = bruto.local.split(',').map((parte) => parte.trim()).filter(Boolean)
  const tudo = [...bruto.resumo, ...bruto.detalhes]
  const achar = (padrao: RegExp) => tudo.map((item) => item.match(padrao)?.[1]).find(Boolean)
  const emMinusculas = tudo.join(' | ').toLowerCase()

  return {
    portal: 'idealista',
    idNoPortal: idIdealista(url) ?? '',
    url,
    operacao: /alquiler/i.test(bruto.titulo) ? 'aluguel' : 'venda',
    tipo: tipoPeloTitulo(bruto.titulo),
    titulo: bruto.titulo,
    descricao: bruto.descricao,
    preco: numero(bruto.preco.match(/[\d.]+/)?.[0]) ?? 0,
    cidade: partesDoLocal.at(-1) ?? '',
    bairro: partesDoLocal.length > 1 ? partesDoLocal[0] : undefined,
    quartos: numero(achar(/(\d+)\s*hab/i)),
    banheiros: numero(achar(/(\d+)\s*baño/i)),
    areaM2: numero(achar(/([\d.]+)\s*m²/i)),
    andar: tudo.find((item) => /^(planta|bajo|entreplanta|sótano)/i.test(item)),
    extras: EXTRAS.filter((extra) => emMinusculas.includes(extra)),
    fotos: bruto.fotos,
    anunciante: {
      nome: bruto.anunciante || undefined,
      telefone: bruto.telefone || undefined,
      tipo: bruto.particular ? 'particular' : 'agencia',
    },
  }
}
