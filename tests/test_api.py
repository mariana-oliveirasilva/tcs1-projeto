"""
Testes automatizados da API do InkCircle (Etapa 06).

Como rodar (a partir da raiz do projeto, com o ambiente virtual ativo):
    pytest tests -v

Cada teste usa um banco SQLite temporário e vazio, então um teste nunca
interfere no outro nem no banco real (src/api/inkcircle.db).
"""
import sqlite3
from contextlib import closing
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src" / "api"))

from app import create_app  # noqa: E402

VALIDA = {
    "obra": "Dom Casmurro",
    "tipo": "livro",
    "nota": 5,
    "comentario": "Capitu: traiu ou não traiu? Ótimo debate.",
}


@pytest.fixture
def app(tmp_path):
    app = create_app(str(tmp_path / "teste.db"))
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def criar(client, **mudancas):
    corpo = {**VALIDA, **mudancas}
    resposta = client.post("/api/avaliacoes", json=corpo)
    assert resposta.status_code == 201, resposta.get_json()
    return resposta.get_json()


# ------------------------------- saúde / raiz -------------------------------

def test_saude(client):
    resposta = client.get("/api/saude")
    assert resposta.status_code == 200
    assert resposta.get_json() == {"status": "ok"}


def test_raiz_descreve_a_api(client):
    dados = client.get("/").get_json()
    assert dados["recursos"]["avaliacoes"] == "/api/avaliacoes"


# ---------------------------------- GET lista ---------------------------------

def test_listar_vazio(client):
    resposta = client.get("/api/avaliacoes")
    assert resposta.status_code == 200
    assert resposta.get_json() == {"total": 0, "avaliacoes": []}


def test_listar_ordem_mais_recente_primeiro(client):
    criar(client, obra="Primeira")
    criar(client, obra="Segunda")
    obras = [a["obra"] for a in client.get("/api/avaliacoes").get_json()["avaliacoes"]]
    assert obras == ["Segunda", "Primeira"]


def test_listar_com_barra_final(client):
    assert client.get("/api/avaliacoes/").status_code == 200


def test_filtrar_por_tipo_nota_e_busca(client):
    criar(client, obra="Vagabond", tipo="manga", nota=5)
    criar(client, obra="1984", tipo="livro", nota=4)
    criar(client, obra="Berserk", tipo="manga", nota=3)

    def obras(consulta):
        dados = client.get("/api/avaliacoes" + consulta).get_json()
        assert dados["total"] == len(dados["avaliacoes"])
        return sorted(a["obra"] for a in dados["avaliacoes"])

    assert obras("?tipo=manga") == ["Berserk", "Vagabond"]
    assert obras("?tipo=MANGA") == ["Berserk", "Vagabond"]
    assert obras("?nota=4") == ["1984"]
    assert obras("?q=vaga") == ["Vagabond"]
    assert obras("?tipo=manga&nota=5") == ["Vagabond"]
    assert obras("?q=nao-existe") == []


def test_busca_trata_porcentagem_como_texto_comum(client):
    criar(client, obra="Vagabond")
    assert client.get("/api/avaliacoes?q=%25").get_json()["total"] == 0  # %25 = "%"


def test_busca_resiste_a_sql_injection(client):
    criar(client)
    resposta = client.get("/api/avaliacoes", query_string={"q": "' OR 1=1 --"})
    assert resposta.status_code == 200
    assert resposta.get_json()["total"] == 0
    assert client.get("/api/avaliacoes").get_json()["total"] == 1  # tabela intacta


@pytest.mark.parametrize("consulta,campo", [
    ("?tipo=filme", "tipo"),
    ("?nota=0", "nota"),
    ("?nota=6", "nota"),
    ("?nota=abc", "nota"),
    ("?nota=-1", "nota"),
])
def test_filtros_invalidos(client, consulta, campo):
    resposta = client.get("/api/avaliacoes" + consulta)
    assert resposta.status_code == 422
    erro = resposta.get_json()["erro"]
    assert erro["codigo"] == "parametros_invalidos"
    assert campo in erro["detalhes"]


# ------------------------------- GET individual -------------------------------

def test_obter_existente(client):
    criada = criar(client)
    resposta = client.get(f"/api/avaliacoes/{criada['id']}")
    assert resposta.status_code == 200
    assert resposta.get_json() == criada


def test_obter_inexistente_404(client):
    resposta = client.get("/api/avaliacoes/999")
    assert resposta.status_code == 404
    assert resposta.get_json()["erro"]["codigo"] == "nao_encontrado"


def test_id_nao_numerico_404_em_json(client):
    resposta = client.get("/api/avaliacoes/abc")
    assert resposta.status_code == 404
    assert "erro" in resposta.get_json()


# ------------------------------------ POST ------------------------------------

def test_criar_201_com_location(client):
    resposta = client.post("/api/avaliacoes", json=VALIDA)
    assert resposta.status_code == 201
    corpo = resposta.get_json()
    assert corpo["id"] == 1
    assert corpo["obra"] == "Dom Casmurro"
    assert corpo["nota"] == 5
    assert corpo["criada_em"]
    assert corpo["atualizada_em"] is None
    assert resposta.headers["Location"].endswith("/api/avaliacoes/1")


def test_criar_normaliza_espacos_e_tipo(client):
    criada = criar(client, obra="  Vagabond  ", tipo=" MANGA ", comentario="   Arte espetacular!   ")
    assert criada["obra"] == "Vagabond"
    assert criada["tipo"] == "manga"
    assert criada["comentario"] == "Arte espetacular!"


def test_resposta_preserva_acentos_e_e_utf8(client):
    resposta = client.post("/api/avaliacoes", json=VALIDA)
    assert "Ótimo debate" in resposta.get_data(as_text=True)  # sem Ó
    assert "utf-8" in resposta.headers["Content-Type"].lower() or resposta.mimetype == "application/json"


def test_criar_corpo_vazio_exige_todos_os_campos(client):
    resposta = client.post("/api/avaliacoes", json={})
    assert resposta.status_code == 422
    erro = resposta.get_json()["erro"]
    assert erro["codigo"] == "validacao"
    assert set(erro["detalhes"]) == {"obra", "tipo", "nota", "comentario"}


@pytest.mark.parametrize("campo,valor", [
    ("obra", ""),
    ("obra", "   "),
    ("obra", 123),
    ("obra", "x" * 151),
    ("tipo", "filme"),
    ("tipo", None),
    ("nota", 0),
    ("nota", 6),
    ("nota", 4.5),
    ("nota", "5"),
    ("nota", True),
    ("nota", None),
    ("comentario", "curto"),
    ("comentario", "         curto    "),
    ("comentario", "x" * 1001),
    ("comentario", 12345678901),
])
def test_criar_valores_invalidos_422(client, campo, valor):
    resposta = client.post("/api/avaliacoes", json={**VALIDA, campo: valor})
    assert resposta.status_code == 422
    assert list(resposta.get_json()["erro"]["detalhes"]) == [campo]
    assert client.get("/api/avaliacoes").get_json()["total"] == 0  # nada foi gravado


def test_criar_campo_desconhecido_422(client):
    resposta = client.post("/api/avaliacoes", json={**VALIDA, "autor": "Machado"})
    assert resposta.status_code == 422
    assert "autor" in resposta.get_json()["erro"]["detalhes"]


def test_criar_json_malformado_400(client):
    resposta = client.post("/api/avaliacoes", data="{isso nao e json", content_type="application/json")
    assert resposta.status_code == 400
    assert resposta.get_json()["erro"]["codigo"] == "json_invalido"


@pytest.mark.parametrize("corpo", ["[1, 2, 3]", "null", '"texto"', "42"])
def test_criar_json_que_nao_e_objeto_400(client, corpo):
    resposta = client.post("/api/avaliacoes", data=corpo, content_type="application/json")
    assert resposta.status_code == 400
    assert resposta.get_json()["erro"]["codigo"] == "json_invalido"


def test_criar_sem_content_type_json_415(client):
    resposta = client.post("/api/avaliacoes", data="obra=x", content_type="text/plain")
    assert resposta.status_code == 415
    assert resposta.get_json()["erro"]["codigo"] == "tipo_de_conteudo_nao_suportado"


# ------------------------------------- PUT ------------------------------------

def test_put_substitui_todos_os_campos(client):
    criada = criar(client)
    novo = {"obra": "1984", "tipo": "livro", "nota": 3, "comentario": "Distopia que continua atual."}
    resposta = client.put(f"/api/avaliacoes/{criada['id']}", json=novo)
    assert resposta.status_code == 200
    corpo = resposta.get_json()
    assert {k: corpo[k] for k in novo} == novo
    assert corpo["id"] == criada["id"]
    assert corpo["criada_em"] == criada["criada_em"]
    assert corpo["atualizada_em"] is not None


def test_put_incompleto_422(client):
    criada = criar(client)
    resposta = client.put(f"/api/avaliacoes/{criada['id']}", json={"nota": 1})
    assert resposta.status_code == 422
    assert set(resposta.get_json()["erro"]["detalhes"]) == {"obra", "tipo", "comentario"}
    assert client.get(f"/api/avaliacoes/{criada['id']}").get_json()["nota"] == 5  # não mudou


def test_put_inexistente_404(client):
    assert client.put("/api/avaliacoes/999", json=VALIDA).status_code == 404


# ------------------------------------ PATCH -----------------------------------

def test_patch_altera_so_o_enviado(client):
    criada = criar(client)
    resposta = client.patch(f"/api/avaliacoes/{criada['id']}", json={"nota": 2})
    assert resposta.status_code == 200
    corpo = resposta.get_json()
    assert corpo["nota"] == 2
    assert corpo["obra"] == criada["obra"]
    assert corpo["comentario"] == criada["comentario"]
    assert corpo["atualizada_em"] is not None


def test_patch_corpo_vazio_422(client):
    criada = criar(client)
    resposta = client.patch(f"/api/avaliacoes/{criada['id']}", json={})
    assert resposta.status_code == 422
    assert "corpo" in resposta.get_json()["erro"]["detalhes"]


def test_patch_valor_invalido_422_e_nao_altera(client):
    criada = criar(client)
    resposta = client.patch(f"/api/avaliacoes/{criada['id']}", json={"nota": 9, "obra": "Novo"})
    assert resposta.status_code == 422
    assert client.get(f"/api/avaliacoes/{criada['id']}").get_json()["obra"] == criada["obra"]


def test_patch_campo_desconhecido_422(client):
    criada = criar(client)
    resposta = client.patch(f"/api/avaliacoes/{criada['id']}", json={"coment": "typo no nome do campo"})
    assert resposta.status_code == 422


def test_patch_inexistente_404(client):
    assert client.patch("/api/avaliacoes/999", json={"nota": 1}).status_code == 404


# ----------------------------------- DELETE -----------------------------------

def test_delete_204_e_some(client):
    criada = criar(client)
    resposta = client.delete(f"/api/avaliacoes/{criada['id']}")
    assert resposta.status_code == 204
    assert resposta.get_data() == b""
    assert "Content-Type" not in resposta.headers or resposta.headers["Content-Type"] != "text/html; charset=utf-8"
    assert client.get(f"/api/avaliacoes/{criada['id']}").status_code == 404
    assert client.get("/api/avaliacoes").get_json()["total"] == 0


def test_delete_inexistente_404(client):
    assert client.delete("/api/avaliacoes/999").status_code == 404


def test_delete_nao_reaproveita_id(client):
    primeira = criar(client)
    client.delete(f"/api/avaliacoes/{primeira['id']}")
    assert criar(client)["id"] == primeira["id"] + 1


# --------------------------- erros gerais e consistência ----------------------

def test_metodo_nao_permitido_405_com_allow(client):
    resposta = client.delete("/api/avaliacoes")
    assert resposta.status_code == 405
    assert resposta.get_json()["erro"]["codigo"] == "metodo_nao_permitido"
    assert "GET" in resposta.headers["Allow"] and "POST" in resposta.headers["Allow"]


def test_rota_inexistente_404_em_json(client):
    resposta = client.get("/api/nao-existe")
    assert resposta.status_code == 404
    assert resposta.get_json()["erro"]["codigo"] == "nao_encontrado"


def test_erro_inesperado_vira_500_padronizado(app):
    @app.get("/api/quebra")
    def quebra():
        raise RuntimeError("falha de teste")

    resposta = app.test_client().get("/api/quebra")
    assert resposta.status_code == 500
    assert resposta.get_json()["erro"]["codigo"] == "erro_interno"
    assert "falha de teste" not in resposta.get_data(as_text=True)  # não vaza detalhes internos


def test_todos_os_erros_seguem_o_mesmo_formato(client):
    respostas = [
        client.get("/api/avaliacoes/999"),
        client.post("/api/avaliacoes", json={}),
        client.post("/api/avaliacoes", data="x", content_type="application/json"),
        client.post("/api/avaliacoes", data="x", content_type="text/plain"),
        client.delete("/api/avaliacoes"),
        client.get("/nada"),
        client.get("/api/avaliacoes?nota=9"),
    ]
    for resposta in respostas:
        assert resposta.status_code >= 400
        erro = resposta.get_json()["erro"]
        assert set(erro) >= {"codigo", "mensagem"}


# ------------------------------------- CORS -----------------------------------

def test_cors_permite_live_server(client):
    resposta = client.get("/api/avaliacoes", headers={"Origin": "http://127.0.0.1:5500"})
    assert resposta.headers["Access-Control-Allow-Origin"] == "http://127.0.0.1:5500"


def test_cors_nega_outras_origens(client):
    resposta = client.get("/api/avaliacoes", headers={"Origin": "http://site-malicioso.com"})
    assert "Access-Control-Allow-Origin" not in resposta.headers


def test_cors_preflight_de_patch(client):
    resposta = client.options("/api/avaliacoes/1", headers={
        "Origin": "http://localhost:5500",
        "Access-Control-Request-Method": "PATCH",
        "Access-Control-Request-Headers": "content-type",
    })
    assert resposta.status_code in (200, 204)
    assert "PATCH" in resposta.headers["Access-Control-Allow-Methods"]


# ---------------------------------- persistência ------------------------------

def test_dados_persistem_entre_instancias_da_app(tmp_path):
    caminho = str(tmp_path / "persistente.db")
    primeira = create_app(caminho).test_client()
    primeira.post("/api/avaliacoes", json=VALIDA)

    segunda = create_app(caminho).test_client()  # "reinicia o servidor"
    assert segunda.get("/api/avaliacoes").get_json()["total"] == 1


def test_popular_so_na_primeira_criacao_do_banco(tmp_path):
    caminho = str(tmp_path / "exemplo.db")
    app = create_app(caminho, popular=True)
    cliente = app.test_client()
    total = cliente.get("/api/avaliacoes").get_json()["total"]
    assert total == 3

    for a in cliente.get("/api/avaliacoes").get_json()["avaliacoes"]:
        cliente.delete(f"/api/avaliacoes/{a['id']}")

    reiniciada = create_app(caminho, popular=True).test_client()
    assert reiniciada.get("/api/avaliacoes").get_json()["total"] == 0  # não re-popula


# -------------------------------- Etapa 07 ------------------------------------

def test_migra_banco_da_etapa_06_preservando_dados_e_sequencia(tmp_path):
    caminho = tmp_path / "legado.db"
    with closing(sqlite3.connect(caminho)) as db, db:
        db.executescript("""
            CREATE TABLE avaliacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                obra TEXT NOT NULL,
                tipo TEXT NOT NULL,
                nota INTEGER NOT NULL,
                comentario TEXT NOT NULL,
                criada_em TEXT NOT NULL,
                atualizada_em TEXT
            );
            INSERT INTO avaliacoes VALUES
                (3, 'Dom Casmurro', 'livro', 5, 'Comentário antigo.', 'data-1', 'data-2'),
                (7, 'Dom Casmurro', 'livro', 4, 'Outro comentário.', 'data-3', NULL),
                (9, 'Outra obra', 'livro', 4, 'Avaliação excluída.', 'data-4', NULL);
            DELETE FROM avaliacoes WHERE id = 9;
        """)

    cliente = create_app(caminho, popular=True).test_client()
    dados = cliente.get("/api/avaliacoes").get_json()["avaliacoes"]
    assert [avaliacao["id"] for avaliacao in dados] == [7, 3]
    assert dados[1] == {
        "id": 3, "obra": "Dom Casmurro", "tipo": "livro", "nota": 5,
        "comentario": "Comentário antigo.", "criada_em": "data-1",
        "atualizada_em": "data-2",
    }
    with closing(sqlite3.connect(caminho)) as db:
        assert db.execute("SELECT COUNT(*) FROM obras").fetchone()[0] == 1
        assert db.execute("PRAGMA foreign_key_check").fetchall() == []

    assert criar(cliente)["id"] == 10
    reiniciada = create_app(caminho, popular=True).test_client()
    assert reiniciada.get("/api/avaliacoes").get_json()["total"] == 3


def test_atualizar_obra_de_uma_avaliacao_preserva_as_outras(client):
    primeira = criar(client)
    segunda = criar(client)
    rota = f"/api/avaliacoes/{primeira['id']}"

    resposta = client.patch(rota, json={"obra": "Memórias Póstumas", "tipo": "manga"})
    assert resposta.status_code == 200
    assert resposta.get_json()["obra"] == "Memórias Póstumas"
    assert resposta.get_json()["tipo"] == "manga"
    assert client.get(f"/api/avaliacoes/{segunda['id']}").get_json() == segunda


def test_falha_de_gravacao_desfaz_criacao_da_obra(app, client):
    with closing(sqlite3.connect(app.config["DATABASE"])) as db, db:
        db.execute("""
            CREATE TRIGGER erro_teste BEFORE INSERT ON avaliacoes
            BEGIN
                SELECT RAISE(ABORT, 'detalhe interno de teste');
            END;
        """)

    resposta = client.post("/api/avaliacoes", json=VALIDA)
    assert resposta.status_code == 500
    assert resposta.get_json()["erro"]["codigo"] == "erro_persistencia"
    assert "detalhe interno" not in resposta.get_data(as_text=True)
    with closing(sqlite3.connect(app.config["DATABASE"])) as db:
        assert db.execute("SELECT COUNT(*) FROM obras").fetchone()[0] == 0
        assert db.execute("SELECT COUNT(*) FROM avaliacoes").fetchone()[0] == 0
