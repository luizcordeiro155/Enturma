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
  sprite,
  stamp,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  rgrad,
  starPath,
  sparkPath,
  eyes,
  blinking,
  ringBase,
  Strand,
  strandBits,
  Drift,
  settle,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Masmorra ----------
const MM = {
  ink: "#17121f",
  stone: "#6a6480",
  stoneDark: "#3a3550",
  gold: "#f2c14e",
  goldDark: "#a8741c",
};
function mmTorch(ctx, t, seed, lit) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const fl = 0.8 + 0.2 * Math.sin(t * 11 + seed) * Math.sin(t * 6.3 + seed);
  if (lit > 0) glow(ctx, 0, -30, 62, `rgba(255,150,50,${0.42 * lit * fl})`);
  ctx.beginPath();
  ctx.moveTo(-3.4, 22);
  ctx.lineTo(-5.5, -8);
  ctx.lineTo(5.5, -8);
  ctx.lineTo(3.4, 22);
  ctx.closePath();
  inked(ctx, grad(ctx, -5, 0, 5, 0, "#8a5a34", "#4a2a18"), 1.5, MM.ink);
  ctx.beginPath();
  ctx.roundRect(-8.5, -13, 17, 7, 2);
  inked(ctx, grad(ctx, 0, -13, 0, -6, "#8f8aa3", "#4a4560"), 1.5, MM.ink);
  ctx.beginPath();
  ctx.roundRect(-9, 4, 18, 5, 2);
  inked(ctx, "#5c5770", 1.3, MM.ink);
  if (lit > 0) {
    ctx.save();
    ctx.translate(0, -12);
    ctx.scale(lit, lit);
    for (const [w, h, c, ph] of [
      [13, 34, "#ff6a1c", 0],
      [9, 25, "#ffb02e", 1.7],
      [5, 15, "#fff3a8", 3.1],
    ]) {
      const sw = Math.sin(t * 9 + seed + ph) * 2.6;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.bezierCurveTo(-w, -h * 0.2, -w * 0.6 + sw, -h * 0.7, sw * 1.5, -h);
      ctx.bezierCurveTo(w * 0.6 + sw, -h * 0.7, w, -h * 0.2, 0, 2);
      ctx.fillStyle = c;
      ctx.fill();
    }
    ctx.restore();
  }
}
function mmSlime(ctx, t, c, blink) {
  const sq = Math.sin(t * 3.2),
    w = 22 + sq * 2.4,
    h = 19 - sq * 2.2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.bezierCurveTo(-w * 1.05, -h * 0.9, -w * 0.5, -h * 1.5, 0, -h * 1.5);
  ctx.bezierCurveTo(w * 0.5, -h * 1.5, w * 1.05, -h * 0.9, w, 0);
  ctx.quadraticCurveTo(0, 5, -w, 0);
  ctx.closePath();
  inked(ctx, rgrad(ctx, -w * 0.3, -h, w * 1.4, c[0], c[1], c[2]), 1.7, MM.ink);
  ctx.beginPath();
  ctx.ellipse(-w * 0.42, -h * 1.0, w * 0.16, h * 0.24, 0.5, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.fill();
  ctx.save();
  ctx.translate(0, -h * 0.62);
  eyes(ctx, w * 0.62, 3.2, Math.sin(t * 0.8) * 0.6, blink, "#1a1226", "#fff");
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, -h * 0.36, 3.4, 0.2, Math.PI - 0.2);
  ctx.strokeStyle = MM.ink;
  ctx.lineWidth = 1.3;
  ctx.lineCap = "round";
  ctx.stroke();
}
function mmPotion(ctx, s, col, t, ph) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.28, -s * 1.5);
  ctx.lineTo(-s * 0.28, -s * 0.85);
  ctx.bezierCurveTo(-s * 1.1, -s * 0.5, -s, s * 0.4, 0, s * 0.4);
  ctx.bezierCurveTo(s, s * 0.4, s * 1.1, -s * 0.5, s * 0.28, -s * 0.85);
  ctx.lineTo(s * 0.28, -s * 1.5);
  ctx.closePath();
  ctx.fillStyle = "rgba(220,235,255,.22)";
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = grad(ctx, 0, -s * 0.6, 0, s * 0.4, col[0], col[1]);
  ctx.beginPath();
  ctx.moveTo(-s * 1.2, -s * 0.45 + Math.sin(t * 2 + ph) * s * 0.05);
  ctx.quadraticCurveTo(
    0,
    -s * 0.6 - Math.sin(t * 2 + ph) * s * 0.08,
    s * 1.2,
    -s * 0.45,
  );
  ctx.lineTo(s * 1.2, s);
  ctx.lineTo(-s * 1.2, s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.7)";
  for (let i = 0; i < 3; i++) {
    const y = s * 0.3 - ((t * 0.5 + i * 0.33 + ph) % 1) * s * 0.75;
    ctx.beginPath();
    ctx.arc((i - 1) * s * 0.3, y, s * 0.07, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  glow(ctx, 0, -s * 0.1, s * 1.5, col[2]);
  ctx.beginPath();
  ctx.moveTo(-s * 0.28, -s * 1.5);
  ctx.lineTo(-s * 0.28, -s * 0.85);
  ctx.bezierCurveTo(-s * 1.1, -s * 0.5, -s, s * 0.4, 0, s * 0.4);
  ctx.bezierCurveTo(s, s * 0.4, s * 1.1, -s * 0.5, s * 0.28, -s * 0.85);
  ctx.lineTo(s * 0.28, -s * 1.5);
  ctx.closePath();
  ctx.strokeStyle = MM.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-s * 0.36, -s * 1.85, s * 0.72, s * 0.4, 2);
  inked(ctx, "#b9793a", 1.3, MM.ink);
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.1);
  ctx.quadraticCurveTo(-s * 0.6, -s * 0.5, -s * 0.2, -s * 0.72);
  ctx.strokeStyle = "rgba(255,255,255,.6)";
  ctx.lineWidth = 1.3;
  ctx.stroke();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Masmorra",
    reach: { top: 94, side: 66, bottom: 70 },
    mat: ["#1a1626", "#0c0a14"],
    theme: cardTheme("#5a3fc4", "#b3801f"),
    init() {
      this.loop = frameLoop(CARD, 9);
      const m = this.loop.m;
      this.chain = [
        Strand(this.loop, m.tl + m.arc * 0.5, m.side * 0.62, -1, 3, {
          off: 6,
          wave: 2.5,
          freq: 9,
          gap: 0.2,
          size: 12,
          taper: 1,
          outward: 1,
          from: 0.3,
        }),
        Strand(this.loop, m.right - m.arc * 0.5, m.side * 0.62, 1, 8, {
          off: 6,
          wave: 2.5,
          freq: 9,
          gap: 0.2,
          size: 12,
          taper: 1,
          outward: 1,
          from: 0.3,
        }),
      ];
      this.t0 = 0.4;
      this.dur = 1.5;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.fx = Drift(18, 103, {
        v: [-12, -4],
        s: [1, 2.6],
        sway: 12,
        spin: 0,
      });
      this.coins = Particles();
      this.rand = rng(13);
      this.open = false;
      this.link = sprite(16, (x) => {
        x.beginPath();
        x.ellipse(0, 0, 3.4, 5.6, 0, 0, TAU);
        x.strokeStyle = MM.ink;
        x.lineWidth = 4;
        x.stroke();
        x.strokeStyle = "#9a95ad";
        x.lineWidth = 2;
        x.stroke();
      });
      const R = rng(4);
      this.bricks = [];
      for (let i = 0; i < 9; i++)
        this.bricks.push({
          u: i / 9,
          w: 0.1 + R() * 0.02,
          h: 13 + R() * 6,
          tone: R(),
        });
    },
    reset() {
      this.coins.clear();
      this.rand = rng(13);
      this.open = false;
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand;
      if (!this.open && t > 2.1) {
        this.open = true;
        for (let i = 0; i < 26; i++) {
          const a = -Math.PI / 2 + (R() - 0.5) * 1.5,
            v = 90 + R() * 170;
          this.coins.add({
            x: CARD.w - 44,
            y: CARD.h + 22,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            g: 330,
            life: 1 + R() * 0.6,
            size: 3 + R() * 2,
            rot: R() * TAU,
            vr: 10 + R() * 10,
          });
        }
      }
      this.coins.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.3, 1.2),
        lit = still ? 1 : clamp((t - 1.3) / 0.3);
      // a lintel of stone blocks along the top, moss in the joints
      settle(this, "wall", ctx, t, still, 2.4, 2, (c) => {
        for (const b of this.bricks) {
          const k = still ? 1 : easeOutBack(clamp((t - 0.3 - b.u * 0.8) / 0.5));
          if (k <= 0) continue;
          const x = -12 + (CARD.w + 24) * b.u,
            w = (CARD.w + 24) / 9 - 1.6;
          c.save();
          c.translate(x, 2 - (1 - k) * 30);
          c.globalAlpha = Math.min(1, k);
          c.beginPath();
          c.roundRect(0, -b.h, w, b.h, 3);
          inked(
            c,
            grad(
              c,
              0,
              -b.h,
              0,
              0,
              b.tone > 0.5 ? "#7f7996" : "#6a6480",
              MM.stoneDark,
            ),
            1.6,
            MM.ink,
          );
          c.beginPath();
          c.moveTo(4, -b.h + 4);
          c.lineTo(w * 0.5, -b.h + 4);
          c.strokeStyle = "rgba(255,255,255,.22)";
          c.lineWidth = 1.4;
          c.lineCap = "round";
          c.stroke();
          if (b.tone > 0.6) {
            c.beginPath();
            c.moveTo(w * 0.6, -b.h + 5);
            c.lineTo(w * 0.72, -b.h * 0.5);
            c.lineTo(w * 0.62, -3);
            c.strokeStyle = "rgba(20,16,30,.6)";
            c.lineWidth = 1;
            c.stroke();
          }
          if (b.tone < 0.4) {
            c.beginPath();
            c.ellipse(w * 0.3, 0, 7, 3, 0, Math.PI, TAU);
            c.fillStyle = "#4f8a4a";
            c.fill();
          }
          c.restore();
        }
      });
      // chains down both sides, each ending in something worth finding
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 5, (c) => {
        this.chain.forEach((v, i) => {
          const last = Math.floor(clamp(g) * v.n);
          for (let j = 0; j <= last; j += 2) {
            const p = v.pts[j];
            stamp(
              c,
              this.link,
              p.x,
              p.y,
              1.1,
              Math.atan2(p.ty, p.tx) + Math.PI / 2 + (j % 4 ? 0 : 0.5),
            );
          }
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(
              b.a + Math.PI / 2 + Math.PI + Math.sin(tt * 1.5 + b.ph) * 0.12,
            );
            c.scale(k, k);
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(0, 8);
            c.strokeStyle = MM.ink;
            c.lineWidth = 2;
            c.stroke();
            c.translate(0, 8 + b.s * 0.7);
            if ((b.i + i) % 3 === 0) {
              c.beginPath();
              c.arc(0, -b.s * 0.3, b.s * 0.4, 0, TAU);
              c.moveTo(0, b.s * 0.1);
              c.lineTo(0, b.s * 1.1);
              c.moveTo(0, b.s * 0.8);
              c.lineTo(b.s * 0.3, b.s * 0.8);
              c.moveTo(0, b.s * 1.05);
              c.lineTo(b.s * 0.3, b.s * 1.05);
              c.strokeStyle = MM.ink;
              c.lineWidth = 4.4;
              c.lineCap = "round";
              c.stroke();
              c.strokeStyle = MM.gold;
              c.lineWidth = 2.2;
              c.stroke();
            } else if ((b.i + i) % 3 === 1) {
              const col = [
                ["#ff8fa8", "#d6284a"],
                ["#8fd0ff", "#2a6fd6"],
                ["#b8ffb0", "#2a9a52"],
              ][b.i % 3];
              c.beginPath();
              c.moveTo(0, -b.s * 0.6);
              c.lineTo(b.s * 0.5, 0);
              c.lineTo(0, b.s * 0.8);
              c.lineTo(-b.s * 0.5, 0);
              c.closePath();
              inked(
                c,
                grad(
                  c,
                  -b.s * 0.5,
                  -b.s * 0.6,
                  b.s * 0.5,
                  b.s * 0.8,
                  col[0],
                  col[1],
                ),
                1.2,
                MM.ink,
              );
            } else {
              c.beginPath();
              c.ellipse(0, 0, b.s * 0.5, b.s * 0.44, 0, 0, TAU);
              inked(c, "#efe9d9", 1.2, MM.ink);
              c.beginPath();
              c.roundRect(-b.s * 0.26, b.s * 0.24, b.s * 0.52, b.s * 0.34, 1.5);
              inked(c, "#efe9d9", 1.1, MM.ink);
              c.fillStyle = MM.ink;
              c.beginPath();
              c.arc(-b.s * 0.2, -b.s * 0.04, b.s * 0.13, 0, TAU);
              c.arc(b.s * 0.2, -b.s * 0.04, b.s * 0.13, 0, TAU);
              c.fill();
            }
          });
        });
      });
      // torches at the top corners
      for (const [x, sd, d] of [
        [-14, 1, 0.9],
        [CARD.w + 14, 4, 1.05],
      ]) {
        const k = still ? 1 : pop(t, d, 0.5);
        if (k <= 0) continue;
        ctx.save();
        ctx.translate(x, 34);
        ctx.scale(k, k);
        mmTorch(ctx, tt, sd, lit);
        ctx.restore();
      }
      // a slime bounces in one corner; in the other the chest opens and coins fly
      {
        const k = still ? 1 : pop(t, 1, 0.6);
        if (k > 0) {
          const c = tt % 3.4,
            hop =
              !still && c < 0.7
                ? Math.abs(Math.sin((c / 0.7) * Math.PI)) * 16
                : 0;
          ctx.save();
          ctx.translate(40, CARD.h + 44 - hop);
          ctx.scale(k * 1.15, k * 1.15);
          mmSlime(
            ctx,
            tt,
            ["#b8ffcf", "#3fd68a", "#1a8a5a"],
            !still && blinking(tt, 3),
          );
          ctx.restore();
          ctx.save();
          ctx.translate(72, CARD.h + 46);
          ctx.scale(k * 0.62, k * 0.62);
          mmSlime(
            ctx,
            tt + 1.3,
            ["#d9c4ff", "#8a5cf6", "#4a2aa8"],
            !still && blinking(tt, 2.6, 1),
          );
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.3, 0.6);
        if (k > 0) {
          const op = still ? 1 : easeOutBack(clamp((t - 2.05) / 0.4)),
            shine = 0.7 + 0.3 * Math.sin(tt * 3);
          ctx.save();
          ctx.translate(CARD.w - 44, CARD.h + 46);
          ctx.scale(k, k);
          ctx.lineJoin = "round";
          if (op > 0) {
            glow(ctx, 0, -24, 46, `rgba(255,214,90,${0.6 * op * shine})`);
            ctx.save();
            ctx.globalAlpha = 0.5 * op;
            for (let i = -2; i <= 2; i++) {
              ctx.beginPath();
              ctx.moveTo(i * 5, -20);
              ctx.lineTo(i * 15 - 4, -62);
              ctx.lineTo(i * 15 + 4, -62);
              ctx.closePath();
              ctx.fillStyle = grad(
                ctx,
                0,
                -20,
                0,
                -62,
                "rgba(255,230,140,.9)",
                "rgba(255,230,140,0)",
              );
              ctx.fill();
            }
            ctx.restore();
          }
          ctx.save();
          ctx.translate(-24, -22);
          ctx.rotate(-op * 0.95);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(0, -16, 12, -17);
          ctx.lineTo(36, -17);
          ctx.quadraticCurveTo(48, -16, 48, 0);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, 0, -17, 0, 0, "#a8683a", "#6b3a1c"),
            1.7,
            MM.ink,
          );
          ctx.fillStyle = MM.gold;
          ctx.strokeStyle = MM.ink;
          ctx.lineWidth = 1.2;
          for (const x of [7, 41]) {
            ctx.beginPath();
            ctx.rect(x - 2.6, -16.5, 5.2, 16.5);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
          if (op > 0.3) {
            ctx.fillStyle = MM.gold;
            ctx.strokeStyle = MM.goldDark;
            ctx.lineWidth = 1;
            for (const [x, y, r] of [
              [-12, -22, 6],
              [-2, -25, 7],
              [9, -23, 6],
              [15, -21, 4.5],
              [-18, -21, 4],
            ]) {
              ctx.beginPath();
              ctx.arc(x, y, r, 0, TAU);
              ctx.fill();
              ctx.stroke();
            }
            ctx.save();
            ctx.translate(4, -30);
            ctx.rotate(tt);
            sparkPath(ctx, 6 * shine);
            ctx.fillStyle = "#fff";
            ctx.fill();
            ctx.restore();
          }
          ctx.beginPath();
          ctx.rect(-24, -22, 48, 22);
          inked(
            ctx,
            grad(ctx, 0, -22, 0, 0, "#8a5230", "#5a2e16"),
            1.7,
            MM.ink,
          );
          ctx.fillStyle = MM.gold;
          ctx.strokeStyle = MM.ink;
          ctx.lineWidth = 1.2;
          for (const x of [-17, 17]) {
            ctx.beginPath();
            ctx.rect(x - 2.6, -22, 5.2, 22);
            ctx.fill();
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.roundRect(-5, -24, 10, 11, 2);
          inked(ctx, MM.gold, 1.3, MM.ink);
          ctx.beginPath();
          ctx.arc(0, -19.5, 1.7, 0, TAU);
          ctx.fillStyle = MM.ink;
          ctx.fill();
          ctx.restore();
        }
        for (const p of this.coins.list) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(Math.cos(p.rot + p.age * p.vr), 1);
          ctx.globalAlpha = Math.min(1, (p.life - p.age) * 3);
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, TAU);
          ctx.fillStyle = MM.gold;
          ctx.fill();
          ctx.strokeStyle = MM.goldDark;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }
      // on the wall: a shield with crossed blades, and three potions that bubble
      {
        const k = still ? 1 : bounceOut((t - 1) / 0.85);
        if (still || t > 1) {
          ctx.save();
          ctx.translate(CARD.w * 0.3, -56 - (1 - k) * 140);
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          for (const sx of [-1, 1]) {
            ctx.save();
            ctx.rotate(sx * 0.72);
            ctx.beginPath();
            ctx.moveTo(-3, 30);
            ctx.lineTo(-3.4, -34);
            ctx.lineTo(0, -44);
            ctx.lineTo(3.4, -34);
            ctx.lineTo(3, 30);
            ctx.closePath();
            inked(
              ctx,
              grad(ctx, -3.4, 0, 3.4, 0, "#ffffff", "#aab4c8"),
              1.4,
              MM.ink,
            );
            ctx.beginPath();
            ctx.roundRect(-11, 28, 22, 5, 2);
            inked(ctx, MM.gold, 1.3, MM.ink);
            ctx.beginPath();
            ctx.roundRect(-2.6, 33, 5.2, 13, 2);
            inked(ctx, "#6b3a1c", 1.3, MM.ink);
            ctx.beginPath();
            ctx.arc(0, 48, 3.6, 0, TAU);
            inked(ctx, MM.gold, 1.2, MM.ink);
            ctx.restore();
          }
          ctx.beginPath();
          ctx.moveTo(-25, -24);
          ctx.quadraticCurveTo(0, -32, 25, -24);
          ctx.quadraticCurveTo(27, 12, 0, 30);
          ctx.quadraticCurveTo(-27, 12, -25, -24);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, -25, -28, 25, 30, "#7a5cf0", "#3a229a"),
            2,
            MM.ink,
          );
          ctx.strokeStyle = MM.gold;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.strokeStyle = MM.ink;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.save();
          ctx.translate(0, -2);
          ctx.rotate(Math.sin(tt * 0.8) * 0.04);
          starPath(ctx, 12, 4, 0.36);
          inked(ctx, MM.gold, 1.3, MM.ink);
          ctx.restore();
          ctx.restore();
        }
      }
      [
        [0.68, 13, ["#ff8fa8", "#d6284a", "rgba(255,90,120,.3)"], 0],
        [0.78, 16, ["#8fd0ff", "#2a6fd6", "rgba(90,170,255,.3)"], 0.4],
        [0.89, 12, ["#b8ffb0", "#2a9a52", "rgba(110,240,140,.3)"], 0.7],
      ].forEach(([u, s, col, ph], i) => {
        const k = still ? 1 : pop(t, 1.6 + i * 0.14, 0.5);
        if (k <= 0) return;
        ctx.save();
        ctx.translate(CARD.w * u, -14 - s * 0.45);
        ctx.scale(k, k);
        mmPotion(ctx, s, col, tt, ph);
        ctx.restore();
      });
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r;
      // a sword stands behind the avatar; round it, a ring of stone with runes that light up in turn
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.4) / 0.6));
        ctx.save();
        ctx.translate(77, 77);
        ctx.rotate(0.5);
        ctx.translate(0, (1 - k) * -60);
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.beginPath();
        ctx.moveTo(-3.6, -R - 4);
        ctx.lineTo(-3.6, -R - 26);
        ctx.lineTo(0, -R - 34);
        ctx.lineTo(3.6, -R - 26);
        ctx.lineTo(3.6, -R - 4);
        ctx.closePath();
        inked(ctx, grad(ctx, -3.6, 0, 3.6, 0, "#fff", "#aab4c8"), 1.4, MM.ink);
        ctx.beginPath();
        ctx.roundRect(-3, R + 14, 6, 13, 2);
        inked(ctx, "#6b3a1c", 1.3, MM.ink);
        ctx.beginPath();
        ctx.roundRect(-11, R + 9, 22, 6, 2);
        inked(ctx, MM.gold, 1.4, MM.ink);
        ctx.beginPath();
        ctx.arc(0, R + 29, 4, 0, TAU);
        inked(ctx, "#d6284a", 1.2, MM.ink);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        77,
        77,
        R + 5,
        [
          [MM.ink, 11.5],
          [MM.stone, 8.6],
          ["rgba(255,255,255,.18)", 1.4],
        ],
        tt,
      );
      for (let i = 0; i < 12; i++) {
        const an = (i / 12) * TAU - Math.PI / 2,
          on = still
            ? i % 3 === 0
              ? 1
              : 0.3
            : 0.25 + 0.75 * Math.max(0, Math.sin(tt * 1.6 - i * 0.52)),
          x = 77 + Math.cos(an) * (R + 5),
          y = 77 + Math.sin(an) * (R + 5);
        glow(ctx, x, y, 8, `rgba(150,120,255,${0.7 * on})`);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(an + Math.PI / 2);
        ctx.strokeStyle = `rgba(${Math.round(190 + 65 * on)},${Math.round(170 + 60 * on)},255,${0.5 + 0.5 * on})`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        const r = i % 4;
        if (r === 0) {
          ctx.moveTo(0, -3);
          ctx.lineTo(0, 3);
          ctx.moveTo(0, -3);
          ctx.lineTo(2.4, -0.6);
        } else if (r === 1) {
          ctx.moveTo(-2, -3);
          ctx.lineTo(2, 0);
          ctx.lineTo(-2, 3);
        } else if (r === 2) {
          ctx.moveTo(-2, 3);
          ctx.lineTo(0, -3);
          ctx.lineTo(2, 3);
        } else {
          ctx.moveTo(-2, -3);
          ctx.lineTo(2, 3);
          ctx.moveTo(2, -3);
          ctx.lineTo(-2, 3);
        }
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1),
        fl = 0.8 + 0.2 * Math.sin(tt * 11) * Math.sin(tt * 6.3);
      // torchlight from the two top corners, dust in it, and a circle of runes turning on the floor
      glow(ctx, 0, 30, 170, `rgba(255,150,50,${0.26 * a * fl})`);
      glow(ctx, CARD.w, 30, 170, `rgba(255,150,50,${0.26 * a * (1.6 - fl)})`);
      ctx.save();
      ctx.translate(CARD.w * 0.5, CARD.h - 54);
      ctx.scale(1, 0.34);
      ctx.rotate(tt * 0.25);
      ctx.globalAlpha = a * (0.4 + 0.15 * Math.sin(tt * 2));
      ctx.strokeStyle = "#b8a4ff";
      ctx.lineWidth = 2;
      for (const r of [70, 58]) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
      }
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const an = (i * 2 * TAU) / 6;
        ctx.lineTo(Math.cos(an) * 58, Math.sin(an) * 58);
      }
      ctx.closePath();
      starPath(ctx, 58, 6, 0.58);
      ctx.stroke();
      ctx.restore();
      glow(ctx, CARD.w * 0.5, CARD.h - 54, 90, `rgba(150,120,255,${0.2 * a})`);
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y) => {
        glow(
          ctx,
          x,
          y,
          p.s * 2.2,
          `rgba(255,220,160,${0.5 * a * (0.3 + 0.7 * Math.abs(Math.sin(tt * p.f + p.ph)))})`,
        );
      });
    },
  };
}
