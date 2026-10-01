# 04 — Geração de conteúdo

## Código de referência

Formato: **três letras da cidade + número sequencial**, por exemplo `MAD-0042`, `BCN-0007`, `VLC-0113`.

- Curto o bastante para a pessoa digitar no direct.
- Você sabe a cidade só de olhar.
- O número é sequencial por cidade e nunca é reutilizado, mesmo se o post for cancelado.
- Cidade sem sigla cadastrada usa `ESP`.
- O código não revela portal, anunciante nem id do anúncio.

Tabela de siglas fica num arquivo de configuração (Madrid `MAD`, Barcelona `BCN`, Valencia `VLC`, Málaga `AGP`, Sevilla `SVQ`, Alicante `ALC`...) e cresce conforme a necessidade.

O código aparece em três lugares: na capa do carrossel, no começo da legenda e na mensagem de controle.

## Legenda

Gerada pela API da Claude a partir dos **dados estruturados** do anúncio, e não por tradução livre da descrição. Assim o texto não inventa característica que o imóvel não tem.

### Estrutura

```
🏡 Apartamento de 2 quartos em Chamberí, Madrid

💶 1.450 €/mês
📐 75 m² · 🛏 2 quartos · 🚿 1 banheiro
🛗 Elevador · ☀️ Varanda · 🛋 Mobiliado

Dois ou três parágrafos curtos destacando o que o imóvel tem de melhor
e como é o bairro para quem está chegando do Brasil.

📌 REF: MAD-0042

Quer morar na Espanha? A gente cuida da sua mudança do começo ao fim:
busca de imóvel, documentação, visitas e contrato.
📩 Manda "MAD-0042" no direct.

#morarnaespanha #brasileirosnaespanha #madrid #aluguelmadrid ...
```

### Regras do prompt

- Português do Brasil, tom próximo e direto, sem exagero de corretor.
- Só afirmar o que está nos dados. Se não há informação de elevador, não mencionar elevador.
- Explicar em uma frase os termos que brasileiro recém-chegado não conhece (ático, fianza, gastos de comunidad), quando aparecerem.
- Preço sempre em euros e com o período (mês) quando for aluguel.
- Nunca citar o portal, o anunciante, o endereço exato ou o telefone do anúncio.
- Deixar claro que a disponibilidade pode mudar.
- Limite de 2.200 caracteres e 30 hashtags do Instagram; mirar bem abaixo disso, com 8 a 12 hashtags.
- Variar a abertura entre posts para o perfil não ficar repetitivo.

Hashtags vêm de listas fixas por cidade e por operação (aluguel ou venda), não do modelo, para manter consistência.

O modelo e o prompt ficam em configuração. Usar o Claude Sonnet 4.6 pela AWS (Amazon Bedrock, perfil `global.anthropic.claude-sonnet-4-6`): cerca de US$ 0,03 por legenda, uns US$ 4 por mês com 150 gerações. O Sonnet 5.5 é mais barato, mas a conta AWS ainda não tem acesso a ele; quando tiver, basta trocar `IA_MODELO` no `.env`. O comando "refazer" na aprovação gera outra versão.

### Validação antes de mostrar a prévia

- O código de referência está presente e correto.
- O preço da legenda bate com o do anúncio.
- Tamanho e número de hashtags dentro do limite.
- Não contém o nome do portal nem URL.

## Fotos

O Instagram corta o carrossel inteiro na proporção da primeira imagem, então todas saem no mesmo formato.

- Formato **4:5 (1080 × 1350)**, que ocupa mais tela no feed.
- Foto horizontal: corte central quando a perda é pequena; caso contrário, foto inteira sobre fundo desfocado da própria imagem.
- JPEG, qualidade alta.
- Até 10 fotos por post. Se o anúncio tiver mais, escolher as primeiras e garantir sala, quarto, cozinha e banheiro.

### Capa

A primeira imagem leva uma faixa com identidade do perfil:

- Tipo e bairro: "2 quartos em Chamberí"
- Preço
- Código de referência
- Logo do Vivir en España

É o que faz o post ser reconhecido no feed e o código ser visto por quem não lê legenda. O layout da capa precisa ser definido uma vez (cores, fonte, logo) antes da fase 2.
