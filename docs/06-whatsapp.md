# 06 — WhatsApp

## Papel do grupo

O grupo de controle é a interface inteira do sistema:

- **Entrada**: você cola o link do anúncio.
- **Aprovação**: o sistema mostra a prévia e espera a sua resposta.
- **Registro**: depois de publicar, fica a mensagem com código, link do anúncio e link do post.
- **Consulta**: você manda um código e recebe os dados do imóvel.
- **Alertas**: falhas, token vencendo, anúncio que saiu do ar.

## Como conectar

A API oficial do WhatsApp (Cloud API) é feita para empresa falar com cliente em conversa individual; para grupo ela é restrita e burocrática. Na prática, ler e escrever num grupo se faz conectando um número como WhatsApp Web, com a biblioteca **Baileys**.

Duas formas de usar:

- **Baileys direto no código**: menos peças, tudo num processo só. Recomendado.
- **Evolution API**: serviço pronto que embrulha o Baileys e expõe HTTP e webhooks. Vale se você já usa em outro projeto.

Pontos de atenção:

- É conexão não oficial. O WhatsApp pode banir o número. O risco é baixo para um bot que só fala num grupo seu, com pouco volume, mas existe.
- Usar um **número secundário** dedicado ao bot, nunca o seu número principal nem o de atendimento.
- A primeira conexão é por QR code; a sessão fica salva e reconecta sozinha.
- O bot só reage a mensagens do grupo de controle, identificado pelo id, e ignora todo o resto.

**Alternativa**: Telegram tem API oficial de bot, gratuita, sem risco de banimento, e você já opera um bot lá. Se o WhatsApp der dor de cabeça, trocar o canal é mexer só no módulo `whatsapp/`.

## Comandos

| Você manda | O sistema faz |
| --- | --- |
| Link de anúncio | Captura, gera conteúdo e manda a prévia |
| `ok` | Publica a prévia pendente |
| `refazer` | Gera outra legenda |
| `refazer` + instrução | Gera outra legenda seguindo a instrução ("mais curto", "destaca a varanda") |
| `cancelar` | Descarta a prévia |
| `MAD-0042` | Mostra os dados e os links daquele imóvel |
| `arquivar MAD-0042` | Marca como arquivado |
| `lista` | Últimos imóveis publicados |

Respostas de aprovação valem para a última prévia. Para agir sobre outra, inclua o código: `ok MAD-0001`, `refazer MAD-0001 mais curto`.

## Prévia

```
📋 Prévia — MAD-0042

[capa + 2 ou 3 fotos]

[legenda completa]

10 fotos · Chamberí, Madrid · 1.450 €/mês
Responda: ok · refazer · cancelar
```

## Mensagem de controle

Enviada depois da publicação. É o registro que só você vê.

```
✅ Publicado — MAD-0042

🏠 Piso 2 quartos · Chamberí, Madrid
💶 1.450 €/mês

🔗 Anúncio: https://www.idealista.com/inmueble/...
📸 Post: https://www.instagram.com/p/...
👤 Anunciante: Inmobiliaria Exemplo · 600 000 000
🗓 01/10/2026
```

Com isso, buscar `MAD-0042` na conversa do grupo já resolve "de quem é e onde é", mesmo sem abrir o sistema.

## Link duplicado

Se o link já foi usado, o sistema não gera outro post e responde com o código e o post existentes.
