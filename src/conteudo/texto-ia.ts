import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk'
import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.ts'
import type { Anuncio } from '../tipos.ts'

const SISTEMA = `Você escreve posts para o Instagram "Vivir en España", que mostra imóveis na Espanha para brasileiros que querem se mudar para lá.

Você recebe os dados de um anúncio e devolve só duas partes, separadas por uma linha em branco:

1. Um título de uma linha, começando com um emoji, com o tipo do imóvel, o bairro e a cidade.
2. Dois ou três parágrafos curtos destacando o melhor do imóvel e, se souber, como é a região para quem está chegando.

Regras:
- Português do Brasil, tom próximo e direto, de quem conhece a cidade. Sem exagero de corretor ("imperdível", "oportunidade única").
- Só afirme o que está nos dados. Se um item não aparece, não mencione. Nunca invente metragem, transporte, comodidades ou distâncias.
- A descrição original vem em espanhol e serve como fonte de fatos; não a traduza frase a frase.
- Quando aparecer um termo que brasileiro recém-chegado não conhece (ático, fianza, gastos de comunidad, empadronamiento), explique em poucas palavras.
- Não cite preço nem código de referência: eles entram depois, automaticamente.
- Não cite o portal, a imobiliária, o anunciante, telefone, link nem o endereço exato (rua e número). Bairro e cidade podem.
- Emojis com moderação, no máximo um por parágrafo.
- Sem hashtags, sem chamada para ação e sem assinatura: isso também entra depois.
- No máximo 600 caracteres somando título e parágrafos.

Responda apenas com o título e os parágrafos, sem comentários antes ou depois.`

let cliente: AnthropicBedrock | undefined

function dadosParaOModelo(anuncio: Anuncio): string {
  const { tipo, operacao, cidade, bairro, quartos, banheiros, areaM2, andar, extras, descricao } = anuncio
  return JSON.stringify(
    { tipo, operacao, cidade, bairro, quartos, banheiros, areaM2, andar, extras, descricaoOriginal: descricao },
    null,
    2,
  )
}

export type Revisao = { textoAnterior: string; instrucao: string }

export async function gerarTexto(anuncio: Anuncio, revisao?: Revisao): Promise<string> {
  cliente ??= new AnthropicBedrock({ awsRegion: config.ia.regiao })

  const mensagens: Anthropic.MessageParam[] = [{ role: 'user', content: dadosParaOModelo(anuncio) }]
  if (revisao) {
    mensagens.push(
      { role: 'assistant', content: revisao.textoAnterior },
      { role: 'user', content: `Reescreva seguindo as mesmas regras. Ajuste pedido: ${revisao.instrucao}` },
    )
  }

  let resposta: Anthropic.Message
  try {
    resposta = await cliente.messages.create({
      model: config.ia.modelo,
      max_tokens: 16000,
      output_config: { effort: config.ia.esforco },
      system: SISTEMA,
      messages: mensagens,
    })
  } catch (erro) {
    if (erro instanceof Anthropic.PermissionDeniedError) {
      throw new Error(
        `A conta AWS não tem acesso ao modelo ${config.ia.modelo}. Libere os modelos da Anthropic no console do Bedrock. Detalhe: ${erro.message}`,
      )
    }
    if (erro instanceof Anthropic.AuthenticationError) {
      throw new Error('Credenciais da AWS inválidas. Confira AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY no .env.')
    }
    if (erro instanceof Anthropic.APIError) {
      throw new Error(`Falha ao gerar a legenda (${erro.status ?? 'sem status'}): ${erro.message}`)
    }
    throw erro
  }

  if (resposta.stop_reason === 'refusal') throw new Error('O modelo recusou gerar a legenda deste anúncio.')
  if (resposta.stop_reason === 'max_tokens') throw new Error('A legenda foi cortada antes de terminar.')

  const texto = resposta.content
    .filter((bloco): bloco is Anthropic.TextBlock => bloco.type === 'text')
    .map((bloco) => bloco.text)
    .join('')
    .trim()
  if (!texto) throw new Error('O modelo devolveu uma legenda vazia.')
  return texto
}
