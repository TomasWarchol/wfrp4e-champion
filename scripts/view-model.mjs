/**
 * Legenda Szampierza – model widoku.
 * Z czystego stanu i środowiska (tłumaczenia, czas, uprawnienia) buduje kontekst szablonów.
 * Nie dotyka Foundry, więc ten sam kod zasila kartę w grze i podgląd poza nią.
 */

import * as R from "./rules.mjs";
import { ripplesSVG, facesRadarSVG, laurelSVG, tierRingSVG, crowdGaugeSVG } from "./viz.mjs";

const TAB_IDS = ["legend", "petitions", "arena", "rivals", "chronicle"];
const TAB_ICON = {
  legend: "fa-solid fa-book-open",
  petitions: "fa-solid fa-hands-praying",
  arena: "fa-solid fa-khanda",
  rivals: "fa-solid fa-chess-knight",
  chronicle: "fa-solid fa-feather-pointed"
};
const STAGE_ICON = {
  challenge: "fa-solid fa-hand-back-fist",
  prep: "fa-solid fa-people-group",
  fight: "fa-solid fa-khanda",
  aftermath: "fa-solid fa-scroll"
};

/** Stały, lekki „losowy” obrót kartki z prośbą (zależny od id). */
function tilt(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 50) / 10 - 2.5).toFixed(1);
}

function seals(weight, max = R.MAX_WEIGHT) {
  return Array.from({ length: max }, (_, i) => i < weight);
}

/**
 * @param {object} state  Znormalizowany stan legendy
 * @param {object} env
 * @param {(key: string, data?: object) => string} env.t   Tłumaczenie klucza z przestrzeni CHAMPION
 * @param {object} env.content   Treści generatorów w języku świata
 * @param {{name: string, img: string}} env.actor
 * @param {boolean} env.isGM
 * @param {boolean} env.canEdit
 * @param {*} env.sessionId
 * @param {number} env.now   Czas świata (sekundy)
 * @param {number} [env.secondsPerDay]
 * @param {(ts: number) => string} env.formatDate
 * @param {string} env.activeTab
 * @param {boolean} [env.combatAvailable]
 */
export function buildViewModel(state, env) {
  const t = env.t;
  const faceLabel = face => t(`Face.${face}.Name`);
  const circleLabel = circle => t(`Circle.${circle}`);
  const weightLabel = w => (w >= 1 ? t(`Weight.${w}`) : t("Weight.0"));

  /* ---------- Sława i Imię ---------- */
  const fameValue = R.fame(state);
  const tier = R.tierProgress(fameValue);
  const status = R.nameStatus(state);
  const peopleEpithet = status.peopleFace
    ? (status.peopleFace === status.declaredFace && status.declared ? status.declared : env.content.epithets[status.peopleFace][0])
    : "";
  let nameState = "none";
  if (status.declared && status.peopleFace) {
    if (status.accepted) nameState = "accepted";
    else if (status.peopleFace === status.declaredFace) nameState = "aligned";
    else nameState = "drift";
  } else if (status.declared) nameState = "unknown";

  const reward = R.nameCallReward(status);
  const header = {
    actorName: env.actor.name,
    img: env.actor.img,
    declared: status.declared,
    declaredFace: status.declaredFace,
    declaredFaceLabel: faceLabel(status.declaredFace),
    declaredFaceIcon: R.FACE_ICON[status.declaredFace],
    peopleFace: status.peopleFace,
    peopleFaceLabel: status.peopleFace ? faceLabel(status.peopleFace) : "",
    peopleFaceIcon: status.peopleFace ? R.FACE_ICON[status.peopleFace] : "",
    peopleEpithet,
    nameState,
    nameStateLabel: t(`Name.State.${nameState}`, { epithet: peopleEpithet, face: status.peopleFace ? faceLabel(status.peopleFace) : "" }),
    canCallName: env.canEdit && R.canCallName(state, env.sessionId),
    nameCalled: state.nameCalledSession === env.sessionId && state.nameCalledSession !== null,
    callNameHint: t(reward.fortune ? "Name.CallHintAccepted" : "Name.CallHint"),
    fame: fameValue,
    tier: tier.tier,
    tierName: t(`Tier.${tier.tier}.Name`),
    tierHint: t(`Tier.${tier.tier}.Hint`, { target: R.recognitionTarget(tier.tier), echo: R.echoTarget(tier.tier) }),
    nextLabel: tier.next === null ? t("Header.MaxTier") : t("Header.NextTier", { next: tier.next, missing: tier.next - fameValue }),
    tierRing: tierRingSVG(tier.progress, tier.tier),
    laurel: laurelSVG(tier.tier),
    homeland: state.homeland,
    fallen: state.fallen,
    heirOf: state.heirOf
  };

  /* ---------- Zakładki ---------- */
  const openPetitions = state.petitions.filter(p => p.status === "open").length;
  const tabs = TAB_IDS.map(id => ({
    id,
    icon: TAB_ICON[id],
    label: t(`Tabs.${id}`),
    active: env.activeTab === id,
    badge: id === "petitions" && openPetitions ? openPetitions : (id === "arena" && state.duel ? "!" : null)
  }));

  /* ---------- Legenda ---------- */
  const taleView = tale => ({
    ...tale,
    faceLabel: faceLabel(tale.face),
    faceIcon: R.FACE_ICON[tale.face],
    tone: R.taleTone(tale),
    circleLabel: circleLabel(tale.circle),
    circleIcon: R.CIRCLE_ICON[tale.circle],
    seals: seals(tale.weight),
    weightLabel: weightLabel(tale.weight),
    reachLabel: tale.weight >= 1 ? t(`WeightReach.${tale.weight}`) : "",
    displayTitle: tale.title || t("Legend.Untitled"),
    canInvoke: env.canEdit && R.canInvoke(tale, env.sessionId) && !state.fallen,
    invoked: tale.invokedSession === env.sessionId && tale.invokedSession !== null,
    bonus: R.invokeBonus(tale),
    refuteMod: R.refuteModifier(tale),
    skillsLabel: R.invokeSkills(tale).map(s => t(`Skill.${s}`)).join(", ")
  });
  const sorted = [...state.tales].sort((a, b) => b.weight - a.weight || b.created - a.created);
  const liveTales = sorted.filter(tl => tl.weight >= 1).map(taleView);
  const fadedTales = sorted.filter(tl => tl.weight < 1).map(taleView);

  const circleTotals = R.circleTotals(state);
  const legend = {
    ripples: ripplesSVG(state, {
      title: t("Legend.RipplesTitle"),
      circles: Object.fromEntries(R.CIRCLES.map(c => [c, circleLabel(c)])),
      rings: [t("WeightReach.1"), t("WeightReach.2"), t("WeightReach.3")],
      weights: [1, 2, 3].map(weightLabel),
      homeland: state.homeland,
      untitled: t("Legend.Untitled")
    }),
    radar: facesRadarSVG(status.totals, {
      declaredFace: status.declaredFace,
      peopleFace: status.peopleFace,
      labels: Object.fromEntries(R.FACES.map(face => [face, faceLabel(face)])),
      title: t("Legend.RadarTitle")
    }),
    circles: R.CIRCLES.map(c => ({
      id: c,
      label: circleLabel(c),
      icon: R.CIRCLE_ICON[c],
      ...circleTotals[c],
      rest: Math.max(...R.CIRCLES.map(x => circleTotals[x].total), 1) - circleTotals[c].total
    })),
    tales: liveTales,
    faded: fadedTales,
    hasTales: liveTales.length > 0,
    taleCount: liveTales.length
  };

  /* ---------- Prośby ---------- */
  const spd = env.secondsPerDay || 86400;
  const petitionView = p => {
    const days = R.daysLeft(p, env.now, spd);
    let deadlineLabel = t("Petitions.NoDeadline");
    let urgency = "";
    if (days !== null) {
      if (days < 0) { deadlineLabel = t("Petitions.Overdue", { days: -days }); urgency = "is-overdue"; }
      else if (days === 0) { deadlineLabel = t("Petitions.Today"); urgency = "is-urgent"; }
      else { deadlineLabel = t("Petitions.DaysLeft", { days }); urgency = days <= 2 ? "is-urgent" : ""; }
    }
    return {
      ...p,
      circleLabel: circleLabel(p.circle),
      circleIcon: R.CIRCLE_ICON[p.circle],
      seals: seals(p.stake),
      stakeLabel: t(`Petitions.Stake.${p.stake}`),
      statusLabel: t(`Petitions.Status.${p.status}`),
      deadlineLabel,
      urgency,
      tilt: tilt(p.id),
      resolvedLabel: p.resolved ? env.formatDate(p.resolved) : ""
    };
  };
  const promises = R.promisesCount(state);
  const petitions = {
    open: state.petitions.filter(p => p.status === "open").map(petitionView),
    accepted: state.petitions.filter(p => p.status === "accepted").map(petitionView),
    archive: state.petitions.filter(p => ["fulfilled", "failed", "declined"].includes(p.status)).map(petitionView).reverse(),
    promises,
    promiseSlots: Array.from({ length: R.MAX_PROMISES }, (_, i) => i < promises),
    canAccept: R.canAccept(state),
    max: R.MAX_PROMISES
  };
  petitions.isEmpty = !petitions.open.length && !petitions.accepted.length;

  /* ---------- Rywale ---------- */
  const rivalView = r => ({
    ...r,
    flames: Array.from({ length: R.MAX_GRUDGE }, (_, i) => i < r.grudge),
    statusLabel: t(`Rivals.Status.${r.status}`),
    grudgeLabel: t(`Rivals.Grudge.${r.grudge}`),
    recordLabel: `${r.record.wins}–${r.record.losses}–${r.record.draws}`,
    canChallenge: r.status !== "dead" && !state.duel,
    img: r.img || "icons/svg/mystery-man.svg"
  });
  const rivals = {
    list: state.rivals.map(rivalView).sort((a, b) => (a.status === "dead") - (b.status === "dead") || b.grudge - a.grudge),
    isEmpty: state.rivals.length === 0
  };

  /* ---------- Arena ---------- */
  let arena = { duel: null, canStart: env.canEdit && !state.fallen, rivals: rivals.list.filter(r => r.status !== "dead") };
  if (state.duel) {
    const d = state.duel;
    const rival = state.rivals.find(r => r.id === d.rivalId);
    const stageIndex = R.DUEL_STAGES.indexOf(d.stage);
    const favour = R.crowdFavours(d.crowd);
    const seconds = R.SECOND_ROLE_IDS.map(role => {
      const s = d.seconds[role];
      const cfg = R.SECOND_ROLES[role];
      let resultText = "";
      if (s.result) resultText = t(`Arena.Role.${role}.${s.result.success ? "Success" : "Failure"}`, {
        sl: s.result.sl >= 0 ? `+${s.result.sl}` : s.result.sl,
        edges: d.edges.filter(e => e.kind === "weakness").length,
        crowd: d.crowd,
        odds: d.odds,
        negated: d.negatedEdges,
        heal: d.surgeonHeal
      });
      return {
        role,
        icon: cfg.icon,
        label: t(`Arena.Role.${role}.Name`),
        effect: t(`Arena.Role.${role}.Effect`),
        skillLabel: t(`Skill.${cfg.skill}`),
        assigned: !!s.name,
        name: s.name,
        img: s.img || "icons/svg/mystery-man.svg",
        result: s.result,
        slLabel: s.result ? (s.result.sl >= 0 ? `+${s.result.sl}` : `${s.result.sl}`) : "",
        resultText,
        canRoll: !!s.name && !s.result && d.stage === "prep",
        canClear: env.canEdit && d.stage === "prep"
      };
    });
    const rivalEdgeChips = Array.from({ length: d.rivalEdges }, (_, i) => ({ negated: i < d.negatedEdges }));
    arena = {
      ...arena,
      duel: {
        ...d,
        rival: rival ? rivalView(rival) : { name: t("Arena.UnknownRival"), img: "icons/svg/mystery-man.svg", title: "" },
        champion: { name: env.actor.name, img: env.actor.img, epithet: peopleEpithet || status.declared },
        termsLabel: t(`Arena.Terms.${d.terms}`),
        audienceLabel: t(`Arena.Audience.${d.audience}`),
        stages: R.DUEL_STAGES.map((id, i) => ({
          id,
          icon: STAGE_ICON[id],
          label: t(`Arena.Stage.${id}`),
          state: i < stageIndex ? "done" : (i === stageIndex ? "current" : "todo")
        })),
        stageHelp: t(`Arena.StageHelp.${d.stage}`),
        isChallenge: d.stage === "challenge",
        isPrep: d.stage === "prep",
        isFight: d.stage === "fight",
        isAftermath: d.stage === "aftermath",
        canBack: stageIndex > 0 && d.stage !== "aftermath",
        canNext: stageIndex < R.DUEL_STAGES.length - 1,
        nextLabel: stageIndex < R.DUEL_STAGES.length - 1 ? t(`Arena.Next.${R.DUEL_STAGES[stageIndex + 1]}`) : "",
        seconds,
        edges: d.edges.map(e => ({ ...e, label: t(`Arena.Edge.${e.kind}`) })),
        hasEdges: d.edges.length > 0,
        rivalEdgeChips,
        activeRivalEdges: R.activeRivalEdges(d),
        crowdGauge: crowdGaugeSVG(d.crowd, { labels: { title: t("Arena.Crowd"), left: t("Arena.CrowdRival"), right: t("Arena.CrowdChampion") } }),
        crowdMood: t(`Arena.Mood.${d.crowd}`),
        crowdFavour: favour ? t(`Arena.Favour.${favour}`) : t("Arena.Favour.none"),
        crowdFavourClass: favour ?? "none",
        oddsLabel: d.odds ? `${d.odds}:1` : "",
        weightPreview: weightLabel(R.duelWeight(d.audience, d.crowd)),
        combatLinked: !!d.combatId,
        combatAvailable: !!env.combatAvailable
      }
    };
  }

  /* ---------- Kronika ---------- */
  const chronicle = {
    entries: [...state.chronicle].reverse().map(e => ({ ...e, dateLabel: e.ts ? env.formatDate(e.ts) : "" })),
    isEmpty: state.chronicle.length === 0
  };

  return {
    env: { isGM: env.isGM, canEdit: env.canEdit, activeTab: env.activeTab },
    header,
    tabs,
    legend,
    petitions,
    arena,
    rivals,
    chronicle,
    fallen: state.fallen,
    faces: R.FACES.map(face => ({ id: face, label: faceLabel(face), icon: R.FACE_ICON[face], tone: R.FACE_TONE[face] })),
    circles: R.CIRCLES.map(c => ({ id: c, label: circleLabel(c), icon: R.CIRCLE_ICON[c] }))
  };
}
