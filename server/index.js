import { criarApp } from './app.js';
import { conectarBanco } from './db.js';
import { criarRepositorio } from './repositorio.js';

let banco;
try {
  banco = conectarBanco();
  await banco.query('SELECT 1 FROM avaliacoes LIMIT 1');
  const porta = Number(process.env.PORT || 3000);
  const app = criarApp(criarRepositorio(banco), {
    cookieSeguro: process.env.COOKIE_SECURE === 'true',
  });
  const servidor = app.listen(porta, '127.0.0.1', () => {
    console.log('InkCircle em http://127.0.0.1:' + porta);
  });
  servidor.on('error', async erro => {
    console.error('Falha ao abrir o servidor:', erro.message);
    await banco.end();
    process.exitCode = 1;
  });
  for (const sinal of ['SIGINT', 'SIGTERM']) {
    process.once(sinal, () => servidor.close(() => banco.end()));
  }
} catch (erro) {
  console.error('Falha ao iniciar. Confira o MySQL e execute npm run db:init.', erro.message);
  await banco?.end();
  process.exitCode = 1;
}
