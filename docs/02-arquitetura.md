# 02 — Arquitetura

## Stack recomendada

| Peça | Escolha | Motivo |
| --- | --- | --- |
| Linguagem | Node.js + TypeScript | As melhores bibliotecas de WhatsApp e de automação de navegador são Node |
| Captura | Playwright | Os portais renderizam com JavaScript e bloqueiam requisição HTTP simples |
| Imagens | sharp | Corte, redimensionamento e capa com texto |
| Texto | Claude Sonnet 4.6 via Amazon Bedrock (perfil `global.anthropic.claude-sonnet-4-6`) | Legenda em português a partir dos dados estruturados do anúncio |
| Banco | SQLite embutido do Node (`node:sqlite`) | Um usuário, um processo, zero infraestrutura e nenhuma dependência nativa |
| Hospedagem das fotos | Bucket S3 ou Cloudflare R2 | O Instagram só aceita imagem por URL pública |
| Instagram | Instagram API com login do Instagram | API oficial de publicação |
| WhatsApp | Baileys (ou Evolution API) | Única forma prática de ler e escrever em grupo |
| Execução | Um processo Node sempre ligado, em Docker | O WhatsApp precisa de conexão permanente |

## Módulos

Cada módulo tem uma responsabilidade e não conhece os outros; quem liga tudo é o pipeline.

```
src/
  cli.ts                   comandos de terminal (previa, refazer, publicar, lista...)
  index.ts                 sobe o bot do WhatsApp
  config.ts                variáveis de ambiente
  tipos.ts                 Anuncio e Imovel
  pipeline/
    processar-link.ts      captura → registro → conteúdo → prévia
    publicar.ts            upload das fotos → Instagram
  captura/
    index.ts               escolhe o adaptador pelo domínio do link
    fotocasa.ts
    idealista.ts
    manual.ts              anúncio preenchido à mão (JSON)
    navegador.ts           sessão do Playwright
  conteudo/
    codigo-referencia.ts
    cidades.ts             siglas e hashtags por cidade
    texto-ia.ts            prompt e chamada ao modelo
    legenda.ts             monta e valida a legenda final
    imagens.ts             download e ajuste ao formato do feed
    capa.ts                primeiro slide, com preço e código
    formato.ts
  instagram/
    cliente.ts             chamadas à API
    publicar-carrossel.ts
    token.ts               renovação do token
  whatsapp/
    conexao.ts             sessão e reconexão
    comandos.ts            interpreta as mensagens do grupo
    atendimento.ts         executa cada comando
    mensagens.ts           textos de prévia e de registro
  armazenamento/
    banco.ts               schema
    imoveis.ts             consultas
    arquivos.ts            upload das fotos
```

Regra do projeto: nenhum arquivo passa de 500 linhas.

## Formato comum de anúncio

Todo adaptador de portal devolve a mesma estrutura, para que o resto do sistema não saiba de qual portal veio:

```ts
type Anuncio = {
  portal: 'idealista' | 'fotocasa'
  idNoPortal: string
  url: string
  operacao: 'aluguel' | 'venda'
  tipo: string            // piso, ático, estudio, casa...
  titulo: string
  descricao: string       // original, em espanhol
  preco: number
  cidade: string
  bairro?: string
  quartos?: number
  banheiros?: number
  areaM2?: number
  andar?: string
  extras: string[]        // elevador, terraza, amueblado, calefacción...
  fotos: string[]         // URLs originais
  anunciante: { nome?: string; telefone?: string; tipo?: 'agencia' | 'particular' }
}
```

## Banco de dados

**imoveis**

| Campo | Observação |
| --- | --- |
| id | |
| codigo | único, ex.: `MAD-0042` |
| portal, id_no_portal | únicos em conjunto — é o que impede publicar duas vezes |
| url | link original |
| anuncio | JSON com o anúncio capturado |
| texto | título e parágrafos escritos pelo modelo |
| fotos | JSON com os caminhos dos slides prontos |
| legenda | texto final publicado |
| status | `capturado`, `aguardando_aprovacao`, `publicado`, `cancelado`, `falhou`, `arquivado` |
| ig_media_id, ig_permalink | preenchidos após publicar |
| erro | última falha, se houver |
| criado_em, publicado_em | |

**sequencias**: último número usado por sigla de cidade. **chaves**: valores que o sistema renova sozinho, como o token do Instagram.

**contatos** (fase posterior): `imovel_id`, `nome`, `canal`, `data`, `observacao` — para medir quantos leads cada post gerou.

## Estados de um imóvel

```
capturado → aguardando_aprovacao → publicado → arquivado
                    │                   
                    ├→ cancelado
                    └→ falhou (pode tentar de novo)
```

Cada etapa grava o status antes de avançar. Se o processo cair no meio, ao voltar ele sabe de onde continuar e não publica em dobro.

## Segredos

Ficam em `.env`, fora do repositório: credenciais da AWS (Bedrock), token do Instagram, credenciais do bucket das fotos, id do grupo de WhatsApp. A sessão do WhatsApp fica numa pasta própria, também fora do repositório.
