import { chamarApi } from '../services/api.js';
import { criarCard } from './cards.js';

export async function initPerfil() {
  const estado = document.querySelector('#estado-perfil');
  if (!estado) return;

  const lista = document.querySelector('#lista-avaliacoes-perfil');
  const entrar = document.querySelector('#entrar-perfil');
  const dados = document.querySelector('#dados-perfil');
  const secao = document.querySelector('#secao-avaliacoes-perfil');
  const sair = document.querySelector('#sair-perfil');

  function atualizarTotal(total) {
    document.querySelector('#perfil-total').textContent = total === 1 ? '1 avaliação' : total + ' avaliações';
    document.querySelector('#perfil-sem-avaliacoes').hidden = total !== 0;
  }

  function mostrarFalha(erro) {
    estado.hidden = false;
    estado.textContent = erro.message;
    if (erro.status === 401) {
      entrar.hidden = false;
      dados.hidden = true;
      secao.hidden = true;
    }
  }

  function cardEditavel(item) {
    const acoes = document.createElement('div');
    acoes.className = 'acoes-form';
    const editar = document.createElement('a');
    editar.className = 'botao secundario';
    editar.href = 'avaliacao.html?editar=' + item.id;
    editar.textContent = 'Editar';
    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'botao secundario';
    excluir.textContent = 'Excluir';
    acoes.append(editar, excluir);
    const card = criarCard(item, acoes);

    excluir.addEventListener('click', async () => {
      if (!window.confirm('Excluir esta avaliação de ' + item.obra + '?')) return;
      excluir.disabled = true;
      try {
        await chamarApi('/avaliacoes/' + item.id, { metodo: 'DELETE' });
        card.remove();
        atualizarTotal(lista.children.length);
        estado.hidden = false;
        estado.textContent = 'Avaliação excluída.';
      } catch (erro) {
        mostrarFalha(erro);
        excluir.disabled = false;
      }
    });
    return card;
  }

  try {
    const perfil = await chamarApi('/meu-perfil');
    document.querySelector('#perfil-nome').textContent = perfil.nome;
    document.querySelector('#perfil-usuario').textContent = '@' + perfil.usuario;
    document.querySelector('#perfil-iniciais').textContent = perfil.nome.split(/\s+/).slice(0, 2)
      .map(parte => Array.from(parte)[0]).join('').toUpperCase();
    for (const item of perfil.avaliacoes) lista.append(cardEditavel(item));
    atualizarTotal(perfil.avaliacoes.length);
    dados.hidden = false;
    secao.hidden = false;
    estado.hidden = true;
  } catch (erro) {
    mostrarFalha(erro);
    return;
  }

  sair.addEventListener('click', async () => {
    sair.disabled = true;
    try {
      await chamarApi('/sessao', { metodo: 'DELETE' });
      window.location.assign('entrar.html');
    } catch (erro) {
      mostrarFalha(erro);
      sair.disabled = false;
    }
  });
}
