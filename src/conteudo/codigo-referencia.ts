import { proximoNumero } from '../armazenamento/imoveis.ts'
import { siglaDaCidade } from './cidades.ts'

const FORMATO = /\b[A-Z]{3}-\d{4,}\b/

export function gerarCodigo(cidade: string): string {
  const sigla = siglaDaCidade(cidade)
  return `${sigla}-${String(proximoNumero(sigla)).padStart(4, '0')}`
}

export function acharCodigo(texto: string): string | undefined {
  return texto.toUpperCase().match(FORMATO)?.[0]
}
