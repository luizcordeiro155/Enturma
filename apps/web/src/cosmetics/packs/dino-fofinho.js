// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  smooth,
  easeOutCubic,
  easeOutBack,
  easeInOut,
  rng,
  Particles,
  glow,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  heartPath,
  leafPath,
  sparkPath,
  blobPath,
  eyes,
  blinking,
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

// ---------- Dino Fofinho ----------
const DF = { ink: "#22402e" };
// A baby T-rex sitting on (0,0), facing right. c: [skin, shade, belly, spots].
function dfRex(ctx, t, c, o = {}) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const wag = Math.sin(t * 3 + (o.ph || 0)) * 0.12;
  ctx.save();
  ctx.translate(-10, -6);
  ctx.rotate(wag);
  ctx.beginPath();
  ctx.moveTo(4, -9);
  ctx.quadraticCurveTo(-14, -8, -27, 2);
  ctx.quadraticCurveTo(-12, 6, 6, 5);
  ctx.closePath();
  inked(ctx, c[0], 1.6, DF.ink);
  ctx.restore();
  blobPath(ctx, [
    [-14, 0],
    [-17, -14],
    [-9, -26],
    [8, -26],
    [15, -13],
    [13, 0],
  ]);
  inked(ctx, grad(ctx, 0, -26, 0, 0, c[0], c[1]), 1.6, DF.ink);
  ctx.beginPath();
  ctx.ellipse(2, -9, 8, 10, 0, 0, TAU);
  ctx.fillStyle = c[2];
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.12)";
  ctx.lineWidth = 1;
  for (const y of [-13, -9, -5]) {
    ctx.beginPath();
    ctx.moveTo(-4, y);
    ctx.quadraticCurveTo(2, y + 1.6, 8, y);
    ctx.stroke();
  }
  for (const [x, y] of [
    [-10, -19],
    [-13, -12],
    [-11, -5],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, TAU);
    ctx.fillStyle = c[3];
    ctx.fill();
  }
  for (const x of [-7, 7]) {
    ctx.beginPath();
    ctx.ellipse(x, -1.5, 6, 3.6, 0, 0, TAU);
    inked(ctx, c[0], 1.4, DF.ink);
    ctx.fillStyle = "#fff";
    for (const dx of [-2.6, 0, 2.6]) {
      ctx.beginPath();
      ctx.arc(x + dx + 1.5, 0.5, 1, 0, TAU);
      ctx.fill();
    }
  }
  for (const y of [-17, -13]) {
    ctx.save();
    ctx.translate(9, y);
    ctx.rotate(0.5 + Math.sin(t * 5 + y) * (o.wave ? 0.5 : 0.08));
    ctx.beginPath();
    ctx.roundRect(0, -2, 9, 4, 2);
    inked(ctx, c[0], 1.3, DF.ink);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(3, -34);
  ctx.rotate((o.tilt || 0) + (o.look || 0) * 0.05);
  for (const [x, y, s] of [
    [-12, -12, 4],
    [-5, -17, 5],
    [3, -17.5, 4.4],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x - s, y + s);
    ctx.lineTo(x, y - s * 0.6);
    ctx.lineTo(x + s, y + s);
    ctx.closePath();
    inked(ctx, c[3], 1.3, DF.ink);
  }
  blobPath(ctx, [
    [-16, 2],
    [-15, -11],
    [-4, -17],
    [10, -15],
    [22, -8],
    [23, 4],
    [14, 11],
    [-6, 12],
  ]);
  inked(ctx, grad(ctx, 0, -16, 0, 12, c[0], c[1]), 1.7, DF.ink);
  ctx.fillStyle = "rgba(255,120,150,.5)";
  ctx.beginPath();
  ctx.ellipse(1, 4, 3.6, 2.3, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(2, -4);
  eyes(ctx, 12, 3.3, o.look || 0, o.blink, "#1c2a1c", "#fff");
  ctx.restore();
  ctx.fillStyle = DF.ink;
  ctx.beginPath();
  ctx.arc(18, -5, 1, 0, TAU);
  ctx.arc(20.5, -3.5, 1, 0, TAU);
  ctx.fill();
  const op = o.roar || 0;
  ctx.beginPath();
  ctx.moveTo(6, 6);
  ctx.quadraticCurveTo(15, 9 + op * 5, 22, 4);
  ctx.strokeStyle = DF.ink;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  if (op > 0.2) {
    ctx.beginPath();
    ctx.moveTo(8, 6.5);
    ctx.quadraticCurveTo(15, 8 + op * 9, 21, 5);
    ctx.quadraticCurveTo(15, 7, 8, 6.5);
    ctx.fillStyle = "#c93a5a";
    ctx.fill();
  }
  ctx.fillStyle = "#fff";
  for (const x of [11, 15, 19]) {
    ctx.beginPath();
    ctx.moveTo(x - 1.4, 6.4);
    ctx.lineTo(x, 9);
    ctx.lineTo(x + 1.4, 6.2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
// A baby triceratops standing on (0,0), facing left.
function dfTri(ctx, t, c, o = {}) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.save();
  ctx.translate(15, -12);
  ctx.rotate(Math.sin(t * 3) * 0.12);
  ctx.beginPath();
  ctx.moveTo(-3, -6);
  ctx.quadraticCurveTo(12, -6, 20, 3);
  ctx.quadraticCurveTo(8, 4, -3, 4);
  ctx.closePath();
  inked(ctx, c[0], 1.5, DF.ink);
  ctx.restore();
  for (const x of [-10, 9]) {
    ctx.beginPath();
    ctx.roundRect(x - 4.5, -9, 9, 10, 3.5);
    inked(ctx, c[1], 1.4, DF.ink);
  }
  ctx.beginPath();
  ctx.ellipse(1, -14, 18, 12, 0, 0, TAU);
  inked(ctx, grad(ctx, 0, -26, 0, -2, c[0], c[1]), 1.6, DF.ink);
  for (const x of [-4, 13]) {
    ctx.beginPath();
    ctx.roundRect(x - 4.5, -8, 9, 9, 3.5);
    inked(ctx, c[0], 1.4, DF.ink);
  }
  ctx.save();
  ctx.translate(-15, -19);
  ctx.rotate(o.tilt || 0);
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const a = -1.9 + (i / 6) * 2.6,
      r = 17;
    ctx.lineTo(4 + Math.cos(a) * r * 1.0, -1 + Math.sin(a) * r);
    ctx.lineTo(
      4 + Math.cos(a + 0.2) * (r + 3.5),
      -1 + Math.sin(a + 0.2) * (r + 3.5),
    );
  }
  ctx.lineTo(6, 8);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -18, 0, 10, c[2], c[1]), 1.6, DF.ink);
  blobPath(ctx, [
    [8, 6],
    [8, -8],
    [-2, -12],
    [-14, -6],
    [-18, 3],
    [-12, 9],
    [0, 10],
  ]);
  inked(ctx, grad(ctx, 0, -12, 0, 10, c[0], c[1]), 1.6, DF.ink);
  for (const [x, y, l, r] of [
    [-1, -10, 11, -0.5],
    [5, -9, 11, 0.1],
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r);
    ctx.beginPath();
    ctx.moveTo(-2.6, 0);
    ctx.quadraticCurveTo(-1, -l * 0.7, 0, -l);
    ctx.quadraticCurveTo(1.6, -l * 0.5, 2.6, 0);
    ctx.closePath();
    inked(ctx, "#fff7e0", 1.2, DF.ink);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(-16.5, -2);
  ctx.lineTo(-19, -8);
  ctx.lineTo(-13, -5);
  ctx.closePath();
  inked(ctx, "#fff7e0", 1.2, DF.ink);
  ctx.fillStyle = "rgba(255,120,150,.5)";
  ctx.beginPath();
  ctx.ellipse(-5, 3, 3.2, 2, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(-4, -2);
  if (o.blink) {
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(0, 2, 3, 0);
    ctx.strokeStyle = DF.ink;
    ctx.lineWidth = 1.3;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, TAU);
    ctx.fillStyle = "#1c2a1c";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1, -1, 1.1, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-16, 5);
  ctx.quadraticCurveTo(-12, 8, -8, 6);
  ctx.strokeStyle = DF.ink;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}
function dfPtero(ctx, s, flap, c) {
  ctx.lineJoin = "round";
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.scale(sx, 1);
    ctx.rotate(-flap * 0.6);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.2);
    ctx.quadraticCurveTo(s * 0.9, -s * 0.9, s * 1.9, -s * 0.5);
    ctx.quadraticCurveTo(s * 1.5, -s * 0.1, s * 1.3, s * 0.3);
    ctx.quadraticCurveTo(s * 1, 0, s * 0.7, s * 0.4);
    ctx.quadraticCurveTo(s * 0.4, s * 0.1, 0, s * 0.3);
    ctx.closePath();
    inked(
      ctx,
      grad(ctx, 0, 0, s * 1.9, 0, c[0], c[1]),
      Math.max(1.1, s * 0.1),
      DF.ink,
    );
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.42, s * 0.62, 0, 0, TAU);
  inked(ctx, c[0], Math.max(1.1, s * 0.1), DF.ink);
  ctx.save();
  ctx.translate(0, -s * 0.75);
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, 0);
  ctx.lineTo(-s * 0.9, -s * 0.5);
  ctx.lineTo(0, -s * 0.35);
  ctx.closePath();
  inked(ctx, c[1], Math.max(1, s * 0.09), DF.ink);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.4, s * 0.36, 0, 0, TAU);
  inked(ctx, c[0], Math.max(1.1, s * 0.1), DF.ink);
  ctx.beginPath();
  ctx.moveTo(s * 0.25, -s * 0.12);
  ctx.lineTo(s * 1.05, s * 0.1);
  ctx.lineTo(s * 0.25, s * 0.2);
  ctx.closePath();
  inked(ctx, "#ffd35c", Math.max(1, s * 0.09), DF.ink);
  ctx.beginPath();
  ctx.arc(s * 0.08, -s * 0.06, s * 0.1, 0, TAU);
  ctx.fillStyle = "#1c2a1c";
  ctx.fill();
  ctx.restore();
}
function dfFoot(ctx, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.3, s * 0.42, s * 0.5, 0, 0, TAU);
  ctx.fill();
  for (const a of [-0.6, 0, 0.6]) {
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.5, s * 0.17, s * 0.4, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

export default function create(CARD, AVATAR) {
  return {
    name: "Dino Fofinho",
    reach: { top: 104, side: 66, bottom: 66 },
    mat: ["#143024", "#0a1a12"],
    theme: cardTheme("#3fae72", "#e09a2b"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.vine = Strand(
        this.loop,
        m.bl + m.arc * 0.5,
        m.arc * 0.5 + m.side * 0.9,
        1,
        4,
        { off: 7, wave: 6, gap: 0.06, size: 15 },
      );
      this.vine2 = Strand(
        this.loop,
        m.bl + m.arc * 0.5,
        m.arc * 0.5 + m.top * 0.7,
        -1,
        15,
        { off: 7, wave: 5, gap: 0.085, size: 15 },
      );
      this.t0 = 0.4;
      this.dur = 2;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.stars = twinkles(12, 81, CARD.w, CARD.h, 26, 72);
      this.fx = Drift(10, 83, { v: [8, 18], s: [6, 10], sway: 12, spin: 1.2 });
      this.h = Particles();
      this.rand = rng(18);
      const q = rng(5);
      this.steps = [];
      for (let i = 0; i < 8; i++) {
        const u = i / 7;
        this.steps.push({
          x: CARD.w * (0.18 + 0.64 * u) + (i % 2 ? 12 : -12),
          y: CARD.h - 40 - (CARD.h - 200) * u,
          r: 0.55 + (i % 2 ? 0.25 : -0.25) + q() * 0.2,
        });
      }
    },
    reset() {
      this.h.clear();
      this.rand = rng(18);
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand;
      if (t > 1.8 && R() < dt * 2.2)
        this.h.add({
          x: CARD.w - 40 + (R() - 0.5) * 8,
          y: CARD.h + 2,
          vx: (R() - 0.5) * 14,
          vy: -24 - R() * 14,
          life: 1.8 + R() * 0.8,
          size: 4 + R() * 3,
          sway: 10,
          swayF: 2.4,
          phase: R() * TAU,
        });
      this.h.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.3, 1.2),
        L = this.loop.L;
      for (const s of this.stars) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = a * (0.3 + 0.7 * Math.abs(Math.sin(tt * s.f + s.ph)));
        sparkPath(ctx, s.s * 2);
        ctx.fillStyle = s.s > 2.6 ? "#fff3b8" : "#c8ffd6";
        ctx.fill();
        ctx.restore();
      }
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        for (const v of [this.vine, this.vine2]) {
          strandLine(c, v, g, [
            [DF.ink, 6.6],
            ["#4fae5f", 4],
            ["rgba(200,255,190,.75)", 1.1],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2 + Math.sin(tt * 1.4 + b.ph) * 0.07);
            c.scale(k, k);
            if (b.kind < 0.7) {
              c.rotate(-Math.PI / 2 + (b.i % 2 ? 0.4 : -0.4));
              for (let j = 0; j < 5; j++) {
                c.save();
                c.translate(b.s * 0.18 * j, 0);
                c.rotate(j % 2 ? 0.9 : -0.9);
                leafPath(c, b.s * (0.62 - j * 0.07), b.s * 0.16);
                inked(c, j % 2 ? "#57c785" : "#2f8a45", 1, DF.ink);
                c.restore();
              }
            } else {
              c.translate(0, -b.s * 0.7);
              c.rotate(b.ph);
              dfFoot(c, b.s * 0.5, "#fff3b8");
            }
          });
        }
      });
      // a long neck comes round the right edge, chewing a leaf
      {
        const cy = still ? 3 : (t - 2.6) % 9.5,
          k = still
            ? 1
            : t < 2.6
              ? 0
              : cy < 0.7
                ? easeOutBack(cy / 0.7)
                : cy < 6.5
                  ? 1
                  : cy < 7.1
                    ? 1 - smooth((cy - 6.5) / 0.6)
                    : 0;
        if (k > 0) {
          const ch = Math.sin(tt * 7) * 1.2;
          ctx.save();
          ctx.beginPath();
          ctx.rect(CARD.w + 1.5, CARD.h * 0.2, 120, 220);
          ctx.clip();
          ctx.translate(CARD.w - 40 + k * 44, CARD.h * 0.52);
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-10, 60);
          ctx.bezierCurveTo(8, 30, 6, -10, 26, -34);
          ctx.lineTo(42, -26);
          ctx.bezierCurveTo(26, -4, 28, 34, 16, 62);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, 0, -30, 30, 60, "#8fd0ff", "#4a8fd6"),
            1.7,
            DF.ink,
          );
          ctx.fillStyle = "#3f7fc0";
          for (const [x, y] of [
            [20, -6],
            [18, 12],
            [12, 30],
          ]) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, TAU);
            ctx.fill();
          }
          ctx.save();
          ctx.translate(36, -36);
          ctx.rotate(0.15);
          blobPath(ctx, [
            [-13, 6],
            [-13, -7],
            [-2, -12],
            [14, -8],
            [20, 0],
            [14, 8 + ch],
            [-2, 9],
          ]);
          inked(
            ctx,
            grad(ctx, 0, -12, 0, 9, "#a8dcff", "#5a9fe0"),
            1.7,
            DF.ink,
          );
          ctx.save();
          ctx.translate(2, -3);
          eyes(ctx, 0, 3, 0.5, !still && blinking(tt, 3.2), "#1c2a3a", "#fff");
          ctx.restore();
          ctx.fillStyle = "rgba(255,120,150,.5)";
          ctx.beginPath();
          ctx.ellipse(5, 3, 3, 1.9, 0, 0, TAU);
          ctx.fill();
          ctx.save();
          ctx.translate(19, 3 + ch * 0.5);
          ctx.rotate(0.3 + ch * 0.05);
          leafPath(ctx, 15, 5);
          inked(ctx, "#57c785", 1.2, DF.ink);
          ctx.restore();
          ctx.restore();
          ctx.restore();
        }
      }
      // an egg hatches in one corner; a small volcano puffs hearts in the other
      {
        const k = still ? 1 : pop(t, 0.7, 0.6);
        if (k > 0) {
          const pk = still ? 1 : easeOutBack(clamp((t - 2) / 0.5)),
            bob = Math.sin(tt * 2) * 1.2;
          ctx.save();
          ctx.translate(42, CARD.h + 40);
          ctx.scale(k, k);
          ctx.save();
          ctx.beginPath();
          ctx.rect(-40, -60, 80, 46);
          ctx.clip();
          ctx.translate(0, -16 - pk * 14 + bob);
          ctx.beginPath();
          ctx.ellipse(0, 0, 14, 13, 0, 0, TAU);
          inked(
            ctx,
            grad(ctx, 0, -13, 0, 13, "#ffc070", "#f2903a"),
            1.6,
            DF.ink,
          );
          ctx.save();
          ctx.translate(0, -2);
          eyes(ctx, 11, 2.7, 0, !still && blinking(tt, 2.6), "#2a1a12", "#fff");
          ctx.restore();
          for (const x of [-7, 0, 7]) {
            ctx.beginPath();
            ctx.moveTo(x - 3, -11);
            ctx.lineTo(x, -16);
            ctx.lineTo(x + 3, -11);
            ctx.closePath();
            inked(ctx, "#e0702a", 1.1, DF.ink);
          }
          ctx.restore();
          ctx.beginPath();
          ctx.moveTo(-21, -15);
          for (let i = 0; i <= 7; i++)
            ctx.lineTo(-21 + i * 6, -15 + (i % 2 ? -7 : 0));
          ctx.bezierCurveTo(22, 12, -22, 12, -21, -15);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, -21, -15, 21, 8, "#fffaf0", "#e9dcc4"),
            1.6,
            DF.ink,
          );
          ctx.fillStyle = "#b8e6a8";
          for (const [x, y, r] of [
            [-9, -4, 3.4],
            [7, -6, 2.8],
            [1, 3, 2.4],
          ]) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, TAU);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w - 40, CARD.h + 42);
          ctx.scale(k, k);
          ctx.beginPath();
          ctx.moveTo(-30, 0);
          ctx.quadraticCurveTo(-14, -8, -9, -34);
          ctx.lineTo(9, -34);
          ctx.quadraticCurveTo(14, -8, 30, 0);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, 0, -34, 0, 0, "#a8744a", "#6b4426"),
            1.6,
            DF.ink,
          );
          ctx.beginPath();
          ctx.moveTo(-9, -34);
          ctx.quadraticCurveTo(-6, -24, -3, -30);
          ctx.quadraticCurveTo(0, -20, 4, -30);
          ctx.quadraticCurveTo(7, -25, 9, -34);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, 0, -34, 0, -20, "#ffd35c", "#ff6f3a"),
            1.3,
            DF.ink,
          );
          ctx.restore();
        }
        for (const p of this.h.list) {
          const q = p.age / p.life;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.globalAlpha = Math.sin(q * Math.PI);
          heartPath(ctx, p.size * (0.6 + q * 0.5));
          ctx.fillStyle = "#ff8fb0";
          ctx.fill();
          ctx.restore();
        }
      }
      // top edge: the little rex roars (it is more of a squeak), the triceratops trots in
      {
        const k = still ? 1 : bounceOut((t - 1.2) / 0.85);
        if (still || t > 1.2) {
          const c = tt % 5.4,
            roar =
              !still && c > 4 && c < 5 ? Math.sin(((c - 4) / 1) * Math.PI) : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.26, 2 - (1 - k) * 150);
          ctx.scale(1.6, 1.6);
          dfRex(ctx, tt, ["#7bd389", "#3f9a55", "#fff3c4", "#2f8a45"], {
            look: Math.sin(tt * 0.8) * 0.7,
            blink: !still && blinking(tt, 3.2),
            roar,
            wave: roar > 0,
            tilt: -roar * 0.18,
          });
          ctx.restore();
          if (roar > 0.3) {
            ctx.save();
            ctx.translate(CARD.w * 0.26 + 52, -66);
            ctx.rotate(-0.2);
            ctx.fillStyle = "#fff";
            ctx.font = "700 13px Arial, sans-serif";
            ctx.globalAlpha = roar;
            ctx.fillText("rawr!", 0, 0);
            ctx.restore();
          }
        }
      }
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 1.5) / 1.1));
        if (k > 0) {
          const walk = still || k >= 1 ? 0 : Math.abs(Math.sin(t * 12)) * 4;
          ctx.save();
          ctx.translate(CARD.w * 0.74 + (1 - k) * 130, 2 - walk);
          ctx.scale(1.55, 1.55);
          dfTri(ctx, tt, ["#f5a3c7", "#d9679a", "#ffd3e6"], {
            blink: !still && blinking(tt, 2.9, 1),
            tilt: Math.sin(tt * 1.2) * 0.06,
          });
          ctx.restore();
        }
      }
      // a pterodactyl flies a lap round the card and then hovers above
      {
        const k = still ? 1 : easeInOut(clamp((t - 0.3) / 2.6)),
          s = this.loop.m.left + k * L * 0.92,
          p = this.loop.at(s),
          hover = k >= 1;
        ctx.save();
        if (hover)
          ctx.translate(
            CARD.w * 0.52 + Math.sin(tt * 0.9) * 26,
            -78 + Math.sin(tt * 1.8) * 6,
          );
        else {
          ctx.translate(p.x + p.nx * 40, p.y + p.ny * 40);
          ctx.rotate(Math.atan2(p.ty, p.tx) + Math.PI / 2);
        }
        dfPtero(ctx, 13, still ? 0.2 : Math.sin(tt * 8), [
          "#c9a4ff",
          "#8a5cf6",
        ]);
        ctx.restore();
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
          [DF.ink, 7.6],
          ["#57c785", 4.8],
          ["#c8ffd6", 1.3, [2, 7], 4],
        ],
        tt,
      );
      // the tail wraps round the bottom
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(77, 77, R + 9, 0.5, 1.9 + Math.sin(tt * 2) * 0.1);
      ctx.strokeStyle = DF.ink;
      ctx.lineWidth = 9;
      ctx.stroke();
      ctx.strokeStyle = "#57c785";
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
      // back plates pop up one by one along the top
      for (let i = 0; i < 7; i++) {
        const an = -Math.PI / 2 + (i - 3) * 0.33,
          k = still ? 1 : pop(t, 0.4 + i * 0.08, 0.4),
          s = 13 - Math.abs(i - 3) * 2.2;
        if (k <= 0) continue;
        ctx.save();
        ctx.translate(77 + Math.cos(an) * (R + 5), 77 + Math.sin(an) * (R + 5));
        ctx.rotate(an + Math.PI / 2 + Math.sin(tt * 2 + i) * 0.04);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.moveTo(-s * 0.62, 2);
        ctx.quadraticCurveTo(-s * 0.5, -s * 0.9, 0, -s * 1.15);
        ctx.quadraticCurveTo(s * 0.5, -s * 0.9, s * 0.62, 2);
        ctx.closePath();
        inked(ctx, grad(ctx, 0, -s, 0, 2, "#ffd35c", "#f2903a"), 1.5, DF.ink);
        ctx.restore();
      }
      {
        const k = still ? 1 : pop(t, 1.2, 0.5);
        ctx.save();
        ctx.translate(77 - 28, 77 + R + 2);
        ctx.rotate(-0.3 + Math.sin(tt * 2.4) * 0.06);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 11, 0, 0, TAU);
        inked(
          ctx,
          grad(ctx, -9, -11, 9, 11, "#fffaf0", "#e9dcc4"),
          1.5,
          DF.ink,
        );
        ctx.fillStyle = "#b8e6a8";
        for (const [x, y, r] of [
          [-3, -3, 2.6],
          [3, 2, 2.2],
          [-1, 5, 1.6],
        ]) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(ctx, CARD.w * 0.5, CARD.h + 20, 200, `rgba(120,220,140,${0.2 * a})`);
      const n = this.steps.length,
        head = still ? n : (tt * 1.8) % (n + 5);
      this.steps.forEach((s, i) => {
        const age = head - i;
        if (age < 0 || age > 5) return;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.r);
        ctx.globalAlpha =
          a * clamp(age * 3) * (1 - smooth((age - 2.4) / 2.6)) * 0.5;
        dfFoot(ctx, 12, "#c8ffd6");
        ctx.restore();
      });
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = a * 0.5;
        leafPath(ctx, p.s * 1.4, p.s * 0.45);
        ctx.fillStyle = p.k < 0.5 ? "#7bd389" : "#ffd35c";
        ctx.fill();
        ctx.restore();
      });
    },
  };
}
