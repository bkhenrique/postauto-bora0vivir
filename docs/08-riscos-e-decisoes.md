# 08 — Riscos e decisões

## Riscos

### 1. Direito de uso das fotos e dos textos

É o risco mais sério e não é técnico.

As fotos de um anúncio pertencem ao fotógrafo, à imobiliária ou ao proprietário. Republicar no seu Instagram sem autorização é uso de conteúdo de terceiro. Consequências possíveis:

- Denúncia de direitos autorais no Instagram: o post é removido, e denúncias repetidas derrubam a conta — que é justamente o ativo que o projeto quer fazer crescer.
- Reclamação da imobiliária, que vê o próprio imóvel anunciado por outra pessoa captando o cliente dela.
- Os termos de uso do Idealista e do Fotocasa proíbem extração e reutilização do conteúdo.

Também há o lado comercial: anunciar um imóvel que você não representa pode ser entendido como publicidade enganosa se o post der a entender que o imóvel é seu.

Formas de reduzir, da mais segura para a menos:

1. **Parceria com imobiliárias e proprietários.** Você pede autorização para divulgar e leva clientes brasileiros até eles. O sistema fica igual; o que muda é que só entram anúncios de parceiros. Transforma o risco em canal de negócio e tende a render comissão.
2. **Autorização por anúncio.** Mensagem padrão ao anunciante antes de publicar. O sistema pode ter um status `aguardando_autorizacao`.
3. **Publicar sem autorização**, deixando claro na legenda que é uma curadoria de imóveis disponíveis no mercado e que a disponibilidade depende do anunciante, e removendo na hora qualquer post contestado.

Isto não é parecer jurídico. Antes de ganhar escala, vale uma consulta com advogado na Espanha sobre propriedade intelectual e publicidade imobiliária.

### 2. Bloqueio de captura no Idealista

Provável e recorrente. A resposta é a estratégia em três níveis de [03 — Captura de anúncios](03-captura-anuncios.md), com a extensão de navegador como caminho confiável.

### 3. Banimento do número de WhatsApp

Conexão não oficial. Mitigação: número secundário, volume baixo, só um grupo. Plano B: Telegram.

### 4. Legenda com informação errada

O modelo pode afirmar algo que o anúncio não diz. Mitigação: gerar a partir de dados estruturados, validar preço e código automaticamente, e manter a aprovação manual.

### 5. Post de imóvel que não existe mais

Gera contato frustrado e passa imagem ruim. Mitigação: aviso de disponibilidade na legenda e verificação periódica dos links.

### 6. Perfil com cara de spam

Muitos posts iguais derrubam o alcance. Mitigação: 1 a 3 posts por dia, variação de texto, e intercalar com conteúdo próprio sobre a vida na Espanha.

### 7. Mudança nas APIs e nos portais

A Meta muda regras de API e os portais mudam o HTML. Mitigação: módulos isolados, alerta no grupo quando algo falha, HTML salvo nas falhas de captura.

## Decisões que são suas

| # | Decisão | Recomendação |
| --- | --- | --- |
| 1 | Publicar com ou sem autorização do anunciante | Começar por parceria com algumas imobiliárias |
| 2 | Aprovar cada post antes de publicar, ou publicar direto | Aprovar sempre, pelo menos no início |
| 3 | WhatsApp não oficial ou Telegram para o controle | WhatsApp com número secundário, como você pediu; Telegram de reserva |
| 4 | Aluguel, venda ou os dois | Aluguel primeiro: é o que quem está chegando procura |
| 5 | Quais cidades | Duas ou três onde você atende de fato |
| 6 | Onde roda | Na sua máquina nas fases 1 a 3; VPS a partir da fase 4 |
| 7 | Mostrar o preço no post | Sim; post sem preço gera pergunta e pouca conversão |
| 8 | Formato do código | `MAD-0042` (cidade + sequência) |

A decisão 1 é a única que muda o desenho do sistema. As outras têm um padrão razoável e podem ser ajustadas depois.

## Custos estimados

Ordem de grandeza mensal para uso pessoal, a confirmar na contratação:

- Claude Sonnet 4.6 no Amazon Bedrock: cerca de US$ 0,03 por legenda, uns US$ 4 por mês com 150 gerações. Endpoint regional (ex.: só Europa) custa 10% a mais que o global.
- Cloudflare R2: gratuito ou quase, nesse volume.
- VPS pequena: alguns euros por mês, a partir da fase 4.
- Chip secundário de WhatsApp.
- APIs do Instagram: gratuitas.
