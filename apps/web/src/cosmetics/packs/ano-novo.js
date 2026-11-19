// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutCubic,
  easeInOut,
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

// ---------- Ano Novo ----------
const AN = {
  ink: "#1a1630",
  gold: "#ffd35c",
  goldDark: "#c8901f",
  cols: [
    "255,214,90",
    "255,120,160",
    "120,200,255",
    "190,150,255",
    "130,240,170",
  ],
};
function anGlass(ctx, t, fill) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, 0);
  ctx.moveTo(-7, 0);
  ctx.lineTo(7, 0);
  ctx.strokeStyle = AN.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = "#eaf6ff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-7.5, -40);
  ctx.lineTo(7.5, -40);
  ctx.quadraticCurveTo(8, -18, 0, -12);
  ctx.quadraticCurveTo(-8, -18, -7.5, -40);
  ctx.closePath();
  ctx.fillStyle = "rgba(220,240,255,.25)";
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = grad(ctx, 0, -36, 0, -12, "#ffe9a8", "#f2b63c");
  ctx.fillRect(-9, -40 + 6 + (1 - fill) * 22, 18, 40);
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 5; i++) {
    const y = -14 - ((t * 14 + i * 5) % 20);
    ctx.beginPath();
    ctx.arc(-4 + i * 2 + Math.sin(t * 3 + i) * 1, y, 0.9, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-7.5, -40);
  ctx.lineTo(7.5, -40);
  ctx.quadraticCurveTo(8, -18, 0, -12);
  ctx.quadraticCurveTo(-8, -18, -7.5, -40);
  ctx.closePath();
  ctx.strokeStyle = AN.ink;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-4.5, -36);
  ctx.lineTo(-4, -22);
  ctx.strokeStyle = "rgba(255,255,255,.7)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
}
function anBottle(ctx) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(-11, -30);
  ctx.quadraticCurveTo(-11, -42, -4.5, -48);
  ctx.lineTo(-4.5, -62);
  ctx.lineTo(4.5, -62);
  ctx.lineTo(4.5, -48);
  ctx.quadraticCurveTo(11, -42, 11, -30);
  ctx.lineTo(11, 0);
  ctx.closePath();
  inked(ctx, grad(ctx, -11, 0, 11, 0, "#2a7a52", "#0f3a2a"), 1.7, AN.ink);
  ctx.beginPath();
  ctx.roundRect(-5.2, -64, 10.4, 11, 2);
  inked(ctx, grad(ctx, -5, 0, 5, 0, "#ffe9a8", AN.goldDark), 1.4, AN.ink);
  ctx.beginPath();
  ctx.roundRect(-11, -26, 22, 17, 1.5);
  inked(ctx, "#fff7e0", 1.3, AN.ink);
  ctx.save();
  ctx.translate(0, -17.5);
  starPath(ctx, 5);
  ctx.fillStyle = AN.goldDark;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-7.5, -36);
  ctx.lineTo(-7.5, -8);
  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.stroke();
}
function anBalloon(ctx, r, c, t, ph) {
  const sw = Math.sin(t * 1.3 + ph) * 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(4, -14, -4, -24, sw, -34);
  ctx.strokeStyle = "rgba(255,255,255,.7)";
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.save();
  ctx.translate(sw, -34 - r * 1.15);
  ctx.rotate(sw * 0.02);
  ctx.beginPath();
  ctx.moveTo(0, r * 1.15);
  ctx.bezierCurveTo(-r * 1.25, r * 0.4, -r * 1.05, -r * 1.1, 0, -r * 1.1);
  ctx.bezierCurveTo(r * 1.05, -r * 1.1, r * 1.25, r * 0.4, 0, r * 1.15);
  ctx.closePath();
  inked(
    ctx,
    rgrad(ctx, -r * 0.35, -r * 0.5, r * 1.6, c[0], c[1], c[2]),
    1.6,
    AN.ink,
  );
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, -r * 0.45, r * 0.16, r * 0.34, 0.5, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3, r * 1.15);
  ctx.lineTo(3, r * 1.15);
  ctx.lineTo(0, r * 1.15 + 5);
  ctx.closePath();
  inked(ctx, c[1], 1.2, AN.ink);
  ctx.restore();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Ano Novo",
    reach: { top: 106, side: 66, bottom: 66 },
    mat: ["#14163a", "#0a0b1e"],
    theme: cardTheme("#28348f", "#c8901f"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.st = Strand(this.loop, m.tl + m.arc * 0.4, m.side * 0.82, -1, 4, {
        off: 10,
        wave: 9,
        freq: 34,
        gap: 0.085,
        size: 10,
        taper: 1,
      });
      this.st2 = Strand(
        this.loop,
        m.right - m.arc * 0.4,
        m.side * 0.82,
        1,
        14,
        { off: 10, wave: 9, freq: 34, gap: 0.085, size: 10, taper: 1 },
      );
      this.t0 = 0.4;
      this.dur = 1.8;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.fx = Drift(26, 61, { v: [26, 60], s: [3, 6], sway: 14, spin: 5 });
      this.fw = Particles();
      this.rk = [];
      this.rand = rng(21);
      this.next = 2.4;
      this.popped = false;
      this.inner = [];
    },
    reset() {
      this.fw.clear();
      this.rk.length = 0;
      this.rand = rng(21);
      this.next = 2.4;
      this.popped = false;
      this.inner.length = 0;
    },
    burst(x, y, col, n, v) {
      const R = this.rand;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + R() * 0.2,
          sp = v * (0.75 + R() * 0.4);
        this.fw.add({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          g: 46,
          drag: 1.5,
          life: 1 + R() * 0.6,
          size: 1.6 + R() * 1.4,
          color: col,
        });
      }
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand;
      // the cork goes at 2.1 s; after that rockets climb beside the card and burst above it
      if (!this.popped && t > 2.1) {
        this.popped = true;
        for (let i = 0; i < 26; i++) {
          const a = -Math.PI / 2 + 0.5 + (R() - 0.5) * 0.9,
            v = 90 + R() * 170;
          this.fw.add({
            x: CARD.w * 0.26,
            y: -110,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            g: 240,
            drag: 0.6,
            life: 0.9 + R() * 0.6,
            size: 1.6 + R() * 1.8,
            color: "255,244,214",
          });
        }
        this.burst(CARD.w * 0.5, -70, AN.cols[0], 30, 130);
      }
      if (t > this.next) {
        this.next = t + 0.9 + R() * 1.5;
        const left = R() < 0.5;
        this.rk.push({
          x: left ? -34 - R() * 22 : CARD.w + 34 + R() * 22,
          y: CARD.h * (0.5 + R() * 0.4),
          ty: CARD.h * (0.02 + R() * 0.3) - 40,
          col: AN.cols[Math.floor(R() * 5)],
        });
        this.inner.push({
          x: CARD.w * (0.15 + R() * 0.7),
          y: 40 + R() * (CARD.h * 0.45),
          t0: t,
          col: AN.cols[Math.floor(R() * 5)],
          r: 30 + R() * 34,
        });
        if (this.inner.length > 4) this.inner.shift();
      }
      for (let i = this.rk.length - 1; i >= 0; i--) {
        const r = this.rk[i];
        r.y -= 260 * dt;
        if (r.y <= r.ty) {
          this.burst(r.x, r.y, r.col, 26, 105);
          this.rk.splice(i, 1);
        }
      }
      this.fw.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t;
      if (still) {
        [
          [-40, 60, 0],
          [CARD.w + 44, 150, 2],
          [CARD.w * 0.5, -78, 1],
        ].forEach(([x, y, ci]) => {
          for (let i = 0; i < 18; i++) {
            const a = (i / 18) * TAU;
            glow(
              ctx,
              x + Math.cos(a) * 30,
              y + Math.sin(a) * 30,
              5,
              `rgba(${AN.cols[ci]},.9)`,
            );
            glow(
              ctx,
              x + Math.cos(a + 0.17) * 17,
              y + Math.sin(a + 0.17) * 17,
              4,
              `rgba(${AN.cols[ci]},.7)`,
            );
          }
        });
      }
      for (const r of this.rk) {
        glow(ctx, r.x, r.y, 9, `rgba(${r.col},.9)`);
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x, r.y + 26);
        ctx.strokeStyle = `rgba(${r.col},.5)`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      for (const p of this.fw.list) {
        const k = 1 - p.age / p.life;
        glow(ctx, p.x, p.y, p.size * 3.2, `rgba(${p.color},${0.6 * k})`);
        ctx.globalAlpha = k;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5 * k + 0.3, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // gold streamers down both sides
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        for (const v of [this.st, this.st2]) {
          strandLine(c, v, g, [
            [AN.ink, 6.8],
            [AN.gold, 4.4],
            ["#fff7d6", 1.2, [6, 8]],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2);
            c.translate(0, -b.s * 1.1 * b.out);
            c.rotate(b.ph + Math.sin(tt * 2 + b.ph) * 0.3);
            c.scale(k, k);
            if (b.kind < 0.5) {
              starPath(c, b.s * 0.8);
              inked(c, b.i % 2 ? AN.gold : "#fff7d6", 1.1, AN.ink);
            } else {
              c.fillStyle = `rgb(${AN.cols[b.i % 5]})`;
              c.fillRect(-b.s * 0.5, -b.s * 0.2, b.s, b.s * 0.4);
            }
          });
        }
      });
      // balloons at the bottom corners
      [
        [26, 15, ["#fff3b8", AN.gold, AN.goldDark], 0],
        [52, 12, ["#4a4a6a", "#1c1c30", "#0a0a16"], 1.4],
        [CARD.w - 26, 15, ["#4a4a6a", "#1c1c30", "#0a0a16"], 2.6],
        [CARD.w - 52, 12, ["#fff3b8", AN.gold, AN.goldDark], 3.8],
      ].forEach(([x, r, c, ph], i) => {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.5 - i * 0.12) / 1));
        if (k <= 0) return;
        ctx.save();
        ctx.translate(x, CARD.h + 64 + (1 - k) * 60);
        ctx.globalAlpha = k;
        anBalloon(ctx, r, c, tt, ph);
        ctx.restore();
      });
      // on the top edge: a clock on the stroke of midnight, the bottle that pops, two glasses that toast
      {
        const k = still ? 1 : pop(t, 1, 0.6);
        if (k > 0) {
          const x = CARD.w * 0.52,
            sweep = still ? 1 : easeInOut(clamp((t - 1.1) / 1));
          ctx.save();
          ctx.translate(x, -32);
          ctx.scale(k, k);
          glow(
            ctx,
            0,
            0,
            54,
            `rgba(255,214,90,${0.25 + 0.1 * Math.sin(tt * 3)})`,
          );
          ctx.beginPath();
          ctx.arc(0, 0, 27, 0, TAU);
          inked(
            ctx,
            grad(ctx, -27, -27, 27, 27, "#fff3b8", AN.goldDark),
            2,
            AN.ink,
          );
          ctx.beginPath();
          ctx.arc(0, 0, 21.5, 0, TAU);
          inked(ctx, "#fffaf0", 1.4, AN.ink);
          ctx.strokeStyle = AN.ink;
          ctx.lineWidth = 1.6;
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * TAU;
            ctx.beginPath();
            ctx.moveTo(
              Math.cos(a) * (i % 3 ? 18.5 : 16),
              Math.sin(a) * (i % 3 ? 18.5 : 16),
            );
            ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
            ctx.stroke();
          }
          ctx.lineCap = "round";
          ctx.save();
          ctx.rotate(-0.5 * (1 - sweep));
          ctx.beginPath();
          ctx.moveTo(0, 2);
          ctx.lineTo(0, -11);
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.rotate(-TAU * 0.92 * (1 - sweep));
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.lineTo(0, -17);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
          ctx.beginPath();
          ctx.arc(0, 0, 2.4, 0, TAU);
          ctx.fillStyle = "#e5484d";
          ctx.fill();
          for (const sx of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(sx * 17, -25, 7, 0, TAU);
            inked(ctx, AN.gold, 1.5, AN.ink);
          }
          ctx.beginPath();
          ctx.roundRect(-16, 26, 32, 6, 3);
          inked(ctx, AN.goldDark, 1.4, AN.ink);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : bounceOut((t - 0.9) / 0.8);
        if (still || t > 0.9) {
          const shake =
            !still && t > 1.7 && t < 2.1 ? Math.sin(t * 60) * 0.07 : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.22, -4 - (1 - k) * 140);
          ctx.rotate(0.3 + shake);
          ctx.scale(1.3, 1.3);
          anBottle(ctx);
          if (!still && t > 2.1) {
            const c = t - 2.1;
            if (c < 1.2) {
              ctx.save();
              ctx.translate(c * 46, -66 - c * 150 + c * c * 120);
              ctx.rotate(c * 9);
              ctx.beginPath();
              ctx.roundRect(-4, -6, 8, 12, 2.5);
              inked(ctx, "#d9a86a", 1.2, AN.ink);
              ctx.restore();
            }
            ctx.fillStyle = "rgba(255,250,230,.9)";
            for (let i = 0; i < 5; i++) {
              const q = (c * 1.6 + i * 0.2) % 1;
              ctx.globalAlpha = (1 - q) * clamp(2 - c * 0.5);
              ctx.beginPath();
              ctx.arc((i - 2) * 2.4 * q, -66 - q * 22, 2 + q * 2.5, 0, TAU);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          } else if (still) {
            ctx.fillStyle = "rgba(255,250,230,.9)";
            for (const [x, y, r] of [
              [0, -70, 3.4],
              [-4, -78, 2.6],
              [5, -82, 3],
              [1, -90, 2.2],
            ]) {
              ctx.beginPath();
              ctx.arc(x, y, r, 0, TAU);
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.6, 0.5);
        if (k > 0) {
          const c = tt % 4.2,
            clink =
              !still && c < 0.5
                ? Math.sin((c / 0.5) * Math.PI)
                : still
                  ? 0.6
                  : 0,
            x = CARD.w * 0.82;
          for (const sx of [-1, 1]) {
            ctx.save();
            ctx.translate(x + sx * 15, -3);
            ctx.rotate(sx * (0.12 - clink * 0.34));
            ctx.scale(1.25 * k, 1.25 * k);
            anGlass(ctx, tt + sx, 0.85);
            ctx.restore();
          }
          if (clink > 0.6) {
            ctx.save();
            ctx.translate(x, -56);
            ctx.rotate(tt);
            sparkPath(ctx, 9 * clink);
            ctx.fillStyle = "#fff";
            ctx.fill();
            ctx.restore();
          }
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
          [AN.ink, 7.6],
          [AN.gold, 4.8],
          ["#fff7d6", 1.4, [1.5, 7], 9],
        ],
        tt,
      );
      for (let i = 0; i < 7; i++) {
        const an = 0.3 + i * 0.42 + tt * 0.15,
          tw = 0.4 + 0.6 * Math.abs(Math.sin(tt * 2.6 + i * 1.3));
        ctx.save();
        ctx.translate(
          77 + Math.cos(an) * (R + 11),
          77 + Math.sin(an) * (R + 11),
        );
        ctx.rotate(tt + i);
        ctx.globalAlpha = a * tw;
        sparkPath(ctx, i % 2 ? 5 : 3.5);
        ctx.fillStyle = i % 2 ? AN.gold : "#fff";
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      // a party hat, a little crooked
      const k = still ? 1 : bounceOut((t - 0.5) / 0.8);
      if (still || t > 0.5) {
        ctx.save();
        ctx.translate(77 + 9, 77 - R + 5 - (1 - k) * 70);
        ctx.rotate(0.24 + Math.sin(tt * 1.6) * 0.02);
        ctx.beginPath();
        ctx.moveTo(-21, 0);
        ctx.lineTo(0, -46);
        ctx.lineTo(21, 0);
        ctx.quadraticCurveTo(0, 7, -21, 0);
        ctx.closePath();
        inked(ctx, grad(ctx, -21, 0, 21, 0, "#3a48b8", "#1c2470"), 1.8, AN.ink);
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = AN.gold;
        ctx.lineWidth = 4;
        for (let y = -6; y > -46; y -= 12) {
          ctx.beginPath();
          ctx.moveTo(-24, y + 6);
          ctx.lineTo(24, y - 4);
          ctx.stroke();
        }
        ctx.fillStyle = "#fff";
        for (const [x, y] of [
          [-6, -12],
          [7, -18],
          [-1, -27],
        ]) {
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.ellipse(0, 2, 22, 5, 0, 0, TAU);
        inked(ctx, AN.gold, 1.6, AN.ink);
        ctx.translate(0, -46);
        for (let i = 0; i < 7; i++) {
          ctx.save();
          ctx.rotate(
            -Math.PI / 2 + (i - 3) * 0.42 + Math.sin(tt * 3 + i) * 0.1,
          );
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(11, 0);
          ctx.strokeStyle = i % 2 ? AN.gold : "#fff7d6";
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      // fireworks bloom in the dark of the card, then gold confetti falls through
      const blooms = still
        ? [
            { x: CARD.w * 0.7, y: 70, t0: -0.5, col: AN.cols[1], r: 50 },
            {
              x: CARD.w * 0.3,
              y: CARD.h * 0.42,
              t0: -0.3,
              col: AN.cols[2],
              r: 40,
            },
          ]
        : this.inner;
      for (const b of blooms) {
        const k = (tt - b.t0) / 1.5;
        if (k <= 0 || k >= 1) continue;
        const r = b.r * easeOutCubic(k);
        for (let i = 0; i < 16; i++) {
          const an = (i / 16) * TAU;
          glow(
            ctx,
            b.x + Math.cos(an) * r,
            b.y + Math.sin(an) * r + k * k * 14,
            5 * (1 - k) + 1.5,
            `rgba(${b.col},${0.7 * (1 - k) * a})`,
          );
          glow(
            ctx,
            b.x + Math.cos(an + 0.2) * r * 0.55,
            b.y + Math.sin(an + 0.2) * r * 0.55 + k * k * 10,
            4 * (1 - k) + 1,
            `rgba(255,255,255,${0.5 * (1 - k) * a})`,
          );
        }
      }
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.scale(1, Math.sin(rot * 1.3));
        ctx.globalAlpha = a * 0.75;
        ctx.fillStyle =
          p.k < 0.6
            ? AN.gold
            : p.k < 0.8
              ? "#fff7d6"
              : `rgb(${AN.cols[p.i % 5]})`;
        ctx.fillRect(-p.s * 0.5, -p.s * 0.25, p.s, p.s * 0.5);
        ctx.restore();
      });
    },
  };
}
