# Etapa 05 — Modularização e Comunicação Assíncrona

Nesta etapa o JavaScript do InkCircle foi **dividido em módulos** e passou a
**se comunicar de forma assíncrona** com dados externos, tratando
carregamento, sucesso e erro.

## 1. Modularização

Na Etapa 04 todo o código estava em um único arquivo (`src/js/script.js`).
Agora ele foi dividido em **ES Modules** (`import` / `export`). As páginas
carregam apenas o ponto de entrada:

```html
<script type="module" src="../js/main.js"></script>
```

```
src/js/
├── main.js                     ponto de entrada: importa e liga os módulos
├── modules/                    comportamento da interface
│   ├── estrelas.js             nota por estrelas (Etapa 04)
│   ├── busca.js                filtro de perfis (Etapa 04)
│   ├── sugestoes.js            sugestões de obras, consulta assíncrona (Etapa 05)
│   ├── formularios.js          validação (Etapa 04) + envio assíncrono (Etapa 05)
│   ├── validacao.js            regras de validação (funções puras)
│   └── ui.js                   mostrar/esconder, mensagens de erro nos campos
└── services/                   comunicação com dados externos
    ├── openLibrary.js          CONSULTA: API pública Open Library (fetch)
    └── avaliacoesService.js    ENVIO: serviço simulado (Promise)
```

**Por que essa divisão?** Cada arquivo tem uma responsabilidade:

- `services/` só conversa com dados externos e **não conhece o HTML**.
- `modules/` mexe na interface e **não sabe de onde os dados vêm**.
- `validacao.js` tem funções puras, fáceis de reaproveitar e testar.

Assim, quando o back-end (Flask) existir, apenas os arquivos de `services/`
precisam mudar.

**Como o `script.js` da Etapa 04 foi distribuído:**

| Antes (Etapa 04, `script.js`) | Agora (Etapa 05) |
|---|---|
| Módulo 1 — estrelas | `modules/estrelas.js` |
| Módulo 2 — busca de perfis | `modules/busca.js` |
| Módulo 3 — validação | `modules/validacao.js`, `modules/ui.js`, `modules/formularios.js` |
| (novo) | `modules/sugestoes.js`, `services/openLibrary.js`, `services/avaliacoesService.js` |

O `script.js` foi removido do projeto. A tag `etapa-04` continua apontando
para a versão com o arquivo único.

## 2. Operação de consulta — Open Library (API pública)

**Onde:** página `avaliacao.html`, campo "Título da obra".
**Arquivos:** `services/openLibrary.js` e `modules/sugestoes.js`.

Ao digitar 3 ou mais letras (e parar de digitar por 400 ms), o site consulta
a API pública da Open Library e mostra até 6 sugestões de livros (título,
autor e ano). Ao clicar em uma sugestão, o título é preenchido no campo.

```js
const resposta = await fetch('https://openlibrary.org/search.json?q=...&limit=6&fields=...');
if (!resposta.ok) throw new Error(...);   // fetch não lança erro em 404/500
const dados = await resposta.json();
```

Detalhes importantes:

- **`async/await` + `fetch`** (Fetch API, baseada em Promises).
- **Debounce** com `setTimeout`: evita uma requisição a cada letra.
- **`AbortController`**: se o usuário continua digitando, a busca anterior é
  cancelada, para uma resposta antiga não sobrescrever a nova.
- Os dados externos são inseridos com `textContent` (nunca `innerHTML`), para
  que nenhum texto vindo da API seja interpretado como HTML.

## 3. Operação submetida ao servidor — serviço simulado

**Onde:** página `avaliacao.html`, botão "Publicar avaliação".
**Arquivos:** `services/avaliacoesService.js` e `modules/formularios.js`.

Como o back-end ainda não existe, o envio vai para um **serviço simulado**:
uma função `async` que devolve uma Promise, demora ~1,2 s (como uma rede
real), grava a avaliação no `localStorage` (simulando o banco de dados do
servidor) e devolve a avaliação salva.

Para demonstrar o tratamento de erro, o serviço **recusa o envio quando o
título da obra é `erro`** (simula um erro 500 do servidor).

## 4. Estados tratados

| Estado | Consulta (sugestões de obras) | Envio (publicar avaliação) |
|---|---|---|
| **Carregando** | "Buscando sugestões na Open Library..." com indicador girando | Botão desativado com texto "Enviando...", mensagem "Enviando sua avaliação..." com indicador, `aria-busy` no formulário |
| **Sucesso** | Lista de sugestões clicáveis | Mensagem verde "Avaliação de "…" publicada com sucesso!", formulário e estrelas limpos |
| **Vazio** | "Nenhuma obra encontrada. Você pode digitar o título manualmente." | — |
| **Erro** | "Não foi possível buscar sugestões agora..." (falha de rede ou resposta com erro) | Caixa vermelha "Não foi possível publicar sua avaliação..." — os dados digitados são mantidos para tentar de novo |

Em ambos os casos o bloco `try / catch / finally` garante que o estado de
carregamento é sempre desligado, com sucesso ou erro.

## 5. Como executar

ES Modules **não funcionam abrindo o HTML com duplo clique** (o navegador
bloqueia `import` em `file://`). É preciso um servidor local:

1. No VS Code, instale a extensão **Live Server** (Ritwick Dey).
2. Clique com o botão direito em `src/pages/avaliacao.html` → **Open with Live Server**.
3. O site abre em `http://127.0.0.1:5500/...`.

## 6. Como testar

1. **Consulta com sucesso:** em `avaliacao.html`, digite `berserk` no título e
   aguarde as sugestões.
2. **Consulta vazia:** digite `zzzzzzzz`.
3. **Consulta com erro:** abra o DevTools (F12) → aba **Network** → troque
   "No throttling" por **Offline** → digite um título.
4. **Envio com sucesso:** preencha tudo (título, tipo, estrelas, comentário
   com 10+ caracteres) e envie.
5. **Envio com erro:** use o título `erro` e envie.

## 7. Matriz de requisitos

| Requisito | Onde foi atendido | Arquivo(s) |
|---|---|---|
| Separar o código em módulos | ES Modules em `modules/` e `services/` | `js/main.js`, `js/modules/*`, `js/services/*` |
| Evitar um único arquivo com toda a lógica | `script.js` dividido em 9 arquivos | `js/` |
| Chamadas assíncronas | Consulta e envio | `openLibrary.js`, `avaliacoesService.js` |
| Fetch API | `fetch` na Open Library | `services/openLibrary.js` |
| Promises e/ou async/await | `async/await`, `new Promise`, `try/catch/finally` | `services/*`, `modules/sugestoes.js`, `modules/formularios.js` |
| Estados de carregamento | Indicador nas sugestões e no envio | `sugestoes.js`, `formularios.js`, `style.css` |
| Erros de comunicação | Falha de rede, resposta 500, serviço recusando | `openLibrary.js`, `sugestoes.js`, `formularios.js` |
| Dados externos ou serviço simulado | API Open Library + serviço simulado | `services/` |
| Operação de consulta | Sugestões de obras | `sugestoes.js` + `openLibrary.js` |
| Operação submetida ao servidor | Publicar avaliação | `formularios.js` + `avaliacoesService.js` |
| Tratamento de sucesso / erro / carregamento | Seção 4 acima | — |

## 8. Evidências

Capturas de tela em `docs/evidencias/etapa-05/`:

- `01-consulta-carregando.png`
- `02-consulta-sucesso.png`
- `03-consulta-erro.png`
- `04-envio-carregando.png`
- `05-envio-sucesso.png`
- `06-envio-erro.png`
- `07-network-fetch.png` (aba Network mostrando a requisição `search.json` com status 200)
- `08-estrutura-modulos.png` (pastas `js/modules` e `js/services` no VS Code)
