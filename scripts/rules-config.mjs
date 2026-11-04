/**
 * Okno „Zasady Legendy” (MG): wszystkie liczby zasad i przełączniki zachowania modułu.
 * Zapisuje ustawienia świata; moduł od razu przelicza karty i przełączniki w oknach testu.
 */

import { MODULE_ID, TEMPLATE_ROOT, t } from "./constants.mjs";
import * as R from "./rules.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Przełączniki zachowania (ustawienia świata typu Boolean). */
export const TOGGLES = ["crowdAdvantage", "deedPrompt", "dialogToggles"];

export class RulesConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-rules`,
    classes: ["champion-legend-app", "champion-rules-app"],
    tag: "form",
    window: { title: "CHAMPION.Params.Title", icon: "fa-solid fa-gears", resizable: true },
    position: { width: 720, height: 760 },
    form: { handler: RulesConfig.#onSubmit, submitOnChange: false, closeOnSubmit: true },
    actions: { resetDefaults: RulesConfig.#onReset }
  };

  static PARTS = {
    form: { template: `${TEMPLATE_ROOT}/rules-config.hbs`, scrollable: [".lg-rules-body"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const current = R.normalizeParams(game.settings.get(MODULE_ID, "rules"));
    context.groups = R.PARAM_GROUPS.map(group => ({
      id: group,
      label: t(`Params.Group.${group}`),
      fields: Object.entries(R.PARAM_SPEC).filter(([, spec]) => spec.group === group).map(([key, spec]) => ({
        key,
        value: current[key],
        min: spec.min,
        max: spec.max,
        defaultValue: spec.default,
        changed: current[key] !== spec.default,
        label: t(`Params.${key}.Name`),
        hint: t(`Params.${key}.Hint`)
      }))
    }));
    context.toggles = TOGGLES.map(key => ({ key, value: game.settings.get(MODULE_ID, key), label: t(`Settings.${key}Name`), hint: t(`Settings.${key}Hint`) }));
    return context;
  }

  static async #onSubmit(event, form, formData) {
    if (!game.user.isGM) return;
    const data = formData.object;
    const raw = {};
    for (const key of Object.keys(R.PARAM_SPEC)) raw[key] = data[key];
    await game.settings.set(MODULE_ID, "rules", R.normalizeParams(raw));
    for (const key of TOGGLES) await game.settings.set(MODULE_ID, key, !!data[key]);
    ui.notifications.info(t("Params.Saved"));
  }

  static async #onReset(event) {
    event.preventDefault();
    if (!game.user.isGM) return;
    await game.settings.set(MODULE_ID, "rules", R.defaultParams());
    this.render();
    ui.notifications.info(t("Params.ResetDone"));
  }
}
