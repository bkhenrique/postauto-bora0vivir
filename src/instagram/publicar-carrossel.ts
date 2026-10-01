import { config } from '../config.ts'
import { chamar, InstagramError } from './cliente.ts'

const ESPERA_ENTRE_CONSULTAS_MS = 3_000
const MAXIMO_DE_CONSULTAS = 40

type Criado = { id: string }

async function aguardarPronto(conteinerId: string): Promise<void> {
  for (let tentativa = 0; tentativa < MAXIMO_DE_CONSULTAS; tentativa++) {
    const { status_code: status } = await chamar<{ status_code: string }>('GET', conteinerId, {
      fields: 'status_code',
    })
    if (status === 'FINISHED') return
    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new InstagramError(`O Instagram não conseguiu processar as imagens (status ${status}).`)
    }
    await new Promise((resolver) => setTimeout(resolver, ESPERA_ENTRE_CONSULTAS_MS))
  }
  throw new InstagramError('O Instagram demorou demais para processar as imagens.')
}

export async function criarCarrossel(urlsDasFotos: string[], legenda: string): Promise<string> {
  const { usuarioId } = config.instagram()

  const itens: string[] = []
  for (const url of urlsDasFotos) {
    const item = await chamar<Criado>('POST', `${usuarioId}/media`, { image_url: url, is_carousel_item: true })
    itens.push(item.id)
  }

  const carrossel = await chamar<Criado>('POST', `${usuarioId}/media`, {
    media_type: 'CAROUSEL',
    children: itens.join(','),
    caption: legenda,
  })
  await aguardarPronto(carrossel.id)
  return carrossel.id
}

export async function publicarConteiner(conteinerId: string): Promise<string> {
  const { usuarioId } = config.instagram()
  const publicado = await chamar<Criado>('POST', `${usuarioId}/media_publish`, { creation_id: conteinerId })
  return publicado.id
}

export async function linkDoPost(mediaId: string): Promise<string> {
  const { permalink } = await chamar<{ permalink: string }>('GET', mediaId, { fields: 'permalink' })
  return permalink
}
