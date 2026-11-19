// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  smooth,
  easeOutBack,
  rng,
  glow,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  rgrad,
  blinking,
  ringBase,
  Strand,
  strandLine,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Programação ----------
const PG = {
  ink: "#0a1420",
  green: "#4ade80",
  cyan: "#38bdf8",
  pink: "#f472b6",
  yellow: "#facc15",
  mono: "700 11px Consolas, Menlo, monospace",
};
const PG_LINES = [
  ["$ git commit -m", PG.green],
  ["  feat: perfil", PG.yellow],
  ["$ npm test", PG.green],
  ["  42 passed", PG.cyan],
  ["$ deploy --prod", PG.green],
  ["  ok ✓", PG.cyan],
];
function pgLaptop(ctx, t, typed) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-50, 0);
  ctx.lineTo(50, 0);
  ctx.lineTo(44, -6);
  ctx.lineTo(-44, -6);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -6, 0, 0, "#cbd5e1", "#64748b"), 1.6, PG.ink);
  ctx.beginPath();
  ctx.roundRect(-40, -64, 80, 58, 5);
  inked(ctx, grad(ctx, 0, -64, 0, -6, "#475569", "#1e293b"), 1.8, PG.ink);
  glow(ctx, 0, -35, 62, "rgba(74,222,128,.22)");
  ctx.beginPath();
  ctx.roundRect(-35, -59, 70, 48, 2.5);
  ctx.fillStyle = "#07111c";
  ctx.fill();
  for (const [i, c] of [
    [0, "#f87171"],
    [1, PG.yellow],
    [2, PG.green],
  ]) {
    ctx.beginPath();
    ctx.arc(-30 + i * 5.5, -54.5, 1.7, 0, TAU);
    ctx.fillStyle = c;
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(-34, -51, 68, 39);
  ctx.clip();
  ctx.font = "700 6.4px Consolas, Menlo, monospace";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const total = PG_LINES.reduce((a, l) => a + l[0].length, 0),
    n = Math.floor(typed * total),
    rows = 5;
  let left = n,
    row = 0,
    cx = -32,
    cy = -49;
  const shown = [];
  for (const [text, col] of PG_LINES) {
    if (left <= 0) break;
    shown.push([text.slice(0, left), col]);
    left -= text.length;
  }
  const start = Math.max(0, shown.length - rows);
  shown.slice(start).forEach(([text, col], i) => {
    ctx.fillStyle = col;
    ctx.fillText(text, -32, -49 + i * 7.4);
    cx = -32 + ctx.measureText(text).width;
    cy = -49 + i * 7.4;
    row = i;
  });
  if (Math.sin(t * 7) > 0) {
    ctx.fillStyle = PG.green;
    ctx.fillRect(cx + 1, cy, 3.6, 6);
  }
  ctx.restore();
}
function pgDuck(ctx, t, blink, quack) {
  ctx.lineJoin = "round";
  const b = Math.sin(t * 2) * 0.8;
  ctx.beginPath();
  ctx.moveTo(-17, -4 + b);
  ctx.quadraticCurveTo(-21, -16 + b, -9, -17 + b);
  ctx.quadraticCurveTo(4, -19 + b, 12, -14 + b);
  ctx.lineTo(20, -18 + b);
  ctx.quadraticCurveTo(19, -3 + b, 8, 0);
  ctx.lineTo(-9, 0);
  ctx.quadraticCurveTo(-15, 0, -17, -4 + b);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -18, 0, 0, "#fde047", "#eab308"), 1.6, PG.ink);
  ctx.beginPath();
  ctx.ellipse(1, -9 + b, 7, 4.4, -0.2, 0, TAU);
  ctx.fillStyle = "#facc15";
  ctx.fill();
  ctx.strokeStyle = "rgba(10,20,32,.45)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.save();
  ctx.translate(-10, -22 + b);
  ctx.rotate(-quack * 0.12);
  ctx.beginPath();
  ctx.arc(0, 0, 9.5, 0, TAU);
  inked(
    ctx,
    rgrad(ctx, -3, -3, 13, "#fef08a", "#fde047", "#eab308"),
    1.6,
    PG.ink,
  );
  ctx.beginPath();
  ctx.moveTo(-8, -1);
  ctx.quadraticCurveTo(-18, -1 - quack * 3, -17, 2);
  ctx.quadraticCurveTo(-12, 3, -7, 2.4);
  ctx.closePath();
  inked(ctx, "#fb923c", 1.3, PG.ink);
  if (quack > 0.2) {
    ctx.beginPath();
    ctx.moveTo(-7.5, 2.6);
    ctx.quadraticCurveTo(-14, 4 + quack * 4, -15.5, 3.5 + quack * 3);
    ctx.quadraticCurveTo(-11, 5, -7, 4.4);
    ctx.closePath();
    inked(ctx, "#fb923c", 1.2, PG.ink);
  }
  if (blink) {
    ctx.beginPath();
    ctx.moveTo(-5, -3);
    ctx.lineTo(-1, -3);
    ctx.strokeStyle = PG.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(-3, -3, 2, 0, TAU);
    ctx.fillStyle = PG.ink;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2.4, -3.7, 0.7, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }
  ctx.restore();
}
function pgBug(ctx, s, t) {
  ctx.lineCap = "round";
  ctx.strokeStyle = PG.ink;
  ctx.lineWidth = 1.4;
  for (const sx of [-1, 1])
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.4, 0);
      ctx.lineTo(i * s * 0.6 + Math.sin(t * 16 + i + sx) * 1.6, sx * s * 0.9);
      ctx.stroke();
    }
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.9, s * 0.6, 0, 0, TAU);
  inked(
    ctx,
    grad(ctx, 0, -s * 0.6, 0, s * 0.6, "#f87171", "#b91c1c"),
    1.3,
    PG.ink,
  );
  ctx.beginPath();
  ctx.arc(s * 0.9, 0, s * 0.36, 0, TAU);
  inked(ctx, "#1f2937", 1.2, PG.ink);
  ctx.beginPath();
  ctx.moveTo(-s * 0.8, 0);
  ctx.lineTo(s * 0.6, 0);
  ctx.stroke();
  ctx.fillStyle = PG.ink;
  for (const [x, y] of [
    [-0.3, -0.28],
    [0.2, 0.26],
    [-0.1, 0.24],
    [0.3, -0.24],
  ]) {
    ctx.beginPath();
    ctx.arc(x * s, y * s, s * 0.11, 0, TAU);
    ctx.fill();
  }
}

export default function create(CARD, AVATAR) {
  return {
    name: "Programação",
    reach: { top: 76, side: 66, bottom: 66 },
    mat: ["#0d1b2a", "#060d16"],
    theme: cardTheme("#16a34a", "#1e3a5f"),
    init() {
      this.loop = frameLoop(CARD, 12);
      const m = this.loop.m;
      // a git history down the left side: a branch leaves the trunk and merges back
      this.git = Strand(this.loop, m.tl + m.arc * 0.3, m.side * 0.9, -1, 2, {
        off: 0,
        wave: 0,
        gap: 0.12,
        size: 6,
        taper: 1,
      });
      this.t0 = 0.4;
      this.dur = 1.8;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      const R = rng(33),
        glyphs = [
          "{",
          "}",
          "</>",
          ";",
          "=>",
          "()",
          "[]",
          "&&",
          "0",
          "1",
          "#",
          "fn",
        ];
      const ones = ["0", "1", "{", "}", ";", "#", "<", ">", "=", "/"];
      this.cols = [];
      for (let i = 0; i < 4; i++)
        this.cols.push({
          x: CARD.w + 18 + i * 14,
          sp: 22 + R() * 30,
          ph: R() * 300,
          g: Array.from({ length: 9 }, () => ones[Math.floor(R() * 10)]),
        });
      this.float = [];
      for (let i = 0; i < 9; i++) {
        const an = R() * TAU;
        this.float.push({
          x: CARD.w / 2 + Math.cos(an) * (CARD.w / 2 + 40 + R() * 22),
          y: CARD.h / 2 + Math.sin(an) * (CARD.h / 2 + 36 + R() * 22),
          g: glyphs[i % 8],
          ph: R() * TAU,
          c: [PG.green, PG.cyan, PG.pink, PG.yellow][i % 4],
        });
      }
      this.rain = [];
      for (let i = 0; i < 12; i++)
        this.rain.push({
          x: 8 + (i * (CARD.w - 16)) / 11,
          sp: 26 + R() * 40,
          ph: R() * 400,
          len: 4 + Math.floor(R() * 6),
        });
      this.keys = [];
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 10 - r; c++)
          this.keys.push({
            x: -47 + c * 10 + r * 5,
            y: -26 + r * 9,
            ph: R() * 9,
          });
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.3, 1);
      // glyphs hang in the air round the card
      ctx.save();
      ctx.font = "700 13px Consolas, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const f of this.float) {
        ctx.globalAlpha =
          a * (0.35 + 0.5 * Math.abs(Math.sin(tt * 0.9 + f.ph)));
        ctx.fillStyle = f.c;
        ctx.fillText(f.g, f.x, f.y + Math.sin(tt * 1.1 + f.ph) * 4);
      }
      ctx.restore();
      // the git graph: trunk, a feature branch, commits that pop in, a pulse running down
      {
        const v = this.git,
          g = this.front(T),
          last = Math.floor(clamp(g) * v.n);
        strandLine(ctx, v, g, [
          [PG.ink, 7],
          [PG.green, 3.4],
        ]);
        const side = (i) => {
          const p = v.pts[i],
            u = i / v.n,
            k = smooth((u - 0.2) / 0.12) * (1 - smooth((u - 0.68) / 0.12));
          return [p.x + p.nx * 20 * k, p.y + p.ny * 20 * k];
        };
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (const [col, w] of [
          [PG.ink, 7],
          [PG.pink, 3.4],
        ]) {
          ctx.beginPath();
          for (
            let i = Math.floor(v.n * 0.2);
            i <= Math.min(last, Math.floor(v.n * 0.8));
            i++
          ) {
            const q = side(i);
            ctx.lineTo(q[0], q[1]);
          }
          ctx.strokeStyle = col;
          ctx.lineWidth = w;
          ctx.stroke();
        }
        v.bits.forEach((b) => {
          const k = still ? 1 : pop(t, this.when(b.u), 0.35);
          if (k <= 0) return;
          const onBranch = b.u > 0.3 && b.u < 0.62 && b.i % 2,
            q = onBranch ? side(Math.round(b.u * v.n)) : [b.x, b.y];
          ctx.beginPath();
          ctx.arc(q[0], q[1], 6 * k, 0, TAU);
          inked(ctx, "#07111c", 2.6, onBranch ? PG.pink : PG.green);
          ctx.beginPath();
          ctx.arc(q[0], q[1], 2.4 * k, 0, TAU);
          ctx.fillStyle = onBranch ? PG.pink : PG.green;
          ctx.fill();
        });
        if (g >= 1) {
          const u = (tt * 0.3) % 1,
            p = v.pts[Math.round(u * v.n)];
          glow(ctx, p.x, p.y, 15, "rgba(74,222,128,.8)");
        }
      }
      // code runs down the right side in columns
      ctx.save();
      ctx.font = PG.mono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.beginPath();
      ctx.rect(CARD.w + 4, 6, 80, CARD.h - 12);
      ctx.clip();
      for (const c of this.cols) {
        const span = CARD.h + 140;
        c.g.forEach((ch, i) => {
          const y = ((tt * c.sp + c.ph + i * 15) % span) - 70;
          ctx.globalAlpha =
            a * (i === c.g.length - 1 ? 1 : 0.2 + (i / c.g.length) * 0.55);
          ctx.fillStyle = i === c.g.length - 1 ? "#eafff2" : PG.green;
          ctx.fillText(ch, c.x, y);
        });
      }
      ctx.restore();
      // under the card: a keyboard whose keys light up, and a bug that will not stay fixed
      {
        const k = still ? 1 : pop(t, 0.8, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w * 0.5, CARD.h + 58);
          ctx.scale(k, k);
          ctx.beginPath();
          ctx.roundRect(-56, -32, 112, 32, 5);
          inked(
            ctx,
            grad(ctx, 0, -32, 0, 0, "#334155", "#0f172a"),
            1.7,
            PG.ink,
          );
          for (const key of this.keys) {
            const on = still
              ? key.ph % 3 < 1
              : Math.sin(tt * 6 + key.ph * 3) > 0.86;
            if (on) glow(ctx, key.x + 4, key.y + 3.5, 9, "rgba(74,222,128,.7)");
            ctx.beginPath();
            ctx.roundRect(key.x, key.y, 8, 7, 1.6);
            ctx.fillStyle = on ? PG.green : "#64748b";
            ctx.fill();
          }
          ctx.beginPath();
          ctx.roundRect(-20, 1 - 9, 44, 6, 1.6);
          ctx.fillStyle = "#64748b";
          ctx.fill();
          ctx.restore();
        }
      }
      {
        const a2 = still ? 1 : fade(t, 2.4, 0.5);
        if (a2 > 0) {
          const u = (tt * 0.06) % 1,
            x = -20 + (CARD.w + 40) * (u < 0.5 ? u * 2 : 2 - u * 2),
            dir = u < 0.5 ? 1 : -1;
          ctx.save();
          ctx.globalAlpha = a2;
          ctx.translate(x, CARD.h + 17);
          ctx.scale(dir, 1);
          pgBug(ctx, 8, tt);
          ctx.restore();
        }
      }
      // top edge: the laptop types out a deploy, the duck listens, the coffee steams
      {
        const k = still ? 1 : bounceOut((t - 0.9) / 0.85);
        if (still || t > 0.9) {
          const typed = still ? 1 : clamp(((t - 1.6) % 11) / 6);
          ctx.save();
          ctx.translate(CARD.w * 0.32, 2 - (1 - k) * 150);
          ctx.scale(1.1, 1.1);
          pgLaptop(ctx, tt, typed);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.7, 0.5);
        if (k > 0) {
          const c = tt % 5.5,
            q =
              !still && c > 4.4 && c < 5
                ? Math.sin(((c - 4.4) / 0.6) * Math.PI)
                : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.7, 2);
          ctx.scale(1.35 * k, 1.35 * k);
          pgDuck(ctx, tt, !still && blinking(tt, 3.2), q);
          ctx.restore();
          if (q > 0.3) {
            ctx.save();
            ctx.font = PG.mono;
            ctx.fillStyle = "#fff";
            ctx.globalAlpha = q;
            ctx.fillText("quack?", CARD.w * 0.7 - 62, -50);
            ctx.restore();
          }
        }
      }
      {
        const k = still ? 1 : pop(t, 2, 0.5);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w * 0.9, 1);
          ctx.scale(k, k);
          for (let i = 0; i < 3; i++) {
            const q = (tt * 0.45 + i * 0.33) % 1;
            ctx.beginPath();
            ctx.moveTo(-4 + i * 4, -26 - q * 16);
            ctx.quadraticCurveTo(
              -1 + i * 4 + Math.sin(tt * 2 + i) * 3,
              -32 - q * 16,
              -4 + i * 4,
              -38 - q * 16,
            );
            ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - q)})`;
            ctx.lineWidth = 1.6;
            ctx.lineCap = "round";
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(11, -12, 6, -1.2, 1.2);
          ctx.strokeStyle = PG.ink;
          ctx.lineWidth = 5;
          ctx.stroke();
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 2.4;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-11, -23);
          ctx.lineTo(11, -23);
          ctx.lineTo(9, 0);
          ctx.lineTo(-9, 0);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, -11, 0, 11, 0, "#f8fafc", "#cbd5e1"),
            1.6,
            PG.ink,
          );
          ctx.beginPath();
          ctx.ellipse(0, -23, 11, 3, 0, 0, TAU);
          inked(ctx, "#5b3a22", 1.3, PG.ink);
          ctx.font = "700 9px Consolas, Menlo, monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = PG.ink;
          ctx.fillText("{ }", 0, -8);
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.6),
        R = AVATAR.r,
        k = still ? 1 : easeOutBack(clamp((t - 0.4) / 0.6));
      ctx.save();
      ctx.globalAlpha = a;
      glow(ctx, 77, 77, R + 26, "rgba(74,222,128,.16)");
      ringBase(
        ctx,
        77,
        77,
        R + 3.5,
        [
          [PG.ink, 7.4],
          ["#1e293b", 4.8],
          [PG.green, 1.8, [9, 5], 14],
        ],
        tt,
      );
      ctx.restore();
      // angle brackets hug the avatar: <  />
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const d = R + 15 + (1 - k) * 26;
      for (const [col, w] of [
        [PG.ink, 7.4],
        [PG.cyan, 3.6],
      ]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(77 - d + 9, 77 - 13);
        ctx.lineTo(77 - d - 2, 77);
        ctx.lineTo(77 - d + 9, 77 + 13);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(77 + d - 9, 77 - 13);
        ctx.lineTo(77 + d + 2, 77);
        ctx.lineTo(77 + d - 9, 77 + 13);
        ctx.stroke();
      }
      for (const [col, w] of [
        [PG.ink, 6.4],
        [PG.pink, 3],
      ]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(77 + d - 14, 77 - 16);
        ctx.lineTo(77 + d - 24, 77 + 16);
        ctx.globalAlpha = a * 0;
        ctx.stroke();
      }
      ctx.restore();
      // a prompt underneath, with the cursor blinking
      {
        const kk = still ? 1 : pop(t, 1, 0.4);
        ctx.save();
        ctx.translate(77, 77 + R + 13);
        ctx.scale(kk, kk);
        ctx.beginPath();
        ctx.roundRect(-25, -8, 50, 16, 5);
        inked(ctx, "#07111c", 1.5, PG.green);
        ctx.font = "700 10px Consolas, Menlo, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = PG.green;
        ctx.fillText(">_", -19, 0.5);
        ctx.fillStyle = "#e2e8f0";
        const w = "dev".slice(
          0,
          still ? 3 : Math.floor(clamp((t - 1.3) / 0.6) * 3.99),
        );
        ctx.fillText(w, -4, 0.5);
        if (still || Math.sin(tt * 7) > 0) {
          ctx.fillStyle = PG.green;
          ctx.fillRect(-4 + ctx.measureText(w).width + 1, -4.5, 4, 9);
        }
        ctx.restore();
      }
      {
        const on = 0.6 + 0.4 * Math.sin(tt * 3);
        glow(ctx, 77 + 30, 77 - R + 4, 11, `rgba(74,222,128,${0.6 * on * a})`);
        ctx.beginPath();
        ctx.arc(77 + 30, 77 - R + 4, 5, 0, TAU);
        ctx.globalAlpha = a;
        inked(ctx, PG.green, 1.6, PG.ink);
        ctx.globalAlpha = 1;
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(ctx, CARD.w * 0.5, CARD.h, 210, `rgba(74,222,128,${0.16 * a})`);
      // code rain, faint, and a scan line
      for (const c of this.rain) {
        const span = CARD.h + 120,
          y0 = ((tt * c.sp + c.ph) % span) - 60;
        for (let i = 0; i < c.len; i++) {
          ctx.globalAlpha = a * (i === 0 ? 0.7 : 0.32 * (1 - i / c.len));
          ctx.fillStyle = i === 0 ? "#eafff2" : PG.green;
          ctx.fillRect(c.x, y0 - i * 9, 5, 6);
        }
      }
      ctx.globalAlpha = 1;
      {
        const y = still ? CARD.h * 0.5 : ((tt * 70) % (CARD.h + 120)) - 60;
        ctx.fillStyle = grad(
          ctx,
          0,
          y - 30,
          0,
          y,
          "rgba(74,222,128,0)",
          `rgba(74,222,128,${0.12 * a})`,
        );
        ctx.fillRect(0, y - 30, CARD.w, 30);
      }
      // lines of an editor at the foot of the card
      ctx.save();
      ctx.globalAlpha = a * 0.5;
      const cols = [PG.pink, PG.cyan, PG.green, PG.yellow, "#94a3b8"];
      for (let r = 0; r < 4; r++) {
        let x = 14 + (r % 2) * 12;
        for (let i = 0; i < 4; i++) {
          const w = 14 + ((r * 7 + i * 13) % 30);
          ctx.fillStyle = cols[(r + i) % 5];
          ctx.fillRect(x, CARD.h - 44 + r * 9, w, 3.4);
          x += w + 6;
        }
      }
      ctx.restore();
    },
  };
}
