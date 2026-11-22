"""
database.py — acesso ao banco SQLite.

Usamos o módulo `sqlite3` que já vem com o Python (sem ORM), com SQL
escrito à mão. Todos os valores vão em parâmetros (`?`), nunca colados
dentro do texto do SQL: isso evita SQL Injection.
"""
import os
import sqlite3
from datetime import datetime, timezone

from flask import current_app, g

ESQUEMA = """
CREATE TABLE IF NOT EXISTS avaliacoes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    obra          TEXT    NOT NULL,
    tipo          TEXT    NOT NULL CHECK (tipo IN ('livro', 'manga')),
    nota          INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario    TEXT    NOT NULL,
    criada_em     TEXT    NOT NULL,
    atualizada_em TEXT
);
"""

# dados de exemplo, inseridos só quando o banco é criado pela primeira vez
AVALIACOES_EXEMPLO = [
    ("Vagabond", "manga", 5, "A arte a bico de pena do Inoue é de outro nível."),
    ("1Q84", "livro", 4, "Murakami fazendo Murakami: estranho e viciante."),
    ("Berserk", "manga", 5, "Sombrio, intenso e com personagens inesquecíveis."),
]


def agora():
    """Data/hora atual em UTC, no formato ISO 8601 (ex.: 2026-11-22T15:30:00+00:00)."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def get_db():
    """Devolve a conexão do pedido atual (abre uma se ainda não existir)."""
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row  # permite acessar colunas pelo nome
    return g.db


def fechar_db(erro=None):
    """Fecha a conexão ao final de cada pedido."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(caminho, popular=False):
    """Cria a tabela (se não existir) e, opcionalmente, insere dados de exemplo."""
    banco_ja_existia = os.path.exists(caminho)

    conexao = sqlite3.connect(caminho)
    conexao.executescript(ESQUEMA)

    if popular and not banco_ja_existia:
        for obra, tipo, nota, comentario in AVALIACOES_EXEMPLO:
            conexao.execute(
                "INSERT INTO avaliacoes (obra, tipo, nota, comentario, criada_em) "
                "VALUES (?, ?, ?, ?, ?)",
                (obra, tipo, nota, comentario, agora()),
            )

    conexao.commit()
    conexao.close()
