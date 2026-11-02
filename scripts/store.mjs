/**
 * Zapis stanu legendy na aktorze i zmiany zlecane przez graczy, którzy nie są właścicielami szampierza
 * (sekundanci, opowieści karczemne) – te idą przez zapytanie do MG z kontrolą uprawnień.
 */

import { MODULE_ID, FLAG_KEY, QUERY_MUTATE, t } from "./constants.mjs";
import * as R from "./rules.mjs";
import { time, queryGM } from "../../wfrp4e-companion-lib/scripts/companion-lib.mjs";

export function getState(actor) {
  return R.normalizeState(actor?.getFlag(MODULE_ID, FLAG_KEY));
}

export async function saveState(actor, state) {
  return actor.setFlag(MODULE_ID, FLAG_KEY, R.normalizeState(state));
}

/** Bieżący numer sesji (MG zwiększa go przyciskiem „Nowa sesja”). */
export function sessionId() {
  return game.settings.get(MODULE_ID, "session");
}

export function worldNow() {
  return time.now();
}

/** Dopisuje wpis do kroniki (z czasem świata). */
export function chronicle(state, kind, text, icon) {
  return R.addChronicle(state, { kind, text, icon }, worldNow());
}

/**
 * Zmiana stanu przez właściciela albo MG: mutator dostaje kopię stanu i zwraca nowy stan.
 */
export async function update(actor, mutator) {
  const next = await mutator(getState(actor));
  if (next) await saveState(actor, next);
  return next;
}

/* -------------------------------------------- */
/*  Operacje zlecane MG                         */
/* -------------------------------------------- */

/**
 * Operacje, które może zlecić gracz bez prawa do edycji szampierza.
 * Każda sprawdza uprawnienia nadawcy i zwraca nowy stan (albo null przy odmowie).
 */
const RELAY_OPS = {
  /** Wynik testu sekundanta. Wymaga własności postaci przypisanej do roli. */
  async secondResult(state, { role, result }, user) {
    const duel = state.duel;
    if (!duel || !R.SECOND_ROLE_IDS.includes(role)) return null;
    const assigned = duel.seconds[role];
    if (!(await canActFor(user, assigned.actorUuid))) return null;
    if (assigned.result) return null;
    state.duel = R.applySecondResult(duel, role, result);
    return state;
  },

  /** Zgłoszenie się na sekundanta własną postacią. */
  async assignSecond(state, { role, actorUuid }, user) {
    const duel = state.duel;
    if (!duel || duel.stage !== "prep" || !R.SECOND_ROLE_IDS.includes(role)) return null;
    if (duel.seconds[role].actorUuid && !user.isGM) return null;
    if (!(await canActFor(user, actorUuid))) return null;
    const actor = await fromUuid(actorUuid);
    if (!actor) return null;
    for (const r of R.SECOND_ROLE_IDS) if (duel.seconds[r].actorUuid === actorUuid) duel.seconds[r] = { actorUuid: "", name: "", img: "", result: null };
    duel.seconds[role] = { actorUuid, name: actor.name, img: actor.img, result: null };
    return state;
  },

  /** Karczemna wersja opowieści: każdy gracz może ją opowiedzieć. */
  async tavern(state, { taleId, text }, user) {
    const tale = state.tales.find(x => x.id === taleId);
    const clean = String(text ?? "").trim().slice(0, 400);
    if (!tale || !clean) return null;
    tale.tavern = clean;
    tale.tavernBy = user.character?.name ? `${user.character.name} (${user.name})` : user.name;
    return R.addChronicle(state, { kind: "tavern", text: t("Chronicle.Tavern", { title: tale.title, by: tale.tavernBy }), icon: "fa-solid fa-beer-mug-empty" }, worldNow());
  }
};

async function canActFor(user, actorUuid) {
  if (user.isGM) return true;
  if (!actorUuid) return false;
  const actor = await fromUuid(actorUuid);
  return !!actor?.testUserPermission?.(user, "OWNER");
}

/** Wykonuje operację lokalnie (dla właściciela) albo przez MG. */
export async function relay(actor, op, payload) {
  if (actor.isOwner) {
    const next = await RELAY_OPS[op](getState(actor), payload, game.user);
    if (!next) return false;
    await saveState(actor, next);
    return true;
  }
  const ok = await queryGM(QUERY_MUTATE, { actorUuid: actor.uuid, op, payload });
  return !!ok;
}

/** Handler zapytania po stronie MG. */
export async function handleRelayQuery(data, { user }) {
  const op = RELAY_OPS[data?.op];
  if (!op) return false;
  const actor = await fromUuid(data.actorUuid);
  if (!actor) return false;
  const next = await op(getState(actor), data.payload ?? {}, user);
  if (!next) return false;
  await saveState(actor, next);
  return true;
}
