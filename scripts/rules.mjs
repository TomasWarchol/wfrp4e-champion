/**
 * Legenda Szampierza – silnik zasad.
 * Czyste funkcje na zwykłych obiektach (bez Foundry), dzięki czemu zasady są w jednym miejscu
 * i dają się sprawdzić poza grą. Funkcje zmieniające stan zwracają nową kopię.
 */

/* -------------------------------------------- */
/*  Stałe                                       */
/* -------------------------------------------- */

export const DATA_VERSION = 1;

/** Oblicza legendy: to, za kogo ludzie mają szampierza. */
export const FACES = ["protector", "slayer", "rebel", "honorable", "brute", "rogue"];

/** Ton oblicza: jasne otwierają drzwi uprzejmością, ciemne strachem. Buntownik zależy od kręgu. */
export const FACE_TONE = {
  protector: "bright",
  slayer: "bright",
  rebel: "mixed",
  honorable: "bright",
  brute: "dark",
  rogue: "dark"
};

export const FACE_ICON = {
  protector: "fa-solid fa-shield-heart",
  slayer: "fa-solid fa-dragon",
  rebel: "fa-solid fa-hand-fist",
  honorable: "fa-solid fa-scale-balanced",
  brute: "fa-solid fa-skull",
  rogue: "fa-solid fa-mask"
};

/** Kręgi, w których krąży opowieść. */
export const CIRCLES = ["commons", "nobility", "temples", "underworld", "soldiery"];

export const CIRCLE_ICON = {
  commons: "fa-solid fa-wheat-awn",
  nobility: "fa-solid fa-crown",
  temples: "fa-solid fa-place-of-worship",
  underworld: "fa-solid fa-mask",
  soldiery: "fa-solid fa-shield-halved"
};

/** Progi Sławy (suma Wagi żywych opowieści) dla poziomów 0–4. */
export const TIER_THRESHOLDS = [0, 3, 7, 12, 18];
export const MAX_TIER = TIER_THRESHOLDS.length - 1;

/** Waga opowieści: 1 Plotka (okolica), 2 Opowieść (prowincja), 3 Legenda (całe Imperium). */
export const MIN_WEIGHT = 1;
export const MAX_WEIGHT = 3;

/** Ile próśb szampierz może naraz obiecać spełnić. */
export const MAX_PROMISES = 3;

/** Imię jest „przyjęte”, gdy oblicze ludu zgadza się z deklarowanym i ma co najmniej tyle Wagi. */
export const NAME_ACCEPT_WEIGHT = 3;

export const PETITION_STATUS = ["open", "accepted", "fulfilled", "failed", "declined"];

export const RIVAL_STATUS = ["active", "debtor", "beaten", "dead"];
export const MAX_GRUDGE = 3;

/** Pojedynek */
export const DUEL_STAGES = ["challenge", "prep", "fight", "aftermath"];
export const DUEL_TERMS = ["firstBlood", "yield", "death"];
export const AUDIENCE = [1, 2, 3]; // kameralny, tłum, widowisko
export const CROWD_MIN = -3;
export const CROWD_MAX = 3;
/** Od tej wartości Tłumu jedna strona dostaje +1 Przewagi na początku każdej rundy. */
export const CROWD_ADVANTAGE_AT = 2;
export const MAX_RIVAL_EDGES = 3;

/**
 * Sekundanci: rola → umiejętność (klucz nazwy WFRP4e) i cecha zapasowa, gdy postać nie ma umiejętności.
 * Każda rola wykonuje jeden test w Przygotowaniu.
 */
export const SECOND_ROLES = {
  scout: { skill: "Gossip", characteristic: "fel", icon: "fa-solid fa-eye" },
  herald: { skill: "Charm", characteristic: "fel", icon: "fa-solid fa-bullhorn" },
  bookie: { skill: "Gamble", characteristic: "int", icon: "fa-solid fa-coins" },
  armsman: { skill: "Perception", characteristic: "i", icon: "fa-solid fa-magnifying-glass" },
  surgeon: { skill: "Heal", characteristic: "int", icon: "fa-solid fa-kit-medical" }
};
export const SECOND_ROLE_IDS = Object.keys(SECOND_ROLES);

/** Echo Sławy: k10 ≤ (Poziom + 1) oznacza, że sława ściąga coś na szampierza. */
export const ECHO_TYPES = ["petition", "petition", "petition", "challenger", "challenger", "ballad", "darkRumor", "impostor", "offer", "notice"];
export const ECHO_ICON = {
  petition: "fa-solid fa-hands-praying",
  challenger: "fa-solid fa-hand-back-fist",
  ballad: "fa-solid fa-music",
  darkRumor: "fa-solid fa-comment-slash",
  impostor: "fa-solid fa-user-secret",
  offer: "fa-solid fa-sack-dollar",
  notice: "fa-solid fa-eye"
};
/** Wydarzenia echa, o których wie tylko MG (wprowadza je w fikcji). */
export const ECHO_SECRET = new Set(["offer", "notice"]);

/* -------------------------------------------- */
/*  Narzędzia                                   */
/* -------------------------------------------- */

export function newId(prefix = "lg") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

/* -------------------------------------------- */
/*  Stan                                        */
/* -------------------------------------------- */

export function defaultState() {
  return {
    version: DATA_VERSION,
    name: { declared: "", face: "protector" },
    homeland: "",
    tales: [],
    petitions: [],
    rivals: [],
    duel: null,
    chronicle: [],
    nameCalledSession: null,
    fallen: false,
    heirOf: null
  };
}

export function normalizeTale(raw = {}) {
  return {
    id: raw.id || newId("tale"),
    title: String(raw.title ?? ""),
    text: String(raw.text ?? ""),
    tavern: String(raw.tavern ?? ""),
    tavernBy: String(raw.tavernBy ?? ""),
    face: oneOf(raw.face, FACES, "protector"),
    circle: oneOf(raw.circle, CIRCLES, "commons"),
    weight: clamp(Math.round(Number(raw.weight ?? 1)), 0, MAX_WEIGHT),
    trophy: String(raw.trophy ?? ""),
    lie: !!raw.lie,
    inherited: !!raw.inherited,
    source: String(raw.source ?? "deed"),
    created: Number(raw.created) || 0,
    ts: Number(raw.ts) || 0,
    invokedSession: raw.invokedSession ?? null
  };
}

export function normalizePetition(raw = {}) {
  return {
    id: raw.id || newId("pet"),
    petitioner: String(raw.petitioner ?? ""),
    actorUuid: String(raw.actorUuid ?? ""),
    img: String(raw.img ?? ""),
    circle: oneOf(raw.circle, CIRCLES, "commons"),
    request: String(raw.request ?? ""),
    reward: String(raw.reward ?? ""),
    stake: clamp(Math.round(Number(raw.stake ?? 1)), MIN_WEIGHT, MAX_WEIGHT),
    deadline: raw.deadline === null || raw.deadline === undefined || raw.deadline === "" ? null : Number(raw.deadline),
    status: oneOf(raw.status, PETITION_STATUS, "open"),
    inherited: !!raw.inherited,
    created: Number(raw.created) || 0,
    resolved: Number(raw.resolved) || 0
  };
}

export function normalizeRival(raw = {}) {
  const record = raw.record ?? {};
  return {
    id: raw.id || newId("riv"),
    name: String(raw.name ?? ""),
    actorUuid: String(raw.actorUuid ?? ""),
    img: String(raw.img ?? ""),
    title: String(raw.title ?? ""),
    notes: String(raw.notes ?? ""),
    grudge: clamp(Math.round(Number(raw.grudge ?? 0)), 0, MAX_GRUDGE),
    status: oneOf(raw.status, RIVAL_STATUS, "active"),
    higherStatus: !!raw.higherStatus,
    record: {
      wins: Math.max(0, Number(record.wins) || 0),
      losses: Math.max(0, Number(record.losses) || 0),
      draws: Math.max(0, Number(record.draws) || 0)
    },
    inherited: !!raw.inherited
  };
}

export function emptySeconds() {
  return Object.fromEntries(SECOND_ROLE_IDS.map(role => [role, { actorUuid: "", name: "", img: "", result: null }]));
}

export function normalizeDuel(raw) {
  if (!raw) return null;
  const seconds = emptySeconds();
  for (const role of SECOND_ROLE_IDS) {
    const s = raw.seconds?.[role] ?? {};
    seconds[role] = {
      actorUuid: String(s.actorUuid ?? ""),
      name: String(s.name ?? ""),
      img: String(s.img ?? ""),
      result: s.result ? { sl: Number(s.result.sl) || 0, success: !!s.result.success, roll: Number(s.result.roll) || 0 } : null
    };
  }
  return {
    id: raw.id || newId("duel"),
    stage: oneOf(raw.stage, DUEL_STAGES, "challenge"),
    rivalId: String(raw.rivalId ?? ""),
    terms: oneOf(raw.terms, DUEL_TERMS, "firstBlood"),
    audience: clamp(Math.round(Number(raw.audience ?? 2)), 1, 3),
    venue: String(raw.venue ?? ""),
    stakes: String(raw.stakes ?? ""),
    wager: String(raw.wager ?? ""),
    seconds,
    edges: (raw.edges ?? []).map(e => ({ id: e.id || newId("edge"), kind: String(e.kind ?? "weakness"), used: !!e.used })),
    rivalEdges: clamp(Math.round(Number(raw.rivalEdges ?? 0)), 0, MAX_RIVAL_EDGES),
    negatedEdges: clamp(Math.round(Number(raw.negatedEdges ?? 0)), 0, MAX_RIVAL_EDGES),
    crowd: clamp(Math.round(Number(raw.crowd ?? 0)), CROWD_MIN, CROWD_MAX),
    odds: Number(raw.odds) || 0,
    dirty: Math.max(0, Number(raw.dirty) || 0),
    surgeonHeal: Math.max(0, Number(raw.surgeonHeal) || 0),
    combatId: String(raw.combatId ?? ""),
    started: Number(raw.started) || 0
  };
}

export function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  return {
    version: DATA_VERSION,
    name: {
      declared: String(raw.name?.declared ?? ""),
      face: oneOf(raw.name?.face, FACES, "protector")
    },
    homeland: String(raw.homeland ?? ""),
    tales: (raw.tales ?? []).map(normalizeTale),
    petitions: (raw.petitions ?? []).map(normalizePetition),
    rivals: (raw.rivals ?? []).map(normalizeRival),
    duel: normalizeDuel(raw.duel),
    chronicle: (raw.chronicle ?? []).map(e => ({
      id: e.id || newId("chr"),
      ts: Number(e.ts) || 0,
      kind: String(e.kind ?? "note"),
      text: String(e.text ?? ""),
      icon: String(e.icon ?? "fa-solid fa-feather")
    })),
    nameCalledSession: raw.nameCalledSession ?? null,
    fallen: !!raw.fallen,
    heirOf: raw.heirOf ? { name: String(raw.heirOf.name ?? ""), uuid: String(raw.heirOf.uuid ?? "") } : null
  };
}

/* -------------------------------------------- */
/*  Legenda i Sława                             */
/* -------------------------------------------- */

/** Opowieści, które jeszcze krążą (Waga ≥ 1). */
export function liveTales(state) {
  return state.tales.filter(t => t.weight >= MIN_WEIGHT);
}

/** Ton opowieści w jej kręgu. Buntownik jest ciemny tylko w oczach szlachty. */
export function taleTone(tale) {
  const tone = FACE_TONE[tale.face] ?? "bright";
  if (tone !== "mixed") return tone;
  return tale.circle === "nobility" ? "dark" : "bright";
}

export function fame(state) {
  return liveTales(state).reduce((sum, t) => sum + t.weight, 0);
}

export function tierOf(fameValue) {
  let tier = 0;
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) if (fameValue >= TIER_THRESHOLDS[i]) tier = i;
  return tier;
}

/** Poziom, próg następnego poziomu i postęp 0–1 w obrębie bieżącego poziomu. */
export function tierProgress(fameValue) {
  const tier = tierOf(fameValue);
  const floor = TIER_THRESHOLDS[tier];
  const next = TIER_THRESHOLDS[tier + 1] ?? null;
  const progress = next === null ? 1 : (fameValue - floor) / (next - floor);
  return { tier, fame: fameValue, floor, next, progress: clamp(progress, 0, 1) };
}

/** Szansa na rozpoznanie przez obcego z kręgu, w którym krąży legenda: k10 ≤ 2 × Poziom. */
export function recognitionTarget(tier) {
  return tier * 2;
}

/** Echo Sławy: k10 ≤ Poziom + 1. */
export function echoTarget(tier) {
  return tier + 1;
}

export function echoTypeFor(d10) {
  return ECHO_TYPES[clamp(Math.round(d10), 1, 10) - 1];
}

export function faceTotals(state) {
  const totals = Object.fromEntries(FACES.map(f => [f, 0]));
  for (const tale of liveTales(state)) totals[tale.face] += tale.weight;
  return totals;
}

export function circleTotals(state) {
  const totals = Object.fromEntries(CIRCLES.map(c => [c, { bright: 0, dark: 0, total: 0 }]));
  for (const tale of liveTales(state)) {
    const bucket = totals[tale.circle];
    bucket[taleTone(tale)] += tale.weight;
    bucket.total += tale.weight;
  }
  return totals;
}

/**
 * Oblicze ludu: oblicze o największej Wadze. Remis rozstrzyga oblicze deklarowane,
 * a potem najświeższa opowieść. Brak opowieści → null.
 */
export function peopleFace(state) {
  const totals = faceTotals(state);
  const best = Math.max(...Object.values(totals));
  if (best <= 0) return null;
  const leaders = FACES.filter(f => totals[f] === best);
  if (leaders.length === 1) return leaders[0];
  if (leaders.includes(state.name.face)) return state.name.face;
  const recent = [...liveTales(state)].sort((a, b) => b.created - a.created).find(t => leaders.includes(t.face));
  return recent?.face ?? leaders[0];
}

/** Stan Imienia: deklarowane, oblicze ludu i czy Imię zostało przyjęte. */
export function nameStatus(state) {
  const totals = faceTotals(state);
  const people = peopleFace(state);
  const accepted = !!people && people === state.name.face && totals[people] >= NAME_ACCEPT_WEIGHT;
  return { declared: state.name.declared, declaredFace: state.name.face, peopleFace: people, accepted, totals };
}

/**
 * Wezwanie Imienia (raz na sesję, gdy szampierz działa zgodnie z obliczem ludu):
 * odzyskuje 1 Determinację; przyjęte Imię daje dodatkowo 1 Szczęście.
 */
export function nameCallReward(status) {
  return { resolve: 1, fortune: status.accepted ? 1 : 0 };
}

export function canCallName(state, sessionId) {
  return !state.fallen && !!peopleFace(state) && state.nameCalledSession !== sessionId;
}

/* -------------------------------------------- */
/*  Przywołanie opowieści                       */
/* -------------------------------------------- */

/** Jasne opowieści wspierają Charyzmę/Przywództwo/Targowanie, ciemne Zastraszanie. */
export const INVOKE_SKILLS = {
  bright: ["Charm", "Leadership", "Haggle"],
  dark: ["Intimidate"]
};

export function canInvoke(tale, sessionId) {
  return tale.weight >= MIN_WEIGHT && !tale.lie && tale.invokedSession !== sessionId;
}

/** Premia: +1 PS za każdy punkt Wagi. */
export function invokeBonus(tale) {
  return clamp(tale.weight, 0, MAX_WEIGHT);
}

export function invokeSkills(tale) {
  return INVOKE_SKILLS[taleTone(tale)];
}

/** Kłamstwo da się zdementować testem Plotkowania z karą −10 za punkt Wagi. */
export function refuteModifier(tale) {
  return -10 * clamp(tale.weight, 0, MAX_WEIGHT);
}

/* -------------------------------------------- */
/*  Zmiany stanu: opowieści                     */
/* -------------------------------------------- */

export function addChronicle(state, entry, ts = 0) {
  const next = clone(state);
  next.chronicle.push({ id: newId("chr"), ts, kind: entry.kind ?? "note", text: entry.text ?? "", icon: entry.icon ?? "fa-solid fa-feather" });
  return next;
}

export function addTale(state, raw, ts = 0) {
  const next = clone(state);
  const tale = normalizeTale({ ...raw, created: raw.created || Date.now(), ts: raw.ts || ts });
  if (tale.weight < MIN_WEIGHT) tale.weight = MIN_WEIGHT;
  next.tales.push(tale);
  return { state: next, tale };
}

/** Zmienia Wagę opowieści (0 = opowieść przygasła i nie liczy się do Sławy). */
export function shiftTaleWeight(state, taleId, delta) {
  const next = clone(state);
  const tale = next.tales.find(t => t.id === taleId);
  if (tale) tale.weight = clamp(tale.weight + delta, 0, MAX_WEIGHT);
  return next;
}

/**
 * Przygasanie legendy: najmocniejsza jasna opowieść w kręgu traci Wagę.
 * Zwraca stan i opowieść, której dotyczyło (lub null).
 */
export function dimLegend(state, circle, amount = 1) {
  const candidates = liveTales(state)
    .filter(t => !t.lie && taleTone(t) === "bright" && (!circle || t.circle === circle))
    .sort((a, b) => b.weight - a.weight || b.created - a.created);
  const target = candidates[0];
  if (!target) return { state: clone(state), tale: null };
  return { state: shiftTaleWeight(state, target.id, -amount), tale: target };
}

/** Ballada: plotka (Waga 1) rośnie do opowieści. Wybiera najświeższą prawdziwą plotkę. */
export function balladTarget(state) {
  return liveTales(state)
    .filter(t => !t.lie && t.weight < MAX_WEIGHT)
    .sort((a, b) => a.weight - b.weight || b.created - a.created)[0] ?? null;
}

/* -------------------------------------------- */
/*  Prośby                                      */
/* -------------------------------------------- */

export function promisesCount(state) {
  return state.petitions.filter(p => p.status === "accepted").length;
}

export function canAccept(state) {
  return promisesCount(state) < MAX_PROMISES;
}

export function addPetition(state, raw, ts = 0) {
  const next = clone(state);
  const petition = normalizePetition({ ...raw, created: raw.created || ts });
  next.petitions.push(petition);
  return { state: next, petition };
}

/**
 * Rozstrzygnięcie prośby.
 * - accept: obietnica (maks. 3 naraz),
 * - fulfill: szkic opowieści o Wadze stawki w kręgu proszącego,
 * - fail: opowieść „Nie dotrzymał słowa” (Szelma) o Wadze stawki,
 * - decline: odmowa bez kosztu, chyba że stawka ≥ 2 – wtedy legenda w tym kręgu przygasa o 1.
 * Zwraca { state, effect }, gdzie effect opisuje skutek do pokazania i zapisania w kronice.
 */
export function resolvePetition(state, petitionId, action, { ts = 0, face = "protector" } = {}) {
  let next = clone(state);
  const petition = next.petitions.find(p => p.id === petitionId);
  if (!petition) return { state: next, effect: { type: "missing" } };

  if (action === "accept") {
    if (petition.status !== "open") return { state: next, effect: { type: "noop" } };
    if (!canAccept(next)) return { state: next, effect: { type: "tooMany" } };
    petition.status = "accepted";
    return { state: next, effect: { type: "accepted", petition: clone(petition) } };
  }

  if (action === "fulfill") {
    petition.status = "fulfilled";
    petition.resolved = ts;
    const draft = { title: "", text: petition.request, face, circle: petition.circle, weight: petition.stake, source: "petition" };
    return { state: next, effect: { type: "fulfilled", petition: clone(petition), taleDraft: draft } };
  }

  if (action === "fail") {
    petition.status = "failed";
    petition.resolved = ts;
    const draft = { title: "", text: petition.request, face: "rogue", circle: petition.circle, weight: petition.stake, source: "brokenPromise" };
    return { state: next, effect: { type: "failed", petition: clone(petition), taleDraft: draft } };
  }

  if (action === "decline") {
    petition.status = "declined";
    petition.resolved = ts;
    if (petition.stake >= 2) {
      const dimmed = dimLegend(next, petition.circle, 1);
      return { state: dimmed.state, effect: { type: "declined", petition: clone(petition), dimmed: dimmed.tale } };
    }
    return { state: next, effect: { type: "declined", petition: clone(petition), dimmed: null } };
  }

  return { state: next, effect: { type: "noop" } };
}

/** Dni do terminu (zaokrąglone w górę); null bez terminu. */
export function daysLeft(petition, now, secondsPerDay = 86400) {
  if (petition.deadline === null || petition.deadline === undefined) return null;
  return Math.ceil((petition.deadline - now) / secondsPerDay);
}

/* -------------------------------------------- */
/*  Rywale                                      */
/* -------------------------------------------- */

export function addRival(state, raw) {
  const next = clone(state);
  const rival = normalizeRival(raw);
  next.rivals.push(rival);
  return { state: next, rival };
}

/** Pretendent z echa: rywal z największą urazą (żywy), inaczej null (wtedy nowy zabijaka). */
export function grudgeChallenger(state) {
  return state.rivals
    .filter(r => r.status !== "dead" && r.grudge > 0)
    .sort((a, b) => b.grudge - a.grudge)[0] ?? null;
}

/* -------------------------------------------- */
/*  Pojedynek                                   */
/* -------------------------------------------- */

export function startDuel(state, raw, ts = 0) {
  const next = clone(state);
  next.duel = normalizeDuel({ ...raw, id: newId("duel"), stage: "challenge", started: ts, seconds: emptySeconds(), edges: [], crowd: 0 });
  return next;
}

/**
 * Skutek testu sekundanta. Zwraca nowy pojedynek.
 * - scout: sukces → Atut „Słabość rywala”; PS ≥ 3 → dwa,
 * - herald: Tłum startuje od +1 (PS ≥ 3: +2); porażka o 3+ PS → −1,
 * - bookie: kurs 2:1 (PS ≥ 3: 3:1); porażka → 1:1,
 * - armsman: unieważnia jeden Atut rywala (PS ≥ 3: dwa),
 * - surgeon: po walce leczy 1 + PS Żywotności (minimum 1 przy sukcesie).
 */
export function applySecondResult(duel, role, result) {
  const d = clone(duel);
  const sl = Number(result.sl) || 0;
  const success = !!result.success;
  d.seconds[role].result = { sl, success, roll: Number(result.roll) || 0 };

  switch (role) {
    case "scout": {
      d.edges = d.edges.filter(e => e.kind !== "weakness");
      const count = success ? (sl >= 3 ? 2 : 1) : 0;
      for (let i = 0; i < count; i++) d.edges.push({ id: newId("edge"), kind: "weakness", used: false });
      break;
    }
    case "herald":
      d.crowd = success ? (sl >= 3 ? 2 : 1) : (sl <= -3 ? -1 : 0);
      break;
    case "bookie":
      d.odds = success ? (sl >= 3 ? 3 : 2) : 1;
      break;
    case "armsman":
      d.negatedEdges = success ? Math.min(d.rivalEdges, sl >= 3 ? 2 : 1) : 0;
      break;
    case "surgeon":
      d.surgeonHeal = success ? Math.max(1, 1 + sl) : 0;
      break;
  }
  return d;
}

/** Zwolnienie sekundanta cofa skutek jego testu. */
export function resetSecond(duel, role) {
  const d = clone(duel);
  const had = d.seconds[role]?.result;
  d.seconds[role] = { actorUuid: "", name: "", img: "", result: null };
  if (!had) return d;
  switch (role) {
    case "scout": d.edges = d.edges.filter(e => e.kind !== "weakness" || e.used); break;
    case "herald": d.crowd = 0; break;
    case "bookie": d.odds = 0; break;
    case "armsman": d.negatedEdges = 0; break;
    case "surgeon": d.surgeonHeal = 0; break;
  }
  return d;
}

/** Atuty rywala, które jeszcze działają. */
export function activeRivalEdges(duel) {
  return Math.max(0, duel.rivalEdges - duel.negatedEdges);
}

export function shiftCrowd(duel, delta) {
  const d = clone(duel);
  d.crowd = clamp(d.crowd + delta, CROWD_MIN, CROWD_MAX);
  return d;
}

/** Kto dostaje Przewagę od Tłumu na początku rundy: "champion", "rival" albo null. */
export function crowdFavours(crowd) {
  if (crowd >= CROWD_ADVANTAGE_AT) return "champion";
  if (crowd <= -CROWD_ADVANTAGE_AT) return "rival";
  return null;
}

/** Waga opowieści z pojedynku: widownia ±1 za Tłum na skraju skali. */
export function duelWeight(audience, crowd) {
  let w = clamp(audience, 1, 3);
  if (crowd >= CROWD_ADVANTAGE_AT) w += 1;
  if (crowd <= -CROWD_ADVANTAGE_AT) w -= 1;
  return clamp(w, MIN_WEIGHT, MAX_WEIGHT);
}

/**
 * Podpowiedź oblicza dla opowieści z pojedynku.
 * Brudna walka → Szelma. Zabicie wbrew warunkom → Okrutnik, w walce na śmierć → Pogromca.
 * Litość → Honorowy. Upokorzenie możnego → Buntownik, kogoś niższego → Okrutnik.
 */
export function suggestDuelFace({ outcome, fate, dirty = 0, terms = "firstBlood", higherStatus = false }) {
  if (outcome !== "win") return "honorable";
  if (dirty > 0) return "rogue";
  if (fate === "killed") return terms === "death" ? "slayer" : "brute";
  if (fate === "humiliated") return higherStatus ? "rebel" : "brute";
  return "honorable";
}

/**
 * Rozstrzygnięcie pojedynku. outcome: win | loss | draw; fate (przy zwycięstwie): spared | humiliated | killed.
 * Zwraca { state, effect } – efekt zawiera szkic opowieści (albo przygaśnięcie legendy po porażce),
 * wypłatę zakładu i leczenie cyrulika.
 */
export function resolveDuel(state, { outcome, fate = "spared", taleOverride = {} } = {}, ts = 0) {
  let next = clone(state);
  const duel = next.duel;
  if (!duel) return { state: next, effect: { type: "noDuel" } };
  const rival = next.rivals.find(r => r.id === duel.rivalId) ?? null;
  const effect = { type: "duel", outcome, fate: outcome === "win" ? fate : null, rival: null, taleDraft: null, dimmed: null };

  // Rekord i uraza rywala
  if (rival) {
    if (outcome === "win") {
      rival.record.wins += 1;
      if (fate === "killed") rival.status = "dead";
      else if (fate === "spared") { rival.status = "debtor"; rival.grudge = clamp(rival.grudge - 1, 0, MAX_GRUDGE); }
      else { rival.status = "beaten"; rival.grudge = clamp(rival.grudge + 2, 0, MAX_GRUDGE); }
    } else if (outcome === "loss") {
      rival.record.losses += 1;
      rival.status = "active";
    } else {
      rival.record.draws += 1;
      rival.grudge = clamp(rival.grudge + 1, 0, MAX_GRUDGE);
    }
  }

  effect.rival = rival ? clone(rival) : null;

  // Opowieść albo przygaśnięcie
  const heroicLoss = outcome !== "win" && duel.crowd >= CROWD_ADVANTAGE_AT;
  if (outcome === "win" || heroicLoss) {
    const face = taleOverride.face ?? suggestDuelFace({ outcome, fate, dirty: duel.dirty, terms: duel.terms, higherStatus: rival?.higherStatus });
    const weight = taleOverride.weight ?? (outcome === "win" ? duelWeight(duel.audience, duel.crowd) : 1);
    effect.taleDraft = {
      title: taleOverride.title ?? "",
      text: taleOverride.text ?? duel.stakes,
      face,
      circle: taleOverride.circle ?? "commons",
      weight,
      trophy: taleOverride.trophy ?? "",
      source: "duel"
    };
  } else if (outcome === "loss") {
    const dimmed = dimLegend(next, null, 1);
    next = dimmed.state;
    effect.dimmed = dimmed.tale;
  }

  // Zakład i cyrulik
  effect.odds = duel.odds;
  effect.wager = duel.wager;
  effect.betWon = outcome === "win" && duel.odds > 0;
  effect.heal = duel.surgeonHeal;

  next.duel = null;
  return { state: next, effect };
}

/* -------------------------------------------- */
/*  Dziedzictwo                                 */
/* -------------------------------------------- */

/**
 * Legenda przechodzi na dziedzica: opowieści tracą 1 Wagę (plotki zostają tylko w kronice),
 * obietnice przechodzą jako długi zmarłego, rywale zachowują urazę.
 */
export function inheritLegend(state, { fallenName = "", fallenUuid = "" } = {}) {
  const heir = defaultState();
  heir.homeland = state.homeland;
  heir.name = { declared: "", face: state.name.face };
  heir.heirOf = { name: fallenName, uuid: fallenUuid };
  heir.tales = state.tales
    .filter(t => !t.lie && t.weight - 1 >= MIN_WEIGHT)
    .map(t => normalizeTale({ ...t, id: newId("tale"), weight: t.weight - 1, inherited: true, invokedSession: null }));
  heir.petitions = state.petitions
    .filter(p => p.status === "accepted")
    .map(p => normalizePetition({ ...p, id: newId("pet"), inherited: true }));
  heir.rivals = state.rivals
    .filter(r => r.status !== "dead")
    .map(r => normalizeRival({ ...r, id: newId("riv"), inherited: true }));
  heir.chronicle = clone(state.chronicle);
  return heir;
}
