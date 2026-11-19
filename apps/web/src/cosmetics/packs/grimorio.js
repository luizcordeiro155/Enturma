// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  lerp,
  easeOutCubic,
  easeOutBack,
  easeInOut,
  rng,
  Particles,
  glow,
  inked,
  pop,
  fade,
  grad,
  rgrad,
  starPath,
  sparkPath,
  blinking,
  ringBase,
  Drift,
  twinkles,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Grimório Arcano ----------
const GR = {
  ink: "#150f2e",
  violet: "#8a5cf6",
  teal: "#2ee6d0",
  gold: "#ffd66b",
};
const grRune = (ctx, i, s) => {
  ctx.beginPath();
  const r = ((i % 6) + 6) % 6;
  if (r === 0) {
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s);
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.7, -s * 0.3);
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.7, s * 0.6);
  } else if (r === 1) {
    ctx.moveTo(-s * 0.6, -s);
    ctx.lineTo(s * 0.6, 0);
    ctx.lineTo(-s * 0.6, s);
  } else if (r === 2) {
    ctx.moveTo(-s * 0.6, s);
    ctx.lineTo(0, -s);
    ctx.lineTo(s * 0.6, s);
    ctx.moveTo(-s * 0.3, s * 0.2);
    ctx.lineTo(s * 0.3, s * 0.2);
  } else if (r === 3) {
    ctx.moveTo(-s * 0.6, -s);
    ctx.lineTo(s * 0.6, s);
    ctx.moveTo(s * 0.6, -s);
    ctx.lineTo(-s * 0.6, s);
  } else if (r === 4) {
    ctx.arc(0, 0, s * 0.7, 0.6, TAU - 0.6);
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s);
  } else {
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.6, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.6, 0);
    ctx.closePath();
  }
  ctx.stroke();
};
function grBook(ctx, t, open, flip) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-40, 4);
  ctx.lineTo(0, 9);
  ctx.lineTo(40, 4);
  ctx.lineTo(40, 10);
  ctx.lineTo(0, 15);
  ctx.lineTo(-40, 10);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, -40, 0, 40, 0, "#5a2aa8", "#2a1466", "#5a2aa8"),
    1.7,
    GR.ink,
  );
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.quadraticCurveTo(sx * 18, 8 - 12 * open, sx * 37, 4 - 4 * open);
    ctx.lineTo(sx * 37, -24 * open + 2);
    ctx.quadraticCurveTo(sx * 18, -32 * open + 4, 0, -22 * open + 6);
    ctx.closePath();
    inked(ctx, grad(ctx, 0, 0, sx * 37, 0, "#d9cfb8", "#fff8e6"), 1.5, GR.ink);
    ctx.strokeStyle = "rgba(90,60,150,.5)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = lerp(6, -20 * open + 5, i / 5);
      ctx.beginPath();
      ctx.moveTo(sx * 6, y);
      ctx.quadraticCurveTo(sx * 20, y - 6 * open, sx * 32, y - 3 * open);
      ctx.stroke();
    }
  }
  if (flip > 0 && flip < 1) {
    const a = flip * Math.PI,
      x = Math.cos(a) * 36;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.quadraticCurveTo(
      x * 0.5,
      8 - 14 - Math.sin(a) * 16,
      x,
      2 - Math.sin(a) * 20,
    );
    ctx.lineTo(x, -24 + 2 - Math.sin(a) * 20);
    ctx.quadraticCurveTo(x * 0.5, -32 - Math.sin(a) * 14, 0, -16);
    ctx.closePath();
    inked(ctx, "#fff8e6", 1.4, GR.ink);
  }
  ctx.beginPath();
  ctx.moveTo(0, -16 * open + 4);
  ctx.lineTo(0, 9);
  ctx.strokeStyle = GR.ink;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, 12);
  ctx.lineTo(8, 28 + Math.sin(t * 2) * 2);
  ctx.lineTo(11, 24);
  ctx.lineTo(14, 28 + Math.sin(t * 2) * 2);
  ctx.lineTo(14, 12);
  ctx.closePath();
  inked(ctx, "#e03a5a", 1.2, GR.ink);
}
function grOwl(ctx, t, blink, tilt) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(0, -15, 15, 17, 0, 0, TAU);
  inked(ctx, grad(ctx, 0, -32, 0, 2, "#6a4fc4", "#33206e"), 1.7, GR.ink);
  ctx.beginPath();
  ctx.ellipse(0, -10, 9, 11, 0, 0, TAU);
  ctx.fillStyle = "#c9b8ff";
  ctx.fill();
  ctx.strokeStyle = "rgba(60,30,120,.5)";
  ctx.lineWidth = 1;
  for (let r = 0; r < 3; r++)
    for (let c = -1; c <= 1; c++) {
      ctx.beginPath();
      ctx.arc(c * 5 + (r % 2) * 2.5 - 1, -15 + r * 5, 2.4, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * 14, -13, 5, 12, sx * -0.2, 0, TAU);
    inked(ctx, "#4a34a0", 1.5, GR.ink);
    ctx.strokeStyle = "#ffb23c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx * 5, 1);
    ctx.lineTo(sx * 5, 4);
    ctx.moveTo(sx * 2.5, 4.5);
    ctx.lineTo(sx * 7.5, 4.5);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(0, -31);
  ctx.rotate(tilt);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 7, -9);
    ctx.lineTo(sx * 15, -19);
    ctx.lineTo(sx * 15, -5);
    ctx.closePath();
    inked(ctx, "#4a34a0", 1.5, GR.ink);
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 13, 0, 0, TAU);
  inked(ctx, grad(ctx, 0, -13, 0, 13, "#7a5fd6", "#4a34a0"), 1.7, GR.ink);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * 7, 0, 6.6, 0, TAU);
    inked(ctx, "#f4efff", 1.3, GR.ink);
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(sx * 7 - 4.6, 0);
      ctx.quadraticCurveTo(sx * 7, 3, sx * 7 + 4.6, 0);
      ctx.strokeStyle = GR.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      glow(ctx, sx * 7, 0, 9, "rgba(46,230,208,.5)");
      ctx.beginPath();
      ctx.arc(sx * 7, 0, 3.8, 0, TAU);
      ctx.fillStyle = GR.teal;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx * 7, 0, 1.9, 0, TAU);
      ctx.fillStyle = GR.ink;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx * 7 + 1.4, -1.6, 1, 0, TAU);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.moveTo(-2.4, 3);
  ctx.lineTo(0, 8);
  ctx.lineTo(2.4, 3);
  ctx.closePath();
  inked(ctx, "#ffb23c", 1.1, GR.ink);
  ctx.restore();
}
function grCandle(ctx, t, seed) {
  const fl = 0.8 + 0.2 * Math.sin(t * 12 + seed);
  glow(ctx, 0, -20, 26, `rgba(255,200,110,${0.5 * fl})`);
  ctx.beginPath();
  ctx.roundRect(-4, -12, 8, 24, 2);
  inked(ctx, grad(ctx, -4, 0, 4, 0, "#fffaf0", "#d6c8ff"), 1.3, GR.ink);
  const w = Math.sin(t * 9 + seed) * 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.bezierCurveTo(-4.5, -15, -2.6 + w, -21, w, -26);
  ctx.bezierCurveTo(2.6 + w, -21, 4.5, -15, 0, -12);
  ctx.fillStyle = "#ffb02e";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -12.6);
  ctx.bezierCurveTo(-2.2, -14.6, -1.2 + w * 0.5, -17.6, w * 0.5, -20);
  ctx.bezierCurveTo(1.2 + w * 0.5, -17.6, 2.2, -14.6, 0, -12.6);
  ctx.fillStyle = "#fff6c4";
  ctx.fill();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Grimório Arcano",
    reach: { top: 118, side: 68, bottom: 70 },
    mat: ["#150f33", "#0a0719"],
    theme: cardTheme("#6a3de8", "#128f88"),
    init() {
      this.loop = frameLoop(CARD, 12);
      const m = this.loop.m;
      this.stars = twinkles(22, 111, CARD.w, CARD.h, 22, 84);
      this.fx = Drift(18, 113, {
        v: [-24, -8],
        s: [5, 10],
        sway: 10,
        spin: 0.8,
      });
      this.motes = Particles();
      this.rand = rng(17);
      const R = rng(3);
      this.cand = [
        [-34, 0.3],
        [-44, 0.62],
        [CARD.w + 36, 0.44],
        [CARD.w + 46, 0.74],
      ].map(([x, u], i) => ({ x, y: CARD.h * u, ph: R() * TAU, i }));
      this.con = [];
      for (let i = 0; i < 7; i++)
        this.con.push([30 + R() * (CARD.w - 60), 150 + R() * (CARD.h - 220)]);
    },
    reset() {
      this.motes.clear();
      this.rand = rng(17);
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand;
      if (t > 1.8 && R() < dt * 9)
        this.motes.add({
          x: CARD.w * 0.5 + (R() - 0.5) * 50,
          y: -40,
          vx: (R() - 0.5) * 22,
          vy: -30 - R() * 40,
          life: 1.2 + R() * 1,
          size: 4 + R() * 3,
          sway: 12,
          swayF: 2 + R() * 2,
          phase: R() * TAU,
          k: Math.floor(R() * 6),
          teal: R() < 0.5,
        });
      this.motes.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1),
        L = this.loop.L;
      for (const s of this.stars) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha =
          a * (0.25 + 0.75 * Math.abs(Math.sin(tt * s.f + s.ph)));
        ctx.rotate(tt * 0.3 + s.ph);
        sparkPath(ctx, s.s * 2.1);
        ctx.fillStyle = s.s > 2.8 ? GR.gold : s.s > 2 ? "#c9b8ff" : GR.teal;
        ctx.fill();
        ctx.restore();
      }
      // a thread of light draws itself right round the card, runes riding along it
      {
        const g = still ? 1 : easeInOut(clamp((t - 0.2) / 1.9)),
          n = 140,
          last = Math.floor(n * g);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (const [col, w, al] of [
          ["138,92,246", 12, 0.22],
          ["138,92,246", 5, 0.6],
          ["230,220,255", 1.6, 1],
        ]) {
          ctx.beginPath();
          for (let i = 0; i <= last; i++) {
            const p = this.loop.at((i / n) * L);
            ctx.lineTo(p.x, p.y);
          }
          if (g >= 1) ctx.closePath();
          ctx.strokeStyle = `rgba(${col},${al})`;
          ctx.lineWidth = w;
          ctx.stroke();
        }
        for (let i = 0; i < 14; i++) {
          const u = (i / 14 + tt * 0.012) % 1;
          if (u > g) continue;
          const p = this.loop.at(u * L),
            on = 0.4 + 0.6 * Math.abs(Math.sin(tt * 1.4 + i));
          ctx.save();
          ctx.translate(p.x + p.nx * 13, p.y + p.ny * 13);
          glow(ctx, 0, 0, 11, `rgba(46,230,208,${0.45 * on})`);
          ctx.strokeStyle = `rgba(190,255,245,${0.5 + 0.5 * on})`;
          ctx.lineWidth = 1.5;
          grRune(ctx, i, 4.6);
          ctx.restore();
        }
        if (g < 1 && g > 0) {
          const p = this.loop.at(g * L);
          glow(ctx, p.x, p.y, 22, "rgba(255,255,255,.9)");
        }
      }
      // candles float beside the card
      for (const c of this.cand) {
        const k = still ? 1 : pop(t, 0.9 + c.i * 0.14, 0.5);
        if (k <= 0) continue;
        ctx.save();
        ctx.translate(c.x, c.y + Math.sin(tt * 1.3 + c.ph) * 5);
        ctx.scale(k, k);
        grCandle(ctx, tt, c.i * 2);
        ctx.restore();
      }
      // a cauldron bubbles in one corner; books, a quill and crystals wait in the other
      {
        const k = still ? 1 : pop(t, 0.8, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(42, CARD.h + 48);
          ctx.scale(k, k);
          ctx.lineJoin = "round";
          for (let i = 0; i < 4; i++) {
            const q = (tt * 0.4 + i * 0.25) % 1;
            glow(
              ctx,
              -8 + i * 6 + Math.sin(tt * 2 + i) * 4,
              -30 - q * 34,
              9 + q * 8,
              `rgba(110,255,170,${0.4 * (1 - q)})`,
            );
          }
          ctx.beginPath();
          ctx.moveTo(-24, -24);
          ctx.bezierCurveTo(-32, -4, -22, 2, 0, 2);
          ctx.bezierCurveTo(22, 2, 32, -4, 24, -24);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, -24, 0, 24, 0, "#4a4560", "#1c1830"),
            1.8,
            GR.ink,
          );
          ctx.beginPath();
          ctx.ellipse(0, -24, 25, 6.5, 0, 0, TAU);
          inked(ctx, "#2a2540", 1.6, GR.ink);
          ctx.beginPath();
          ctx.ellipse(0, -24, 20, 4.4, 0, 0, TAU);
          ctx.fillStyle = "#4dff9a";
          ctx.fill();
          for (let i = 0; i < 3; i++) {
            const q = (tt * 0.9 + i * 0.37) % 1;
            ctx.beginPath();
            ctx.arc(-10 + i * 10, -25 - q * 7, 2 + q * 2.6, 0, TAU);
            ctx.strokeStyle = `rgba(200,255,220,${1 - q})`;
            ctx.lineWidth = 1.3;
            ctx.stroke();
          }
          for (const x of [-15, 15]) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x * 1.25, 6);
            ctx.strokeStyle = GR.ink;
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.1, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w - 44, CARD.h + 52);
          ctx.scale(k, k);
          ctx.lineJoin = "round";
          [
            [-2, 0, 44, "#2a8f88"],
            [3, -10, 38, "#8a3a9a"],
            [-4, -20, 40, "#c9942a"],
          ].forEach(([x, y, w, c]) => {
            ctx.beginPath();
            ctx.roundRect(x - w / 2, y - 10, w, 10, 2);
            inked(ctx, c, 1.5, GR.ink);
            ctx.fillStyle = "#f4ecd6";
            ctx.fillRect(x + w / 2 - 5, y - 8.4, 3.6, 6.8);
            ctx.fillStyle = "rgba(255,255,255,.5)";
            ctx.fillRect(x - w / 2 + 5, y - 7, 2, 4);
          });
          ctx.save();
          ctx.translate(10, -32);
          ctx.rotate(0.5 + Math.sin(tt * 1.4) * 0.04);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(10, -22, 2, -42);
          ctx.quadraticCurveTo(-8, -22, 0, 0);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, 0, -42, 0, 0, "#f4efff", "#b8a4ff"),
            1.3,
            GR.ink,
          );
          ctx.beginPath();
          ctx.moveTo(0, 4);
          ctx.lineTo(1, -40);
          ctx.strokeStyle = GR.ink;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
          [
            [-26, 0, 20, -0.2],
            [-34, 2, 13, -0.5],
          ].forEach(([x, y, h, r]) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(r);
            glow(
              ctx,
              0,
              -h * 0.5,
              h,
              `rgba(46,230,208,${0.3 + 0.15 * Math.sin(tt * 2.4 + x)})`,
            );
            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.lineTo(-6, -h * 0.7);
            ctx.lineTo(0, -h);
            ctx.lineTo(6, -h * 0.7);
            ctx.lineTo(5, 0);
            ctx.closePath();
            inked(
              ctx,
              grad(ctx, -6, 0, 6, 0, "#d6fff8", GR.teal, "#128f88"),
              1.3,
              GR.ink,
            );
            ctx.restore();
          });
          ctx.restore();
        }
      }
      // above the card: the grimoire opens over a turning circle, runes rise from its pages
      {
        const k = still ? 1 : easeOutBack(clamp((t - 0.9) / 0.8));
        if (k > 0) {
          const open = still ? 1 : easeOutCubic(clamp((t - 1.4) / 0.6)),
            c = tt % 4.5,
            flip = !still && t > 2.4 && c < 0.9 ? c / 0.9 : 0,
            x = CARD.w * 0.5,
            y = -44 + Math.sin(tt * 1.5) * 4;
          ctx.save();
          ctx.translate(x, y + 2);
          ctx.scale(k, k * 0.42);
          ctx.rotate(tt * 0.4);
          ctx.globalAlpha = 0.85;
          ctx.strokeStyle = GR.teal;
          ctx.lineWidth = 2.4;
          for (const r of [60, 50]) {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TAU);
            ctx.stroke();
          }
          starPath(ctx, 50, 5, 0.38);
          ctx.stroke();
          ctx.restore();
          glow(ctx, x, y - 6, 62, `rgba(138,92,246,${0.35 * k})`);
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(k * 1.15, k * 1.15);
          grBook(ctx, tt, open, flip);
          ctx.restore();
          for (const p of this.motes.list) {
            const q = p.age / p.life;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.globalAlpha = Math.sin(q * Math.PI);
            glow(
              ctx,
              0,
              0,
              10,
              p.teal ? "rgba(46,230,208,.6)" : "rgba(255,214,107,.6)",
            );
            ctx.strokeStyle = p.teal ? "#d6fff8" : "#fff3c4";
            ctx.lineWidth = 1.5;
            ctx.lineCap = "round";
            grRune(ctx, p.k, p.size);
            ctx.restore();
          }
        }
      }
      // an owl keeps watch on one side, a crystal ball swirls on the other
      {
        const k = still ? 1 : clamp((t - 1.9) / 0.6);
        if (k > 0) {
          const c = tt % 5.2,
            tilt =
              !still && c > 3.6 && c < 4.8
                ? Math.sin(((c - 3.6) / 1.2) * Math.PI) * 0.4
                : 0;
          ctx.save();
          ctx.translate(
            CARD.w * 0.84 + (1 - easeOutCubic(k)) * 100,
            -4 - (1 - easeOutBack(k)) * 70,
          );
          ctx.scale(1.35, 1.35);
          grOwl(ctx, tt, !still && blinking(tt, 3.4), tilt);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.5, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w * 0.16, -3);
          ctx.scale(k, k);
          ctx.beginPath();
          ctx.moveTo(-15, 0);
          ctx.quadraticCurveTo(0, -12, 15, 0);
          ctx.closePath();
          inked(ctx, grad(ctx, 0, -8, 0, 0, GR.gold, "#a8741c"), 1.5, GR.ink);
          glow(
            ctx,
            0,
            -26,
            40,
            `rgba(138,92,246,${0.4 + 0.15 * Math.sin(tt * 2)})`,
          );
          ctx.beginPath();
          ctx.arc(0, -26, 20, 0, TAU);
          inked(
            ctx,
            rgrad(ctx, -6, -32, 26, "#e6dcff", "#8a5cf6", "#2a1466"),
            1.7,
            GR.ink,
          );
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, -26, 18.6, 0, TAU);
          ctx.clip();
          for (let i = 0; i < 3; i++) {
            const an = tt * (0.8 + i * 0.3) + i * 2.1;
            glow(
              ctx,
              Math.cos(an) * 9,
              -26 + Math.sin(an * 1.3) * 8,
              11,
              i % 2 ? "rgba(46,230,208,.7)" : "rgba(255,214,107,.6)",
            );
          }
          ctx.restore();
          ctx.beginPath();
          ctx.ellipse(-7, -34, 3.4, 6.5, 0.6, 0, TAU);
          ctx.fillStyle = "rgba(255,255,255,.55)";
          ctx.fill();
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r,
        g = still ? 1 : easeInOut(clamp((t - 0.3) / 1.1));
      ctx.save();
      ctx.globalAlpha = a;
      glow(ctx, 77, 77, R + 30, "rgba(138,92,246,.18)");
      ringBase(
        ctx,
        77,
        77,
        R + 3.5,
        [
          [GR.ink, 7],
          ["#3a2a8a", 4.4],
        ],
        tt,
      );
      // a circle of light closes round the avatar, runes turning, three stars in orbit
      ctx.lineCap = "round";
      for (const [r, col, w] of [
        [R + 9, GR.teal, 2],
        [R + 16, "#c9b8ff", 1.2],
      ]) {
        ctx.beginPath();
        ctx.arc(77, 77, r, -Math.PI / 2, -Math.PI / 2 + TAU * g);
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.stroke();
      }
      for (let i = 0; i < 10; i++) {
        const an = (i / 10) * TAU + tt * 0.25;
        if (i / 10 > g) continue;
        ctx.save();
        ctx.translate(
          77 + Math.cos(an) * (R + 12.5),
          77 + Math.sin(an) * (R + 12.5),
        );
        ctx.rotate(an + Math.PI / 2);
        ctx.strokeStyle = `rgba(214,255,248,${0.5 + 0.5 * Math.abs(Math.sin(tt * 1.5 + i))})`;
        ctx.lineWidth = 1.2;
        grRune(ctx, i, 2.6);
        ctx.restore();
      }
      for (let i = 0; i < 3; i++) {
        const an = tt * 1.1 + i * (TAU / 3),
          x = 77 + Math.cos(an) * (R + 22),
          y = 77 + Math.sin(an) * (R + 22) * 0.9;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tt * 2);
        ctx.globalAlpha = a * g;
        glow(ctx, 0, 0, 9, "rgba(255,214,107,.6)");
        sparkPath(ctx, 5);
        ctx.fillStyle = GR.gold;
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      {
        const k = still ? 1 : pop(t, 1.1, 0.5);
        ctx.save();
        ctx.translate(77, 77 - R - 9);
        ctx.rotate(-0.3 + Math.sin(tt * 1.4) * 0.05);
        ctx.scale(k, k);
        glow(ctx, 0, 0, 20, "rgba(255,214,107,.4)");
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0.5, TAU - 0.5);
        ctx.arc(4.5, 0, 8, TAU - 0.9, 0.9, true);
        ctx.closePath();
        inked(ctx, grad(ctx, -11, -11, 6, 11, "#fff6d6", GR.gold), 1.5, GR.ink);
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(
        ctx,
        CARD.w * 0.2,
        CARD.h * 0.75,
        170,
        `rgba(138,92,246,${0.24 * a})`,
      );
      glow(
        ctx,
        CARD.w * 0.85,
        CARD.h * 0.5,
        160,
        `rgba(46,230,208,${0.16 * a})`,
      );
      // a constellation joins up, star by star
      const n = this.con.length,
        k = still ? n : clamp((t - 0.8) / 2.2) * n;
      ctx.save();
      ctx.globalAlpha = a * 0.6;
      ctx.strokeStyle = "rgba(214,200,255,.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        if (i > k) break;
        const [x, y] = this.con[i];
        if (i) {
          const [px, py] = this.con[i - 1],
            q = clamp(k - i + 1);
          ctx.moveTo(px, py);
          ctx.lineTo(lerp(px, x, q), lerp(py, y, q));
        }
      }
      ctx.stroke();
      ctx.restore();
      this.con.forEach(([x, y], i) => {
        if (i > k) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = a * (0.5 + 0.5 * Math.abs(Math.sin(tt * 1.6 + i)));
        glow(ctx, 0, 0, 9, "rgba(255,255,255,.6)");
        sparkPath(ctx, 4);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.restore();
      });
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha =
          a * 0.45 * (0.4 + 0.6 * Math.abs(Math.sin(tt * p.f + p.ph)));
        ctx.strokeStyle = p.i % 2 ? "#d6fff8" : "#e6dcff";
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        grRune(ctx, p.i, p.s * 0.5);
        ctx.restore();
      });
    },
  };
}
