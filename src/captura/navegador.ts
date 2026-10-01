import path from 'node:path'
import { chromium, type BrowserContext, type Page } from 'playwright'
import { config } from '../config.ts'

const ESPERA_CAPTCHA_MS = 120_000

export class BloqueioError extends Error {}

let contexto: BrowserContext | undefined

async function abrirContexto(): Promise<BrowserContext> {
  // Perfil persistente: o cookie de quem já passou pelo captcha vale para as próximas capturas.
  contexto ??= await chromium.launchPersistentContext(path.join(config.pastaDados, 'navegador'), {
    channel: config.navegador.canal,
    headless: !config.navegador.visivel,
    locale: 'es-ES',
    viewport: { width: 1366, height: 900 },
  })
  return contexto
}

async function bloqueada(pagina: Page): Promise<boolean> {
  const titulo = await pagina.title()
  if (titulo.startsWith('ERROR')) return true
  const html = await pagina.content()
  return html.includes('captcha-delivery.com')
}

export async function abrirPagina(url: string): Promise<Page> {
  const pagina = await (await abrirContexto()).newPage()
  await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await pagina.waitForTimeout(2_500)

  if (!(await bloqueada(pagina))) return pagina

  if ((await pagina.content()).includes('uso indebido')) {
    await pagina.close()
    throw new BloqueioError('O portal bloqueou o acesso deste IP. Não adianta insistir; espere o bloqueio expirar.')
  }

  if (!config.navegador.visivel) {
    await pagina.close()
    throw new BloqueioError(
      'O portal bloqueou o navegador invisível. Rode com NAVEGADOR_VISIVEL=true para abrir o Chrome.',
    )
  }

  console.log('O portal pediu verificação. Resolva o captcha na janela do Chrome que abriu...')
  const limite = Date.now() + ESPERA_CAPTCHA_MS
  while (Date.now() < limite) {
    await pagina.waitForTimeout(2_000)
    if (!(await bloqueada(pagina).catch(() => true))) {
      await pagina.waitForTimeout(2_500)
      return pagina
    }
  }

  await pagina.close()
  throw new BloqueioError('O portal bloqueou o acesso e o captcha não foi resolvido a tempo.')
}

export async function fecharNavegador(): Promise<void> {
  await contexto?.close()
  contexto = undefined
}
