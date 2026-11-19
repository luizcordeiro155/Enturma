// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  lerp,
  smooth,
  easeOutCubic,
  easeOutBack,
  rng,
  rectLoop,
  circleLoop,
  Particles,
  glow,
  Layer,
  sprite,
  stamp,
} from "../kit";

// ---------- Sakura ----------
const SK = {
  ink: "#4b1532",
  bark: "#5a323d",
  barkDark: "#2e1620",
  barkLight: "#a8747b",
  petal: "#ffc4d9",
  petalLight: "#fff4f8",
  petalDeep: "#f47fa9",
  core: "#c2255c",
  stamen: "#ffe38a",
  leaf: "#9cc27a",
  leafDark: "#3d6a48",
};

// Art that repeats many times is painted once and stamped.

function petalPath(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(r * 0.16, -r * 0.5, r * 0.8, -r * 0.64, r * 0.98, -r * 0.2);
  ctx.lineTo(r * 0.8, 0);
  ctx.lineTo(r * 0.98, r * 0.2);
  ctx.bezierCurveTo(r * 0.8, r * 0.64, r * 0.16, r * 0.5, 0, 0);
  ctx.closePath();
}
function drawBlossom(ctx, r, deep) {
  ctx.lineJoin = "round";
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i * TAU) / 5 - Math.PI / 2);
    petalPath(ctx, r);
    const g = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r);
    g.addColorStop(0, deep ? "#ee5c8f" : SK.petalDeep);
    g.addColorStop(0.42, deep ? "#ff9fc0" : SK.petal);
    g.addColorStop(1, deep ? "#ffdbe8" : SK.petalLight);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = SK.ink;
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.24, 0);
    ctx.lineTo(r * 0.68, 0);
    ctx.strokeStyle = "rgba(194,37,92,.42)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < 10; i++) {
    const a = (i * TAU) / 10 + 0.3,
      l = r * (0.27 + (i % 3) * 0.075),
      x = Math.cos(a) * l,
      y = Math.sin(a) * l;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.strokeStyle = SK.core;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 1.1, 0, TAU);
    ctx.fillStyle = SK.stamen;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.1, 0, TAU);
  ctx.fillStyle = SK.core;
  ctx.fill();
}
function drawLoosePetal(ctx, r) {
  ctx.translate(-r * 0.5, 0);
  petalPath(ctx, r);
  const g = ctx.createLinearGradient(0, 0, r, 0);
  g.addColorStop(0, SK.petalDeep);
  g.addColorStop(0.5, SK.petal);
  g.addColorStop(1, SK.petalLight);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(75,21,50,.55)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
}
function sakuraLeaf(ctx, len) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -len * 0.34, len, 0);
  ctx.quadraticCurveTo(len * 0.45, len * 0.34, 0, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -len * 0.3, 0, len * 0.3);
  g.addColorStop(0, "#c7dc8a");
  g.addColorStop(1, SK.leaf);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = SK.leafDark;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, 0);
  ctx.lineTo(len * 0.86, 0);
  ctx.lineWidth = 0.7;
  ctx.stroke();
}
function sakuraBud(ctx, s) {
  ctx.beginPath();
  ctx.ellipse(s * 0.9, 0, s, s * 0.62, 0, 0, TAU);
  ctx.fillStyle = "#ee5c8f";
  ctx.fill();
  ctx.strokeStyle = SK.ink;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.quadraticCurveTo(s * 0.8, 0, 0, s * 0.5);
  ctx.closePath();
  ctx.fillStyle = "#7a9a55";
  ctx.fill();
  ctx.stroke();
}

// A branch that follows a loop clockwise from s0, with twigs, buds, leaves and blossoms.
function Branch(loop, s0, len, o) {
  const R = rng(o.seed),
    n = Math.ceil(len / 5),
    pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n,
      p = loop.at(s0 + u * len);
    const off =
      o.off +
      Math.sin(u * o.waves * TAU + o.phase) * o.amp +
      Math.sin(u * 23 + o.phase * 2) * o.amp * 0.3 +
      (o.swoop || 0) * (1 - smooth(u / 0.075));
    pts.push({
      x: p.x + p.nx * off,
      y: p.y + p.ny * off,
      nx: p.nx,
      ny: p.ny,
      tx: p.tx,
      ty: p.ty,
      u,
      hw: lerp(o.w0, o.w1, Math.pow(u, 0.8)),
    });
  }
  const pointAt = (u) => pts[Math.round(clamp(u) * n)];
  const hot = (u) =>
    (o.hot || []).reduce(
      (m, c) => Math.max(m, Math.exp(-Math.pow((u - c) / 0.06, 2))),
      0,
    );
  const twigs = [],
    blooms = [];
  const bloom = (x, y, u, delay, r) =>
    blooms.push({
      x,
      y,
      u,
      delay,
      r,
      rot: R() * TAU,
      deep: R() < 0.3,
      ph: R() * TAU,
    });
  let u = o.first || 0.09;
  while (u < 0.985) {
    const p = pointAt(u),
      h = hot(u),
      inward = R() < (o.inward || 0),
      side = inward ? -1 : 1;
    const a = 0.5 + R() * 0.65,
      L = inward
        ? o.twig[0] * 0.45
        : (o.twig[0] + R() * o.twig[1]) * lerp(1, 0.62, u) * (1 + h * 0.45);
    const dx = p.tx * Math.cos(a) + p.nx * side * Math.sin(a),
      dy = p.ty * Math.cos(a) + p.ny * side * Math.sin(a);
    const x2 = p.x + dx * L,
      y2 = p.y + dy * L,
      cx = p.x + (p.tx * 0.34 + p.nx * side * 0.34) * L,
      cy = p.y + (p.ty * 0.34 + p.ny * side * 0.34) * L;
    const q = (k) => ({
      x: (1 - k) * (1 - k) * p.x + 2 * (1 - k) * k * cx + k * k * x2,
      y: (1 - k) * (1 - k) * p.y + 2 * (1 - k) * k * cy + k * k * y2,
    });
    twigs.push({
      u,
      x0: p.x,
      y0: p.y,
      cx,
      cy,
      x2,
      y2,
      q,
      w: Math.max(0.7, p.hw * 0.5),
      leaf:
        R() < 0.62
          ? Math.atan2(dy, dx) + (R() < 0.5 ? 1 : -1) * (0.5 + R() * 0.5)
          : null,
      leafLen: o.leaf * (0.75 + R() * 0.5),
      bud:
        !inward && R() < 0.45 ? Math.atan2(dy, dx) + (R() - 0.5) * 1.6 : null,
    });
    const big =
      (o.bloom[0] + R() * o.bloom[1]) * lerp(1.08, 0.74, u) * (1 + h * 0.2);
    bloom(x2, y2, u, 0.3, inward ? big * 0.62 : big);
    if (!inward && L > o.twig[0] * 1.15) {
      const m = q(0.52);
      bloom(m.x + (R() - 0.5) * 5, m.y + (R() - 0.5) * 5, u, 0.18, big * 0.76);
    }
    if (!inward && L > o.twig[0] * 1.7 && R() < 0.75) {
      const m = q(0.24);
      bloom(m.x + (R() - 0.5) * 6, m.y + (R() - 0.5) * 6, u, 0.1, big * 0.6);
    }
    u += (o.gap[0] + R() * o.gap[1]) * (1 - h * 0.45);
  }
  for (let v = 0.13; v < 0.99; v += o.gap[0] * 0.9 + R() * o.gap[1]) {
    const p = pointAt(v),
      d = (R() - 0.25) * o.bloom[0] * 0.9;
    bloom(
      p.x + p.nx * d,
      p.y + p.ny * d,
      v,
      0.08 + R() * 0.2,
      (o.bloom[0] * 0.62 + R() * o.bloom[1] * 0.6) * lerp(1.05, 0.7, v),
    );
  }
  blooms.sort((a, b) => a.r - b.r);
  const back = [];
  if (o.depth)
    for (const f of blooms) {
      if (R() < 0.7)
        back.push({
          x: f.x + (R() - 0.5) * 22,
          y: f.y + (R() - 0.5) * 22,
          u: f.u,
          delay: f.delay + 0.1,
          r: f.r * (0.7 + R() * 0.4),
          rot: R() * TAU,
          ph: R() * TAU,
        });
    }
  return { pts, n, twigs, blooms, back };
}

function drawBranch(ctx, b, g, t, when, sprA, sprB) {
  // far blossoms and a haze of pink behind the branch give the canopy depth
  for (const f of b.back) {
    const open = clamp((t - when(f.u) - f.delay - 0.22) / 0.6);
    if (open <= 0) continue;
    ctx.globalAlpha = open;
    glow(ctx, f.x, f.y, f.r * 1.9, "rgba(244,127,169,.2)");
    ctx.globalAlpha = 0.78 * open;
    stamp(
      ctx,
      sprB,
      f.x,
      f.y,
      (f.r / 20) * easeOutBack(open),
      f.rot + Math.sin(t * 0.9 + f.ph) * 0.07,
    );
  }
  ctx.globalAlpha = 1;
  const last = Math.min(b.n, Math.floor(g * b.n));
  if (last >= 2) {
    const P = [];
    for (let i = 0; i <= last; i++) {
      const p = b.pts[i];
      P.push({
        x: p.x,
        y: p.y,
        nx: p.nx,
        ny: p.ny,
        hw: p.hw * clamp((g - p.u) * 16 + 0.14),
      });
    }
    const body = (extra) => {
      ctx.beginPath();
      P.forEach((p, i) => {
        const d = p.hw + extra,
          x = p.x + p.nx * d,
          y = p.y + p.ny * d;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i],
          d = p.hw + extra;
        ctx.lineTo(p.x - p.nx * d, p.y - p.ny * d);
      }
      ctx.closePath();
    };
    body(1.3);
    ctx.fillStyle = SK.ink;
    ctx.fill();
    body(0);
    ctx.fillStyle = SK.bark;
    ctx.fill();
    ctx.beginPath();
    P.forEach((p, i) => {
      const d = p.hw * 0.42,
        x = p.x + p.nx * d,
        y = p.y + p.ny * d;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.strokeStyle = SK.barkLight;
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = 0.75;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = SK.barkDark;
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    for (let i = 6; i < P.length - 2; i += 9) {
      const p = P[i];
      if (p.hw < 2.4) break;
      ctx.beginPath();
      ctx.moveTo(p.x - p.nx * p.hw * 0.7, p.y - p.ny * p.hw * 0.7);
      ctx.lineTo(p.x + p.nx * p.hw * 0.05, p.y + p.ny * p.hw * 0.05);
      ctx.stroke();
    }
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const w of b.twigs) {
    const k = clamp((t - when(w.u)) / 0.4);
    if (k <= 0) continue;
    const steps = Math.max(2, Math.ceil(8 * k)),
      path = () => {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const p = w.q((i / steps) * k);
          if (i) ctx.lineTo(p.x, p.y);
          else ctx.moveTo(p.x, p.y);
        }
      };
    path();
    ctx.strokeStyle = SK.ink;
    ctx.lineWidth = w.w * 2 + 2.2;
    ctx.stroke();
    path();
    ctx.strokeStyle = SK.bark;
    ctx.lineWidth = w.w * 2;
    ctx.stroke();
    const e = easeOutBack(clamp((t - when(w.u) - 0.3) / 0.45));
    if (e > 0 && w.leaf !== null) {
      const m = w.q(0.38);
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(w.leaf + Math.sin(t * 1.4 + w.u * 30) * 0.08);
      ctx.scale(e, e);
      sakuraLeaf(ctx, w.leafLen);
      ctx.restore();
    }
    if (e > 0 && w.bud !== null) {
      const m = w.q(0.72);
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(w.bud);
      ctx.scale(e, e);
      sakuraBud(ctx, Math.max(2, w.leafLen * 0.26));
      ctx.restore();
    }
  }
  for (const f of b.blooms) {
    const open = clamp((t - when(f.u) - f.delay - 0.22) / 0.5);
    if (open <= 0) continue;
    stamp(
      ctx,
      f.deep ? sprB : sprA,
      f.x,
      f.y,
      (f.r / 20) * easeOutBack(open) * (1 + Math.sin(t * 1.7 + f.ph) * 0.025),
      f.rot + Math.sin(t * 1.1 + f.ph) * 0.09,
    );
  }
}

// Mejiro: the little white-eye that visits the blossoms. Drawn facing +x, standing on (0,0).
function mejiro(ctx, t, look, blink) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#5a4636";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-1, -5);
  ctx.lineTo(-2, 0);
  ctx.moveTo(3, -5);
  ctx.lineTo(3.5, 0);
  ctx.stroke();
  ctx.save();
  ctx.translate(-9, -9);
  ctx.rotate(0.25 + Math.sin(t * 2) * 0.05);
  ctx.beginPath();
  ctx.moveTo(0, -2.6);
  ctx.lineTo(-13, -1.5);
  ctx.lineTo(-12.5, 3);
  ctx.lineTo(0, 2.6);
  ctx.closePath();
  ctx.fillStyle = "#5c7f2a";
  ctx.fill();
  ctx.strokeStyle = SK.ink;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(0, -11, 11, 8.6, -0.18, 0, TAU);
  const g = ctx.createLinearGradient(0, -20, 0, -3);
  g.addColorStop(0, "#b7d34a");
  g.addColorStop(0.6, "#8fb536");
  g.addColorStop(1, "#f6f1d6");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = SK.ink;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8, -13);
  ctx.quadraticCurveTo(-2, -18, 5, -12);
  ctx.quadraticCurveTo(-1, -6.5, -9, -9);
  ctx.closePath();
  ctx.fillStyle = "#6f9a2e";
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(8, -17);
  ctx.rotate(look);
  ctx.beginPath();
  ctx.arc(0, 0, 6.8, 0, TAU);
  ctx.fillStyle = "#b7d34a";
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, 3.4);
  ctx.quadraticCurveTo(4, 6.6, -3, 6);
  ctx.fillStyle = "#ffe066";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(5.8, -1.4);
  ctx.lineTo(11.5, 0.6);
  ctx.lineTo(5.8, 2);
  ctx.closePath();
  ctx.fillStyle = "#3b2f2a";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2.2, -1, 3.2, 0, TAU);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "rgba(75,21,50,.5)";
  ctx.lineWidth = 0.6;
  ctx.stroke();
  if (blink) {
    ctx.beginPath();
    ctx.moveTo(0.4, -1);
    ctx.lineTo(4, -1);
    ctx.strokeStyle = "#221";
    ctx.lineWidth = 1.1;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(2.4, -1, 1.6, 0, TAU);
    ctx.fillStyle = "#1c1410";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.9, -1.5, 0.55, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }
  ctx.restore();
}

// Kasumi: the flat mist bands of Japanese prints.
function kasumi(ctx, x, y, w, alpha, t) {
  ctx.save();
  ctx.translate(x + Math.sin(t * 0.35 + y) * 5, y);
  ctx.globalAlpha = alpha;
  const bar = (bx, by, bw, h) => {
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, h, h / 2);
    ctx.fill();
  };
  ctx.fillStyle = "#f7a8c8";
  bar(-w * 0.5, 0, w, 9);
  bar(-w * 0.28, -11, w * 0.62, 8);
  bar(-w * 0.42, 12, w * 0.5, 7);
  ctx.fillStyle = "#fff6fa";
  bar(-w * 0.44, 2, w * 0.7, 2.4);
  ctx.restore();
}

// Fūrin: a glass wind chime with its paper strip.
function furin(ctx, x, y, s, swing, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(swing);
  ctx.scale(s, s);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#f6dcc6";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, 24);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-16, 44);
  ctx.bezierCurveTo(-19, 20, 19, 20, 16, 44);
  ctx.quadraticCurveTo(0, 49, -16, 44);
  ctx.closePath();
  const g = ctx.createLinearGradient(-16, 22, 16, 48);
  g.addColorStop(0, "rgba(232,246,255,.82)");
  g.addColorStop(0.55, "rgba(190,224,250,.5)");
  g.addColorStop(1, "rgba(255,196,220,.6)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.95)";
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.strokeStyle = "#e64980";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-15.4, 42.5);
  ctx.quadraticCurveTo(0, 47.5, 15.4, 42.5);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = (i * TAU) / 5 - 1.2;
    ctx.beginPath();
    ctx.arc(-2 + Math.cos(a) * 3.4, 34 + Math.sin(a) * 3.4, 2.1, 0, TAU);
    ctx.fillStyle = "#f783ac";
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(-2, 34, 1.2, 0, TAU);
  ctx.fillStyle = "#fff3bf";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-8, 30, 2, 5, 0.5, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,.7)";
  ctx.fill();
  ctx.translate(0, 40);
  ctx.rotate(swing * 1.6 + Math.sin(t * 2.1) * 0.1);
  ctx.strokeStyle = "#f6dcc6";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 9, 2.6, 0, TAU);
  ctx.fillStyle = "#ffe066";
  ctx.fill();
  ctx.strokeStyle = SK.ink;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-7, 20, 14, 44, 2);
  ctx.fillStyle = "#fff6e6";
  ctx.fill();
  ctx.strokeStyle = "#e64980";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.strokeStyle = "rgba(230,73,128,.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3.5, 26);
  ctx.lineTo(-3.5, 58);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = (i * TAU) / 5;
    ctx.beginPath();
    ctx.arc(2 + Math.cos(a) * 2.6, 36 + Math.sin(a) * 2.6, 1.7, 0, TAU);
    ctx.fillStyle = "#f783ac";
    ctx.fill();
  }
  ctx.restore();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Sakura",
    reach: { top: 80, side: 64, bottom: 66 },
    mat: ["#2a1634", "#120f20"],
    theme: {
      "--card-bg":
        "linear-gradient(168deg,#3a1d44 0%,#241634 52%,#141226 100%)",
      "--card-banner":
        "linear-gradient(118deg,#ff8fb5 0%,#f9b4d0 42%,#a992e6 100%)",
      "--card-avatar": "#2a1632",
      "--card-avatar-ring": "#3d2046",
      "--card-button": "#d6457f",
      "--card-border": "rgba(255,190,214,.5)",
    },
    init() {
      const pad = 8,
        r = CARD.r + pad,
        top = CARD.w + pad * 2 - r * 2,
        side = CARD.h + pad * 2 - r * 2,
        arc = (r * Math.PI) / 2;
      this.loop = rectLoop(-pad, -pad, CARD.w + pad * 2, CARD.h + pad * 2, r);
      const len = 70 + arc + side + arc + top * 0.56,
        o = {
          off: 3,
          amp: 3.6,
          waves: 3.2,
          w0: 6.2,
          w1: 1,
          swoop: 46,
          twig: [26, 46],
          bloom: [11.5, 6.5],
          gap: [0.038, 0.042],
          leaf: 16,
          inward: 0.2,
          depth: true,
          hot: [(70 + arc / 2) / len, (70 + arc + side + arc / 2) / len],
        };
      this.A = Branch(
        this.loop,
        top + arc + side + arc + top - 70,
        len,
        Object.assign({ seed: 11, phase: 0.4 }, o),
      );
      this.B = Branch(
        this.loop,
        top - 70,
        len,
        Object.assign({ seed: 29, phase: 2.3 }, o),
      );
      this.corners = [
        this.A.pts[Math.round(o.hot[1] * this.A.n)],
        this.B.pts[Math.round(o.hot[1] * this.B.n)],
      ];
      const ring = circleLoop(77, 77, AVATAR.r + 5);
      this.W = Branch(ring, (200 / 360) * ring.L, (285 / 360) * ring.L, {
        seed: 41,
        phase: 1,
        off: 0,
        amp: 1.2,
        waves: 2,
        w0: 2.7,
        w1: 0.7,
        twig: [6, 7],
        bloom: [8.2, 3.6],
        gap: [0.06, 0.06],
        leaf: 8,
        inward: 0,
        first: 0.03,
      });
      this.t0 = 0.25;
      this.dur = 2.15;
      this.when = (u) =>
        this.t0 + this.dur * (1 - Math.pow(1 - clamp(u), 1 / 1.6));
      this.front = (t) =>
        1 - Math.pow(1 - clamp((t - this.t0) / this.dur), 1.6);
      this.wWhen = (u) => 0.35 + 1.25 * clamp(u);
      this.wFront = (t) => clamp((t - 0.35) / 1.25);
      this.spr = sprite(48, (x) => drawBlossom(x, 20, false));
      this.sprDeep = sprite(48, (x) => drawBlossom(x, 20, true));
      this.petal = sprite(24, (x) => drawLoosePetal(x, 16));
      this.petals = Particles();
      this.rand = rng(5);
      this.acc = 0;
      this.burst = false;
      this.nextGust = 9;
      const q = rng(77);
      this.gust = [];
      this.fall = [];
      this.still = [];
      for (let i = 0; i < 58; i++)
        this.gust.push({
          d: 0.12 + q() * 1.45,
          y0: -60 + q() * CARD.h * 0.86,
          dy: 70 + q() * 190,
          ph: q() * TAU,
          s: 0.42 + q() * 0.7,
          sp: 0.85 + q() * 0.7,
          vr: (q() - 0.5) * 9,
          fl: 4 + q() * 6,
        });
      for (let i = 0; i < 16; i++)
        this.fall.push({
          x: q() * CARD.w,
          y: q() * (CARD.h + 40),
          v: 15 + q() * 20,
          a: 8 + q() * 16,
          f: 0.6 + q() * 0.9,
          ph: q() * TAU,
          s: 0.38 + q() * 0.5,
          vr: (q() - 0.5) * 2.4,
          fl: 1.4 + q() * 2.6,
        });
    },
    reset() {
      this.petals.clear();
      this.rand = rng(5);
      this.acc = 0;
      this.burst = false;
      this.nextGust = 9;
    },
    emit(x, y, vx, vy, life, extra) {
      const R = this.rand;
      this.petals.add(
        Object.assign(
          {
            x,
            y,
            vx,
            vy,
            life,
            size: 0.42 + R() * 0.55,
            rot: R() * TAU,
            vr: (R() - 0.5) * 7,
            fl: 3 + R() * 5,
            phase: R() * TAU,
            drag: 1.1,
            g: 26,
          },
          extra,
        ),
      );
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand,
        g = this.front(t);
      if (g > 0 && g < 1) {
        this.acc += dt * 64;
        while (this.acc >= 1) {
          this.acc -= 1;
          for (const b of [this.A, this.B]) {
            const p = b.pts[Math.min(b.n, Math.floor(g * b.n))];
            this.emit(
              p.x + (R() - 0.5) * 10,
              p.y + (R() - 0.5) * 10,
              -p.tx * (20 + R() * 90) + p.nx * (R() * 90 - 10),
              -p.ty * (20 + R() * 90) + p.ny * (R() * 90 - 10),
              0.8 + R() * 1.1,
            );
          }
        }
      }
      if (!this.burst && t >= this.t0 + this.dur + 0.35) {
        this.burst = true;
        for (const c of this.corners)
          for (let i = 0; i < 34; i++) {
            const a = R() * TAU,
              v = 50 + R() * 150;
            this.emit(
              c.x + (R() - 0.5) * 30,
              c.y + (R() - 0.5) * 30,
              Math.cos(a) * v,
              Math.sin(a) * v,
              1 + R() * 1.4,
              { drag: 1.8 },
            );
          }
      }
      if (t > 3.2) {
        if (R() < dt * 1.5) {
          const b = R() < 0.5 ? this.A : this.B,
            f = b.blooms[Math.floor(R() * b.blooms.length)];
          this.emit(f.x, f.y, -6 - R() * 14, 6 + R() * 10, 3 + R() * 2.5, {
            drag: 0.2,
            g: 9,
            sway: 16,
            swayF: 1.4 + R(),
            size: 0.36 + R() * 0.4,
          });
        }
        if (t > this.nextGust) {
          this.nextGust = t + 8 + R() * 5;
          const c = this.corners[0];
          for (let i = 0; i < 16; i++)
            this.emit(
              c.x + (R() - 0.5) * 60,
              c.y + (R() - 0.5) * 50,
              70 + R() * 130,
              10 + R() * 60,
              1.6 + R() * 1.6,
              { drag: 0.7, g: 14 },
            );
        }
      }
      this.petals.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : smooth((t - 0.1) / 1.3);
      // the moon behind the branch that comes down the right side
      const mx = CARD.w + 30,
        my = -34;
      ctx.save();
      ctx.globalAlpha = a;
      glow(ctx, mx, my, 74 + Math.sin(tt * 0.9) * 3, "rgba(255,226,236,.42)");
      ctx.beginPath();
      ctx.arc(mx, my, 37, 0, TAU);
      const mg = ctx.createRadialGradient(mx - 10, my - 12, 4, mx, my, 38);
      mg.addColorStop(0, "#fffdf5");
      mg.addColorStop(0.7, "#ffeede");
      mg.addColorStop(1, "#ffd3de");
      ctx.fillStyle = mg;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.8)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "rgba(244,170,196,.32)";
      [
        [-12, -6, 7],
        [9, 8, 9.5],
        [10, -15, 4.5],
        [-6, 15, 5],
      ].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(mx + x, my + y, r, 0, TAU);
        ctx.fill();
      });
      ctx.restore();
      kasumi(ctx, CARD.w + 26, -4, 108, a * 0.78, tt);
      kasumi(ctx, -34, CARD.h + 40, 124, a * 0.62, tt + 3);
      const g = this.front(T);
      // Once in flower the branches only sway: painted a few times a second, stamped in between.
      const branches = (c) => {
        drawBranch(
          c,
          this.B,
          g,
          still ? 99 : t,
          this.when,
          this.spr,
          this.sprDeep,
        );
        drawBranch(
          c,
          this.A,
          g,
          still ? 99 : t,
          this.when,
          this.spr,
          this.sprDeep,
        );
      };
      if (!still && t > this.t0 + this.dur + 1.6)
        (this.rest || (this.rest = Layer())).draw(ctx, t, 10, branches);
      else branches(ctx);
      // the mejiro lands on the top branch once it has flowered, then looks around
      {
        const p = this.A.pts[Math.round(this.A.n * 0.88)],
          land = still ? 1 : clamp((t - 2.9) / 0.55);
        if (land > 0) {
          const c = tt % 5.2,
            hop =
              !still && c > 4.2 && c < 4.5
                ? Math.sin(((c - 4.2) / 0.3) * Math.PI) * 5
                : 0,
            look = still ? 0 : ((Math.floor(tt / 1.3) % 3) - 1) * 0.28,
            bl = !still && tt % 2.9 < 0.12;
          ctx.save();
          ctx.translate(
            p.x - (1 - easeOutCubic(land)) * 90,
            p.y - p.hw - 1 - (1 - easeOutBack(land)) * 70 - hop,
          );
          ctx.rotate((1 - land) * -0.5);
          ctx.scale(-1.05, 1.05);
          mejiro(ctx, tt, look, bl);
          ctx.restore();
        }
      }
      if (!still) {
        const k = (t - this.t0 - this.dur - 0.3) / 0.9;
        if (k > 0 && k < 1)
          for (const c of this.corners) {
            ctx.save();
            ctx.globalAlpha = (1 - k) * 0.75;
            ctx.strokeStyle = "#ffe3ee";
            ctx.lineWidth = 4 * (1 - k) + 1;
            ctx.beginPath();
            ctx.arc(c.x, c.y, 14 + easeOutCubic(k) * 84, 0, TAU);
            ctx.stroke();
            ctx.restore();
          }
        for (const p of this.petals.list) {
          ctx.globalAlpha =
            Math.min(1, p.age * 6) * Math.min(1, (p.life - p.age) * 2.2);
          stamp(
            ctx,
            this.petal,
            p.x,
            p.y,
            p.size,
            p.rot,
            Math.cos(p.age * p.fl + p.phase),
          );
        }
        ctx.globalAlpha = 1;
      }
    },
    drawAvatar(ctx, t, still) {
      const T = still ? 99 : t,
        a = still ? 1 : smooth(t / 0.7);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(77, 77, AVATAR.r + 3, 0, TAU);
      ctx.strokeStyle = "rgba(255,143,181,.4)";
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.strokeStyle = "#ffd0e0";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
      drawBranch(
        ctx,
        this.W,
        this.wFront(T),
        T,
        this.wWhen,
        this.spr,
        this.sprDeep,
      );
      if (!still && t > 2.4) {
        const c = (t - 2.4) % 3.4,
          f =
            this.W.blooms[
              this.W.blooms.length - 1 - (Math.floor((t - 2.4) / 3.4) % 4)
            ];
        if (c < 2.2) {
          ctx.globalAlpha = Math.min(1, c * 4) * clamp((2.2 - c) * 1.6);
          stamp(
            ctx,
            this.petal,
            f.x - 4 + Math.sin(c * 2.6) * 7 - c * 3,
            f.y + 6 + c * 15,
            0.44,
            c * 2.2,
            Math.cos(c * 4),
          );
          ctx.globalAlpha = 1;
        }
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t;
      const mist = ctx.createLinearGradient(0, CARD.h - 170, 0, CARD.h);
      mist.addColorStop(0, "rgba(255,143,181,0)");
      mist.addColorStop(
        1,
        `rgba(255,143,181,${0.2 + Math.sin(tt * 0.8) * 0.04})`,
      );
      ctx.fillStyle = mist;
      ctx.fillRect(0, CARD.h - 170, CARD.w, 170);
      if (!still) {
        const k = (t - 0.1) / 1.3;
        if (k > 0 && k < 1) {
          const r = lerp(40, 620, easeOutCubic(k)),
            g = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r);
          g.addColorStop(0, "rgba(255,240,246,0)");
          g.addColorStop(
            0.72,
            `rgba(255,214,230,${0.42 * Math.sin(k * Math.PI)})`,
          );
          g.addColorStop(1, "rgba(255,214,230,0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, CARD.w, CARD.h);
        }
        for (const p of this.gust) {
          const k2 = ((t - p.d) * p.sp) / 1.25;
          if (k2 <= 0 || k2 >= 1) continue;
          ctx.globalAlpha = Math.sqrt(Math.sin(k2 * Math.PI));
          stamp(
            ctx,
            this.petal,
            -24 + (CARD.w + 48) * k2,
            p.y0 + p.dy * k2 + Math.sin(k2 * TAU * 1.2 + p.ph) * 16,
            p.s,
            p.ph + t * p.vr,
            Math.cos(t * p.fl + p.ph),
          );
        }
      }
      const fa = still ? 0.8 : smooth((t - 1.5) / 1.2) * 0.9;
      if (fa > 0)
        for (const p of this.fall) {
          const y = ((p.y + tt * p.v) % (CARD.h + 40)) - 20,
            x =
              ((((p.x + Math.sin(tt * p.f + p.ph) * p.a - tt * 5) %
                (CARD.w + 30)) +
                CARD.w +
                30) %
                (CARD.w + 30)) -
              15;
          ctx.globalAlpha = fa;
          stamp(
            ctx,
            this.petal,
            x,
            y,
            p.s,
            p.ph + tt * p.vr,
            Math.cos(tt * p.fl + p.ph),
          );
        }
      ctx.globalAlpha = 1;
      const drop = still ? 1 : easeOutBack(clamp((t - 0.6) / 0.9)),
        sw = still
          ? 0.05
          : Math.sin(t * 3) * 0.32 * Math.exp(-t * 0.5) +
            Math.sin(t * 1.15) * 0.07;
      furin(ctx, CARD.w - 40, -96 + drop * 96, 0.86, sw, tt);
      if (!still)
        for (let i = 0; i < 2; i++) {
          const k = (t - 1.45 - i * 0.22) / 0.8;
          if (k > 0 && k < 1) {
            ctx.globalAlpha = (1 - k) * 0.7;
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(CARD.w - 40, 34, 20 + k * 22, -0.5, 0.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(CARD.w - 40, 34, 20 + k * 22, Math.PI - 0.5, Math.PI + 0.5);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
    },
  };
}
