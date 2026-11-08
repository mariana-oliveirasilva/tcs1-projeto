/* ===================================================================
   modules/ui.js
   Funções auxiliares que mexem no HTML (DOM): mostrar/esconder
   elementos e exibir/limpar mensagens de erro nos campos.
   =================================================================== */

export function mostrar(elemento) {
  if (elemento) elemento.hidden = false;
}

export function esconder(elemento) {
  if (elemento) elemento.hidden = true;
}

// idCampo = id do <div class="campo" id="campo-xxx"> que envolve o input
export function mostrarErro(idCampo, mensagem) {
  const campo = document.querySelector('#' + idCampo);
  if (!campo) return;

  campo.classList.add('campo-invalido');

  let erro = campo.querySelector('.erro-campo');
  if (!erro) {
    erro = document.createElement('p');
    erro.className = 'erro-campo';
    erro.id = idCampo + '-erro';
    erro.setAttribute('role', 'alert'); // leitores de tela anunciam o erro
    campo.appendChild(erro);
  }
  erro.textContent = mensagem;

  // liga o erro ao input para tecnologias assistivas
  const entrada = campo.querySelector('input, select, textarea');
  if (entrada) {
    entrada.setAttribute('aria-invalid', 'true');
    entrada.setAttribute('aria-describedby', erro.id);
  }
}

export function limparErro(idCampo) {
  const campo = document.querySelector('#' + idCampo);
  if (!campo) return;

  campo.classList.remove('campo-invalido');

  const erro = campo.querySelector('.erro-campo');
  if (erro) erro.remove();

  const entrada = campo.querySelector('input, select, textarea');
  if (entrada) {
    entrada.removeAttribute('aria-invalid');
    entrada.removeAttribute('aria-describedby');
  }
}
