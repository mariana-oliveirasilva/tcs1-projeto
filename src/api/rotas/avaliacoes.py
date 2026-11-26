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

import repositorio_avaliacoes as repositorio
from erros import ErroAPI
from validacao import TIPOS_VALIDOS, validar_avaliacao

bp = Blueprint("avaliacoes", __name__, url_prefix="/api/avaliacoes")


# ----------------------------- funções auxiliares -----------------------------

def exigir_avaliacao(avaliacao, id):
    if avaliacao is None:
        raise ErroAPI(404, "nao_encontrado", f"Avaliação {id} não encontrada.")
    return avaliacao


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


def ler_avaliacao(parcial=False):
    valores, erros = validar_avaliacao(ler_json_obrigatorio(), parcial=parcial)
    if erros:
        raise ErroAPI(422, "validacao", "Os dados enviados são inválidos.", erros)
    return valores


def atualizar(id, parcial):
    exigir_avaliacao(repositorio.buscar(id), id)
    valores = ler_avaliacao(parcial=parcial)
    return jsonify(exigir_avaliacao(repositorio.atualizar(id, valores), id))


@bp.get("")
def listar():
    """Lista avaliações, da mais recente para a mais antiga."""
    erros = {}
    tipo = request.args.get("tipo")
    if tipo is not None:
        tipo = tipo.strip().lower()
        if tipo not in TIPOS_VALIDOS:
            erros["tipo"] = "Deve ser 'livro' ou 'manga'."

    nota = request.args.get("nota")
    if nota is not None:
        try:
            nota = int(nota) if nota.isdecimal() else None
        except ValueError:
            nota = None
        if nota is None or not 1 <= nota <= 5:
            erros["nota"] = "Deve ser um número inteiro de 1 a 5."

    if erros:
        raise ErroAPI(422, "parametros_invalidos", "Parâmetros de consulta inválidos.", erros)

    busca = request.args.get("q", "").strip()
    avaliacoes = repositorio.listar(tipo, nota, busca)
    return jsonify({"total": len(avaliacoes), "avaliacoes": avaliacoes})


@bp.get("/<int:id>")
def obter(id):
    """Consulta individual."""
    return jsonify(exigir_avaliacao(repositorio.buscar(id), id))


@bp.post("")
def criar():
    """Cria uma avaliação. Responde 201 Created com o cabeçalho Location."""
    nova = repositorio.criar(ler_avaliacao())
    resposta = jsonify(nova)
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
    if not repositorio.excluir(id):
        exigir_avaliacao(None, id)
    resposta = Response(status=204)          # 204 = sem corpo
    resposta.headers.pop("Content-Type", None)  # e, portanto, sem Content-Type
    return resposta
