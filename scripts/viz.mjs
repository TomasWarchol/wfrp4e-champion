/**
 * Legenda Szampierza – grafiki SVG budowane z danych (czyste funkcje zwracające tekst SVG).
 */

import { CIRCLES, FACES, MAX_TIER, CROWD_MIN, CROWD_MAX, taleTone } from "./rules.mjs";

const TAU = Math.PI * 2;

export function escapeXML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
}

const f = n => Number(n).toFixed(1);

/** Unikalny przyrostek identyfikatorów gradientów (kilka kart naraz, ukryte zakładki). */
const uid = () => Math.random().toString(36).slice(2, 8);

function polar(cx, cy, r, angle) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

/* -------------------------------------------- */
/*  Kręgi Sławy                                 */
/* -------------------------------------------- */

/**
 * Mapa rozchodzenia się legendy: trzy pierścienie (okolica / prowincja / Imperium)
 * pocięte na pięć kręgów społecznych; każda opowieść to punkt w swoim kręgu i pierścieniu Wagi.
 * @param {object} state
 * @param {object} labels  { circles: {id: label}, rings: [3 labels], homeland, weights: [..] }
 */
export function ripplesSVG(state, labels) {
  const u = uid();
  const size = 320, c = size / 2;
  const rings = [52, 92, 132];
  const bands = [30, 72, 112];
  const sector = TAU / CIRCLES.length;
  const start = -Math.PI / 2 - sector / 2;
  const totals = Object.fromEntries(CIRCLES.map(id => [id, 0]));
  const tales = state.tales.filter(t => t.weight >= 1);
  for (const t of tales) totals[t.circle] += t.weight;
  const maxTotal = Math.max(1, ...Object.values(totals));

  const parts = [];
  parts.push(`<svg class="lg-ripples" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeXML(labels.title)}">`);
  parts.push(`<defs>
    <radialGradient id="lgRipBg-${u}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3b2a1c" stop-opacity="0.95"/>
      <stop offset="70%" stop-color="#22170f" stop-opacity="0.98"/>
      <stop offset="100%" stop-color="#140d08"/>
    </radialGradient>
    <radialGradient id="lgDotBright-${u}" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#fff4c8"/><stop offset="55%" stop-color="#e2b54f"/><stop offset="100%" stop-color="#8a6420"/></radialGradient>
    <radialGradient id="lgDotDark-${u}" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#ffb3a1"/><stop offset="55%" stop-color="#b3261e"/><stop offset="100%" stop-color="#4a0b08"/></radialGradient>
    <filter id="lgGlow-${u}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`);
  parts.push(`<circle cx="${c}" cy="${c}" r="${rings[2] + 18}" fill="url(#lgRipBg-${u})" stroke="#8a6a2a" stroke-width="1.5"/>`);

  // Sektory kręgów (jasność wg Sławy w kręgu)
  CIRCLES.forEach((id, i) => {
    const a0 = start + i * sector, a1 = a0 + sector;
    const [x0, y0] = polar(c, c, rings[2], a0);
    const [x1, y1] = polar(c, c, rings[2], a1);
    const intensity = totals[id] / maxTotal;
    parts.push(`<path class="lg-sector" d="M${c},${c} L${f(x0)},${f(y0)} A${rings[2]},${rings[2]} 0 0 1 ${f(x1)},${f(y1)} Z" fill="#d9a441" fill-opacity="${f(0.04 + intensity * 0.2)}"><title>${escapeXML(labels.circles[id])}: ${totals[id]}</title></path>`);
    const [lx, ly] = polar(c, c, rings[2], a0);
    parts.push(`<line x1="${c}" y1="${c}" x2="${f(lx)}" y2="${f(ly)}" stroke="#c9a24a" stroke-opacity="0.25" stroke-dasharray="2 4"/>`);
  });

  // Pierścienie
  rings.forEach((r, i) => {
    parts.push(`<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#c9a24a" stroke-opacity="${f(0.55 - i * 0.12)}" stroke-width="${i === 2 ? 1.6 : 1}"/>`);
  });
  // Etykiety pierścieni na osi pionowej (dół)
  rings.forEach((r, i) => {
    parts.push(`<text class="lg-ring-label" x="${c}" y="${f(c + r - 4)}" text-anchor="middle">${escapeXML(labels.rings[i])}</text>`);
  });

  // Etykiety kręgów
  CIRCLES.forEach((id, i) => {
    const mid = start + (i + 0.5) * sector;
    const [x, y] = polar(c, c, rings[2] + 9, mid);
    const anchor = Math.abs(Math.cos(mid)) < 0.2 ? "middle" : (Math.cos(mid) > 0 ? "start" : "end");
    parts.push(`<text class="lg-circle-label" x="${f(x)}" y="${f(y + 3)}" text-anchor="${anchor}">${escapeXML(labels.circles[id])}</text>`);
  });

  // Pulsujące fale od miejsca pochodzenia
  parts.push(`<circle class="lg-pulse" cx="${c}" cy="${c}" r="${rings[0]}" fill="none" stroke="#f0d590"/>`);
  parts.push(`<circle class="lg-pulse lg-pulse--late" cx="${c}" cy="${c}" r="${rings[0]}" fill="none" stroke="#f0d590"/>`);

  // Punkty opowieści
  const byCircle = Object.fromEntries(CIRCLES.map(id => [id, []]));
  for (const t of tales) byCircle[t.circle].push(t);
  CIRCLES.forEach((id, i) => {
    const list = byCircle[id];
    const a0 = start + i * sector;
    const byWeight = [1, 2, 3].map(w => list.filter(t => t.weight === w));
    byWeight.forEach((group, wi) => {
      group.forEach((tale, k) => {
        const angle = a0 + sector * ((k + 1) / (group.length + 1));
        const jitter = ((k % 2) ? 6 : -6) * (group.length > 3 ? 1 : 0);
        const [x, y] = polar(c, c, bands[wi] + jitter, angle);
        const tone = taleTone(tale);
        const r = 4 + tale.weight * 1.6;
        const fill = tale.lie ? "none" : (tone === "dark" ? `url(#lgDotDark-${u})` : `url(#lgDotBright-${u})`);
        const stroke = tone === "dark" ? "#ff8f7a" : "#fff0b8";
        const dash = tale.lie ? ` stroke-dasharray="2 2"` : "";
        parts.push(`<circle class="lg-tale-dot lg-tone-${tone}" data-tale-id="${escapeXML(tale.id)}" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" stroke="${stroke}" stroke-width="1"${dash} filter="url(#lgGlow-${u})"><title>${escapeXML(tale.title || labels.untitled)} (${escapeXML(labels.weights[tale.weight - 1])})</title></circle>`);
      });
    });
  });

  // Środek: miejsce pochodzenia
  parts.push(`<circle cx="${c}" cy="${c}" r="15" fill="#140d08" stroke="#f0d590" stroke-width="1.5"/>`);
  parts.push(`<path d="M${c - 7},${c + 5} L${c - 7},${c - 1} L${c},${c - 7} L${c + 7},${c - 1} L${c + 7},${c + 5} Z" fill="#f0d590"/>`);
  if (labels.homeland) parts.push(`<text class="lg-home-label" x="${c}" y="${c - 22}" text-anchor="middle">${escapeXML(labels.homeland)}</text>`);
  parts.push(`</svg>`);
  return parts.join("");
}

/* -------------------------------------------- */
/*  Heksagon Obliczy                            */
/* -------------------------------------------- */

/**
 * Sześć obliczy legendy jako wykres radarowy. Gwiazda = oblicze deklarowane, poświata = oblicze ludu.
 */
export function facesRadarSVG(totals, { declaredFace, peopleFace, labels, title }) {
  const u = uid();
  const w = 300, h = 280, cx = w / 2, cy = h / 2 + 4, R = 96;
  const max = Math.max(6, ...FACES.map(face => totals[face] || 0));
  const angle = i => -Math.PI / 2 + (i * TAU) / FACES.length;
  const point = (i, value) => polar(cx, cy, R * value, angle(i));

  const parts = [`<svg class="lg-radar" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXML(title)}">`];
  parts.push(`<defs>
    <linearGradient id="lgRadarFill-${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e9c46a" stop-opacity="0.75"/><stop offset="100%" stop-color="#9b2c1f" stop-opacity="0.55"/></linearGradient>
    <filter id="lgRadarGlow-${u}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>`);
  // Siatka
  for (const level of [1 / 3, 2 / 3, 1]) {
    const pts = FACES.map((_, i) => point(i, level).map(f).join(",")).join(" ");
    parts.push(`<polygon points="${pts}" fill="${level === 1 ? "rgba(20,13,8,0.35)" : "none"}" stroke="#7a5c2e" stroke-opacity="${level === 1 ? 0.9 : 0.45}" stroke-width="${level === 1 ? 1.4 : 0.8}"/>`);
  }
  FACES.forEach((_, i) => {
    const [x, y] = point(i, 1);
    parts.push(`<line x1="${cx}" y1="${cy}" x2="${f(x)}" y2="${f(y)}" stroke="#7a5c2e" stroke-opacity="0.45" stroke-width="0.8"/>`);
  });
  // Wartości
  const pts = FACES.map((face, i) => point(i, Math.max(0.04, (totals[face] || 0) / max)).map(f).join(",")).join(" ");
  parts.push(`<polygon points="${pts}" fill="url(#lgRadarFill-${u})" stroke="#f0d590" stroke-width="1.6" filter="url(#lgRadarGlow-${u})" opacity="0.55"/>`);
  parts.push(`<polygon class="lg-radar-shape" points="${pts}" fill="url(#lgRadarFill-${u})" stroke="#f0d590" stroke-width="1.6"/>`);

  // Wierzchołki i etykiety
  FACES.forEach((face, i) => {
    const [vx, vy] = point(i, Math.max(0.04, (totals[face] || 0) / max));
    const isPeople = face === peopleFace;
    if (isPeople) parts.push(`<circle cx="${f(vx)}" cy="${f(vy)}" r="9" fill="#f0d590" opacity="0.45" class="lg-radar-people"/>`);
    parts.push(`<circle cx="${f(vx)}" cy="${f(vy)}" r="3.4" fill="${isPeople ? "#fff4c8" : "#e2b54f"}" stroke="#2b1d14" stroke-width="1"/>`);
    const [lx, ly] = point(i, 1.22);
    const anchor = Math.abs(lx - cx) < 8 ? "middle" : (lx > cx ? "start" : "end");
    const star = face === declaredFace ? "★ " : "";
    const cls = ["lg-radar-label", isPeople ? "is-people" : "", face === declaredFace ? "is-declared" : ""].join(" ").trim();
    parts.push(`<text class="${cls}" x="${f(lx)}" y="${f(ly + 4)}" text-anchor="${anchor}">${star}${escapeXML(labels[face])}<tspan class="lg-radar-value" dx="4">${totals[face] || 0}</tspan></text>`);
  });
  parts.push(`</svg>`);
  return parts.join("");
}

/* -------------------------------------------- */
/*  Wieniec laurowy i pierścień Poziomu         */
/* -------------------------------------------- */

/** Wieniec wokół portretu: im wyższy Poziom Sławy, tym wyżej sięgają liście. */
export function laurelSVG(tier) {
  const u = uid();
  const size = 150, c = size / 2, r = 66;
  const leavesPerSide = 3 + tier * 2;
  const span = (Math.PI * 0.18) + (Math.PI * 0.62) * (tier / MAX_TIER);
  const parts = [`<svg class="lg-laurel" viewBox="0 0 ${size} ${size}" aria-hidden="true">`];
  const leaf = (angle, side) => {
    const [x, y] = polar(c, c, r, angle);
    const rot = (angle * 180) / Math.PI + (side < 0 ? -40 : 220);
    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="7.5" ry="3.2" transform="rotate(${f(rot)} ${f(x)} ${f(y)})" fill="url(#lgLeaf-${u})" stroke="#5c4413" stroke-width="0.6"/>`;
  };
  parts.push(`<defs><linearGradient id="lgLeaf-${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fbe7a1"/><stop offset="50%" stop-color="#d4a640"/><stop offset="100%" stop-color="#7a5717"/></linearGradient></defs>`);
  for (let i = 0; i < leavesPerSide; i++) {
    const t = leavesPerSide === 1 ? 0 : i / (leavesPerSide - 1);
    const a = Math.PI / 2 + 0.25 + t * span; // lewa strona, od dołu w górę
    const b = Math.PI / 2 - 0.25 - t * span; // prawa strona
    parts.push(leaf(a, -1), leaf(b, 1));
  }
  // Wstążka na dole
  parts.push(`<path d="M${c - 16},${c + r + 2} q16,10 32,0 l6,10 l-10,-3 l-6,6 q-6,-5 -12,0 l-6,-6 l-10,3 z" fill="#8e1b1b" stroke="#4a0b08" stroke-width="0.8"/>`);
  parts.push(`</svg>`);
  return parts.join("");
}

/** Pierścień postępu do następnego Poziomu. */
export function tierRingSVG(progress, tier) {
  const u = uid();
  const size = 92, c = size / 2, r = 38;
  const circ = TAU * r;
  const dash = circ * Math.max(0, Math.min(1, progress));
  return `<svg class="lg-tier-ring" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <defs><linearGradient id="lgTierGrad-${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff0b8"/><stop offset="100%" stop-color="#b8862b"/></linearGradient></defs>
    <circle cx="${c}" cy="${c}" r="${r}" fill="#160f0a" stroke="#3d2c1c" stroke-width="7"/>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="url(#lgTierGrad-${u})" stroke-width="7" stroke-linecap="round" stroke-dasharray="${f(dash)} ${f(circ)}" transform="rotate(-90 ${c} ${c})" class="lg-tier-progress"/>
    <text x="${c}" y="${c + 12}" text-anchor="middle" class="lg-tier-num">${["0", "I", "II", "III", "IV"][tier] ?? tier}</text>
  </svg>`;
}

/* -------------------------------------------- */
/*  Wskaźnik Tłumu                              */
/* -------------------------------------------- */

export function crowdGaugeSVG(crowd, { labels }) {
  const u = uid();
  const w = 300, h = 170, cx = w / 2, cy = 150, R = 118;
  const steps = CROWD_MAX - CROWD_MIN; // 6
  const toAngle = v => Math.PI + ((v - CROWD_MIN) / steps) * Math.PI; // 180° → 360°
  const parts = [`<svg class="lg-crowd-gauge" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXML(labels.title)}">`];
  parts.push(`<defs>
    <linearGradient id="lgCrowdGrad-${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7a1410"/><stop offset="45%" stop-color="#5a4a3a"/><stop offset="55%" stop-color="#5a4a3a"/><stop offset="100%" stop-color="#e2b54f"/></linearGradient>
    <filter id="lgNeedleGlow-${u}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>`);
  const [ax, ay] = polar(cx, cy, R, Math.PI);
  const [bx, by] = polar(cx, cy, R, TAU);
  parts.push(`<path d="M${f(ax)},${f(ay)} A${R},${R} 0 0 1 ${f(bx)},${f(by)}" fill="none" stroke="#120c08" stroke-width="26" stroke-linecap="round"/>`);
  parts.push(`<path d="M${f(ax)},${f(ay)} A${R},${R} 0 0 1 ${f(bx)},${f(by)}" fill="none" stroke="url(#lgCrowdGrad-${u})" stroke-width="18" stroke-linecap="round"/>`);
  for (let v = CROWD_MIN; v <= CROWD_MAX; v++) {
    const a = toAngle(v);
    const [x1, y1] = polar(cx, cy, R - 16, a);
    const [x2, y2] = polar(cx, cy, R + 13, a);
    const [tx, ty] = polar(cx, cy, R + 24, a);
    parts.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="#f0d590" stroke-opacity="${v === 0 ? 0.9 : 0.45}" stroke-width="${v === 0 ? 2 : 1}"/>`);
    parts.push(`<text class="lg-gauge-tick${v === crowd ? " is-current" : ""}" x="${f(tx)}" y="${f(ty + 4)}" text-anchor="middle">${v > 0 ? "+" + v : v}</text>`);
  }
  const a = toAngle(crowd);
  const [nx, ny] = polar(cx, cy, R - 8, a);
  parts.push(`<line x1="${cx}" y1="${cy}" x2="${f(nx)}" y2="${f(ny)}" stroke="#fff0b8" stroke-width="5" stroke-linecap="round" filter="url(#lgNeedleGlow-${u})" opacity="0.6"/>`);
  parts.push(`<line class="lg-needle" x1="${cx}" y1="${cy}" x2="${f(nx)}" y2="${f(ny)}" stroke="#fff0b8" stroke-width="3" stroke-linecap="round"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="10" fill="#2b1d14" stroke="#c9a24a" stroke-width="2"/>`);
  parts.push(`<text class="lg-gauge-side lg-gauge-side--left" x="${f(ax + 6)}" y="${cy + 18}" text-anchor="start">${escapeXML(labels.left)}</text>`);
  parts.push(`<text class="lg-gauge-side lg-gauge-side--right" x="${f(bx - 6)}" y="${cy + 18}" text-anchor="end">${escapeXML(labels.right)}</text>`);
  parts.push(`</svg>`);
  return parts.join("");
}
