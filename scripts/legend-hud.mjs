/**
 * Legenda Szampierza – mały panel sesji (HUD): to, czego szampierz używa w trakcie gry.
 */

import { MODULE_ID, TEMPLATE_ROOT, t, contentLang } from "./constants.mjs";
import { content } from "./content.mjs";
import { buildHudModel } from "./view-model.mjs";
import * as Store from "./store.mjs";
import { LEGEND_ACTIONS } from "./actions.mjs";
import { time } from "../../wfrp4e-companion-lib/scripts/companion-lib.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class LegendHud extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor, options = {}) {
    super({ id: `${MODULE_ID}-hud-${actor.id}`, ...options });
    this.actor = actor;
  }

  static DEFAULT_OPTIONS = {
    classes: ["champion-legend-app", "champion-hud-app"],
    tag: "div",
    window: { title: "CHAMPION.Hud.Title", icon: "fa-solid fa-shield-halved", resizable: false, minimizable: true },
    position: { width: 320, height: "auto", top: 90, left: 120 },
    actions: { ...LEGEND_ACTIONS }
  };

  static PARTS = {
    hud: { template: `${TEMPLATE_ROOT}/hud.hbs` }
  };

  get title() {
    return this.actor.name;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return Object.assign(context, buildHudModel(Store.getState(this.actor), {
      t,
      content: content(contentLang()),
      actor: { name: this.actor.name, img: this.actor.img },
      isGM: game.user.isGM,
      canEdit: this.actor.isOwner,
      sessionId: Store.sessionId(),
      now: time.now(),
      secondsPerDay: time.secondsPerDay(),
      formatDate: ts => time.format(ts),
      combatAvailable: !!game.combat
    }));
  }
}
