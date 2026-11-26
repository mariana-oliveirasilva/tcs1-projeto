import { readFile } from 'node:fs/promises';
import { conectarBanco } from './db.js';

let banco;
try {
  banco = conectarBanco();
  const sql = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  for (const comando of sql.split(';').map(parte => parte.trim()).filter(Boolean)) {
    await banco.query(comando);
  }
  console.log('Tabelas do InkCircle prontas.');
} catch (erro) {
  console.error('Falha ao inicializar o MySQL:', erro.message);
  process.exitCode = 1;
} finally {
  await banco?.end();
}
