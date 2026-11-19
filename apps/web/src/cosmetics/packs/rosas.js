// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutBack,
  easeInOut,
  rng,
  glow,
  sprite,
  stamp,
  inked,
  pop,
  fade,
  grad,
  sparkPath,
  ringBase,
  Strand,
  strandLine,
  strandBits,
  Drift,
  settle,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Jardim de Rosas ----------
const RS = { ink: "#2a0a14", stem: "#2f6a3a", leaf: "#3f8a4a" };
// A rose seen from above, painted into a sprite: three turns of petals round a tight heart.
function rsRose(c0, c1, c2) {
  return sprite(48, (x) => {
    x.lineJoin = "round";
    const petal = (r, a, w) => {
      x.save();
      x.rotate(a);
      x.beginPath();
      x.moveTo(0, 0);
      x.bezierCurveTo(-r * w, -r * 0.3, -r * w * 0.9, -r * 1.05, 0, -r);
      x.bezierCurveTo(r * w * 0.9, -r * 1.05, r * w, -r * 0.3, 0, 0);
      x.closePath();
      const g = x.createLinearGradient(0, 0, 0, -r);
      g.addColorStop(0, c2);
      g.addColorStop(0.55, c1);
      g.addColorStop(1, c0);
      x.fillStyle = g;
      x.fill();
      x.strokeStyle = RS.ink;
      x.lineWidth = 1.1;
      x.stroke();
      x.restore();
    };
    for (let i = 0; i < 6; i++) petal(21, (i / 6) * TAU, 0.72);
    for (let i = 0; i < 5; i++) petal(15.5, (i / 5) * TAU + 0.5, 0.74);
    for (let i = 0; i < 4; i++) petal(10.5, (i / 4) * TAU + 0.2, 0.78);
    x.beginPath();
    x.arc(0, 0, 5.4, 0, TAU);
    x.fillStyle = c2;
    x.fill();
    x.strokeStyle = RS.ink;
    x.lineWidth = 1;
    x.stroke();
    x.beginPath();
    for (let a = 0; a < 8; a += 0.3) {
      const r = 4.4 * (1 - a / 9);
      x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    x.strokeStyle = c0;
    x.lineWidth = 1.1;
    x.stroke();
  });
}
function rsLeaf(ctx, s, sway) {
  ctx.lineJoin = "round";
  ctx.rotate(sway);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(s * 0.3, -s * 0.55, s * 0.85, -s * 0.5, s * 1.2, 0);
  ctx.bezierCurveTo(s * 0.85, s * 0.5, s * 0.3, s * 0.55, 0, 0);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, 0, s * 1.2, 0, "#2a6a38", "#5fb05a"), 1.2, "#143a1e");
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(s * 1.1, 0);
  for (const u of [0.3, 0.55, 0.8]) {
    ctx.moveTo(s * u, 0);
    ctx.lineTo(s * (u + 0.18), -s * 0.24);
    ctx.moveTo(s * u, 0);
    ctx.lineTo(s * (u + 0.18), s * 0.24);
  }
  ctx.strokeStyle = "rgba(20,58,30,.6)";
  ctx.lineWidth = 0.9;
  ctx.stroke();
}
function rsBud(ctx, s, c) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-s * 0.6, -s * 0.3, -s * 0.5, -s * 1.2, 0, -s * 1.5);
  ctx.bezierCurveTo(s * 0.5, -s * 1.2, s * 0.6, -s * 0.3, 0, 0);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -s * 1.5, 0, 0, c[0], c[2]), 1.2, RS.ink);
  ctx.beginPath();
  ctx.moveTo(-s * 0.1, -s * 1.3);
  ctx.quadraticCurveTo(s * 0.2, -s * 0.7, -s * 0.1, -s * 0.2);
  ctx.strokeStyle = RS.ink;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sx * s * 0.7, -s * 0.2, sx * s * 0.5, -s * 0.8);
    ctx.quadraticCurveTo(sx * s * 0.2, -s * 0.3, 0, 0);
    ctx.closePath();
    inked(ctx, RS.leaf, 1, "#143a1e");
  }
}

export default function create(CARD, AVATAR) {
  return {
    name: "Jardim de Rosas",
    reach: { top: 76, side: 68, bottom: 68 },
    mat: ["#2a0f1a", "#12070c"],
    theme: cardTheme("#be123c", "#1f5a34"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.vine = [
        Strand(
          this.loop,
          m.bl + m.arc * 0.5,
          m.arc * 0.5 + m.side + m.arc + m.top * 0.46,
          1,
          5,
          { off: 8, wave: 7, freq: 17, gap: 0.04, size: 15, taper: 0.86 },
        ),
        Strand(
          this.loop,
          m.br + m.arc * 0.5,
          m.arc * 0.5 + m.side + m.arc + m.top * 0.46,
          -1,
          13,
          { off: 8, wave: 7, freq: 17, gap: 0.04, size: 15, taper: 0.86 },
        ),
        Strand(
          this.loop,
          m.bl + m.arc * 0.5,
          m.arc * 0.5 + m.top * 0.4,
          -1,
          21,
          { off: 8, wave: 6, freq: 17, gap: 0.085, size: 14, taper: 0.8 },
        ),
      ];
      this.t0 = 0.3;
      this.dur = 2.3;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.cols = [
        ["#ff8fa3", "#e11d48", "#881337"],
        ["#fecdd3", "#fb7185", "#be123c"],
        ["#fff1f2", "#fda4af", "#e11d48"],
        ["#ffe4a8", "#f59e0b", "#b45309"],
      ];
      this.rose = this.cols.map((c) => rsRose(c[0], c[1], c[2]));
      this.petal = sprite(14, (x) => {
        x.beginPath();
        x.moveTo(0, 5);
        x.bezierCurveTo(-6, 1, -4, -6, 0, -4);
        x.bezierCurveTo(4, -6, 6, 1, 0, 5);
        x.closePath();
        const g = x.createLinearGradient(0, -5, 0, 5);
        g.addColorStop(0, "#ffd1da");
        g.addColorStop(1, "#e11d48");
        x.fillStyle = g;
        x.fill();
      });
      this.fall = Drift(18, 151, {
        v: [20, 42],
        s: [0.7, 1.3],
        sway: 22,
        spin: 2.6,
      });
      this.fx = Drift(16, 157, {
        v: [18, 38],
        s: [0.7, 1.4],
        sway: 20,
        spin: 2.4,
      });
      const R = rng(19);
      this.dew = [];
      for (let i = 0; i < 14; i++) {
        const an = R() * TAU;
        this.dew.push({
          x: CARD.w / 2 + Math.cos(an) * (CARD.w / 2 + 16 + R() * 30),
          y: CARD.h / 2 + Math.sin(an) * (CARD.h / 2 + 14 + R() * 30),
          ph: R() * TAU,
          f: 1.5 + R() * 2,
        });
      }
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 1.4, 1.2);
      // the climbing rose: thorny stems up both sides and across the top, leaves, buds, and roses opening as it grows
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 1, 8, (c) => {
        for (const v of this.vine) {
          strandLine(c, v, g, [
            ["#143a1e", 7],
            [RS.stem, 4.4],
            ["rgba(170,220,150,.55)", 1.1],
          ]);
          const last = Math.floor(clamp(g) * v.n);
          c.fillStyle = "#143a1e";
          for (let i = 3; i <= last; i += 4) {
            const p = v.pts[i],
              s = i % 8 ? 1 : -1;
            c.beginPath();
            c.moveTo(p.x - p.tx * 2.4, p.y - p.ty * 2.4);
            c.lineTo(
              p.x + p.nx * 7 * s + p.tx * 2,
              p.y + p.ny * 7 * s + p.ty * 2,
            );
            c.lineTo(p.x + p.tx * 2.4, p.y + p.ty * 2.4);
            c.closePath();
            c.fill();
          }
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a);
            if (b.kind < 0.46) {
              c.rotate(b.i % 2 ? 0.6 : -0.6);
              c.scale(k, k);
              rsLeaf(c, b.s * 0.8, Math.sin(tt * 1.4 + b.ph) * 0.1);
            } else if (b.kind < 0.6) {
              c.rotate(Math.PI / 2 + Math.sin(tt * 1.4 + b.ph) * 0.08);
              c.scale(k, k);
              rsBud(c, b.s * 0.42, this.cols[b.i % 4]);
            }
          });
        }
        for (const v of this.vine)
          strandBits(
            c,
            v,
            T,
            (u) => this.when(u) + 0.25,
            (b, k) => {
              if (b.kind < 0.6) return;
              const s = (b.s / 24) * (0.86 + b.kind * 0.5) * k;
              c.translate(b.nx * b.s * 0.45 * b.out, b.ny * b.s * 0.45 * b.out);
              c.rotate(b.ph + Math.sin(tt * 0.9 + b.ph) * 0.1 + (1 - k) * 2);
              c.scale(s, s);
              c.drawImage(this.rose[b.i % 4], -24, -24, 48, 48);
            },
            0.7,
          );
      });
      // dew catches the light
      for (const d of this.dew) {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.globalAlpha = a * Math.pow(Math.abs(Math.sin(tt * d.f + d.ph)), 3);
        ctx.rotate(tt * 0.5 + d.ph);
        sparkPath(ctx, 4.6);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.restore();
      }
      // petals come loose and fall past the card
      this.fall.each(tt, CARD.w + 130, CARD.h + 150, (p, x, y, rot) => {
        const px = x - 65,
          py = y - 90;
        if (px > -6 && px < CARD.w + 6 && py > -6 && py < CARD.h + 6) return;
        ctx.globalAlpha = a * 0.9;
        stamp(ctx, this.petal, px, py, p.s, rot, Math.sin(rot * 1.7));
      });
      ctx.globalAlpha = 1;
      // where the stems meet at the top, the largest bloom, and a ladybird that walks the edge
      {
        const k = still ? 1 : easeOutBack(clamp((t - 2.3) / 0.8));
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w * 0.5, -14);
          glow(ctx, 0, 0, 60, `rgba(244,63,94,${0.3 * k})`);
          for (const [r, s] of [
            [-2.6, 20],
            [-0.55, 20],
            [-1.57, 16],
          ]) {
            ctx.save();
            ctx.rotate(r);
            ctx.translate(14, 0);
            ctx.scale(k, k);
            rsLeaf(ctx, s, Math.sin(tt * 1.3 + r) * 0.08);
            ctx.restore();
          }
          ctx.rotate(Math.sin(tt * 0.7) * 0.08 + (1 - k) * 2.4);
          ctx.scale(k * 1.5, k * 1.5);
          ctx.drawImage(this.rose[0], -24, -24, 48, 48);
          ctx.restore();
          for (const [dx, i, s] of [
            [-44, 1, 0.82],
            [44, 2, 0.82],
            [-78, 3, 0.56],
            [78, 0, 0.56],
          ]) {
            const kk = still
              ? 1
              : easeOutBack(clamp((t - 2.5 - Math.abs(dx) * 0.004) / 0.7));
            if (kk <= 0) continue;
            ctx.save();
            ctx.translate(
              CARD.w * 0.5 + dx,
              -10 - (Math.abs(dx) > 60 ? -3 : 0),
            );
            ctx.rotate(
              dx * 0.02 + Math.sin(tt * 0.8 + dx) * 0.08 + (1 - kk) * 2,
            );
            ctx.scale(kk * s, kk * s);
            ctx.drawImage(this.rose[i], -24, -24, 48, 48);
            ctx.restore();
          }
        }
      }
      {
        const a2 = still ? 1 : fade(t, 3, 0.6);
        if (a2 > 0) {
          const u = (tt * 0.035) % 1,
            x = 20 + (CARD.w - 40) * (u < 0.5 ? u * 2 : 2 - u * 2),
            dir = u < 0.5 ? 1 : -1;
          ctx.save();
          ctx.globalAlpha = a2;
          ctx.translate(x, CARD.h + 14);
          ctx.scale(dir, 1);
          ctx.lineCap = "round";
          ctx.strokeStyle = RS.ink;
          ctx.lineWidth = 1.2;
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 3, 0);
            ctx.lineTo(i * 4 + Math.sin(tt * 14 + i) * 1.4, 6);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(6.5, -1, 3.2, 0, TAU);
          ctx.fillStyle = RS.ink;
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, -2, 7, 5.6, 0, Math.PI, TAU);
          ctx.closePath();
          inked(ctx, "#ef4444", 1.3, RS.ink);
          ctx.beginPath();
          ctx.moveTo(0, -7.6);
          ctx.lineTo(0, -2);
          ctx.stroke();
          ctx.fillStyle = RS.ink;
          for (const [px, py] of [
            [-3.2, -4],
            [3, -4.4],
            [-1.6, -6],
            [3.6, -2.6],
          ]) {
            ctx.beginPath();
            ctx.arc(px, py, 1, 0, TAU);
            ctx.fill();
          }
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r,
        g = still ? 1 : easeInOut(clamp((t - 0.3) / 1.4));
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        77,
        77,
        R + 3.5,
        [
          [RS.ink, 7.4],
          ["#9f1239", 4.6],
          ["#fecdd3", 1.2, [2, 6], 4],
        ],
        tt,
      );
      ctx.restore();
      // a thorny stem grows right round, leaves along it, three roses where it closes
      ctx.lineCap = "round";
      for (const [col, w] of [
        ["#143a1e", 5],
        [RS.stem, 2.8],
      ]) {
        ctx.beginPath();
        for (let i = 0; i <= 70 * g; i++) {
          const an = Math.PI * 0.75 + (i / 70) * TAU,
            r = R + 9 + Math.sin(i * 0.7) * 1.6;
          ctx.lineTo(77 + Math.cos(an) * r, 77 + Math.sin(an) * r);
        }
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const u = (i + 0.5) / 12;
        if (u > g) continue;
        const an = Math.PI * 0.75 + u * TAU,
          k = still ? 1 : pop(t, 0.3 + u * 1.4, 0.4);
        ctx.save();
        ctx.translate(77 + Math.cos(an) * (R + 9), 77 + Math.sin(an) * (R + 9));
        ctx.rotate(an + (i % 2 ? 0.5 : Math.PI - 0.5));
        ctx.scale(k, k);
        rsLeaf(ctx, 9, Math.sin(tt * 1.5 + i) * 0.1);
        ctx.restore();
      }
      [
        [Math.PI * 0.75, 0, 0.78],
        [Math.PI * 0.75 - 0.5, 1, 0.56],
        [Math.PI * 0.75 + 0.5, 2, 0.56],
      ].forEach(([an, i, s], j) => {
        const k = still ? 1 : easeOutBack(clamp((t - 1.6 - j * 0.15) / 0.7));
        if (k <= 0) return;
        ctx.save();
        ctx.translate(
          77 + Math.cos(an) * (R + 11),
          77 + Math.sin(an) * (R + 11),
        );
        ctx.rotate(Math.sin(tt * 0.8 + j) * 0.1 + (1 - k) * 2);
        ctx.scale(k * s, k * s);
        ctx.drawImage(this.rose[i], -24, -24, 48, 48);
        ctx.restore();
      });
      if (!still && t > 2.4) {
        const c = (t - 2.4) % 3.4;
        if (c < 2.4) {
          ctx.globalAlpha = Math.min(1, c * 3) * clamp((2.4 - c) * 2);
          stamp(
            ctx,
            this.petal,
            77 - 34 + Math.sin(c * 2.4) * 8,
            77 + 30 + c * 22,
            0.9,
            c * 2.2,
            Math.cos(c * 4),
          );
          ctx.globalAlpha = 1;
        }
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(ctx, CARD.w * 0.5, 0, 200, `rgba(244,63,94,${0.22 * a})`);
      glow(ctx, CARD.w * 0.5, CARD.h + 20, 200, `rgba(34,120,70,${0.22 * a})`);
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.globalAlpha = a * 0.7;
        stamp(ctx, this.petal, x, y, p.s, rot, Math.sin(rot * 1.7));
      });
      ctx.globalAlpha = 1;
      // a handful of petals blow across when the profile opens
      if (!still) {
        const k = (t - 0.4) / 1.6;
        if (k > 0 && k < 1)
          for (let i = 0; i < 14; i++) {
            const q = k * (0.7 + (i % 5) * 0.08),
              x = -20 + (CARD.w + 40) * q,
              y = 60 + i * 30 + Math.sin(q * 6 + i) * 22;
            ctx.globalAlpha = Math.sin(clamp(q) * Math.PI);
            stamp(
              ctx,
              this.petal,
              x,
              y,
              1 + (i % 3) * 0.3,
              q * 9 + i,
              Math.cos(q * 12 + i),
            );
          }
        ctx.globalAlpha = 1;
      }
    },
  };
}
