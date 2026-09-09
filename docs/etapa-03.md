# Etapa 03 — Interface Responsiva com CSS

## Interfaces apresentadas

As evidências desta etapa usam as mesmas 3 interfaces já desenvolvidas
na Etapa 02, testadas nos 3 viewports exigidos:

| Nº | Página | Arquivo |
|---|---|---|
| tela-01 | Página inicial | `src/pages/index.html` |
| tela-02 | Perfil do usuário | `src/pages/perfil.html` |
| tela-03 | Formulário para publicação de obra | `src/pages/publicar-obra.html` |

## Viewport utilizado em cada evidência

| Dispositivo | Dimensões | Arquivos |
|---|---|---|
| Desktop | 1440 × 900 px | `desktop-tela-01.png`, `desktop-tela-02.png`, `desktop-tela-03.png` |
| Tablet | 768 × 1024 px | `tablet-tela-01.png`, `tablet-tela-02.png`, `tablet-tela-03.png` |
| Smartphone | 390 × 844 px | `smartphone-tela-01.png`, `smartphone-tela-02.png`, `smartphone-tela-03.png` |

Todas as capturas estão em [`docs/evidencias/etapa-03/`](evidencias/etapa-03/).

## Breakpoints utilizados

- **Tablet — até 900px:** reduz espaçamentos gerais, encolhe a
  ilustração das telas de login/cadastro e o banner do perfil, ajusta
  os grids de cards (perfis, obras autorais) para colunas menores.
- **Smartphone — até 600px:** empilha o cabeçalho (logo em cima; menu
  de navegação e botões de conta dividindo a linha de baixo), os
  botões de ação viram largura total, a barra de busca empilha, os
  grids de perfis/obras caem para 1 coluna, e os cards de
  avaliação/perfil colocam o avatar acima do texto em vez de lado a
  lado.

## Principais decisões de responsividade

- **Flexbox** foi usado para os componentes de uma dimensão só:
  cabeçalho, barra de navegação, linha de botões, barra de busca e o
  layout das telas de login/cadastro (ilustração + formulário lado a
  lado, empilhando no mobile).
- **CSS Grid** (com `auto-fit` e `minmax`) foi usado para os
  componentes de grade: cards de perfis na busca, obras autorais no
  perfil, e os cards de estatística — eles já se reorganizam
  automaticamente conforme o espaço disponível, e os breakpoints
  reforçam esse comportamento em telas menores.
- O cabeçalho foi resolvido com `flex-wrap` e `flex-basis: 100%` na
  logo, em vez de empilhar cada bloco (logo, menu, botões) em linhas
  separadas — assim o menu e os botões de conta continuam dividindo a
  mesma linha mesmo em telas estreitas.
- No perfil, o avatar (que fica sobreposto ao banner de capa em telas
  maiores, com `position: absolute`) passa a `position: static` no
  breakpoint de smartphone, evitando qualquer sobreposição com os
  botões "Editar perfil" / "+ Compartilhar" abaixo dele.
- Espaçamentos seguem unidades relativas (`rem`) na maior parte do
  CSS, mantendo proporção consistente entre os elementos ao longo dos
  diferentes tamanhos de tela.

## Localização do CSS responsivo

Todo o CSS do projeto está centralizado em um único arquivo:
[`src/css/style.css`](../src/css/style.css). As regras responsivas
ficam agrupadas no final do arquivo, dentro de dois blocos
`@media`, um para cada breakpoint (900px e 600px), claramente
comentados.