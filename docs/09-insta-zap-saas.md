# 09 — Insta-Zap: plano do SaaS

Transformar o que já funciona no Bora Vivir num produto para outros negócios: o cliente manda fotos e uma descrição curta pelo WhatsApp e recebe o post pronto no próprio Instagram.

## O produto em uma frase

"Mande as fotos e duas linhas no WhatsApp; a gente monta a capa, escreve a legenda e publica no seu Instagram."

## Como o cliente usa

1. Cria a conta no painel, escolhe o ramo e configura a marca (nome, logo, cores, chamada final).
2. Conecta o Instagram com um clique (login do Instagram) e cadastra o número de WhatsApp dele.
3. No WhatsApp, manda as fotos e um texto livre para o número do Insta-Zap.
4. Recebe a prévia, responde `ok`, `refazer` ou `cancelar`.
5. O post sai no Instagram dele e fica registrado no painel, com código de referência.

## Ramos

Cada ramo é um modelo: quais campos a IA extrai do texto, como é a capa, o tom da legenda e as hashtags.

| Ramo | Campos principais | Capa |
| --- | --- | --- |
| Imobiliário | tipo, operação, cidade, bairro, preço, quartos, área | preço e código |
| Veículos | marca, modelo, ano, km, preço | preço e código |
| Serviços (estética, reformas, eventos) | serviço, resultado, cidade | título e contato |
| Varejo e catálogo | produto, preço, tamanhos | preço |

Recomendação: lançar só com **imobiliário**. É o que já está pronto, o código de referência faz sentido ali e a mensagem de venda fica específica. Ramo novo entra quando houver cliente pedindo.

## O que muda em relação ao Bora Vivir

| Hoje | No SaaS |
| --- | --- |
| Entrada por link de portal | Entrada por fotos + descrição. Captura de portal fica fora: como serviço pago, o risco jurídico é alto |
| Um Instagram, token no `.env` | Um app na Meta, cada cliente conecta a própria conta; um token por cliente, cifrado no banco |
| WhatsApp não oficial num grupo | Um número central do Insta-Zap; o cliente é identificado pelo telefone cadastrado |
| SQLite local | Postgres no Railway, com `cliente_id` em todas as tabelas |
| Marca fixa no código | Marca, capa e chamada por cliente |
| Sem limite de uso | Limites por plano e medição de custo por cliente |

O que se reaproveita: montagem de capa e slides, geração de legenda, publicação de carrossel, comandos do chat e código de referência.

## Arquitetura

```
 WhatsApp do cliente ──► número central ──► webhook
                                               │
 Painel (Next.js na Vercel) ──► API ───────────┤
                                               ▼
                            Backend Node/TS (Docker no Coolify)
                             ├─ fila de trabalhos (prévia, publicação)
                             ├─ IA (Claude no Bedrock)
                             ├─ Instagram (um token por cliente)
                             ├─ Postgres (Railway)
                             └─ S3 (fotos, apagadas após publicar)
```

- **Frontend**: Next.js na Vercel, com duas áreas: painel do cliente e painel administrativo.
- **Backend**: Node + TypeScript em Docker no Coolify, com volume persistente. Expõe a API do painel e recebe o webhook do WhatsApp.
- **Banco**: Postgres no Railway. Escolher a região mais próxima do servidor do Coolify, porque backend e banco em provedores diferentes somam latência a cada consulta; ativar os backups automáticos.
- **Fila**: prévia e publicação rodam em segundo plano, com nova tentativa em caso de falha. Uma fila em cima do próprio Postgres basta no início.
- **Autenticação**: e-mail e senha ou link mágico; administradores separados dos clientes.

### WhatsApp: a decisão mais importante

| Opção | Como é | Avaliação |
| --- | --- | --- |
| Número central com a API oficial (WhatsApp Cloud API) | O cliente fala em conversa privada com o número do Insta-Zap | **Recomendada.** Sem risco de banimento. O cliente sempre inicia a conversa, e respostas dentro da janela de 24 horas, pela regra atual, não são cobradas (confirmar ao contratar). Exige verificação da empresa na Meta |
| Número central não oficial (Baileys) | Igual, mas pela conexão que usamos hoje | Serve para o piloto. Se o número for banido, o serviço inteiro cai |
| Cada cliente conecta o próprio WhatsApp | Uma sessão por cliente | Não recomendada: pesada, frágil e arriscada para o número do cliente |

### Instagram

- Um único app na Meta. O cliente clica em "Conectar Instagram", faz login e autoriza.
- O token de cada conta fica cifrado no banco e é renovado automaticamente.
- Para atender contas de terceiros, o app precisa ser **publicado** e passar pela **análise da Meta** para a permissão de publicação, com verificação da empresa, política de privacidade, termos de uso e página de exclusão de dados.
- É o item de maior prazo e o único que não depende de nós. Começar antes de tudo.

## Vídeo

Dá para aceitar vídeo, e a API do Instagram cobre os dois formatos:

- **Vídeo dentro do carrossel**, misturado com fotos (até 10 itens no total).
- **Reels**, quando o cliente manda um vídeo só.

O que muda em relação a foto:

- **Qualidade**: o WhatsApp comprime o vídeo, e a API oficial limita o arquivo a cerca de 16 MB. Para vídeo melhor, o painel precisa de um envio direto pelo navegador.
- **Formato**: o Instagram exige MP4 ou MOV em H.264 com áudio AAC. Vídeo fora do padrão precisa ser convertido no servidor (ffmpeg), o que pesa em processamento.
- **Tempo**: a Meta demora mais para processar vídeo; a fila precisa esperar e avisar o cliente.
- **Capa**: no Reels, a capa com preço e código vira a imagem de capa do vídeo; não dá para escrever por cima do vídeo sem reprocessá-lo.
- **Legenda**: a IA escreve a partir da descrição do cliente; ela não assiste ao vídeo.
- **Custo**: armazenamento e tráfego maiores que foto, ainda pequenos se o arquivo for apagado após publicar.

Recomendação: lançar só com fotos e incluir vídeo na fase 5, começando pelo vídeo dentro do carrossel, que reaproveita quase todo o fluxo. Vale contar um Reels como uma publicação normal no plano.

## Planos e contagem de uso

A unidade vendida é a **publicação**. Prévia e correção custam IA mesmo quando nada é publicado, então também precisam de teto.

| Evento | Regra proposta |
| --- | --- |
| Publicação | Conta 1 do plano. No período de teste também conta |
| Prévia (rascunho) | Limite mensal de 2 vezes o número de publicações do plano |
| Correção (`refazer`) | Até 2 por prévia |
| Prévia cancelada ou abandonada | Conta como prévia |
| Sobra do mês | Não acumula |

Ao bater o limite, o bot responde com o aviso e o link de upgrade.

### Período de teste

- 10 dias.
- Limite sugerido: 5 publicações e 10 prévias.
- Sem esse teto, o teste vira uso gratuito e gera custo de IA sem retorno.
- Ao final: escolhe um plano ou a conta fica pausada, sem perder o histórico.

### Custo de IA por post

Estimativas com os preços de tabela da Anthropic e contagem de tokens suposta (legenda com cerca de 1.500 tokens de entrada e 1.500 de saída; extração dos campos com 800 e 300). O valor real precisa ser medido.

| Modelo | Extração | Legenda ou correção | Publicação típica (1 prévia + 1 correção) |
| --- | --- | --- | --- |
| Claude Haiku 4.5 | US$ 0,002 | US$ 0,009 | cerca de US$ 0,02 |
| Claude Sonnet 5.5 | US$ 0,005 | US$ 0,018 | cerca de US$ 0,04 |
| Claude Sonnet 4.6 | US$ 0,007 | US$ 0,027 | cerca de US$ 0,06 |

Pior caso num plano de 30 publicações, com o cliente usando todas as 60 prévias e 2 correções em cada: cerca de US$ 5 no Sonnet 4.6 e US$ 1,60 no Haiku 4.5. O teto de prévias é o que mantém esse número previsível.

O sistema deve **gravar os tokens de cada chamada** por cliente. Com isso o painel administrativo mostra custo real e margem por conta, em vez de estimativa.

### Outros custos

- Servidor no Coolify, banco e Vercel: fixos, independem do número de posts.
- Armazenamento das fotos: desprezível, com exclusão após a publicação.
- Meio de pagamento: percentual por cobrança.
- Impostos e o seu tempo de suporte, que no começo é o maior custo.

### Estrutura de planos

Os preços abaixo são hipóteses para validar com clientes reais, não recomendação fechada.

| Plano | Publicações por mês | Prévias por mês | Brasil (hipótese) | Europa (hipótese) |
| --- | --- | --- | --- | --- |
| Teste (10 dias) | 5 | 10 | grátis | grátis |
| Essencial | 15 | 30 | R$ 59 | 15 € |
| Profissional | 40 | 80 | R$ 119 | 29 € |
| Agência | 120 | 240 | R$ 299 | 69 € |

### Duas moedas: real e euro

- O preço em euro **não é o real convertido**: cada mercado tem a sua tabela, definida pelo que o cliente de lá paga, e não pelo câmbio do dia.
- A moeda é fixada no cadastro, pelo país do cliente, e vale para o plano, as faturas e os recibos dele. Trocar depois só pelo administrador.
- Cada plano guarda um preço por moeda. Limites de uso são os mesmos nos dois mercados.
- No painel administrativo, recebido e a receber aparecem **separados por moeda**, com um total convertido só como referência. Somar real com euro direto distorce as métricas.
- O custo de IA é em dólar. A margem por cliente precisa converter as três moedas com uma cotação guardada no dia.
- **Idioma acompanha o mercado**: painel e mensagens do bot em português e espanhol, e a legenda no idioma que o cliente escolher. Cliente espanhol vai querer o post em espanhol.
- **Pagamento**: o meio escolhido precisa cobrar nas duas moedas, ou serão dois (um para Pix e boleto no Brasil, outro para cartão e débito na Europa). Enquanto a marcação for manual, isso não trava nada.
- **Impostos**: vender assinatura para clientes na Europa tem regras de IVA que dependem de onde a sua empresa está registrada e de o cliente ser empresa ou pessoa física. Vale conversar com o contador antes de cobrar o primeiro cliente europeu.

A IA representa poucos reais por cliente por mês em qualquer plano. A margem depende de custo fixo, suporte e inadimplência, e não do custo por post.

## Painel administrativo

**Clientes**
- Cadastro e edição: nome, contato, ramo, plano, valor combinado, vencimento.
- Situação: em teste, ativo, em atraso, pausado, cancelado.
- Uso do mês: publicações, prévias, correções, custo de IA.

**Financeiro**
- Lista de faturas por cliente, com marcação manual de "pago" e data.
- Depois: integração com meio de pagamento, que marca sozinho.

**Métricas**
- Recebido no mês e a receber, separados por moeda.
- Receita recorrente mensal.
- Contas ativas, em teste (com dias restantes) e em atraso.
- Conversão de teste em pagante e cancelamentos.
- Publicações no mês, custo de IA total e margem por cliente.
- Falhas de publicação e contas com Instagram desconectado.

**Operação**
- Planos e limites editáveis.
- Pausar e reativar conta.
- Ver as últimas mensagens e erros de um cliente, para suporte.

## Painel do cliente

- **Primeiros passos**: lista de verificação com ramo, marca, Instagram e WhatsApp.
- **Marca**: nome, logo, cores da capa, chamada final, hashtags fixas, prefixo do código.
- **Instagram**: conectar, ver a conta conectada, reconectar se o token cair.
- **WhatsApp**: números autorizados a publicar pela conta.
- **Uso**: publicações e prévias usadas no mês, com o que resta.
- **Posts**: histórico com código, data, link do post e anotações.
- **Plano e faturas**: plano atual, upgrade, faturas pagas e em aberto.
- **Comandos**: guia do que mandar no WhatsApp.

## Modelo de dados

| Tabela | Conteúdo |
| --- | --- |
| clientes | negócio, ramo, país, moeda, idioma, situação, datas do teste |
| usuarios | login do painel, ligado a um cliente; administradores à parte |
| planos | limites e um preço por moeda |
| assinaturas | plano do cliente, valor, ciclo |
| faturas | valor, moeda, vencimento, situação, pago em, como |
| contas_instagram | id da conta, token cifrado, validade |
| numeros_whatsapp | telefones autorizados por cliente |
| marcas | logo, cores, chamada, hashtags, prefixo do código |
| posts | código, dados extraídos, legenda, situação, link do post |
| midias | fotos (e depois vídeos) de cada post |
| uso | um registro por evento (prévia, correção, publicação) com tokens e custo |

## Melhorias no Bora Vivir que preparam o SaaS

São as três coisas a fazer no projeto atual antes de qualquer painel. Cada uma já vale para o seu uso e vira peça do produto.

### 1. Modo fotos + descrição

1. Você manda as fotos no grupo.
2. Manda um texto livre: "apto 2 quartos Chamberí Madrid, 1450 aluguel, 75 m², elevador, mobiliado. link: ...".
3. A IA extrai os campos (tipo, operação, cidade, bairro, preço, quartos, área, extras). Se faltar preço ou cidade, o bot pergunta em vez de inventar.
4. Segue o fluxo de hoje: código, capa, legenda, prévia, `ok`, post e mensagem de controle.

O que isso resolve: funciona em servidor, cobre o Idealista (você salva as fotos e manda), e serve para imóveis de parceiros com fotos autorizadas e sem marca-d'água. O link do anúncio, se vier no texto, fica guardado para a consulta por código.

O que precisa ser construído: receber imagens pelo WhatsApp, guardar as fotos enquanto a descrição não chega, e a chamada de extração dos campos.

### 2. Velocidade e sensação de travado

A demora não vem de rodar local. Pelo que o código faz hoje (ainda sem medição), o tempo vai para abrir o Chrome, tratar 10 fotos, gerar a legenda e, principalmente, o Instagram: os itens do carrossel são criados um por um e a Meta precisa processá-los antes de publicar.

- Avisar cada etapa no chat ("fotos prontas", "escrevendo a legenda", "enviando ao Instagram").
- Criar os itens do carrossel em paralelo.
- Registrar o tempo de cada etapa, para atacar o gargalo real.

### 3. Deploy em servidor (Docker no Coolify)

| Parte | Em servidor |
| --- | --- |
| Bot do WhatsApp, IA, fotos, Instagram, banco | Funciona |
| Captura por link do Fotocasa | Incerta: precisou de Chrome visível em rede residencial; em datacenter tende a ser barrada |
| Captura por link do Idealista | Não funciona; bloqueou até em casa |

- Imagem Docker com Node; o Chrome só entra se a captura por link for mantida.
- Volume persistente para a sessão do WhatsApp e os arquivos; sem ele, cada deploy pede novo QR code.
- Segredos pelas variáveis de ambiente do Coolify, nunca na imagem.
- Com o modo fotos + descrição, o servidor não depende de captura nenhuma.

## Futuro: publicar também no site do cliente

O foco do lançamento é o Instagram. Publicar no site do parceiro fica para depois, mas o desenho já deve permitir: o post é guardado como dados estruturados (tipo, preço, cidade, fotos, legenda), e o Instagram é só um dos destinos.

| Caminho | Como funciona | Avaliação |
| --- | --- | --- |
| Página pública hospedada por nós | Cada cliente ganha um endereço com os imóveis publicados, um por código | **Começar por aqui.** Serve para qualquer cliente, não depende do site dele e resolve o "link na bio" |
| WordPress | A API do WordPress cria o post com fotos; o cliente gera uma senha de aplicativo e cola no painel | Viável e comum entre imobiliárias. Cada tema ou plugin imobiliário guarda preço e quartos de um jeito, então exige adaptação por caso |
| Webhook genérico | A cada publicação, enviamos os dados para um endereço que o cliente configurar | Barato de fazer; serve para quem tem programador ou usa ferramentas de automação |
| Outras plataformas (Wix, sistemas imobiliários próprios) | Uma integração por plataforma | Só sob demanda de cliente pagante |

### Endereço da página do cliente

Nome em estudo para o produto: **BK Social** (da BK System). Com ele, a proposta de endereços é:

| Uso | Endereço | Exemplo |
| --- | --- | --- |
| Site e painel do produto | domínio principal | `bksocial.com` e `app.bksocial.com` |
| Página pública do cliente | subdomínio num domínio separado | `imobiliariasilva.bksocial.page` |
| Um imóvel | código no caminho | `imobiliariasilva.bksocial.page/MAD-0042` |
| Domínio próprio do cliente (plano mais caro) | apontado por CNAME | `imoveis.imobiliariasilva.com.br` |

- **Subdomínio em vez de caminho** (`fulano.dominio` e não `dominio/fulano`): para o cliente parece um site dele, e fica bom no link da bio.
- **Domínio separado para as páginas**: conteúdo publicado por clientes fica isolado do domínio do painel. Se a página de alguém for denunciada ou bloqueada, o produto não é afetado, e os cookies do painel não ficam expostos.
- **Terminação**: `.com` para o produto, que é o que passa mais confiança. Para as páginas, `.page` ou `.site` leem bem; `.online` e `.pro` são baratos, mas passam menos confiança e caem mais em filtro de spam.
- **Regras do nome escolhido pelo cliente**: só letras minúsculas, números e hífen; único; lista de nomes reservados (`www`, `app`, `api`, `admin`, `suporte`); ao trocar, o endereço antigo redireciona por um tempo.
- **Técnica**: exige DNS e certificado curinga (`*.bksocial.page`), que a Vercel oferece.

Disponibilidade de domínios e marca ainda não foi conferida.

Cuidados: integração com site de terceiro vira suporte (site fora do ar, plugin desatualizado, senha trocada), e pode ser um diferencial de plano mais caro.

## Riscos

- **Nome**: "Insta-Zap" esbarra nas diretrizes de marca do Instagram, que pedem para não usar "Insta", "gram" ou "IG" em nome de app. "Zap-Post" evita isso, mas tem dois problemas: "zap" só quer dizer WhatsApp no Brasil (na Europa não comunica nada), e ZAP Imóveis é um portal imobiliário grande no Brasil, o que pode gerar confusão ou conflito de marca justamente no ramo de lançamento. Alternativas que funcionam em português e espanhol: Publika, Postea, Vitrina, Postaí. Nenhuma teve domínio ou registro de marca conferido.
- **Análise da Meta**: pode demorar ou ser negada. Sem ela não há SaaS.
- **Dependência**: Instagram e WhatsApp são da mesma empresa, que muda regras sem aviso.
- **Abuso de custo**: resolvido pelos tetos de prévia e correção.
- **Conteúdo do cliente**: os termos de uso precisam deixar claro que as fotos e as informações são responsabilidade de quem publica.
- **Dados pessoais**: telefones e tokens guardados exigem política de privacidade e cuidado com LGPD e GDPR.
- **Suporte**: cliente com Instagram pessoal, conta privada ou token expirado vai pedir ajuda; o painel precisa diagnosticar isso sozinho.

## Roteiro

**Fase 0 — Validar antes de construir**
- Modo "fotos + descrição" no Bora Vivir, usado por você por algumas semanas.
- Três a cinco clientes piloto atendidos à mão, cobrando, sem painel.
- Dar entrada na verificação da empresa e na análise do app na Meta.

**Fase 1 — Base para vários clientes**
- Postgres, autenticação, cadastro de cliente e de marca.
- Conexão do Instagram por login.
- Deploy do backend no Coolify e do painel na Vercel.

**Fase 2 — WhatsApp e limites**
- Número central, identificação do cliente pelo telefone.
- Fila de prévia e publicação.
- Contagem de uso, tetos por plano e registro de tokens.

**Fase 3 — Painel do cliente**
- Primeiros passos, uso, posts, plano e faturas.

**Fase 4 — Painel administrativo**
- Clientes, faturas com marcação manual, métricas.

**Fase 5 — Crescimento**
- Meio de pagamento, novos ramos, agendamento de posts.
- Vídeo: primeiro dentro do carrossel, depois Reels e stories.
- Outros destinos: página pública por cliente, depois WordPress e webhook.

## Decisões em aberto

| # | Decisão | Recomendação |
| --- | --- | --- |
| 1 | Nome | Evitar marcas da Meta ("Insta", "Whats", "Zap"). Em estudo: BK Social. Conferir domínio e marca antes de fechar |
| 2 | Ramo inicial | Só imobiliário |
| 3 | WhatsApp | API oficial com número central; Baileys só no piloto |
| 4 | Modelo de IA | Haiku 4.5 ou Sonnet 5.5 quando a conta AWS liberar; medir custo real |
| 5 | Preços | Tabelas separadas em real e em euro; validar os valores com os clientes piloto |
| 6 | Teste exige cartão? | Não no começo; reavaliar se houver abuso |
| 7 | Meio de pagamento | Decidir na fase 5; precisa cobrar em real e em euro |
| 8 | Impostos na Europa | Consultar o contador antes do primeiro cliente europeu |
