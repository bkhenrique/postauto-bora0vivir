# 05 — Instagram

## Pré-requisitos

1. A conta Vivir en España precisa ser **profissional** (Business ou Creator). Conta pessoal não publica por API.
2. Criar um app no painel Meta for Developers, com o produto Instagram (login do Instagram).
3. Adicionar a sua conta como testadora do app e gerar o token.
4. Permissões: `instagram_business_basic` e `instagram_business_content_publish`.

Como o app só publica na sua própria conta, ele pode ficar em modo de desenvolvimento, sem passar pela revisão da Meta. Isso precisa ser confirmado ao configurar; se a Meta exigir revisão, é um processo de alguns dias com vídeo demonstrando o uso.

## Token

O token de longa duração vale 60 dias e pode ser renovado antes de vencer. O sistema renova sozinho e avisa no grupo de WhatsApp se a renovação falhar, porque token vencido derruba toda a publicação.

## Publicação de carrossel

Três passos na API:

1. Criar um contêiner para cada foto, passando a URL pública da imagem e marcando como item de carrossel.
2. Criar o contêiner do carrossel com a lista dos itens e a legenda.
3. Publicar o contêiner do carrossel.

Entre o passo 2 e o 3 é preciso consultar o status do contêiner até ele ficar pronto. Depois de publicar, buscar o `permalink` do post para a mensagem de controle.

## Limites e exigências

| Item | Regra |
| --- | --- |
| Imagem | JPEG, por URL pública acessível pela Meta |
| Proporção | Entre 4:5 e 1.91:1 |
| Carrossel | Até 10 itens pela API (conferir na documentação ao implementar) |
| Legenda | 2.200 caracteres, 30 hashtags |
| Volume | 100 publicações por API a cada 24 horas |

O limite de volume é muito acima do que faz sentido postar. Para o perfil não parecer spam e o alcance não cair, o ritmo saudável é de 1 a 3 posts por dia, espaçados. O sistema pode ter uma fila com horário de publicação (fase 4).

## Hospedagem das fotos

A Meta baixa a imagem a partir da URL, então as fotos tratadas precisam estar públicas pelo menos até a publicação terminar. Opções:

- **Cloudflare R2**: barato, sem cobrança de tráfego de saída, independente de onde o sistema roda. Recomendado.
- Pasta pública na própria VPS: sem serviço extra, mas só funciona se o sistema rodar em servidor com domínio.

As fotos podem ser apagadas do armazenamento público alguns dias depois de publicadas.

## Falhas

- Se um item do carrossel for rejeitado (formato, tamanho), o erro vai para o grupo com o motivo e o imóvel fica como `falhou`, com opção de tentar de novo.
- Publicação nunca é repetida automaticamente sem checar antes se o post já foi criado, para não duplicar.

## Editar e apagar

A API não edita a legenda de um post já publicado nem apaga post. Correção depois de publicado é pelo aplicativo. Por isso a aprovação antes de publicar importa.
