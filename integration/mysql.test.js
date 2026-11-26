import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { criarApp } from '../server/app.js';
import { conectarBanco } from '../server/db.js';
import { criarRepositorio } from '../server/repositorio.js';

test('MySQL: cadastro, sessão, CRUD, autoria e persistência entre servidores', async t => {
  const banco = conectarBanco();
  const prefixo = randomUUID().slice(0, 8);
  const autores = [];
  let servidor;
  let base;

  async function iniciar() {
    servidor = criarApp(criarRepositorio(banco)).listen(0, '127.0.0.1');
    await once(servidor, 'listening');
    base = 'http://127.0.0.1:' + servidor.address().port;
  }

  async function parar() {
    if (servidor?.listening) {
      await new Promise((resolve, reject) => servidor.close(erro => erro ? reject(erro) : resolve()));
    }
  }

  t.after(async () => {
    try {
      await parar();
      for (const autor of autores) {
        await banco.execute('DELETE FROM avaliacoes WHERE usuario_id = ?', [autor]);
        await banco.execute('DELETE FROM usuarios WHERE id = ?', [autor]);
      }
      await banco.execute('DELETE FROM obras WHERE titulo = ?', ['Dom Casmurro ' + prefixo]);
    } finally {
      await banco.end();
    }
  });

  const chamar = (caminho, metodo = 'GET', dados, cookie) => fetch(base + caminho, {
    method: metodo,
    headers: {
      ...(dados === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: dados === undefined ? undefined : JSON.stringify(dados),
  });

  async function cadastrar(letra) {
    const usuario = 'teste_' + prefixo + letra;
    const email = usuario + '@example.com';
    const senha = 'SenhaDeTeste';
    const resposta = await chamar('/api/contas', 'POST', { nome: usuario, usuario, email, senha });
    assert.equal(resposta.status, 201);
    const conta = await resposta.json();
    autores.push(conta.id);
    assert.equal(conta.senha_hash, undefined);

    assert.equal((await chamar('/api/sessao', 'POST', { email, senha: 'errada' })).status, 401);
    const sessao = await chamar('/api/sessao', 'POST', { email, senha });
    assert.equal(sessao.status, 200);
    const setCookie = sessao.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Strict/i);
    return setCookie.split(';')[0];
  }

  await iniciar();
  assert.match(await (await chamar('/')).text(), /InkCircle/);
  const autor = await cadastrar('a');
  const outraConta = await cadastrar('b');
  const dados = {
    obra: 'Dom Casmurro ' + prefixo, tipo: 'livro', nota: 5, comentario: 'Um romance cativante.',
  };

  assert.equal((await chamar('/api/avaliacoes', 'POST', dados)).status, 401);
  assert.equal((await chamar('/api/avaliacoes', 'POST', { ...dados, nota: 6 }, autor)).status, 422);
  const primeira = await chamar('/api/avaliacoes', 'POST', dados, autor);
  assert.equal(primeira.status, 201);
  const avaliacao = await primeira.json();
  const rota = primeira.headers.get('location');
  const outra = await chamar('/api/avaliacoes', 'POST', dados, outraConta);
  assert.equal(outra.status, 201);
  const [obras] = await banco.execute('SELECT id FROM obras WHERE titulo = ?', [dados.obra]);
  assert.equal(obras.length, 1);

  const perfil = await (await chamar('/api/meu-perfil', 'GET', undefined, autor)).json();
  assert.deepEqual(perfil.avaliacoes.map(item => item.id), [avaliacao.id]);
  const perfilAlheio = await (await chamar('/api/meu-perfil', 'GET', undefined, outraConta)).json();
  assert.equal(perfilAlheio.avaliacoes.length, 1);
  assert.notEqual(perfilAlheio.avaliacoes[0].id, avaliacao.id);
  assert.equal((await chamar(rota, 'PATCH', { nota: 1 }, outraConta)).status, 403);
  assert.equal((await chamar(rota, 'DELETE', undefined, outraConta)).status, 403);

  const alterada = await chamar(rota, 'PATCH', { nota: 4 }, autor);
  assert.equal(alterada.status, 200);
  assert.equal((await alterada.json()).nota, 4);
  const substituida = await chamar(rota, 'PUT', { ...dados, nota: 4 }, autor);
  assert.equal(substituida.status, 200);
  assert.equal((await chamar('/api/avaliacoes?nota=9')).status, 422);
  const filtro = await (await chamar('/api/avaliacoes?tipo=livro&nota=4&q=' + prefixo)).json();
  assert.deepEqual(filtro.avaliacoes.map(item => item.id), [avaliacao.id]);
  await parar();
  await iniciar();
  const feed = await (await chamar('/api/avaliacoes')).json();
  assert.equal(feed.avaliacoes.find(item => item.id === avaliacao.id).nota, 4);
  const perfilReaberto = await (await chamar('/api/meu-perfil', 'GET', undefined, autor)).json();
  assert.equal(perfilReaberto.avaliacoes[0].id, avaliacao.id);
  assert.equal((await chamar(rota, 'DELETE', undefined, autor)).status, 204);
  assert.equal((await chamar(rota)).status, 404);
  assert.equal((await chamar('/api/sessao', 'DELETE', undefined, autor)).status, 204);
  assert.equal((await chamar('/api/meu-perfil', 'GET', undefined, autor)).status, 401);
});
