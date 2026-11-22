"""
validacao.py — regras de validação das entradas da API.

As regras são as mesmas do formulário do site (Etapas 04 e 05), mas
precisam existir TAMBÉM no servidor: o front-end pode ser burlado, então
o servidor nunca confia nos dados que recebe.
"""

TIPOS_VALIDOS = ("livro", "manga")
CAMPOS = ("obra", "tipo", "nota", "comentario")

OBRA_MAX = 150
COMENTARIO_MIN = 10
COMENTARIO_MAX = 1000


def _validar_obra(valor):
    if not isinstance(valor, str):
        return None, "Deve ser um texto."
    valor = valor.strip()
    if not valor:
        return None, "Não pode ser vazio."
    if len(valor) > OBRA_MAX:
        return None, f"Deve ter no máximo {OBRA_MAX} caracteres."
    return valor, None


def _validar_tipo(valor):
    if not isinstance(valor, str) or valor.strip().lower() not in TIPOS_VALIDOS:
        return None, "Deve ser 'livro' ou 'manga'."
    return valor.strip().lower(), None


def _validar_nota(valor):
    # bool é subclasse de int em Python (True == 1), por isso é excluído
    if isinstance(valor, bool) or not isinstance(valor, int):
        return None, "Deve ser um número inteiro de 1 a 5."
    if not 1 <= valor <= 5:
        return None, "Deve estar entre 1 e 5."
    return valor, None


def _validar_comentario(valor):
    if not isinstance(valor, str):
        return None, "Deve ser um texto."
    valor = valor.strip()
    if len(valor) < COMENTARIO_MIN:
        return None, f"Deve ter pelo menos {COMENTARIO_MIN} caracteres."
    if len(valor) > COMENTARIO_MAX:
        return None, f"Deve ter no máximo {COMENTARIO_MAX} caracteres."
    return valor, None


_VALIDADORES = {
    "obra": _validar_obra,
    "tipo": _validar_tipo,
    "nota": _validar_nota,
    "comentario": _validar_comentario,
}


def validar_avaliacao(dados, parcial=False):
    """
    Valida o corpo (dict) recebido em POST, PUT ou PATCH.

    parcial=False (POST e PUT): os 4 campos são obrigatórios.
    parcial=True  (PATCH):      só valida os campos enviados, mas exige ao menos um.

    Devolve (valores_limpos, erros). Se `erros` não estiver vazio, a
    requisição deve ser recusada com 422.
    """
    valores = {}
    erros = {}

    for campo in dados:
        if campo not in CAMPOS:
            erros[campo] = "Campo desconhecido."

    if parcial and not any(campo in dados for campo in CAMPOS):
        erros["corpo"] = "Informe ao menos um campo para alterar: " + ", ".join(CAMPOS) + "."

    for campo in CAMPOS:
        if campo not in dados:
            if not parcial:
                erros[campo] = "Campo obrigatório."
            continue

        valor, mensagem = _VALIDADORES[campo](dados[campo])
        if mensagem:
            erros[campo] = mensagem
        else:
            valores[campo] = valor

    return valores, erros
