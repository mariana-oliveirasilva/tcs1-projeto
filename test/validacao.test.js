import test from 'node:test';
import assert from 'node:assert/strict';
import { validarAvaliacao, validarConta, validarId } from '../server/validacao.js';

test('normaliza os dados de uma avaliação', () => {
  const valores = validarAvaliacao({
    obra: ' Dom Casmurro ', tipo: 'livro', nota: 4, comentario: ' Um romance cativante. ',
  });
  assert.deepEqual(valores, {
    obra: 'Dom Casmurro', tipo: 'livro', nota: 4, comentario: 'Um romance cativante.',
  });
});

test('PATCH valida campos presentes e recusa autoria informada pelo cliente', () => {
  assert.deepEqual(validarAvaliacao({ nota: 5 }, true), { nota: 5 });
  for (const invalido of [{}, { nota: '5' }, { autor_id: 1 }, JSON.parse('{"__proto__": 1}')]) {
    assert.throws(() => validarAvaliacao(invalido, true), { status: 422 });
  }
});

test('valida a conta e normaliza identificadores de login', () => {
  assert.deepEqual(validarConta({
    nome: ' Ana ', usuario: 'Ana_01', email: ' ANA@exemplo.com ', senha: 'SenhaTeste',
  }), { nome: 'Ana', usuario: 'ana_01', email: 'ana@exemplo.com', senha: 'SenhaTeste' });
  assert.throws(() => validarConta({ nome: 'Ana' }), { status: 422 });
  assert.throws(() => validarId('4294967296'), { status: 404 });
});
