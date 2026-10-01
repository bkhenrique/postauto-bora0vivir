import { publicarFotos } from '../armazenamento/arquivos.ts'
import { atualizarImovel, buscarPorCodigo } from '../armazenamento/imoveis.ts'
import { criarCarrossel, linkDoPost, publicarConteiner } from '../instagram/publicar-carrossel.ts'
import type { Imovel } from '../tipos.ts'

export async function publicar(codigo: string): Promise<Imovel> {
  const imovel = buscarPorCodigo(codigo)
  if (!imovel) throw new Error(`Não achei nenhum imóvel com o código ${codigo}.`)
  if (imovel.status === 'publicado') throw new Error(`${imovel.codigo} já foi publicado: ${imovel.igPermalink}`)
  if (!imovel.legenda || imovel.fotos.length === 0) throw new Error(`${imovel.codigo} ainda não tem prévia pronta.`)
  if (imovel.status !== 'aguardando_aprovacao') {
    throw new Error(`${imovel.codigo} está como "${imovel.status}" e não pode ser publicado.`)
  }

  try {
    // Se uma tentativa anterior já criou o post e caiu antes de buscar o link, não publica de novo.
    let mediaId = imovel.igMediaId
    if (!mediaId) {
      const urls = await publicarFotos(imovel.codigo, imovel.fotos)
      const conteiner = await criarCarrossel(urls, imovel.legenda)
      mediaId = await publicarConteiner(conteiner)
      atualizarImovel(imovel.codigo, { igMediaId: mediaId })
    }

    return atualizarImovel(imovel.codigo, {
      igPermalink: await linkDoPost(mediaId),
      status: 'publicado',
      publicadoEm: new Date().toISOString(),
      erro: null,
    })
  } catch (erro) {
    // A prévia continua pendente: dá para corrigir a causa e mandar "ok" de novo.
    atualizarImovel(imovel.codigo, { erro: erro instanceof Error ? erro.message : String(erro) })
    throw erro
  }
}
