/* ===================================================================
   modules/sugestoes.js
   Mostra sugestões de livros enquanto o usuário digita o título da
   obra (avaliacao.html). Usa o serviço services/openLibrary.js.

   Estados tratados:
     - CARREGANDO: "Buscando sugestões..." com um indicador girando
     - SUCESSO:    lista de sugestões clicáveis
     - VAZIO:      "Nenhuma obra encontrada..."
     - ERRO:       "Não foi possível buscar sugestões agora..."
   =================================================================== */

import { buscarLivros } from '../services/openLibrary.js';
import { limparErro } from './ui.js';

const MINIMO_DE_LETRAS = 3;
const ATRASO_DIGITACAO_MS = 400; // espera o usuário parar de digitar

export function initSugestoesObras() {
  const campo = document.querySelector('#obra');
  const lista = document.querySelector('#sugestoes-obras');
  const status = document.querySelector('#sugestoes-status');
  if (!campo || !lista || !status) return;

  let temporizador = null; // "debounce": evita uma busca a cada letra
  let controlador = null;  // permite cancelar uma busca que ficou velha

  function mostrarStatus(tipo, texto) {
    status.className = 'sugestoes-status ' + tipo;
    status.textContent = texto;
    status.hidden = false;
  }

  function limparTudo() {
    lista.replaceChildren();
    status.hidden = true;
    status.textContent = '';
  }

  // Cria um item da lista. Usamos textContent (e não innerHTML) porque
  // o texto vem de fora: assim ele nunca é interpretado como HTML.
  function criarItem(livro) {
    const item = document.createElement('li');
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'sugestao';

    const titulo = document.createElement('span');
    titulo.className = 'sugestao-titulo';
    titulo.textContent = livro.titulo;

    const detalhe = document.createElement('span');
    detalhe.className = 'sugestao-autor';
    detalhe.textContent = livro.ano ? livro.autor + ' · ' + livro.ano : livro.autor;

    botao.append(titulo, detalhe);
    botao.addEventListener('click', function () {
      campo.value = livro.titulo;
      limparErro('campo-obra');
      limparTudo();
      campo.focus();
    });

    item.appendChild(botao);
    return item;
  }

  async function pesquisar(termo) {
    // cancela a busca anterior, se ainda estiver em andamento
    if (controlador) controlador.abort();
    controlador = new AbortController();

    lista.replaceChildren();
    mostrarStatus('carregando', 'Buscando sugestões na Open Library...');

    try {
      const livros = await buscarLivros(termo, { signal: controlador.signal });

      if (livros.length === 0) {
        mostrarStatus('vazio', 'Nenhuma obra encontrada. Você pode digitar o título manualmente.');
        return;
      }

      status.hidden = true;
      livros.forEach(function (livro) {
        lista.appendChild(criarItem(livro));
      });
    } catch (erro) {
      // busca cancelada de propósito por uma mais nova: não é erro de verdade
      if (erro.name === 'AbortError') return;

      mostrarStatus('erro', 'Não foi possível buscar sugestões agora. Você pode digitar o título manualmente.');
    }
  }

  campo.addEventListener('input', function () {
    clearTimeout(temporizador);
    const termo = campo.value.trim();

    if (termo.length < MINIMO_DE_LETRAS) {
      if (controlador) controlador.abort();
      limparTudo();
      return;
    }

    temporizador = setTimeout(function () {
      pesquisar(termo);
    }, ATRASO_DIGITACAO_MS);
  });

  // quando o formulário é limpo (form.reset()), limpa as sugestões também
  if (campo.form) {
    campo.form.addEventListener('reset', function () {
      clearTimeout(temporizador);
      if (controlador) controlador.abort();
      limparTudo();
    });
  }
}
