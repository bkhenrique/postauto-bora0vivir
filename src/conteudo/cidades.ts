import type { Anuncio } from '../tipos.ts'

const SIGLAS: Record<string, string> = {
  madrid: 'MAD',
  barcelona: 'BCN',
  valencia: 'VLC',
  malaga: 'AGP',
  sevilla: 'SVQ',
  alicante: 'ALC',
  bilbao: 'BIO',
  zaragoza: 'ZAZ',
  granada: 'GRX',
  murcia: 'MJV',
  'palma de mallorca': 'PMI',
  palma: 'PMI',
  'las palmas de gran canaria': 'LPA',
  'santa cruz de tenerife': 'TFS',
  vigo: 'VGO',
  'a coruna': 'LCG',
  gijon: 'GIJ',
  valladolid: 'VLL',
  cordoba: 'ODB',
  marbella: 'MBA',
  girona: 'GRO',
  tarragona: 'TGN',
  'san sebastian': 'EAS',
  santander: 'SDR',
  pamplona: 'PNA',
}

const SIGLA_GERAL = 'ESP'

function normalizar(cidade: string): string {
  return cidade
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\bcapital\b/g, '')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function siglaDaCidade(cidade: string): string {
  return SIGLAS[normalizar(cidade)] ?? SIGLA_GERAL
}

const FIXAS = ['#morarnaespanha', '#brasileirosnaespanha', '#vidanaespanha', '#espanha', '#vivirenespaña']

const POR_OPERACAO: Record<Anuncio['operacao'], string[]> = {
  aluguel: ['#aluguelnaespanha', '#alugarnaespanha'],
  venda: ['#comprarimovelnaespanha', '#imoveisnaespanha'],
}

export function hashtags(anuncio: Anuncio): string[] {
  const cidade = normalizar(anuncio.cidade).replace(/ /g, '')
  const daCidade = cidade ? [`#${cidade}`, `#brasileirosem${cidade}`, `#morarem${cidade}`] : []
  return [...FIXAS, ...POR_OPERACAO[anuncio.operacao], ...daCidade]
}
