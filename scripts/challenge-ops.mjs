/**
 * WFRP4e - Żelazny Mandat: Szampierz i Prawo Pojedynku
 * Operacje na czacie, akcje bojowe i interakcje polityczne
 */

import { ChampionData, t } from "./champion-data.mjs";

export class ChallengeOperations {
  static MODULE_ID = "wfrp4e-champion";

  /**
   * Wykonanie Akcji Bojowej (Gambitu)
   * Weryfikuje i pobiera Przewagi, po czym wysyła interaktywną kartę z testem na czat
   * @param {Actor} actor 
   * @param {string} gambitId 
   */
  static async executeGambit(actor, gambitId) {
    if (!actor) return;
    const champ = ChampionData.getChampion(actor);
    const gambit = champ.gambits.find(g => g.id === gambitId);

    if (!gambit) {
      ui.notifications.error(t("Notify.GambitNotFound"));
      return;
    }

    // 1. Sprawdzenie aktywnej postawy (np. Szuler z Zaułka obniża koszt Brudnych Sztuczek o 1P)
    let effectiveCost = gambit.costAdvantage || 0;
    if (champ.activeStance === "gutter" && gambit.category === "sztuczka") {
      effectiveCost = Math.max(0, effectiveCost - 1);
    }

    // 2. Weryfikacja Przewag (Advantage) na karcie postaci WFRP4e
    const currentAdvantage = actor.system?.status?.advantage?.value ?? 0;
    if (effectiveCost > 0 && currentAdvantage < effectiveCost) {
      ui.notifications.warn(t("Notify.NoAdvantage", { name: gambit.name, cost: effectiveCost, current: currentAdvantage }));
      return;
    }

    // 3. Pobranie Przewag z karty aktora
    if (effectiveCost > 0 && actor.system?.status?.advantage) {
      await actor.update({ "system.status.advantage.value": Math.max(0, currentAdvantage - effectiveCost) });
    }

    // 4. Pobranie nazwy i ikony aktywnej postawy
    const stance = champ.stances.find(s => s.id === champ.activeStance) || champ.stances[0];

    const templateData = {
      actorName: actor.name,
      actorImg: actor.img,
      gambitName: gambit.name,
      categoryLabel: t(`Category.${gambit.category || "default"}`),
      costAdvantage: effectiveCost,
      opposedTest: gambit.opposedTest,
      effect: gambit.effect,
      tags: gambit.tags,
      stanceName: stance.name,
      stanceSchool: stance.school,
      remainingAdvantage: Math.max(0, currentAdvantage - effectiveCost)
    };

    const html = await foundry.applications.handlebars.renderTemplate(
      `modules/${this.MODULE_ID}/templates/chat/gambit-card.hbs`,
      templateData
    );

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: html,
      flags: {
        [this.MODULE_ID]: {
          type: "gambit",
          gambitId
        }
      }
    });

    ui.notifications.info(t("Notify.GambitDone", { name: gambit.name }));
  }

  /**
   * Wykorzystanie Przysługi / Wpływu u przypiętego Aktora Dworu
   * @param {Actor} actor - Szampierz
   * @param {string} courtId - ID Dworu (np. court-middenheim, court-nuln)
   * @param {string} pinnedActorId - ID przypiętej postaci
   * @param {string} customDemand - Wpisane żądanie/przeznaczenie przysługi
   */
  static async useCourtFavor(actor, courtId, pinnedActorId, customDemand = "") {
    if (!actor) return;
    const champ = ChampionData.getChampion(actor);
    const court = champ.courts.find(c => c.id === courtId);
    if (!court) return;

    const pinned = court.pinnedActors.find(p => p.id === pinnedActorId);
    if (!pinned) return;

    if ((pinned.favors || 0) < 1) {
      ui.notifications.warn(t("Notify.NoFavors", { name: pinned.name }));
      return;
    }

    // Zmniejsz liczbę przysług o 1
    pinned.favors = Math.max(0, pinned.favors - 1);
    await ChampionData.saveChampion(actor, champ);

    const templateData = {
      actorName: actor.name,
      courtName: court.name,
      pinnedName: pinned.name,
      pinnedStatus: pinned.status,
      pinnedImg: pinned.img,
      relationshipLabel: t(`Relationship.${pinned.relationship}`),
      remainingFavors: pinned.favors,
      hooks: pinned.hooks,
      demandText: customDemand || t("Dialog.DefaultDemand")
    };

    const html = await foundry.applications.handlebars.renderTemplate(
      `modules/${this.MODULE_ID}/templates/chat/dossier-card.hbs`,
      templateData
    );

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: html
    });

    ui.notifications.info(t("Notify.FavorUsed", { name: pinned.name, left: pinned.favors }));
  }

  /**
   * Wysyła formalną Kartę Wyzwania na czat
   * @param {Actor} actor 
   */
  static async postChallenge(actor) {
    if (!actor) return;
    const champ = ChampionData.getChampion(actor);

    const scale = ["tactical", "strategic"].includes(champ.challengeScale) ? champ.challengeScale : "personal";
    const scaleLabel = t(`Scale.${scale}.Label`);
    const scaleIcon = { personal: "fa-gavel", tactical: "fa-shield-halved", strategic: "fa-flag" }[scale];

    // Zbadane słabości ze Studium Rywala
    const discoveredWeaknesses = ["kneeInjury", "hotTempered", "bladePoisoner", "superstitious", "rigidStyle"]
      .filter(key => champ.rivalStudy?.weaknesses?.[key])
      .map(key => t(`Weakness.${key}`));
    if (champ.rivalStudy?.customWeakness) discoveredWeaknesses.push(champ.rivalStudy.customWeakness);

    const templateData = {
      actorName: actor.name,
      actorImg: actor.img,
      targetName: champ.rivalStudy.targetName || t("Challenge.DefaultTarget"),
      targetStatus: champ.rivalStudy.targetStatus || t("Challenge.DefaultTargetStatus"),
      scaleLabel,
      scaleIcon,
      stakes: champ.challengeStakes || t("Challenge.DefaultStakes"),
      conditions: champ.challengeConditions || t("Challenge.DefaultConditions"),
      weaknesses: discoveredWeaknesses,
      mandate: champ.mandate
    };

    const html = await foundry.applications.handlebars.renderTemplate(
      `modules/${this.MODULE_ID}/templates/chat/challenge-card.hbs`,
      templateData
    );

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: html
    });

    ui.notifications.info(t("Notify.ChallengePosted"));
  }
}
