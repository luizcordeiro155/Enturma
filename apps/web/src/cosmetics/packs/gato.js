// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  smooth,
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
  heartPath,
  dropPath,
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

// ---------- Gatinhos ----------
const GT = { ink: "#3a2430", yarn: "#ff7fa8", yarnDark: "#c94a7c" };
// A cat's head around (0,0), 34 wide. c: [light, dark, belly, eye].
function gtHead(ctx, c, look, blink, twitch = 0) {
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * 10.5, -9);
    ctx.rotate(sx * 0.1 + (sx > 0 ? twitch * 0.3 : 0));
    ctx.beginPath();
    ctx.moveTo(-5.5, 3);
    ctx.quadraticCurveTo(sx * 3, -13, sx * 5.5, -12.5);
    ctx.quadraticCurveTo(sx * 7, -4, 6, 4);
    ctx.closePath();
    inked(ctx, c[0], 1.6, GT.ink);
    ctx.beginPath();
    ctx.moveTo(-2.6, 1.5);
    ctx.quadraticCurveTo(sx * 2.6, -8.5, sx * 4, -8.2);
    ctx.quadraticCurveTo(sx * 4.6, -3, 3, 2);
    ctx.closePath();
    ctx.fillStyle = "#ff9db5";
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 14, 0, 0, TAU);
  inked(ctx, grad(ctx, 0, -14, 0, 14, c[0], c[1]), 1.6, GT.ink);
  if (c[4]) {
    ctx.strokeStyle = c[4];
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (const x of [-4.5, 0, 4.5]) {
      ctx.beginPath();
      ctx.moveTo(x, -13);
      ctx.lineTo(x * 0.8, -8.5 + Math.abs(x) * 0.3);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.ellipse(0, 5.2, 8.2, 5.6, 0, 0, TAU);
  ctx.fillStyle = c[2];
  ctx.fill();
  ctx.fillStyle = "rgba(255,143,181,.45)";
  ctx.beginPath();
  ctx.ellipse(-11.5, 4, 3, 2, 0, 0, TAU);
  ctx.ellipse(11.5, 4, 3, 2, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(0, -1.5);
  eyes(ctx, 15, 3.5, look, blink, "#241620", c[3]);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-2, 3.2);
  ctx.lineTo(2, 3.2);
  ctx.lineTo(0, 5.4);
  ctx.closePath();
  ctx.fillStyle = "#ff7d9c";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 5.4);
  ctx.quadraticCurveTo(-1, 8.6, -4, 7.4);
  ctx.moveTo(0, 5.4);
  ctx.quadraticCurveTo(1, 8.6, 4, 7.4);
  ctx.strokeStyle = GT.ink;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.85)";
  ctx.lineWidth = 0.8;
  for (const sx of [-1, 1])
    for (const d of [-1, 1.4]) {
      ctx.beginPath();
      ctx.moveTo(sx * 8, 5 + d * 0.5);
      ctx.lineTo(sx * 20, 4 + d * 2.6);
      ctx.stroke();
    }
}
// A cat sitting on (0,0), about 44 wide and 46 tall.
function gtCat(ctx, t, c, o = {}) {
  const sw = Math.sin(t * 2.2 + (o.ph || 0));
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(11, -5);
  ctx.bezierCurveTo(31, -3, 30 + sw * 3, -24, 21 + sw * 6, -33);
  ctx.strokeStyle = GT.ink;
  ctx.lineWidth = 8.6;
  ctx.stroke();
  ctx.strokeStyle = c[1];
  ctx.lineWidth = 5.6;
  ctx.stroke();
  blobPath(ctx, [
    [-13, 0],
    [-15, -13],
    [-9, -24],
    [9, -24],
    [15, -13],
    [13, 0],
  ]);
  inked(ctx, grad(ctx, 0, -25, 0, 0, c[0], c[1]), 1.6, GT.ink);
  ctx.beginPath();
  ctx.ellipse(0, -8.5, 7, 8.5, 0, 0, TAU);
  ctx.fillStyle = c[2];
  ctx.fill();
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * 6, -2, 4.6, 3.3, 0, 0, TAU);
    inked(ctx, c[2], 1.3, GT.ink);
  }
  ctx.save();
  ctx.translate(0, -30);
  ctx.rotate((o.look || 0) * 0.09 + (o.tilt || 0));
  gtHead(ctx, c, o.look || 0, o.blink, o.twitch);
  ctx.restore();
}
// A cat asleep on a cushion centred on (0,0).
function gtSleep(ctx, t, c) {
  const br = 1 + Math.sin(t * 1.7) * 0.035;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(0, 5, 31, 9, 0, 0, TAU);
  inked(ctx, grad(ctx, 0, -3, 0, 14, "#ffa9c6", "#d9578a"), 1.5, GT.ink);
  ctx.strokeStyle = "rgba(255,255,255,.6)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 4, 24, 5, 0, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.save();
  ctx.translate(0, 3);
  ctx.scale(1, br);
  ctx.translate(0, -3);
  ctx.beginPath();
  ctx.ellipse(3, -8, 21, 12.5, 0, 0, TAU);
  inked(ctx, grad(ctx, 0, -20, 0, 4, c[0], c[1]), 1.6, GT.ink);
  ctx.beginPath();
  ctx.moveTo(21, -6);
  ctx.bezierCurveTo(25, 7, 3, 6, -9, 1.5);
  ctx.strokeStyle = GT.ink;
  ctx.lineWidth = 7.6;
  ctx.stroke();
  ctx.strokeStyle = c[1];
  ctx.lineWidth = 4.8;
  ctx.stroke();
  ctx.save();
  ctx.translate(-13, -6);
  ctx.rotate(-0.12);
  ctx.scale(0.78, 0.78);
  gtHead(ctx, c, 0, true);
  ctx.restore();
  ctx.restore();
}
function gtYarn(ctx, r, spin) {
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  inked(
    ctx,
    rgrad(ctx, -r * 0.3, -r * 0.35, r * 1.2, "#ffc0d6", GT.yarn, GT.yarnDark),
    1.6,
    GT.ink,
  );
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r - 0.8, 0, TAU);
  ctx.clip();
  ctx.rotate(spin);
  ctx.strokeStyle = "rgba(160,40,90,.55)";
  ctx.lineWidth = 1.1;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(0, i * r * 0.3, r * 1.1, r * 0.5, 0.5, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(i * r * 0.3, 0, r * 0.5, r * 1.1, 0.5, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.4, r * 0.22, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.fill();
}
function gtFish(ctx, s) {
  ctx.lineCap = "round";
  ctx.strokeStyle = "#eaf6ff";
  ctx.lineWidth = Math.max(1, s * 0.16);
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.lineTo(s * 0.8, 0);
  for (const x of [-0.5, -0.1, 0.3]) {
    ctx.moveTo(x * s, -s * 0.4);
    ctx.lineTo(x * s, s * 0.4);
  }
  ctx.moveTo(s * 0.8, 0);
  ctx.lineTo(s * 1.3, -s * 0.45);
  ctx.moveTo(s * 0.8, 0);
  ctx.lineTo(s * 1.3, s * 0.45);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-s, 0, s * 0.42, 0, TAU);
  ctx.fillStyle = "#eaf6ff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-s * 1.08, -s * 0.08, s * 0.12, 0, TAU);
  ctx.fillStyle = GT.ink;
  ctx.fill();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Gatinhos",
    reach: { top: 94, side: 66, bottom: 64 },
    mat: ["#2a1a2e", "#140f1c"],
    theme: cardTheme("#f08a4b", "#6a3d9a"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      // the yarn runs from the ball in the bottom-right corner, along the bottom and up the left side
      this.yarn = Strand(
        this.loop,
        m.bottom - m.arc * 0.4,
        m.arc * 1.4 + m.top + m.side * 0.9,
        1,
        4,
        { off: 8, wave: 5.5, gap: 0.062, size: 8, taper: 0.9 },
      );
      // a second thread, teal, comes down the right side from the toy mouse
      this.yarn2 = Strand(
        this.loop,
        m.tr + m.arc * 0.6,
        m.arc * 0.4 + m.side * 0.78,
        1,
        9,
        { off: 8, wave: 5, gap: 0.09, size: 8, taper: 0.9 },
      );
      this.t0 = 0.5;
      this.dur = 1.9;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.stars = twinkles(14, 21, CARD.w, CARD.h, 26, 74);
      this.fx = Drift(9, 5, { v: [9, 20], s: [5, 9], sway: 12, spin: 1.2 });
      this.z = Particles();
      this.rand = rng(8);
      const q = rng(3);
      this.steps = [];
      for (let i = 0; i < 9; i++) {
        const u = i / 8;
        this.steps.push({
          x: CARD.w * (0.16 + 0.68 * u) + (i % 2 ? 11 : -11),
          y: CARD.h - 40 - (CARD.h - 190) * u + Math.sin(u * 5) * 16,
          r: -0.6 + (i % 2 ? 0.25 : -0.25) + q() * 0.2,
        });
      }
    },
    reset() {
      this.z.clear();
      this.rand = rng(8);
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand;
      if (t > 3 && R() < dt * 0.7)
        this.z.add({
          x: 24 + R() * 6,
          y: CARD.h - 22,
          vx: 6 + R() * 5,
          vy: -16,
          life: 2.4,
          size: 6 + R() * 3,
          sway: 8,
          swayF: 2,
          phase: R() * TAU,
        });
      this.z.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.3, 1.2),
        m = this.loop.m;
      for (const s of this.stars) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = a * (0.3 + 0.7 * Math.abs(Math.sin(tt * s.f + s.ph)));
        ctx.rotate(s.ph);
        if (s.s > 2.6) {
          heartPath(ctx, s.s * 1.5);
          ctx.fillStyle = "#ff9dbd";
        } else {
          sparkPath(ctx, s.s * 1.9);
          ctx.fillStyle = "#ffe9a8";
        }
        ctx.fill();
        ctx.restore();
      }
      // the yarn and what it strings together
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        strandLine(c, this.yarn, g, [
          [GT.ink, 7.4],
          [GT.yarn, 4.8],
          ["rgba(255,225,236,.85)", 1.3, [4, 8]],
        ]);
        strandLine(c, this.yarn2, g, [
          [GT.ink, 6.4],
          ["#4fd1c5", 4],
          ["rgba(220,255,250,.85)", 1.2, [4, 8]],
        ]);
        strandBits(c, this.yarn2, T, this.when, (b, k) => {
          c.rotate(b.a + Math.PI / 2 + (b.i % 2 ? 0.5 : -0.5));
          c.translate(0, -13 * b.out);
          c.scale(k, k);
          if (b.kind < 0.6) pawPrint(c, 8, "#d6fff8");
          else {
            heartPath(c, 6);
            c.fillStyle = "#4fd1c5";
            c.fill();
          }
        });
        strandBits(c, this.yarn, T, this.when, (b, k) => {
          c.rotate(b.a + Math.PI / 2 + (b.i % 2 ? 0.5 : -0.5));
          c.translate(0, -14 * b.out);
          c.scale(k, k);
          if (b.kind < 0.62) pawPrint(c, 8.6, b.i % 2 ? "#ffd1e0" : "#fff3d6");
          else if (b.kind < 0.82) {
            c.rotate(0.6);
            gtFish(c, 8.5);
          } else {
            heartPath(c, 7);
            c.fillStyle = "#ff7fa8";
            c.fill();
          }
        });
      });
      // a white cat peeks from behind the right edge
      {
        const c = still ? 3 : (t - 2.4) % 8.5,
          k = still
            ? 1
            : t < 2.4
              ? 0
              : c < 0.6
                ? easeOutBack(c / 0.6)
                : c < 5.6
                  ? 1
                  : c < 6.2
                    ? 1 - smooth((c - 5.6) / 0.6)
                    : 0;
        if (k > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(CARD.w + 1.5, CARD.h * 0.25, 110, 160);
          ctx.clip();
          ctx.translate(CARD.w - 28 + k * 44, CARD.h * 0.45);
          ctx.rotate(0.22);
          ctx.scale(1.5, 1.5);
          gtHead(
            ctx,
            ["#ffffff", "#e9e2ef", "#fff", "#8fd6ff"],
            -0.6,
            !still && blinking(tt, 3.1),
            0,
          );
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = k;
          for (const dy of [-12, 16]) {
            ctx.beginPath();
            ctx.ellipse(CARD.w + 4, CARD.h * 0.45 + dy + 26, 7, 5.5, 0, 0, TAU);
            inked(ctx, "#fff", 1.3, GT.ink);
          }
          ctx.restore();
        }
      }
      // the ball rolls in from the right and stops in the corner
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.15) / 0.9)),
          x = CARD.w - 24 + (1 - k) * 150,
          y = CARD.h + 16;
        ctx.save();
        ctx.translate(
          x,
          y +
            (still
              ? 0
              : Math.abs(Math.sin(clamp(t / 1.05) * Math.PI * 3)) *
                -9 *
                (1 - k)),
        );
        gtYarn(ctx, 25, (1 - k) * -9 + Math.sin(tt * 0.8) * 0.06);
        ctx.restore();
      }
      // a grey cat sleeps on its cushion in the other corner
      {
        const k = still ? 1 : pop(t, 1.5, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(48, CARD.h + 16);
          ctx.scale(k * 1.45, k * 1.45);
          gtSleep(ctx, tt, [
            "#b9b4c9",
            "#8d86a3",
            "#e9e6f2",
            "#ffd35c",
            "#77708f",
          ]);
          ctx.restore();
        }
        ctx.font = "700 11px Arial, sans-serif";
        ctx.textAlign = "center";
        for (const p of this.z.list) {
          const q = p.age / p.life;
          ctx.globalAlpha = Math.sin(q * Math.PI) * 0.9;
          ctx.fillStyle = "#e9e6f2";
          ctx.font = `700 ${Math.round(p.size + q * 5)}px Arial, sans-serif`;
          ctx.fillText("z", p.x, p.y);
        }
        ctx.globalAlpha = 1;
      }
      // a toy mouse swings from the top-right corner
      {
        const k = still ? 1 : pop(t, 1.4, 0.7),
          sw = Math.sin(tt * 2.1) * 0.25 * (still ? 0.3 : 1);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w + 20, -14);
          ctx.rotate(sw);
          ctx.strokeStyle = "#4fd1c5";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 34 * k);
          ctx.stroke();
          ctx.translate(0, 34 * k + 9);
          ctx.scale(k, k);
          ctx.beginPath();
          ctx.moveTo(0, 9);
          ctx.quadraticCurveTo(12, 16, 6, 26);
          ctx.strokeStyle = GT.ink;
          ctx.lineWidth = 3.2;
          ctx.stroke();
          ctx.strokeStyle = "#ffb3c9";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          for (const sx of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(sx * 6.5, -7, 5, 0, TAU);
            inked(ctx, "#cfc8dc", 1.4, GT.ink);
            ctx.beginPath();
            ctx.arc(sx * 6.5, -7, 2.4, 0, TAU);
            ctx.fillStyle = "#ffb3c9";
            ctx.fill();
          }
          dropPath(ctx, 9);
          inked(
            ctx,
            grad(ctx, 0, -12, 0, 9, "#e9e6f2", "#a9a2bd"),
            1.5,
            GT.ink,
          );
          ctx.fillStyle = GT.ink;
          ctx.beginPath();
          ctx.arc(-3, -2, 1.2, 0, TAU);
          ctx.arc(3, -2, 1.2, 0, TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, -11, 1.8, 0, TAU);
          ctx.fillStyle = "#ff7d9c";
          ctx.fill();
          ctx.restore();
        }
      }
      // two cats on the top edge: the tabby drops in, the black kitten pops up beside it
      {
        const k = still ? 1 : bounceOut((t - 1.1) / 0.85),
          on = still || t > 1.1;
        if (on) {
          const c = tt % 6.4,
            tilt =
              !still && c > 5.2 && c < 6
                ? Math.sin(((c - 5.2) / 0.8) * Math.PI) * 0.16
                : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.7, 2 - (1 - k) * 140);
          ctx.scale(1.75, 1.75);
          gtCat(
            ctx,
            tt,
            ["#ffb25e", "#f0812e", "#fff1dc", "#b8f26a", "#c9611c"],
            {
              look: Math.sin(tt * 0.7) * 0.8,
              blink: !still && blinking(tt, 3.7),
              tilt,
              twitch: !still && tt % 4.3 < 0.2 ? 1 : 0,
            },
          );
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.9, 0.5);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w * 0.25, 2);
          ctx.scale(1.3 * k, 1.3 * k);
          gtCat(ctx, tt + 1.4, ["#4a4058", "#2b2436", "#6a5f7c", "#ffd35c"], {
            look: Math.sin(tt * 0.9 + 2) * 0.9,
            blink: !still && blinking(tt, 2.9, 1),
            ph: 2,
          });
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r,
        c = ["#ffb25e", "#f0812e"];
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        77,
        77,
        R + 3.5,
        [
          [GT.ink, 7],
          ["#ffb25e", 4],
          ["#fff1dc", 1.2, [2, 6], 5],
        ],
        tt,
      );
      // the tail curls round the bottom
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(77, 77, R + 9, 0.35, 1.5 + Math.sin(tt * 1.8) * 0.12);
      ctx.strokeStyle = GT.ink;
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.strokeStyle = c[1];
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
      const k = still ? 1 : pop(t, 0.5, 0.6);
      for (const sx of [-1, 1]) {
        const tw = !still && sx > 0 && tt % 4.1 < 0.22 ? 0.25 : 0;
        ctx.save();
        ctx.translate(77 + sx * 25, 77 - R + 5);
        ctx.rotate(sx * 0.42 + tw);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.moveTo(-12, 6);
        ctx.quadraticCurveTo(-3, -22, 2 * sx, -24);
        ctx.quadraticCurveTo(9, -8, 12, 6);
        ctx.closePath();
        inked(ctx, grad(ctx, 0, -24, 0, 6, c[0], c[1]), 1.8, GT.ink);
        ctx.beginPath();
        ctx.moveTo(-6, 3);
        ctx.quadraticCurveTo(-1.5, -14, 1.5 * sx, -15.5);
        ctx.quadraticCurveTo(5, -5, 6.5, 3);
        ctx.closePath();
        ctx.fillStyle = "#ff9db5";
        ctx.fill();
        ctx.restore();
      }
      // whiskers and a little bell
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = "rgba(255,255,255,.9)";
      ctx.lineWidth = 1.1;
      ctx.lineCap = "round";
      for (const sx of [-1, 1])
        for (const d of [-0.16, 0, 0.16]) {
          ctx.beginPath();
          ctx.moveTo(77 + sx * (R + 2), 86 + d * 20);
          ctx.lineTo(77 + sx * (R + 17), 86 + d * 62);
          ctx.stroke();
        }
      const sw = Math.sin(tt * 3) * 0.18;
      ctx.translate(77, 77 + R + 4);
      ctx.rotate(sw);
      ctx.beginPath();
      ctx.arc(0, 5, 6, 0, TAU);
      inked(ctx, rgrad(ctx, -2, 3, 8, "#fff3a8", "#f2b63c"), 1.4, GT.ink);
      ctx.beginPath();
      ctx.moveTo(-4, 6);
      ctx.lineTo(4, 6);
      ctx.moveTo(0, 6);
      ctx.lineTo(0, 10);
      ctx.strokeStyle = GT.ink;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(ctx, CARD.w * 0.5, CARD.h + 20, 190, `rgba(255,150,90,${0.2 * a})`);
      // paw prints walk up the card, one after the other, and fade behind
      const n = this.steps.length,
        head = still ? n : (tt * 2.2) % (n + 5);
      this.steps.forEach((s, i) => {
        const age = head - i;
        if (age < 0 || age > 5) return;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.r + 0.9);
        ctx.globalAlpha =
          a * clamp(age * 3) * (1 - smooth((age - 2.4) / 2.6)) * 0.55;
        pawPrint(ctx, 9, "#fff1dc");
        ctx.restore();
      });
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(rot) * 0.5);
        ctx.globalAlpha = a * 0.5;
        if (p.k < 0.5) gtFish(ctx, p.s * 0.6);
        else {
          heartPath(ctx, p.s * 0.6);
          ctx.fillStyle = "#ff9dbd";
          ctx.fill();
        }
        ctx.restore();
      });
    },
  };
}
