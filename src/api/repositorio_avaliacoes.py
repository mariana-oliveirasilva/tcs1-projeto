"""Operações de persistência de avaliações usadas pelas rotas Flask."""
from database import agora, get_db, obter_ou_criar_obra

CONSULTA = """
SELECT a.id, o.titulo AS obra, o.tipo, a.nota, a.comentario,
       a.criada_em, a.atualizada_em
FROM avaliacoes a JOIN obras o ON o.id = a.obra_id
"""


def buscar(id):
    linha = get_db().execute(CONSULTA + " WHERE a.id = ?", (id,)).fetchone()
    return dict(linha) if linha is not None else None


def listar(tipo=None, nota=None, busca=""):
    filtros, parametros = [], []
    if tipo is not None:
        filtros.append("o.tipo = ?")
        parametros.append(tipo)
    if nota is not None:
        filtros.append("a.nota = ?")
        parametros.append(nota)
    if busca:
        texto = busca.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        filtros.append("o.titulo LIKE ? ESCAPE '\\'")
        parametros.append(f"%{texto}%")

    sql = CONSULTA
    if filtros:
        sql += " WHERE " + " AND ".join(filtros)
    linhas = get_db().execute(sql + " ORDER BY a.id DESC", parametros)
    return [dict(linha) for linha in linhas]


def criar(valores):
    db = get_db()
    with db:
        obra_id = obter_ou_criar_obra(db, valores["obra"], valores["tipo"])
        cursor = db.execute(
            "INSERT INTO avaliacoes (obra_id, nota, comentario, criada_em) "
            "VALUES (?, ?, ?, ?)",
            (obra_id, valores["nota"], valores["comentario"], agora()),
        )
        return buscar(cursor.lastrowid)


def atualizar(id, valores):
    db = get_db()
    with db:
        db.execute("BEGIN IMMEDIATE")
        atual = buscar(id)
        if atual is None:
            return None
        dados = {**atual, **valores}
        obra_id = obter_ou_criar_obra(db, dados["obra"], dados["tipo"])
        db.execute(
            "UPDATE avaliacoes SET obra_id = ?, nota = ?, comentario = ?, "
            "atualizada_em = ? WHERE id = ?",
            (obra_id, dados["nota"], dados["comentario"], agora(), id),
        )
        return buscar(id)


def excluir(id):
    db = get_db()
    with db:
        cursor = db.execute("DELETE FROM avaliacoes WHERE id = ?", (id,))
        return cursor.rowcount == 1
