/**
 * WFRP4e - Żelazny Mandat: Szampierz i Prawo Pojedynku
 * Główny interfejs aplikacji zarządzania Szampierzem (ApplicationV2)
 */

import { ChampionData, t, formatMandate } from "./champion-data.mjs";
import { ChallengeOperations } from "./challenge-ops.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const esc = (value) => Handlebars.escapeExpression(value ?? "");
const CANCEL_BUTTON = { action: "cancel", icon: "fas fa-times", label: "WFRP4E_COMPANION.Cancel" };

export class ChampionSheet extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor, options = {}) {
    super({ id: `wfrp4e-champion-sheet-${actor.id}`, ...options });
    this.actor = actor;
  }

  static DEFAULT_OPTIONS = {
    classes: ["wfrp4e", "champion-app"],
    tag: "form",
    window: {
      title: "CHAMPION.WindowTitle",
      icon: "fas fa-shield-halved",
      resizable: true
    },
    position: {
      width: 740,
      height: 720
    },
    form: {
      handler: ChampionSheet.#onSubmitForm,
      submitOnChange: false,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    sheet: {
      template: "modules/wfrp4e-champion/templates/champion-sheet.hbs"
    }
  };

  tabGroups = { primary: "combat" };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const champ = ChampionData.getChampion(this.actor);

    // Aktywna postawa
    const activeStance = champ.stances.find(s => s.id === champ.activeStance) || champ.stances[0];

    // Aktywny dwór
    let activeCourt = champ.courts.find(c => c.id === champ.activeCourtId);
    if (!activeCourt && champ.courts.length > 0) {
      activeCourt = champ.courts[0];
      champ.activeCourtId = activeCourt.id;
    }

    // Aktualne przewagi na karcie postaci WFRP4e
    const currentAdvantage = this.actor?.system?.status?.advantage?.value ?? 0;

    // Etykiety kategorii i relacji zawsze w bieżącym języku (dane mogły powstać w innym)
    for (const gambit of champ.gambits) gambit.categoryLabel = t(`Category.${gambit.category || "default"}`);
    for (const court of champ.courts) {
      for (const pinned of court.pinnedActors || []) pinned.relationshipLabel = t(`Relationship.${pinned.relationship}`);
    }

    context.actor = this.actor;
    context.champ = champ;
    context.activeStance = activeStance;
    context.activeCourt = activeCourt;
    context.currentAdvantage = currentAdvantage;
    context.isGM = game.user.isGM;

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;

    // Przywrócenie aktywnej zakładki po każdym renderze
    this.changeTab(this.tabGroups.primary, "primary", { force: true, updatePosition: false });

    // ==========================================
    // 1. GÓRNY HUD (Postawa, Mandat, Chłopski Mir)
    // ==========================================

    // Zmiana Mandatu Krwi (suwak)
    const mandateSlider = html.querySelector('input[name="mandate-slider"]');
    mandateSlider?.addEventListener("input", (ev) => {
      const val = parseInt(ev.currentTarget.value, 10);
      const display = html.querySelector(".mandate-val-display");
      if (display) display.textContent = formatMandate(val);
    });

    mandateSlider?.addEventListener("change", async (ev) => {
      const val = parseInt(ev.currentTarget.value, 10);
      const champ = ChampionData.getChampion(this.actor);
      champ.mandate = val;
      await ChampionData.saveChampion(this.actor, champ);
      this.render();
    });

    // Zmiana Chłopskiego Miru
    html.querySelector('input[name="folkStanding"]')?.addEventListener("change", async (ev) => {
      const val = Math.clamp(parseInt(ev.currentTarget.value, 10) || 0, 0, 100);
      const champ = ChampionData.getChampion(this.actor);
      champ.folkStanding = val;
      await ChampionData.saveChampion(this.actor, champ);
      this.render();
    });

    // Edycja Wpływu Dworu (procent)
    html.querySelectorAll('input[name="courtInfluence"]').forEach(input => {
      input.addEventListener("change", async (ev) => {
        const val = Math.clamp(parseInt(ev.currentTarget.value, 10) || 0, 0, 100);
        const courtId = ev.currentTarget.dataset.courtId;
        const champ = ChampionData.getChampion(this.actor);
        const court = champ.courts.find(c => c.id === courtId);
        if (court) {
          court.influence = val;
          await ChampionData.saveChampion(this.actor, champ);
          this.render();
        }
      });
    });

    // Przełączanie słabości rywala (Studium)
    html.querySelectorAll(".weakness-chip").forEach(chip => {
      chip.addEventListener("click", async (ev) => {
        ev.preventDefault();
        const weakness = ev.currentTarget.dataset.weakness;
        const champ = ChampionData.getChampion(this.actor);
        if (!champ.rivalStudy.weaknesses) champ.rivalStudy.weaknesses = {};
        champ.rivalStudy.weaknesses[weakness] = !champ.rivalStudy.weaknesses[weakness];
        await ChampionData.saveChampion(this.actor, champ);
        this.render();
      });
    });

    // Drag & Drop Aktorów z paska Foundry na Dwór
    html.querySelectorAll(".court-pinned-dropzone").forEach(zone => {
      zone.addEventListener("dragover", ev => ev.preventDefault());
      zone.addEventListener("drop", ev => this._onDrop(ev));
    });
  }

  /**
   * Obsługa kliknięć w elementy z [data-action] (akcje bez zdefiniowanego handlera w DEFAULT_OPTIONS)
   */
  async _onClickAction(event, target) {
    event.preventDefault();
    const { stanceId, gambitId, courtId, pinnedId, scale } = target.dataset;

    switch (target.dataset.action) {
      // ==========================================
      // 2. ZAKŁADKA 1: SZKOŁA WALKI I POSTAWY
      // ==========================================

      // Wybór aktywnej Postawy Bojowej
      case "select-stance": {
        const champ = ChampionData.getChampion(this.actor);
        champ.activeStance = stanceId;
        await ChampionData.saveChampion(this.actor, champ);
        this.render();
        ui.notifications.info(t("Notify.StanceTaken", { name: champ.stances.find(s => s.id === stanceId)?.name ?? "" }));
        break;
      }

      // Wykonaj Akcję Bojową w Walce
      case "execute-gambit":
        await ChallengeOperations.executeGambit(this.actor, gambitId);
        this.render();
        break;

      // Dodaj / Edytuj Akcję Bojową
      case "add-gambit":
        this._openGambitDialog(null);
        break;
      case "edit-gambit":
        this._openGambitDialog(gambitId);
        break;

      // Usuń Akcję Bojową
      case "delete-gambit": {
        const champ = ChampionData.getChampion(this.actor);
        champ.gambits = champ.gambits.filter(g => g.id !== gambitId);
        await ChampionData.saveChampion(this.actor, champ);
        this.render();
        break;
      }

      // ==========================================
      // 3. ZAKŁADKA 2: WIELODWORSKI SYSTEM WPŁYWÓW
      // ==========================================

      // Wybór aktywnego Dworu (Nuln, Middenheim itd.)
      case "select-court": {
        const champ = ChampionData.getChampion(this.actor);
        champ.activeCourtId = courtId;
        await ChampionData.saveChampion(this.actor, champ);
        this.render();
        break;
      }

      // Dodaj Nowy Dwór
      case "add-court":
        this._openAddCourtDialog();
        break;

      // Usuń Dwór
      case "delete-court": {
        const champ = ChampionData.getChampion(this.actor);
        if (champ.courts.length <= 1) {
          ui.notifications.warn(t("Notify.KeepOneCourt"));
          return;
        }
        champ.courts = champ.courts.filter(c => c.id !== courtId);
        champ.activeCourtId = champ.courts[0].id;
        await ChampionData.saveChampion(this.actor, champ);
        this.render();
        break;
      }

      // Modyfikacja Przysług (Pipsy [+] [-])
      case "modify-favor": {
        const delta = parseInt(target.dataset.delta, 10);
        const champ = ChampionData.getChampion(this.actor);
        const pinned = champ.courts.find(c => c.id === courtId)?.pinnedActors.find(p => p.id === pinnedId);
        if (pinned) {
          pinned.favors = Math.clamp((pinned.favors || 0) + delta, 0, 5);
          await ChampionData.saveChampion(this.actor, champ);
          this.render();
        }
        break;
      }

      // Wykorzystaj Wpływ u Przypiętego Aktora (na czat)
      case "use-favor":
        this._openUseFavorDialog(courtId, pinnedId);
        break;

      // Edytuj Przypiętego Aktora (Relacja, Haki)
      case "edit-pinned":
        this._openEditPinnedDialog(courtId, pinnedId);
        break;

      // Usuń Przypiętego Aktora z Dworu
      case "delete-pinned": {
        const champ = ChampionData.getChampion(this.actor);
        const court = champ.courts.find(c => c.id === courtId);
        if (court) {
          court.pinnedActors = court.pinnedActors.filter(p => p.id !== pinnedId);
          await ChampionData.saveChampion(this.actor, champ);
          this.render();
        }
        break;
      }

      // ==========================================
      // 4. ZAKŁADKA 3: WYZWANIE I ZWIAD RYVALA
      // ==========================================

      // Zmiana skali wyzwania
      case "set-scale": {
        const champ = ChampionData.getChampion(this.actor);
        champ.challengeScale = scale;
        await ChampionData.saveChampion(this.actor, champ);
        this.render();
        break;
      }

      // Rzuć rękawicę na czat
      case "post-challenge": {
        const field = (selector) => this.element.querySelector(selector)?.value || "";
        const champ = ChampionData.getChampion(this.actor);
        champ.rivalStudy.targetName = field('input[name="rivalName"]');
        champ.rivalStudy.targetStatus = field('input[name="rivalStatus"]');
        champ.rivalStudy.customWeakness = field('input[name="customWeakness"]');
        champ.challengeStakes = field('textarea[name="challengeStakes"]');
        champ.challengeConditions = field('input[name="challengeConditions"]');
        await ChampionData.saveChampion(this.actor, champ);

        await ChallengeOperations.postChallenge(this.actor);
        break;
      }
    }
  }

  /**
   * Obsługa Drag & Drop Aktorów z paska Foundry na Dwór
   */
  async _onDrop(event) {
    event.preventDefault();
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      return false;
    }

    if (data.type === "Actor") {
      const droppedActor = await fromUuid(data.uuid);
      if (droppedActor) {
        const champ = ChampionData.getChampion(this.actor);
        const court = champ.courts.find(c => c.id === champ.activeCourtId) || champ.courts[0];
        if (!court) return;

        // Sprawdź, czy aktor już jest przypięty
        if (court.pinnedActors.some(p => p.actorUuid === droppedActor.uuid || p.name === droppedActor.name)) {
          ui.notifications.warn(t("Notify.AlreadyPinned", { name: droppedActor.name }));
          return;
        }

        // Pobierz status społeczny z karty WFRP4e
        let statusString = t("Dialog.DefaultStatus");
        if (droppedActor.system?.details?.status?.value) {
          statusString = droppedActor.system.details.status.value;
        }

        court.pinnedActors.push({
          id: foundry.utils.randomID(),
          actorId: droppedActor.id,
          actorUuid: droppedActor.uuid,
          name: droppedActor.name,
          status: statusString,
          img: droppedActor.img || "icons/svg/mystery-man.svg",
          relationship: "debtor",
          relationshipLabel: t("Relationship.debtor"),
          favors: 2,
          hooks: t("Dialog.NewContactHooks"),
          notes: ""
        });

        await ChampionData.saveChampion(this.actor, champ);
        this.render();
        ui.notifications.info(t("Notify.Pinned", { name: droppedActor.name, court: court.name }));
      }
    }
  }

  // ==========================================
  // DIALOGI I MODALE
  // ==========================================

  /**
   * Dialog dodawania nowego Dworu
   */
  async _openAddCourtDialog() {
    await DialogV2.wait({
      window: { title: "CHAMPION.Dialog.AddCourtTitle" },
      content: `
        <div class="champion-dialog-form">
          <div class="dialog-field">
            <label>${t("Dialog.CourtName")}</label>
            <input type="text" name="courtName" placeholder="${esc(t("Dialog.CourtNamePlaceholder"))}" required />
          </div>
          <div class="dialog-field">
            <label>${t("Dialog.CourtDesc")}</label>
            <textarea name="courtDesc" rows="2" placeholder="${esc(t("Dialog.CourtDescPlaceholder"))}"></textarea>
          </div>
        </div>
      `,
      buttons: [
        {
          action: "save",
          icon: "fas fa-check",
          label: "CHAMPION.Dialog.Add",
          default: true,
          callback: async (event, button) => {
            const form = button.form.elements;
            const name = form.courtName.value;
            const desc = form.courtDesc.value;
            if (!name) return;

            const champ = ChampionData.getChampion(this.actor);
            const newCourt = {
              id: "court-" + foundry.utils.randomID(),
              name,
              influence: 20,
              description: desc || t("Dialog.CourtDefaultDesc"),
              pinnedActors: []
            };
            champ.courts.push(newCourt);
            champ.activeCourtId = newCourt.id;
            await ChampionData.saveChampion(this.actor, champ);
            this.render();
          }
        },
        CANCEL_BUTTON
      ],
      rejectClose: false
    });
  }

  /**
   * Dialog wykorzystania wpływu u przypiętego aktora
   */
  async _openUseFavorDialog(courtId, pinnedId) {
    const champ = ChampionData.getChampion(this.actor);
    const court = champ.courts.find(c => c.id === courtId);
    const pinned = court?.pinnedActors.find(p => p.id === pinnedId);
    if (!pinned) return;

    await DialogV2.wait({
      window: { title: t("Dialog.UseFavorTitle", { name: pinned.name }) },
      content: `
        <div class="champion-dialog-form">
          <p><strong>${t("Dialog.FavorsAvailable")}</strong> ${t("Dialog.FavorsCount", { count: pinned.favors })}</p>
          <p><em>${t("Dialog.Hooks")}</em> ${esc(pinned.hooks || t("Dialog.NoHooks"))}</p>
          <div class="dialog-field">
            <label>${t("Dialog.Demand")}</label>
            <textarea name="demandText" rows="3" placeholder="${esc(t("Dialog.DemandPlaceholder"))}"></textarea>
          </div>
        </div>
      `,
      buttons: [
        {
          action: "use",
          icon: "fas fa-bullhorn",
          label: "CHAMPION.Dialog.UseAndAnnounce",
          default: true,
          callback: async (event, button) => {
            const demandText = button.form.elements.demandText.value;
            await ChallengeOperations.useCourtFavor(this.actor, courtId, pinnedId, demandText);
            this.render();
          }
        },
        CANCEL_BUTTON
      ],
      rejectClose: false
    });
  }

  /**
   * Dialog edycji przypiętego aktora
   */
  async _openEditPinnedDialog(courtId, pinnedId) {
    const champ = ChampionData.getChampion(this.actor);
    const court = champ.courts.find(c => c.id === courtId);
    const pinned = court?.pinnedActors.find(p => p.id === pinnedId);
    if (!pinned) return;

    await DialogV2.wait({
      window: { title: t("Dialog.EditPinnedTitle", { name: pinned.name }) },
      content: `
        <div class="champion-dialog-form">
          <div class="dialog-field">
            <label>${t("Dialog.RelationshipType")}</label>
            <select name="relationship">
              ${["patron", "debtor", "blackmailed", "rival"].map(rel => `<option value="${rel}" ${pinned.relationship === rel ? "selected" : ""}>${t(`Relationship.${rel}`)}</option>`).join("")}
            </select>
          </div>
          <div class="dialog-field">
            <label>${t("Dialog.FavorCount")}</label>
            <input type="number" name="favors" value="${esc(pinned.favors)}" min="0" max="5" />
          </div>
          <div class="dialog-field">
            <label>${t("Dialog.HooksField")}</label>
            <textarea name="hooks" rows="2">${esc(pinned.hooks)}</textarea>
          </div>
          <div class="dialog-field">
            <label>${t("Dialog.MeetingNotes")}</label>
            <textarea name="notes" rows="2">${esc(pinned.notes)}</textarea>
          </div>
        </div>
      `,
      buttons: [
        {
          action: "save",
          icon: "fas fa-check",
          label: "CHAMPION.Dialog.Save",
          default: true,
          callback: async (event, button) => {
            const form = button.form.elements;
            pinned.relationship = form.relationship.value;
            pinned.relationshipLabel = form.relationship.selectedOptions[0]?.text ?? "";
            pinned.favors = Math.clamp(parseInt(form.favors.value, 10) || 0, 0, 5);
            pinned.hooks = form.hooks.value;
            pinned.notes = form.notes.value;
            await ChampionData.saveChampion(this.actor, champ);
            this.render();
          }
        },
        CANCEL_BUTTON
      ],
      rejectClose: false
    });
  }

  /**
   * Dialog edycji i tworzenia Manewru Bojowego
   */
  async _openGambitDialog(gambitId) {
    const champ = ChampionData.getChampion(this.actor);
    const existing = gambitId ? champ.gambits.find(g => g.id === gambitId) : null;

    const gambit = existing || {
      id: foundry.utils.randomID(),
      name: t("Dialog.NewGambitName"),
      category: "sztuczka",
      categoryLabel: t("Category.sztuczka"),
      costAdvantage: 1,
      opposedTest: t("Dialog.NewGambitTest"),
      effect: t("Dialog.NewGambitEffect"),
      tags: t("Dialog.NewGambitTags"),
      active: true
    };

    await DialogV2.wait({
      window: { title: existing ? t("Dialog.EditGambitTitle", { name: gambit.name }) : t("Dialog.NewGambitTitle") },
      content: `
        <div class="champion-dialog-form">
          <div class="dialog-field">
            <label>${t("Dialog.GambitName")}</label>
            <input type="text" name="name" value="${esc(gambit.name)}" required />
          </div>
          <div class="dialog-row">
            <div class="dialog-field flex-1">
              <label>${t("Dialog.Category")}</label>
              <select name="category">
                ${["prowokacja", "kontra", "sztuczka", "finiszer"].map(cat => `<option value="${cat}" ${gambit.category === cat ? "selected" : ""}>${t(`Category.${cat}`)}</option>`).join("")}
              </select>
            </div>
            <div class="dialog-field flex-1">
              <label>${t("Dialog.Cost")}</label>
              <input type="number" name="costAdvantage" value="${esc(gambit.costAdvantage)}" min="0" max="5" />
            </div>
          </div>
          <div class="dialog-field">
            <label>${t("Dialog.OpposedTest")}</label>
            <input type="text" name="opposedTest" value="${esc(gambit.opposedTest)}" placeholder="${esc(t("Dialog.OpposedTestPlaceholder"))}" />
          </div>
          <div class="dialog-field">
            <label>${t("Dialog.Effect")}</label>
            <textarea name="effect" rows="3">${esc(gambit.effect)}</textarea>
          </div>
          <div class="dialog-field">
            <label>${t("Dialog.Tags")}</label>
            <input type="text" name="tags" value="${esc(gambit.tags)}" />
          </div>
        </div>
      `,
      buttons: [
        {
          action: "save",
          icon: "fas fa-check",
          label: "CHAMPION.Dialog.Save",
          default: true,
          callback: async (event, button) => {
            const form = button.form.elements;
            gambit.name = form.namedItem("name").value;
            gambit.category = form.category.value;
            gambit.categoryLabel = form.category.selectedOptions[0]?.text ?? "";
            gambit.costAdvantage = parseInt(form.costAdvantage.value, 10) || 0;
            gambit.opposedTest = form.opposedTest.value;
            gambit.effect = form.effect.value;
            gambit.tags = form.tags.value;

            if (!existing) {
              champ.gambits.push(gambit);
            } else {
              const idx = champ.gambits.findIndex(g => g.id === gambitId);
              if (idx !== -1) champ.gambits[idx] = gambit;
            }

            await ChampionData.saveChampion(this.actor, champ);
            this.render();
          }
        },
        CANCEL_BUTTON
      ],
      rejectClose: false
    });
  }

  static async #onSubmitForm(event, form, formData) {
    const champ = ChampionData.getChampion(this.actor);
    const expanded = foundry.utils.expandObject(formData.object);
    const merged = foundry.utils.mergeObject(champ, expanded);
    await ChampionData.saveChampion(this.actor, merged);
    this.render();
  }
}
