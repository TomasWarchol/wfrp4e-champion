/**
 * WFRP4e - Żelazny Mandat: Szampierz i Prawo Pojedynku
 * Model danych i zarządzanie stanem Szampierza
 */

/** Tłumaczy klucz z przestrzeni CHAMPION (z podstawieniami, gdy podano dane). */
export function t(key, data) {
  const full = `CHAMPION.${key}`;
  return data ? game.i18n.format(full, data) : game.i18n.localize(full);
}

/** Formatuje Mandat Krwi: Korona (+), Gmin (−) albo Równowaga. */
export function formatMandate(value) {
  const val = Number(value) || 0;
  if (val > 0) return t("Mandate.Crown", { value: val });
  if (val < 0) return t("Mandate.Commons", { value: val });
  return t("Mandate.Balance");
}

export class ChampionData {
  static MODULE_ID = "wfrp4e-champion";
  static FLAG_KEY = "champion";

  /**
   * Zwraca domyślną konfigurację Postaw Bojowych (teksty w języku świata w chwili tworzenia danych)
   */
  static getDefaultStances() {
    const stance = (id, icon) => ({
      id,
      name: t(`Defaults.Stances.${id}.Name`),
      school: t(`Defaults.Stances.${id}.School`),
      icon,
      description: t(`Defaults.Stances.${id}.Desc`),
      bonusText: t(`Defaults.Stances.${id}.Bonus`)
    });
    return [
      stance("peasant", "fa-shield-halved"),
      stance("court", "fa-feather-pointed"),
      stance("gutter", "fa-skull")
    ];
  }

  /**
   * Zwraca zbalansowany katalog Akcji Bojowych (wymagających Przewag i pełnych Testów)
   */
  static getDefaultGambits() {
    const gambit = (id, category, costAdvantage, active) => ({
      id,
      category,
      categoryLabel: t(`Category.${category}`),
      name: t(`Defaults.Gambits.${id}.Name`),
      costAdvantage,
      opposedTest: t(`Defaults.Gambits.${id}.Test`),
      effect: t(`Defaults.Gambits.${id}.Effect`),
      active,
      tags: t(`Defaults.Gambits.${id}.Tags`)
    });
    return [
      // Prowokacje i gry psychologiczne
      gambit("act-taunt-1", "prowokacja", 1, true),
      gambit("act-taunt-2", "prowokacja", 1, true),
      // Kontry i riposty (po udanym parowaniu)
      gambit("act-riposte-1", "kontra", 1, true),
      gambit("act-riposte-2", "kontra", 2, true),
      gambit("act-riposte-3", "kontra", 1, false),
      // Brudne sztuczki
      gambit("act-trick-1", "sztuczka", 1, true),
      gambit("act-trick-2", "sztuczka", 2, false),
      gambit("act-trick-3", "sztuczka", 1, false),
      // Finiszery i pokazy
      gambit("act-finisher-1", "finiszer", 2, false),
      gambit("act-finisher-2", "finiszer", 3, false),
      gambit("act-finisher-3", "finiszer", 2, false)
    ];
  }

  /**
   * Zwraca domyślne Dwory (Middenheim, Nuln) z obsługą przypinania Aktorów
   */
  static getDefaultCourts() {
    const pin = (id, relationship, favors) => ({
      id,
      actorId: null,
      actorUuid: "",
      name: t(`Defaults.Pins.${id}.Name`),
      status: t(`Defaults.Pins.${id}.Status`),
      img: "icons/svg/mystery-man.svg",
      relationship, // patron, debtor, blackmailed, rival
      relationshipLabel: t(`Relationship.${relationship}`),
      favors, // 1 do 5
      hooks: t(`Defaults.Pins.${id}.Hooks`),
      notes: t(`Defaults.Pins.${id}.Notes`)
    });
    const court = (id, influence, pinnedActors) => ({
      id,
      name: t(`Defaults.Courts.${id}.Name`),
      influence, // 0-100%
      description: t(`Defaults.Courts.${id}.Desc`),
      pinnedActors
    });
    return [
      court("court-middenheim", 55, [pin("pin-1", "patron", 3), pin("pin-2", "debtor", 2), pin("pin-3", "blackmailed", 1)]),
      court("court-nuln", 35, [pin("pin-4", "patron", 1), pin("pin-5", "rival", 1)])
    ];
  }

  /**
   * Zwraca domyślne Studium Rywala (zwiad przedpojedynkowy w TEW)
   */
  static getDefaultRivalStudy() {
    return {
      targetName: "",
      targetStatus: "",
      reconNotes: "",
      weaknesses: {
        kneeInjury: false,      // Stara rana nogi -> podcięcia tańsze
        hotTempered: false,     // Porywczy furiat -> prowokacje łatwiejsze
        bladePoisoner: false,   // Zatruwa ostrze -> odtrutka gotowa
        superstitious: false,   // Przesądny -> symbole Morra/Ulryka osłabiają
        rigidStyle: false       // Sztywny fechtunek -> riposty skuteczniejsze
      },
      customWeakness: ""
    };
  }

  /**
   * Zwraca kompletną strukturę danych Szampierza
   */
  static getDefaultData() {
    return {
      activeStance: "peasant", // peasant, court, gutter
      mandate: -3, // -10 (Gmin) do +10 (Korona)
      folkStanding: 50, // 0-100% Chłopski Mir (Posłuch u pospólstwa i żołnierzy)
      activeCourtId: "court-middenheim",
      stances: this.getDefaultStances(),
      gambits: this.getDefaultGambits(),
      courts: this.getDefaultCourts(),
      rivalStudy: this.getDefaultRivalStudy(),
      challengeScale: "personal", // personal, tactical, strategic
      challengeStakes: t("Defaults.ChallengeStakes"),
      challengeConditions: t("Defaults.ChallengeConditions")
    };
  }

  /**
   * Pobiera dane szampierza z flag aktora
   */
  static getChampion(actor) {
    if (!actor) return null;
    const flag = actor.getFlag(this.MODULE_ID, this.FLAG_KEY);
    const defaults = this.getDefaultData();
    if (!flag) return defaults;

    return (typeof foundry !== "undefined" && foundry.utils?.mergeObject)
      ? foundry.utils.mergeObject(defaults, flag, { inplace: false, insertKeys: true, insertValues: true })
      : Object.assign({}, defaults, flag);
  }

  /**
   * Zapisuje dane szampierza na aktorze
   */
  static async saveChampion(actor, data) {
    if (!actor) return;
    await actor.setFlag(this.MODULE_ID, this.FLAG_KEY, data);
  }
}
