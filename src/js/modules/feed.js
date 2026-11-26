import { chamarApi, sessaoAtual } from '../services/api.js';
import { criarCard } from './cards.js';

export async function initFeed() {
  const lista = document.querySelector('#lista-feed');
  if (!lista) return;
  const estado = document.querySelector('#estado-feed');
  try {
    const { avaliacoes } = await chamarApi('/avaliacoes');
    lista.replaceChildren(...avaliacoes.map(item => criarCard(item)));
    estado.textContent = 'Ainda não há avaliações publicadas.';
    estado.hidden = avaliacoes.length > 0;
  } catch (erro) {
    estado.textContent = erro.message;
  }
}

export async function initNavegacaoInicio() {
  const cta = document.querySelector('#cta-perfil');
  if (!cta) return;
  try {
    if (!await sessaoAtual()) return;
    const perfil = document.createElement('a');
    perfil.href = 'perfil.html';
    perfil.textContent = 'Meu perfil';
    perfil.className = 'botao';
    document.querySelector('.header-actions').replaceChildren(perfil);
    cta.href = 'perfil.html';
    cta.textContent = 'Ver meu perfil';
  } catch {
    // A seção do feed já apresenta falhas ao consultar a API.
  }
}
