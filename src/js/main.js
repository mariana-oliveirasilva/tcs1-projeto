/* ===================================================================
   InkCircle — js/main.js (ponto de entrada)
   Etapa 05: Modularização e comunicação assíncrona

   Este é o único arquivo carregado pelas páginas:
     <script type="module" src="../js/main.js"></script>

   Ele só IMPORTA os módulos e liga cada um. Cada módulo procura os
   elementos que precisa e, se a página atual não os tem, não faz nada.
   (Scripts type="module" já rodam depois do HTML carregado, por isso
   não é preciso usar DOMContentLoaded.)

   Estrutura:
     js/
     ├── main.js                    <- este arquivo
     ├── modules/                   <- comportamento da interface
     │   ├── estrelas.js            nota por estrelas
     │   ├── busca.js               filtro de perfis
     │   ├── sugestoes.js           sugestões de obras (consulta async)
     │   ├── formularios.js         validação + envio async
     │   ├── validacao.js           regras de validação (funções puras)
     │   └── ui.js                  mostrar/esconder, mensagens de erro
     └── services/                  <- comunicação com dados externos
         ├── openLibrary.js         CONSULTA (API pública, fetch)
         └── avaliacoesService.js   ENVIO (serviço simulado, Promise)
   =================================================================== */

import { initEstrelas } from './modules/estrelas.js';
import { initBusca } from './modules/busca.js';
import { initSugestoesObras } from './modules/sugestoes.js';
import {
  initFormularioCadastro,
  initFormularioLogin,
  initFormularioAvaliacao
} from './modules/formularios.js';

const estrelas = initEstrelas();

initBusca();
initSugestoesObras();
initFormularioCadastro();
initFormularioLogin();
initFormularioAvaliacao(estrelas);
