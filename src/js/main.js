import { initFeed, initNavegacaoInicio } from './modules/feed.js';
import { initPerfil } from './modules/perfil.js';
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

initPerfil();

initFeed();
initNavegacaoInicio();
