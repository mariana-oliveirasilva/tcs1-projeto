/* ===================================================================
   modules/estrelas.js
   Seleção de nota por estrelas (avaliacao.html).
   Devolve um "controle" para outros módulos lerem/zerarem a nota,
   ou null se a página não tiver estrelas.
   =================================================================== */

export function initEstrelas() {
  const container = document.querySelector('.nota-estrelas');
  if (!container) return null;

  // Array.from transforma a NodeList em array de verdade (.forEach, .filter...)
  const botoes = Array.from(container.querySelectorAll('.estrela'));
  const inputNota = document.querySelector('#nota-valor');
  const textoNota = document.querySelector('#nota-texto');
  const erroNota = document.querySelector('#erro-nota');

  let notaSelecionada = 0; // 0 = nenhuma nota escolhida ainda

  // Pinta de verde todas as estrelas com valor <= valor recebido
  function pintar(valor) {
    botoes.forEach(function (botao) {
      const valorBotao = Number(botao.dataset.valor);
      botao.classList.toggle('preenchida', valorBotao <= valor);
    });
  }

  function atualizarTexto(valor) {
    textoNota.textContent = valor === 0
      ? 'Nenhuma nota selecionada ainda.'
      : valor + ' de 5 estrelas selecionadas.';
  }

  botoes.forEach(function (botao) {
    // clique = escolhe a nota de verdade
    botao.addEventListener('click', function () {
      notaSelecionada = Number(botao.dataset.valor);
      inputNota.value = notaSelecionada;
      pintar(notaSelecionada);
      atualizarTexto(notaSelecionada);
      if (erroNota) erroNota.hidden = true;
    });

    // mouse por cima = pré-visualização (não altera a nota salva)
    botao.addEventListener('mouseenter', function () {
      pintar(Number(botao.dataset.valor));
    });
  });

  // ao tirar o mouse, volta a mostrar a nota realmente selecionada
  container.addEventListener('mouseleave', function () {
    pintar(notaSelecionada);
  });

  return {
    valor: function () {
      return notaSelecionada;
    },
    foiSelecionada: function () {
      return notaSelecionada > 0;
    },
    resetar: function () {
      notaSelecionada = 0;
      inputNota.value = '';
      pintar(0);
      atualizarTexto(0);
    }
  };
}
