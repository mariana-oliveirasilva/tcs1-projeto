"""
erros.py — formato único de erro para toda a API.

Todo erro (validação, não encontrado, método errado, falha interna...)
sai neste formato JSON, para o cliente tratar sempre do mesmo jeito:

    {
      "erro": {
        "codigo": "validacao",
        "mensagem": "Os dados enviados são inválidos.",
        "detalhes": { "nota": "Deve estar entre 1 e 5." }   <- opcional
      }
    }
"""
import sqlite3

from flask import jsonify
from werkzeug.exceptions import HTTPException

MENSAGENS_HTTP = {
    404: ("nao_encontrado", "Rota não encontrada."),
    405: ("metodo_nao_permitido", "Método HTTP não permitido para esta rota."),
    413: ("corpo_muito_grande", "O corpo da requisição é grande demais."),
}


class ErroAPI(Exception):
    """Erro 'esperado' lançado pelas rotas; vira uma resposta JSON padronizada."""

    def __init__(self, status, codigo, mensagem, detalhes=None):
        super().__init__(mensagem)
        self.status = status
        self.codigo = codigo
        self.mensagem = mensagem
        self.detalhes = detalhes


def resposta_erro(status, codigo, mensagem, detalhes=None):
    corpo = {"erro": {"codigo": codigo, "mensagem": mensagem}}
    if detalhes:
        corpo["erro"]["detalhes"] = detalhes
    return jsonify(corpo), status


def registrar_handlers(app):
    @app.errorhandler(ErroAPI)
    def tratar_erro_api(erro):
        return resposta_erro(erro.status, erro.codigo, erro.mensagem, erro.detalhes)

    @app.errorhandler(HTTPException)
    def tratar_erro_http(erro):
        codigo, mensagem = MENSAGENS_HTTP.get(erro.code, ("erro_http", erro.description))
        resposta, status = resposta_erro(erro.code, codigo, mensagem)
        if erro.code == 405 and getattr(erro, "valid_methods", None):
            resposta.headers["Allow"] = ", ".join(erro.valid_methods)
        return resposta, status

    @app.errorhandler(sqlite3.Error)
    def tratar_erro_persistencia(erro):
        app.logger.exception("Falha de persistência: %s", erro)
        return resposta_erro(500, "erro_persistencia", "Falha ao acessar o banco de dados.")

    @app.errorhandler(Exception)
    def tratar_erro_inesperado(erro):
        app.logger.exception("Erro inesperado: %s", erro)
        return resposta_erro(500, "erro_interno", "Erro interno do servidor.")
