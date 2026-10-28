/**
 * WFRP4e - Żelazny Mandat: Szampierz i Prawo Pojedynku
 * Główny punkt startowy modułu Foundry VTT
 */

import { ChampionData, t, formatMandate } from "./scripts/champion-data.mjs";
import { ChampionSheet } from "./scripts/champion-sheet.mjs";
import { ChallengeOperations } from "./scripts/challenge-ops.mjs";
import { registry, registerSheetButton, addTokenTool } from "../wfrp4e-companion-lib/scripts/companion-lib.mjs";

const MODULE_ID = "wfrp4e-champion";

/* -------------------------------------------- */
/*  Inicjalizacja Modułu (Init)                 */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  console.log(`${MODULE_ID} | Iron Mandate: Champion – init`);

  // Rejestracja w Centrum Dodatków dla MG (GM Hub)
  registry.registerFeature({
    id: "champion",
    name: "WFRP4E_COMPANION.Features.Champion",
    icon: "fas fa-shield-halved",
    description: "WFRP4E_COMPANION.Features.ChampionDesc",
    module: MODULE_ID,
    open: (actor) => game.champion.openSheet(actor)
  });

  // 1. Rejestracja ustawień świata
  game.settings.register(MODULE_ID, "autoDeductAdvantage", {
    name: "CHAMPION.Settings.AutoDeductName",
    hint: "CHAMPION.Settings.AutoDeductHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // 2. Preload szablonów Handlebars
  await foundry.applications.handlebars.loadTemplates([
    `modules/${MODULE_ID}/templates/champion-sheet.hbs`,
    `modules/${MODULE_ID}/templates/parts/header-hud.hbs`,
    `modules/${MODULE_ID}/templates/parts/challenge-tab.hbs`,
    `modules/${MODULE_ID}/templates/parts/gambits-tab.hbs`,
    `modules/${MODULE_ID}/templates/parts/dossier-tab.hbs`,
    `modules/${MODULE_ID}/templates/chat/challenge-card.hbs`,
    `modules/${MODULE_ID}/templates/chat/gambit-card.hbs`,
    `modules/${MODULE_ID}/templates/chat/dossier-card.hbs`
  ]);

  // 3. Rejestracja pomocników Handlebars (porównania i pętle są w wfrp4e-companion-lib)
  Handlebars.registerHelper("champFormatMandate", val => formatMandate(val));
});

/* -------------------------------------------- */
/*  Po załadowaniu świata (Ready)               */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  console.log(`${MODULE_ID} | Ready – API: game.champion`);

  // Eksport API do makr i konsoli
  game.champion = {
    ChampionData,
    ChampionSheet,
    ChallengeOperations,
    openSheet: (actor) => {
      try {
        const targetActor = actor || canvas.tokens?.controlled[0]?.actor || game.user.character;
        if (!targetActor) {
          ui.notifications.warn(t("Notify.SelectToken"));
          return;
        }
        const existing = foundry.applications.instances.get(`wfrp4e-champion-sheet-${targetActor.id}`);
        if (existing) {
          existing.render({ force: true });
          existing.bringToFront();
          return;
        }
        new ChampionSheet(targetActor).render({ force: true });
      } catch (err) {
        console.error(`${MODULE_ID} | ChampionSheet:`, err);
        ui.notifications.error(t("Notify.OpenError", { error: err.message }));
      }
    }
  };
});

/* -------------------------------------------- */
/*  Przycisk na karcie postaci i pasek narzędzi */
/* -------------------------------------------- */

registerSheetButton({
  featureId: "champion",
  className: "open-champion-mandate",
  icon: "fa-solid fa-shield-halved",
  label: "CHAMPION.SheetButton",
  action: "championMandate",
  legacyClasses: ["champion-sheet-tab"],
  onClick: (actor) => game.champion.openSheet(actor)
});

// Skrót do Szampierza dla MG
addTokenTool({
  name: "champion-manager",
  title: "CHAMPION.SheetButton",
  icon: "fas fa-shield-halved",
  onClick: () => {
    const controlled = canvas.tokens?.controlled[0]?.actor;
    const character = controlled || game.actors.find(a => a.type === "character" && a.hasPlayerOwner);
    if (character) game.champion.openSheet(character);
    else ui.notifications.info(t("Notify.SelectChampionToken"));
  }
});
