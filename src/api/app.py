"""
app.py — ponto de entrada da API do InkCircle (Flask).

Executar (dentro da pasta src/api):
    python app.py

A API sobe em http://127.0.0.1:5000
"""
import os

from flask import Flask, jsonify
from flask_cors import CORS

from database import fechar_db, init_db
from erros import registrar_handlers
from rotas.avaliacoes import bp as avaliacoes_bp

CAMINHO_PADRAO_DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "inkcircle.db")

# o site (Live Server) roda em outra "origem" (porta diferente da API);
# o CORS autoriza o navegador a chamar a API a partir de localhost
ORIGENS_PERMITIDAS = r"http://(localhost|127\.0\.0\.1)(:\d+)?"


def create_app(caminho_db=None, popular=False):
    """Cria e configura a aplicação (os testes usam isso com um banco temporário)."""
    app = Flask(__name__)
    app.url_map.strict_slashes = False   # /api/avaliacoes e /api/avaliacoes/ valem igual
    app.json.ensure_ascii = False        # acentos legíveis no JSON ("avaliação")
    app.json.sort_keys = False           # mantém a ordem dos campos (id primeiro)

    app.config["DATABASE"] = caminho_db or os.environ.get("INKCIRCLE_DB", CAMINHO_PADRAO_DB)
    init_db(app.config["DATABASE"], popular=popular)
    app.teardown_appcontext(fechar_db)

    CORS(
        app,
        resources={r"/api/*": {"origins": ORIGENS_PERMITIDAS}},
        expose_headers=["Location"],
    )

    app.register_blueprint(avaliacoes_bp)
    registrar_handlers(app)

    @app.get("/")
    def raiz():
        return jsonify({
            "nome": "InkCircle API",
            "versao": "1.0",
            "recursos": {"avaliacoes": "/api/avaliacoes"},
            "saude": "/api/saude",
        })

    @app.get("/api/saude")
    def saude():
        return jsonify({"status": "ok"})

    return app


if __name__ == "__main__":
    porta = int(os.environ.get("PORT", 5000))
    create_app(popular=True).run(host="127.0.0.1", port=porta, debug=True)
