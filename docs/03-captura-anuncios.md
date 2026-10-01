# 03 — Captura de anúncios

É a parte mais frágil do projeto. Os portais não querem ser lidos por robô e mudam o site sem aviso.

## O que precisa sair de cada anúncio

Os campos do tipo `Anuncio` descritos em [02 — Arquitetura](02-arquitetura.md): operação, tipo, preço, localização, características, descrição, fotos e anunciante.

## Como cada portal se comporta

| Portal | Dificuldade | Observação |
| --- | --- | --- |
| Idealista | Alta | Proteção anti-robô agressiva; requisição simples é bloqueada, e navegador automatizado em servidor costuma cair em captcha |
| Fotocasa | Média | Menos bloqueio; os dados do anúncio vêm num JSON embutido na página |
| Habitaclia, Pisos.com | Média | Ficam para depois |

## O que os testes mostraram

- Navegador invisível leva 403 nos dois portais, inclusive no Fotocasa.
- Com o Chrome visível e perfil persistente, o Fotocasa abre normalmente e a captura funciona.
- O Idealista abre a busca, mas mostra captcha ao entrar no anúncio. O sistema espera até 2 minutos você resolver na janela; depois disso o cookie fica salvo no perfil.
- O adaptador do Idealista foi escrito sem conseguir abrir um anúncio, então ainda não foi validado com página real.
- Depois de resolver o captcha, o Idealista respondeu "Se ha detectado un uso indebido. El acceso se ha bloqueado" e bloqueou o IP. Por isso a captura automática do Idealista vem desligada (`IDEALISTA_AUTOMATICO=false`): insistir prolonga o bloqueio, que também afeta a navegação normal no site.

Consequência: a captura precisa rodar numa máquina com tela (a sua). Em servidor sem tela, o caminho é a extensão de navegador do nível 2.

## Estratégia em três níveis

O sistema tenta o nível mais automático e cai para o seguinte quando falha.

**Nível 1 — Navegador automatizado.** Playwright abre o link, espera carregar e lê os dados. Preferir o JSON embutido na página aos seletores de HTML, que quebram com mais facilidade. Funciona bem no Fotocasa. No Idealista funciona de forma irregular, e melhor rodando na sua máquina do que num servidor.

**Nível 2 — Extensão no seu navegador.** Uma extensão pequena de Chrome com um botão "Enviar para o Vivir en España". Você abre o anúncio normalmente, clica, e ela manda os dados da página para o sistema. Como roda no seu navegador, com a sua sessão, não há bloqueio. É o caminho mais confiável para o Idealista.

**Nível 3 — Entrada manual.** Você manda no grupo o link, as fotos e os dados básicos. O sistema segue o fluxo normal a partir daí. Garante que um anúncio bom nunca fica de fora por falha técnica.

Não vale a pena investir em burlar a proteção do Idealista (proxies rotativos, resolvedores de captcha): custa dinheiro, quebra sempre e agrava o risco jurídico descrito em [08 — Riscos e decisões](08-riscos-e-decisoes.md). A extensão resolve o mesmo problema sem isso.

## Regras do adaptador

- Um arquivo por portal, todos devolvendo o mesmo tipo `Anuncio`.
- Normalizar a URL antes de tudo (tirar parâmetros de rastreio) e extrair o id do anúncio no portal; é esse par portal + id que identifica duplicata.
- Pegar as fotos na maior resolução disponível, na ordem do anúncio.
- Campo que não existir fica vazio; o adaptador nunca inventa valor.
- Se faltar preço, cidade ou foto, a captura falha com mensagem clara em vez de seguir com dado incompleto.
- Salvar o HTML da página quando a captura falhar, para corrigir o adaptador depois.

## Fotos

- Baixar logo após a captura; as URLs dos portais expiram ou mudam.
- Descartar plantas baixas, fotos repetidas e imagens muito pequenas.
- As fotos do Idealista vêm com marca-d'água do portal. Isso reforça o ponto sobre direito de uso em [08](08-riscos-e-decisoes.md).

## Anúncio que saiu do ar

Imóvel alugado ou vendido some do portal, mas o post continua no Instagram gerando contato inútil. Tarefa periódica (fase 4 do roadmap): revisitar os links publicados e avisar no grupo quando um anúncio não existir mais, para você arquivar o post.
