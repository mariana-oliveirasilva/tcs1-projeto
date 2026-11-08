/* ===================================================================
   modules/formularios.js
   Tratamento do envio (submit) dos três formulários:
     - criar-conta.html  (validação, Etapa 04)
     - entrar.html       (validação, Etapa 04)
     - avaliacao.html    (validação + ENVIO ASSÍNCRONO, Etapa 05)
   =================================================================== */

import {
  campoVazio, emailValido, senhaValida, usuarioDisponivel, comentarioValido
} from './validacao.js';
import { mostrar, esconder, mostrarErro, limparErro } from './ui.js';
import { enviarAvaliacao } from '../services/avaliacoesService.js';

/**
 * Valida um campo. "regras" é uma lista de pares [funcaoQueDetectaErro, mensagem].
 * A primeira regra que falhar define a mensagem mostrada.
 * @returns {boolean} true se o campo é válido
 */
function validarCampo(idCampo, valor, regras) {
  const falha = regras.find(function (regra) {
    return regra[0](valor);
  });

  if (falha) {
    mostrarErro(idCampo, falha[1]);
    return false;
  }
  limparErro(idCampo);
  return true;
}

/* ---------------------------- criar conta ---------------------------- */
export function initFormularioCadastro() {
  const form = document.querySelector('#form-criar-conta');
  if (!form) return;

  const sucesso = document.querySelector('#mensagem-sucesso-cadastro');

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    // o array é montado por inteiro (todos os campos são validados),
    // e .every() confirma que TODOS retornaram true
    const resultados = [
      validarCampo('campo-cad-nome', form.nome.value, [
        [campoVazio, 'Informe seu nome de exibição.']
      ]),
      validarCampo('campo-cad-usuario', form.usuario.value, [
        [campoVazio, 'Informe um nome de usuário.'],
        [function (v) { return !usuarioDisponivel(v); }, 'Esse nome de usuário já está em uso. Tente outro.']
      ]),
      validarCampo('campo-cad-email', form.email.value, [
        [campoVazio, 'Informe seu e-mail.'],
        [function (v) { return !emailValido(v); }, 'Digite um e-mail válido (ex: nome@exemplo.com).']
      ]),
      validarCampo('campo-cad-senha', form.senha.value, [
        [campoVazio, 'Crie uma senha.'],
        [function (v) { return !senhaValida(v); }, 'A senha deve ter pelo menos 6 caracteres.']
      ])
    ];

    if (resultados.every(Boolean)) {
      mostrar(sucesso);
      form.reset();
    } else {
      esconder(sucesso);
    }
  });
}

/* -------------------------------- entrar ------------------------------ */
export function initFormularioLogin() {
  const form = document.querySelector('#form-entrar');
  if (!form) return;

  const sucesso = document.querySelector('#mensagem-sucesso-login');

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const resultados = [
      validarCampo('campo-login-email', form.email.value, [
        [campoVazio, 'Informe seu e-mail.'],
        [function (v) { return !emailValido(v); }, 'Digite um e-mail válido.']
      ]),
      validarCampo('campo-login-senha', form.senha.value, [
        [campoVazio, 'Informe sua senha.']
      ])
    ];

    if (resultados.every(Boolean)) {
      mostrar(sucesso);
      form.reset();
    } else {
      esconder(sucesso);
    }
  });
}

/* ----------------------- publicar avaliação (async) ------------------- */
export function initFormularioAvaliacao(estrelas) {
  const form = document.querySelector('#form-avaliacao');
  if (!form) return;

  const sucesso = document.querySelector('#mensagem-sucesso-avaliacao');
  const erroNota = document.querySelector('#erro-nota');
  const statusEnvio = document.querySelector('#status-envio');
  const erroEnvio = document.querySelector('#erro-envio');
  const botaoEnviar = form.querySelector('button[type="submit"]');
  const textoOriginalBotao = botaoEnviar.textContent;

  let enviando = false;

  // Liga/desliga o estado de CARREGAMENTO do formulário
  function definirEnviando(valor) {
    enviando = valor;
    botaoEnviar.disabled = valor;
    botaoEnviar.textContent = valor ? 'Enviando...' : textoOriginalBotao;
    form.setAttribute('aria-busy', String(valor));
    statusEnvio.hidden = !valor;
  }

  // "async" permite usar "await" dentro da função
  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (enviando) return; // evita enviar duas vezes seguidas

    esconder(sucesso);
    esconder(erroEnvio);

    const notaOk = estrelas ? estrelas.foiSelecionada() : true;
    erroNota.hidden = notaOk;

    const resultados = [
      validarCampo('campo-obra', form.obra.value, [
        [campoVazio, 'Informe o título da obra.']
      ]),
      validarCampo('campo-tipo-obra', form['tipo-obra'].value, [
        [campoVazio, 'Selecione o tipo da obra.']
      ]),
      validarCampo('campo-comentario', form.comentario.value, [
        [campoVazio, 'Escreva um comentário sobre a obra.'],
        [function (v) { return !comentarioValido(v); }, 'O comentário deve ter pelo menos 10 caracteres.']
      ])
    ];

    if (!notaOk || !resultados.every(Boolean)) return;

    const avaliacao = {
      obra: form.obra.value.trim(),
      tipo: form['tipo-obra'].value,
      nota: estrelas ? estrelas.valor() : 0,
      comentario: form.comentario.value.trim()
    };

    definirEnviando(true); // CARREGANDO
    try {
      const salva = await enviarAvaliacao(avaliacao); // aguarda o "servidor"

      // SUCESSO
      sucesso.textContent = 'Avaliação de "' + salva.obra + '" publicada com sucesso!';
      mostrar(sucesso);
      form.reset();
      if (estrelas) estrelas.resetar();
      sucesso.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (erro) {
      // ERRO: os dados digitados continuam no formulário para tentar de novo
      erroEnvio.textContent =
        'Não foi possível publicar sua avaliação. ' + erro.message + ' Tente novamente.';
      mostrar(erroEnvio);
    } finally {
      // roda sempre, com sucesso ou erro: desliga o "carregando"
      definirEnviando(false);
    }
  });
}
