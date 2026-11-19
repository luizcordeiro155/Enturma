// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutCubic,
  glow,
  inked,
  pop,
  fade,
  grad,
  blobPath,
  eyes,
  blinking,
  ringBase,
  Strand,
  strandLine,
  strandBits,
  Drift,
  settle,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Outono ----------
const OT = {
  ink: "#3a1c10",
  cols: [
    ["#ffb23c", "#e8751a"],
    ["#ff7a3c", "#c9361a"],
    ["#e84a3a", "#96201c"],
    ["#ffd65c", "#e09a1f"],
  ],
};
// A maple leaf around (0,0), stem down.
function otLeaf(ctx, s, c) {
  ctx.lineJoin = "round";
  const P = [
    [0, -1],
    [0.18, -0.55],
    [0.5, -0.72],
    [0.42, -0.34],
    [0.95, -0.3],
    [0.62, 0.02],
    [0.82, 0.38],
    [0.36, 0.3],
    [0.1, 0.56],
    [-0.1, 0.56],
    [-0.36, 0.3],
    [-0.82, 0.38],
    [-0.62, 0.02],
    [-0.95, -0.3],
    [-0.42, -0.34],
    [-0.5, -0.72],
    [-0.18, -0.55],
  ];
  ctx.beginPath();
  P.forEach(([x, y], i) =>
    i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s),
  );
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, 0, -s, 0, s * 0.6, c[0], c[1]),
    Math.max(0.9, s * 0.08),
    OT.ink,
  );
  ctx.strokeStyle = "rgba(90,30,10,.55)";
  ctx.lineWidth = Math.max(0.7, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.95);
  ctx.lineTo(0, -s * 0.8);
  for (const sx of [-1, 1]) {
    ctx.moveTo(0, s * 0.3);
    ctx.lineTo(sx * s * 0.7, -s * 0.2);
    ctx.moveTo(0, s * 0.3);
    ctx.lineTo(sx * s * 0.55, s * 0.28);
  }
  ctx.stroke();
}
function otAcorn(ctx, s) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.62, -s * 0.2);
  ctx.bezierCurveTo(-s * 0.7, s * 0.7, -s * 0.2, s, 0, s * 1.15);
  ctx.bezierCurveTo(s * 0.2, s, s * 0.7, s * 0.7, s * 0.62, -s * 0.2);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, -s, 0, s, 0, "#e0a05a", "#a8632a"),
    Math.max(1, s * 0.1),
    OT.ink,
  );
  ctx.beginPath();
  ctx.moveTo(-s * 0.75, -s * 0.15);
  ctx.quadraticCurveTo(-s * 0.8, -s * 0.85, 0, -s * 0.9);
  ctx.quadraticCurveTo(s * 0.8, -s * 0.85, s * 0.75, -s * 0.15);
  ctx.closePath();
  inked(ctx, "#7a4a22", Math.max(1, s * 0.1), OT.ink);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.9);
  ctx.lineTo(s * 0.1, -s * 1.25);
  ctx.strokeStyle = OT.ink;
  ctx.lineWidth = Math.max(1.2, s * 0.14);
  ctx.lineCap = "round";
  ctx.stroke();
}
// A squirrel sitting on (0,0), holding an acorn, facing left.
function otSquirrel(ctx, t, blink, nibble) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const sw = Math.sin(t * 2) * 0.05;
  ctx.save();
  ctx.translate(11, -4);
  ctx.rotate(sw);
  ctx.beginPath();
  ctx.moveTo(-2, 2);
  ctx.bezierCurveTo(22, 6, 34, -18, 22, -38);
  ctx.bezierCurveTo(16, -50, 0, -46, 2, -36);
  ctx.bezierCurveTo(12, -34, 12, -18, -4, -12);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -46, 20, 4, "#f2a65a", "#b9632a"), 1.7, OT.ink);
  ctx.strokeStyle = "rgba(255,220,170,.6)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(14, -6);
  ctx.bezierCurveTo(24, -16, 22, -30, 13, -38);
  ctx.stroke();
  ctx.restore();
  blobPath(ctx, [
    [-11, 0],
    [-14, -12],
    [-7, -24],
    [8, -23],
    [13, -10],
    [11, 0],
  ]);
  inked(ctx, grad(ctx, 0, -24, 0, 0, "#e8924a", "#b9632a"), 1.6, OT.ink);
  ctx.beginPath();
  ctx.ellipse(-3, -9, 6, 8.5, 0, 0, TAU);
  ctx.fillStyle = "#fff0d6";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, -1.5, 7, 3.4, 0, 0, TAU);
  inked(ctx, "#e8924a", 1.3, OT.ink);
  ctx.save();
  ctx.translate(-3, -30);
  ctx.rotate(-0.1 + nibble * 0.06);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 4, -9);
    ctx.quadraticCurveTo(sx * 9, -22, sx * 11, -8);
    ctx.closePath();
    inked(ctx, "#e8924a", 1.4, OT.ink);
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 11.5, 0, 0, TAU);
  inked(ctx, grad(ctx, 0, -11, 0, 11, "#f2a65a", "#cf7a36"), 1.6, OT.ink);
  ctx.beginPath();
  ctx.ellipse(-4, 4, 7, 5.4, 0, 0, TAU);
  ctx.fillStyle = "#fff0d6";
  ctx.fill();
  ctx.save();
  ctx.translate(-2, -2);
  eyes(ctx, 12, 2.6, -0.6, blink, "#2a140a", null);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(-9, 2.5, 1.7, 0, TAU);
  ctx.fillStyle = "#2a140a";
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(-12, -17 + nibble * 1.5);
  ctx.rotate(-0.3);
  otAcorn(ctx, 5.5);
  ctx.restore();
  for (const y of [-17, -13]) {
    ctx.beginPath();
    ctx.ellipse(-8, y + nibble * 1.5, 3.6, 2.6, 0.4, 0, TAU);
    inked(ctx, "#e8924a", 1.2, OT.ink);
  }
}
function otHedgehog(ctx, t, blink) {
  ctx.lineJoin = "round";
  const b = Math.sin(t * 2) * 0.5;
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  for (let i = 0; i <= 9; i++) {
    const a = Math.PI + (i / 9) * Math.PI * 0.86,
      r1 = 21 + (i % 2 ? 5 : 0) + b;
    ctx.lineTo(Math.cos(a) * r1 - 1, Math.sin(a) * r1 * 0.9);
    ctx.lineTo(Math.cos(a + 0.15) * 16 - 1, Math.sin(a + 0.15) * 14);
  }
  ctx.lineTo(12, 0);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -24, 0, 0, "#8a5a3a", "#4a2a18"), 1.5, OT.ink);
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.quadraticCurveTo(4, -14, 14, -11);
  ctx.quadraticCurveTo(24, -8, 27, -1);
  ctx.quadraticCurveTo(22, 2, 4, 0);
  ctx.closePath();
  inked(ctx, "#f2cf9a", 1.5, OT.ink);
  ctx.beginPath();
  ctx.arc(27, -1.5, 2.2, 0, TAU);
  ctx.fillStyle = "#2a140a";
  ctx.fill();
  if (blink) {
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(18, -6);
    ctx.strokeStyle = "#2a140a";
    ctx.lineWidth = 1.3;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(16, -6, 1.8, 0, TAU);
    ctx.fillStyle = "#2a140a";
    ctx.fill();
  }
  for (const x of [-8, 6]) {
    ctx.beginPath();
    ctx.ellipse(x, 0.5, 4, 2.4, 0, 0, TAU);
    inked(ctx, "#f2cf9a", 1.2, OT.ink);
  }
}

export default function create(CARD, AVATAR) {
  return {
    name: "Outono",
    reach: { top: 110, side: 66, bottom: 62 },
    mat: ["#2e1a10", "#170d08"],
    theme: cardTheme("#d9632a", "#7a2e1e"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.br = Strand(
        this.loop,
        m.tl + m.arc * 0.3,
        m.arc * 0.7 + m.top + m.arc + m.side * 0.62,
        1,
        3,
        { off: 8, wave: 6, freq: 15, gap: 0.045, size: 15 },
      );
      this.br2 = Strand(this.loop, m.tl + m.arc * 0.3, m.side * 0.7, -1, 17, {
        off: 8,
        wave: 6,
        freq: 15,
        gap: 0.075,
        size: 15,
      });
      this.t0 = 0.3;
      this.dur = 2.2;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.fall = Drift(16, 37, {
        v: [26, 48],
        s: [8, 14],
        sway: 26,
        spin: 2.6,
      });
      this.fx = Drift(13, 41, { v: [22, 44], s: [7, 13], sway: 22, spin: 2.4 });
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 1.6, 1.2);
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 8, (c) => {
        for (const v of [this.br, this.br2]) {
          strandLine(c, v, g, [
            [OT.ink, 8],
            ["#7a4a2a", 5.2],
            ["rgba(220,160,110,.6)", 1.3],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2 + Math.sin(tt * 1.5 + b.ph) * 0.1);
            c.translate(0, -b.s * 0.75);
            c.rotate((b.i % 2 ? 1 : -1) * 0.5);
            c.scale(k, k);
            if (b.kind < 0.86) otLeaf(c, b.s * 0.82, OT.cols[b.i % 4]);
            else otAcorn(c, b.s * 0.42);
          });
        }
      });
      // leaves let go of the branch and drift down past the card
      this.fall.each(tt, CARD.w + 130, CARD.h + 150, (p, x, y, rot) => {
        const px = x - 65,
          py = y - 90;
        if (px > -6 && px < CARD.w + 6 && py > -6 && py < CARD.h + 6) return;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rot);
        ctx.scale(1, 0.55 + 0.45 * Math.sin(rot * 1.7));
        ctx.globalAlpha = a * 0.9;
        otLeaf(ctx, p.s * 0.62, OT.cols[p.i % 4]);
        ctx.restore();
      });
      // a pile of leaves and mushrooms in one corner, a hedgehog nosing about in the other
      {
        const k = still ? 1 : pop(t, 0.8, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w - 44, CARD.h + 30);
          ctx.scale(k, k);
          [
            [-24, 4, 13, 0.4, 0],
            [-8, -4, 16, -0.3, 1],
            [10, 0, 15, 0.7, 2],
            [24, 6, 12, -0.6, 3],
            [0, 8, 14, 1.4, 0],
            [-16, 10, 11, 2.2, 2],
          ].forEach(([x, y, s, r, ci]) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(r);
            otLeaf(ctx, s, OT.cols[ci]);
            ctx.restore();
          });
          [
            [14, -8, 15, "#c9361a"],
            [-2, -4, 10, "#e09a1f"],
          ].forEach(([x, y, s, col]) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.roundRect(-s * 0.22, -s * 0.9, s * 0.44, s * 0.9, s * 0.15);
            inked(ctx, "#fff0d6", 1.3, OT.ink);
            ctx.beginPath();
            ctx.moveTo(-s * 0.85, -s * 0.8);
            ctx.quadraticCurveTo(0, -s * 2.1, s * 0.85, -s * 0.8);
            ctx.quadraticCurveTo(0, -s * 0.55, -s * 0.85, -s * 0.8);
            ctx.closePath();
            inked(ctx, col, 1.4, OT.ink);
            ctx.fillStyle = "#fff0d6";
            for (const [px, py, pr] of [
              [-0.3, -1.15, 0.13],
              [0.25, -1.3, 0.1],
              [0.38, -0.95, 0.08],
            ]) {
              ctx.beginPath();
              ctx.arc(px * s, py * s, pr * s, 0, TAU);
              ctx.fill();
            }
            ctx.restore();
          });
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.4, 0.6);
        if (k > 0) {
          const x = 40 + Math.sin(tt * 0.5) * 12;
          ctx.save();
          ctx.translate(x, CARD.h + 36);
          ctx.scale(k * 1.25 * (Math.cos(tt * 0.5) > 0 ? 1 : -1), k * 1.25);
          otHedgehog(ctx, tt, !still && blinking(tt, 3.4));
          ctx.restore();
          ctx.save();
          ctx.translate(x - 6, CARD.h + 16);
          ctx.rotate(0.3);
          ctx.scale(k, k);
          otLeaf(ctx, 9, OT.cols[1]);
          ctx.restore();
        }
      }
      // the squirrel on the top edge with its acorn
      {
        const k = still ? 1 : clamp((t - 1.3) / 0.7);
        if (k > 0) {
          const c = tt % 3.6,
            nib = !still && c < 1.2 ? Math.abs(Math.sin(c * 16)) : 0;
          ctx.save();
          ctx.translate(
            CARD.w * 0.3 - (1 - easeOutCubic(k)) * 130,
            2 - Math.abs(Math.sin(k * Math.PI * 2)) * 16 * (1 - k),
          );
          ctx.scale(1.75, 1.75);
          otSquirrel(ctx, tt, !still && blinking(tt, 3), nib);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 2, 0.5);
        if (k > 0)
          [
            [0.56, 9, 0.3],
            [0.63, 7, -0.4],
            [0.7, 8, 0.1],
          ].forEach(([u, s, r]) => {
            ctx.save();
            ctx.translate(CARD.w * u, -s * 0.9);
            ctx.rotate(r);
            ctx.scale(k, k);
            otAcorn(ctx, s);
            ctx.restore();
          });
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r;
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        77,
        77,
        R + 3.5,
        [
          [OT.ink, 7.4],
          ["#b9632a", 4.6],
          ["#ffd65c", 1.3, [2, 7], 4],
        ],
        tt,
      );
      ctx.restore();
      // a wreath of leaves, heaviest at the bottom
      for (let i = 0; i < 13; i++) {
        const an = 0.2 + (i / 12) * (Math.PI - 0.4) + (i % 2 ? 0.05 : -0.05),
          far = i % 2 ? 11 : 6,
          k = still ? 1 : pop(t, 0.4 + Math.abs(i - 6) * 0.09, 0.45);
        if (k <= 0) continue;
        ctx.save();
        ctx.translate(
          77 + Math.cos(an) * (R + far),
          77 + Math.sin(an) * (R + far),
        );
        ctx.rotate(
          an -
            Math.PI / 2 +
            Math.sin(tt * 1.6 + i) * 0.1 +
            (i % 2 ? 0.5 : -0.5),
        );
        ctx.scale(k, k);
        otLeaf(ctx, 9 + (i % 3) * 2, OT.cols[i % 4]);
        ctx.restore();
      }
      {
        const k = still ? 1 : pop(t, 1.3, 0.5);
        ctx.save();
        ctx.translate(77 - 30, 77 - R + 2);
        ctx.rotate(-0.6 + Math.sin(tt * 2) * 0.06);
        ctx.scale(k, k);
        otAcorn(ctx, 9);
        ctx.translate(13, 3);
        ctx.rotate(0.5);
        otAcorn(ctx, 7);
        ctx.restore();
      }
      // one leaf keeps falling
      if (!still && t > 2) {
        const c = (t - 2) % 3.6;
        if (c < 2.6) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, c * 3) * clamp((2.6 - c) * 2);
          ctx.translate(77 + 34 + Math.sin(c * 2.4) * 9, 77 - 50 + c * 40);
          ctx.rotate(c * 2);
          otLeaf(ctx, 7, OT.cols[1]);
          ctx.restore();
        }
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(ctx, CARD.w * 0.2, 0, 220, `rgba(255,170,70,${0.24 * a})`);
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.scale(1, 0.5 + 0.5 * Math.sin(rot * 1.7));
        ctx.globalAlpha = a * 0.55;
        otLeaf(ctx, p.s * 0.6, OT.cols[p.i % 4]);
        ctx.restore();
      });
      // a gust now and then
      if (!still) {
        const c = (t + 2) % 6.5;
        if (c < 1.2) {
          ctx.save();
          ctx.globalAlpha = Math.sin((c / 1.2) * Math.PI) * 0.35 * a;
          ctx.strokeStyle = "#ffe9c4";
          ctx.lineWidth = 1.6;
          ctx.lineCap = "round";
          for (let i = 0; i < 3; i++) {
            const y = CARD.h * (0.3 + i * 0.2),
              x = -60 + (c / 1.2) * (CARD.w + 120) - i * 40;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.bezierCurveTo(x + 30, y - 10, x + 50, y + 10, x + 80, y - 2);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    },
  };
}
