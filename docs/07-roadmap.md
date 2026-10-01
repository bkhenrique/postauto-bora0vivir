# 07 — Roadmap

Cada fase termina com algo que funciona sozinho e pode ser testado.

## Fase 0 — Contas e acessos

Nada de código; é o que trava o resto se ficar para depois.

- [x] Converter o Instagram para conta profissional
- [x] Criar o app na Meta e gerar o token de publicação
- [x] Conectar o WhatsApp e criar o grupo de controle
- [x] Enviar o formulário de caso de uso da Anthropic no Amazon Bedrock (sem ele os modelos Claude não respondem)
- [x] Criar o usuário IAM com acesso ao Bedrock
- [x] Criar o bucket público das fotos (S3)
- [ ] Definir o layout da capa (logo, cores, fonte)
- [ ] Resolver as decisões de [08 — Riscos e decisões](08-riscos-e-decisoes.md)

## Fase 1 — Do link à prévia, no terminal

Comando que recebe um link e gera uma pasta com fotos tratadas, capa e legenda. Nada é publicado.

- [x] Estrutura do projeto, configuração e banco
- [x] Adaptador do Fotocasa (testado com anúncio real)
- [ ] Adaptador do Idealista: escrito, falta validar com um anúncio aberto após o captcha
- [x] Código de referência e controle de duplicata
- [x] Geração da legenda (testada com o Sonnet 4.6 no Bedrock)
- [x] Tratamento das fotos e capa

Pronto quando: dez anúncios reais de cada portal geram prévias que você publicaria sem editar.

## Fase 2 — Publicação no Instagram

Testado com um post real (ESP-0001), visível sem login mesmo com o app da Meta não publicado.

- [x] Upload das fotos para URL pública (bucket S3)
- [x] Publicação de carrossel
- [ ] Renovação do token
- [ ] Tratamento de falhas sem duplicar post

Pronto quando: o comando do terminal publica o post e devolve o link.

## Fase 3 — WhatsApp

Testado no grupo de controle: link do Fotocasa → prévia → `ok` → post publicado.

- [x] Conexão e sessão persistente
- [x] Link no grupo dispara o pipeline
- [x] Prévia e aprovação (`ok` testado; `refazer` e `cancelar` ainda não pelo grupo)
- [x] Mensagem de controle
- [ ] Consulta por código

Pronto quando: todo o fluxo acontece pelo celular, sem abrir o computador.

## Fase 4 — Uso diário

- [ ] Deploy em servidor, sempre ligado
- [ ] Extensão de navegador para captura (nível 2 de [03](03-captura-anuncios.md))
- [ ] Entrada manual com fotos pelo grupo (nível 3)
- [ ] Fila com horário de publicação
- [ ] Verificação periódica de anúncios que saíram do ar
- [ ] Backup do banco

## Fase 5 — Crescimento

- [ ] Registro de contatos por código e relatório de quais posts geram lead
- [ ] Stories automáticos a partir do post
- [ ] Reels com as fotos
- [ ] Mais portais
- [ ] Versão em espanhol da legenda

## Ordem e dependências

A fase 1 é a de maior risco técnico (captura). Se o Idealista não funcionar de forma aceitável nem na sua máquina, a extensão de navegador sobe da fase 4 para a fase 1.

As fases 2 e 3 são independentes entre si e podem ser feitas em qualquer ordem.
