// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  glow,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  heartPath,
  leafPath,
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
  daisy,
  cardTheme,
} from "../kit";

// ---------- Coelhinha ----------
const CG = { ink: "#4a2a4a", pink: "#ff7fb0", lilac: "#a57be8" };
function cgBerry(ctx, s) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, s);
  ctx.bezierCurveTo(-s * 1.15, s * 0.1, -s * 0.95, -s * 0.85, 0, -s * 0.7);
  ctx.bezierCurveTo(s * 0.95, -s * 0.85, s * 1.15, s * 0.1, 0, s);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, -s, -s, s, s, "#ff6f8f", "#e32f55"),
    Math.max(1, s * 0.1),
    CG.ink,
  );
  ctx.fillStyle = "#ffe9a8";
  for (const [x, y] of [
    [-0.4, -0.2],
    [0.35, -0.25],
    [0, 0.2],
    [-0.3, 0.45],
    [0.35, 0.4],
  ]) {
    ctx.beginPath();
    ctx.ellipse(x * s, y * s, s * 0.07, s * 0.11, 0, 0, TAU);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(0, -s * 0.72);
  for (const a of [-1.1, -0.4, 0.4, 1.1]) {
    ctx.save();
    ctx.rotate(a);
    leafPath(ctx, s * 0.62, s * 0.2);
    ctx.restore();
    inked(ctx, "#57c785", Math.max(0.7, s * 0.07), "#1f4a2a");
  }
  ctx.restore();
}
function cgBow(ctx, s, color, t = 0) {
  ctx.lineJoin = "round";
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      sx * s * 0.5,
      -s * 0.9,
      sx * s * 1.3,
      -s * 0.7,
      sx * s * 1.2,
      0,
    );
    ctx.bezierCurveTo(sx * s * 1.3, s * 0.7, sx * s * 0.5, s * 0.7, 0, 0);
    ctx.closePath();
    inked(ctx, color, Math.max(1.1, s * 0.11), CG.ink);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.1);
    ctx.quadraticCurveTo(
      sx * s * 0.5 + Math.sin(t * 2.4 + sx) * s * 0.08,
      s * 0.8,
      sx * s * 0.75,
      s * 1.5,
    );
    ctx.lineTo(sx * s * 0.25, s * 1.3);
    ctx.closePath();
    inked(ctx, color, Math.max(1.1, s * 0.11), CG.ink);
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.3, s * 0.36, 0, 0, TAU);
  inked(ctx, "#fff", Math.max(1, s * 0.1), CG.ink);
}

export default function create(CARD, AVATAR) {
  return {
    name: "Coelhinha",
    reach: { top: 110, side: 62, bottom: 62 },
    mat: ["#2e1836", "#170f20"],
    theme: cardTheme("#ff7fb0", "#8b63d9"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.rib = Strand(
        this.loop,
        m.br + m.arc * 0.5,
        m.arc * 0.5 + m.top + m.arc + m.side * 0.5,
        1,
        7,
        { off: 8, wave: 6, freq: 26, gap: 0.062, size: 11 },
      );
      this.rib2 = Strand(
        this.loop,
        m.br + m.arc * 0.5,
        m.arc * 0.5 + m.side + m.arc + m.top * 0.22,
        -1,
        15,
        { off: 8, wave: 6, freq: 26, gap: 0.07, size: 11 },
      );
      this.t0 = 0.4;
      this.dur = 2;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.stars = twinkles(16, 61, CARD.w, CARD.h, 24, 74);
      this.fx = Drift(14, 13, {
        v: [-22, -9],
        s: [5, 10],
        sway: 14,
        spin: 0.8,
      });
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.3, 1.2);
      for (const s of this.stars) {
        ctx.save();
        ctx.translate(s.x, s.y - ((tt * 6 * s.f) % 26));
        ctx.globalAlpha = a * (0.3 + 0.7 * Math.abs(Math.sin(tt * s.f + s.ph)));
        if (s.s > 2.2) {
          ctx.rotate(Math.sin(s.ph) * 0.4);
          heartPath(ctx, s.s * 1.9);
          ctx.fillStyle = s.s > 3 ? "#ff9dc4" : "#d7b8ff";
        } else {
          sparkPath(ctx, s.s * 2.2);
          ctx.fillStyle = "#fff3c4";
        }
        ctx.fill();
        ctx.restore();
      }
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        for (const v of [this.rib, this.rib2]) {
          strandLine(c, v, g, [
            [CG.ink, 7.6],
            [CG.pink, 5],
            ["#ffd3e6", 1.6],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2 + Math.sin(tt * 1.3 + b.ph) * 0.06);
            c.translate(0, -b.s * 0.9);
            c.scale(k, k);
            if (b.kind < 0.4)
              daisy(c, b.s * 0.85, 7, "#fff", "#ffd35c", CG.ink);
            else if (b.kind < 0.62) cgBerry(c, b.s * 0.62);
            else if (b.kind < 0.82) {
              heartPath(c, b.s * 0.6);
              inked(c, b.i % 2 ? "#ff9dc4" : "#c9a4ff", 1.1, CG.ink);
            } else cgBow(c, b.s * 0.5, "#c9a4ff", tt);
          });
        }
      });
      // a basket of strawberries in one corner, the bow that ties the ribbon in the other
      {
        const k = still ? 1 : pop(t, 0.7, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(48, CARD.h + 24);
          ctx.scale(k, k);
          [
            [-13, -13, -0.3],
            [0, -18, 0],
            [13, -13, 0.3],
            [-5, -8, 0.1],
            [7, -7, -0.1],
          ].forEach(([x, y, r], i) => {
            ctx.save();
            ctx.translate(x, y + Math.sin(tt * 1.5 + i) * 0.5);
            ctx.rotate(r);
            cgBerry(ctx, 9.5);
            ctx.restore();
          });
          ctx.beginPath();
          ctx.moveTo(-26, -8);
          ctx.lineTo(26, -8);
          ctx.quadraticCurveTo(24, 14, 17, 15);
          ctx.lineTo(-17, 15);
          ctx.quadraticCurveTo(-24, 14, -26, -8);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, 0, -8, 0, 15, "#e9b877", "#b9793a"),
            1.6,
            CG.ink,
          );
          ctx.strokeStyle = "rgba(110,60,20,.55)";
          ctx.lineWidth = 1.1;
          for (let x = -20; x <= 20; x += 8) {
            ctx.beginPath();
            ctx.moveTo(x, -7);
            ctx.lineTo(x * 0.8, 14);
            ctx.stroke();
          }
          for (const y of [-1, 6]) {
            ctx.beginPath();
            ctx.moveTo(-24, y);
            ctx.lineTo(24, y);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.roundRect(-28, -11, 56, 6, 3);
          inked(ctx, "#f2cf96", 1.4, CG.ink);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 0.5, 0.6);
        ctx.save();
        ctx.translate(CARD.w - 22, CARD.h + 14);
        ctx.rotate(-0.25 + Math.sin(tt * 1.2) * 0.04);
        ctx.scale(k, k);
        cgBow(ctx, 21, CG.pink, tt);
        ctx.restore();
      }
      // on the top edge: the bunny with the bow, and a lilac little one beside her
      {
        const k = still ? 1 : bounceOut((t - 1.2) / 0.85);
        if (still || t > 1.2) {
          const c = tt % 5;
          ctx.save();
          ctx.translate(CARD.w * 0.3, 2 - (1 - k) * 150);
          ctx.scale(1.55, 1.55);
          bunny(ctx, tt, {
            ink: CG.ink,
            acc: "bow",
            accColor: CG.pink,
            inner: "#ffc2dc",
            blink: !still && blinking(tt, 3.1),
            look: Math.sin(tt * 0.7) * 0.7,
            twitch: !still && c > 4.1 ? Math.sin((c - 4.1) * 14) : 0,
          });
          ctx.translate(-11, -8);
          ctx.rotate(-0.2);
          daisy(ctx, 5.5, 6, "#fff", "#ffd35c", CG.ink);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 2, 0.5);
        if (k > 0) {
          const c = (tt + 2) % 6,
            j = !still && c < 0.5 ? Math.sin((c / 0.5) * Math.PI) * 9 : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.72, 2 - j);
          ctx.scale(1.12 * k, 1.12 * k);
          bunny(ctx, tt + 1, {
            fur: "#e9dcff",
            shade: "#c3a9f2",
            inner: "#ffc2dc",
            ink: CG.ink,
            hold: "none",
            blink: !still && blinking(tt, 2.6, 1),
            look: Math.sin(tt * 1.1 + 1) * 0.9,
            twitch: Math.sin(tt * 2.4) * 0.5,
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
          [CG.ink, 7.4],
          [CG.pink, 4.6],
          ["#fff", 1.4, [1.5, 7], 5],
        ],
        tt,
      );
      // a crown of small flowers round the lower half
      for (let i = 0; i < 6; i++) {
        const an = 0.5 + i * 0.43,
          k2 = still ? 1 : pop(t, 0.9 + i * 0.07, 0.4);
        if (k2 <= 0) continue;
        ctx.save();
        ctx.translate(77 + Math.cos(an) * (R + 8), 77 + Math.sin(an) * (R + 8));
        ctx.rotate(tt * 0.3 + i);
        ctx.scale(k2, k2);
        daisy(
          ctx,
          i % 2 ? 6 : 7.5,
          6,
          i % 2 ? "#ffd3e6" : "#fff",
          i % 2 ? "#ff7fb0" : "#ffd35c",
          CG.ink,
        );
        ctx.restore();
      }
      ctx.restore();
      const k = still ? 1 : pop(t, 0.5, 0.6),
        c = tt % 4.4,
        tw = !still && c < 0.4 ? Math.sin((c / 0.4) * Math.PI) : 0;
      for (const sx of [-1, 1]) {
        ctx.save();
        ctx.translate(77 + sx * 15, 77 - R + 4);
        ctx.rotate(sx * (0.22 + (sx < 0 ? tw * 0.3 : 0)));
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.ellipse(0, -19, 9, 22, 0, 0, TAU);
        inked(ctx, grad(ctx, 0, -40, 0, 0, "#ffffff", "#f2dff0"), 1.8, CG.ink);
        ctx.beginPath();
        ctx.ellipse(0, -18, 4.4, 15, 0, 0, TAU);
        ctx.fillStyle = "#ffc2dc";
        ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(77, 77 - R - 2);
      ctx.scale(k, k);
      cgBow(ctx, 11, CG.pink, tt);
      ctx.restore();
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(
        ctx,
        CARD.w * 0.5,
        CARD.h + 20,
        200,
        `rgba(255,140,190,${0.22 * a})`,
      );
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = a * 0.6 * (0.5 + 0.5 * Math.sin(tt * p.f + p.ph));
        if (p.k < 0.7) {
          ctx.rotate(Math.sin(rot) * 0.4);
          heartPath(ctx, p.s * 0.75);
          ctx.fillStyle = p.k < 0.35 ? "#ff9dc4" : "#d7b8ff";
        } else {
          sparkPath(ctx, p.s * 0.9);
          ctx.fillStyle = "#fff";
        }
        ctx.fill();
        ctx.restore();
      });
    },
  };
}
