// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutCubic,
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
  Drift,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Games ----------
const GM = {
  ink: "#120a2a",
  violet: "#8b5cf6",
  cyan: "#22d3ee",
  pink: "#f472b6",
  yellow: "#fde047",
  green: "#4ade80",
};
// Pixel art from rows of characters: each letter picks a colour, "." is empty.
function gmPixels(ctx, rows, px, pal) {
  const h = rows.length,
    w = rows[0].length;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = pal[rows[y][x]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect((x - w / 2) * px, (y - h) * px, px + 0.4, px + 0.4);
    }
}
// An original pixel critter, two frames: antennae, two wide eyes, little legs that shuffle.
const GM_ALIEN = [
  [
    "..a...a..",
    "...aaa...",
    ".aaaaaaa.",
    "aawwawwaa",
    "aawkawkaa",
    "aaaaaaaaa",
    ".aa.a.aa.",
    "aa.....aa",
  ],
  [
    "..a...a..",
    "...aaa...",
    ".aaaaaaa.",
    "aawwawwaa",
    "aakwakwaa",
    "aaaaaaaaa",
    ".aa.a.aa.",
    ".a.a.a.a.",
  ],
];
const GM_HEART = [
  ".rr.rr.",
  "rwrrrrr",
  "rrrrrrr",
  ".rrrrr.",
  "..rrr..",
  "...r...",
];
const GM_SWORD = [
  "......w",
  ".....ws",
  "....ws.",
  "g..ws..",
  ".gws...",
  ".bg....",
  "b..g...",
];
function gmPad(ctx, t, press) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-34, -30);
  ctx.quadraticCurveTo(0, -36, 34, -30);
  ctx.bezierCurveTo(52, -28, 56, 2, 46, 6);
  ctx.bezierCurveTo(36, 10, 30, -6, 18, -8);
  ctx.lineTo(-18, -8);
  ctx.bezierCurveTo(-30, -6, -36, 10, -46, 6);
  ctx.bezierCurveTo(-56, 2, -52, -28, -34, -30);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, 0, -36, 0, 8, "#f5f3ff", "#c4b5fd", "#7c3aed"),
    1.9,
    GM.ink,
  );
  ctx.fillStyle = "#1e1b3a";
  ctx.beginPath();
  ctx.roundRect(-34, -22, 7, 19, 2);
  ctx.roundRect(-40, -16, 19, 7, 2);
  ctx.fill();
  if (press === 0) {
    ctx.fillStyle = GM.cyan;
    ctx.fillRect(-34, -22, 7, 6);
  }
  [
    [32, -24, GM.yellow, 1],
    [40, -16, "#f87171", 2],
    [24, -16, GM.cyan, 3],
    [32, -8, GM.green, 4],
  ].forEach(([x, y, c, i]) => {
    const on = press === i;
    if (on) glow(ctx, x, y, 10, "rgba(255,255,255,.8)");
    ctx.beginPath();
    ctx.arc(x, y + (on ? 0.8 : 0), 4.2, 0, TAU);
    inked(ctx, c, 1.3, GM.ink);
  });
  for (const x of [-7, 7]) {
    ctx.beginPath();
    ctx.roundRect(x - 4, -24, 8, 3.4, 1.7);
    ctx.fillStyle = "#1e1b3a";
    ctx.fill();
  }
  const led = 0.5 + 0.5 * Math.sin(t * 4);
  glow(ctx, 0, -15, 7, `rgba(74,222,128,${0.7 * led})`);
  ctx.beginPath();
  ctx.arc(0, -15, 2, 0, TAU);
  ctx.fillStyle = GM.green;
  ctx.fill();
}
function gmCoin(ctx, r, spin) {
  const w = Math.abs(Math.cos(spin));
  ctx.beginPath();
  ctx.ellipse(0, 0, r * Math.max(0.16, w), r, 0, 0, TAU);
  inked(ctx, grad(ctx, -r, 0, r, 0, "#fff3a8", "#f2b63c"), 1.3, GM.ink);
  if (w > 0.4) {
    ctx.fillStyle = "#c8860f";
    ctx.fillRect(-r * 0.12 * w, -r * 0.5, r * 0.24 * w, r);
  }
}

export default function create(CARD, AVATAR) {
  return {
    name: "Games",
    reach: { top: 74, side: 64, bottom: 68 },
    mat: ["#1a1040", "#0b0620"],
    theme: cardTheme("#7c3aed", "#0891b2"),
    init() {
      this.loop = frameLoop(CARD, 10);
      const m = this.loop.m;
      this.plat = [
        Strand(this.loop, m.tl + m.arc * 0.5, m.side * 0.86, -1, 3, {
          off: 12,
          wave: 0,
          gap: 0.13,
          size: 9,
          taper: 1,
          outward: 1,
        }),
        Strand(this.loop, m.right - m.arc * 0.5, m.side * 0.86, 1, 9, {
          off: 12,
          wave: 0,
          gap: 0.13,
          size: 9,
          taper: 1,
          outward: 1,
        }),
      ];
      this.t0 = 0.4;
      this.dur = 1.6;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.starsFar = Drift(26, 131, {
        v: [30, 70],
        s: [1, 2.4],
        sway: 0,
        spin: 0,
      });
      this.fx = Drift(8, 137, { v: [16, 30], s: [9, 13], sway: 0, spin: 0 });
      const R = rng(8);
      this.shapes = [
        [
          [0, 0],
          [1, 0],
        ],
        [
          [0, 0],
          [0, 1],
        ],
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        [[0, 0]],
        [
          [0, 0],
          [1, 1],
        ],
      ];
      this.sp = Particles();
      this.rand = rng(22);
      this.got = 0;
    },
    reset() {
      this.sp.clear();
      this.rand = rng(22);
      this.got = 0;
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand,
        n = Math.floor((t - 2.5) / 3.4);
      if (t > 2.5 && n >= this.got) {
        this.got = n + 1;
        for (let i = 0; i < 10; i++) {
          const a = R() * TAU,
            v = 30 + R() * 70;
          this.sp.add({
            x: CARD.w * 0.74,
            y: -64,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            drag: 2,
            life: 0.5 + R() * 0.4,
            size: 2 + R() * 2,
          });
        }
      }
      this.sp.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      // ladders of pixel blocks on both sides, with coins, hearts and stars to collect
      const g = this.front(T);
      this.plat.forEach((v, vi) => {
        const last = Math.floor(clamp(g) * v.n);
        for (let i = 0; i <= last; i += 3) {
          const p = v.pts[i];
          ctx.fillStyle = GM.ink;
          ctx.fillRect(Math.round(p.x) - 7, Math.round(p.y) - 7, 14, 14);
          ctx.fillStyle = (i / 3) % 2 ? "#6d28d9" : GM.violet;
          ctx.fillRect(Math.round(p.x) - 5.5, Math.round(p.y) - 5.5, 11, 11);
          ctx.fillStyle = "rgba(255,255,255,.35)";
          ctx.fillRect(Math.round(p.x) - 5.5, Math.round(p.y) - 5.5, 11, 3);
        }
        for (const b of v.bits) {
          const k = still ? 1 : pop(t, this.when(b.u), 0.4);
          if (k <= 0) continue;
          ctx.save();
          ctx.translate(
            b.x + b.nx * 20,
            b.y + b.ny * 20 + Math.sin(tt * 2.4 + b.ph) * 3,
          );
          ctx.scale(k, k);
          const kind = (b.i + vi) % 3;
          if (kind === 0) gmCoin(ctx, 8, tt * 3 + b.ph);
          else if (kind === 1) {
            ctx.translate(0, 9);
            gmPixels(ctx, GM_HEART, 2.6, { r: "#f43f5e", w: "#fecdd3" });
          } else {
            glow(
              ctx,
              0,
              0,
              13,
              `rgba(253,224,71,${0.4 + 0.3 * Math.sin(tt * 5 + b.ph)})`,
            );
            ctx.rotate(Math.sin(tt * 2 + b.ph) * 0.3);
            starPath(ctx, 9);
            inked(ctx, GM.yellow, 1.3, GM.ink);
          }
          ctx.restore();
        }
      });
      // an arcade stick in one corner, a pixel sword stuck in the ground in the other
      {
        const k = still ? 1 : pop(t, 0.8, 0.6);
        if (k > 0) {
          const lean = still ? 0.2 : Math.sin(tt * 1.7) * 0.34;
          ctx.save();
          ctx.translate(40, CARD.h + 56);
          ctx.scale(k, k);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.roundRect(-30, -14, 60, 16, 6);
          inked(
            ctx,
            grad(ctx, 0, -14, 0, 2, "#4c1d95", "#1e1b3a"),
            1.7,
            GM.ink,
          );
          for (const [x, c] of [
            [12, "#f87171"],
            [22, GM.cyan],
          ]) {
            ctx.beginPath();
            ctx.ellipse(x, -13, 4.4, 2.4, 0, 0, TAU);
            inked(ctx, c, 1.2, GM.ink);
          }
          ctx.save();
          ctx.translate(-10, -14);
          ctx.rotate(lean);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -24);
          ctx.strokeStyle = GM.ink;
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, -28, 9, 0, TAU);
          inked(
            ctx,
            rgrad(ctx, -3, -31, 12, "#fecaca", "#ef4444", "#991b1b"),
            1.6,
            GM.ink,
          );
          ctx.restore();
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : bounceOut((t - 1.2) / 0.7);
        if (still || t > 1.2) {
          ctx.save();
          ctx.translate(CARD.w - 38, CARD.h + 60 - (1 - k) * 90);
          ctx.rotate(Math.PI * 0.75 * 0 + 0);
          glow(
            ctx,
            0,
            -24,
            30,
            `rgba(34,211,238,${0.3 + 0.15 * Math.sin(tt * 3)})`,
          );
          ctx.scale(1, -1);
          ctx.translate(0, 44);
          ctx.rotate((-Math.PI / 4) * 0);
          gmPixels(ctx, GM_SWORD, 6, {
            w: "#f8fafc",
            s: "#94a3b8",
            g: GM.yellow,
            b: "#7c2d12",
          });
          ctx.restore();
        }
      }
      // an XP bar fills under the card, then starts again a level up
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.6) / 0.8)),
          w = (CARD.w - 150) * k,
          x = 86,
          y = CARD.h + 24,
          lv = still ? 0.7 : (tt * 0.16) % 1;
        ctx.save();
        ctx.globalAlpha = k;
        ctx.beginPath();
        ctx.roundRect(x, y, w, 10, 5);
        inked(ctx, "#1e1b3a", 1.6, GM.ink);
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, Math.max(0, (w - 4) * lv), 6, 3);
        ctx.fillStyle = grad(ctx, x, 0, x + w, 0, GM.cyan, GM.green);
        ctx.fill();
        ctx.font = "700 9px Consolas, Menlo, monospace";
        ctx.fillStyle = "#fff";
        ctx.textBaseline = "middle";
        ctx.textAlign = "right";
        ctx.fillText("XP", x - 5, y + 5.5);
        ctx.restore();
      }
      // top edge: the gamepad plays itself; a pixel invader hops and drops a coin
      {
        const k = still ? 1 : bounceOut((t - 0.9) / 0.85);
        if (still || t > 0.9) {
          const press = still ? 1 : Math.floor(tt * 3.2) % 6;
          ctx.save();
          ctx.translate(CARD.w * 0.3, -2 - (1 - k) * 150);
          ctx.rotate(Math.sin(tt * 1.6) * 0.05);
          ctx.scale(1.12, 1.12);
          gmPad(ctx, tt, press);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.7, 0.5);
        if (k > 0) {
          const c = tt % 1.7,
            hop = still ? 0 : Math.abs(Math.sin((c / 1.7) * Math.PI)) * 12,
            fr = ((Math.floor(tt * 3) % 2) + 2) % 2;
          ctx.save();
          ctx.translate(CARD.w * 0.74, -3 - hop);
          ctx.scale(k, k);
          gmPixels(ctx, GM_ALIEN[fr], 4.8, {
            a: GM.green,
            w: "#fff",
            k: GM.ink,
          });
          ctx.fillStyle = GM.ink;
          ctx.restore();
          const cc = (tt - 2.5) % 3.4;
          if (!still && t > 2.5 && cc < 1) {
            ctx.save();
            ctx.translate(CARD.w * 0.74, -50 - easeOutCubic(cc) * 26);
            ctx.globalAlpha = 1 - cc;
            gmCoin(ctx, 8, tt * 12);
            ctx.font = "700 11px Consolas, Menlo, monospace";
            ctx.fillStyle = GM.yellow;
            ctx.fillText("+10", 12, 4);
            ctx.restore();
          }
          for (const p of this.sp.list) {
            ctx.globalAlpha = 1 - p.age / p.life;
            ctx.fillStyle = GM.yellow;
            ctx.fillRect(p.x, p.y, p.size, p.size);
          }
          ctx.globalAlpha = 1;
        }
      }
      // "press start" blinks once the scene is set
      {
        const on = still ? 1 : t > 2.6 && Math.sin(tt * 4) > -0.2 ? 1 : 0;
        if (on) {
          ctx.save();
          ctx.font = "700 11px Consolas, Menlo, monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = GM.pink;
          ctx.fillText("PRESS START", CARD.w * 0.5 + 1, CARD.h + 55);
          ctx.fillStyle = "#fff";
          ctx.fillText("PRESS START", CARD.w * 0.5, CARD.h + 54);
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.6),
        R = AVATAR.r;
      // a ring built of pixels, a light running round it
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(ctx, 77, 77, R + 4, [[GM.ink, 9]]);
      const n = 28,
        head = Math.floor(tt * 14) % n;
      for (let i = 0; i < n; i++) {
        const an = (i / n) * TAU - Math.PI / 2,
          d = (head - i + n) % n,
          lit = d < 6;
        ctx.save();
        ctx.translate(77 + Math.cos(an) * (R + 4), 77 + Math.sin(an) * (R + 4));
        ctx.rotate(an);
        if (lit && d === 0) glow(ctx, 0, 0, 10, "rgba(34,211,238,.8)");
        ctx.fillStyle = lit
          ? d === 0
            ? "#fff"
            : GM.cyan
          : i % 2
            ? GM.violet
            : "#6d28d9";
        ctx.fillRect(-3.4, -3.4, 6.8, 6.8);
        ctx.restore();
      }
      ctx.restore();
      // three hearts above, a level badge below
      for (let i = 0; i < 3; i++) {
        const k = still ? 1 : pop(t, 0.6 + i * 0.15, 0.4);
        if (k <= 0) continue;
        const beat =
          !still && i === 2 ? 1 + Math.max(0, Math.sin(tt * 5)) * 0.14 : 1;
        ctx.save();
        ctx.translate(77 + (i - 1) * 21, 77 - R - 6 - (i === 1 ? 5 : 0));
        ctx.scale(k * beat, k * beat);
        ctx.translate(0, 8);
        gmPixels(ctx, GM_HEART, 2.7, { r: "#f43f5e", w: "#fecdd3" });
        ctx.restore();
      }
      {
        const k = still ? 1 : pop(t, 1.1, 0.4);
        ctx.save();
        ctx.translate(77, 77 + R + 12);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.roundRect(-22, -8, 44, 16, 4);
        inked(ctx, grad(ctx, 0, -8, 0, 8, GM.yellow, "#f59e0b"), 1.6, GM.ink);
        ctx.font = "700 10px Consolas, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = GM.ink;
        ctx.fillText("LV UP", 0, 0.5);
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(ctx, CARD.w * 0.5, CARD.h, 220, `rgba(139,92,246,${0.22 * a})`);
      // a starfield scrolling by, blocks falling far away, and the lines of an old screen
      this.starsFar.each(tt, CARD.h, CARD.w, (p, y, x) => {
        ctx.globalAlpha = a * (0.3 + 0.6 * p.k);
        ctx.fillStyle = p.i % 5 ? "#fff" : GM.cyan;
        ctx.fillRect(CARD.w - x, y, p.s * (1 + p.k * 2), p.s * 0.8);
      });
      ctx.globalAlpha = 1;
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y) => {
        const sh = this.shapes[p.i % 5],
          col = [GM.violet, GM.cyan, GM.pink, GM.yellow, GM.green][p.i % 5];
        ctx.globalAlpha = a * 0.3;
        for (const [bx, by] of sh) {
          ctx.fillStyle = col;
          ctx.fillRect(
            Math.round(x / 12) * 12 + bx * p.s,
            Math.round(y) + by * p.s,
            p.s - 1,
            p.s - 1,
          );
        }
      });
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.globalAlpha = 0.09 * a;
      ctx.fillStyle = "#000";
      for (let y = 0; y < CARD.h; y += 4) ctx.fillRect(0, y, CARD.w, 1.4);
      ctx.restore();
    },
  };
}
