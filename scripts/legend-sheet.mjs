/**
 * Legenda Szampierza – okno karty (ApplicationV2).
 */

import { MODULE_ID, TEMPLATE_ROOT, t, contentLang } from "./constants.mjs";
import { content } from "./content.mjs";
import { buildViewModel } from "./view-model.mjs";
import * as Store from "./store.mjs";
import * as Ops from "./operations.mjs";
import { time } from "../../wfrp4e-companion-lib/scripts/companion-lib.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Akcja przycisku → operacja na szampierzu (z obsługą błędów). */
function action(fn) {
  return async function (event, target) {
    event.preventDefault();
    try {
      await fn.call(this, this.actor, target.dataset, event);
    } catch (err) {
      console.error(`${MODULE_ID} |`, err);
      ui.notifications.error(err.message);
    }
  };
}

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
      // Imię i sesja
      declareName: action(a => Ops.declareName(a)),
      callName: action(a => Ops.callName(a)),
      newSession: action(() => Ops.newSession()),
      rollEcho: action(a => Ops.rollEcho(a)),
      inherit: action(a => Ops.inherit(a)),
      // Opowieści
      addTale: action(a => Ops.addTale(a)),
      editTale: action((a, d) => Ops.editTale(a, d.taleId)),
      deleteTale: action((a, d) => Ops.deleteTale(a, d.taleId)),
      invokeTale: action((a, d) => Ops.invokeTale(a, d.taleId)),
      refuteTale: action((a, d) => Ops.refuteTale(a, d.taleId)),
      tellTavern: action((a, d) => Ops.tellTavern(a, d.taleId)),
      // Prośby
      addPetition: action(a => Ops.addPetition(a)),
      editPetition: action((a, d) => Ops.editPetition(a, d.petitionId)),
      deletePetition: action((a, d) => Ops.deletePetition(a, d.petitionId)),
      petition: action((a, d) => Ops.petitionAction(a, d.petitionId, d.op)),
      // Arena
      newDuel: action(a => Ops.setupDuel(a)),
      editDuel: action(a => Ops.setupDuel(a, { edit: true })),
      challengeRival: action((a, d) => Ops.setupDuel(a, { rivalId: d.rivalId })),
      postChallenge: action(a => Ops.postChallenge(a)),
      cancelDuel: action(a => Ops.cancelDuel(a)),
      duelStage: action((a, d) => Ops.duelStage(a, Number(d.dir) || 0)),
      rivalEdges: action((a, d) => Ops.shiftRivalEdges(a, Number(d.delta) || 0)),
      rollSecond: action((a, d) => Ops.rollSecond(a, d.role)),
      clearSecond: action((a, d) => Ops.clearSecond(a, d.role)),
      callSeconds: action(a => Ops.callSeconds(a)),
      useEdge: action((a, d) => Ops.useEdge(a, d.edgeId)),
      crowd: action((a, d) => Ops.shiftCrowd(a, Number(d.delta) || 0)),
      playToCrowd: action(a => Ops.playToCrowd(a)),
      dirtyTrick: action(a => Ops.dirtyTrick(a)),
      linkCombat: action(a => Ops.linkCombat(a)),
      resolveDuel: action(a => Ops.resolveDuel(a)),
      // Rywale
      addRival: action(a => Ops.addRival(a)),
      editRival: action((a, d) => Ops.editRival(a, d.rivalId)),
      deleteRival: action((a, d) => Ops.deleteRival(a, d.rivalId)),
      grudge: action((a, d) => Ops.shiftGrudge(a, d.rivalId, Number(d.delta) || 0)),
      // Kronika
      addNote: action(a => Ops.addNote(a)),
      deleteNote: action((a, d) => Ops.deleteNote(a, d.entryId)),
      exportChronicle: action(a => Ops.exportChronicle(a))
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
        case "second":
          await Ops.assignSecond(champion, zone.dataset.role, dropped);
          break;
      }
    } catch (err) {
      console.error(`${MODULE_ID} |`, err);
      ui.notifications.error(err.message);
    }
  }
}
