/* ===================================================================
   modules/validacao.js
   Funções PURAS de validação: recebem um valor e devolvem true/false.
   Não mexem em HTML nem na internet, então são fáceis de testar.
   =================================================================== */

// Lista simulada de nomes de usuário que já existem no sistema
const USUARIOS_EXISTENTES = ['anacaval', 'renatap', 'marcelof', 'juliasantos'];

export function campoVazio(valor) {
  return valor.trim() === '';
}

export function emailValido(valor) {
  const padraoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return padraoEmail.test(valor.trim());
}

export function senhaValida(valor) {
  return valor.trim().length >= 6;
}

export function usuarioDisponivel(valor) {
  return !USUARIOS_EXISTENTES.includes(valor.trim().toLowerCase());
}

export function comentarioValido(valor) {
  return valor.trim().length >= 10;
}
