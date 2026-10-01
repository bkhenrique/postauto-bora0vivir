import type { Anuncio } from '../tipos.ts'
import { hashtags } from './cidades.ts'
import { formatarPreco, localizacao, plural, tipoComQuartos } from './formato.ts'

const LIMITE_CARACTERES = 2200
const LIMITE_HASHTAGS = 30
const MAXIMO_EXTRAS = 5

// Extras conhecidos, do espanhol dos portais para a linha de destaques da legenda.
const EXTRAS: [RegExp, string][] = [
  [/ascensor/i, '🛗 Elevador'],
  [/amueblado/i, '🛋 Mobiliado'],
  [/terraza/i, '☀️ Terraço'],
  [/balc[oó]n/i, '🌇 Varanda'],
  [/aire acondicionado/i, '❄️ Ar-condicionado'],
  [/calefacci[oó]n/i, '🔥 Aquecimento'],
  [/parking|garaje/i, '🚗 Garagem'],
  [/piscina/i, '🏊 Piscina'],
  [/jard[ií]n/i, '🌳 Jardim'],
  [/cocina equipada/i, '🍳 Cozinha equipada'],
  [/electrodom[eé]sticos/i, '🔌 Eletrodomésticos'],
  [/trastero/i, '📦 Depósito'],
  [/armarios/i, '🚪 Armários embutidos'],
]

function linhaDeMedidas(anuncio: Anuncio): string {
  return [
    anuncio.areaM2 ? `📐 ${anuncio.areaM2} m²` : '',
    anuncio.quartos ? `🛏 ${plural(anuncio.quartos, 'quarto', 'quartos')}` : '',
    anuncio.banheiros ? `🚿 ${plural(anuncio.banheiros, 'banheiro', 'banheiros')}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function linhaDeExtras(anuncio: Anuncio): string {
  // "No amueblado" também contém "amueblado"; negativas ficam de fora.
  const positivos = anuncio.extras.filter((extra) => !/^no\s/i.test(extra.trim()))
  const achados = EXTRAS.filter(([padrao]) => positivos.some((extra) => padrao.test(extra))).map(
    ([, rotulo]) => rotulo,
  )
  return achados.slice(0, MAXIMO_EXTRAS).join(' · ')
}

export function tituloPadrao(anuncio: Anuncio): string {
  return `🏡 ${tipoComQuartos(anuncio)} em ${localizacao(anuncio)}`
}

// O modelo só escreve título e parágrafos. Preço, medidas, código e chamada são montados aqui,
// para nunca dependerem do que o modelo decidiu escrever.
export function montarLegenda(anuncio: Anuncio, codigo: string, texto: string): string {
  const [titulo = tituloPadrao(anuncio), ...resto] = texto.trim().split('\n')
  const paragrafos = resto.join('\n').trim()

  const blocos = [
    titulo.trim(),
    [`💶 ${formatarPreco(anuncio)}`, linhaDeMedidas(anuncio), linhaDeExtras(anuncio)].filter(Boolean).join('\n'),
    paragrafos,
    `📌 REF: ${codigo}\nDisponibilidade sujeita a confirmação.`,
    [
      'Quer morar na Espanha? A gente cuida da sua mudança do começo ao fim: busca de imóvel, documentação, visitas e contrato.',
      `📩 Manda "${codigo}" no direct.`,
    ].join('\n'),
    hashtags(anuncio).join(' '),
  ]
  return blocos.filter(Boolean).join('\n\n')
}

export function problemasDaLegenda(legenda: string, anuncio: Anuncio, codigo: string): string[] {
  const problemas: string[] = []
  if (legenda.length > LIMITE_CARACTERES) problemas.push(`passou de ${LIMITE_CARACTERES} caracteres`)
  if ((legenda.match(/#/g) ?? []).length > LIMITE_HASHTAGS) problemas.push(`passou de ${LIMITE_HASHTAGS} hashtags`)
  if (!legenda.includes(codigo)) problemas.push('está sem o código de referência')
  if (/https?:\/\/|www\./i.test(legenda)) problemas.push('contém um link')
  if (/idealista|fotocasa/i.test(legenda)) problemas.push('cita o portal')

  const anunciante = anuncio.anunciante.nome?.trim()
  if (anunciante && anunciante.length > 3 && legenda.toLowerCase().includes(anunciante.toLowerCase())) {
    problemas.push('cita o anunciante')
  }
  return problemas
}
