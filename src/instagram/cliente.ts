import { config } from '../config.ts'
import { tokenAtual } from './token.ts'

const HOST = 'https://graph.instagram.com'

export class InstagramError extends Error {}

type Parametros = Record<string, string | boolean>

export async function chamar<T>(metodo: 'GET' | 'POST', caminho: string, parametros: Parametros = {}): Promise<T> {
  const { versao } = config.instagram()
  const url = new URL(`${HOST}/${versao}/${caminho}`)
  const cabecalhos: Record<string, string> = { Authorization: `Bearer ${await tokenAtual()}` }

  let corpo: string | undefined
  if (metodo === 'GET') {
    for (const [nome, valor] of Object.entries(parametros)) url.searchParams.set(nome, String(valor))
  } else {
    cabecalhos['Content-Type'] = 'application/json'
    corpo = JSON.stringify(parametros)
  }

  const resposta = await fetch(url, { method: metodo, headers: cabecalhos, body: corpo, signal: AbortSignal.timeout(60_000) })
  const dados = (await resposta.json().catch(() => ({}))) as T & { error?: { message?: string; code?: number } }

  if (!resposta.ok || dados.error) {
    const detalhe = dados.error?.message ?? `HTTP ${resposta.status}`
    throw new InstagramError(`Instagram recusou ${metodo} ${caminho}: ${detalhe}`)
  }
  return dados
}
