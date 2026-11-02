/**
 * Zapis stanu legendy na aktorze. Stan zmienia tylko właściciel szampierza albo MG.
 * Po każdym zapisie uzgadniany jest efekt z przełącznikami przywołań w oknie testu.
 */

import { MODULE_ID, FLAG_KEY, sessionId } from "./constants.mjs";
import * as R from "./rules.mjs";
import { syncLegendEffect } from "./legend-effect.mjs";
import { time } from "../../wfrp4e-companion-lib/scripts/companion-lib.mjs";

export { sessionId };

export function getState(actor) {
  return R.normalizeState(actor?.getFlag(MODULE_ID, FLAG_KEY));
}

export async function saveState(actor, state) {
  const normalized = R.normalizeState(state);
  await actor.setFlag(MODULE_ID, FLAG_KEY, normalized);
  await syncLegendEffect(actor, normalized);
}

export function worldNow() {
  return time.now();
}

/** Dopisuje wpis do kroniki (z czasem świata). */
export function chronicle(state, kind, text, icon) {
  return R.addChronicle(state, { kind, text, icon }, worldNow());
}

/** Zmiana stanu: mutator dostaje kopię stanu i zwraca nowy stan (null = bez zmian). */
export async function update(actor, mutator) {
  const next = await mutator(getState(actor));
  if (next) await saveState(actor, next);
  return next;
}

/** Ponowne uzgodnienie efektu (np. po nowej sesji). */
export async function resync(actor) {
  await syncLegendEffect(actor, getState(actor));
}
