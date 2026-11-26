export class ErroApi extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

export function corpoJson(req) {
  if (!req.is('application/json')) {
    throw new ErroApi(415, 'tipo_de_conteudo', 'Envie um corpo application/json.');
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new ErroApi(400, 'json_invalido', 'Envie um objeto JSON.');
  }
  return req.body;
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function validarErros(erros) {
  if (Object.keys(erros).length) {
    throw new ErroApi(422, 'validacao', 'Revise os dados enviados.', erros);
  }
}

export function validarConta(dados) {
  const nome = texto(dados.nome);
  const usuario = texto(dados.usuario).toLowerCase();
  const email = texto(dados.email).toLowerCase();
  const senha = dados.senha;
  const erros = Object.create(null);
  if (!nome || nome.length > 100) erros.nome = 'Informe um nome com até 100 caracteres.';
  if (!/^[a-z0-9_]{2,30}$/.test(usuario)) erros.usuario = 'Use de 2 a 30 letras sem acento, números ou _.';
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) erros.email = 'Informe um e-mail válido.';
  if (typeof senha !== 'string' || !senha.trim() || senha.length < 6 || senha.length > 128) {
    erros.senha = 'Use uma senha de 6 a 128 caracteres.';
  }
  validarErros(erros);
  return { nome, usuario, email, senha };
}

export function validarLogin(dados) {
  const email = texto(dados.email).toLowerCase();
  const senha = dados.senha;
  if (!email || email.length > 254 || typeof senha !== 'string' || !senha || senha.length > 128) {
    throw credenciaisInvalidas();
  }
  return { email, senha };
}

export function credenciaisInvalidas() {
  return new ErroApi(401, 'credenciais_invalidas', 'E-mail ou senha inválidos.');
}

const regrasAvaliacao = {
  obra: valor => /^.{1,150}$/su.test(valor) || 'Informe um título de 1 a 150 caracteres.',
  tipo: valor => ['livro', 'manga'].includes(valor) || 'Escolha livro ou mangá.',
  nota: valor => (Number.isInteger(valor) && valor >= 1 && valor <= 5) || 'Informe uma nota inteira de 1 a 5.',
  comentario: valor => /^.{10,1000}$/su.test(valor) || 'Escreva de 10 a 1000 caracteres.',
};

export function validarAvaliacao(dados, parcial = false) {
  const valores = {};
  const erros = Object.create(null);
  for (const campo of Object.keys(dados)) {
    if (!Object.hasOwn(regrasAvaliacao, campo)) erros[campo] = 'Campo desconhecido.';
  }
  if (parcial && !Object.keys(dados).length) erros.corpo = 'Informe pelo menos um campo.';
  for (const [campo, regra] of Object.entries(regrasAvaliacao)) {
    if (parcial && !Object.hasOwn(dados, campo)) continue;
    const valor = campo === 'nota' ? dados[campo] : texto(dados[campo]);
    const resultado = regra(valor);
    if (resultado === true) valores[campo] = valor;
    else erros[campo] = resultado;
  }
  validarErros(erros);
  return valores;
}

export function validarId(valor) {
  if (!/^[1-9]\d*$/.test(valor) || Number(valor) > 4294967295) {
    throw new ErroApi(404, 'nao_encontrado', 'Avaliação não encontrada.');
  }
  return Number(valor);
}

export function validarFiltros(query) {
  const { tipo, nota, q } = query;
  const erros = {};
  const tipoNormalizado = tipo === undefined ? undefined : texto(tipo).toLowerCase();
  if (tipo !== undefined && !['livro', 'manga'].includes(tipoNormalizado)) {
    erros.tipo = 'Escolha livro ou mangá.';
  }
  if (nota !== undefined && (typeof nota !== 'string' || !/^[1-5]$/.test(nota))) {
    erros.nota = 'Informe uma nota inteira de 1 a 5.';
  }
  if (q !== undefined && (typeof q !== 'string' || q.length > 150)) {
    erros.q = 'Informe um texto de busca com até 150 caracteres.';
  }
  validarErros(erros);
  return { tipo: tipoNormalizado, nota: nota === undefined ? undefined : Number(nota), busca: texto(q) };
}
