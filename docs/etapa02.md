# Etapa 02 — Protótipo Estrutural com HTML Semântico

## Funcionalidades implementadas

Nesta etapa não há lógica de servidor, banco de dados ou JavaScript
complexo — as páginas representam visualmente as funcionalidades já
definidas na proposta (Etapa 01), com dados de exemplo fixos:

- Cadastro e login de usuário, em páginas separadas.
- Publicação de avaliação de obra, com nota (0 a 5 estrelas) e comentário.
- Visualização e edição de perfil, com avaliações e obras autorais
  publicadas.
- Busca de outros leitores da plataforma.
- Publicação de obra autoral, incluindo o link opcional de apoio/doação.

## Páginas criadas

| Arquivo | Descrição |
|---|---|
| `src/pages/index.html` | Página inicial — apresentação do InkCircle e feed de avaliações recentes. |
| `src/pages/entrar.html` | Login. |
| `src/pages/criar-conta.html` | Cadastro de novo usuário. |
| `src/pages/perfil.html` | Perfil do usuário — capa, avatar, estatísticas, avaliações e obras autorais. |
| `src/pages/editar-perfil.html` | Edição das informações do perfil. |
| `src/pages/avaliacao.html` | Formulário para publicar uma nova avaliação de obra. |
| `src/pages/busca.html` | Busca e listagem de outros leitores da plataforma. |
| `src/pages/publicar-obra.html` | Formulário para publicar uma obra autoral. |

## Decisões relacionadas à estrutura HTML

- **`<header>` e `<footer>`** aparecem em todas as páginas, com a marca
  InkCircle (logo em SVG + nome) e a navegação principal, garantindo
  consistência entre as telas.
- **`<nav>`** identifica a navegação principal do site (com `aria-label`
  para acessibilidade) e a navegação entre as páginas de login e cadastro.
- **`<main>`** envolve o conteúdo principal de cada página, único por
  documento.
- **`<section>`** organiza blocos de conteúdo com significado próprio
  (feed de avaliações, resultados de busca, avaliações do perfil), cada
  uma identificada por um heading via `aria-labelledby`.
- **`<article>`** foi usado para unidades de conteúdo independentes e
  reutilizáveis: cada card de avaliação e cada card de perfil na busca.
- **`<figure>`** envolve elementos ilustrativos autocontidos: o banner de
  capa do perfil e as ilustrações das páginas de login/cadastro.
- **`<form>`, `<fieldset>`, `<legend>` e `<label>`** estruturam todos os
  formulários (login, cadastro, nova avaliação, nova obra, editar perfil).
  Campos de texto usam `for`/`id`; os campos de nota e de gêneros usam o
  `<input>` diretamente dentro do `<label>`, forma igualmente válida de
  associação.
- **`<dl>`, `<dt>`, `<dd>`** representam os cards de estatística do
  perfil (livros lidos, mangás lidos, média de estrelas), por serem
  pares de termo/valor.
- Cada página tem exatamente um `<h1>`, mantendo a hierarquia de
  títulos coerente.
- Nenhum banco de dados, API ou JavaScript complexo foi usado — apenas
  HTML estático com uma folha de estilo compartilhada
  (`src/css/style.css`)