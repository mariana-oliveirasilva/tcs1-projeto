import { ErroApi } from './validacao.js';

const consulta = `
  SELECT a.id, o.titulo AS obra, o.tipo, a.nota, a.comentario,
         a.criada_em, a.atualizada_em, u.id AS autor_id,
         u.nome AS autor_nome, u.usuario AS autor_usuario
  FROM avaliacoes a JOIN obras o ON o.id = a.obra_id
  JOIN usuarios u ON u.id = a.usuario_id
`;

export function criarRepositorio(banco) {
  async function executar(sql, valores = [], conexao = banco) {
    const [resultado] = await conexao.execute(sql, valores);
    return resultado;
  }

  async function buscar(id, conexao = banco, bloquear = false) {
    const sql = consulta + ' WHERE a.id = ?' + (bloquear ? ' FOR UPDATE' : '');
    const [item] = await executar(sql, [id], conexao);
    return item ?? null;
  }

  async function transacao(operacao) {
    const conexao = await banco.getConnection();
    try {
      await conexao.beginTransaction();
      const resultado = await operacao(conexao);
      await conexao.commit();
      return resultado;
    } catch (erro) {
      await conexao.rollback();
      throw erro;
    } finally {
      conexao.release();
    }
  }

  async function obraId(conexao, { obra, tipo }) {
    const resultado = await executar(
      'INSERT INTO obras (titulo, tipo) VALUES (?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
      [obra, tipo], conexao,
    );
    return resultado.insertId;
  }

  function exigirDono(item, usuarioId) {
    if (!item) throw new ErroApi(404, 'nao_encontrado', 'Avaliação não encontrada.');
    if (item.autor_id !== usuarioId) {
      throw new ErroApi(403, 'acesso_negado', 'Somente o autor pode alterar esta avaliação.');
    }
  }

  return {
    async cadastrar({ nome, usuario, email }, hash) {
      const resultado = await executar(
        'INSERT INTO usuarios (nome, usuario, email, senha_hash) VALUES (?, ?, ?, ?)',
        [nome, usuario, email, hash],
      );
      return { id: resultado.insertId, nome, usuario };
    },
    async buscarPorEmail(email) {
      const [usuario] = await executar('SELECT * FROM usuarios WHERE email = ?', [email]);
      return usuario ?? null;
    },
    async criarSessao(hash, usuarioId, hashAnterior) {
      await transacao(async conexao => {
        await executar('DELETE FROM sessoes WHERE expira_em <= UTC_TIMESTAMP(3)', [], conexao);
        if (hashAnterior) await executar('DELETE FROM sessoes WHERE token_hash = ?', [hashAnterior], conexao);
        await executar(
          'INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (?, ?, UTC_TIMESTAMP(3) + INTERVAL 1 DAY)',
          [hash, usuarioId], conexao,
        );
      });
    },
    async usuarioDaSessao(hash) {
      const [usuario] = await executar(
        `SELECT u.id, u.nome, u.usuario FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
         WHERE s.token_hash = ? AND s.expira_em > UTC_TIMESTAMP(3)`, [hash],
      );
      return usuario ?? null;
    },
    async excluirSessao(hash) {
      await executar('DELETE FROM sessoes WHERE token_hash = ?', [hash]);
    },
    async listar({ usuarioId, tipo, nota, busca } = {}) {
      const clausulas = [];
      const parametros = [];
      for (const [coluna, valor] of [['a.usuario_id', usuarioId], ['o.tipo', tipo], ['a.nota', nota]]) {
        if (valor !== undefined) {
          clausulas.push(coluna + ' = ?');
          parametros.push(valor);
        }
      }
      if (busca) {
        clausulas.push('LOCATE(?, o.titulo) > 0');
        parametros.push(busca);
      }
      const filtro = clausulas.length ? ' WHERE ' + clausulas.join(' AND ') : '';
      return executar(consulta + filtro + ' ORDER BY a.id DESC', parametros);
    },
    buscar,
    criar(usuarioId, dados) {
      return transacao(async conexao => {
        const obra = await obraId(conexao, dados);
        const resultado = await executar(
          `INSERT INTO avaliacoes (usuario_id, obra_id, nota, comentario, criada_em)
           VALUES (?, ?, ?, ?, UTC_TIMESTAMP(3))`,
          [usuarioId, obra, dados.nota, dados.comentario], conexao,
        );
        return buscar(resultado.insertId, conexao);
      });
    },
    alterar(id, usuarioId, dados) {
      return transacao(async conexao => {
        const atual = await buscar(id, conexao, true);
        exigirDono(atual, usuarioId);
        const novos = { ...atual, ...dados };
        const obra = await obraId(conexao, novos);
        await executar(
          `UPDATE avaliacoes SET obra_id = ?, nota = ?, comentario = ?, atualizada_em = UTC_TIMESTAMP(3)
           WHERE id = ?`, [obra, novos.nota, novos.comentario, id], conexao,
        );
        return buscar(id, conexao);
      });
    },
    excluir(id, usuarioId) {
      return transacao(async conexao => {
        exigirDono(await buscar(id, conexao, true), usuarioId);
        await executar('DELETE FROM avaliacoes WHERE id = ?', [id], conexao);
      });
    },
  };
}
