# Bora Vivir — automação do Instagram Vivir en España

Recebe o link de um anúncio (Fotocasa, Idealista), monta um post em português com fotos, texto e código de referência, publica no Instagram e registra tudo num grupo de WhatsApp de controle.

Objetivo de negócio: captar clientes para o serviço de relocation. O interessado chama citando o código do post, e só você sabe qual é o anúncio original.

## Como usar

Requisitos: Node 22.13 ou mais novo e Google Chrome instalado.

```bash
npm install
npx playwright install chromium
cp .env.example .env   # e preencha
```

### Pelo terminal

```bash
npm run previa -- "<link do anúncio>"           # captura e gera a prévia em saida/<código>/
npm run previa -- "<link>" --sem-ia             # legenda só com os dados, sem chamar o modelo
npm run previa -- --manual anuncio.json         # anúncio preenchido à mão
npx tsx src/cli.ts refazer MAD-0001 mais curto  # outra legenda
npm run publicar -- MAD-0001                    # publica no Instagram
npm run lista
```

A prévia fica em `saida/<código>/`: `01.jpg` é a capa, as demais são os slides, e `legenda.txt` é o texto do post.

Na captura, uma janela do Chrome abre sozinha. Os portais bloqueiam navegador invisível; se aparecer um captcha, resolva na janela e a captura continua.

### Pelo WhatsApp

```bash
npm run bot
```

Na primeira vez aparece um QR code: escaneie com o WhatsApp do número do bot. Depois mande `!id` no grupo de controle, copie o id para `WHATSAPP_GRUPO_ID` no `.env` e reinicie. A partir daí, cole o link no grupo e responda `ok`, `refazer` ou `cancelar`. `ajuda` lista os comandos.

## O que cada integração precisa

| Para | Variáveis no `.env` | Situação |
| --- | --- | --- |
| Gerar a legenda | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | Funcionando |
| Publicar | `INSTAGRAM_TOKEN`, `INSTAGRAM_USUARIO_ID`, `ARMAZENAMENTO_*` | Funcionando |
| Bot | `WHATSAPP_GRUPO_ID` | Funcionando |

## Documentos de planejamento

| Doc | Conteúdo |
| --- | --- |
| [01 — Visão geral](docs/01-visao-geral.md) | Objetivo, fluxo ponta a ponta, o que entra e o que fica fora |
| [02 — Arquitetura](docs/02-arquitetura.md) | Stack, módulos, estrutura de pastas, banco de dados |
| [03 — Captura de anúncios](docs/03-captura-anuncios.md) | Como extrair fotos e dados de cada portal, e os limites disso |
| [04 — Geração de conteúdo](docs/04-geracao-conteudo.md) | Código de referência, legenda em português, tratamento das fotos |
| [05 — Instagram](docs/05-instagram.md) | Requisitos da conta, API de publicação, limites |
| [06 — WhatsApp](docs/06-whatsapp.md) | Grupo de controle, aprovação, mensagem de registro |
| [07 — Roadmap](docs/07-roadmap.md) | Fases de entrega e o que já foi feito |
| [08 — Riscos e decisões](docs/08-riscos-e-decisoes.md) | O que pode dar errado e o que você precisa decidir |
| [09 — Insta-Zap](docs/09-insta-zap-saas.md) | Plano para transformar o projeto em SaaS: painéis, planos, custos, arquitetura |

A ideia original está em [IEDEA.md](IEDEA.md).
