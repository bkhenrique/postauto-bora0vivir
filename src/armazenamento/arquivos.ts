import fs from 'node:fs'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { config } from '../config.ts'

// O Instagram baixa as imagens por URL, então os slides precisam ficar públicos até a publicação terminar.
export async function publicarFotos(codigo: string, arquivos: string[]): Promise<string[]> {
  const { bucket, urlPublica, endpoint, regiao, chave, segredo } = config.armazenamento()
  const s3 = new S3Client({
    region: regiao,
    endpoint,
    credentials: { accessKeyId: chave, secretAccessKey: segredo },
  })

  return Promise.all(
    arquivos.map(async (arquivo) => {
      const chaveDoObjeto = `posts/${codigo}/${path.basename(arquivo)}`
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: chaveDoObjeto,
          Body: await fs.promises.readFile(arquivo),
          ContentType: 'image/jpeg',
        }),
      )
      return `${urlPublica}/${chaveDoObjeto}`
    }),
  )
}
