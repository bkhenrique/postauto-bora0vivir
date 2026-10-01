import { fecharNavegador } from './captura/navegador.ts'
import { config } from './config.ts'
import { atender } from './whatsapp/atendimento.ts'
import { conectar } from './whatsapp/conexao.ts'

if (!config.whatsapp.grupoId) {
  console.log('WHATSAPP_GRUPO_ID ainda não está no .env. Mande "!id" no grupo de controle para descobrir o id.')
}

process.on('SIGINT', () => {
  void fecharNavegador().finally(() => process.exit(0))
})

await conectar(atender)
