export function criarCard(avaliacao, acoes) {
  const card = document.createElement('article');
  card.className = 'avaliacao-card';
  card.innerHTML = `
    <div class="avatar-placeholder" aria-hidden="true"></div>
    <div class="info">
      <header><span class="obra"></span><span class="badge"></span><span class="autor-avaliacao"></span></header>
      <p class="estrelas"></p>
      <footer></footer>
    </div>`;
  card.querySelector('.avatar-placeholder').textContent = Array.from(avaliacao.autor_nome)[0].toUpperCase();
  card.querySelector('.obra').textContent = avaliacao.obra;
  card.querySelector('.autor-avaliacao').textContent = 'por ' + avaliacao.autor_nome;

  const tipo = card.querySelector('.badge');
  tipo.classList.add(avaliacao.tipo);
  tipo.textContent = avaliacao.tipo === 'manga' ? 'Mangá' : 'Livro';

  const estrelas = card.querySelector('.estrelas');
  estrelas.textContent = '★'.repeat(avaliacao.nota) + '☆'.repeat(5 - avaliacao.nota);
  estrelas.setAttribute('aria-label', avaliacao.nota + ' de 5 estrelas');
  card.querySelector('footer').textContent = avaliacao.comentario;
  if (acoes) card.querySelector('.info').append(acoes);
  return card;
}
