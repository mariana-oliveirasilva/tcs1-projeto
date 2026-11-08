/* ===================================================================
   services/openLibrary.js
   Serviço de CONSULTA: busca livros na API pública Open Library
   (https://openlibrary.org/dev/docs/api/search). Não precisa de chave.

   Este módulo só conversa com a internet. Ele não sabe nada de HTML:
   recebe um termo, devolve uma lista de livros (ou lança um erro).
   Quem mostra o resultado na tela é o módulo modules/sugestoes.js.
   =================================================================== */

const URL_BASE = 'https://openlibrary.org/search.json';

/**
 * Busca livros pelo termo digitado.
 * @param {string} termo - texto digitado pelo usuário
 * @param {{ signal?: AbortSignal }} [opcoes] - permite cancelar a requisição
 * @returns {Promise<Array<{id: string, titulo: string, autor: string, ano: number|null}>>}
 * @throws {Error} se a rede falhar ou a API responder com erro
 */
export async function buscarLivros(termo, { signal } = {}) {
  const parametros = new URLSearchParams({
    q: termo,
    limit: '6',
    fields: 'key,title,author_name,first_publish_year'
  });

  // await "pausa" esta função até a resposta chegar, sem travar a página.
  // Se a internet cair, o próprio fetch lança um erro (TypeError).
  const resposta = await fetch(`${URL_BASE}?${parametros}`, { signal });

  // fetch NÃO lança erro quando o servidor responde 404 ou 500.
  // Por isso precisamos checar resposta.ok manualmente.
  if (!resposta.ok) {
    throw new Error(`A Open Library respondeu com erro ${resposta.status}.`);
  }

  const dados = await resposta.json();

  // .map() transforma cada item da API no formato que o InkCircle usa
  return dados.docs.map(function (doc) {
    return {
      id: doc.key,
      titulo: doc.title,
      autor: doc.author_name ? doc.author_name[0] : 'Autor desconhecido',
      ano: doc.first_publish_year ?? null
    };
  });
}
