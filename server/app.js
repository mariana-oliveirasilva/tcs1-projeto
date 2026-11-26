import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import {
  ErroApi, corpoJson, credenciaisInvalidas, validarAvaliacao, validarConta, validarFiltros, validarId, validarLogin,
} from './validacao.js';

const derivar = promisify(scrypt);
const cookieSessao = 'inkcircle_sessao';
const hashToken = token => createHash('sha256').update(token).digest('hex');
const caminho = url => fileURLToPath(new URL(url, import.meta.url));

async function hashSenha(senha) {
  const sal = randomBytes(16).toString('hex');
  const chave = await derivar(senha, sal, 64);
  return sal + ':' + chave.toString('hex');
}

async function conferirSenha(senha, hash) {
  const [sal, digest] = hash
    ? hash.split(':')
    : ['0'.repeat(32), '0'.repeat(128)];
  const chave = await derivar(senha, sal, 64);
  return timingSafeEqual(chave, Buffer.from(digest, 'hex')) && Boolean(hash);
}

export function criarApp(repositorio, { cookieSeguro = false } = {}) {
  const app = express();
  app.disable('x-powered-by');
  const api = express.Router();
  const opcoesCookie = { httpOnly: true, sameSite: 'strict', secure: cookieSeguro, path: '/' };

  api.use(express.json({ limit: '16kb' }), cookieParser());
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const origem = req.get('Origin');
    if (origem && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (!['http://' + req.get('Host'), 'https://' + req.get('Host')].includes(origem)) {
        return next(new ErroApi(403, 'origem_invalida', 'Envie a operação pelo InkCircle.'));
      }
    }
    next();
  });

  function hashDaSessao(req) {
    const token = req.cookies[cookieSessao];
    return typeof token === 'string' && /^[\w-]{43}$/.test(token) ? hashToken(token) : null;
  }

  async function exigirSessao(req, res, next) {
    const hash = hashDaSessao(req);
    req.usuario = hash ? await repositorio.usuarioDaSessao(hash) : null;
    if (!req.usuario) throw new ErroApi(401, 'login_necessario', 'Entre na sua conta para continuar.');
    next();
  }

  api.get('/saude', (req, res) => res.json({ status: 'ok' }));

  api.post('/contas', async (req, res) => {
    const dados = validarConta(corpoJson(req));
    try {
      const conta = await repositorio.cadastrar(dados, await hashSenha(dados.senha));
      res.status(201).json(conta);
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        throw new ErroApi(409, 'conta_duplicada', 'Esse usuário ou e-mail já está cadastrado.');
      }
      throw erro;
    }
  });

  api.post('/sessao', async (req, res) => {
    const { email, senha } = validarLogin(corpoJson(req));
    const conta = await repositorio.buscarPorEmail(email);
    if (!await conferirSenha(senha, conta?.senha_hash)) throw credenciaisInvalidas();
    const token = randomBytes(32).toString('base64url');
    await repositorio.criarSessao(hashToken(token), conta.id, hashDaSessao(req));
    res.cookie(cookieSessao, token, { ...opcoesCookie, maxAge: 86400000 });
    res.json({ id: conta.id, nome: conta.nome, usuario: conta.usuario });
  });

  api.get('/sessao', exigirSessao, (req, res) => res.json(req.usuario));

  api.delete('/sessao', async (req, res) => {
    const hash = hashDaSessao(req);
    if (hash) await repositorio.excluirSessao(hash);
    res.clearCookie(cookieSessao, opcoesCookie).status(204).end();
  });

  api.get('/meu-perfil', exigirSessao, async (req, res) => {
    res.json({ ...req.usuario, avaliacoes: await repositorio.listar({ usuarioId: req.usuario.id }) });
  });

  api.get('/avaliacoes', async (req, res) => {
    const avaliacoes = await repositorio.listar(validarFiltros(req.query));
    res.json({ total: avaliacoes.length, avaliacoes });
  });

  api.get('/avaliacoes/:id', async (req, res) => {
    const item = await repositorio.buscar(validarId(req.params.id));
    if (!item) throw new ErroApi(404, 'nao_encontrado', 'Avaliação não encontrada.');
    res.json(item);
  });

  api.post('/avaliacoes', exigirSessao, async (req, res) => {
    const item = await repositorio.criar(req.usuario.id, validarAvaliacao(corpoJson(req)));
    res.location('/api/avaliacoes/' + item.id).status(201).json(item);
  });

  async function atualizarAvaliacao(req, res) {
    const item = await repositorio.alterar(
      validarId(req.params.id), req.usuario.id, validarAvaliacao(corpoJson(req), req.method === 'PATCH'),
    );
    res.json(item);
  }

  api.patch('/avaliacoes/:id', exigirSessao, atualizarAvaliacao);
  api.put('/avaliacoes/:id', exigirSessao, atualizarAvaliacao);

  api.delete('/avaliacoes/:id', exigirSessao, async (req, res) => {
    await repositorio.excluir(validarId(req.params.id), req.usuario.id);
    res.status(204).end();
  });

  api.use((req, res, next) => next(new ErroApi(404, 'nao_encontrado', 'Rota não encontrada.')));
  app.use('/api', api);
  app.use('/css', express.static(caminho('../src/css')));
  app.use('/img', express.static(caminho('../src/img')));
  app.use('/js', express.static(caminho('../src/js')));
  app.use('/pages', express.static(caminho('../src/pages')));
  app.get('/', (req, res) => res.redirect('/pages/index.html'));

  app.use((erro, req, res, next) => {
    if (res.headersSent) return next(erro);
    let falha = erro;
    if (erro.type === 'entity.parse.failed') falha = new ErroApi(400, 'json_invalido', 'JSON inválido.');
    if (erro.type === 'entity.too.large') falha = new ErroApi(413, 'corpo_grande', 'Corpo muito grande.');
    if (!(falha instanceof ErroApi)) {
      console.error('Falha da API:', erro.code || erro.message);
      falha = new ErroApi(500, 'erro_persistencia', 'Não foi possível concluir a operação.');
    }
    res.status(falha.status).json({
      erro: { codigo: falha.codigo, mensagem: falha.message, detalhes: falha.detalhes },
    });
  });
  return app;
}
