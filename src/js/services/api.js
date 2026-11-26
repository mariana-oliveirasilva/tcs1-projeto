export async function chamarApi(caminho, { metodo = 'GET', dados } = {}) {
  let resposta;
  try {
    resposta = await fetch('/api' + caminho, {
      method: metodo,
      headers: dados === undefined ? {} : { 'Content-Type': 'application/json' },
      body: dados === undefined ? undefined : JSON.stringify(dados)
    });
  } catch {
    throw new Error('Não foi possível acessar o InkCircle. Confira se o servidor está rodando.');
  }
  if (resposta.status === 204) return;
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const erro = corpo?.erro;
    const detalhes = Object.values(erro?.detalhes ?? {}).join(' ');
    const falha = new Error(detalhes || erro?.mensagem || 'Falha ao acessar o InkCircle.');
    falha.status = resposta.status;
    throw falha;
  }
  return corpo;
}

export async function sessaoAtual() {
  try {
    return await chamarApi('/sessao');
  } catch (erro) {
    if (erro.status === 401) return null;
    throw erro;
  }
}
