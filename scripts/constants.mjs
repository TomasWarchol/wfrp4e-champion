/** Identyfikator modułu i wspólne drobiazgi. */

export const MODULE_ID = "wfrp4e-champion";
export const FLAG_KEY = "legend";
export const TEMPLATE_ROOT = `modules/${MODULE_ID}/templates`;

/** Tłumaczy klucz z przestrzeni CHAMPION (z podstawieniami, gdy podano dane). */
export function t(key, data) {
  const full = `CHAMPION.${key}`;
  return data ? game.i18n.format(full, data) : game.i18n.localize(full);
}

/** Język treści generatorów: polski albo angielski. */
export function contentLang() {
  return game.i18n.lang === "pl" ? "pl" : "en";
}

export const esc = value => Handlebars.escapeExpression(value ?? "");

/** Bieżący numer sesji (MG zwiększa go przyciskiem „Nowa sesja”). */
export function sessionId() {
  return game.settings.get(MODULE_ID, "session");
}
