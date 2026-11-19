// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  lerp,
  smooth,
  easeInOut,
  rng,
  glow,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  rgrad,
  starPath,
  leafPath,
  sparkPath,
  ringBase,
  Strand,
  strandLine,
  strandBits,
  Drift,
  settle,
  twinkles,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Enturma ----------
const EN = {
  ink: "#10241c",
  lime: "#d8ef79",
  limeDark: "#9bbf2e",
  green: "#2f7a5c",
  paper: "#fbfdf3",
};
function enBook(ctx, w, h, c, back) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h, w, h, 2.5);
  inked(ctx, c, 1.5, EN.ink);
  ctx.fillStyle = EN.paper;
  ctx.fillRect(w / 2 - 6, -h + 2, 4.4, h - 4);
  ctx.fillStyle = back;
  ctx.fillRect(-w / 2 + 5, -h + 1, 3, h - 2);
  ctx.fillStyle = "rgba(255,255,255,.35)";
  ctx.fillRect(-w / 2 + 11, -h + 2.4, w * 0.4, 1.8);
}
// An open book around (0,0) with a graduation cap resting on it.
function enOpenBook(ctx, t, flip) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-46, 2);
  ctx.lineTo(0, 8);
  ctx.lineTo(46, 2);
  ctx.lineTo(46, 8);
  ctx.lineTo(0, 14);
  ctx.lineTo(-46, 8);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, -46, 0, 46, 0, EN.green, "#1c4d39", EN.green),
    1.7,
    EN.ink,
  );
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.quadraticCurveTo(sx * 20, -6, sx * 43, 1);
    ctx.lineTo(sx * 43, -26);
    ctx.quadraticCurveTo(sx * 20, -34, 0, -20);
    ctx.closePath();
    inked(ctx, grad(ctx, 0, 0, sx * 43, 0, "#e6ebd6", EN.paper), 1.6, EN.ink);
    ctx.strokeStyle = "rgba(47,122,92,.5)";
    ctx.lineWidth = 1.1;
    for (let i = 1; i < 5; i++) {
      const y = lerp(4, -22, i / 5);
      ctx.beginPath();
      ctx.moveTo(sx * 7, y);
      ctx.quadraticCurveTo(sx * 22, y - 9, sx * 37, y - 4);
      ctx.stroke();
    }
  }
  if (flip > 0 && flip < 1) {
    const a = flip * Math.PI,
      x = Math.cos(a) * 42;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.quadraticCurveTo(
      x * 0.5,
      -6 - Math.sin(a) * 18,
      x,
      1 - Math.sin(a) * 22,
    );
    ctx.lineTo(x, -26 - Math.sin(a) * 22);
    ctx.quadraticCurveTo(x * 0.5, -34 - Math.sin(a) * 16, 0, -20);
    ctx.closePath();
    inked(ctx, EN.paper, 1.5, EN.ink);
  }
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(0, 8);
  ctx.strokeStyle = EN.ink;
  ctx.lineWidth = 1.7;
  ctx.stroke();
}
function enCap(ctx, t, s) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const sw = Math.sin(t * 2.2) * 0.2;
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, 0);
  ctx.lineTo(-s * 0.55, s * 0.42);
  ctx.quadraticCurveTo(0, s * 0.72, s * 0.55, s * 0.42);
  ctx.lineTo(s * 0.55, 0);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, 0, 0, s * 0.6, "#1c4d39", "#0f2f23"), 1.7, EN.ink);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.42);
  ctx.lineTo(s, 0);
  ctx.lineTo(0, s * 0.42);
  ctx.lineTo(-s, 0);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, -s, -s * 0.4, s, s * 0.4, "#3f9a74", "#1c4d39"),
    1.8,
    EN.ink,
  );
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.1, 0, TAU);
  inked(ctx, EN.lime, 1.2, EN.ink);
  ctx.save();
  ctx.rotate(sw);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.7, s * 0.1, s * 0.78, s * 0.62);
  ctx.strokeStyle = EN.ink;
  ctx.lineWidth = 3.4;
  ctx.stroke();
  ctx.strokeStyle = EN.lime;
  ctx.lineWidth = 1.7;
  ctx.stroke();
  ctx.translate(s * 0.78, s * 0.62);
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(i * 1.6, s * 0.36);
    ctx.strokeStyle = EN.lime;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 2.6, 0, TAU);
  inked(ctx, EN.limeDark, 1, EN.ink);
  ctx.restore();
}
function enPlane(ctx, s) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s, -s * 0.62);
  ctx.lineTo(-s * 0.55, 0);
  ctx.lineTo(-s, s * 0.62);
  ctx.closePath();
  inked(ctx, EN.paper, Math.max(1, s * 0.11), EN.ink);
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.55, 0);
  ctx.lineTo(-s * 0.72, s * 0.34);
  ctx.closePath();
  inked(ctx, "#cfd8bd", Math.max(1, s * 0.11), EN.ink);
}
function enPencil(ctx, len) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.roundRect(-len * 0.5, -4, len * 0.14, 8, 2.6);
  inked(ctx, "#f9a8b8", 1.2, EN.ink);
  ctx.fillStyle = "#cbd5c0";
  ctx.fillRect(-len * 0.36, -4, len * 0.06, 8);
  ctx.beginPath();
  ctx.rect(-len * 0.3, -4, len * 0.62, 8);
  inked(ctx, grad(ctx, 0, -4, 0, 4, "#fde68a", "#f2b63c"), 1.2, EN.ink);
  ctx.beginPath();
  ctx.moveTo(len * 0.32, -4);
  ctx.lineTo(len * 0.5, 0);
  ctx.lineTo(len * 0.32, 4);
  ctx.closePath();
  inked(ctx, "#f2dcb8", 1.2, EN.ink);
  ctx.beginPath();
  ctx.moveTo(len * 0.44, -1.4);
  ctx.lineTo(len * 0.5, 0);
  ctx.lineTo(len * 0.44, 1.4);
  ctx.closePath();
  ctx.fillStyle = EN.ink;
  ctx.fill();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Enturma",
    reach: { top: 78, side: 64, bottom: 68 },
    mat: ["#12261d", "#08140f"],
    theme: cardTheme("#7fa82a", "#1f5a43"),
    init() {
      this.loop = frameLoop(CARD, 9);
      const m = this.loop.m;
      this.line = [
        Strand(this.loop, m.tl + m.arc * 0.5, m.side * 0.84, -1, 3, {
          off: 8,
          wave: 4,
          freq: 12,
          gap: 0.12,
          size: 12,
          taper: 1,
          outward: 1,
        }),
        Strand(this.loop, m.right - m.arc * 0.5, m.side * 0.84, 1, 9, {
          off: 8,
          wave: 4,
          freq: 12,
          gap: 0.12,
          size: 12,
          taper: 1,
          outward: 1,
        }),
      ];
      this.t0 = 0.4;
      this.dur = 1.7;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.stars = twinkles(14, 141, CARD.w, CARD.h, 26, 76);
      this.fx = Drift(10, 149, {
        v: [-20, -8],
        s: [7, 12],
        sway: 12,
        spin: 0.6,
      });
      const R = rng(16);
      this.planes = [0, 1, 2].map((i) => ({
        lag: i * 120 + R() * 40,
        off: 30 + R() * 22,
        ph: R() * TAU,
      }));
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.3, 1.2),
        L = this.loop.L;
      for (const s of this.stars) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = a * (0.3 + 0.7 * Math.abs(Math.sin(tt * s.f + s.ph)));
        ctx.rotate(tt * 0.3 + s.ph);
        if (s.s > 2.8) {
          starPath(ctx, s.s * 2.2);
          ctx.fillStyle = EN.lime;
        } else {
          sparkPath(ctx, s.s * 2);
          ctx.fillStyle = "#f4ffd0";
        }
        ctx.fill();
        ctx.restore();
      }
      // a lime ribbon down each side, with what a study session is made of pinned to it
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        this.line.forEach((v, vi) => {
          strandLine(c, v, g, [
            [EN.ink, 7],
            [EN.lime, 4.4],
            ["rgba(255,255,255,.6)", 1, [6, 9]],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2);
            c.translate(0, -b.s * 1.2);
            c.rotate(Math.sin(tt * 1.3 + b.ph) * 0.1 + (b.i % 2 ? 0.3 : -0.3));
            c.scale(k, k);
            const kind = (b.i + vi) % 4;
            if (kind === 0) {
              c.beginPath();
              c.rect(-9, -9, 18, 18);
              inked(c, ["#fde68a", "#bbf7d0", "#fbcfe8"][b.i % 3], 1.3, EN.ink);
              c.strokeStyle = "rgba(16,36,28,.5)";
              c.lineWidth = 1.1;
              for (const y of [-3, 1, 5]) {
                c.beginPath();
                c.moveTo(-5, y);
                c.lineTo(5 - (y > 3 ? 4 : 0), y);
                c.stroke();
              }
              c.beginPath();
              c.arc(0, -8, 2.2, 0, TAU);
              inked(c, "#ef4444", 1, EN.ink);
            } else if (kind === 1) {
              c.rotate(-0.7);
              enPencil(c, 26);
            } else if (kind === 2) {
              glow(
                c,
                0,
                0,
                14,
                `rgba(216,239,121,${0.35 + 0.2 * Math.sin(tt * 3 + b.ph)})`,
              );
              starPath(c, 9.5);
              inked(c, EN.lime, 1.3, EN.ink);
            } else {
              c.beginPath();
              c.arc(0, -2, 7.5, Math.PI * 0.85, Math.PI * 2.15);
              c.lineTo(3, 7);
              c.lineTo(-3, 7);
              c.closePath();
              glow(
                c,
                0,
                -2,
                15,
                `rgba(253,230,138,${0.4 + 0.25 * Math.sin(tt * 2.4 + b.ph)})`,
              );
              inked(c, "#fde68a", 1.3, EN.ink);
              c.beginPath();
              c.roundRect(-3, 7, 6, 4, 1);
              inked(c, "#94a3b8", 1, EN.ink);
            }
          });
        });
      });
      // a pile of books with a lamp in one corner, a mug of coffee and an apple in the other
      {
        const k = still ? 1 : pop(t, 0.8, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(48, CARD.h + 60);
          ctx.scale(k, k);
          [
            [0, 0, 56, 12, "#2f7a5c", EN.lime],
            [4, -12, 48, 11, "#e0a43a", "#7a4a12"],
            [-3, -23, 50, 12, "#c2413a", "#fde68a"],
          ].forEach(([x, y, w, h, c, sp]) => {
            ctx.save();
            ctx.translate(x, y);
            enBook(ctx, w, h, c, sp);
            ctx.restore();
          });
          ctx.save();
          ctx.translate(-8, -35);
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          const cone = still ? 1 : clamp((t - 1.6) / 0.3);
          if (cone > 0) {
            ctx.save();
            ctx.globalAlpha = 0.3 * cone;
            ctx.beginPath();
            ctx.moveTo(14, -26);
            ctx.lineTo(48, 4);
            ctx.lineTo(-6, 4);
            ctx.closePath();
            ctx.fillStyle = grad(
              ctx,
              0,
              -26,
              0,
              4,
              "#fef9c3",
              "rgba(254,249,195,0)",
            );
            ctx.fill();
            ctx.restore();
          }
          ctx.beginPath();
          ctx.ellipse(0, 0, 11, 3.4, 0, 0, TAU);
          inked(ctx, "#334155", 1.4, EN.ink);
          const arm = () => {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-6, -20);
            ctx.lineTo(8, -30);
          };
          arm();
          ctx.strokeStyle = EN.ink;
          ctx.lineWidth = 5;
          ctx.stroke();
          arm();
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 2.6;
          ctx.stroke();
          ctx.save();
          ctx.translate(11, -30);
          ctx.rotate(0.7);
          ctx.beginPath();
          ctx.moveTo(-5, -5);
          ctx.lineTo(5, -5);
          ctx.lineTo(12, 7);
          ctx.lineTo(-12, 7);
          ctx.closePath();
          inked(ctx, grad(ctx, 0, -5, 0, 7, EN.lime, EN.limeDark), 1.5, EN.ink);
          if (cone > 0) glow(ctx, 0, 9, 13, "rgba(254,249,195,.8)");
          ctx.restore();
          ctx.restore();
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.1, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w - 46, CARD.h + 60);
          ctx.scale(k, k);
          ctx.lineCap = "round";
          for (let i = 0; i < 3; i++) {
            const q = (tt * 0.45 + i * 0.33) % 1;
            ctx.beginPath();
            ctx.moveTo(-6 + i * 5, -30 - q * 16);
            ctx.quadraticCurveTo(
              -2 + i * 5 + Math.sin(tt * 2 + i) * 3,
              -36 - q * 16,
              -6 + i * 5,
              -42 - q * 16,
            );
            ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - q)})`;
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(12, -14, 7, -1.2, 1.2);
          ctx.strokeStyle = EN.ink;
          ctx.lineWidth = 5.4;
          ctx.stroke();
          ctx.strokeStyle = EN.lime;
          ctx.lineWidth = 2.6;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-13, -27);
          ctx.lineTo(13, -27);
          ctx.lineTo(10, 0);
          ctx.lineTo(-10, 0);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, -13, 0, 13, 0, EN.lime, EN.limeDark),
            1.7,
            EN.ink,
          );
          ctx.beginPath();
          ctx.ellipse(0, -27, 13, 3.4, 0, 0, TAU);
          inked(ctx, "#5b3a22", 1.4, EN.ink);
          ctx.save();
          ctx.translate(-28, -9);
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.bezierCurveTo(-13, -15, -15, 6, -5, 10);
          ctx.quadraticCurveTo(0, 8, 5, 10);
          ctx.bezierCurveTo(15, 6, 13, -15, 0, -8);
          ctx.closePath();
          inked(
            ctx,
            rgrad(ctx, -4, -4, 16, "#fca5a5", "#dc2626", "#7f1d1d"),
            1.6,
            EN.ink,
          );
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.quadraticCurveTo(1, -14, 4, -16);
          ctx.strokeStyle = "#5b3a22";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.save();
          ctx.translate(3, -14);
          ctx.rotate(-0.5);
          leafPath(ctx, 9, 3.2);
          inked(ctx, "#4ade80", 1, EN.ink);
          ctx.restore();
          ctx.restore();
          ctx.restore();
        }
      }
      // paper planes fly a lap on arrival, then one keeps circling
      const S = L * 1.08 * easeInOut(clamp(T / 2.9));
      this.planes.forEach((p, i) => {
        const gone = i === 0 ? 0 : still ? 1 : smooth((t - 2.8) / 0.8);
        if (gone >= 1) return;
        const s =
          (i === 0 && (still || t > 2.9)
            ? S + (tt - (still ? 0 : 2.9)) * 34
            : S) - p.lag;
        if (s < -30 && !still) return;
        const q = this.loop.at(s),
          off = p.off + Math.sin(tt * 1.7 + p.ph) * 9 + gone * 120;
        ctx.save();
        ctx.translate(q.x + q.nx * off, q.y + q.ny * off);
        ctx.rotate(Math.atan2(q.ty, q.tx) + Math.sin(tt * 2 + p.ph) * 0.12);
        ctx.globalAlpha = (still ? 1 : clamp((s + 30) / 50)) * (1 - gone);
        enPlane(ctx, 11);
        ctx.restore();
      });
      // on the top edge: the open book of the brand with a cap on it, and a streak flame that never goes out
      {
        const k = still ? 1 : bounceOut((t - 1) / 0.85);
        if (still || t > 1) {
          const c = tt % 5,
            flip = !still && t > 2.4 && c < 0.9 ? c / 0.9 : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.32, -12 - (1 - k) * 150);
          ctx.scale(1.12, 1.12);
          glow(ctx, 0, -14, 70, "rgba(216,239,121,.22)");
          enOpenBook(ctx, tt, flip);
          ctx.restore();
          const kc = still ? 1 : bounceOut((t - 1.7) / 0.7);
          if (still || t > 1.7) {
            ctx.save();
            ctx.translate(CARD.w * 0.32 + 6, -58 - (1 - kc) * 120);
            ctx.rotate(-0.12 + Math.sin(tt * 1.3) * 0.02);
            enCap(ctx, tt, 30);
            ctx.restore();
          }
        }
      }
      {
        const k = still ? 1 : pop(t, 2, 0.5);
        if (k > 0) {
          const x = CARD.w * 0.76;
          ctx.save();
          ctx.translate(x, -4);
          ctx.scale(k, k);
          glow(
            ctx,
            0,
            -22,
            42,
            `rgba(255,150,50,${0.4 + 0.15 * Math.sin(tt * 9)})`,
          );
          for (const [w, h, c0, c1, ph] of [
            [19, 46, "#ff8a1c", "#f2501c", 0],
            [12, 32, "#ffd23c", "#ff9d1c", 1.7],
            [6, 18, "#fffbe0", "#ffe27a", 3.1],
          ]) {
            const sw = Math.sin(tt * 8 + ph) * 3;
            ctx.beginPath();
            ctx.moveTo(0, 2);
            ctx.bezierCurveTo(
              -w * 1.1,
              -h * 0.15,
              -w * 0.5 + sw,
              -h * 0.66,
              sw * 1.4,
              -h,
            );
            ctx.bezierCurveTo(w * 0.3 + sw, -h * 0.6, w * 1.1, -h * 0.2, 0, 2);
            ctx.closePath();
            ctx.fillStyle = grad(ctx, 0, -h, 0, 2, c0, c1);
            ctx.fill();
            if (w === 19) {
              ctx.strokeStyle = EN.ink;
              ctx.lineWidth = 1.7;
              ctx.lineJoin = "round";
              ctx.stroke();
            }
          }
          ctx.beginPath();
          ctx.roundRect(-15, 2 - 9, 30, 9, 4.5);
          ctx.restore();
        }
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
          [EN.ink, 7.4],
          [EN.lime, 4.6],
        ],
        tt,
      );
      ctx.restore();
      // laurels up both sides
      for (const sx of [-1, 1])
        for (let i = 0; i < 8; i++) {
          const an = Math.PI / 2 + sx * (0.28 + i * 0.3),
            k = still ? 1 : pop(t, 0.4 + i * 0.07, 0.4);
          if (k <= 0) continue;
          ctx.save();
          ctx.translate(
            77 + Math.cos(an) * (R + 8),
            77 + Math.sin(an) * (R + 8),
          );
          ctx.rotate(an + sx * 1.1 + Math.sin(tt * 1.6 + i) * 0.05);
          ctx.scale(k, k);
          leafPath(ctx, 15, 4.6);
          inked(ctx, grad(ctx, 0, 0, 15, 0, EN.limeDark, EN.lime), 1.2, EN.ink);
          ctx.restore();
        }
      {
        const k = still ? 1 : pop(t, 1.1, 0.5);
        ctx.save();
        ctx.translate(77, 77 + R + 9);
        ctx.scale(k, k);
        glow(
          ctx,
          0,
          0,
          16,
          `rgba(216,239,121,${0.4 + 0.2 * Math.sin(tt * 3)})`,
        );
        ctx.rotate(Math.sin(tt * 1.2) * 0.08);
        starPath(ctx, 10);
        inked(ctx, EN.lime, 1.5, EN.ink);
        ctx.restore();
      }
      {
        const k = still ? 1 : bounceOut((t - 0.6) / 0.8);
        if (still || t > 0.6) {
          ctx.save();
          ctx.translate(77 + 2, 77 - R - 4 - (1 - k) * 70);
          ctx.rotate(-0.16);
          enCap(ctx, tt, 31);
          ctx.restore();
        }
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(ctx, CARD.w * 0.3, 0, 200, `rgba(216,239,121,${0.2 * a})`);
      glow(ctx, CARD.w * 0.5, CARD.h + 30, 200, `rgba(47,122,92,${0.3 * a})`);
      // notebook lines, very faint, and what you are studying rising off the page
      ctx.save();
      ctx.globalAlpha = 0.07 * a;
      ctx.strokeStyle = EN.lime;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 150; y < CARD.h; y += 22) {
        ctx.moveTo(0, y);
        ctx.lineTo(CARD.w, y);
      }
      ctx.stroke();
      ctx.restore();
      const sym = ["π", "∑", "√", "∞", "A+", "x²", "{ }", "∫", "Δ", "α"];
      ctx.save();
      ctx.font = "700 13px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(rot) * 0.3);
        ctx.globalAlpha =
          a * 0.34 * (0.5 + 0.5 * Math.abs(Math.sin(tt * p.f + p.ph)));
        ctx.fillStyle = p.i % 3 ? EN.lime : "#f4ffd0";
        ctx.font = `700 ${Math.round(p.s + 5)}px Georgia, serif`;
        ctx.fillText(sym[p.i % 10], 0, 0);
        ctx.restore();
      });
      ctx.restore();
      // a paper plane crosses the card when the profile opens
      if (!still) {
        const k = (t - 0.5) / 1.8;
        if (k > 0 && k < 1) {
          const x = -30 + (CARD.w + 60) * k,
            y = CARD.h * 0.6 - Math.sin(k * Math.PI) * 120;
          ctx.save();
          ctx.setLineDash([4, 7]);
          ctx.beginPath();
          for (let i = 0; i <= 20; i++) {
            const q = (k * i) / 20;
            ctx.lineTo(
              -30 + (CARD.w + 60) * q,
              CARD.h * 0.6 - Math.sin(q * Math.PI) * 120,
            );
          }
          ctx.strokeStyle = `rgba(216,239,121,${0.6 * (1 - k)})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.translate(x, y);
          ctx.rotate(-Math.cos(k * Math.PI) * 0.7);
          ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9 + 0.1;
          enPlane(ctx, 12);
          ctx.restore();
        }
      }
    },
  };
}
