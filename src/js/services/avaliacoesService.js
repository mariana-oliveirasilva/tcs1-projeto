/* ===================================================================
   services/avaliacoesService.js
   Serviço SIMULADO de ENVIO: faz de conta que existe um servidor que
   recebe a avaliação. Ele devolve uma Promise, igual a uma chamada
   real de rede, e:
     - demora ~1,2 s (para dar para ver o estado de "carregando");
     - recusa o envio quando o título da obra é "erro" (para
       demonstrar o tratamento de erro);
     - guarda as avaliações no localStorage do navegador, para
       simular o banco de dados do servidor.

   Quando o back-end (Flask) existir, só ESTE arquivo muda: o fetch
   para a API real entra no lugar da simulação, e o resto do
   projeto continua igual.
   =================================================================== */

const CHAVE_STORAGE = 'inkcircle_avaliacoes';
const ATRASO_MS = 1200;

// Devolve uma Promise que se resolve depois de "ms" milissegundos
function esperar(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function lerAvaliacoesSalvas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_STORAGE)) ?? [];
  } catch (erro) {
    return [];
  }
}

/**
 * "Envia" uma avaliação para o servidor simulado.
 * @param {{obra: string, tipo: string, nota: number, comentario: string}} avaliacao
 * @returns {Promise<object>} a avaliação salva, já com id e data
 * @throws {Error} quando o servidor simulado recusa o envio
 */
export async function enviarAvaliacao(avaliacao) {
  await esperar(ATRASO_MS);

  // gatilho de demonstração: título "erro" simula uma falha do servidor
  if (avaliacao.obra.trim().toLowerCase() === 'erro') {
    throw new Error('O servidor simulado respondeu com erro 500.');
  }

  const salva = {
    id: Date.now(),
    ...avaliacao,
    criadaEm: new Date().toISOString()
  };

  try {
    const todas = lerAvaliacoesSalvas();
    todas.push(salva);
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(todas));
  } catch (erro) {
    // se o navegador bloquear o localStorage, o envio ainda "funciona":
    // o importante aqui é a comunicação assíncrona, não a persistência
  }

  return salva;
}
