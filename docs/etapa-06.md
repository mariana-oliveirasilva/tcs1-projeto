# Etapa 06 — API REST do InkCircle

O Express serve o HTML/CSS/JavaScript e a API JSON na mesma origem. O recurso principal é **avaliações**. O perfil filtra as avaliações pelo ID da conta autenticada. A página inicial consulta a lista pública.

Execute o projeto seguindo o [README](../README.md). A URL base local é `http://127.0.0.1:3000`.

| Método | Endpoint | Acesso | Sucesso |
|---|---|---|---|
| GET | `/api/saude` | Público | 200 |
| POST | `/api/contas` | Público | 201 |
| POST | `/api/sessao` | Público | 200 + cookie |
| GET | `/api/sessao` | Conta autenticada | 200 |
| DELETE | `/api/sessao` | Encerra a sessão atual | 204 |
| GET | `/api/meu-perfil` | Conta autenticada | 200 |
| GET | `/api/avaliacoes` | Público | 200 |
| GET | `/api/avaliacoes/:id` | Público | 200 |
| POST | `/api/avaliacoes` | Conta autenticada | 201 + Location |
| PUT | `/api/avaliacoes/:id` | Autor | 200 |
| PATCH | `/api/avaliacoes/:id` | Autor | 200 |
| DELETE | `/api/avaliacoes/:id` | Autor | 204 |

## Exemplos de requisição

Requisições com corpo usam `Content-Type: application/json`. A [coleção Postman](postman/InkCircle.postman_collection.json) roda o fluxo em ordem, guarda o ID criado e usa o cookie recebido no login. Execute-a com o armazenamento de cookies do Postman ativado.

| Operação | JSON enviado |
|---|---|
| `POST /api/contas` | `{"nome":"Ana","usuario":"ana_teste","email":"ana@example.com","senha":"SenhaTeste"}` |
| `POST /api/sessao` | `{"email":"ana@example.com","senha":"SenhaTeste"}` |
| `POST /api/avaliacoes` | `{"obra":"Dom Casmurro","tipo":"livro","nota":5,"comentario":"Uma narrativa cheia de ambiguidades."}` |
| `PATCH /api/avaliacoes/1` | `{"nota":4}` |

Exemplo de resposta do cadastro (`201`) e do login (`200`):

```json
{"id":1,"nome":"Ana","usuario":"ana_teste"}
```

No login o servidor também envia `Set-Cookie`. O navegador e o Postman guardam a sessão. Ao sair, o servidor invalida a sessão e responde `204` sem corpo.

Exemplo de resposta ao publicar (`201` com `Location: /api/avaliacoes/1`), consultar por ID (`200`) ou editar (`200`, com os campos atualizados):

```json
{
  "id": 1,
  "obra": "Dom Casmurro",
  "tipo": "livro",
  "nota": 5,
  "comentario": "Uma narrativa cheia de ambiguidades.",
  "criada_em": "2026-11-26T18:00:00.000Z",
  "atualizada_em": null,
  "autor_id": 1,
  "autor_nome": "Ana",
  "autor_usuario": "ana_teste"
}
```

A listagem responde com `{"total":1,"avaliacoes":[...]}` e o perfil responde com `{"id":1,"nome":"Ana","usuario":"ana_teste","avaliacoes":[...]}`. O feed mostra as mais recentes primeiro. A listagem aceita os filtros opcionais `tipo`, `nota` e `q` (trecho do título). PATCH aceita os campos a alterar e PUT exige todos os campos do POST. A exclusão retorna `204` sem corpo.

Exemplo de validação (`422`):

```json
{
  "erro": {
    "codigo": "validacao",
    "mensagem": "Revise os dados enviados.",
    "detalhes": {"nota": "Informe uma nota inteira de 1 a 5."}
  }
}
```

| Status | Situação |
|---|---|
| 400 | JSON inválido ou corpo que não é um objeto |
| 401 | Login necessário ou credenciais inválidas |
| 403 | Sessão autenticada que não é autora, ou operação de outra origem |
| 404 | Rota, ID ou avaliação inexistente |
| 409 | E-mail ou nome de usuário já cadastrado |
| 413 | Corpo acima do limite |
| 415 | Corpo com tipo diferente de JSON |
| 422 | Campos inválidos |
| 500 | Falha de operação, com detalhes registrados no servidor |

Os handlers estão em `server/app.js`, a validação em `server/validacao.js` e o acesso ao MySQL em `server/repositorio.js`. A API deriva o autor da sessão e valida a edição e a exclusão no servidor.
