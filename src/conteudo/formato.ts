import type { Anuncio } from '../tipos.ts'

export function formatarPreco(anuncio: Anuncio): string {
  const valor = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(anuncio.preco)
  return anuncio.operacao === 'aluguel' ? `${valor} €/mês` : `${valor} €`
}

export function maiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function plural(quantidade: number, singular: string, noPlural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : noPlural}`
}

// "Apartamento de 2 quartos"
export function tipoComQuartos(anuncio: Anuncio): string {
  const tipo = maiuscula(anuncio.tipo)
  return anuncio.quartos ? `${tipo} de ${plural(anuncio.quartos, 'quarto', 'quartos')}` : tipo
}

// "Chamberí, Madrid"
export function localizacao(anuncio: Anuncio): string {
  return anuncio.bairro && anuncio.bairro !== anuncio.cidade
    ? `${anuncio.bairro}, ${anuncio.cidade}`
    : anuncio.cidade
}

export function encurtar(texto: string, maximo: number): string {
  return texto.length <= maximo ? texto : `${texto.slice(0, maximo - 1).trimEnd()}…`
}
