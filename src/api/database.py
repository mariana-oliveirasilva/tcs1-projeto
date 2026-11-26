"""
database.py — acesso ao banco SQLite.

Usamos o módulo `sqlite3` que já vem com o Python (sem ORM), com SQL
escrito à mão. Todos os valores vão em parâmetros (`?`), nunca colados
dentro do texto do SQL: isso evita SQL Injection.
"""
from contextlib import closing
import sqlite3
from datetime import datetime, timezone

from flask import current_app, g

ESQUEMA_OBRAS = """
CREATE TABLE IF NOT EXISTS obras (
    id INTEGER PRIMARY KEY,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('livro', 'manga')),
    UNIQUE (titulo, tipo)
)
"""

ESQUEMA_AVALIACOES = """
CREATE TABLE IF NOT EXISTS avaliacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE RESTRICT,
    nota INTEGER NOT NULL CHECK (typeof(nota) = 'integer' AND nota BETWEEN 1 AND 5),
    comentario TEXT NOT NULL,
    criada_em TEXT NOT NULL,
    atualizada_em TEXT
)
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


def conectar(caminho):
    conexao = sqlite3.connect(caminho)
    conexao.row_factory = sqlite3.Row
    conexao.execute("PRAGMA foreign_keys = ON")
    return conexao


def obter_ou_criar_obra(db, titulo, tipo):
    db.execute(
        "INSERT INTO obras (titulo, tipo) VALUES (?, ?) "
        "ON CONFLICT (titulo, tipo) DO NOTHING",
        (titulo, tipo),
    )
    return db.execute(
        "SELECT id FROM obras WHERE titulo = ? AND tipo = ?", (titulo, tipo)
    ).fetchone()["id"]


def get_db():
    """Devolve a conexão do pedido atual (abre uma se ainda não existir)."""
    if "db" not in g:
        g.db = conectar(current_app.config["DATABASE"])
    return g.db


def fechar_db(erro=None):
    """Fecha a conexão ao final de cada pedido."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def migrar_avaliacoes(db):
    """Converte a tabela da Etapa 6 preservando registros e IDs já reservados."""
    db.execute("ALTER TABLE avaliacoes RENAME TO avaliacoes_antigas")
    db.execute(ESQUEMA_AVALIACOES)
    db.execute("""
        INSERT INTO obras (titulo, tipo)
        SELECT DISTINCT obra, tipo FROM avaliacoes_antigas WHERE 1
        ON CONFLICT (titulo, tipo) DO NOTHING
    """)
    db.execute("""
        INSERT INTO avaliacoes (id, obra_id, nota, comentario, criada_em, atualizada_em)
        SELECT a.id, o.id, a.nota, a.comentario, a.criada_em, a.atualizada_em
        FROM avaliacoes_antigas a
        JOIN obras o ON o.titulo = a.obra AND o.tipo = a.tipo
    """)
    sequencia = db.execute(
        "SELECT seq FROM sqlite_sequence WHERE name = 'avaliacoes_antigas'"
    ).fetchone()
    if sequencia is not None:
        db.execute("DELETE FROM sqlite_sequence WHERE name = 'avaliacoes'")
        db.execute(
            "INSERT INTO sqlite_sequence (name, seq) VALUES ('avaliacoes', ?)",
            (sequencia["seq"],),
        )
    db.execute("DROP TABLE avaliacoes_antigas")


def init_db(caminho, popular=False):
    """Inicializa ou migra o banco em uma única transação."""
    with closing(conectar(caminho)) as db, db:
        db.execute("BEGIN IMMEDIATE")
        colunas = {linha["name"] for linha in db.execute("PRAGMA table_info(avaliacoes)")}
        db.execute(ESQUEMA_OBRAS)
        if "obra" in colunas:
            migrar_avaliacoes(db)
        else:
            db.execute(ESQUEMA_AVALIACOES)
        db.execute("CREATE INDEX IF NOT EXISTS idx_avaliacoes_obra ON avaliacoes (obra_id)")

        if popular and not colunas:
            for titulo, tipo, nota, comentario in AVALIACOES_EXEMPLO:
                obra_id = obter_ou_criar_obra(db, titulo, tipo)
                db.execute(
                    "INSERT INTO avaliacoes (obra_id, nota, comentario, criada_em) "
                    "VALUES (?, ?, ?, ?)",
                    (obra_id, nota, comentario, agora()),
                )
