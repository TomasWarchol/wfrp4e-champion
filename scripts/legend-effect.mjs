/**
 * Efekt „Legenda szampierza” na postaci: każda opowieść, którą można przywołać, to przełącznik
 * w oknie testu WFRP4e (skrypt typu „dialog”), widoczny tylko przy pasujących umiejętnościach.
 * Włączenie przełącznika dodaje premię PS, a wysłanie testu oznacza opowieść jako przywołaną.
 */

import { MODULE_ID, t, sessionId } from "./constants.mjs";
import * as R from "./rules.mjs";
import { skillNames } from "./wfrp.mjs";

const EFFECT_FLAG = "legendEffect";

function scriptFor(tale) {
  const bonus = R.invokeBonus(tale);
  const names = [...new Set(R.invokeSkills(tale).flatMap(skillNames).map(n => n.toLowerCase()))];
  return {
    label: t("Effect.Invoke", { title: tale.title || t("Legend.Untitled"), bonus }),
    trigger: "dialog",
    script: `args.fields.slBonus += ${bonus};`,
    options: {
      hideScript: `const n = (args.skill?.name ?? "").toLowerCase(); return !${JSON.stringify(names)}.some(s => n === s || n.startsWith(s + " ("));`,
      activateScript: "",
      submissionScript: `game.champion?.markInvoked?.(this.actor?.uuid ?? args.actor?.uuid, ${JSON.stringify(tale.id)});`
    }
  };
}

/** Uzgadnia efekt z bieżącym stanem (wołać po zapisie stanu, u właściciela albo MG). */
export async function syncLegendEffect(actor, state) {
  if (!actor?.isOwner || game.system?.id !== "wfrp4e" || !actor.effects) return;
  const session = sessionId();
  const tales = state.fallen ? [] : R.liveTales(state)
    .filter(tale => R.canInvoke(tale, session, state.incognito))
    .sort((a, b) => b.weight - a.weight || b.created - a.created);
  const scriptData = tales.map(scriptFor);
  const hash = JSON.stringify(scriptData);
  const existing = actor.effects.find(e => e.getFlag?.(MODULE_ID, EFFECT_FLAG));
  try {
    if (!existing) {
      if (!scriptData.length) return;
      await actor.createEmbeddedDocuments("ActiveEffect", [{
        name: t("Effect.Name"),
        img: "icons/svg/book.svg",
        system: { transferData: {}, scriptData },
        flags: { [MODULE_ID]: { [EFFECT_FLAG]: true, hash } }
      }]);
      return;
    }
    if (existing.getFlag(MODULE_ID, "hash") === hash) return;
    await existing.update({ name: t("Effect.Name"), "system.scriptData": scriptData, [`flags.${MODULE_ID}.hash`]: hash });
  } catch (err) {
    // Starsza wersja systemu bez skryptów efektów: przywołanie działa nadal z panelu
    console.warn(`${MODULE_ID} | Nie udało się zsynchronizować efektu Legendy:`, err);
  }
}
