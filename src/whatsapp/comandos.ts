import { acharCodigo } from '../conteudo/codigo-referencia.ts'

export type Comando =
  | { tipo: 'link'; url: string }
  | { tipo: 'aprovar'; codigo?: string }
  | { tipo: 'refazer'; codigo?: string; instrucao: string }
  | { tipo: 'cancelar'; codigo?: string }
  | { tipo: 'arquivar'; codigo: string }
  | { tipo: 'consulta'; codigo: string }
  | { tipo: 'lista' }
  | { tipo: 'id' }
  | { tipo: 'ajuda' }

const LINK = /https?:\/\/\S+/i

// Devolve undefined para conversa comum do grupo, que o bot deve ignorar.
export function interpretar(mensagem: string): Comando | undefined {
  const texto = mensagem.trim()
  const url = texto.match(LINK)?.[0]
  if (url) return { tipo: 'link', url }

  const codigo = acharCodigo(texto)
  const semCodigo = (codigo ? texto.replace(new RegExp(codigo, 'i'), '') : texto).trim()
  const [primeira = '', ...resto] = semCodigo.split(/\s+/)

  switch (primeira.toLowerCase()) {
    case 'ok':
    case 'publicar':
      return resto.length === 0 ? { tipo: 'aprovar', codigo } : undefined
    case 'refazer':
      return { tipo: 'refazer', codigo, instrucao: resto.join(' ') }
    case 'cancelar':
      return resto.length === 0 ? { tipo: 'cancelar', codigo } : undefined
    case 'arquivar':
      return codigo ? { tipo: 'arquivar', codigo } : undefined
    case 'lista':
      return { tipo: 'lista' }
    case '!id':
      return { tipo: 'id' }
    case 'ajuda':
      return { tipo: 'ajuda' }
    case '':
      return codigo ? { tipo: 'consulta', codigo } : undefined
    default:
      return undefined
  }
}
