// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutCubic,
  easeOutBack,
  rng,
  Particles,
  glow,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  rgrad,
  starPath,
  ringBase,
  Strand,
  strandLine,
  strandBits,
  Drift,
  settle,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Carnaval ----------
const CV = {
  ink: "#2a1040",
  cols: ["#ff3d7f", "#ff9f1c", "#ffe14d", "#2ec4b6", "#3a86ff", "#b15cff"],
};
// A feather from (0,0) along +x, `len` long.
function cvFeather(ctx, len, color, bend = 0) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(len * 0.12, 0);
  ctx.bezierCurveTo(
    len * 0.3,
    -len * 0.24 + bend,
    len * 0.85,
    -len * 0.26 + bend,
    len,
    bend * 1.4,
  );
  ctx.bezierCurveTo(
    len * 0.85,
    len * 0.2 + bend,
    len * 0.3,
    len * 0.2 + bend * 0.4,
    len * 0.12,
    0,
  );
  ctx.closePath();
  inked(ctx, grad(ctx, 0, 0, len, 0, color, "#fff"), 1.4, CV.ink);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, bend * 0.5, len * 0.96, bend * 1.35);
  ctx.strokeStyle = CV.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = "rgba(40,10,60,.3)";
  ctx.lineWidth = 0.9;
  for (let u = 0.25; u < 0.9; u += 0.11) {
    const x = len * u,
      y = bend * u * u * 1.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * 0.07, y - len * 0.14);
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * 0.07, y + len * 0.12);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(len * 0.84, bend * 1.05, len * 0.07, len * 0.05, 0, 0, TAU);
  ctx.fillStyle = CV.ink;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(len * 0.84, bend * 1.05, len * 0.028, 0, TAU);
  ctx.fillStyle = "#ffe14d";
  ctx.fill();
}
function cvMask(ctx, t) {
  ctx.lineJoin = "round";
  [
    [-2.5, 46, 0],
    [-2.1, 56, 1],
    [-1.75, 62, 2],
    [-1.4, 62, 3],
    [-1.05, 56, 4],
    [-0.65, 46, 5],
  ].forEach(([a, len, ci], i) => {
    ctx.save();
    ctx.translate(0, -8);
    ctx.rotate(a + Math.sin(t * 1.8 + i) * 0.04);
    cvFeather(ctx, len, CV.cols[ci], Math.sin(t * 2.2 + i) * 2.5);
    ctx.restore();
  });
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.bezierCurveTo(10, -17, 30, -18, 37, -9);
  ctx.bezierCurveTo(40, 4, 24, 14, 12, 11);
  ctx.bezierCurveTo(6, 9, 3, 3, 0, 3);
  ctx.bezierCurveTo(-3, 3, -6, 9, -12, 11);
  ctx.bezierCurveTo(-24, 14, -40, 4, -37, -9);
  ctx.bezierCurveTo(-30, -18, -10, -17, 0, -9);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, -37, -14, 37, 12, "#b15cff", "#ff3d7f", "#ff9f1c"),
    1.8,
    CV.ink,
  );
  ctx.strokeStyle = "#ffe14d";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = CV.ink;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 8, -3);
    ctx.quadraticCurveTo(sx * 18, -13, sx * 28, -4);
    ctx.quadraticCurveTo(sx * 18, 4, sx * 8, -3);
    ctx.closePath();
    ctx.fillStyle = "#16081f";
    ctx.fill();
    ctx.strokeStyle = "#ffe14d";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx * 31, 3, 2, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }
  ctx.save();
  ctx.translate(0, -9);
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(5, 0);
  ctx.lineTo(0, 7);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  inked(ctx, grad(ctx, -5, -7, 5, 7, "#9ff7ef", "#2ec4b6"), 1.2, CV.ink);
  ctx.restore();
  glow(ctx, 0, -9, 12, `rgba(160,255,245,${0.4 + 0.3 * Math.sin(t * 4)})`);
}
function cvTambourine(ctx, r, shake) {
  ctx.save();
  ctx.rotate(shake * 0.25);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  inked(ctx, grad(ctx, -r, -r, r, r, "#ffd98a", "#d9862a"), 1.8, CV.ink);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.76, 0, TAU);
  inked(
    ctx,
    rgrad(ctx, -r * 0.2, -r * 0.3, r, "#fffaf0", "#f2e2c4"),
    1.4,
    CV.ink,
  );
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3;
    ctx.save();
    ctx.translate(Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.88);
    ctx.rotate(a + shake * (i % 2 ? 1 : -1) * 0.6);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.2, r * 0.1, 0, 0, TAU);
    inked(ctx, "#ffe14d", 1.1, CV.ink);
    ctx.restore();
  }
  ctx.save();
  ctx.rotate(-0.4);
  for (const [c, w] of [
    ["#ff3d7f", 0],
    ["#2ec4b6", 1],
    ["#ffe14d", 2],
  ]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.24 + w * r * 0.2);
    ctx.lineTo(r * 0.5, -r * 0.24 + w * r * 0.2);
    ctx.strokeStyle = c;
    ctx.lineWidth = r * 0.13;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Carnaval",
    reach: { top: 116, side: 66, bottom: 64 },
    mat: ["#26103e", "#120820"],
    theme: cardTheme("#8e2de2", "#f2811c"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.st = [0, 1, 2, 3].map((i) =>
        Strand(
          this.loop,
          i < 2 ? m.tl + m.arc * 0.4 : m.right - m.arc * 0.4,
          m.side * (0.86 - (i % 2) * 0.16),
          i < 2 ? -1 : 1,
          4 + i * 7,
          {
            off: 8 + (i % 2) * 9,
            wave: 9,
            freq: 30 + i * 6,
            gap: 0.1,
            size: 9,
            taper: 1,
          },
        ),
      );
      this.t0 = 0.4;
      this.dur = 1.8;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.conf = Drift(26, 67, { v: [26, 58], s: [3, 6], sway: 16, spin: 5 });
      this.fx = Drift(28, 71, { v: [26, 60], s: [3, 6.5], sway: 14, spin: 5 });
      this.p = Particles();
      this.rand = rng(15);
      this.shot = 0;
      const R = rng(8);
      this.flags = [];
      for (let i = 0; i < 9; i++)
        this.flags.push({
          u: (i + 0.5) / 9,
          c: CV.cols[(i * 5) % 6],
          ph: R() * TAU,
        });
    },
    reset() {
      this.p.clear();
      this.rand = rng(15);
      this.shot = 0;
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand;
      // confetti cannons at the two bottom corners on arrival, and now and then afterwards
      if (
        (this.shot === 0 && t > 1.6) ||
        (this.shot > 0 && t > 1.6 + this.shot * 6)
      ) {
        this.shot++;
        for (const sx of [-1, 1])
          for (let i = 0; i < 30; i++) {
            const a = -Math.PI / 2 + sx * -0.45 + (R() - 0.5) * 0.9,
              v = 160 + R() * 240;
            this.p.add({
              x: sx < 0 ? -10 : CARD.w + 10,
              y: CARD.h + 30,
              vx: Math.cos(a) * v,
              vy: Math.sin(a) * v,
              g: 260,
              drag: 1.1,
              life: 1.6 + R() * 1.2,
              size: 2.2 + R() * 3,
              rot: R() * TAU,
              vr: (R() - 0.5) * 14,
              color: CV.cols[Math.floor(R() * 6)],
            });
          }
      }
      this.p.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.5, 1.2);
      this.conf.each(tt, CARD.w + 140, CARD.h + 170, (p, x, y, rot) => {
        const px = x - 70,
          py = y - 100;
        if (px > -4 && px < CARD.w + 4 && py > -4 && py < CARD.h + 4) return;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rot);
        ctx.scale(1, Math.sin(rot * 1.3));
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = CV.cols[p.i % 6];
        if (p.k < 0.5) ctx.fillRect(-p.s * 0.5, -p.s * 0.3, p.s, p.s * 0.6);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, p.s * 0.45, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      });
      // streamers spiral down both sides
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        this.st.forEach((v, i) => {
          strandLine(c, v, g, [
            [CV.ink, 6.4],
            [CV.cols[(i * 2 + 1) % 6], 4.2],
            ["rgba(255,255,255,.7)", 1.1, [5, 9]],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2);
            c.translate(0, -b.s * 1.2 * b.out);
            c.rotate(b.ph);
            c.scale(k, k);
            c.beginPath();
            if (b.kind < 0.5) c.arc(0, 0, b.s * 0.45, 0, TAU);
            else starPath(c, b.s * 0.7);
            inked(c, CV.cols[(b.i + i) % 6], 1, CV.ink);
          });
        });
      });
      // little flags on a string under the card
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.5) / 1.2)),
          sag = (u) => CARD.h + 18 + Math.sin(u * Math.PI) * 26;
        ctx.beginPath();
        for (let i = 0; i <= 30 * k; i++) {
          const u = i / 30;
          ctx.lineTo(-6 + (CARD.w + 12) * u, sag(u));
        }
        ctx.strokeStyle = CV.ink;
        ctx.lineWidth = 3.4;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        for (const f of this.flags) {
          if (f.u > k) continue;
          const kk = still ? 1 : pop(t, 0.5 + f.u * 1.2, 0.4);
          ctx.save();
          ctx.translate(-6 + (CARD.w + 12) * f.u, sag(f.u));
          ctx.rotate(Math.sin(tt * 2 + f.ph) * 0.14);
          ctx.scale(kk, kk);
          ctx.beginPath();
          ctx.moveTo(-11, 0);
          ctx.lineTo(11, 0);
          ctx.lineTo(11, 20);
          ctx.lineTo(0, 13);
          ctx.lineTo(-11, 20);
          ctx.closePath();
          inked(ctx, f.c, 1.4, CV.ink);
          ctx.fillStyle = "rgba(255,255,255,.35)";
          ctx.fillRect(-11, 0, 22, 4);
          ctx.restore();
        }
      }
      // on the top edge: the feathered mask and a tambourine that shakes
      {
        const k = still ? 1 : pop(t, 1, 0.7);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w * 0.32, -22);
          ctx.rotate(-0.08 + Math.sin(tt * 1.3) * 0.03);
          ctx.scale(1.4 * k, 1.4 * k);
          cvMask(ctx, tt);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : bounceOut((t - 1.4) / 0.8);
        if (still || t > 1.4) {
          const c = tt % 3.2,
            sh = !still && c < 1 ? Math.sin(c * 30) * (1 - c) : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.78 + sh * 3, -30 - (1 - k) * 130);
          ctx.rotate(0.2);
          cvTambourine(ctx, 27, sh);
          ctx.restore();
          if (Math.abs(sh) > 0.3) {
            ctx.fillStyle = "#fff";
            ctx.font = "700 15px Arial, sans-serif";
            ctx.fillText("♪", CARD.w * 0.78 + 30, -48 - c * 20);
          }
        }
      }
      for (const p of this.p.list) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.sin(p.rot * 1.4));
        ctx.globalAlpha = Math.min(1, (p.life - p.age) * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
        ctx.restore();
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r;
      // a fan of feathers behind the top, opening like a headdress
      const open = still ? 1 : easeOutBack(clamp((t - 0.4) / 0.9));
      [
        [-1.25, 30, 0],
        [-0.83, 36, 1],
        [-0.42, 40, 2],
        [0, 43, 3],
        [0.42, 40, 4],
        [0.83, 36, 5],
        [1.25, 30, 0],
      ].forEach(([d, len, ci], i) => {
        ctx.save();
        ctx.translate(77, 77 - R + 10);
        ctx.rotate(-Math.PI / 2 + d * open + Math.sin(tt * 1.8 + i) * 0.03);
        ctx.scale(open, open);
        cvFeather(ctx, len, CV.cols[ci], Math.sin(tt * 2.2 + i) * 2);
        ctx.restore();
      });
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        77,
        77,
        R + 3.5,
        [
          [CV.ink, 7.6],
          ["#ffe14d", 4.8],
        ],
        tt,
      );
      for (let i = 0; i < 22; i++) {
        const an = (i / 22) * TAU + tt * 0.2;
        ctx.beginPath();
        ctx.arc(
          77 + Math.cos(an) * (R + 3.5),
          77 + Math.sin(an) * (R + 3.5),
          2.5,
          0,
          TAU,
        );
        ctx.fillStyle = CV.cols[i % 6];
        ctx.fill();
        ctx.strokeStyle = CV.ink;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();
      {
        const k = still ? 1 : pop(t, 1, 0.5);
        ctx.save();
        ctx.translate(77, 77 - R - 1);
        ctx.scale(k, k);
        glow(
          ctx,
          0,
          0,
          15,
          `rgba(160,255,245,${0.4 + 0.3 * Math.sin(tt * 4)})`,
        );
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(7, 0);
        ctx.lineTo(0, 9);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        inked(ctx, grad(ctx, -7, -9, 7, 9, "#9ff7ef", "#2ec4b6"), 1.5, CV.ink);
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      // two spotlights sweep, confetti falls through them
      for (const [x, col, ph] of [
        [0, "255,61,127", 0],
        [CARD.w, "46,196,182", 2],
      ]) {
        const an =
          Math.PI / 2 + (x ? 0.5 : -0.5) + Math.sin(tt * 0.7 + ph) * 0.35;
        ctx.save();
        ctx.translate(x, -10);
        ctx.rotate(an - Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-70, CARD.h * 0.9);
        ctx.lineTo(70, CARD.h * 0.9);
        ctx.closePath();
        ctx.fillStyle = grad(
          ctx,
          0,
          0,
          0,
          CARD.h * 0.9,
          `rgba(${col},${0.3 * a})`,
          `rgba(${col},0)`,
        );
        ctx.fill();
        ctx.restore();
      }
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.scale(1, Math.sin(rot * 1.3));
        ctx.globalAlpha = a * 0.75;
        ctx.fillStyle = CV.cols[p.i % 6];
        if (p.k < 0.6) ctx.fillRect(-p.s * 0.5, -p.s * 0.3, p.s, p.s * 0.6);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, p.s * 0.45, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      });
    },
  };
}
