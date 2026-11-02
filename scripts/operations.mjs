/**
 * Legenda Szampierza – operacje gry: każda akcja z karty albo z czatu.
 * Zmienia stan (przez store), dopisuje kronikę i ogłasza wynik na czacie.
 */

import { MODULE_ID, t, contentLang } from "./constants.mjs";
import * as R from "./rules.mjs";
import { content, pick } from "./content.mjs";
import * as Store from "./store.mjs";
import { postCard } from "./chat.mjs";
import * as D from "./dialogs.mjs";
import { rollSkill, rollMelee, skillTarget, combatActor, modifyAdvantage, modifyWounds, healWounds, restoreResolveAndFortune, statusRank } from "./wfrp.mjs";
import { time } from "../../wfrp4e-companion-lib/scripts/companion-lib.mjs";

const C = () => content(contentLang());
const faceLabel = face => t(`Face.${face}.Name`);
const circleLabel = circle => t(`Circle.${circle}`);
const seals = w => Array.from({ length: R.MAX_WEIGHT }, (_, i) => i < w);

/* ==================================================================== */
/*  Imię i sesja                                                        */
/* ==================================================================== */

export async function declareName(actor) {
  const state = Store.getState(actor);
  const epithets = C().epithets;
  const suggestions = R.FACES.map(f => `<b>${t(`Face.${f}.Name`)}:</b> ${epithets[f].join(", ")}`).join("<br>");
  const data = await D.formDialog({
    title: t("Dialog.NameTitle"),
    icon: "fa-solid fa-sun",
    width: 600,
    html: [
      D.field(t("Dialog.Name"), D.text("declared", state.name.declared, epithets[state.name.face][0]), t("Dialog.NameHint")),
      D.field(t("Dialog.DeclaredFace"), D.faceChoices(state.name.face)),
      D.field(t("Dialog.Homeland"), D.text("homeland", state.homeland), t("Dialog.HomelandHint")),
      `<details class="lg-hint"><summary>${t("Dialog.EpithetIdeas")}</summary><p>${suggestions}</p></details>`
    ].join("")
  });
  if (!data) return;
  await Store.update(actor, s => {
    const changed = data.declared.trim() && data.declared.trim() !== s.name.declared;
    s.name = { declared: data.declared.trim(), face: data.face ?? s.name.face };
    s.homeland = data.homeland.trim();
    return changed ? Store.chronicle(s, "name", t("Chronicle.NameDeclared", { name: s.name.declared, face: faceLabel(s.name.face) }), "fa-solid fa-sun") : s;
  });
}

/** Wezwanie Imienia: raz na sesję Determinacja (+ Szczęście przy Imieniu przyjętym). */
export async function callName(actor) {
  const state = Store.getState(actor);
  const session = Store.sessionId();
  if (!R.canCallName(state, session)) return ui.notifications.warn(t("Notify.NameAlreadyCalled"));
  const status = R.nameStatus(state);
  const reward = R.nameCallReward(status);
  const gained = await restoreResolveAndFortune(actor, reward);
  await Store.update(actor, s => { s.nameCalledSession = session; return s; });
  const epithet = status.peopleFace === status.declaredFace && status.declared ? status.declared : C().epithets[status.peopleFace][0];
  await postCard({
    kind: "name",
    icon: "fa-solid fa-sun",
    kicker: t("Chat.NameKicker"),
    title: `„${epithet}”`,
    subtitle: status.accepted ? t("Name.State.accepted") : t("Chat.NameDrift", { face: faceLabel(status.peopleFace) }),
    lines: [
      { icon: "fa-solid fa-heart-pulse", text: t("Chat.ResolveGained", { n: gained.resolve }) },
      ...(reward.fortune ? [{ icon: "fa-solid fa-clover", text: t("Chat.FortuneGained", { n: gained.fortune }) }] : [])
    ],
    footnote: t("Chat.NameFoot")
  }, { actor });
}

export async function newSession() {
  if (!game.user.isGM) return;
  const next = (Number(Store.sessionId()) || 0) + 1;
  await game.settings.set(MODULE_ID, "session", next);
  ui.notifications.info(t("Notify.NewSession", { n: next }));
}

/* ==================================================================== */
/*  Opowieści                                                           */
/* ==================================================================== */

function taleForm(tale, { isNew }) {
  return [
    D.field(t("Dialog.TaleTitle"), D.text("title", tale.title, t("Dialog.TaleTitlePlaceholder"))),
    D.field(t("Dialog.TaleText"), D.area("text", tale.text, t("Dialog.TaleTextPlaceholder"))),
    D.field(t("Dialog.Face"), D.faceChoices(tale.face)),
    D.field(t("Dialog.Circle"), D.circleChoices(tale.circle)),
    D.field(t("Dialog.Weight"), D.weightChoices("weight", Math.max(1, tale.weight)), t("Dialog.WeightHint")),
    D.field(t("Dialog.Trophy"), D.text("trophy", tale.trophy, t("Dialog.TrophyPlaceholder"))),
    game.user.isGM ? D.checkbox("lie", tale.lie, t("Dialog.Lie")) : "",
    !isNew ? D.field(t("Dialog.Tavern"), D.area("tavern", tale.tavern)) : ""
  ].join("");
}

function readTale(data, base = {}) {
  return {
    ...base,
    title: (data.title ?? "").trim(),
    text: (data.text ?? "").trim(),
    face: data.face ?? base.face ?? "protector",
    circle: data.circle ?? base.circle ?? "commons",
    weight: Number(data.weight) || base.weight || 1,
    trophy: (data.trophy ?? "").trim(),
    lie: game.user.isGM ? !!data.lie : !!base.lie,
    tavern: data.tavern !== undefined ? data.tavern.trim() : (base.tavern ?? "")
  };
}

/** Okno nowej opowieści (opcjonalnie z gotowym szkicem). Zapisuje i ogłasza. */
export async function addTale(actor, draft = {}, { dialogTitle } = {}) {
  const base = R.normalizeTale({ weight: 1, ...draft });
  const data = await D.formDialog({ title: dialogTitle ?? t("Dialog.NewTale"), icon: "fa-solid fa-scroll", html: taleForm(base, { isNew: true }), okLabel: t("Dialog.Proclaim"), okIcon: "fa-solid fa-scroll", width: 620 });
  if (!data) return null;
  return commitTale(actor, readTale(data, { source: draft.source ?? "deed" }));
}

/** Zapisuje opowieść bez okna (np. zawiedziona prośba) i ogłasza na czacie. */
export async function commitTale(actor, raw, { announce = true } = {}) {
  let created = null;
  await Store.update(actor, s => {
    const res = R.addTale(s, raw, Store.worldNow());
    created = res.tale;
    const key = created.lie ? "Chronicle.Rumor" : "Chronicle.TaleBorn";
    return Store.chronicle(res.state, created.lie ? "rumor" : "tale", t(key, { title: created.title || t("Legend.Untitled"), face: faceLabel(created.face) }), created.lie ? "fa-solid fa-comment-slash" : "fa-solid fa-scroll");
  });
  if (created && announce) await announceTale(actor, created);
  return created;
}

async function announceTale(actor, tale) {
  const tone = R.taleTone(tale);
  await postCard({
    kind: "tale",
    theme: tale.lie ? "ink" : (tone === "dark" ? "blood" : "gold"),
    icon: tale.lie ? "fa-solid fa-comment-slash" : R.FACE_ICON[tale.face],
    kicker: tale.lie ? t("Chat.RumorKicker") : t("Chat.TaleKicker"),
    title: tale.title || t("Legend.Untitled"),
    subtitle: `${faceLabel(tale.face)} · ${circleLabel(tale.circle)}`,
    seals: seals(tale.weight),
    sealsLabel: `${t(`Weight.${tale.weight}`)} · ${t(`WeightReach.${tale.weight}`)}`,
    body: tale.text,
    lines: tale.trophy ? [{ icon: "fa-solid fa-trophy", text: tale.trophy }] : [],
    footnote: tale.lie ? t("Chat.RumorFoot") : "",
  }, { actor });
}

export async function editTale(actor, taleId) {
  const tale = Store.getState(actor).tales.find(x => x.id === taleId);
  if (!tale) return;
  const data = await D.formDialog({ title: t("Dialog.EditTale"), icon: "fa-solid fa-pen", html: [taleForm(tale, { isNew: false }), D.field(t("Dialog.WeightNow"), D.number("weightOverride", tale.weight, { min: 0, max: R.MAX_WEIGHT }), t("Dialog.WeightNowHint"))].join(""), width: 620 });
  if (!data) return;
  await Store.update(actor, s => {
    const i = s.tales.findIndex(x => x.id === taleId);
    if (i < 0) return null;
    const next = readTale(data, s.tales[i]);
    if (data.weightOverride !== null && data.weightOverride !== undefined && Number(data.weightOverride) !== s.tales[i].weight) {
      next.weight = R.clamp(Number(data.weightOverride), 0, R.MAX_WEIGHT);
    }
    s.tales[i] = R.normalizeTale(next);
    return s;
  });
}

export async function deleteTale(actor, taleId) {
  const tale = Store.getState(actor).tales.find(x => x.id === taleId);
  if (!tale) return;
  const ok = await D.confirm({ title: t("Dialog.DeleteTitle"), text: t("Dialog.DeleteTale", { title: tale.title || t("Legend.Untitled") }) });
  if (!ok) return;
  await Store.update(actor, s => { s.tales = s.tales.filter(x => x.id !== taleId); return s; });
}

/** Przywołanie opowieści w teście społecznym: +1 PS za punkt Wagi, raz na sesję. */
export async function invokeTale(actor, taleId) {
  const state = Store.getState(actor);
  const tale = state.tales.find(x => x.id === taleId);
  const session = Store.sessionId();
  if (state.incognito) return ui.notifications.warn(t("Notify.Hooded"));
  if (!tale || !R.canInvoke(tale, session)) return ui.notifications.warn(t("Notify.AlreadyInvoked"));
  const bonus = R.invokeBonus(tale);
  const skills = R.invokeSkills(tale);
  const data = await D.formDialog({
    title: t("Dialog.InvokeTitle"),
    icon: "fa-solid fa-bullhorn",
    okLabel: t("Dialog.Invoke"),
    okIcon: "fa-solid fa-bullhorn",
    html: [
      `<p class="lg-hint">${t("Dialog.InvokeHint", { title: tale.title || t("Legend.Untitled"), bonus })}</p>`,
      D.field(t("Dialog.InvokeSkill"), D.choices("skill", [...skills.map(s => ({ value: s, label: t(`Skill.${s}`), icon: "fa-solid fa-dice-d20" })), { value: "none", label: t("Dialog.InvokeNoRoll"), icon: "fa-solid fa-comment" }], skills[0], { columns: Math.min(4, skills.length + 1) })),
      D.field(t("Dialog.InvokeWho"), D.text("who", "", t("Dialog.InvokeWhoPlaceholder")))
    ].join("")
  });
  if (!data) return;
  await Store.update(actor, s => {
    const tl = s.tales.find(x => x.id === taleId);
    if (tl) tl.invokedSession = session;
    return Store.chronicle(s, "invoke", t("Chronicle.Invoked", { title: tale.title || t("Legend.Untitled"), who: data.who || "—" }), "fa-solid fa-bullhorn");
  });
  await postCard({
    kind: "invoke",
    theme: R.taleTone(tale) === "dark" ? "blood" : "gold",
    icon: "fa-solid fa-bullhorn",
    kicker: t("Chat.InvokeKicker"),
    title: t("Chat.InvokeTitle", { title: tale.title || t("Legend.Untitled") }),
    subtitle: data.who ? t("Chat.InvokeWho", { who: data.who }) : "",
    seals: seals(tale.weight),
    sealsLabel: `+${bonus} ${t("SL")}`,
    body: data.skill !== "none" ? t("Chat.InvokeBody", { skill: t(`Skill.${data.skill}`), bonus }) : t("Chat.InvokeNoRoll", { bonus })
  }, { actor });
  if (data.skill && data.skill !== "none") await rollSkill(actor, data.skill, { title: tale.title, slBonus: bonus });
}

/** Zdementowanie kłamstwa: Plotkowanie −10 za punkt Wagi. */
export async function refuteTale(actor, taleId) {
  const tale = Store.getState(actor).tales.find(x => x.id === taleId);
  if (!tale?.lie) return;
  const result = await rollSkill(actor, "Gossip", { title: t("Legend.Refute"), modifier: R.refuteModifier(tale) });
  if (!result) return;
  if (result.success) {
    await Store.update(actor, s => {
      s.tales = s.tales.filter(x => x.id !== taleId);
      return Store.chronicle(s, "refute", t("Chronicle.Refuted", { title: tale.title }), "fa-solid fa-comment-slash");
    });
  }
  await postCard({
    kind: "refute",
    theme: result.success ? "gold" : "ink",
    icon: "fa-solid fa-comment-slash",
    kicker: t("Legend.Refute"),
    title: tale.title,
    body: result.success ? t("Chat.RefuteSuccess") : t("Chat.RefuteFailure")
  }, { actor });
}

/**
 * Przywołanie z okna testu WFRP (przełącznik efektu „Legenda szampierza”): oznacza opowieść
 * jako przywołaną w tej sesji i ogłasza to na czacie. Woła to skrypt efektu po wysłaniu testu.
 */
export async function markInvoked(actorUuid, taleId) {
  const actor = actorUuid ? fromUuidSync(actorUuid) : null;
  if (!actor?.isOwner) return;
  const state = Store.getState(actor);
  const tale = state.tales.find(x => x.id === taleId);
  const session = Store.sessionId();
  if (!tale || !R.canInvoke(tale, session, state.incognito)) return;
  await Store.update(actor, s => {
    const tl = s.tales.find(x => x.id === taleId);
    if (tl) tl.invokedSession = session;
    return Store.chronicle(s, "invoke", t("Chronicle.InvokedTest", { title: tale.title || t("Legend.Untitled") }), "fa-solid fa-bullhorn");
  });
  await postCard({
    kind: "invoke",
    theme: R.taleTone(tale) === "dark" ? "blood" : "gold",
    icon: "fa-solid fa-bullhorn",
    kicker: t("Chat.InvokeKicker"),
    title: t("Chat.InvokeTitle", { title: tale.title || t("Legend.Untitled") }),
    seals: seals(tale.weight),
    sealsLabel: `+${R.invokeBonus(tale)} ${t("SL")}`
  }, { actor });
}

/* ==================================================================== */
/*  Czyny: zapis w trakcie gry, ogłoszenie po scenie                    */
/* ==================================================================== */

/** Szybki zapis czynu: jedna linijka, decyzje później. */
export async function recordDeed(actor, preset = "") {
  const data = await D.formDialog({
    title: t("Dialog.DeedTitle"),
    icon: "fa-solid fa-feather",
    okLabel: t("Dialog.DeedSave"),
    okIcon: "fa-solid fa-feather",
    width: 460,
    html: D.field(t("Dialog.DeedText"), D.text("text", preset, t("Dialog.DeedPlaceholder")), t("Dialog.DeedHint"))
  });
  if (!data?.text?.trim()) return;
  await Store.update(actor, s => R.addDeed(s, { text: data.text.trim(), source: "manual" }, Store.worldNow()).state);
  ui.notifications.info(t("Notify.DeedSaved"));
}

/** Czyn zapisany automatycznie (bez okna), np. odmowa przyjęcia wyzwania. */
export async function autoDeed(actor, text, source) {
  await Store.update(actor, s => R.addDeed(s, { text, source }, Store.worldNow()).state);
}

/** Ogłoszenie czynu: „Kto to widział?” decyduje o Wadze; bez świadków zostaje tylko kronika. */
export async function promoteDeed(actor, deedId) {
  const deed = Store.getState(actor).deeds.find(d => d.id === deedId);
  if (!deed) return;
  const data = await D.formDialog({
    title: t("Dialog.WitnessTitle"),
    icon: "fa-solid fa-eye",
    okLabel: t("Dialog.Proclaim"),
    okIcon: "fa-solid fa-scroll",
    width: 640,
    html: [
      `<p class="lg-hint">„${foundry.utils?.escapeHTML ? foundry.utils.escapeHTML(deed.text) : Handlebars.escapeExpression(deed.text)}”</p>`,
      D.field(t("Dialog.Witnesses"), D.choices("witness", R.WITNESSES.map(w => ({ value: w, label: t(`Witness.${w}`), icon: ["fa-solid fa-eye-slash", "fa-solid fa-user-group", "fa-solid fa-people-group", "fa-solid fa-landmark-dome"][R.WITNESSES.indexOf(w)] })), "few", { columns: 4 }), t("Dialog.WitnessHint")),
      D.field(t("Dialog.WitnessCircle"), D.circleChoices("commons")),
      D.field(t("Dialog.Face"), D.faceChoices("protector")),
      D.field(t("Dialog.TaleTitle"), D.text("title", deed.text.slice(0, 60), t("Dialog.TaleTitlePlaceholder")))
    ].join("")
  });
  if (!data) return;
  const weight = R.witnessWeight(data.witness ?? "few");
  await Store.update(actor, s => R.removeDeed(s, deedId));
  if (weight < 1) {
    await Store.update(actor, s => Store.chronicle(s, "deed", t("Chronicle.SecretDeed", { text: deed.text }), "fa-solid fa-eye-slash"));
    return ui.notifications.info(t("Notify.SecretDeed"));
  }
  await commitTale(actor, { title: (data.title ?? "").trim() || deed.text, text: deed.text, face: data.face ?? "protector", circle: data.circle ?? "commons", weight, source: deed.source });
}

export async function dismissDeed(actor, deedId) {
  await Store.update(actor, s => R.removeDeed(s, deedId));
}

/** Koniec walki z udziałem szampierza: szept do gracza i MG „Coś godnego opowieści?”. */
export async function combatEndPrompt(combat) {
  for (const c of combat.combatants ?? []) {
    const actor = c.actor?.isToken ? game.actors.get(c.actorId) : c.actor;
    if (!actor?.getFlag?.(MODULE_ID, "legend") || actor.getFlag(MODULE_ID, "legend")?.fallen) continue;
    const owners = game.users.filter(u => u.isGM || actor.testUserPermission?.(u, "OWNER")).map(u => u.id);
    const content = await foundry.applications.handlebars.renderTemplate(`modules/${MODULE_ID}/templates/chat/card.hbs`, {
      kind: "deedPrompt",
      theme: "gold",
      icon: "fa-solid fa-feather",
      kicker: t("Chat.DeedPromptKicker"),
      title: t("Chat.DeedPromptTitle", { name: actor.name }),
      footnote: t("Chat.DeedPromptFoot"),
      buttons: [{ action: "recordDeed", label: t("Chat.DeedPromptButton"), icon: "fa-solid fa-feather", style: "gold", dataAttrs: `data-actor-uuid="${actor.uuid}"` }]
    });
    await ChatMessage.create({ content, whisper: owners, speaker: ChatMessage.getSpeaker({ actor }), flags: { [MODULE_ID]: { kind: "deedPrompt" } } });
  }
}

/* ==================================================================== */
/*  Rozpoznanie i kaptur                                                */
/* ==================================================================== */

/** MG: czy obcy rozpoznaje szampierza? k10 ≤ 2 × Poziom (w kapturze nikt). */
export async function recognize(actor) {
  if (!game.user.isGM) return;
  const state = Store.getState(actor);
  const tier = R.tierOf(R.fame(state));
  const target = R.recognitionTarget(tier);
  if (state.incognito) {
    return postCard({ kind: "recognize", theme: "ink", icon: "fa-solid fa-user-secret", kicker: t("Chat.RecognizeKicker"), title: t("Chat.RecognizeHooded"), body: t("Chat.RecognizeHoodedBody", { name: actor.name }) }, { actor, gmOnly: true });
  }
  const roll = await new Roll("1d10").evaluate();
  const known = roll.total <= target;
  await postCard({
    kind: "recognize",
    theme: known ? "gold" : "ink",
    icon: known ? "fa-solid fa-eye" : "fa-solid fa-eye-slash",
    kicker: t("Chat.RecognizeRoll", { roll: roll.total, target }),
    title: known ? t("Chat.Recognized") : t("Chat.NotRecognized"),
    body: known ? t("Chat.RecognizedBody", { name: state.name.declared || actor.name }) : t("Chat.NotRecognizedBody")
  }, { actor, gmOnly: true, rolls: [roll] });
}

export async function toggleHood(actor) {
  let hooded = false;
  await Store.update(actor, s => {
    s.incognito = !s.incognito;
    hooded = s.incognito;
    return s;
  });
  ui.notifications.info(t(hooded ? "Notify.HoodOn" : "Notify.HoodOff"));
}

/* ==================================================================== */
/*  Prośby                                                              */
/* ==================================================================== */

function petitionForm(p) {
  const days = p.deadline !== null && p.deadline !== undefined ? Math.max(0, R.daysLeft(p, Store.worldNow(), time.secondsPerDay())) : "";
  return [
    D.field(t("Dialog.Petitioner"), D.text("petitioner", p.petitioner)),
    D.field(t("Dialog.Request"), D.area("request", p.request, t("Dialog.RequestPlaceholder"))),
    D.field(t("Dialog.Circle"), D.circleChoices(p.circle)),
    D.field(t("Dialog.Stake"), D.weightChoices("stake", p.stake, "Petitions.Stake"), t("Dialog.StakeHint")),
    `<div class="lg-field-row">${D.field(t("Dialog.Deadline"), D.number("deadlineDays", days, { min: 0, placeholder: t("Petitions.NoDeadline") }))}${D.field(t("Dialog.Reward"), D.text("reward", p.reward))}</div>`
  ].join("");
}

function readPetition(data, base) {
  const days = data.deadlineDays;
  return {
    ...base,
    petitioner: data.petitioner.trim() || t("Dialog.Anonymous"),
    request: data.request.trim(),
    circle: data.circle ?? base.circle,
    stake: Number(data.stake) || base.stake || 1,
    reward: data.reward.trim(),
    deadline: days === null || days === undefined || days === "" ? null : time.addDays(Store.worldNow(), Number(days))
  };
}

export async function addPetition(actor, preset = {}) {
  const base = R.normalizePetition(preset);
  const data = await D.formDialog({ title: t("Dialog.NewPetition"), icon: "fa-solid fa-hands-praying", html: petitionForm(base), width: 620 });
  if (!data) return;
  await Store.update(actor, s => {
    const res = R.addPetition(s, readPetition(data, base), Store.worldNow());
    return Store.chronicle(res.state, "petition", t("Chronicle.PetitionNew", { who: res.petition.petitioner }), "fa-solid fa-hands-praying");
  });
}

export async function editPetition(actor, petitionId) {
  const p = Store.getState(actor).petitions.find(x => x.id === petitionId);
  if (!p) return;
  const data = await D.formDialog({ title: t("Dialog.EditPetition"), icon: "fa-solid fa-pen", html: petitionForm(p), width: 620 });
  if (!data) return;
  await Store.update(actor, s => {
    const i = s.petitions.findIndex(x => x.id === petitionId);
    if (i < 0) return null;
    s.petitions[i] = R.normalizePetition(readPetition(data, s.petitions[i]));
    return s;
  });
}

export async function deletePetition(actor, petitionId) {
  const ok = await D.confirm({ title: t("Dialog.DeleteTitle"), text: t("Dialog.DeletePetition") });
  if (!ok) return;
  await Store.update(actor, s => { s.petitions = s.petitions.filter(x => x.id !== petitionId); return s; });
}

/**
 * Drobna prośba załatwiona w tle (przedsięwzięcie między przygodami): jeden test,
 * sukces = opowieść (Waga 1), porażka = „nie dotrzymał słowa”.
 */
export async function endeavourPetition(actor, petitionId) {
  const p = Store.getState(actor).petitions.find(x => x.id === petitionId);
  if (!p || !R.canEndeavour(p)) return;
  const skills = ["Charm", "Intimidate", "Gossip", "Leadership", "Melee", "Perception", "Haggle"];
  const data = await D.formDialog({
    title: t("Dialog.EndeavourTitle"),
    icon: "fa-solid fa-hourglass-half",
    okLabel: t("Arena.Roll"),
    okIcon: "fa-solid fa-dice-d20",
    html: [
      `<p class="lg-hint">${t("Dialog.EndeavourHint", { who: p.petitioner })}</p>`,
      D.field(t("Dialog.EndeavourSkill"), D.choices("skill", skills.map(k => ({ value: k, label: t(`Skill.${k}`) })), "Charm", { columns: 4 }))
    ].join("")
  });
  if (!data?.skill) return;
  const result = data.skill === "Melee" ? await rollMelee(actor, { title: p.petitioner }) : await rollSkill(actor, data.skill, { title: p.petitioner });
  if (!result) return;
  await Store.update(actor, s => {
    const pp = s.petitions.find(x => x.id === petitionId);
    if (!pp) return null;
    pp.status = result.success ? "fulfilled" : "failed";
    pp.resolved = Store.worldNow();
    return Store.chronicle(s, result.success ? "petition" : "failed", t(result.success ? "Chronicle.PetitionFulfilled" : "Chronicle.Petition_fail", { who: p.petitioner }), result.success ? "fa-solid fa-check" : "fa-solid fa-heart-crack");
  });
  await commitTale(actor, result.success
    ? { title: t("Petitions.FulfilledTitle", { who: p.petitioner }), text: p.request, face: "protector", circle: p.circle, weight: 1, source: "petition" }
    : { title: t("Petitions.BrokenTitle", { who: p.petitioner }), text: p.request, face: "rogue", circle: p.circle, weight: 1, source: "brokenPromise" });
}

/** accept | fulfill | fail | decline */
export async function petitionAction(actor, petitionId, op) {
  const before = Store.getState(actor);
  const p = before.petitions.find(x => x.id === petitionId);
  if (!p) return;

  if (op === "fulfill") {
    // Szkic opowieści w oknie: gracz nazywa czyn i wybiera oblicze
    const res = R.resolvePetition(before, petitionId, "fulfill", { ts: Store.worldNow() });
    const tale = await addTale(actor, { ...res.effect.taleDraft, title: t("Petitions.FulfilledTitle", { who: p.petitioner }) }, { dialogTitle: t("Dialog.FulfillTitle") });
    if (!tale) return;
    await Store.update(actor, s => {
      const pp = s.petitions.find(x => x.id === petitionId);
      if (pp) { pp.status = "fulfilled"; pp.resolved = Store.worldNow(); }
      return Store.chronicle(s, "petition", t("Chronicle.PetitionFulfilled", { who: p.petitioner }), "fa-solid fa-check");
    });
    return;
  }

  if (op === "decline") {
    const ok = p.stake < 2 || await D.confirm({ title: t("Petitions.Decline"), text: t("Dialog.DeclineWarn") });
    if (!ok) return;
  }

  let effect = null;
  await Store.update(actor, s => {
    const res = R.resolvePetition(s, petitionId, op, { ts: Store.worldNow() });
    effect = res.effect;
    if (effect.type === "tooMany") return null;
    const icon = { accept: "fa-solid fa-handshake", fail: "fa-solid fa-heart-crack", decline: "fa-solid fa-hand" }[op];
    return Store.chronicle(res.state, op === "fail" ? "failed" : "petition", t(`Chronicle.Petition_${op}`, { who: p.petitioner }), icon);
  });
  if (!effect) return;
  if (effect.type === "tooMany") return ui.notifications.warn(t("Petitions.TooMany"));

  if (op === "accept") {
    await postCard({
      kind: "promise",
      icon: "fa-solid fa-handshake",
      kicker: t("Chat.PromiseKicker"),
      title: p.petitioner,
      subtitle: circleLabel(p.circle),
      seals: seals(p.stake),
      sealsLabel: t(`Petitions.Stake.${p.stake}`),
      body: p.request,
      footnote: t("Chat.PromiseFoot")
    }, { actor });
  } else if (op === "fail") {
    await commitTale(actor, { ...effect.taleDraft, title: t("Petitions.BrokenTitle", { who: p.petitioner }) });
  } else if (op === "decline" && effect.dimmed) {
    await postCard({
      kind: "dim",
      theme: "ink",
      icon: "fa-solid fa-wind",
      kicker: t("Chat.DimKicker"),
      title: effect.dimmed.title || t("Legend.Untitled"),
      body: t("Chat.DimDecline", { who: p.petitioner, circle: circleLabel(p.circle) })
    }, { actor });
  }
}

/* ==================================================================== */
/*  Rywale                                                              */
/* ==================================================================== */

function rivalForm(r) {
  return [
    `<div class="lg-field-row">${D.field(t("Dialog.RivalName"), D.text("name", r.name))}${D.field(t("Dialog.RivalTitle"), D.text("title", r.title))}</div>`,
    `<div class="lg-field-row">${D.field(t("Dialog.Grudge"), D.select("grudge", [0, 1, 2, 3].map(g => ({ value: g, label: t(`Rivals.Grudge.${g}`) })), r.grudge))}${D.field(t("Dialog.RivalStatus"), D.select("status", R.RIVAL_STATUS.map(st => ({ value: st, label: t(`Rivals.Status.${st}`) })), r.status))}</div>`,
    D.checkbox("higherStatus", r.higherStatus, t("Dialog.HigherStatus")),
    D.field(t("Dialog.Notes"), D.area("notes", r.notes))
  ].join("");
}

function readRival(data, base) {
  return { ...base, name: data.name.trim() || t("Arena.UnknownRival"), title: data.title.trim(), grudge: Number(data.grudge) || 0, status: data.status, higherStatus: !!data.higherStatus, notes: data.notes.trim() };
}

export async function addRival(actor, preset = {}) {
  const base = R.normalizeRival(preset);
  const data = await D.formDialog({ title: t("Dialog.NewRival"), icon: "fa-solid fa-chess-knight", html: rivalForm(base) });
  if (!data) return null;
  let rival = null;
  await Store.update(actor, s => {
    const res = R.addRival(s, readRival(data, base));
    rival = res.rival;
    return Store.chronicle(res.state, "rival", t("Chronicle.RivalNew", { name: rival.name }), "fa-solid fa-chess-knight");
  });
  return rival;
}

/** Rywal z przeciągniętego aktora (bez okna). Zwraca istniejącego, gdy już jest na liście. */
export async function rivalFromActor(champion, dropped) {
  const existing = Store.getState(champion).rivals.find(r => r.actorUuid === dropped.uuid);
  if (existing) return existing;
  let rival = null;
  await Store.update(champion, s => {
    const res = R.addRival(s, {
      name: dropped.name,
      img: dropped.img,
      actorUuid: dropped.uuid,
      title: dropped.system?.details?.career?.value ?? "",
      higherStatus: statusRank(dropped) > statusRank(champion)
    });
    rival = res.rival;
    return Store.chronicle(res.state, "rival", t("Chronicle.RivalNew", { name: rival.name }), "fa-solid fa-chess-knight");
  });
  return rival;
}

export async function editRival(actor, rivalId) {
  const r = Store.getState(actor).rivals.find(x => x.id === rivalId);
  if (!r) return;
  const data = await D.formDialog({ title: t("Dialog.EditRival"), icon: "fa-solid fa-pen", html: rivalForm(r) });
  if (!data) return;
  await Store.update(actor, s => {
    const i = s.rivals.findIndex(x => x.id === rivalId);
    if (i < 0) return null;
    s.rivals[i] = R.normalizeRival(readRival(data, s.rivals[i]));
    return s;
  });
}

export async function deleteRival(actor, rivalId) {
  const ok = await D.confirm({ title: t("Dialog.DeleteTitle"), text: t("Dialog.DeleteRival") });
  if (!ok) return;
  await Store.update(actor, s => {
    s.rivals = s.rivals.filter(x => x.id !== rivalId);
    if (s.duel?.rivalId === rivalId) s.duel = null;
    return s;
  });
}

export async function shiftGrudge(actor, rivalId, delta) {
  await Store.update(actor, s => {
    const r = s.rivals.find(x => x.id === rivalId);
    if (!r) return null;
    r.grudge = R.clamp(r.grudge + delta, 0, R.MAX_GRUDGE);
    return s;
  });
}

/* ==================================================================== */
/*  Arena                                                               */
/* ==================================================================== */

function duelForm(state, duel) {
  const rivals = state.rivals.filter(r => r.status !== "dead");
  const rivalOptions = [{ value: "", label: t("Dialog.NewRivalOption") }, ...rivals.map(r => ({ value: r.id, label: r.name }))];
  return [
    `<div class="lg-field-row">${D.field(t("Dialog.Rival"), D.select("rivalId", rivalOptions, duel.rivalId))}${D.field(t("Dialog.NewRivalName"), D.text("newRival", "", t("Dialog.NewRivalPlaceholder")))}</div>`,
    D.field(t("Dialog.Terms"), D.choices("terms", R.DUEL_TERMS.map(x => ({ value: x, label: t(`Arena.Terms.${x}`), icon: { firstBlood: "fa-solid fa-droplet", yield: "fa-solid fa-flag", death: "fa-solid fa-skull" }[x], dark: x === "death" })), duel.terms)),
    D.field(t("Dialog.Audience"), D.choices("audience", R.AUDIENCE.map(a => ({ value: a, label: t(`Arena.Audience.${a}`), icon: ["fa-solid fa-user-group", "fa-solid fa-people-group", "fa-solid fa-landmark-dome"][a - 1] })), duel.audience), t("Dialog.AudienceHint")),
    D.field(t("Arena.Venue"), D.text("venue", duel.venue, t("Dialog.VenuePlaceholder"))),
    D.field(t("Arena.Stakes"), D.text("stakes", duel.stakes, t("Dialog.StakesPlaceholder"))),
    `<div class="lg-field-row">${D.field(t("Arena.Wager"), D.text("wager", duel.wager, t("Dialog.WagerPlaceholder")))}${D.field(t("Dialog.RivalSkill"), D.number("rivalSkill", duel.rivalSkill, { min: 1, max: 150 }), t("Dialog.RivalSkillHint"))}${game.user.isGM ? D.field(t("Arena.RivalEdges"), D.number("rivalEdges", duel.rivalEdges, { min: 0, max: R.MAX_RIVAL_EDGES })) : ""}</div>`
  ].join("");
}

/** Nowy pojedynek (albo edycja bieżącego). */
export async function setupDuel(actor, { rivalId = "", edit = false } = {}) {
  const state = Store.getState(actor);
  if (!edit && state.duel) return ui.notifications.warn(t("Notify.DuelActive"));
  const preRival = state.rivals.find(r => r.id === rivalId);
  const rivalActor = preRival?.actorUuid ? fromUuidSync(preRival.actorUuid) : null;
  const base = edit && state.duel ? state.duel : R.normalizeDuel({ rivalId, terms: "firstBlood", audience: 2, rivalSkill: rivalActor ? skillTarget(rivalActor, "Melee") : 45 });
  const data = await D.formDialog({ title: edit ? t("Dialog.EditDuel") : t("Dialog.NewDuel"), icon: "fa-solid fa-hand-back-fist", html: duelForm(state, base), okLabel: edit ? t("Save") : t("Dialog.Challenge"), okIcon: "fa-solid fa-hand-back-fist", width: 640 });
  if (!data) return;

  let chosenRival = data.rivalId;
  if (!chosenRival) {
    const name = data.newRival.trim();
    if (!name) return ui.notifications.warn(t("Notify.NeedRival"));
    await Store.update(actor, s => {
      const res = R.addRival(s, { name });
      chosenRival = res.rival.id;
      return Store.chronicle(res.state, "rival", t("Chronicle.RivalNew", { name }), "fa-solid fa-chess-knight");
    });
  }

  const fields = {
    rivalId: chosenRival,
    terms: data.terms ?? base.terms,
    audience: Number(data.audience) || base.audience,
    venue: data.venue.trim(),
    stakes: data.stakes.trim(),
    wager: data.wager.trim(),
    rivalSkill: Number(data.rivalSkill) || base.rivalSkill,
    rivalEdges: game.user.isGM ? (Number(data.rivalEdges) || 0) : base.rivalEdges
  };
  await Store.update(actor, s => {
    if (edit && s.duel) {
      s.duel = R.normalizeDuel({ ...s.duel, ...fields });
      return s;
    }
    const next = R.startDuel(s, fields, Store.worldNow());
    const rival = next.rivals.find(r => r.id === fields.rivalId);
    return Store.chronicle(next, "duel", t("Chronicle.DuelChallenge", { rival: rival?.name ?? "?" }), "fa-solid fa-hand-back-fist");
  });
  if (!edit) await postChallenge(actor);
}

export async function postChallenge(actor) {
  const state = Store.getState(actor);
  const d = state.duel;
  if (!d) return;
  const rival = state.rivals.find(r => r.id === d.rivalId);
  await postCard({
    kind: "challenge",
    theme: "blood",
    versus: { left: actor.img, right: rival?.img || "icons/svg/mystery-man.svg" },
    kicker: t("Chat.ChallengeKicker"),
    title: t("Chat.ChallengeTitle", { champion: actor.name, rival: rival?.name ?? "?" }),
    chips: [
      { icon: "fa-solid fa-droplet", label: t(`Arena.Terms.${d.terms}`) },
      { icon: "fa-solid fa-people-group", label: t(`Arena.Audience.${d.audience}`) }
    ],
    body: d.stakes ? `${t("Arena.Stakes")}: ${d.stakes}` : "",
    lines: [
      ...(d.venue ? [{ icon: "fa-solid fa-location-dot", text: d.venue }] : []),
      ...(d.wager ? [{ icon: "fa-solid fa-coins", text: `${t("Arena.Wager")}: ${d.wager}` }] : [])
    ],
    footnote: t("Chat.ChallengeFoot")
  }, { actor });
}

export async function cancelDuel(actor) {
  const ok = await D.confirm({ title: t("Arena.Cancel"), text: t("Dialog.CancelDuel") });
  if (!ok) return;
  await Store.update(actor, s => {
    s.duel = null;
    return Store.chronicle(s, "duel", t("Chronicle.DuelCancelled"), "fa-solid fa-ban");
  });
}

export async function duelStage(actor, dir) {
  await Store.update(actor, s => {
    if (!s.duel) return null;
    const i = R.DUEL_STAGES.indexOf(s.duel.stage) + dir;
    if (i < 0 || i >= R.DUEL_STAGES.length) return null;
    s.duel.stage = R.DUEL_STAGES[i];
    // Wejście do walki: połącz z bieżącą walką, jeśli bierze w niej udział szampierz
    if (s.duel.stage === "fight" && !s.duel.combatId && game.combat?.combatants?.some(c => c.actorId === actor.id)) {
      s.duel.combatId = game.combat.id;
    }
    return s;
  });
}

export async function shiftRivalEdges(actor, delta) {
  if (!game.user.isGM) return;
  await Store.update(actor, s => {
    if (!s.duel) return null;
    s.duel.rivalEdges = R.clamp(s.duel.rivalEdges + delta, 0, R.MAX_RIVAL_EDGES);
    s.duel.negatedEdges = Math.min(s.duel.negatedEdges, s.duel.rivalEdges);
    return s;
  });
}

/** Przygotowanie (najwyżej dwa): test szampierza i skutek. */
export async function doPrep(actor, id) {
  const d = Store.getState(actor).duel;
  if (!d) return;
  if (!R.canPrep(d, id)) return ui.notifications.warn(t("Notify.PrepLimit", { max: R.MAX_PREPS }));
  const cfg = R.PREPS[id];
  const result = await rollSkill(actor, cfg.skill, { title: t(`Arena.Prep.${id}.Name`) });
  if (!result) return;
  let duel = null;
  await Store.update(actor, s => {
    if (!s.duel) return null;
    s.duel = R.applyPrep(s.duel, id, result);
    duel = s.duel;
    return s;
  });
  await postCard({
    kind: "prep",
    theme: result.success ? "gold" : "ink",
    icon: cfg.icon,
    kicker: t("Chat.PrepKicker"),
    title: t(`Arena.Prep.${id}.Name`),
    body: t(`Arena.Prep.${id}.${result.success ? "Success" : "Failure"}`, { edges: duel.edges.filter(e => e.kind === "weakness" && !e.used).length, crowd: duel.crowd, odds: duel.odds, negated: duel.negatedEdges, heal: duel.surgeonHeal })
  }, { actor });
}

export async function undoPrep(actor, id) {
  await Store.update(actor, s => {
    if (!s.duel) return null;
    s.duel = R.resetPrep(s.duel, id);
    return s;
  });
}

export async function setDuelMode(actor, mode) {
  await Store.update(actor, s => {
    if (!s.duel) return null;
    s.duel.mode = mode === "full" ? "full" : "quick";
    return s;
  });
}

/**
 * Wymiana w szybkim pojedynku: szampierz rzuca Walkę Wręcz w oknie WFRP (z premiami podejścia,
 * tłumu i Atutu), moduł rzuca za rywala. Trafienie w szampierza zdejmuje Żywotność.
 */
export async function exchange(actor, approach, { useEdge = false } = {}) {
  const state = Store.getState(actor);
  const d = state.duel;
  if (!d || d.stage !== "fight") return;
  if (!R.APPROACHES.includes(approach)) return ui.notifications.warn(t("Notify.PickApproach"));
  const rival = state.rivals.find(r => r.id === d.rivalId);
  const edge = useEdge ? d.edges.find(e => !e.used) : null;

  const d3 = await new Roll("1d3").evaluate();
  const rivalApproach = R.rivalApproachFor(d3.total);
  const champMod = R.approachBonus(approach, rivalApproach) + R.crowdBonus("champion", d.crowd);
  const champ = await rollMelee(actor, { title: t("Arena.ExchangeTitle", { n: d.exchanges.length + 1 }), modifier: champMod, slBonus: edge ? 2 : 0 });
  if (!champ) return;

  const rivalTarget = d.rivalSkill + R.approachBonus(rivalApproach, approach) + R.crowdBonus("rival", d.crowd);
  const rivalRoll = await new Roll("1d100").evaluate();
  const rivalRes = R.testResult(rivalTarget, rivalRoll.total);

  let res = null;
  await Store.update(actor, s => {
    if (!s.duel) return null;
    if (edge) { const e = s.duel.edges.find(x => x.id === edge.id); if (e) e.used = true; }
    res = R.resolveExchange(s.duel, { champApproach: approach, rivalApproach, champ, rival: rivalRes });
    s.duel = res.duel;
    return s;
  });
  if (!res) return;
  const x = res.exchange;
  const wounded = x.wounds ? await modifyWounds(combatActor(actor), -x.wounds) : 0;

  const rivalName = rival?.name ?? "?";
  const lines = [
    { icon: R.APPROACH_ICON[approach], text: t("Chat.ExchangeChamp", { name: actor.name, approach: t(`Arena.Approach.${approach}.Name`), sl: fmtSL(x.champSL) }) },
    { icon: R.APPROACH_ICON[rivalApproach], text: t("Chat.ExchangeRival", { name: rivalName, approach: t(`Arena.Approach.${rivalApproach}.Name`), sl: fmtSL(x.rivalSL), roll: rivalRoll.total, target: rivalTarget }) }
  ];
  if (x.rivalEdge) lines.push({ icon: "fa-solid fa-coins", text: t("Chat.RivalEdgeUsed") });
  if (wounded) lines.push({ icon: "fa-solid fa-droplet", text: t("Chat.ChampWounded", { n: -wounded }) });
  const title = x.winner === "champion" ? t(x.hits > 1 ? "Chat.ExchangeWinDouble" : "Chat.ExchangeWin", { name: actor.name })
    : x.winner === "rival" ? t(x.hits > 1 ? "Chat.ExchangeLossDouble" : "Chat.ExchangeLoss", { name: rivalName })
      : t("Chat.ExchangeClash");
  await postCard({
    kind: "exchange",
    theme: x.winner === "champion" ? "gold" : (x.winner === "rival" ? "blood" : "ink"),
    versus: { left: actor.img, right: rival?.img || "icons/svg/mystery-man.svg" },
    kicker: t("Chat.ExchangeKicker", { n: x.n, champ: res.duel.champScore, rival: res.duel.rivalScore, needed: R.hitsNeeded(res.duel) }),
    title,
    lines,
    footnote: res.finished ? t(`Chat.DuelOver_${res.finished}`) : (approach === "dirty" ? t("Chat.DirtyBody") : "")
  }, { actor, rolls: [rivalRoll] });
}

export async function yieldDuel(actor) {
  const ok = await D.confirm({ title: t("Arena.Yield"), text: t("Dialog.YieldConfirm") });
  if (!ok) return;
  await Store.update(actor, s => {
    if (!s.duel) return null;
    s.duel = R.yieldDuel(s.duel);
    return s;
  });
}

function fmtSL(sl) {
  return sl > 0 ? `+${sl}` : `${sl}`;
}

/* ---------- Wyzwanie przywódcy w zwykłej walce ---------- */

/**
 * Akcja w dowolnej walce: Zastraszanie albo Przywództwo szampierza przeciw Opanowaniu przywódcy wrogów.
 * Wygrana: przywódca przyjmuje (szybki pojedynek) albo odmawia (szampierz +1 Przewagi, czyn do ogłoszenia).
 */
export async function challengeLeader(actor) {
  const state = Store.getState(actor);
  if (state.duel) return ui.notifications.warn(t("Notify.DuelActive"));
  const target = [...(game.user.targets ?? [])][0]?.actor ?? null;
  const rivals = state.rivals.filter(r => r.status !== "dead");
  const data = await D.formDialog({
    title: t("Dialog.LeaderTitle"),
    icon: "fa-solid fa-hand-back-fist",
    okLabel: t("Dialog.LeaderRoll"),
    okIcon: "fa-solid fa-dice-d20",
    width: 560,
    html: [
      `<p class="lg-hint">${t("Dialog.LeaderHint")}</p>`,
      target
        ? `<p class="lg-hint"><b>${Handlebars.escapeExpression(target.name)}</b> (${t("Dialog.LeaderTargeted")})</p>`
        : `<div class="lg-field-row">${D.field(t("Dialog.Rival"), D.select("rivalId", [{ value: "", label: t("Dialog.LeaderNameOption") }, ...rivals.map(r => ({ value: r.id, label: r.name }))], ""))}${D.field(t("Dialog.LeaderName"), D.text("name", "", t("Dialog.LeaderNamePlaceholder")))}</div>`,
      `<div class="lg-field-row">${D.field(t("Dialog.LeaderCool"), D.number("cool", target ? skillTarget(target, "Cool") : 35, { min: 1, max: 150 }))}${D.field(t("Dialog.LeaderMelee"), D.number("melee", target ? skillTarget(target, "Melee") : 45, { min: 1, max: 150 }))}</div>`,
      D.field(t("Dialog.LeaderSkill"), D.choices("skill", ["Intimidate", "Leadership"].map(k => ({ value: k, label: t(`Skill.${k}`) })), "Intimidate", { columns: 2 }))
    ].join("")
  });
  if (!data) return;

  let leader;
  if (target) leader = { name: target.name, img: target.img, actorUuid: target.uuid };
  else if (data.rivalId) {
    const r = rivals.find(x => x.id === data.rivalId);
    leader = { name: r?.name ?? "?", img: r?.img ?? "", actorUuid: r?.actorUuid ?? "" };
  } else leader = { name: data.name?.trim() || t("Dialog.LeaderDefault"), img: "", actorUuid: "" };

  const champ = await rollSkill(actor, data.skill ?? "Intimidate", { title: t("Dialog.LeaderTitle") });
  if (!champ) return;
  const coolTarget = Number(data.cool) || 35;
  const leaderRoll = await new Roll("1d100").evaluate();
  const leaderRes = R.testResult(coolTarget, leaderRoll.total);
  const won = champ.sl > leaderRes.sl || (champ.sl === leaderRes.sl && champ.success && !leaderRes.success);

  if (won) {
    await Store.update(actor, s => {
      s.pendingChallenge = { ...leader, skill: Number(data.melee) || 45 };
      return s;
    });
  }
  await postCard({
    kind: "leader",
    theme: won ? "blood" : "ink",
    versus: { left: actor.img, right: leader.img || "icons/svg/mystery-man.svg" },
    kicker: t("Chat.LeaderKicker"),
    title: t(won ? "Chat.LeaderWon" : "Chat.LeaderLost", { name: leader.name }),
    lines: [
      { icon: "fa-solid fa-hand-back-fist", text: t("Chat.LeaderChamp", { name: actor.name, skill: t(`Skill.${data.skill ?? "Intimidate"}`), sl: fmtSL(champ.sl) }) },
      { icon: "fa-solid fa-shield-halved", text: t("Chat.LeaderCool", { name: leader.name, sl: fmtSL(leaderRes.sl), roll: leaderRoll.total, target: coolTarget }) }
    ],
    footnote: won ? t("Chat.LeaderChoice") : t("Chat.LeaderIgnored"),
    buttons: won ? [
      { action: "leaderAccept", label: t("Chat.LeaderAccept"), icon: "fa-solid fa-khanda", style: "blood", data: { actorUuid: actor.uuid } },
      { action: "leaderRefuse", label: t("Chat.LeaderRefuse"), icon: "fa-solid fa-person-running", style: "ghost-dark", data: { actorUuid: actor.uuid } }
    ] : []
  }, { actor, rolls: [leaderRoll] });
}

/** Odpowiedź przywódcy (klika MG albo gracz szampierza po decyzji MG). */
export async function answerChallenge(actor, accept) {
  const state = Store.getState(actor);
  const leader = state.pendingChallenge;
  if (!leader) return ui.notifications.warn(t("Notify.NoPendingChallenge"));
  if (!accept) {
    await Store.update(actor, s => { s.pendingChallenge = null; return s; });
    await modifyAdvantage(combatActor(actor), 1);
    await autoDeed(actor, t("Deeds.LeaderRefused", { name: leader.name }), "challenge");
    return postCard({ kind: "leaderRefused", icon: "fa-solid fa-person-running", kicker: t("Chat.LeaderKicker"), title: t("Chat.LeaderRefusedTitle", { name: leader.name }), body: t("Chat.LeaderRefusedBody", { name: actor.name }) }, { actor });
  }
  // Przyjęcie: rywal (istniejący albo nowy) i szybki pojedynek od razu w etapie walki
  let rivalId = state.rivals.find(r => (leader.actorUuid && r.actorUuid === leader.actorUuid) || r.name === leader.name)?.id;
  await Store.update(actor, s => {
    if (!rivalId) {
      const res = R.addRival(s, { name: leader.name, img: leader.img, actorUuid: leader.actorUuid });
      s = res.state;
      rivalId = res.rival.id;
    }
    s = R.startDuel(s, { rivalId, terms: "yield", audience: 2, venue: t("Arena.Battlefield"), stakes: t("Arena.LeaderStakes"), rivalSkill: leader.skill, stage: "fight" }, Store.worldNow());
    s.pendingChallenge = null;
    return Store.chronicle(s, "duel", t("Chronicle.LeaderAccepted", { name: leader.name }), "fa-solid fa-khanda");
  });
  await postCard({ kind: "leaderAccepted", theme: "blood", versus: { left: actor.img, right: leader.img || "icons/svg/mystery-man.svg" }, kicker: t("Chat.LeaderKicker"), title: t("Chat.LeaderAcceptedTitle", { name: leader.name }), body: t("Chat.LeaderAcceptedBody") }, { actor });
  game.champion?.openHud?.(actor);
}

export async function useEdge(actor, edgeId) {
  const state = Store.getState(actor);
  const edge = state.duel?.edges.find(e => e.id === edgeId);
  if (!edge || edge.used) return;
  await Store.update(actor, s => {
    const e = s.duel?.edges.find(x => x.id === edgeId);
    if (e) e.used = true;
    return s;
  });
  const rival = state.rivals.find(r => r.id === state.duel.rivalId);
  await postCard({
    kind: "edge",
    icon: "fa-solid fa-coins",
    kicker: t("Chat.EdgeKicker"),
    title: t(`Arena.Edge.${edge.kind}`),
    body: t("Chat.EdgeBody", { rival: rival?.name ?? "?" })
  }, { actor });
}

export async function shiftCrowd(actor, delta) {
  await Store.update(actor, s => {
    if (!s.duel) return null;
    s.duel = R.shiftCrowd(s.duel, delta);
    return s;
  });
}

/** Gra pod publikę: test Charyzmy. Sukces +1 (PS ≥ 3: +2), porażka o 3+ PS: −1. */
export async function playToCrowd(actor) {
  const result = await rollSkill(actor, "Charm", { title: t("Arena.PlayToCrowd") });
  if (!result) return;
  const delta = result.success ? (result.sl >= 3 ? 2 : 1) : (result.sl <= -3 ? -1 : 0);
  if (delta) await shiftCrowd(actor, delta);
  const crowd = Store.getState(actor).duel?.crowd ?? 0;
  await postCard({
    kind: "crowd",
    theme: delta < 0 ? "blood" : "gold",
    icon: "fa-solid fa-masks-theater",
    kicker: t("Arena.PlayToCrowd"),
    title: t(`Arena.Mood.${crowd}`),
    body: t("Chat.CrowdShift", { delta: delta > 0 ? `+${delta}` : `${delta}`, crowd: crowd > 0 ? `+${crowd}` : `${crowd}` })
  }, { actor });
}

export async function dirtyTrick(actor) {
  await Store.update(actor, s => {
    if (!s.duel) return null;
    s.duel.dirty += 1;
    s.duel = R.shiftCrowd(s.duel, -1);
    return s;
  });
  await postCard({
    kind: "dirty",
    theme: "blood",
    icon: "fa-solid fa-hand-sparkles",
    kicker: t("Arena.Dirty"),
    title: t("Chat.DirtyTitle"),
    body: t("Chat.DirtyBody")
  }, { actor });
}

export async function linkCombat(actor) {
  if (!game.user.isGM) return;
  await Store.update(actor, s => {
    if (!s.duel) return null;
    s.duel.combatId = s.duel.combatId ? "" : (game.combat?.id ?? "");
    return s;
  });
}

/**
 * Początek rundy: Tłum przy ±2 daje +1 Przewagi szampierzowi albo rywalowi.
 * Wołane tylko u aktywnego MG.
 */
export async function onCombatRound(combat) {
  for (const champion of game.actors) {
    const raw = champion.getFlag(MODULE_ID, "legend");
    if (!raw?.duel || raw.duel.combatId !== combat.id || raw.duel.stage !== "fight") continue;
    const state = R.normalizeState(raw);
    const favour = R.crowdFavours(state.duel.crowd);
    if (!favour) continue;
    let target = null;
    if (favour === "champion") {
      target = combat.combatants.find(c => c.actorId === champion.id)?.actor ?? null;
    } else {
      const rival = state.rivals.find(r => r.id === state.duel.rivalId);
      const rivalActor = rival?.actorUuid ? fromUuidSync(rival.actorUuid) : null;
      target = combat.combatants.find(c => (rivalActor && c.actorId === rivalActor.id) || (!rivalActor && c.name === rival?.name))?.actor ?? null;
    }
    if (!target) continue;
    await modifyAdvantage(target, 1);
    await postCard({
      kind: "crowdRound",
      theme: favour === "champion" ? "gold" : "blood",
      icon: "fa-solid fa-people-group",
      kicker: t("Chat.RoundKicker", { round: combat.round }),
      title: t(`Arena.Mood.${state.duel.crowd}`),
      body: t("Chat.RoundAdvantage", { name: target.name })
    }, { actor: champion });
  }
}

/** Rozstrzygnięcie: wynik, los pokonanego i opowieść. */
export async function resolveDuel(actor) {
  const state = Store.getState(actor);
  const d = state.duel;
  if (!d) return;
  const rival = state.rivals.find(r => r.id === d.rivalId);
  const suggested = R.suggestDuelFace({ outcome: "win", fate: "spared", dirty: d.dirty, terms: d.terms, higherStatus: rival?.higherStatus });

  const data = await D.formDialog({
    title: t("Dialog.ResolveTitle"),
    icon: "fa-solid fa-scroll",
    okLabel: t("Dialog.Proclaim"),
    okIcon: "fa-solid fa-scroll",
    width: 660,
    html: [
      D.field(t("Dialog.Outcome"), D.choices("outcome", ["win", "loss", "draw"].map(o => ({ value: o, label: t(`Arena.Outcome.${o}`), icon: { win: "fa-solid fa-crown", loss: "fa-solid fa-skull-crossbones", draw: "fa-solid fa-handshake-simple" }[o], dark: o === "loss" })), d.result || "win")),
      D.field(t("Dialog.Fate"), D.choices("fate", ["spared", "humiliated", "killed"].map(f => ({ value: f, label: t(`Arena.Fate.${f}`), icon: { spared: "fa-solid fa-hand-holding-heart", humiliated: "fa-solid fa-person-falling", killed: "fa-solid fa-skull" }[f], dark: f !== "spared" })), "spared"), t("Dialog.FateHint")),
      `<p class="lg-hint">${t("Dialog.FaceAuto", { face: faceLabel(suggested) })}</p>`,
      D.field(t("Dialog.TaleTitle"), D.text("title", t("Arena.TaleTitle", { rival: rival?.name ?? "?" }))),
      D.field(t("Dialog.TaleText"), D.area("text", d.stakes)),
      D.field(t("Dialog.Circle"), D.circleChoices("commons")),
      D.field(t("Dialog.Trophy"), D.text("trophy", "", t("Dialog.TrophyPlaceholder"))),
      D.checkbox("overrideFace", false, t("Dialog.OverrideFace")),
      D.faceChoices(suggested)
    ].join("")
  });
  if (!data) return;

  const outcome = data.outcome ?? "win";
  const fate = data.fate ?? "spared";
  const autoFace = R.suggestDuelFace({ outcome, fate, dirty: d.dirty, terms: d.terms, higherStatus: rival?.higherStatus });
  const taleOverride = {
    title: data.title.trim(),
    text: data.text.trim(),
    circle: data.circle ?? "commons",
    trophy: data.trophy.trim(),
    face: data.overrideFace ? data.face : autoFace
  };

  let effect = null;
  await Store.update(actor, s => {
    const res = R.resolveDuel(s, { outcome, fate, taleOverride }, Store.worldNow());
    effect = res.effect;
    const text = t(`Chronicle.Duel_${outcome}`, { rival: rival?.name ?? "?", fate: outcome === "win" ? t(`Arena.Fate.${fate}`) : "" });
    return Store.chronicle(res.state, "duel", text, "fa-solid fa-khanda");
  });
  if (!effect) return;

  const healed = effect.heal ? await healWounds(actor, effect.heal) : 0;
  const lines = [];
  if (effect.rival) lines.push({ icon: "fa-solid fa-chess-knight", text: t("Chat.RivalAfter", { name: effect.rival.name, status: t(`Rivals.Status.${effect.rival.status}`), grudge: t(`Rivals.Grudge.${effect.rival.grudge}`) }) });
  if (effect.wager) lines.push({ icon: "fa-solid fa-coins", text: effect.betWon ? t("Chat.BetWon", { wager: effect.wager, odds: effect.odds }) : t("Chat.BetLost", { wager: effect.wager }) });
  if (healed) lines.push({ icon: "fa-solid fa-kit-medical", text: t("Chat.Healed", { n: healed }) });
  if (effect.dimmed) lines.push({ icon: "fa-solid fa-wind", text: t("Chat.Dimmed", { title: effect.dimmed.title || t("Legend.Untitled") }) });

  await postCard({
    kind: "duelResult",
    theme: outcome === "win" ? "gold" : (outcome === "loss" ? "blood" : "ink"),
    versus: { left: actor.img, right: rival?.img || "icons/svg/mystery-man.svg" },
    kicker: t("Chat.DuelKicker"),
    title: t(`Chat.Duel_${outcome}`, { champion: actor.name, rival: rival?.name ?? "?" }),
    subtitle: outcome === "win" ? t(`Arena.Fate.${fate}`) : "",
    lines
  }, { actor });

  if (effect.taleDraft) await commitTale(actor, effect.taleDraft);
}

/* ==================================================================== */
/*  Echo Sławy                                                          */
/* ==================================================================== */

export async function rollEcho(actor) {
  if (!game.user.isGM) return;
  const state = Store.getState(actor);
  const tier = R.tierOf(R.fame(state));
  const target = R.echoTarget(tier);
  const first = await new Roll("1d10").evaluate();
  const rolls = [first];

  if (first.total > target) {
    return postCard({
      kind: "echo",
      theme: "ink",
      icon: "fa-solid fa-tower-broadcast",
      kicker: t("Chat.EchoKicker", { roll: first.total, target }),
      title: t("Echo.Silence"),
      body: t("Echo.SilenceText")
    }, { actor, rolls });
  }

  const second = await new Roll("1d10").evaluate();
  rolls.push(second);
  const type = R.echoTypeFor(second.total);
  const c = C();
  const kicker = t("Chat.EchoKicker", { roll: first.total, target });
  const base = { kind: "echo", icon: R.ECHO_ICON[type], kicker, title: t(`Echo.Type.${type}`), subtitle: t(`Echo.Sub.${type}`) };

  switch (type) {
    case "petition": {
      const circle = pick(R.CIRCLES);
      const tpl = pick(c.petitions[circle]);
      await Store.update(actor, s => {
        const res = R.addPetition(s, { ...tpl, circle, deadline: time.addDays(Store.worldNow(), 3 + tpl.stake * 2) }, Store.worldNow());
        return Store.chronicle(res.state, "echo", t("Chronicle.EchoPetition", { who: tpl.petitioner }), R.ECHO_ICON.petition);
      });
      return postCard({ ...base, body: tpl.request, lines: [{ icon: R.CIRCLE_ICON[circle], text: `${tpl.petitioner} · ${circleLabel(circle)}` }, { icon: "fa-solid fa-coins", text: tpl.reward }], seals: seals(tpl.stake), sealsLabel: t(`Petitions.Stake.${tpl.stake}`) }, { actor, rolls });
    }
    case "challenger": {
      let rival = R.grudgeChallenger(state);
      let body;
      if (rival) {
        body = t("Echo.RivalReturns", { name: rival.name, grudge: t(`Rivals.Grudge.${rival.grudge}`) });
      } else {
        const known = new Set(state.rivals.map(r => r.name));
        const tpl = pick(c.challengers.filter(x => !known.has(x.name))) ?? pick(c.challengers);
        await Store.update(actor, s => {
          const res = R.addRival(s, { name: tpl.name, title: tpl.title, notes: tpl.notes, grudge: 0 });
          rival = res.rival;
          return res.state;
        });
        body = t("Echo.NewChallenger", { name: tpl.name, title: tpl.title });
      }
      await Store.update(actor, s => Store.chronicle(s, "echo", t("Chronicle.EchoChallenger", { name: rival.name }), R.ECHO_ICON.challenger));
      return postCard({ ...base, theme: "blood", body, quote: rival.notes || "", footnote: t("Echo.ChallengerFoot") }, { actor, rolls });
    }
    case "rivalMove": {
      const mover = R.movingRival(state);
      if (!mover) {
        // Brak rywala z urazą: pojawia się nowy pretendent
        const tpl = pick(c.challengers);
        await Store.update(actor, s => Store.chronicle(R.addRival(s, { name: tpl.name, title: tpl.title, notes: tpl.notes }).state, "echo", t("Chronicle.EchoChallenger", { name: tpl.name }), R.ECHO_ICON.challenger));
        return postCard({ ...base, title: t("Echo.Type.challenger"), subtitle: t("Echo.Sub.challenger"), icon: R.ECHO_ICON.challenger, theme: "blood", body: t("Echo.NewChallenger", { name: tpl.name, title: tpl.title }), quote: tpl.notes }, { actor, rolls });
      }
      const move = pick(R.RIVAL_MOVES);
      const fill = text => text.replaceAll("{rival}", mover.name);
      if (move === "slander") {
        const rumor = pick(c.darkRumors);
        await commitTale(actor, { title: rumor.title, text: rumor.text, face: rumor.face, circle: pick(R.CIRCLES), weight: 1, lie: true, source: "rumor" }, { announce: false });
        await Store.update(actor, s => Store.chronicle(s, "echo", t("Chronicle.RivalMove", { name: mover.name, move: t(`Echo.Move.${move}`) }), R.ECHO_ICON.rivalMove));
        return postCard({ ...base, theme: "blood", subtitle: t(`Echo.Move.${move}`), body: t("Echo.SlanderBody", { name: mover.name, title: rumor.title }), quote: rumor.text, footnote: t("Echo.RumorFoot") }, { actor, rolls });
      }
      if (move === "bribe") {
        await Store.update(actor, s => {
          const r = s.rivals.find(x => x.id === mover.id);
          if (r) r.bribe = R.clamp(r.bribe + 1, 0, R.MAX_RIVAL_EDGES);
          return Store.chronicle(s, "echo", t("Chronicle.RivalMove", { name: mover.name, move: t(`Echo.Move.${move}`) }), R.ECHO_ICON.rivalMove);
        });
        return postCard({ ...base, theme: "ink", subtitle: t(`Echo.Move.${move}`), body: fill(pick(c.rivalMoves.bribe)), footnote: t("Echo.SecretFoot") }, { actor, rolls, gmOnly: true });
      }
      await Store.update(actor, s => Store.chronicle(s, "echo", t("Chronicle.RivalMove", { name: mover.name, move: t(`Echo.Move.${move}`) }), R.ECHO_ICON.rivalMove));
      return postCard({ ...base, theme: "blood", subtitle: t(`Echo.Move.${move}`), body: fill(pick(c.rivalMoves[move])), footnote: t(`Echo.MoveFoot.${move}`) }, { actor, rolls });
    }
    case "ballad": {
      const tale = R.balladTarget(state);
      if (!tale) return postCard({ ...base, theme: "ink", body: t("Echo.BalladNothing") }, { actor, rolls });
      await Store.update(actor, s => Store.chronicle(R.shiftTaleWeight(s, tale.id, 1), "echo", t("Chronicle.EchoBallad", { title: tale.title }), R.ECHO_ICON.ballad));
      return postCard({ ...base, body: t("Echo.BalladGrows", { title: tale.title || t("Legend.Untitled"), weight: t(`Weight.${tale.weight + 1}`) }), quote: pick(c.ballads) }, { actor, rolls });
    }
    case "darkRumor": {
      const rumor = pick(c.darkRumors);
      const circle = pick(R.CIRCLES);
      await commitTale(actor, { title: rumor.title, text: rumor.text, face: rumor.face, circle, weight: 1, lie: true, source: "rumor" }, { announce: false });
      return postCard({ ...base, theme: "blood", body: rumor.text, footnote: t("Echo.RumorFoot") }, { actor, rolls });
    }
    case "impostor": {
      const hook = pick(c.impostors);
      await Store.update(actor, s => {
        const res = R.addPetition(s, { petitioner: t("Echo.ImpostorPetitioner"), circle: "commons", request: hook, stake: 2, reward: t("Echo.ImpostorReward") }, Store.worldNow());
        return Store.chronicle(res.state, "echo", t("Chronicle.EchoImpostor"), R.ECHO_ICON.impostor);
      });
      return postCard({ ...base, theme: "ink", body: hook, footnote: t("Echo.ImpostorFoot") }, { actor, rolls });
    }
    case "offer": {
      const offer = pick(c.offers);
      return postCard({ ...base, theme: "ink", body: offer.offer, lines: [{ icon: "fa-solid fa-user-tie", text: offer.from }, { icon: "fa-solid fa-scale-unbalanced", text: offer.price }], footnote: t("Echo.SecretFoot") }, { actor, rolls, gmOnly: true });
    }
    case "notice":
    default: {
      const line = pick(c.notices);
      return postCard({ ...base, theme: "ink", body: line, footnote: t("Echo.SecretFoot") }, { actor, rolls, gmOnly: true });
    }
  }
}

/* ==================================================================== */
/*  Dziedzictwo                                                         */
/* ==================================================================== */

export async function inherit(actor) {
  if (!game.user.isGM) return;
  const candidates = game.actors.filter(a => a.type === "character" && a.id !== actor.id);
  if (!candidates.length) return ui.notifications.warn(t("Notify.NoHeir"));
  const data = await D.formDialog({
    title: t("Dialog.InheritTitle"),
    icon: "fa-solid fa-dove",
    okLabel: t("Dialog.Inherit"),
    okIcon: "fa-solid fa-dove",
    html: [
      `<p class="lg-hint">${t("Dialog.InheritHint", { name: actor.name })}</p>`,
      D.field(t("Dialog.Heir"), D.select("heir", candidates.map(a => ({ value: a.id, label: a.name })), candidates[0].id))
    ].join("")
  });
  if (!data?.heir) return;
  const heir = game.actors.get(data.heir);
  if (!heir) return;
  const existing = heir.getFlag(MODULE_ID, "legend");
  if (existing?.tales?.length) {
    const ok = await D.confirm({ title: t("Dialog.InheritTitle"), text: t("Dialog.InheritOverwrite", { name: heir.name }) });
    if (!ok) return;
  }

  const fallenState = Store.getState(actor);
  let heirState = R.inheritLegend(fallenState, { fallenName: actor.name, fallenUuid: actor.uuid });
  heirState = Store.chronicle(heirState, "fallen", t("Chronicle.Inherited", { fallen: actor.name, heir: heir.name }), "fa-solid fa-dove");
  await heir.update({ [`flags.${MODULE_ID}.legend`]: R.normalizeState(heirState), [`flags.${MODULE_ID}.unlocked`]: true });
  await Store.update(actor, s => {
    s.fallen = true;
    s.duel = null;
    return Store.chronicle(s, "fallen", t("Chronicle.Fallen", { name: actor.name, heir: heir.name }), "fa-solid fa-cross");
  });

  await postCard({
    kind: "inherit",
    theme: "ink",
    versus: { left: actor.img, right: heir.img },
    kicker: t("Chat.InheritKicker"),
    title: t("Chat.InheritTitle", { fallen: actor.name, heir: heir.name }),
    lines: [
      { icon: "fa-solid fa-scroll", text: t("Chat.InheritTales", { n: heirState.tales.length }) },
      { icon: "fa-solid fa-handshake", text: t("Chat.InheritPromises", { n: heirState.petitions.length }) },
      { icon: "fa-solid fa-fire", text: t("Chat.InheritRivals", { n: heirState.rivals.length }) }
    ],
    footnote: t("Chat.InheritFoot")
  }, { actor: heir });
  game.champion?.openSheet(heir);
}

/* ==================================================================== */
/*  Kronika                                                             */
/* ==================================================================== */

export async function addNote(actor) {
  const data = await D.formDialog({ title: t("Chronicle.AddNote"), icon: "fa-solid fa-pen-nib", html: D.field(t("Dialog.NoteText"), D.area("text", "")) });
  if (!data?.text?.trim()) return;
  await Store.update(actor, s => Store.chronicle(s, "note", data.text.trim(), "fa-solid fa-pen-nib"));
}

export async function deleteNote(actor, entryId) {
  await Store.update(actor, s => { s.chronicle = s.chronicle.filter(e => e.id !== entryId); return s; });
}

/** Kronika jako wpis w dzienniku (dla MG i graczy, jeśli MG udostępni). */
export async function exportChronicle(actor) {
  if (!game.user.isGM) return;
  const state = Store.getState(actor);
  const esc = v => Handlebars.escapeExpression(v ?? "");
  const tales = R.liveTales(state).sort((a, b) => b.weight - a.weight)
    .map(tl => `<li><b>${esc(tl.title || t("Legend.Untitled"))}</b> – ${esc(faceLabel(tl.face))}, ${esc(circleLabel(tl.circle))}, ${esc(t(`Weight.${tl.weight}`))}${tl.lie ? ` (${esc(t("Legend.Lie"))})` : ""}${tl.text ? `<br><i>${esc(tl.text)}</i>` : ""}</li>`).join("");
  const entries = state.chronicle.map(e => `<li>${e.ts ? `<b>${esc(time.format(e.ts))}</b>: ` : ""}${esc(e.text)}</li>`).join("");
  const html = `<h1>${esc(state.name.declared || actor.name)}</h1><p><i>${esc(actor.name)}${state.homeland ? `, ${esc(state.homeland)}` : ""}</i></p><h2>${esc(t("Legend.Tales"))}</h2><ul>${tales}</ul><h2>${esc(t("Chronicle.Title"))}</h2><ol>${entries}</ol>`;
  const name = t("Chronicle.JournalName", { name: actor.name });
  const existing = game.journal.getName(name);
  if (existing) {
    const page = existing.pages.contents[0];
    if (page) await page.update({ "text.content": html });
    else await existing.createEmbeddedDocuments("JournalEntryPage", [{ name, type: "text", text: { content: html } }]);
    existing.sheet.render(true);
  } else {
    const journal = await JournalEntry.create({ name, pages: [{ name, type: "text", text: { content: html } }] });
    journal?.sheet.render(true);
  }
}
