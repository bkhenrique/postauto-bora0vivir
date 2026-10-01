import { buscarPorCodigo, listarRecentes, ultimoAguardando } from '../armazenamento/imoveis.ts'
import { config } from '../config.ts'
import { mudarStatus, processarLink, refazerLegenda, type Previa } from '../pipeline/processar-link.ts'
import { publicar } from '../pipeline/publicar.ts'
import type { Imovel } from '../tipos.ts'
import { interpretar, type Comando } from './comandos.ts'
import type { Canal, Recebida } from './conexao.ts'
import * as mensagens from './mensagens.ts'

const FOTOS_NA_PREVIA = 3

function pendente(codigo: string | undefined): Imovel {
  const imovel = codigo ? buscarPorCodigo(codigo) : ultimoAguardando()
  if (!imovel) throw new Error(codigo ? `Não achei ${codigo}.` : 'Não há prévia pendente.')
  return imovel
}

async function enviarPrevia(resultado: Previa, grupoId: string, canal: Canal): Promise<void> {
  const { imovel } = resultado
  if (resultado.jaExistia) {
    await canal.enviarTexto(grupoId, `Esse anúncio já foi registrado.\n\n${mensagens.consulta(imovel)}`)
    return
  }
  for (const foto of imovel.fotos.slice(0, FOTOS_NA_PREVIA)) await canal.enviarImagem(grupoId, foto)
  await canal.enviarTexto(grupoId, imovel.legenda ?? '')
  await canal.enviarTexto(grupoId, mensagens.previa(resultado))
}

async function executar(comando: Comando, grupoId: string, canal: Canal): Promise<void> {
  const responder = (texto: string) => canal.enviarTexto(grupoId, texto)

  switch (comando.tipo) {
    case 'link':
      await responder('⏳ Capturando o anúncio...')
      await enviarPrevia(await processarLink(comando.url), grupoId, canal)
      break
    case 'aprovar': {
      const imovel = pendente(comando.codigo)
      await responder(`⏳ Publicando ${imovel.codigo}...`)
      await responder(mensagens.controle(await publicar(imovel.codigo)))
      break
    }
    case 'refazer': {
      const imovel = pendente(comando.codigo)
      await responder(`⏳ Reescrevendo a legenda de ${imovel.codigo}...`)
      await enviarPrevia(await refazerLegenda(imovel.codigo, comando.instrucao), grupoId, canal)
      break
    }
    case 'cancelar': {
      const imovel = pendente(comando.codigo)
      if (imovel.status !== 'aguardando_aprovacao') {
        throw new Error(`${imovel.codigo} está como "${imovel.status}"; só dá para cancelar uma prévia pendente.`)
      }
      await responder(`🗑 ${mudarStatus(imovel.codigo, 'cancelado').codigo} cancelado.`)
      break
    }
    case 'arquivar':
      await responder(`📦 ${mudarStatus(comando.codigo, 'arquivado').codigo} arquivado.`)
      break
    case 'consulta': {
      const imovel = buscarPorCodigo(comando.codigo)
      await responder(imovel ? mensagens.consulta(imovel) : `Não achei ${comando.codigo}.`)
      break
    }
    case 'lista': {
      const linhas = listarRecentes(10).map(mensagens.linhaDaLista)
      await responder(linhas.length > 0 ? linhas.join('\n') : 'Nenhum imóvel registrado ainda.')
      break
    }
    case 'ajuda':
      await responder(mensagens.AJUDA)
      break
    case 'id':
      await responder(`Id deste grupo: ${grupoId}`)
      break
  }
}

export async function atender({ grupoId, texto }: Recebida, canal: Canal): Promise<void> {
  const comando = interpretar(texto)
  if (!comando) return

  // Sem grupo configurado o bot só informa o id, para o primeiro ajuste do .env.
  const grupoDeControle = config.whatsapp.grupoId
  if (grupoDeControle ? grupoId !== grupoDeControle : comando.tipo !== 'id') return

  try {
    await executar(comando, grupoId, canal)
  } catch (erro) {
    await canal.enviarTexto(grupoId, `❌ ${erro instanceof Error ? erro.message : String(erro)}`)
  }
}
