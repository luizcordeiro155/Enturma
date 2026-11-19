// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeInOut,
  glow,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  sparkPath,
  blinking,
  ringBase,
  Strand,
  strandLine,
  strandBits,
  Drift,
  settle,
  twinkles,
  frameLoop,
  bunny,
  clover,
  cardTheme,
} from "../kit";

// ---------- Coelhinho ----------
const CB = { ink: "#2f3550", blue: "#4a9be0", green: "#57c785" };
function cbCarrot(ctx, s) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#2f7a3a";
  ctx.lineWidth = s * 0.16;
  for (const a of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.9);
    ctx.quadraticCurveTo(
      Math.sin(a) * s * 0.5,
      -s * 1.3,
      Math.sin(a) * s * 0.75,
      -s * 1.7,
    );
    ctx.stroke();
  }
  ctx.strokeStyle = "#6fcf6a";
  ctx.lineWidth = s * 0.07;
  for (const a of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.9);
    ctx.quadraticCurveTo(
      Math.sin(a) * s * 0.5,
      -s * 1.3,
      Math.sin(a) * s * 0.75,
      -s * 1.7,
    );
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-s * 0.42, -s * 0.9);
  ctx.quadraticCurveTo(0, -s * 1.12, s * 0.42, -s * 0.9);
  ctx.quadraticCurveTo(s * 0.3, s * 0.3, 0, s);
  ctx.quadraticCurveTo(-s * 0.3, s * 0.3, -s * 0.42, -s * 0.9);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, -s * 0.4, 0, s * 0.4, 0, "#ffb14a", "#f2681f"),
    Math.max(1, s * 0.09),
    CB.ink,
  );
  ctx.strokeStyle = "rgba(160,60,10,.6)";
  ctx.lineWidth = Math.max(0.7, s * 0.06);
  for (const y of [-0.5, -0.1, 0.3]) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, y * s);
    ctx.lineTo(s * 0.06, y * s + s * 0.05);
    ctx.stroke();
  }
}

export default function create(CARD, AVATAR) {
  return {
    name: "Coelhinho",
    reach: { top: 110, side: 62, bottom: 66 },
    mat: ["#14263a", "#0c1622"],
    theme: cardTheme("#4a9be0", "#3fae72"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.vine = Strand(
        this.loop,
        m.bl + m.arc * 0.5,
        m.arc * 0.5 + m.side + m.arc + m.top * 0.2,
        1,
        5,
        { off: 7, wave: 5, gap: 0.062, size: 16 },
      );
      this.vine2 = Strand(
        this.loop,
        m.bl + m.arc * 0.5,
        m.arc * 0.5 + m.top * 0.72,
        -1,
        11,
        { off: 7, wave: 4.5, gap: 0.09, size: 16 },
      );
      this.t0 = 0.4;
      this.dur = 2;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.stars = twinkles(12, 51, CARD.w, CARD.h, 26, 72);
      this.fx = Drift(11, 9, { v: [10, 22], s: [6, 10], sway: 12, spin: 1.2 });
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.3, 1.2),
        L = this.loop.L,
        m = this.loop.m;
      for (const s of this.stars) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = a * (0.3 + 0.7 * Math.abs(Math.sin(tt * s.f + s.ph)));
        sparkPath(ctx, s.s * 2);
        ctx.fillStyle = s.s > 2.6 ? "#bfe6ff" : "#d7ffd0";
        ctx.fill();
        ctx.restore();
      }
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        for (const v of [this.vine, this.vine2]) {
          strandLine(c, v, g, [
            ["#1f4a2a", 6.4],
            ["#4fae5f", 3.8],
            ["rgba(200,255,190,.75)", 1.1],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2 + Math.sin(tt * 1.4 + b.ph) * 0.07);
            c.scale(k, k);
            if (b.kind < 0.68) clover(c, b.s * 1.15);
            else {
              c.translate(0, -b.s * 0.9);
              c.rotate(0.4 * (b.i % 2 ? 1 : -1));
              cbCarrot(c, b.s * 0.62);
            }
          });
        }
      });
      // a patch of carrots in the corner where the clover starts
      [
        [-22, 0.9, -0.3],
        [-4, 1.25, 0.05],
        [15, 1, 0.3],
      ].forEach(([dx, s, r], i) => {
        const k = still ? 1 : pop(t, 0.5 + i * 0.14, 0.5);
        if (k <= 0) return;
        ctx.save();
        ctx.translate(48 + dx, CARD.h + 26 + (1 - k) * 20);
        ctx.rotate(r + Math.sin(tt * 1.6 + i) * 0.03);
        ctx.scale(k, k);
        cbCarrot(ctx, 15 * s);
        ctx.restore();
      });
      {
        const k = still ? 1 : pop(t, 0.4, 0.5);
        ctx.save();
        ctx.translate(46, CARD.h + 40);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.ellipse(0, 0, 42, 8, 0, 0, TAU);
        inked(ctx, grad(ctx, 0, -8, 0, 8, "#8a5a3a", "#5b371f"), 1.5, CB.ink);
        ctx.restore();
      }
      // a small grey bunny runs a lap round the card and settles in the other corner
      {
        const k = still ? 1 : easeInOut(clamp((t - 0.3) / 2.5)),
          s = m.bl - 30 + k * (L - 60 - m.top * 0.82),
          p = this.loop.at(s),
          hop = still || k >= 1 ? 0 : Math.abs(Math.sin(t * 9)) * 13;
        ctx.save();
        if (k < 1) {
          ctx.translate(p.x + p.nx * (16 + hop), p.y + p.ny * (16 + hop));
          ctx.rotate(Math.atan2(p.ty, p.tx));
          ctx.scale(0.95, 0.95);
        } else {
          const c = tt % 5.5,
            j = !still && c < 0.5 ? Math.sin((c / 0.5) * Math.PI) * 8 : 0;
          ctx.translate(CARD.w - 30, CARD.h + 60 - j);
          ctx.scale(-1.05, 1.05);
        }
        bunny(ctx, tt, {
          fur: "#c9cfe0",
          shade: "#99a2bd",
          inner: "#ffc2d4",
          ink: CB.ink,
          blink: !still && blinking(tt, 3, 0.5),
          look: 0.6,
          twitch: Math.sin(tt * 5) > 0.9 ? 1 : 0,
        });
        ctx.restore();
      }
      // on the top edge: the white bunny with the blue scarf nibbles a carrot, a brown one keeps watch
      {
        const k = still ? 1 : bounceOut((t - 1.2) / 0.85);
        if (still || t > 1.2) {
          const c = tt % 4.6;
          ctx.save();
          ctx.translate(CARD.w * 0.7, 2 - (1 - k) * 150);
          ctx.scale(1.55, 1.55);
          bunny(ctx, tt, {
            ink: CB.ink,
            acc: "scarf",
            accColor: CB.blue,
            hold: "carrot",
            nibble: !still && c < 1.6,
            inner: "#bfe2ff",
            blink: !still && blinking(tt, 3.3),
            look: Math.sin(tt * 0.7) * 0.7,
            twitch: !still && c > 3.8 ? Math.sin((c - 3.8) * 16) : 0,
          });
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 2, 0.5);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w * 0.26, 2);
          ctx.scale(1.15 * k, 1.15 * k);
          bunny(ctx, tt + 1, {
            fur: "#d9a878",
            shade: "#b57f4f",
            inner: "#ffd0b0",
            ink: CB.ink,
            blink: !still && blinking(tt, 2.7, 1),
            look: Math.sin(tt * 1.1 + 1) * 0.9,
            twitch: Math.sin(tt * 2.2) * 0.5,
          });
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
          [CB.ink, 7.4],
          [CB.blue, 4.6],
          ["#eaf6ff", 1.4, [5, 7], 6],
        ],
        tt,
      );
      ctx.restore();
      const k = still ? 1 : pop(t, 0.5, 0.6),
        c = tt % 4.2,
        tw = !still && c < 0.4 ? Math.sin((c / 0.4) * Math.PI) : 0;
      for (const sx of [-1, 1]) {
        ctx.save();
        ctx.translate(77 + sx * 15, 77 - R + 4);
        ctx.rotate(sx * (0.2 + (sx > 0 ? tw * 0.35 : 0)));
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.ellipse(0, -19, 9, 22, 0, 0, TAU);
        inked(ctx, grad(ctx, 0, -40, 0, 0, "#ffffff", "#dfe6f2"), 1.8, CB.ink);
        ctx.beginPath();
        ctx.ellipse(0, -18, 4.4, 15, 0, 0, TAU);
        ctx.fillStyle = "#bfe2ff";
        ctx.fill();
        ctx.restore();
      }
      // the scarf knot and a carrot tucked in at the bottom
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(77 + 22, 77 + R + 1);
      ctx.rotate(0.9 + Math.sin(tt * 2) * 0.05);
      cbCarrot(ctx, 12);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(77 - 18, 77 + R + 2);
      for (const [r, l] of [
        [0.5, 20],
        [1.0, 17],
      ]) {
        ctx.save();
        ctx.rotate(r + Math.sin(tt * 2.4 + r) * 0.08);
        ctx.beginPath();
        ctx.roundRect(-5, 0, 10, l, 2.5);
        inked(ctx, CB.blue, 1.5, CB.ink);
        ctx.strokeStyle = "#eaf6ff";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-5, l - 4);
        ctx.lineTo(5, l - 4);
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, TAU);
      inked(ctx, CB.blue, 1.5, CB.ink);
      ctx.restore();
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(ctx, CARD.w * 0.5, CARD.h + 20, 200, `rgba(110,220,150,${0.2 * a})`);
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(rot) * 0.6);
        ctx.globalAlpha = a * 0.55;
        if (p.k < 0.55) clover(ctx, p.s * 1.1);
        else cbCarrot(ctx, p.s * 0.7);
        ctx.restore();
      });
    },
  };
}
