/**
 * WFRP4e – Legenda Szampierza (Iron Mandate: Champion)
 * Punkt startowy modułu Foundry VTT.
 */

import { MODULE_ID, QUERY_MUTATE, TEMPLATE_ROOT, t } from "./scripts/constants.mjs";
import * as R from "./scripts/rules.mjs";
import * as Store from "./scripts/store.mjs";
import * as Ops from "./scripts/operations.mjs";
import { LegendSheet } from "./scripts/legend-sheet.mjs";
import { registry, registerSheetButton, addTokenTool, registerQuery } from "../wfrp4e-companion-lib/scripts/companion-lib.mjs";

/* -------------------------------------------- */
/*  Otwieranie karty                            */
/* -------------------------------------------- */

function openSheet(actor) {
  try {
    const target = actor || canvas.tokens?.controlled?.[0]?.actor || game.user.character;
    if (!target) return ui.notifications.warn(t("Notify.SelectToken"));
    const existing = foundry.applications.instances.get(`${MODULE_ID}-legend-${target.id}`);
    if (existing) {
      existing.render({ force: true });
      existing.bringToFront();
      return existing;
    }
    return new LegendSheet(target).render({ force: true });
  } catch (err) {
    console.error(`${MODULE_ID} | LegendSheet:`, err);
    ui.notifications.error(t("Notify.OpenError", { error: err.message }));
  }
}

/** Odświeża otwarte karty (wszystkie albo jednego aktora). */
function refreshSheets(actorId = null) {
  for (const app of foundry.applications.instances.values()) {
    if (app instanceof LegendSheet && (!actorId || app.actor.id === actorId)) app.render();
  }
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
    onChange: () => refreshSheets()
  });

  game.settings.register(MODULE_ID, "crowdAdvantage", {
    name: "CHAMPION.Settings.CrowdAdvantageName",
    hint: "CHAMPION.Settings.CrowdAdvantageHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  registerQuery(QUERY_MUTATE, Store.handleRelayQuery);

  await foundry.applications.handlebars.loadTemplates([
    `${TEMPLATE_ROOT}/legend-sheet.hbs`,
    `${TEMPLATE_ROOT}/parts/header.hbs`,
    `${TEMPLATE_ROOT}/parts/tab-legend.hbs`,
    `${TEMPLATE_ROOT}/parts/tab-petitions.hbs`,
    `${TEMPLATE_ROOT}/parts/petition-body.hbs`,
    `${TEMPLATE_ROOT}/parts/tab-arena.hbs`,
    `${TEMPLATE_ROOT}/parts/tab-rivals.hbs`,
    `${TEMPLATE_ROOT}/parts/tab-chronicle.hbs`,
    `${TEMPLATE_ROOT}/chat/card.hbs`
  ]);
});

/* -------------------------------------------- */
/*  Ready: API dla makr                         */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  game.champion = {
    openSheet,
    LegendSheet,
    rules: R,
    getState: Store.getState,
    operations: Ops,
    /** Echo Sławy z makra (MG): game.champion.echo(aktor) */
    echo: (actor) => Ops.rollEcho(actor ?? canvas.tokens?.controlled?.[0]?.actor),
    newSession: () => Ops.newSession()
  };
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
      const { lgChat, actorUuid, taleId, role } = btn.dataset;
      const champion = actorUuid ? await fromUuid(actorUuid) : null;
      if (!champion) return ui.notifications.warn(t("Notify.ActorMissing"));
      try {
        if (lgChat === "tellTavern") await Ops.tellTavern(champion, taleId);
        else if (lgChat === "second") await Ops.chatSecond(champion, role);
      } catch (err) {
        console.error(`${MODULE_ID} |`, err);
        ui.notifications.error(err.message);
      }
    });
  }
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
