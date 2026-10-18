# Etapa 04 — Interatividade com JavaScript

Este documento descreve as funcionalidades interativas implementadas com
JavaScript puro (sem framework) no InkCircle, conforme pedido na Etapa 04.

## Funcionalidades escolhidas

Das opções possíveis, foram implementadas três funcionalidades interativas:

1. **Seleção de nota por estrelas interativa** — página `avaliacao.html`
2. **Filtro/busca dinâmica de perfis** — página `busca.html`
3. **Validação de formulários** — páginas `criar-conta.html`, `entrar.html`
   e `avaliacao.html`

Todo o código está em um único arquivo, `src/js/script.js`, carregado em
todas as páginas. Cada módulo só é ativado se encontrar os elementos que
precisa na página atual — por isso o mesmo arquivo funciona em várias
páginas sem gerar erros.

---

## 1. Seleção de nota por estrelas interativa

**Arquivo:** `src/pages/avaliacao.html`

A nota deixou de ser um grupo de `radio buttons` e passou a ser 5 botões
(`<button class="estrela">`) clicáveis. Um campo oculto (`<input type="hidden"
id="nota-valor">`) guarda o valor real da nota, que é enviado junto com o
formulário.

**Como funciona:**
- Ao passar o mouse sobre uma estrela, todas as estrelas até ali ficam
  verdes (pré-visualização), usando o evento `mouseenter`.
- Ao tirar o mouse da área (`mouseleave`), as estrelas voltam a mostrar a
  nota que já foi **clicada** (ou nenhuma, se ainda não escolheu).
- Ao clicar em uma estrela (`click`), a nota é salva, o texto abaixo é
  atualizado ("4 de 5 estrelas selecionadas") e o campo oculto recebe o
  valor.
- Se o formulário for enviado sem nenhuma nota escolhida, aparece a
  mensagem de erro "Selecione uma nota de 1 a 5 estrelas."

---

## 2. Filtro/busca dinâmica de perfis

**Arquivo:** `src/pages/busca.html`

O campo de busca (`#busca-perfil`) filtra a lista de perfis em tempo real,
sem precisar recarregar a página ou clicar em "Buscar".

**Como funciona:**
- A cada letra digitada (evento `input`), a função `filtrarPerfis()` roda.
- Ela usa `Array.from()` para transformar os cards de perfil em um array e
  `.filter()` para selecionar apenas os que contêm o termo buscado no texto
  (nome, usuário, tags de gênero etc.), usando `.includes()`.
- Os cards que não combinam recebem o atributo `hidden`; os que combinam
  ficam visíveis.
- Se nenhum card combinar com a busca, aparece a mensagem "Nenhum leitor
  encontrado com esse termo de busca."
- O botão "Buscar" e a tecla Enter também funcionam (o `submit` do
  formulário é interceptado com `preventDefault()` para não recarregar a
  página).

---

## 3. Validação de formulários

**Arquivos:** `src/pages/criar-conta.html`, `src/pages/entrar.html`,
`src/pages/avaliacao.html`

Todos os três formulários usam `novalidate` no HTML (para desligar a
validação automática do navegador) e validação em JavaScript no evento
`submit`, com `preventDefault()` para impedir o envio enquanto houver
campos inválidos.

**Validações implementadas:**

| Campo | Regra |
|---|---|
| Nome de exibição | não pode estar vazio |
| Nome de usuário | não pode estar vazio e não pode já existir (lista simulada: `anacaval`, `renatap`, `marcelof`, `juliasantos`) |
| E-mail | não pode estar vazio e precisa seguir o formato `algo@algo.algo` (validado com expressão regular) |
| Senha | não pode estar vazia e precisa ter pelo menos 6 caracteres |
| Título da obra / Tipo | não podem estar vazios |
| Comentário da avaliação | não pode estar vazio e precisa ter pelo menos 10 caracteres |
| Nota (estrelas) | precisa ter uma estrela selecionada |

**Tratamento de situações inválidas:** quando um campo é inválido, uma
mensagem de erro específica aparece logo abaixo dele (classe
`.erro-campo`) e o campo recebe um destaque vermelho (classe
`.campo-invalido`). Quando o campo é corrigido e o formulário é reenviado,
o erro correspondente é removido automaticamente.

Quando **todos** os campos são válidos, uma mensagem de sucesso verde
aparece no topo do formulário (ex.: "Conta criada com sucesso!") e o
formulário é limpo com `.reset()`.

---

## Conceitos de JavaScript utilizados

- **Manipulação do DOM:** `querySelector`, `querySelectorAll`,
  `classList.add/remove`, `createElement`, `appendChild`, `remove`,
  alteração de atributos (`hidden`, `value`, `textContent`).
- **Tratamento de eventos:** `click`, `mouseenter`, `mouseleave`, `input`,
  `submit` (com `preventDefault`), `DOMContentLoaded`.
- **Funções:** funções nomeadas reutilizáveis (`campoVazio`, `emailValido`,
  `senhaValida`, `usuarioDisponivel`, `mostrarErro`, `limparErro`,
  `pintarEstrelas`, `filtrarPerfis` etc.).
- **Arrays:** `Array.from()` para converter `NodeList` em array,
  `.includes()` para checar usuários existentes e termos de busca.
- **Métodos de iteração:** `.forEach()` para percorrer estrelas e cards,
  `.filter()` para selecionar os perfis que combinam com a busca.
- **Validação de formulários e tratamento de situações inválidas:**
  descrito na seção 3 acima.
- **Alteração dinâmica da interface:** classes CSS adicionadas/removidas
  conforme o estado (`.preenchida`, `.campo-invalido`), mensagens
  mostradas/escondidas (`hidden`), texto atualizado em tempo real.

---

## Como testar

1. Abra `avaliacao.html`, clique em diferentes estrelas e veja o texto
   mudar. Tente enviar o formulário vazio para ver os erros, depois
   preencha tudo corretamente para ver a mensagem de sucesso.
2. Abra `busca.html` e digite no campo de busca (ex.: "Renata", "Mangá",
   "xyz" para ver a mensagem de "nenhum resultado").
3. Abra `criar-conta.html` e tente cadastrar o usuário `renatap` (já
   existe) ou um e-mail sem `@` para ver os erros. Depois preencha tudo
   certo para ver a mensagem de sucesso.
4. Abra `entrar.html` e envie o formulário vazio para ver os erros de
   campo obrigatório.

---

## Matriz de evidências

| Requisito | Funcionalidade relacionada | Arquivo(s) | Evidência |
|---|---|---|---|
| Manipulação do DOM | Pintura das estrelas, criação/remoção de mensagens de erro, exibição de mensagens de sucesso | `js/script.js` | print da estrela selecionada e do erro de campo |
| Tratamento de eventos | `click`/`mouseenter`/`mouseleave` nas estrelas, `input` na busca, `submit` nos formulários | `js/script.js` | print do console sem erros + interação funcionando |
| Validação de formulários | Funções `campoVazio`, `emailValido`, `senhaValida`, `usuarioDisponivel` | `js/script.js`, `criar-conta.html`, `entrar.html`, `avaliacao.html` | print dos erros exibidos ao enviar formulário incompleto |
| Alteração dinâmica da interface | Estrelas mudando de cor, cards aparecendo/sumindo na busca, mensagens de sucesso/erro | `avaliacao.html`, `busca.html` | prints antes/depois da interação |
| Uso de funções | `pintarEstrelas`, `filtrarPerfis`, `mostrarErro`, `limparErro`, etc. | `js/script.js` | trecho de código comentado |
| Uso de arrays | `Array.from()` nas estrelas e nos cards de perfil; array `usuariosExistentes` | `js/script.js` | trecho de código comentado |
| Métodos de iteração | `.forEach()` e `.filter()` | `js/script.js` | trecho de código comentado |
| Tratamento de situações inválidas | Usuário já existente, e-mail/senha inválidos, nota não selecionada, comentário curto demais | `criar-conta.html`, `avaliacao.html` | print das mensagens de erro |

> As evidências (capturas de tela) devem ser salvas em
> `docs/evidencias/etapa-04/` seguindo o mesmo padrão usado na Etapa 03.
