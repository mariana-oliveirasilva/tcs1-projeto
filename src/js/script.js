/* ===================================================================
   InkCircle — js/script.js
   Etapa 04: Interatividade com JavaScript

   Este arquivo é carregado em TODAS as páginas (ver <script> no fim
   do <body>), mas cada módulo só roda se encontrar os elementos que
   precisa na página atual (por isso os "if" logo no começo de cada
   módulo). Assim um único arquivo funciona em avaliacao.html,
   busca.html, criar-conta.html e entrar.html sem dar erro nas
   páginas que não têm aquele formulário/elemento.

   Módulos:
   1. Seleção de nota por estrelas  (avaliacao.html)
   2. Busca/filtro dinâmico de perfis (busca.html)
   3. Validação de formulários (criar-conta.html, entrar.html, avaliacao.html)
   =================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* =================================================================
     MÓDULO 1 — Seleção de nota por estrelas (avaliacao.html)
     ================================================================= */
  const containerEstrelas = document.querySelector('.nota-estrelas');

  if (containerEstrelas) {
    // Array.from transforma a NodeList em um array de verdade,
    // para podermos usar .forEach(), .filter() etc.
    const botoesEstrela = Array.from(containerEstrelas.querySelectorAll('.estrela'));
    const inputNota = document.querySelector('#nota-valor');
    const textoNota = document.querySelector('#nota-texto');
    const erroNota = document.querySelector('#erro-nota');

    let notaSelecionada = 0; // nenhuma nota escolhida ainda

    // Pinta de verde todas as estrelas com valor <= valor recebido
    function pintarEstrelas(valor) {
      botoesEstrela.forEach(function (botao) {
        const valorBotao = Number(botao.dataset.valor);
        if (valorBotao <= valor) {
          botao.classList.add('preenchida');
        } else {
          botao.classList.remove('preenchida');
        }
      });
    }

    // Atualiza o texto abaixo das estrelas ("3 de 5 estrelas selecionadas")
    function atualizarTextoNota(valor) {
      if (valor === 0) {
        textoNota.textContent = 'Nenhuma nota selecionada ainda.';
      } else {
        textoNota.textContent = valor + ' de 5 estrelas selecionadas.';
      }
    }

    botoesEstrela.forEach(function (botao) {
      // clique = escolhe a nota de verdade
      botao.addEventListener('click', function () {
        notaSelecionada = Number(botao.dataset.valor);
        inputNota.value = notaSelecionada;
        pintarEstrelas(notaSelecionada);
        atualizarTextoNota(notaSelecionada);

        // já que o usuário escolheu uma nota, some com o erro se existia
        if (erroNota) erroNota.hidden = true;
      });

      // passar o mouse por cima = pré-visualização (não altera a nota salva)
      botao.addEventListener('mouseenter', function () {
        pintarEstrelas(Number(botao.dataset.valor));
      });
    });

    // ao tirar o mouse da área das estrelas, volta a mostrar a nota
    // realmente selecionada (ou nenhuma, se ainda não escolheu)
    containerEstrelas.addEventListener('mouseleave', function () {
      pintarEstrelas(notaSelecionada);
    });

    // guarda funções no próprio elemento para o Módulo 3 (validação) usar,
    // já que botoesEstrela/textoNota só existem aqui dentro
    containerEstrelas.notaFoiSelecionada = function () {
      return notaSelecionada > 0;
    };

    containerEstrelas.resetarEstrelas = function () {
      notaSelecionada = 0;
      pintarEstrelas(0);
      atualizarTextoNota(0);
    };
  }


  /* =================================================================
     MÓDULO 2 — Busca/filtro dinâmico de perfis (busca.html)
     ================================================================= */
  const campoBusca = document.querySelector('#busca-perfil');
  const gridPerfis = document.querySelector('.grid-perfis');

  if (campoBusca && gridPerfis) {
    const formBusca = document.querySelector('#form-busca');
    const cardsPerfil = Array.from(gridPerfis.querySelectorAll('.perfil-card'));
    const semResultados = document.querySelector('#sem-resultados');

    function filtrarPerfis() {
      const termo = campoBusca.value.trim().toLowerCase();

      // .filter() devolve só os cards cujo texto bate com o termo
      const correspondem = cardsPerfil.filter(function (card) {
        const textoCard = card.textContent.toLowerCase();
        return termo === '' || textoCard.includes(termo);
      });

      // mostra/esconde cada card usando o atributo "hidden"
      cardsPerfil.forEach(function (card) {
        card.hidden = !correspondem.includes(card);
      });

      // se nenhum card bateu com a busca, mostra a mensagem
      if (semResultados) {
        semResultados.hidden = correspondem.length !== 0;
      }
    }

    // atualiza em tempo real, a cada letra digitada
    campoBusca.addEventListener('input', filtrarPerfis);

    // também funciona se a pessoa clicar em "Buscar" ou der Enter
    if (formBusca) {
      formBusca.addEventListener('submit', function (evento) {
        evento.preventDefault();
        filtrarPerfis();
      });
    }
  }


  /* =================================================================
     MÓDULO 3 — Validação de formulários
     (criar-conta.html, entrar.html, avaliacao.html)
     ================================================================= */

  // ---- funções auxiliares de validação ----

  function campoVazio(valor) {
    return valor.trim() === '';
  }

  function emailValido(valor) {
    const padraoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return padraoEmail.test(valor.trim());
  }

  function senhaValida(valor) {
    return valor.trim().length >= 6;
  }

  // simula uma lista de nomes de usuário já cadastrados no sistema,
  // para demonstrar o tratamento de uma situação inválida realista
  const usuariosExistentes = ['anacaval', 'renatap', 'marcelof', 'juliasantos'];

  function usuarioDisponivel(valor) {
    return !usuariosExistentes.includes(valor.trim().toLowerCase());
  }

  // ---- funções auxiliares de interface (mostrar/limpar erro) ----

  // idCampo = id do <div class="campo" id="campo-xxx"> que envolve o input
  function mostrarErro(idCampo, mensagem) {
    const campo = document.querySelector('#' + idCampo);
    if (!campo) return;

    campo.classList.add('campo-invalido');

    let erro = campo.querySelector('.erro-campo');
    if (!erro) {
      erro = document.createElement('p');
      erro.className = 'erro-campo';
      campo.appendChild(erro);
    }
    erro.textContent = mensagem;
  }

  function limparErro(idCampo) {
    const campo = document.querySelector('#' + idCampo);
    if (!campo) return;

    campo.classList.remove('campo-invalido');
    const erro = campo.querySelector('.erro-campo');
    if (erro) erro.remove();
  }

  // ---- formulário: criar conta ----
  const formCriarConta = document.querySelector('#form-criar-conta');

  if (formCriarConta) {
    const campoNome = document.querySelector('#cad-nome');
    const campoUsuario = document.querySelector('#cad-usuario');
    const campoEmail = document.querySelector('#cad-email');
    const campoSenha = document.querySelector('#cad-senha');
    const mensagemSucesso = document.querySelector('#mensagem-sucesso-cadastro');

    formCriarConta.addEventListener('submit', function (evento) {
      evento.preventDefault();
      let formularioValido = true;

      if (campoVazio(campoNome.value)) {
        mostrarErro('campo-cad-nome', 'Informe seu nome de exibição.');
        formularioValido = false;
      } else {
        limparErro('campo-cad-nome');
      }

      if (campoVazio(campoUsuario.value)) {
        mostrarErro('campo-cad-usuario', 'Informe um nome de usuário.');
        formularioValido = false;
      } else if (!usuarioDisponivel(campoUsuario.value)) {
        mostrarErro('campo-cad-usuario', 'Esse nome de usuário já está em uso. Tente outro.');
        formularioValido = false;
      } else {
        limparErro('campo-cad-usuario');
      }

      if (campoVazio(campoEmail.value)) {
        mostrarErro('campo-cad-email', 'Informe seu e-mail.');
        formularioValido = false;
      } else if (!emailValido(campoEmail.value)) {
        mostrarErro('campo-cad-email', 'Digite um e-mail válido (ex: nome@exemplo.com).');
        formularioValido = false;
      } else {
        limparErro('campo-cad-email');
      }

      if (campoVazio(campoSenha.value)) {
        mostrarErro('campo-cad-senha', 'Crie uma senha.');
        formularioValido = false;
      } else if (!senhaValida(campoSenha.value)) {
        mostrarErro('campo-cad-senha', 'A senha deve ter pelo menos 6 caracteres.');
        formularioValido = false;
      } else {
        limparErro('campo-cad-senha');
      }

      if (formularioValido) {
        if (mensagemSucesso) mensagemSucesso.hidden = false;
        formCriarConta.reset();
      } else {
        if (mensagemSucesso) mensagemSucesso.hidden = true;
      }
    });
  }

  // ---- formulário: entrar ----
  const formEntrar = document.querySelector('#form-entrar');

  if (formEntrar) {
    const campoEmailLogin = document.querySelector('#login-email');
    const campoSenhaLogin = document.querySelector('#login-senha');
    const mensagemSucessoLogin = document.querySelector('#mensagem-sucesso-login');

    formEntrar.addEventListener('submit', function (evento) {
      evento.preventDefault();
      let formularioValido = true;

      if (campoVazio(campoEmailLogin.value)) {
        mostrarErro('campo-login-email', 'Informe seu e-mail.');
        formularioValido = false;
      } else if (!emailValido(campoEmailLogin.value)) {
        mostrarErro('campo-login-email', 'Digite um e-mail válido.');
        formularioValido = false;
      } else {
        limparErro('campo-login-email');
      }

      if (campoVazio(campoSenhaLogin.value)) {
        mostrarErro('campo-login-senha', 'Informe sua senha.');
        formularioValido = false;
      } else {
        limparErro('campo-login-senha');
      }

      if (formularioValido) {
        if (mensagemSucessoLogin) mensagemSucessoLogin.hidden = false;
        formEntrar.reset();
      } else {
        if (mensagemSucessoLogin) mensagemSucessoLogin.hidden = true;
      }
    });
  }

  // ---- formulário: publicar avaliação ----
  const formAvaliacao = document.querySelector('#form-avaliacao');

  if (formAvaliacao) {
    const campoObraInput = document.querySelector('#obra');
    const campoTipoObra = document.querySelector('#tipo-obra');
    const campoComentario = document.querySelector('#comentario');
    const erroNotaAvaliacao = document.querySelector('#erro-nota');
    const mensagemSucessoAvaliacao = document.querySelector('#mensagem-sucesso-avaliacao');

    formAvaliacao.addEventListener('submit', function (evento) {
      evento.preventDefault();
      let formularioValido = true;

      if (campoVazio(campoObraInput.value)) {
        mostrarErro('campo-obra', 'Informe o título da obra.');
        formularioValido = false;
      } else {
        limparErro('campo-obra');
      }

      if (campoVazio(campoTipoObra.value)) {
        mostrarErro('campo-tipo-obra', 'Selecione o tipo da obra.');
        formularioValido = false;
      } else {
        limparErro('campo-tipo-obra');
      }

      // valida a nota usando a função que o Módulo 1 deixou disponível
      const notaOk = containerEstrelas && containerEstrelas.notaFoiSelecionada
        ? containerEstrelas.notaFoiSelecionada()
        : true;

      if (!notaOk) {
        if (erroNotaAvaliacao) erroNotaAvaliacao.hidden = false;
        formularioValido = false;
      } else {
        if (erroNotaAvaliacao) erroNotaAvaliacao.hidden = true;
      }

      if (campoVazio(campoComentario.value)) {
        mostrarErro('campo-comentario', 'Escreva um comentário sobre a obra.');
        formularioValido = false;
      } else if (campoComentario.value.trim().length < 10) {
        mostrarErro('campo-comentario', 'O comentário deve ter pelo menos 10 caracteres.');
        formularioValido = false;
      } else {
        limparErro('campo-comentario');
      }

      if (formularioValido) {
        if (mensagemSucessoAvaliacao) mensagemSucessoAvaliacao.hidden = false;
        formAvaliacao.reset();
        if (containerEstrelas && containerEstrelas.resetarEstrelas) {
          containerEstrelas.resetarEstrelas();
        }
      } else {
        if (mensagemSucessoAvaliacao) mensagemSucessoAvaliacao.hidden = true;
      }
    });
  }

});