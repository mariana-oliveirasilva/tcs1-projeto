/* ===================================================================
   modules/busca.js
   Filtro dinâmico de perfis (busca.html): filtra os cards já
   carregados na página a cada letra digitada.
   =================================================================== */

export function initBusca() {
  const campoBusca = document.querySelector('#busca-perfil');
  const gridPerfis = document.querySelector('.grid-perfis');
  if (!campoBusca || !gridPerfis) return;

  const formBusca = document.querySelector('#form-busca');
  const cardsPerfil = Array.from(gridPerfis.querySelectorAll('.perfil-card'));
  const semResultados = document.querySelector('#sem-resultados');

  function filtrarPerfis() {
    const termo = campoBusca.value.trim().toLowerCase();

    // .filter() devolve só os cards cujo texto contém o termo buscado
    const correspondem = cardsPerfil.filter(function (card) {
      return termo === '' || card.textContent.toLowerCase().includes(termo);
    });

    cardsPerfil.forEach(function (card) {
      card.hidden = !correspondem.includes(card);
    });

    if (semResultados) {
      semResultados.hidden = correspondem.length !== 0;
    }
  }

  // atualiza em tempo real, a cada letra digitada
  campoBusca.addEventListener('input', filtrarPerfis);

  // também funciona com o botão "Buscar" ou Enter, sem recarregar a página
  if (formBusca) {
    formBusca.addEventListener('submit', function (evento) {
      evento.preventDefault();
      filtrarPerfis();
    });
  }
}
