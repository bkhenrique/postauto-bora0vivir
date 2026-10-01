import path from 'node:path'
import { buscarPorCodigo, listarRecentes } from './armazenamento/imoveis.ts'
import { lerAnuncioManual } from './captura/manual.ts'
import { fecharNavegador } from './captura/navegador.ts'
import { formatarPreco, localizacao } from './conteudo/formato.ts'
import { mudarStatus, processarLink, refazerLegenda, registrarAnuncio, type Previa } from './pipeline/processar-link.ts'
import { publicar } from './pipeline/publicar.ts'
import type { Imovel } from './tipos.ts'

const AJUDA = `Uso:
  npm run previa -- <link>                  captura o anúncio e gera a prévia em saida/<código>/
  npm run previa -- <link> --sem-ia         o mesmo, com legenda só de dados (sem chamar o modelo)
  npm run previa -- --manual <arquivo.json> usa um anúncio preenchido à mão
  npm run publicar -- <código>              publica a prévia no Instagram
  npm run lista                             últimos imóveis
  npx tsx src/cli.ts refazer <código> [instrução]
  npx tsx src/cli.ts ver <código>
  npx tsx src/cli.ts cancelar <código>
  npx tsx src/cli.ts arquivar <código>`

function resumo(imovel: Imovel): string {
  return `${imovel.codigo}  ${imovel.status.padEnd(20)}  ${formatarPreco(imovel.anuncio).padEnd(14)}  ${localizacao(imovel.anuncio)}`
}

function mostrarPrevia({ imovel, jaExistia, avisos }: Previa): void {
  if (jaExistia) {
    console.log(`Esse anúncio já está registrado como ${imovel.codigo} (${imovel.status}).`)
    if (imovel.igPermalink) console.log(`Post: ${imovel.igPermalink}`)
    return
  }
  console.log(`\nPrévia ${imovel.codigo} pronta em ${path.dirname(imovel.fotos[0] ?? '')}/ (${imovel.fotos.length} slides)\n`)
  console.log(imovel.legenda)
  for (const aviso of avisos) console.log(`\n⚠️  ${aviso}`)
}

function exigirArgumento(valor: string | undefined, nome: string): string {
  if (!valor) throw new Error(`Faltou informar ${nome}.\n\n${AJUDA}`)
  return valor
}

async function executar(comando: string | undefined, argumentos: string[]): Promise<void> {
  const semIa = argumentos.includes('--sem-ia')
  const posicionais = argumentos.filter((argumento) => !argumento.startsWith('--'))

  switch (comando) {
    case 'previa': {
      if (argumentos.includes('--manual')) {
        const arquivo = exigirArgumento(posicionais[0], 'o arquivo JSON')
        mostrarPrevia(await registrarAnuncio(lerAnuncioManual(arquivo), { semIa }))
      } else {
        mostrarPrevia(await processarLink(exigirArgumento(posicionais[0], 'o link'), { semIa }))
      }
      break
    }
    case 'refazer':
      mostrarPrevia(await refazerLegenda(exigirArgumento(posicionais[0], 'o código'), posicionais.slice(1).join(' ')))
      break
    case 'publicar': {
      const imovel = await publicar(exigirArgumento(posicionais[0], 'o código'))
      console.log(`Publicado ${imovel.codigo}: ${imovel.igPermalink}`)
      break
    }
    case 'lista':
      for (const imovel of listarRecentes(20)) console.log(resumo(imovel))
      break
    case 'ver': {
      const imovel = buscarPorCodigo(exigirArgumento(posicionais[0], 'o código'))
      if (!imovel) throw new Error('Código não encontrado.')
      console.log(resumo(imovel))
      console.log(`Anúncio: ${imovel.url}`)
      console.log(`Anunciante: ${imovel.anuncio.anunciante.nome ?? '-'} ${imovel.anuncio.anunciante.telefone ?? ''}`)
      if (imovel.igPermalink) console.log(`Post: ${imovel.igPermalink}`)
      if (imovel.erro) console.log(`Último erro: ${imovel.erro}`)
      break
    }
    case 'cancelar':
    case 'arquivar': {
      const status = comando === 'cancelar' ? 'cancelado' : 'arquivado'
      console.log(resumo(mudarStatus(exigirArgumento(posicionais[0], 'o código'), status)))
      break
    }
    default:
      console.log(AJUDA)
  }
}

const [comando, ...argumentos] = process.argv.slice(2)
try {
  await executar(comando, argumentos)
} catch (erro) {
  console.error(`Erro: ${erro instanceof Error ? erro.message : erro}`)
  process.exitCode = 1
} finally {
  await fecharNavegador()
}
