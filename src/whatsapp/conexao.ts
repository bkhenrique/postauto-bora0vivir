import fs from 'node:fs'
import path from 'node:path'
import makeWASocket, { DisconnectReason, useMultiFileAuthState, type WASocket } from 'baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { config } from '../config.ts'

export type Recebida = { grupoId: string; texto: string }

export type Canal = {
  enviarTexto: (grupoId: string, texto: string) => Promise<void>
  enviarImagem: (grupoId: string, arquivo: string) => Promise<void>
}

type AoReceber = (mensagem: Recebida, canal: Canal) => Promise<void>

const ESPERA_PARA_RECONECTAR_MS = 5_000

export async function conectar(aoReceber: AoReceber): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(config.pastaDados, 'whatsapp'))
  const socket = makeWASocket({ auth: state, logger: pino({ level: 'silent' }) })

  // Se o bot usar o mesmo número de quem escreve, as próprias respostas voltam como mensagem recebida.
  const enviadas = new Set<string>()
  const canal = criarCanal(socket, enviadas)
  let fila = Promise.resolve()

  socket.ev.on('creds.update', saveCreds)

  socket.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('Escaneie o QR code com o WhatsApp do número do bot (Aparelhos conectados):')
      qrcode.generate(qr, { small: true })
    }
    if (connection === 'open') console.log('WhatsApp conectado.')
    if (connection !== 'close') return

    const codigo = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode
    if (codigo === DisconnectReason.loggedOut) {
      console.error('O WhatsApp desconectou este aparelho. Apague data/whatsapp e escaneie o QR de novo.')
      return
    }
    setTimeout(() => void conectar(aoReceber), ESPERA_PARA_RECONECTAR_MS)
  })

  socket.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return

    for (const mensagem of messages) {
      const grupoId = mensagem.key.remoteJid
      const texto = mensagem.message?.conversation ?? mensagem.message?.extendedTextMessage?.text
      if (!grupoId?.endsWith('@g.us') || !texto) continue
      if (mensagem.key.id && enviadas.has(mensagem.key.id)) continue

      // Uma de cada vez: a captura usa um navegador só.
      fila = fila
        .then(() => aoReceber({ grupoId, texto }, canal))
        .catch((erro) => console.error('Falha ao tratar mensagem:', erro))
    }
  })
}

function criarCanal(socket: WASocket, enviadas: Set<string>): Canal {
  const registrar = (id: string | null | undefined) => {
    if (id) enviadas.add(id)
  }

  return {
    async enviarTexto(grupoId, texto) {
      registrar((await socket.sendMessage(grupoId, { text: texto }))?.key.id)
    },
    async enviarImagem(grupoId, arquivo) {
      const imagem = await fs.promises.readFile(arquivo)
      registrar((await socket.sendMessage(grupoId, { image: imagem }))?.key.id)
    },
  }
}
