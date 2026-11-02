/**
 * WFRP4e – Legenda Szampierza (Iron Mandate: Champion)
 * Punkt startowy modułu Foundry VTT.
 */

import { MODULE_ID, TEMPLATE_ROOT, t } from "./scripts/constants.mjs";
import * as R from "./scripts/rules.mjs";
import * as Store from "./scripts/store.mjs";
import * as Ops from "./scripts/operations.mjs";
import { LegendSheet } from "./scripts/legend-sheet.mjs";
import { LegendHud } from "./scripts/legend-hud.mjs";
import { registry, registerSheetButton, addTokenTool } from "../wfrp4e-companion-lib/scripts/companion-lib.mjs";

/* -------------------------------------------- */
/*  Otwieranie karty                            */
/* -------------------------------------------- */

function resolveTarget(actor) {
  return actor || canvas.tokens?.controlled?.[0]?.actor || game.user.character || null;
}

/** Księga legendy (opcjonalnie od wskazanej zakładki). */
function openSheet(actor, tab = null) {
  try {
    const target = resolveTarget(actor);
    if (!target) return ui.notifications.warn(t("Notify.SelectToken"));
    const app = foundry.applications.instances.get(`${MODULE_ID}-legend-${target.id}`) ?? new LegendSheet(target);
    if (tab) app.tabGroups.primary = tab;
    app.render({ force: true });
    app.bringToFront?.();
    return app;
  } catch (err) {
    console.error(`${MODULE_ID} | LegendSheet:`, err);
    ui.notifications.error(t("Notify.OpenError", { error: err.message }));
  }
}

/** Mały panel sesji. */
function openHud(actor) {
  try {
    const target = resolveTarget(actor);
    if (!target) return ui.notifications.warn(t("Notify.SelectToken"));
    const app = foundry.applications.instances.get(`${MODULE_ID}-hud-${target.id}`) ?? new LegendHud(target);
    app.render({ force: true });
    app.bringToFront?.();
    return app;
  } catch (err) {
    console.error(`${MODULE_ID} | LegendHud:`, err);
    ui.notifications.error(t("Notify.OpenError", { error: err.message }));
  }
}

/** Odświeża otwarte okna Legendy (wszystkie albo jednego aktora). */
function refreshSheets(actorId = null) {
  for (const app of foundry.applications.instances.values()) {
    if ((app instanceof LegendSheet || app instanceof LegendHud) && (!actorId || app.actor.id === actorId)) app.render();
  }
}

/** Postacie z legendą (do synchronizacji przełączników po nowej sesji). */
function champions() {
  return game.actors.filter(a => a.getFlag(MODULE_ID, "legend"));
}

async function resyncAll() {
  if (!game.users.activeGM?.isSelf) return;
  for (const actor of champions()) await Store.resync(actor);
}

/* -------------------------------------------- */
/*  Init                                        */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  console.log(`${MODULE_ID} | Legenda Szampierza – init`);

  registry.registerFeature({
    id: "champion",
    name: "CHAMPION.Title",
    icon: "fas fa-book-open",
    description: "CHAMPION.HubDesc",
    module: MODULE_ID,
    open: (actor) => openSheet(actor)
  });

  game.settings.register(MODULE_ID, "session", {
    scope: "world",
    config: false,
    type: Number,
    default: 1,
    onChange: () => {
      refreshSheets();
      resyncAll();
    }
  });

  game.settings.register(MODULE_ID, "crowdAdvantage", {
    name: "CHAMPION.Settings.CrowdAdvantageName",
    hint: "CHAMPION.Settings.CrowdAdvantageHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  await foundry.applications.handlebars.loadTemplates([
    `${TEMPLATE_ROOT}/legend-sheet.hbs`,
    `${TEMPLATE_ROOT}/parts/header.hbs`,
    `${TEMPLATE_ROOT}/parts/tab-legend.hbs`,
    `${TEMPLATE_ROOT}/parts/tab-deeds.hbs`,
    `${TEMPLATE_ROOT}/parts/petition-body.hbs`,
    `${TEMPLATE_ROOT}/parts/tab-arena.hbs`,
    `${TEMPLATE_ROOT}/parts/tab-rivals.hbs`,
    `${TEMPLATE_ROOT}/parts/tab-chronicle.hbs`,
    `${TEMPLATE_ROOT}/chat/card.hbs`,
    `${TEMPLATE_ROOT}/hud.hbs`
  ]);
});

/* -------------------------------------------- */
/*  Ready: API dla makr                         */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  game.champion = {
    openSheet,
    openHud,
    LegendSheet,
    LegendHud,
    /** Woła to przełącznik „Przywołaj” z okna testu WFRP po wysłaniu testu. */
    markInvoked: (actorUuid, taleId) => Ops.markInvoked(actorUuid, taleId),
    rules: R,
    getState: Store.getState,
    operations: Ops,
    /** Echo Sławy z makra (MG): game.champion.echo(aktor) */
    echo: (actor) => Ops.rollEcho(actor ?? canvas.tokens?.controlled?.[0]?.actor),
    newSession: () => Ops.newSession()
  };
  resyncAll();
});

/* -------------------------------------------- */
/*  Odświeżanie i przyciski czatu               */
/* -------------------------------------------- */

Hooks.on("updateActor", (actor, changes) => {
  if (foundry.utils.hasProperty(changes, `flags.${MODULE_ID}`) || "name" in changes || "img" in changes) {
    refreshSheets(actor.id);
  }
});

Hooks.on("createCombat", () => refreshSheets());
Hooks.on("deleteCombat", () => refreshSheets());

Hooks.on("renderChatMessageHTML", (message, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  for (const btn of root.querySelectorAll("[data-lg-chat]")) {
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      const { lgChat, actorUuid } = btn.dataset;
      const champion = actorUuid ? await fromUuid(actorUuid) : null;
      if (!champion) return ui.notifications.warn(t("Notify.ActorMissing"));
      if (!champion.isOwner) return ui.notifications.warn(t("Notify.OwnerOnly"));
      try {
        if (lgChat === "recordDeed") await Ops.recordDeed(champion);
        else if (lgChat === "leaderAccept") await Ops.answerChallenge(champion, true);
        else if (lgChat === "leaderRefuse") await Ops.answerChallenge(champion, false);
      } catch (err) {
        console.error(`${MODULE_ID} |`, err);
        ui.notifications.error(err.message);
      }
    });
  }
});

/** Koniec walki z udziałem szampierza: pytanie „Coś godnego opowieści?” (raz, u aktywnego MG). */
Hooks.on("deleteCombat", (combat) => {
  if (!game.users.activeGM?.isSelf || !combat.started) return;
  Ops.combatEndPrompt(combat).catch(err => console.error(`${MODULE_ID} |`, err));
});

/** Przycisk panelu sesji na HUD-zie żetonu szampierza. */
Hooks.on("renderTokenHUD", (hud, html) => {
  const actor = hud.object?.actor ?? hud.actor;
  if (!actor?.isOwner || actor.type !== "character") return;
  if (!actor.getFlag(MODULE_ID, "legend") && !registry.isFeatureUnlocked(actor, "champion")) return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  const col = root?.querySelector(".col.right") ?? root?.querySelector(".col.left");
  if (!col || col.querySelector(".lg-token-hud")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "control-icon lg-token-hud";
  btn.dataset.tooltip = t("Hud.Title");
  btn.innerHTML = `<i class="fa-solid fa-book-open"></i>`;
  btn.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); openHud(actor); });
  col.appendChild(btn);
});

/** Tłum przy ±2 daje Przewagę na początku każdej nowej rundy (u aktywnego MG). */
Hooks.on("updateCombat", (combat, changes, options) => {
  if (!game.users.activeGM?.isSelf) return;
  if (!("round" in changes) || !game.settings.get(MODULE_ID, "crowdAdvantage")) return;
  // Tylko nowa runda (nie cofanie w trackerze)
  if ((changes.round ?? 0) < 1 || options?.direction === -1) return;
  Ops.onCombatRound(combat).catch(err => console.error(`${MODULE_ID} |`, err));
});

/* -------------------------------------------- */
/*  Przycisk na karcie postaci i pasek narzędzi */
/* -------------------------------------------- */

registerSheetButton({
  featureId: "champion",
  className: "open-champion-legend",
  icon: "fa-solid fa-book-open",
  label: "CHAMPION.SheetButton",
  action: "championLegend",
  legacyClasses: ["champion-sheet-tab", "open-champion-mandate"],
  onClick: (actor) => openSheet(actor)
});

addTokenTool({
  name: "champion-legend",
  title: "CHAMPION.SheetButton",
  icon: "fas fa-book-open",
  onClick: () => {
    const controlled = canvas.tokens?.controlled?.[0]?.actor;
    const character = controlled || game.actors.find(a => a.type === "character" && a.getFlag(MODULE_ID, "legend"));
    if (character) openSheet(character);
    else ui.notifications.info(t("Notify.SelectChampionToken"));
  }
});
