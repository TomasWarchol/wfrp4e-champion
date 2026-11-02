/**
 * Formularze Legendy (DialogV2 na pergaminie).
 */

import { t, esc } from "./constants.mjs";
import * as R from "./rules.mjs";
import { dialogContent, CANCEL_BUTTON } from "../../wfrp4e-companion-lib/scripts/companion-lib.mjs";

const { DialogV2 } = foundry.applications.api;

/** Odczyt pól formularza: radio → zaznaczona wartość, checkbox → bool, number → liczba. */
function readForm(root) {
  const data = {};
  for (const el of root.querySelectorAll("input[name], select[name], textarea[name]")) {
    if (el.type === "radio") {
      if (el.checked) data[el.name] = el.value;
      else if (!(el.name in data)) data[el.name] = undefined;
    } else if (el.type === "checkbox") data[el.name] = el.checked;
    else if (el.type === "number") data[el.name] = el.value === "" ? null : Number(el.value);
    else data[el.name] = el.value;
  }
  return data;
}

/**
 * Okno formularza. Zwraca obiekt z wartościami albo null (anulowano).
 */
export async function formDialog({ title, icon = "fa-solid fa-feather", html, okLabel = t("Save"), okIcon = "fa-solid fa-check", width = 520 }) {
  const result = await DialogV2.wait({
    window: { title, icon },
    classes: ["lg-dialog"],
    position: { width },
    content: dialogContent(`<div class="lg-form">${html}</div>`),
    buttons: [
      {
        action: "ok",
        label: okLabel,
        icon: okIcon,
        default: true,
        callback: (event, button, dialog) => readForm(button.form ?? dialog.element)
      },
      CANCEL_BUTTON
    ],
    rejectClose: false
  });
  return result && typeof result === "object" ? result : null;
}

export async function confirm({ title, text, icon = "fa-solid fa-triangle-exclamation" }) {
  return DialogV2.confirm({
    window: { title, icon },
    classes: ["lg-dialog"],
    content: dialogContent(`<div class="lg-form"><p>${text}</p></div>`),
    rejectClose: false
  });
}

/* -------------------------------------------- */
/*  Klocki pól                                  */
/* -------------------------------------------- */

export const field = (label, inner, hint = "") =>
  `<div class="lg-field"><label>${esc(label)}</label>${inner}${hint ? `<div class="lg-hint">${hint}</div>` : ""}</div>`;

export const text = (name, value = "", placeholder = "") =>
  `<input type="text" name="${name}" value="${esc(value)}" placeholder="${esc(placeholder)}"/>`;

export const area = (name, value = "", placeholder = "") =>
  `<textarea name="${name}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;

export const number = (name, value = "", { min = "", max = "", placeholder = "" } = {}) =>
  `<input type="number" name="${name}" value="${value ?? ""}" min="${min}" max="${max}" placeholder="${esc(placeholder)}"/>`;

export const checkbox = (name, checked, label) =>
  `<label class="lg-check"><input type="checkbox" name="${name}" ${checked ? "checked" : ""}/> ${esc(label)}</label>`;

export function select(name, options, selected) {
  return `<select name="${name}">${options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(selected) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select>`;
}

/** Siatka wyboru (radio jako kafelki z ikonami). */
export function choices(name, options, selected, { columns = 3 } = {}) {
  return `<div class="lg-choice-grid" style="grid-template-columns:repeat(${columns},1fr)">${options.map(o => `
    <label class="lg-choice ${o.dark ? "is-dark" : ""}" ${o.hint ? `data-tooltip="${esc(o.hint)}"` : ""}>
      <input type="radio" name="${name}" value="${esc(o.value)}" ${String(o.value) === String(selected) ? "checked" : ""}/>
      <span>${o.icon ? `<i class="${o.icon}"></i>` : ""} ${esc(o.label)}</span>
    </label>`).join("")}</div>`;
}

export const faceChoices = (selected) => choices("face", R.FACES.map(face => ({
  value: face,
  label: t(`Face.${face}.Name`),
  icon: R.FACE_ICON[face],
  dark: R.FACE_TONE[face] === "dark",
  hint: t(`Face.${face}.Desc`)
})), selected);

export const circleChoices = (selected) => choices("circle", R.CIRCLES.map(c => ({
  value: c,
  label: t(`Circle.${c}`),
  icon: R.CIRCLE_ICON[c]
})), selected, { columns: 5 });

export const weightChoices = (name, selected, labelKey = "Weight") => choices(name, [1, 2, 3].map(w => ({
  value: w,
  label: `${"●".repeat(w)} ${t(`${labelKey}.${w}`)}`
})), selected);
