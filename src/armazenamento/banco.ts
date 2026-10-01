import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { config } from '../config.ts'

let conexao: DatabaseSync | undefined

export function banco(): DatabaseSync {
  if (conexao) return conexao

  fs.mkdirSync(config.pastaDados, { recursive: true })
  conexao = new DatabaseSync(path.join(config.pastaDados, 'boravivir.db'))
  conexao.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS imoveis (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo        TEXT NOT NULL UNIQUE,
      portal        TEXT NOT NULL,
      id_no_portal  TEXT NOT NULL,
      url           TEXT NOT NULL,
      anuncio       TEXT NOT NULL,
      texto         TEXT,
      legenda       TEXT,
      fotos         TEXT NOT NULL DEFAULT '[]',
      status        TEXT NOT NULL,
      ig_media_id   TEXT,
      ig_permalink  TEXT,
      erro          TEXT,
      criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
      publicado_em  TEXT,
      UNIQUE (portal, id_no_portal)
    );

    CREATE TABLE IF NOT EXISTS sequencias (
      prefixo TEXT PRIMARY KEY,
      ultimo  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chaves (
      nome          TEXT PRIMARY KEY,
      valor         TEXT NOT NULL,
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  return conexao
}

export function lerChave(nome: string): { valor: string; atualizadoEm: string } | undefined {
  const linha = banco()
    .prepare('SELECT valor, atualizado_em FROM chaves WHERE nome = ?')
    .get(nome) as { valor: string; atualizado_em: string } | undefined
  return linha && { valor: linha.valor, atualizadoEm: linha.atualizado_em }
}

export function gravarChave(nome: string, valor: string): void {
  banco()
    .prepare(
      `INSERT INTO chaves (nome, valor) VALUES (?, ?)
       ON CONFLICT (nome) DO UPDATE SET valor = excluded.valor, atualizado_em = datetime('now')`,
    )
    .run(nome, valor)
}
