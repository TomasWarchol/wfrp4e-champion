/**
 * Połączenie z systemem WFRP4e: testy umiejętności, Przewaga, Żywotność, Determinacja, Szczęście.
 * Każda funkcja ma zapasową ścieżkę, gdy system nie udostępnia wygodnej metody.
 */

import { MODULE_ID } from "./constants.mjs";
import { SECOND_ROLES } from "./rules.mjs";

/** Cecha zapasowa dla umiejętności, gdy postać jej nie ma (test cechy zamiast umiejętności). */
const SKILL_CHARACTERISTIC = {
  Charm: "fel",
  Leadership: "fel",
  Haggle: "fel",
  Intimidate: "s",
  Gossip: "fel",
  Gamble: "int",
  Perception: "i",
  Heal: "int"
};
for (const cfg of Object.values(SECOND_ROLES)) SKILL_CHARACTERISTIC[cfg.skill] ??= cfg.characteristic;

/** Nazwy, pod którymi umiejętność może być na karcie: przetłumaczona przez system i angielska. */
function skillNames(key) {
  const names = new Set([key]);
  for (const i18nKey of [`NAME.${key}`, `CHAMPION.Skill.${key}`]) {
    const localized = game.i18n.localize(i18nKey);
    if (localized && localized !== i18nKey) names.add(localized);
  }
  return [...names];
}

export function findSkill(actor, key) {
  const skills = actor?.itemTypes?.skill ?? actor?.items?.filter(i => i.type === "skill") ?? [];
  const names = skillNames(key);
  return skills.find(s => names.includes(s.name))
    ?? skills.find(s => names.some(n => s.name.startsWith(`${n} (`)))
    ?? null;
}

/**
 * Test umiejętności WFRP4e z oknem testu (gracz widzi modyfikatory i premię PS).
 * Bez umiejętności na karcie: test cechy. Zwraca null, gdy okno zamknięto bez rzutu.
 * @returns {Promise<{sl: number, success: boolean, roll: number, label: string}|null>}
 */
export async function rollSkill(actor, key, { title = "", modifier = 0, slBonus = 0 } = {}) {
  if (!actor) return null;
  const fields = { modifier: Number(modifier) || 0 };
  if (slBonus) fields.slBonus = Number(slBonus) || 0;
  const options = { appendTitle: title ? ` – ${title}` : "", skipTargets: true, fields };

  try {
    let test;
    const skill = findSkill(actor, key);
    if (skill && typeof actor.setupSkill === "function") {
      test = await actor.setupSkill(skill.name, options);
    } else if (typeof actor.setupCharacteristic === "function") {
      test = await actor.setupCharacteristic(SKILL_CHARACTERISTIC[key] ?? "fel", options);
    }
    if (!test) return null;
    await test.roll();
    return {
      sl: Number(test.result?.SL) || 0,
      success: !!test.succeeded,
      roll: Number(test.result?.roll) || 0,
      label: skill?.name ?? key
    };
  } catch (err) {
    console.error(`${MODULE_ID} | Test ${key} nie powiódł się:`, err);
    ui.notifications.error(err.message);
    return null;
  }
}

/** Zmienia Przewagę aktora (np. aktora żetonu w walce). */
export async function modifyAdvantage(actor, delta) {
  if (!actor) return;
  if (typeof actor.modifyAdvantage === "function") return actor.modifyAdvantage(delta);
  const current = Number(actor.system?.status?.advantage?.value) || 0;
  return actor.update({ "system.status.advantage.value": Math.max(0, current + delta) });
}

/** Leczy Żywotność do maksimum. Zwraca faktycznie odzyskane punkty. */
export async function healWounds(actor, amount) {
  const wounds = actor?.system?.status?.wounds;
  if (!wounds || amount <= 0) return 0;
  const max = Number(wounds.max) || 0;
  const value = Number(wounds.value) || 0;
  const next = Math.min(max, value + amount);
  if (next !== value) await actor.update({ "system.status.wounds.value": next });
  return next - value;
}

/**
 * Wezwanie Imienia: +Determinacja (do wartości Odporności) i +Szczęście (do wartości Przeznaczenia).
 * Zwraca faktycznie odzyskane punkty.
 */
export async function restoreResolveAndFortune(actor, { resolve = 0, fortune = 0 } = {}) {
  const status = actor?.system?.status;
  if (!status) return { resolve: 0, fortune: 0 };
  const update = {};
  const gained = { resolve: 0, fortune: 0 };
  if (resolve && status.resolve) {
    const max = Number(status.resilience?.value ?? status.resolve.max ?? 99);
    const value = Number(status.resolve.value) || 0;
    const next = Math.min(Math.max(max, value), value + resolve);
    gained.resolve = next - value;
    update["system.status.resolve.value"] = next;
  }
  if (fortune && status.fortune) {
    const max = Number(status.fate?.value ?? status.fortune.max ?? 99);
    const value = Number(status.fortune.value) || 0;
    const next = Math.min(Math.max(max, value), value + fortune);
    gained.fortune = next - value;
    update["system.status.fortune.value"] = next;
  }
  if (Object.keys(update).length) await actor.update(update);
  return gained;
}

/** Ranga statusu społecznego WFRP4e (Brąz < Srebro < Złoto), do porównań „możny / słabszy”. */
export function statusRank(actor) {
  const status = actor?.system?.details?.status;
  const tier = String(status?.tier ?? "").toLowerCase();
  const tierRank = { b: 0, s: 1, g: 2 }[tier] ?? 0;
  return tierRank * 10 + (Number(status?.standing) || 0);
}
