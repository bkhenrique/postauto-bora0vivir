import type { Page } from 'playwright'
import type { Anuncio } from '../tipos.ts'

const TIPOS: Record<string, string> = {
  flat: 'apartamento',
  apartment: 'apartamento',
  attic: 'ático',
  penthouse: 'ático',
  duplex: 'duplex',
  study: 'estúdio',
  studio: 'estúdio',
  loft: 'loft',
  house: 'casa',
  chalet: 'casa',
  semidetachedhouse: 'casa geminada',
  terracedhouse: 'casa geminada',
  groundfloor: 'térreo',
}

export function idFotocasa(url: string): string | undefined {
  return url.match(/\/(\d{6,})\/d/)?.[1]
}

type Caracteristica = { label?: string; value?: unknown }

export async function extrairFotocasa(pagina: Page, url: string): Promise<Anuncio> {
  // O Fotocasa entrega o anúncio inteiro num JSON da própria página; mais estável que ler o HTML.
  const bruto = await pagina.evaluate(() => document.getElementById('__initial_props__')?.textContent ?? '')
  const props = bruto ? (JSON.parse(bruto) as Record<string, any>) : undefined
  const detalhe = props?.realEstateAdDetailEntityV2
  const resumo = props?.realEstate
  if (!detalhe || !resumo) throw new Error('Fotocasa: dados do anúncio não encontrados na página')

  const endereco = detalhe.address ?? {}
  const anunciante = detalhe.publisher ?? {}
  const lista: Caracteristica[] = resumo.featuresList ?? []
  const andar = lista.find((item) => item.label === 'floor')?.value
  const subtipo = String(resumo.buildingSubtype ?? resumo.buildingType ?? '').toLowerCase()

  return {
    portal: 'fotocasa',
    idNoPortal: String(detalhe.propertyId ?? resumo.id ?? idFotocasa(url)),
    url,
    operacao: detalhe.transactionTypeId === 3 || url.includes('/alquiler/') ? 'aluguel' : 'venda',
    tipo: TIPOS[subtipo] ?? 'imóvel',
    titulo: String(props.propertyTitle ?? ''),
    descricao: String(detalhe.description ?? ''),
    preco: Number(detalhe.price?.amount ?? resumo.price ?? 0),
    cidade: String(endereco.locality ?? endereco.province ?? '').trim(),
    bairro: String(endereco.neighborhood || endereco.municipality || '').trim() || undefined,
    quartos: resumo.features?.rooms || undefined,
    banheiros: resumo.features?.bathrooms || undefined,
    areaM2: resumo.features?.surface || undefined,
    andar: typeof andar === 'string' ? andar : undefined,
    extras: (detalhe.extraFeatures ?? []).map(String),
    fotos: (detalhe.multimedias ?? [])
      .filter((midia: { type?: string }) => midia.type === 'image')
      .map((midia: { url: string }) => midia.url),
    anunciante: {
      nome: anunciante.alias || anunciante.name || undefined,
      telefone: anunciante.phone || undefined,
      tipo: anunciante.type === 'professional' ? 'agencia' : 'particular',
    },
  }
}
