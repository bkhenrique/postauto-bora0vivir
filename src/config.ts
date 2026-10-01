import fs from 'node:fs'

if (fs.existsSync('.env')) process.loadEnvFile('.env')

function opcional(nome: string, padrao = ''): string {
  return process.env[nome]?.trim() || padrao
}

function obrigatoria(nome: string): string {
  const valor = opcional(nome)
  if (!valor) throw new Error(`Falta ${nome} no .env (veja .env.example)`)
  return valor
}

export const config = {
  pastaDados: opcional('PASTA_DADOS', 'data'),
  pastaSaida: opcional('PASTA_SAIDA', 'saida'),

  marca: {
    nome: opcional('MARCA_NOME', 'Vivir en España'),
    corFundo: opcional('MARCA_COR_FUNDO', '#16213E'),
    corDestaque: opcional('MARCA_COR_DESTAQUE', '#FFC72C'),
  },

  ia: {
    regiao: opcional('AWS_REGION', 'us-east-1'),
    modelo: opcional('IA_MODELO', 'global.anthropic.claude-sonnet-4-6'),
    esforco: opcional('IA_ESFORCO', 'low') as 'low' | 'medium' | 'high',
  },

  navegador: {
    visivel: opcional('NAVEGADOR_VISIVEL', 'true') !== 'false',
    canal: opcional('NAVEGADOR_CANAL', 'chrome'),
    idealistaAutomatico: opcional('IDEALISTA_AUTOMATICO', 'false') === 'true',
  },

  // As integrações abaixo só são exigidas quando usadas, para a prévia rodar sem elas.
  instagram: () => ({
    token: obrigatoria('INSTAGRAM_TOKEN'),
    usuarioId: obrigatoria('INSTAGRAM_USUARIO_ID'),
    versao: opcional('INSTAGRAM_API_VERSAO', 'v25.0'),
  }),

  armazenamento: () => ({
    bucket: obrigatoria('ARMAZENAMENTO_BUCKET'),
    urlPublica: obrigatoria('ARMAZENAMENTO_URL_PUBLICA').replace(/\/$/, ''),
    endpoint: opcional('ARMAZENAMENTO_ENDPOINT') || undefined,
    regiao: opcional('ARMAZENAMENTO_REGIAO', 'auto'),
    chave: opcional('ARMAZENAMENTO_ACCESS_KEY_ID') || obrigatoria('AWS_ACCESS_KEY_ID'),
    segredo: opcional('ARMAZENAMENTO_SECRET_ACCESS_KEY') || obrigatoria('AWS_SECRET_ACCESS_KEY'),
  }),

  whatsapp: {
    grupoId: opcional('WHATSAPP_GRUPO_ID'),
  },
}
