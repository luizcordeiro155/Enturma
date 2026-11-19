// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
import {
  TAU,
  clamp,
  lerp,
  smooth,
  easeOutCubic,
  easeOutBack,
  easeInOut,
  rng,
  rectLoop,
  Particles,
  glow,
} from "../kit";

// ---------- Noite das Abóboras ----------
const HW = {
  ink: "#1c0d26",
  orange: "#ff8a1f",
  orangeDark: "#c2500c",
  orangeLight: "#ffb85c",
  purple: "#6b44a6",
  purpleDark: "#2a1840",
  green: "#6aa83f",
  greenDark: "#27501f",
  bone: "#f6f1e7",
};
const inked = (ctx, fill, lw = 1.6, ink = HW.ink) => {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = ink;
  ctx.lineJoin = "round";
  ctx.stroke();
};
const bounceOut = (t) => {
  t = clamp(t);
  const n = 7.5625,
    d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

// A jack-o'-lantern around (0,0). `lit` goes from 0 (dark) to 1 (candle inside); `face` picks the carving.
function pumpkin(ctx, r, lit, t, face, wink = 0) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const fl = 0.86 + 0.14 * Math.sin(t * 11 + r) * Math.sin(t * 7.3 + face);
  if (lit > 0)
    glow(ctx, 0, r * 0.1, r * 2.3, `rgba(255,150,40,${0.34 * lit * fl})`);
  // stem and a curl of vine
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.8);
  ctx.quadraticCurveTo(-r * 0.08, -r * 1.1, r * 0.2, -r * 1.2);
  ctx.lineTo(r * 0.34, -r * 1.06);
  ctx.quadraticCurveTo(r * 0.14, -r * 1.0, r * 0.14, -r * 0.78);
  ctx.closePath();
  {
    const g = ctx.createLinearGradient(0, -r * 1.2, 0, -r * 0.78);
    g.addColorStop(0, "#8cc152");
    g.addColorStop(1, HW.greenDark);
    inked(ctx, g, 1.6);
  }
  ctx.beginPath();
  for (let a = 0; a < 7; a += 0.3) {
    const rr = r * 0.16 * (1 - a / 8.4),
      x = -r * 0.34 + Math.cos(a + 0.4) * rr,
      y = -r * 0.98 + Math.sin(a + 0.4) * rr;
    if (a) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.strokeStyle = HW.green;
  ctx.lineWidth = Math.max(1.2, r * 0.05);
  ctx.stroke();
  // ribs, back to front
  [
    [-0.6, 0.44, 0.78, 0],
    [0.6, 0.44, 0.78, 0],
    [-0.32, 0.44, 0.86, 1],
    [0.32, 0.44, 0.86, 1],
    [0, 0.4, 0.9, 2],
  ].forEach(([x, rx, ry, tone]) => {
    ctx.beginPath();
    ctx.ellipse(x * r, 0, rx * r, ry * r, 0, 0, TAU);
    const g = ctx.createRadialGradient(
      x * r - r * 0.12,
      -r * 0.4,
      r * 0.05,
      x * r,
      0,
      r * 0.95,
    );
    g.addColorStop(0, ["#ff9a2e", "#ffad42", "#ffc266"][tone]);
    g.addColorStop(0.6, ["#e86a10", "#f57c14", "#ff8f1f"][tone]);
    g.addColorStop(1, ["#a53d08", "#b8460a", "#c9520c"][tone]);
    inked(ctx, g, Math.max(1.3, r * 0.045));
  });
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.5, r * 0.09, r * 0.24, 0.5, 0, TAU);
  ctx.fillStyle = "rgba(255,240,200,.45)";
  ctx.fill();
  // carving
  const dark = "#3a1505";
  ctx.save();
  if (lit > 0) {
    ctx.shadowColor = `rgba(255,170,40,${lit})`;
    ctx.shadowBlur = r * 0.35 * fl;
  }
  const g = ctx.createRadialGradient(0, r * 0.15, 0, 0, r * 0.15, r * 0.9);
  g.addColorStop(0, lit > 0.5 ? "#fffbd0" : dark);
  g.addColorStop(0.5, lit > 0.5 ? `rgba(255,214,92,${fl})` : dark);
  g.addColorStop(1, lit > 0.5 ? "#ff9d1f" : dark);
  const carve = () => {
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#6e2a06";
    ctx.lineWidth = Math.max(1, r * 0.035);
    ctx.stroke();
  };
  const eye = (sx, shut) => {
    ctx.beginPath();
    if (shut > 0.5) {
      ctx.moveTo(sx * r * 0.52, -r * 0.2);
      ctx.quadraticCurveTo(sx * r * 0.36, -r * 0.1, sx * r * 0.2, -r * 0.2);
      ctx.strokeStyle = dark;
      ctx.lineWidth = r * 0.07;
      ctx.stroke();
      return;
    }
    if (face === 1)
      ctx.ellipse(sx * r * 0.34, -r * 0.24, r * 0.13, r * 0.17, 0, 0, TAU);
    else if (face === 2) {
      ctx.moveTo(sx * r * 0.5, -r * 0.14);
      ctx.quadraticCurveTo(sx * r * 0.36, -r * 0.44, sx * r * 0.2, -r * 0.14);
      ctx.closePath();
    } else {
      ctx.moveTo(sx * r * 0.56, -r * 0.36);
      ctx.lineTo(sx * r * 0.16, -r * 0.08);
      ctx.quadraticCurveTo(sx * r * 0.4, 0, sx * r * 0.58, -r * 0.12);
      ctx.closePath();
    }
    carve();
  };
  eye(-1, 0);
  eye(1, wink);
  ctx.beginPath();
  ctx.moveTo(-r * 0.07, r * 0.1);
  ctx.lineTo(0, -r * 0.04);
  ctx.lineTo(r * 0.07, r * 0.1);
  ctx.closePath();
  carve();
  ctx.beginPath();
  if (face === 1) ctx.ellipse(0, r * 0.4, r * 0.16, r * 0.2, 0, 0, TAU);
  else if (face === 2) {
    ctx.moveTo(-r * 0.36, r * 0.26);
    ctx.quadraticCurveTo(0, r * 0.66, r * 0.36, r * 0.26);
    ctx.lineTo(r * 0.12, r * 0.34);
    ctx.lineTo(r * 0.12, r * 0.22);
    ctx.lineTo(-r * 0.04, r * 0.24);
    ctx.lineTo(-r * 0.04, r * 0.36);
    ctx.closePath();
  } else {
    const m = [
      [-0.6, 0.18],
      [-0.42, 0.3],
      [-0.3, 0.2],
      [-0.14, 0.34],
      [0, 0.22],
      [0.14, 0.34],
      [0.3, 0.2],
      [0.42, 0.3],
      [0.6, 0.18],
      [0.44, 0.52],
      [0.26, 0.6],
      [0.14, 0.48],
      [0, 0.64],
      [-0.14, 0.48],
      [-0.26, 0.6],
      [-0.44, 0.52],
    ];
    m.forEach(([x, y], i) =>
      i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r),
    );
    ctx.closePath();
  }
  carve();
  ctx.restore();
}

// A bat around (0,0), about 44 wide at scale 1. `f` is the wing beat, -1 to 1.
function bat(ctx, s, f, look = 0) {
  ctx.save();
  ctx.scale(s, s);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(3, -2);
    ctx.quadraticCurveTo(11, -11 - 8 * f, 22, -7 - 9 * f);
    ctx.quadraticCurveTo(18, -4 - 6 * f, 15.5, 2 - 5 * f);
    ctx.quadraticCurveTo(12.5, -1.5 - 4 * f, 9.5, 4 - 2 * f);
    ctx.quadraticCurveTo(6.5, 1, 3, 4.5);
    ctx.closePath();
    const g = ctx.createLinearGradient(3, 0, 22, 0);
    g.addColorStop(0, "#5b3a8c");
    g.addColorStop(1, "#8a62c9");
    inked(ctx, g, 1.2 / Math.max(0.5, s));
    ctx.strokeStyle = "rgba(28,13,38,.6)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(4, -1);
    ctx.lineTo(15.5, 2 - 5 * f);
    ctx.moveTo(4, 0);
    ctx.lineTo(9.5, 4 - 2 * f);
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(-3.4, -5.5);
  ctx.lineTo(-5, -11);
  ctx.lineTo(-0.8, -7.4);
  ctx.closePath();
  inked(ctx, "#4a2d73", 1);
  ctx.beginPath();
  ctx.moveTo(3.4, -5.5);
  ctx.lineTo(5, -11);
  ctx.lineTo(0.8, -7.4);
  ctx.closePath();
  inked(ctx, "#4a2d73", 1);
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.2, 6.6, 0, 0, TAU);
  inked(ctx, "#4a2d73", 1.2);
  ctx.beginPath();
  ctx.ellipse(0, 2, 2.8, 3.2, 0, 0, TAU);
  ctx.fillStyle = "#6b44a6";
  ctx.fill();
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * 2.1 + look, -2.2, 1.5, 0, TAU);
    ctx.fillStyle = "#ffd35c";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx * 2.1 + look * 1.6, -2.2, 0.6, 0, TAU);
    ctx.fillStyle = "#2a0d05";
    ctx.fill();
  }
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(-1.5, 0.6);
  ctx.lineTo(-0.9, 2.4);
  ctx.lineTo(-0.3, 0.6);
  ctx.moveTo(1.5, 0.6);
  ctx.lineTo(0.9, 2.4);
  ctx.lineTo(0.3, 0.6);
  ctx.fill();
  ctx.restore();
}

// A small friendly ghost around (0,0), about 40 tall at scale 1.
function ghost(ctx, s, t, blink, wave) {
  ctx.save();
  ctx.scale(s, s);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  glow(ctx, 0, 0, 34, "rgba(196,170,255,.28)");
  ctx.save();
  ctx.translate(12, 2);
  ctx.rotate(-0.5 + wave);
  ctx.beginPath();
  ctx.ellipse(6, 0, 7, 4, 0, 0, TAU);
  inked(ctx, "#fbf8ff", 1.3, "#8f78c9");
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-13, 16);
  ctx.bezierCurveTo(-15, -6, -12, -20, 0, -20);
  ctx.bezierCurveTo(12, -20, 15, -6, 13, 16);
  for (let i = 0; i < 4; i++) {
    const x0 = 13 - i * 6.5,
      x1 = x0 - 6.5,
      d = 4 + Math.sin(t * 4 + i * 1.4) * 2;
    ctx.quadraticCurveTo((x0 + x1) / 2, 16 + d * (i % 2 ? -1 : 1.4), x1, 16);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -20, 0, 20);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#d9ccff");
  inked(ctx, g, 1.5, "#8f78c9");
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    if (blink) {
      ctx.moveTo(sx * 5 - 2.4, -6);
      ctx.quadraticCurveTo(sx * 5, -4, sx * 5 + 2.4, -6);
      ctx.strokeStyle = "#2a1840";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.ellipse(sx * 5, -6, 2.3, 3.4, 0, 0, TAU);
      ctx.fillStyle = "#2a1840";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx * 5 + 0.8, -7.4, 0.8, 0, TAU);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
  }
  ctx.fillStyle = "rgba(255,143,181,.6)";
  ctx.beginPath();
  ctx.ellipse(-8.4, -1, 2.6, 1.5, 0, 0, TAU);
  ctx.ellipse(8.4, -1, 2.6, 1.5, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 1, 2.2, 2.6 + Math.sin(t * 2) * 0.5, 0, 0, TAU);
  ctx.fillStyle = "#2a1840";
  ctx.fill();
  ctx.restore();
}

function spider(ctx, s, t) {
  ctx.save();
  ctx.scale(s, s);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#3a2358";
  ctx.lineWidth = 1.4;
  for (const sx of [-1, 1])
    for (let i = 0; i < 4; i++) {
      const a = -0.9 + i * 0.55 + Math.sin(t * 3 + i + sx) * 0.08;
      ctx.beginPath();
      ctx.moveTo(sx * 3, 0);
      ctx.lineTo(sx * (3 + Math.cos(a) * 8), Math.sin(a) * 8 - 3);
      ctx.lineTo(sx * (3 + Math.cos(a) * 12), Math.sin(a) * 8 + 4);
      ctx.stroke();
    }
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.5, 7, 0, 0, TAU);
  inked(ctx, "#4a2d73", 1.2);
  ctx.beginPath();
  ctx.moveTo(0, 0.5);
  ctx.lineTo(2.2, 3);
  ctx.lineTo(0, 5.5);
  ctx.lineTo(-2.2, 3);
  ctx.closePath();
  ctx.fillStyle = HW.orange;
  ctx.fill();
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * 2.4, -2.6, 1.9, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx * 2.4, -2.2, 0.9, 0, TAU);
    ctx.fillStyle = "#1c0d26";
    ctx.fill();
  }
  ctx.restore();
}

// A web fanned out from (0,0) between two angles; `k` spins it from the centre outwards.
function cobweb(ctx, R, a0, a1, k, spokes = 6, rings = 4) {
  if (k <= 0) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(240,232,255,.8)";
  ctx.lineWidth = 1;
  const ang = (i) => a0 + ((a1 - a0) * i) / (spokes - 1),
    reach = R * easeOutCubic(clamp(k * 1.6));
  for (let i = 0; i < spokes; i++) {
    const l = reach * (1 - 0.1 * ((i * 7) % 3));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ang(i)) * l, Math.sin(ang(i)) * l);
    ctx.stroke();
  }
  for (let j = 1; j <= rings; j++) {
    const kk = clamp(k * (rings + 1.5) - j - 0.6);
    if (kk <= 0) continue;
    const rr = (R * j) / (rings + 0.6);
    ctx.globalAlpha = kk;
    ctx.beginPath();
    for (let i = 0; i < spokes; i++) {
      const x = Math.cos(ang(i)) * rr,
        y = Math.sin(ang(i)) * rr;
      if (!i) ctx.moveTo(x, y);
      else {
        const m = (ang(i) + ang(i - 1)) / 2;
        ctx.quadraticCurveTo(
          Math.cos(m) * rr * 0.8,
          Math.sin(m) * rr * 0.8,
          x,
          y,
        );
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

// A melting candle standing on (0,0).
function candle(ctx, h, lit, t, seed) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (lit > 0)
    glow(
      ctx,
      0,
      -h - 8,
      30,
      `rgba(255,180,70,${0.4 * lit * (0.85 + 0.15 * Math.sin(t * 12 + seed))})`,
    );
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 2.6, 0, 0, TAU);
  inked(ctx, "#e9dcc6", 1.2);
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(-5, -h + 3);
  ctx.quadraticCurveTo(-5.4, -h, -2, -h - 0.6);
  ctx.quadraticCurveTo(2, -h + 1.4, 5, -h + 1);
  ctx.lineTo(5, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(-5, 0, 5, 0);
  g.addColorStop(0, "#fffaf0");
  g.addColorStop(1, "#d8c7ab");
  inked(ctx, g, 1.3);
  ctx.beginPath();
  ctx.moveTo(-5, -h + 4);
  ctx.quadraticCurveTo(-7.4, -h + 9, -5.6, -h + 14 + (seed % 3) * 3);
  ctx.quadraticCurveTo(-3.6, -h + 10, -3, -h + 3);
  ctx.moveTo(3, -h + 3);
  ctx.quadraticCurveTo(4.4, -h + 8, 3.6, -h + 11);
  ctx.quadraticCurveTo(1.8, -h + 8, 1.6, -h + 2.6);
  ctx.fillStyle = "#fffaf0";
  ctx.fill();
  ctx.strokeStyle = HW.ink;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(0.6, -h - 4);
  ctx.strokeStyle = "#2b1b12";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  if (lit > 0) {
    const w = Math.sin(t * 9 + seed) * 1.4;
    ctx.save();
    ctx.translate(0.6, -h - 3);
    ctx.scale(lit, lit);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-5, -3, -3 + w, -9, w, -14);
    ctx.bezierCurveTo(3 + w, -9, 5, -3, 0, 0);
    ctx.fillStyle = "#ff9d1f";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -0.6);
    ctx.bezierCurveTo(-2.6, -2.6, -1.4 + w * 0.5, -6, w * 0.5, -8.5);
    ctx.bezierCurveTo(1.6 + w * 0.5, -6, 2.6, -2.6, 0, -0.6);
    ctx.fillStyle = "#fff3a8";
    ctx.fill();
    ctx.restore();
  }
}

function pumpkinLeaf(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(
    -s * 0.5,
    -s * 0.2,
    -s * 0.7,
    -s * 0.7,
    -s * 0.3,
    -s * 0.72,
  );
  ctx.bezierCurveTo(-s * 0.3, -s * 1.1, s * 0.3, -s * 1.1, s * 0.3, -s * 0.72);
  ctx.bezierCurveTo(s * 0.7, -s * 0.7, s * 0.5, -s * 0.2, 0, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -s, 0, 0);
  g.addColorStop(0, "#8cc152");
  g.addColorStop(1, "#3f7a2c");
  inked(ctx, g, 1.3, "#17351a");
  ctx.beginPath();
  ctx.moveTo(0, -1);
  ctx.lineTo(0, -s * 0.8);
  ctx.moveTo(0, -s * 0.4);
  ctx.lineTo(-s * 0.3, -s * 0.6);
  ctx.moveTo(0, -s * 0.4);
  ctx.lineTo(s * 0.3, -s * 0.6);
  ctx.strokeStyle = "#17351a";
  ctx.lineWidth = 0.9;
  ctx.stroke();
}

// A vine that follows the loop from s0, clockwise (dir 1) or the other way (dir -1).
function Vine(loop, s0, len, dir, seed) {
  const R = rng(seed),
    n = Math.ceil(len / 5),
    pts = [],
    bits = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n,
      p = loop.at(s0 + dir * u * len),
      off = 5 + Math.sin(u * 19 + seed) * 5 + Math.sin(u * 47) * 1.6;
    pts.push({
      x: p.x + p.nx * off,
      y: p.y + p.ny * off,
      nx: p.nx,
      ny: p.ny,
      tx: p.tx * dir,
      ty: p.ty * dir,
      u,
    });
  }
  for (let u = 0.1; u < 0.97; u += 0.07 + R() * 0.05) {
    const p = pts[Math.round(u * n)],
      out = R() < 0.72 ? 1 : -1;
    bits.push({
      u,
      x: p.x,
      y: p.y,
      a: Math.atan2(p.ny * out, p.nx * out) + Math.PI / 2 + (R() - 0.5) * 0.9,
      s: (out > 0 ? 13 + R() * 9 : 8 + R() * 3) * lerp(1, 0.6, u),
      kind: R() < 0.3 ? "curl" : "leaf",
      out,
      ph: R() * TAU,
    });
  }
  return { pts, n, bits };
}
function drawVine(ctx, v, g, t, when) {
  const last = Math.min(v.n, Math.floor(g * v.n));
  if (last < 2) return;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const path = () => {
    ctx.beginPath();
    for (let i = 0; i <= last; i++) {
      const p = v.pts[i];
      if (i) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    }
  };
  path();
  ctx.strokeStyle = "#17351a";
  ctx.lineWidth = 6;
  ctx.stroke();
  path();
  ctx.strokeStyle = "#4f9033";
  ctx.lineWidth = 3.4;
  ctx.stroke();
  path();
  ctx.strokeStyle = "rgba(190,236,130,.7)";
  ctx.lineWidth = 1;
  ctx.stroke();
  for (const b of v.bits) {
    const k = easeOutBack(clamp((t - when(b.u)) / 0.45));
    if (k <= 0) continue;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.a + Math.sin(t * 1.5 + b.ph) * 0.08);
    ctx.scale(k, k);
    if (b.kind === "leaf") pumpkinLeaf(ctx, b.s);
    else {
      ctx.beginPath();
      for (let a = 0; a < 8; a += 0.3) {
        const rr = b.s * 0.42 * (1 - a / 9.5),
          x = Math.cos(a - 1.6) * rr,
          y = -b.s * 0.5 + Math.sin(a - 1.6) * rr;
        if (a) ctx.lineTo(x, y);
        else {
          ctx.moveTo(0, 0);
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = "#17351a";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = "#7ac24a";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function witchHat(ctx, t, sway) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(0, 0, 39, 9.5, 0, 0, TAU);
  {
    const g = ctx.createLinearGradient(-39, 0, 39, 0);
    g.addColorStop(0, "#3a2358");
    g.addColorStop(0.5, "#5b3a8c");
    g.addColorStop(1, "#2a1840");
    inked(ctx, g, 1.7);
  }
  ctx.beginPath();
  ctx.moveTo(-21, -1);
  ctx.quadraticCurveTo(-13, -27, -1, -40);
  ctx.quadraticCurveTo(8, -51, 25 + sway, -45 + sway * 0.3);
  ctx.quadraticCurveTo(13, -42, 12, -33);
  ctx.quadraticCurveTo(18, -16, 21, -1);
  ctx.quadraticCurveTo(0, 5.5, -21, -1);
  ctx.closePath();
  {
    const g = ctx.createLinearGradient(-20, 0, 22, -30);
    g.addColorStop(0, "#6b44a6");
    g.addColorStop(0.5, "#4a2d73");
    g.addColorStop(1, "#2a1840");
    inked(ctx, g, 1.7);
  }
  ctx.beginPath();
  ctx.moveTo(-9, -22);
  ctx.quadraticCurveTo(-5, -31, 1, -37);
  ctx.strokeStyle = "rgba(190,160,255,.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-20.5, -3);
  ctx.quadraticCurveTo(0, 3.5, 20.6, -3);
  ctx.lineTo(18.6, -11);
  ctx.quadraticCurveTo(0, -5, -17.6, -11);
  ctx.closePath();
  inked(ctx, HW.orange, 1.4);
  ctx.beginPath();
  ctx.roundRect(-6, -10.5, 12, 10.5, 1.6);
  inked(ctx, "#ffd35c", 1.3);
  ctx.beginPath();
  ctx.roundRect(-3, -7.8, 6, 5.2, 1);
  ctx.fillStyle = HW.orangeDark;
  ctx.fill();
  ctx.save();
  ctx.translate(7, -25);
  ctx.rotate(0.3);
  ctx.beginPath();
  ctx.rect(-4, -3.4, 8, 6.8);
  inked(ctx, "#8a62c9", 1);
  ctx.strokeStyle = "#ffd35c";
  ctx.lineWidth = 0.9;
  ctx.setLineDash([1.6, 1.6]);
  ctx.strokeRect(-2.8, -2.2, 5.6, 4.4);
  ctx.restore();
  ctx.save();
  ctx.translate(-6, -17);
  ctx.rotate(t * 0.6);
  ctx.scale(0.8 + 0.2 * Math.sin(t * 4), 0.8 + 0.2 * Math.sin(t * 4));
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * TAU) / 10,
      r = i % 2 ? 1.7 : 4.2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = "#ffe98a";
  ctx.fill();
  ctx.restore();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Noite das Abóboras",
    reach: { top: 98, side: 80, bottom: 66 },
    mat: ["#1d1130", "#0c0914"],
    theme: {
      "--card-bg":
        "linear-gradient(170deg,#2d1746 0%,#1a0f2b 52%,#0e0a17 100%)",
      "--card-banner":
        "linear-gradient(120deg,#2a1650 0%,#6b2f8f 48%,#ff7a1a 100%)",
      "--card-avatar": "#1a0f24",
      "--card-avatar-ring": "#2a1840",
      "--card-button": "#e2620d",
      "--card-border": "rgba(255,150,50,.5)",
    },
    init() {
      const pad = 9,
        r = CARD.r + pad,
        top = CARD.w + pad * 2 - r * 2,
        side = CARD.h + pad * 2 - r * 2,
        arc = (r * Math.PI) / 2;
      this.loop = rectLoop(-pad, -pad, CARD.w + pad * 2, CARD.h + pad * 2, r);
      const sBL = top + arc + side + arc + top + arc * 0.5;
      this.vines = [
        Vine(this.loop, sBL, arc * 0.5 + side * 0.66, 1, 3),
        Vine(this.loop, sBL, arc * 0.5 + top + arc + side * 0.3, -1, 8),
      ];
      this.t0 = 0.45;
      this.dur = 1.9;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.lite = 2.6;
      const R = rng(13);
      this.bats = [];
      for (let i = 0; i < 22; i++)
        this.bats.push({
          lag: i * 19 + R() * 30,
          off: 26 + R() * 70,
          s: 0.55 + R() * 0.6,
          fs: 13 + R() * 8,
          ph: R() * TAU,
          wob: 4 + R() * 9,
          stay: [2, 9, 16].indexOf(i),
          out: R() * 0.4,
        });
      this.stars = [];
      for (let i = 0; i < 16; i++) {
        const a = R() * TAU,
          d = R();
        this.stars.push({
          x: CARD.w / 2 + Math.cos(a) * (CARD.w * 0.62 + d * 60),
          y: CARD.h / 2 + Math.sin(a) * (CARD.h * 0.56 + d * 60),
          s: 1.4 + R() * 2.6,
          ph: R() * TAU,
          f: 1.5 + R() * 2.5,
        });
      }
      this.embers = Particles();
      this.rand = rng(31);
      const q = rng(5);
      this.inner = [];
      for (let i = 0; i < 22; i++)
        this.inner.push({
          x: q() * CARD.w,
          y: 120 + q() * (CARD.h - 150),
          s: 0.7 + q() * 1.5,
          ph: q() * TAU,
          f: 1 + q() * 2.4,
        });
      this.fog = [];
      for (let i = 0; i < 9; i++)
        this.fog.push({
          x: q() * CARD.w,
          y: CARD.h - 20 - q() * 70,
          r: 60 + q() * 60,
          v: 6 + q() * 10,
          ph: q() * TAU,
        });
      this.rise = [];
      for (let i = 0; i < 3; i++)
        this.rise.push({
          x: 60 + i * 105 + q() * 30,
          d: 0.25 + i * 0.4,
          s: 0.7 + q() * 0.35,
        });
      this.sil = [];
      for (let i = 0; i < 7; i++)
        this.sil.push({
          d: 0.2 + q() * 1.5,
          y: 18 + q() * 70,
          s: 0.3 + q() * 0.3,
          fs: 14 + q() * 6,
        });
    },
    reset() {
      this.embers.clear();
      this.rand = rng(31);
    },
    spots() {
      return [
        [-16, CARD.h + 2, 46],
        [CARD.w + 8, CARD.h + 14, 30],
        [CARD.w - 38, CARD.h + 30, 17],
      ];
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand;
      if (t > this.lite && R() < dt * 7) {
        const s = this.spots()[R() < 0.6 ? 0 : 1];
        this.embers.add({
          x: s[0] + (R() - 0.5) * s[2],
          y: s[1] - s[2] * 0.3,
          vx: (R() - 0.5) * 16,
          vy: -22 - R() * 30,
          life: 1.2 + R() * 1.4,
          size: 0.8 + R() * 1.7,
          sway: 14,
          swayF: 2 + R() * 2,
          phase: R() * TAU,
        });
      }
      this.embers.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        L = this.loop.L,
        lit = still ? 1 : clamp((t - this.lite) / 0.25);
      // stars that twinkle around the card
      for (const s of this.stars) {
        const a =
          (still ? 0.8 : smooth((t - 0.4) / 1.2)) *
          (0.35 + 0.65 * Math.abs(Math.sin(tt * s.f + s.ph)));
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = a;
        ctx.fillStyle = "#ffe98a";
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const an = (i * TAU) / 8,
            r = i % 2 ? s.s * 0.35 : s.s * 1.5;
          ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // web in the outer corner, with a spider on its thread
      ctx.save();
      ctx.translate(CARD.w + 4, -4);
      cobweb(
        ctx,
        84,
        -Math.PI / 2 - 0.5,
        0.5,
        still ? 1 : clamp((t - 0.9) / 1.1),
      );
      ctx.restore();
      {
        const k = still ? 1 : easeOutBack(clamp((t - 1.7) / 0.8));
        if (k > 0) {
          const x = CARD.w + 58,
            y0 = -30,
            y = y0 + k * 92 + Math.sin(tt * 1.6) * 5;
          ctx.strokeStyle = "rgba(240,232,255,.8)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y0);
          ctx.lineTo(x, y - 6);
          ctx.stroke();
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.sin(tt * 1.6) * 0.1);
          spider(ctx, 1.05, tt);
          ctx.restore();
        }
      }
      // the ghost that peeks from behind the card
      {
        const cyc = still ? 3 : (t - 2.0) % 9.5,
          k = still
            ? 1
            : t < 2.0
              ? 0
              : cyc < 0.7
                ? easeOutBack(cyc / 0.7)
                : cyc < 6.4
                  ? 1
                  : cyc < 7
                    ? 1 - smooth((cyc - 6.4) / 0.6)
                    : 0;
        if (k > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(CARD.w + 1.5, 150, 130, 260);
          ctx.clip();
          ctx.translate(CARD.w - 26 + k * 50, 284 + Math.sin(tt * 1.8) * 5);
          ctx.rotate(0.12 + Math.sin(tt * 1.2) * 0.05);
          ghost(
            ctx,
            1.3,
            tt,
            !still && tt % 3.3 < 0.13,
            Math.sin(tt * 6) * 0.35,
          );
          ctx.restore();
        }
      }
      // candles on the top edge
      [
        [42, 36, 0],
        [60, 23, 1],
        [27, 17, 2],
      ].forEach(([x, h, i]) => {
        const k = still ? 1 : easeOutBack(clamp((t - 1.3 - i * 0.16) / 0.5));
        if (k <= 0) return;
        ctx.save();
        ctx.translate(x, 0);
        ctx.scale(1, k);
        candle(
          ctx,
          h,
          still ? 1 : clamp((t - this.lite - i * 0.08) / 0.2),
          tt,
          i * 2.3 + 1,
        );
        ctx.restore();
      });
      // vines, then the pumpkins that sit on them
      const g = this.front(T);
      for (const v of this.vines) drawVine(ctx, v, g, T, this.when);
      this.spots().forEach(([x, y, r], i) => {
        const k = still ? 1 : easeOutBack(clamp((t - 0.3 - i * 0.35) / 0.55));
        if (k <= 0) return;
        const c = (tt + i * 2.7) % 7,
          hop =
            !still && t > 3 && c < 0.4
              ? Math.sin((c / 0.4) * Math.PI) * (i === 2 ? 9 : 4)
              : 0,
          squash = 1 + (still ? 0 : Math.sin(tt * 2 + i) * 0.012) - hop * 0.004;
        ctx.save();
        ctx.translate(x, y - hop + r * 0.9);
        ctx.rotate([-0.06, 0.16, -0.2][i]);
        ctx.scale(k / squash, k * squash);
        ctx.translate(0, -r * 0.9);
        pumpkin(
          ctx,
          r,
          lit,
          tt + i,
          i,
          i === 0 && !still && tt % 6.2 > 5.9 ? 1 : 0,
        );
        ctx.restore();
      });
      // the moment the candles catch
      if (!still) {
        const k = (t - this.lite) / 0.8;
        if (k > 0 && k < 1) {
          const s = this.spots()[0];
          ctx.save();
          ctx.globalAlpha = (1 - k) * 0.8;
          ctx.strokeStyle = "#ffd35c";
          ctx.lineWidth = 5 * (1 - k) + 1;
          ctx.beginPath();
          ctx.arc(s[0], s[1], 30 + easeOutCubic(k) * 110, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }
      }
      for (const p of this.embers.list) {
        const k = 1 - p.age / p.life;
        ctx.globalAlpha = k;
        glow(ctx, p.x, p.y, p.size * 3.4, "rgba(255,160,50,.55)");
        ctx.fillStyle = "#ffe08a";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * k + 0.3, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // bats: a swarm that circles the card on arrival; three stay
      const S =
        L * 1.12 * easeInOut(clamp(T / 2.7)) + 24 * Math.max(0, tt - 2.3);
      for (const b of this.bats) {
        const settle = still ? 1 : smooth((t - 2.7) / 3),
          lag = b.stay >= 0 ? lerp(b.lag, (b.stay * L) / 3, settle) : b.lag,
          s = S - lag;
        if (s < -40 && !still) continue;
        const gone =
          b.stay >= 0 ? 0 : still ? 1 : smooth((t - 2.5 - b.out) / 0.7);
        if (gone >= 1) continue;
        const p = this.loop.at(s),
          off =
            (b.stay >= 0 ? lerp(b.off, 44 + b.stay * 9, settle) : b.off) +
            Math.sin(tt * 2.3 + b.ph) * b.wob +
            gone * 120;
        ctx.save();
        ctx.translate(
          p.x + p.nx * off,
          p.y + p.ny * off + Math.sin(tt * 5 + b.ph) * 2,
        );
        ctx.rotate(p.tx * 0.28);
        ctx.globalAlpha = (still ? 1 : clamp((s + 40) / 60)) * (1 - gone);
        bat(
          ctx,
          b.s * (b.stay >= 0 ? lerp(1, 1.2, settle) : 1),
          still ? 0.2 : Math.sin(tt * b.fs + b.ph),
          p.tx * 0.6,
        );
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : smooth(t / 0.7);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(77, 77, AVATAR.r + 3.5, 0, TAU);
      ctx.strokeStyle = "#2a1840";
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.strokeStyle = HW.orange;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([2.5, 6]);
      ctx.lineDashOffset = -tt * 4;
      ctx.strokeStyle = "#ffe08a";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(77, 77, AVATAR.r + 8, 0, TAU);
      ctx.stroke();
      ctx.restore();
      const k = still ? 1 : bounceOut((t - 0.7) / 0.9),
        on = still || t > 0.7;
      if (on) {
        const c = tt % 5,
          wob =
            !still && t > 2 && c < 0.6
              ? Math.sin((c / 0.6) * Math.PI * 2) * 0.07
              : 0,
          sway = Math.sin(tt * 1.7) * 2.5;
        ctx.save();
        ctx.translate(79, 45 - (1 - k) * 80);
        ctx.rotate(-0.16 + wob + (1 - k) * 0.5);
        ctx.scale(0.8, 0.8);
        witchHat(ctx, tt, sway);
        const sx = 24 + sway,
          sy = -44 + sway * 0.3,
          drop = 15 + Math.sin(tt * 2.1) * 3;
        ctx.strokeStyle = "rgba(240,232,255,.8)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy + drop - 3);
        ctx.stroke();
        ctx.translate(sx, sy + drop);
        spider(ctx, 0.5, tt);
        ctx.restore();
      }
      const bk = still ? 1 : smooth((t - 1.6) / 0.8);
      if (bk > 0) {
        const ang = still ? 2.2 : 2.2 + (1 - bk) * 4;
        ctx.save();
        ctx.globalAlpha = bk;
        ctx.translate(
          77 + Math.cos(ang) * (AVATAR.r + 14),
          77 + Math.sin(ang) * (AVATAR.r + 14) + Math.sin(tt * 3) * 2,
        );
        bat(ctx, 0.62, still ? 0.2 : Math.sin(tt * 15), 0.4);
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : smooth((t - 0.2) / 1.1);
      // moon over the banner, with the swarm crossing it on arrival
      const mx = CARD.w - 64,
        my = 54;
      ctx.save();
      ctx.globalAlpha = a;
      glow(ctx, mx, my, 76, "rgba(255,226,150,.36)");
      ctx.beginPath();
      ctx.arc(mx, my, 31, 0, TAU);
      const mg = ctx.createRadialGradient(mx - 9, my - 10, 3, mx, my, 32);
      mg.addColorStop(0, "#fffbe0");
      mg.addColorStop(0.7, "#ffe9a6");
      mg.addColorStop(1, "#f7c56a");
      ctx.fillStyle = mg;
      ctx.fill();
      ctx.fillStyle = "rgba(214,150,60,.3)";
      [
        [-9, -6, 6.5],
        [8, 7, 8],
        [9, -13, 4],
        [-6, 12, 4.5],
      ].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(mx + x, my + y, r, 0, TAU);
        ctx.fill();
      });
      ctx.fillStyle = "rgba(42,24,64,.78)";
      for (let i = 0; i < 3; i++) {
        const x = ((tt * (5 + i * 2) + i * 130) % (CARD.w + 160)) - 80;
        ctx.beginPath();
        ctx.ellipse(x, 30 + i * 30, 46, 8, 0, 0, TAU);
        ctx.ellipse(x + 30, 36 + i * 30, 34, 7, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      if (!still)
        for (const b of this.sil) {
          const k = (t - b.d) / 1.3;
          if (k <= 0 || k >= 1) continue;
          ctx.save();
          ctx.translate(
            -20 + (CARD.w + 40) * k,
            b.y - Math.sin(k * Math.PI) * 22,
          );
          ctx.globalAlpha = Math.sin(k * Math.PI);
          bat(ctx, b.s * 1.6, Math.sin(t * b.fs));
          ctx.restore();
        }
      // web in the inner corner
      cobweb(
        ctx,
        70,
        0.02,
        Math.PI / 2 - 0.02,
        still ? 1 : clamp((t - 0.6) / 1.1),
        5,
        4,
      );
      // stars in the dark of the card
      for (const s of this.inner) {
        ctx.globalAlpha =
          a * (0.25 + 0.75 * Math.abs(Math.sin(tt * s.f + s.ph))) * 0.8;
        glow(ctx, s.x, s.y, s.s * 2.6, "rgba(255,220,140,.9)");
      }
      ctx.globalAlpha = 1;
      // fog along the floor
      for (const f of this.fog) {
        const x = ((f.x + tt * f.v) % (CARD.w + 240)) - 120;
        ctx.globalAlpha = a;
        glow(
          ctx,
          x,
          f.y + Math.sin(tt * 0.7 + f.ph) * 6,
          f.r,
          "rgba(170,130,230,.2)",
        );
      }
      ctx.globalAlpha = 1;
      // little ghosts rise through the card when the profile opens
      if (!still)
        for (const g of this.rise) {
          const k = (t - g.d) / 2.1;
          if (k <= 0 || k >= 1) continue;
          ctx.save();
          ctx.globalAlpha = Math.sin(k * Math.PI) * 0.85;
          ctx.translate(
            g.x + Math.sin(k * 7 + g.x) * 14,
            CARD.h + 20 - k * (CARD.h * 0.8),
          );
          ghost(ctx, g.s, t, false, Math.sin(t * 5) * 0.3);
          ctx.restore();
        }
    },
  };
}
