"""
rotas/avaliacoes.py — rotas do recurso "avaliações".

Todas as rotas deste arquivo ficam sob o prefixo /api/avaliacoes:

    GET     /api/avaliacoes          lista (com filtros opcionais)
    GET     /api/avaliacoes/<id>     consulta individual
    POST    /api/avaliacoes          cria
    PUT     /api/avaliacoes/<id>     substitui (todos os campos)
    PATCH   /api/avaliacoes/<id>     altera parcialmente
    DELETE  /api/avaliacoes/<id>     exclui
"""
from flask import Blueprint, Response, jsonify, request, url_for

from database import agora, get_db
from erros import ErroAPI
from validacao import TIPOS_VALIDOS, validar_avaliacao

bp = Blueprint("avaliacoes", __name__, url_prefix="/api/avaliacoes")


# ----------------------------- funções auxiliares -----------------------------

def buscar_ou_404(id):
    linha = get_db().execute("SELECT * FROM avaliacoes WHERE id = ?", (id,)).fetchone()
    if linha is None:
        raise ErroAPI(404, "nao_encontrado", f"Avaliação {id} não encontrada.")
    return linha


def ler_json_obrigatorio():
    """Lê o corpo da requisição como JSON (objeto), ou lança o erro HTTP adequado."""
    if not request.is_json:
        raise ErroAPI(
            415,
            "tipo_de_conteudo_nao_suportado",
            "Envie o corpo em JSON com o cabeçalho Content-Type: application/json.",
        )
    dados = request.get_json(silent=True)
    if dados is None:
        raise ErroAPI(400, "json_invalido", "O corpo da requisição não é um JSON válido.")
    if not isinstance(dados, dict):
        raise ErroAPI(400, "json_invalido", "O corpo deve ser um objeto JSON, como {\"obra\": \"...\"}.")
    return dados


def escapar_like(texto):
    """Faz % e _ digitados pelo usuário valerem como texto comum na busca (LIKE)."""
    return texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def atualizar(id, parcial):
    """Lógica compartilhada por PUT (parcial=False) e PATCH (parcial=True)."""
    buscar_ou_404(id)
    dados = ler_json_obrigatorio()

    valores, erros = validar_avaliacao(dados, parcial=parcial)
    if erros:
        raise ErroAPI(422, "validacao", "Os dados enviados são inválidos.", erros)

    # os nomes das colunas vêm de `valores`, que só contém campos da lista fixa
    # CAMPOS (validada acima); os valores em si vão como parâmetros (?)
    colunas = ", ".join(f"{campo} = ?" for campo in valores)
    parametros = list(valores.values()) + [agora(), id]

    db = get_db()
    db.execute(f"UPDATE avaliacoes SET {colunas}, atualizada_em = ? WHERE id = ?", parametros)
    db.commit()
    return jsonify(dict(buscar_ou_404(id)))


# ---------------------------------- rotas ----------------------------------

@bp.get("")
def listar():
    """Lista avaliações, da mais recente para a mais antiga. Filtros: tipo, nota, q."""
    filtros, parametros, erros = [], [], {}

    tipo = request.args.get("tipo")
    if tipo is not None:
        tipo = tipo.strip().lower()
        if tipo in TIPOS_VALIDOS:
            filtros.append("tipo = ?")
            parametros.append(tipo)
        else:
            erros["tipo"] = "Deve ser 'livro' ou 'manga'."

    nota = request.args.get("nota")
    if nota is not None:
        if nota.isdigit() and 1 <= int(nota) <= 5:
            filtros.append("nota = ?")
            parametros.append(int(nota))
        else:
            erros["nota"] = "Deve ser um número inteiro de 1 a 5."

    busca = request.args.get("q", "").strip()
    if busca:
        filtros.append("obra LIKE ? ESCAPE '\\'")
        parametros.append(f"%{escapar_like(busca)}%")

    if erros:
        raise ErroAPI(422, "parametros_invalidos", "Parâmetros de consulta inválidos.", erros)

    sql = "SELECT * FROM avaliacoes"
    if filtros:
        sql += " WHERE " + " AND ".join(filtros)
    sql += " ORDER BY id DESC"

    linhas = get_db().execute(sql, parametros).fetchall()
    return jsonify({"total": len(linhas), "avaliacoes": [dict(l) for l in linhas]})


@bp.get("/<int:id>")
def obter(id):
    """Consulta individual."""
    return jsonify(dict(buscar_ou_404(id)))


@bp.post("")
def criar():
    """Cria uma avaliação. Responde 201 Created com o cabeçalho Location."""
    dados = ler_json_obrigatorio()

    valores, erros = validar_avaliacao(dados)
    if erros:
        raise ErroAPI(422, "validacao", "Os dados enviados são inválidos.", erros)

    db = get_db()
    cursor = db.execute(
        "INSERT INTO avaliacoes (obra, tipo, nota, comentario, criada_em) "
        "VALUES (?, ?, ?, ?, ?)",
        (valores["obra"], valores["tipo"], valores["nota"], valores["comentario"], agora()),
    )
    db.commit()

    nova = buscar_ou_404(cursor.lastrowid)
    resposta = jsonify(dict(nova))
    resposta.status_code = 201
    resposta.headers["Location"] = url_for("avaliacoes.obter", id=nova["id"])
    return resposta


@bp.put("/<int:id>")
def substituir(id):
    """Substitui a avaliação: exige TODOS os campos."""
    return atualizar(id, parcial=False)


@bp.patch("/<int:id>")
def alterar(id):
    """Altera só os campos enviados."""
    return atualizar(id, parcial=True)


@bp.delete("/<int:id>")
def excluir(id):
    """Exclui. Responde 204 No Content (sem corpo)."""
    buscar_ou_404(id)
    db = get_db()
    db.execute("DELETE FROM avaliacoes WHERE id = ?", (id,))
    db.commit()
    resposta = Response(status=204)          # 204 = sem corpo
    resposta.headers.pop("Content-Type", None)  # e, portanto, sem Content-Type
    return resposta
