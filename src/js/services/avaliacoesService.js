import { chamarApi } from './api.js';

export function enviarAvaliacao(dados, id = null) {
  return id === null
    ? chamarApi('/avaliacoes', { metodo: 'POST', dados })
    : chamarApi('/avaliacoes/' + encodeURIComponent(id), { metodo: 'PATCH', dados });
}
