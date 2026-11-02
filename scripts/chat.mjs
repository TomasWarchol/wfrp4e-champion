/**
 * Karty czatu Legendy: jeden szablon, różne motywy (złoty, krwawy, atramentowy).
 */

import { MODULE_ID, TEMPLATE_ROOT, esc } from "./constants.mjs";

/**
 * @typedef CardButton
 * @property {string} action  Akcja obsługiwana w onChatButton
 * @property {string} label
 * @property {string} icon
 * @property {string} [style]  gold | blood | ghost-dark
 * @property {object} [data]   Atrybuty data-* (klucze w camelCase)
 */

/** Atrybuty data-* przycisku (wartości escapowane). */
function dataAttrs(data = {}) {
  return Object.entries(data)
    .map(([k, v]) => `data-${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}="${esc(v)}"`)
    .join(" ");
}

/**
 * Wysyła kartę na czat.
 * @param {object} card   Dane szablonu chat/card.hbs
 * @param {object} [options]
 * @param {Actor} [options.actor]       Mówca
 * @param {boolean} [options.gmOnly]    Szept do MG
 * @param {Roll[]} [options.rolls]      Rzuty dołączone do wiadomości (Dice So Nice)
 */
export async function postCard(card, { actor = null, gmOnly = false, rolls = [] } = {}) {
  const data = {
    theme: "gold",
    ...card,
    buttons: (card.buttons ?? []).map(b => ({ ...b, dataAttrs: dataAttrs(b.data) }))
  };
  const content = await foundry.applications.handlebars.renderTemplate(`${TEMPLATE_ROOT}/chat/card.hbs`, data);
  const messageData = {
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
    content,
    flags: { [MODULE_ID]: { kind: card.kind ?? "card" } }
  };
  if (rolls.length) messageData.rolls = rolls;
  if (gmOnly) messageData.whisper = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
  return ChatMessage.create(messageData);
}
