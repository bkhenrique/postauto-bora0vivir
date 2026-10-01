export type Portal = 'fotocasa' | 'idealista' | 'manual'

export type Operacao = 'aluguel' | 'venda'

export type Anuncio = {
  portal: Portal
  idNoPortal: string
  url: string
  operacao: Operacao
  tipo: string
  titulo: string
  descricao: string
  preco: number
  cidade: string
  bairro?: string
  quartos?: number
  banheiros?: number
  areaM2?: number
  andar?: string
  extras: string[]
  fotos: string[]
  anunciante: { nome?: string; telefone?: string; tipo?: 'agencia' | 'particular' }
}

export type StatusImovel =
  | 'capturado'
  | 'aguardando_aprovacao'
  | 'publicado'
  | 'cancelado'
  | 'falhou'
  | 'arquivado'

export type Imovel = {
  id: number
  codigo: string
  portal: Portal
  idNoPortal: string
  url: string
  anuncio: Anuncio
  texto: string | null
  legenda: string | null
  fotos: string[]
  status: StatusImovel
  igMediaId: string | null
  igPermalink: string | null
  erro: string | null
  criadoEm: string
  publicadoEm: string | null
}
