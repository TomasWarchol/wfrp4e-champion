/**
 * Legenda Szampierza – okno karty (ApplicationV2).
 */

import { MODULE_ID, TEMPLATE_ROOT, t, contentLang } from "./constants.mjs";
import { content } from "./content.mjs";
import { buildViewModel } from "./view-model.mjs";
import * as Store from "./store.mjs";
import * as Ops from "./operations.mjs";
import { LEGEND_ACTIONS } from "./actions.mjs";
import { time } from "../../wfrp4e-companion-lib/scripts/companion-lib.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class LegendSheet extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor, options = {}) {
    super({ id: `${MODULE_ID}-legend-${actor.id}`, ...options });
    this.actor = actor;
  }

  static DEFAULT_OPTIONS = {
    classes: ["champion-legend-app"],
    tag: "div",
    window: { title: "CHAMPION.WindowTitle", icon: "fa-solid fa-book-open", resizable: true },
    position: { width: 1000, height: 820 },
    actions: {
      lgTab: LegendSheet.#onTab,
      ...LEGEND_ACTIONS
    }
  };

  static PARTS = {
    sheet: {
      template: `${TEMPLATE_ROOT}/legend-sheet.hbs`,
      scrollable: [".lg-body"]
    }
  };

  tabGroups = { primary: "legend" };

  get title() {
    return `${t("WindowTitle")}: ${this.actor.name}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const state = Store.getState(this.actor);
    return Object.assign(context, buildViewModel(state, {
      t,
      content: content(contentLang()),
      actor: { name: this.actor.name, img: this.actor.img },
      isGM: game.user.isGM,
      canEdit: this.actor.isOwner,
      sessionId: Store.sessionId(),
      now: time.now(),
      secondsPerDay: time.secondsPerDay(),
      formatDate: ts => time.format(ts),
      activeTab: this.tabGroups.primary,
      combatAvailable: !!game.combat
    }));
  }

  _onRender(context, options) {
    super._onRender(context, options);
    for (const zone of this.element.querySelectorAll("[data-drop]")) {
      zone.addEventListener("dragover", ev => { ev.preventDefault(); zone.classList.add("lg-drop-hover"); });
      zone.addEventListener("dragleave", () => zone.classList.remove("lg-drop-hover"));
      zone.addEventListener("drop", ev => { zone.classList.remove("lg-drop-hover"); this.#onDrop(ev, zone); });
    }
  }

  /** Przełączenie zakładki bez ponownego renderu. */
  static #onTab(event, target) {
    event.preventDefault();
    const tab = target.dataset.tab;
    if (!tab) return;
    this.tabGroups.primary = tab;
    for (const el of this.element.querySelectorAll(".lg-tab")) el.classList.toggle("active", el.dataset.tab === tab);
    for (const el of this.element.querySelectorAll(".lg-page")) el.classList.toggle("active", el.dataset.tab === tab);
  }

  async #onDrop(event, zone) {
    event.preventDefault();
    event.stopPropagation();
    let data;
    try {
      data = foundry.applications.ux?.TextEditor?.implementation?.getDragEventData?.(event)
        ?? JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      return;
    }
    if (data?.type !== "Actor" || !data.uuid) return;
    const dropped = await fromUuid(data.uuid);
    if (!dropped) return;
    const champion = this.actor;
    try {
      switch (zone.dataset.drop) {
        case "petition":
          if (champion.isOwner) await Ops.addPetition(champion, { petitioner: dropped.name, img: dropped.img, actorUuid: dropped.uuid });
          break;
        case "rival":
          if (champion.isOwner) await Ops.rivalFromActor(champion, dropped);
          break;
        case "duelRival":
          if (champion.isOwner) {
            const rival = await Ops.rivalFromActor(champion, dropped);
            if (rival) await Ops.setupDuel(champion, { rivalId: rival.id });
          }
          break;
      }
    } catch (err) {
      console.error(`${MODULE_ID} |`, err);
      ui.notifications.error(err.message);
    }
  }
}
