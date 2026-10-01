import { gravarChave, lerChave } from '../armazenamento/banco.ts'
import { config } from '../config.ts'

const CHAVE = 'instagram_token'
const DIAS_PARA_RENOVAR = 30
const UM_DIA_MS = 24 * 60 * 60 * 1000

// O token de longa duração vale 60 dias. A versão renovada fica no banco e passa a valer
// no lugar da que está no .env, que só serve de ponto de partida.
export async function tokenAtual(): Promise<string> {
  const guardado = lerChave(CHAVE)
  if (!guardado) {
    const inicial = config.instagram().token
    gravarChave(CHAVE, inicial)
    return inicial
  }

  const idadeEmDias = (Date.now() - Date.parse(`${guardado.atualizadoEm}Z`)) / UM_DIA_MS
  if (idadeEmDias < DIAS_PARA_RENOVAR) return guardado.valor

  try {
    return await renovar(guardado.valor)
  } catch (erro) {
    console.warn(`Não consegui renovar o token do Instagram: ${erro instanceof Error ? erro.message : erro}`)
    return guardado.valor
  }
}

async function renovar(token: string): Promise<string> {
  const url = new URL('https://graph.instagram.com/refresh_access_token')
  url.searchParams.set('grant_type', 'ig_refresh_token')
  url.searchParams.set('access_token', token)

  const resposta = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  const dados = (await resposta.json()) as { access_token?: string; error?: { message?: string } }
  if (!resposta.ok || !dados.access_token) throw new Error(dados.error?.message ?? `HTTP ${resposta.status}`)

  gravarChave(CHAVE, dados.access_token)
  return dados.access_token
}
