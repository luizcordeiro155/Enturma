// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  smooth,
  easeOutCubic,
  easeOutBack,
  rng,
  glow,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  rgrad,
  heartPath,
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
  pawPrint,
  cardTheme,
} from "../kit";

// ---------- Cachorrinhos ----------
const DG = { ink: "#3a2a22", red: "#e5484d", redDark: "#a82a33" };
// A dog's head around (0,0), 36 wide. c: [coat, shade, muzzle, ear]. `pant` opens the mouth and shows the tongue.
function dgHead(ctx, t, c, look, blink, pant = 0, flop = 0) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * 13, -8);
    ctx.rotate(sx * (0.25 + flop * 0.22));
    blobPath(ctx, [
      [-5, -3],
      [5, -4],
      [sx * 9, 8],
      [sx * 5, 19],
      [sx * -3, 14],
    ]);
    inked(ctx, grad(ctx, 0, -4, 0, 19, c[3], c[1]), 1.6, DG.ink);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 15, 0, 0, TAU);
  inked(ctx, grad(ctx, 0, -15, 0, 15, c[0], c[1]), 1.6, DG.ink);
  if (c[4]) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, 16.2, 14.2, 0, 0, TAU);
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(9, -7, 9, 10, 0.3, 0, TAU);
    ctx.fillStyle = c[4];
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(0, 6.5, 9.5, 7, 0, 0, TAU);
  ctx.fillStyle = c[2];
  ctx.fill();
  if (pant > 0) {
    ctx.beginPath();
    ctx.ellipse(0, 9.5, 5, 3 + pant * 2.4, 0, 0, TAU);
    ctx.fillStyle = "#5a1e26";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-3.2, 10);
    ctx.quadraticCurveTo(
      -3.6,
      17 + pant * 3 + Math.sin(t * 9) * 0.8,
      0,
      17.5 + pant * 3 + Math.sin(t * 9) * 0.8,
    );
    ctx.quadraticCurveTo(3.6, 17 + pant * 3, 3.2, 10);
    ctx.closePath();
    inked(ctx, "#ff7d9c", 1.1, DG.ink);
  } else {
    ctx.beginPath();
    ctx.moveTo(0, 6.4);
    ctx.quadraticCurveTo(-1.5, 10.4, -5, 9);
    ctx.moveTo(0, 6.4);
    ctx.quadraticCurveTo(1.5, 10.4, 5, 9);
    ctx.strokeStyle = DG.ink;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, 3.6, 3.6, 2.7, 0, 0, TAU);
  ctx.fillStyle = "#2a1c1c";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-1, 2.8, 1.2, 0.7, 0, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,.7)";
  ctx.fill();
  ctx.save();
  ctx.translate(0, -3);
  eyes(ctx, 14, 3, look, blink, "#2a1c1c", null);
  ctx.restore();
  ctx.strokeStyle = DG.ink;
  ctx.lineWidth = 1.3;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 4.5, -8.6);
    ctx.quadraticCurveTo(sx * 8, -10.6, sx * 10.5, -8.2);
    ctx.stroke();
  }
}
// A dog sitting on (0,0), about 46 wide and 50 tall. `wag` is the tail, -1..1.
function dgSit(ctx, t, c, o = {}) {
  const wag =
    Math.sin(t * (o.fast ? 15 : 9) + (o.ph || 0)) * (o.fast ? 0.6 : 0.35);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.save();
  ctx.translate(12, -8);
  ctx.rotate(-0.9 + wag);
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.quadraticCurveTo(10, 2, 18, -8);
  ctx.quadraticCurveTo(8, -6, 0, -3);
  ctx.closePath();
  inked(ctx, c[0], 1.5, DG.ink);
  ctx.restore();
  blobPath(ctx, [
    [-14, 0],
    [-16, -13],
    [-9, -25],
    [9, -25],
    [16, -13],
    [14, 0],
  ]);
  inked(ctx, grad(ctx, 0, -25, 0, 0, c[0], c[1]), 1.6, DG.ink);
  ctx.beginPath();
  ctx.ellipse(0, -9, 8, 10, 0, 0, TAU);
  ctx.fillStyle = c[2];
  ctx.fill();
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(sx * 6.5 - 4, -13, 8, 14, 4);
    inked(ctx, c[0], 1.4, DG.ink);
    ctx.beginPath();
    ctx.ellipse(sx * 6.5, -0.5, 5, 3.2, 0, 0, TAU);
    inked(ctx, c[2], 1.3, DG.ink);
  }
  if (o.collar) {
    ctx.beginPath();
    ctx.moveTo(-10.5, -23);
    ctx.quadraticCurveTo(0, -18, 10.5, -23);
    ctx.strokeStyle = DG.ink;
    ctx.lineWidth = 5.4;
    ctx.stroke();
    ctx.strokeStyle = o.collar;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -18, 2.8, 0, TAU);
    inked(ctx, "#ffd35c", 1, DG.ink);
  }
  ctx.save();
  ctx.translate(0, -32);
  ctx.rotate((o.tilt || 0) + (o.look || 0) * 0.06);
  dgHead(ctx, t, c, o.look || 0, o.blink, o.pant || 0, o.flop || 0);
  ctx.restore();
}
function dgBone(ctx, s, fill = "#fff8ea") {
  ctx.beginPath();
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      ctx.moveTo(sx * s, sy * s * 0.32);
      ctx.arc(sx * s, sy * s * 0.32, s * 0.34, 0, TAU);
    }
  ctx.rect(-s, -s * 0.24, s * 2, s * 0.48);
  ctx.fillStyle = fill;
  ctx.fill();
}
function dgBall(ctx, r, spin) {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  inked(
    ctx,
    rgrad(ctx, -r * 0.3, -r * 0.35, r * 1.25, "#f2ff8a", "#c8e63c", "#8fb021"),
    1.5,
    DG.ink,
  );
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r - 0.7, 0, TAU);
  ctx.clip();
  ctx.rotate(spin);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1.2, r * 0.13);
  ctx.beginPath();
  ctx.arc(-r * 1.1, 0, r * 0.9, -1, 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 1.1, 0, r * 0.9, Math.PI - 1, Math.PI + 1);
  ctx.stroke();
  ctx.restore();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Cachorrinhos",
    reach: { top: 86, side: 66, bottom: 66 },
    mat: ["#16243a", "#0d1420"],
    theme: cardTheme("#3f8fd6", "#e09a2b"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      // a red leash runs from the bowl in the bottom-left corner, up the left side and across the top
      this.leash = Strand(
        this.loop,
        m.bl + m.arc * 0.5,
        m.arc * 0.5 + m.side + m.arc + m.top * 0.24,
        1,
        6,
        { off: 8, wave: 5, gap: 0.075, size: 9, taper: 0.9 },
      );
      this.leash2 = Strand(
        this.loop,
        m.br + m.arc * 0.4,
        m.arc * 0.6 + m.top * 0.6,
        1,
        12,
        { off: 9, wave: 4, gap: 0.12, size: 9, taper: 0.9, from: 0.2 },
      );
      this.t0 = 0.45;
      this.dur = 1.9;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.stars = twinkles(12, 31, CARD.w, CARD.h, 26, 74);
      this.fx = Drift(10, 7, { v: [10, 22], s: [6, 10], sway: 10, spin: 1.6 });
      const q = rng(4);
      this.steps = [];
      for (let i = 0; i < 9; i++) {
        const u = i / 8;
        this.steps.push({
          x: CARD.w * (0.84 - 0.68 * u) + (i % 2 ? 12 : -12),
          y: CARD.h - 36 - (CARD.h - 190) * u + Math.sin(u * 4) * 14,
          r: 0.6 + (i % 2 ? 0.25 : -0.25) + q() * 0.2,
        });
      }
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.3, 1.2);
      for (const s of this.stars) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = a * (0.3 + 0.7 * Math.abs(Math.sin(tt * s.f + s.ph)));
        ctx.rotate(s.ph);
        if (s.s > 2.7) dgBone(ctx, s.s * 1.6, "#ffe9c4");
        else {
          sparkPath(ctx, s.s * 1.9);
          ctx.fillStyle = "#ffe27a";
          ctx.fill();
        }
        ctx.restore();
      }
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        for (const v of [this.leash, this.leash2]) {
          strandLine(c, v, g, [
            [DG.ink, 7.4],
            [DG.red, 4.8],
            ["rgba(255,210,210,.8)", 1.2, [1.5, 6]],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2 + (b.i % 2 ? 0.45 : -0.45));
            c.translate(0, -15 * b.out);
            c.scale(k, k);
            if (b.kind < 0.5) pawPrint(c, 8.6, b.i % 2 ? "#ffe9c4" : "#d6ecff");
            else if (b.kind < 0.85) {
              c.rotate(0.5);
              dgBone(c, 8);
              c.strokeStyle = DG.ink;
              c.lineWidth = 0.9;
            } else {
              heartPath(c, 6.5);
              c.fillStyle = "#ff8f8f";
              c.fill();
            }
          });
        }
      });
      // a spotted pup peeks from behind the right edge, tongue out
      {
        const cy = still ? 3 : (t - 2.6) % 9,
          k = still
            ? 1
            : t < 2.6
              ? 0
              : cy < 0.6
                ? easeOutBack(cy / 0.6)
                : cy < 6
                  ? 1
                  : cy < 6.6
                    ? 1 - smooth((cy - 6) / 0.6)
                    : 0;
        if (k > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(CARD.w + 1.5, CARD.h * 0.26, 110, 170);
          ctx.clip();
          ctx.translate(CARD.w - 30 + k * 46, CARD.h * 0.47);
          ctx.rotate(0.2 + Math.sin(tt * 2) * 0.04);
          ctx.scale(1.5, 1.5);
          dgHead(
            ctx,
            tt,
            ["#ffffff", "#e6ddd4", "#fff", "#a86a3d", "#b9773f"],
            -0.7,
            !still && blinking(tt, 3.3),
            0.8,
            Math.sin(tt * 2),
          );
          ctx.restore();
        }
      }
      // the bowl in one corner, the ball that keeps bouncing in the other
      {
        const k = still ? 1 : pop(t, 0.6, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(46, CARD.h + 22);
          ctx.scale(k, k);
          ctx.beginPath();
          ctx.ellipse(0, -9, 21, 7, 0, 0, TAU);
          inked(ctx, "#7a4a2a", 1.5, DG.ink);
          for (const [x, y] of [
            [-9, -11],
            [-2, -13],
            [6, -11.5],
            [11, -10],
            [-5, -9],
          ]) {
            ctx.beginPath();
            ctx.arc(x, y, 3.4, 0, TAU);
            inked(ctx, "#c98a4b", 1, DG.ink);
          }
          ctx.beginPath();
          ctx.moveTo(-23, -9);
          ctx.quadraticCurveTo(-28, 10, -22, 11);
          ctx.lineTo(22, 11);
          ctx.quadraticCurveTo(28, 10, 23, -9);
          ctx.quadraticCurveTo(0, 1, -23, -9);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, 0, -9, 0, 11, "#5fb0f2", "#2f6fb5"),
            1.6,
            DG.ink,
          );
          ctx.save();
          ctx.translate(0, 3);
          dgBone(ctx, 7, "#fff");
          ctx.restore();
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.2) / 1)),
          c = tt % 5,
          hop = still
            ? 0
            : t < 1.6
              ? Math.abs(Math.sin(clamp(t / 1.6) * Math.PI * 4)) *
                34 *
                (1 - clamp(t / 1.6))
              : c < 0.9
                ? Math.abs(Math.sin((c / 0.9) * Math.PI * 2)) *
                  16 *
                  (1 - c / 0.9)
                : 0;
        ctx.save();
        ctx.translate(CARD.w - 26 + (1 - k) * 160, CARD.h + 14 - hop);
        const sq = 1 - Math.min(0.12, hop * 0.004);
        ctx.scale(1 / sq, sq);
        dgBall(ctx, 20, (1 - k) * -10 + tt * 0.2);
        ctx.restore();
      }
      // two dogs on the top edge: the shiba drops in wagging, the beagle pup pops up
      {
        const k = still ? 1 : bounceOut((t - 1.1) / 0.85);
        if (still || t > 1.1) {
          const c = tt % 7,
            tilt =
              !still && c > 5.4 && c < 6.4
                ? Math.sin(((c - 5.4) / 1) * Math.PI) * 0.22
                : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.3, 2 - (1 - k) * 140);
          ctx.scale(1.7, 1.7);
          dgSit(ctx, tt, ["#f5b062", "#dd8a35", "#fff5e6", "#d98232"], {
            look: Math.sin(tt * 0.8) * 0.8,
            blink: !still && blinking(tt, 3.4),
            tilt,
            pant: 0.7 + Math.sin(tt * 8) * 0.3,
            fast: true,
            collar: DG.red,
          });
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.9, 0.5);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w * 0.74, 2);
          ctx.scale(1.3 * k, 1.3 * k);
          dgSit(
            ctx,
            tt + 2,
            ["#fffaf2", "#e8dccb", "#fff", "#8a5a34", "#a86a3d"],
            {
              look: Math.sin(tt * 1.1 + 2) * 0.9,
              blink: !still && blinking(tt, 2.8, 1.2),
              ph: 2,
              flop: Math.sin(tt * 3),
              collar: "#3f8fd6",
            },
          );
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
          [DG.ink, 7.4],
          [DG.red, 4.6],
          ["#ffd35c", 1.6, [1.5, 9], 0],
        ],
        tt,
      );
      ctx.restore();
      // floppy ears hang from the top, and bounce a little
      const k = still ? 1 : pop(t, 0.5, 0.6),
        fl = still ? 0 : Math.sin(tt * 2.6) * 0.07;
      for (const sx of [-1, 1]) {
        ctx.save();
        ctx.translate(77 + sx * (R - 6), 77 - R + 8);
        ctx.rotate(sx * (0.5 + fl));
        ctx.scale(k, k);
        blobPath(ctx, [
          [-8, -8],
          [8, -9],
          [sx * 15, 6],
          [sx * 9, 30],
          [sx * -5, 22],
        ]);
        inked(ctx, grad(ctx, 0, -8, 0, 30, "#e09a4a", "#a8632a"), 1.8, DG.ink);
        ctx.restore();
      }
      // the tag on the collar, a wagging tail on the side
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(77, 77 + R + 5);
      ctx.rotate(Math.sin(tt * 3) * 0.2);
      ctx.beginPath();
      ctx.arc(0, 6, 8, 0, TAU);
      inked(ctx, rgrad(ctx, -2, 3, 10, "#fff3a8", "#f2b63c"), 1.5, DG.ink);
      ctx.save();
      ctx.translate(0, 6);
      dgBone(ctx, 4, "#a8632a");
      ctx.restore();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(77 + R + 2, 77 + 20);
      ctx.rotate(-0.5 + Math.sin(tt * 12) * 0.35 * (still ? 0 : 1));
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.quadraticCurveTo(14, 4, 24, -9);
      ctx.quadraticCurveTo(10, -7, 0, -4);
      ctx.closePath();
      inked(ctx, "#e09a4a", 1.6, DG.ink);
      ctx.restore();
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(ctx, CARD.w * 0.5, CARD.h + 20, 190, `rgba(255,190,90,${0.18 * a})`);
      const n = this.steps.length,
        head = still ? n : (tt * 2.4) % (n + 5);
      this.steps.forEach((s, i) => {
        const age = head - i;
        if (age < 0 || age > 5) return;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.r - 0.9);
        ctx.globalAlpha =
          a * clamp(age * 3) * (1 - smooth((age - 2.4) / 2.6)) * 0.5;
        pawPrint(ctx, 10, "#ffe9c4");
        ctx.restore();
      });
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = a * 0.5;
        if (p.k < 0.6) dgBone(ctx, p.s * 0.7, "#fff3dc");
        else dgBall(ctx, p.s * 0.6, rot);
        ctx.restore();
      });
    },
  };
}
