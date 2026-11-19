// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutCubic,
  easeOutBack,
  easeInOut,
  rng,
  glow,
  inked,
  pop,
  fade,
  grad,
  leafPath,
  dropPath,
  ringBase,
  Strand,
  strandLine,
  strandBits,
  Drift,
  settle,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Dino Selvagem ----------
const DS = {
  ink: "#161a0e",
  skin: "#6b7a3e",
  dark: "#39461f",
  belly: "#c9b87a",
  amber: "#ffb02e",
};
// A tyrannosaur in profile, feet on (0,0), heading right, about 150 long. `jaw` opens the mouth, `step` is the walk cycle.
function dsRex(ctx, t, jaw, step, o = {}) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const skin = o.skin || DS.skin,
    dark = o.dark || DS.dark,
    belly = o.belly || DS.belly,
    br = Math.sin(t * 1.6) * 0.8,
    tw = Math.sin(t * 1.3) * 3;
  const leg = (ph, back) => {
    const s = Math.sin(step + ph),
      c = Math.cos(step + ph),
      hip = [-8, -40 + br],
      knee = [4 + s * 9, -22 + br * 0.5],
      ank = [-6 + s * 13, -9 - Math.max(0, c) * 5],
      toe = [8 + s * 14, -Math.max(0, c) * 6];
    const seg = (a, b, w0, w1) => {
      const an = Math.atan2(b[1] - a[1], b[0] - a[0]),
        sx = Math.sin(an),
        cx = Math.cos(an);
      ctx.beginPath();
      ctx.moveTo(a[0] + sx * w0, a[1] - cx * w0);
      ctx.lineTo(b[0] + sx * w1, b[1] - cx * w1);
      ctx.arc(b[0], b[1], w1, an - Math.PI / 2, an + Math.PI / 2);
      ctx.lineTo(a[0] - sx * w0, a[1] + cx * w0);
      ctx.arc(a[0], a[1], w0, an + Math.PI / 2, an + Math.PI * 1.5);
      ctx.closePath();
      inked(
        ctx,
        back ? dark : grad(ctx, 0, -44, 0, 0, skin, dark),
        1.6,
        DS.ink,
      );
    };
    seg(ank, toe, 3.4, 3);
    seg(knee, ank, 5, 3.6);
    seg(hip, knee, 11, 6.5);
    ctx.fillStyle = "#e9e2c4";
    for (const d of [0, 4, 8]) {
      ctx.beginPath();
      ctx.moveTo(toe[0] + d - 2, toe[1] - 1);
      ctx.lineTo(toe[0] + d + 4, toe[1] + 2.6);
      ctx.lineTo(toe[0] + d - 2, toe[1] + 2.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = DS.ink;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  };
  leg(Math.PI, true);
  // tail, body and neck in one outline
  const out = () => {
    ctx.beginPath();
    ctx.moveTo(-92, -34 + tw);
    ctx.bezierCurveTo(-64, -40 + tw * 0.5, -40, -56 + br, -12, -60 + br);
    ctx.bezierCurveTo(6, -62 + br, 20, -62 + br, 30, -72 + br);
    ctx.lineTo(46, -64 + br);
    ctx.bezierCurveTo(40, -50 + br, 34, -38 + br, 22, -32 + br);
    ctx.bezierCurveTo(6, -24 + br, -18, -26 + br, -34, -32 + br);
    ctx.bezierCurveTo(-56, -30 + tw * 0.5, -74, -30 + tw, -92, -34 + tw);
    ctx.closePath();
  };
  out();
  inked(ctx, grad(ctx, 0, -66, 0, -24, skin, belly), 1.8, DS.ink);
  ctx.save();
  out();
  ctx.clip();
  ctx.fillStyle = dark;
  ctx.globalAlpha = 0.75;
  for (let i = 0; i < 11; i++) {
    const x = -80 + i * 10.5;
    ctx.beginPath();
    ctx.moveTo(x - 3, -70);
    ctx.quadraticCurveTo(
      x + 4,
      -52,
      x - 1 + (i % 2) * 3,
      -42 - (i > 3 && i < 9 ? 6 : -4),
    );
    ctx.quadraticCurveTo(x + 5, -56, x + 4, -70);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#000";
  ctx.fillRect(-100, -32 + br, 150, 12);
  ctx.restore();
  // the small arm
  ctx.save();
  ctx.translate(24, -40 + br);
  ctx.rotate(0.9 + Math.sin(t * 2) * 0.08 + jaw * 0.5);
  ctx.beginPath();
  ctx.roundRect(-2.4, 0, 4.8, 10, 2.4);
  inked(ctx, skin, 1.3, DS.ink);
  ctx.translate(0, 9);
  ctx.rotate(-1.1);
  ctx.beginPath();
  ctx.roundRect(-2, 0, 4, 8, 2);
  inked(ctx, skin, 1.3, DS.ink);
  ctx.fillStyle = "#e9e2c4";
  ctx.beginPath();
  ctx.moveTo(-2, 8);
  ctx.lineTo(-1, 12);
  ctx.lineTo(0.5, 8);
  ctx.moveTo(0.5, 8);
  ctx.lineTo(1.6, 11.6);
  ctx.lineTo(2.4, 8);
  ctx.fill();
  ctx.restore();
  leg(0, false);
  // head: the lower jaw hinges at the back of the skull
  ctx.save();
  ctx.translate(38, -68 + br);
  ctx.rotate(-0.1 - jaw * 0.22 + (o.nod || 0));
  ctx.save();
  ctx.rotate(jaw * 0.7);
  ctx.beginPath();
  ctx.moveTo(-4, 4);
  ctx.lineTo(34, 7);
  ctx.quadraticCurveTo(38, 11, 32, 13);
  ctx.lineTo(6, 14);
  ctx.quadraticCurveTo(-4, 12, -4, 4);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, 4, 0, 14, belly, "#8f8250"), 1.6, DS.ink);
  ctx.fillStyle = "#f4efd8";
  for (let x = 8; x < 33; x += 4.6) {
    ctx.beginPath();
    ctx.moveTo(x - 1.6, 7.4);
    ctx.lineTo(x, 2.4);
    ctx.lineTo(x + 1.6, 7.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = DS.ink;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();
  if (jaw > 0.15) {
    ctx.beginPath();
    ctx.moveTo(2, 4);
    ctx.lineTo(30, 5);
    ctx.lineTo(26, 5 + jaw * 14);
    ctx.lineTo(4, 5 + jaw * 9);
    ctx.closePath();
    ctx.fillStyle = "#6b1420";
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.bezierCurveTo(-12, -10, 0, -18, 14, -16);
  ctx.lineTo(20, -19);
  ctx.lineTo(24, -14);
  ctx.bezierCurveTo(34, -13, 42, -8, 42, 0);
  ctx.quadraticCurveTo(42, 6, 34, 7);
  ctx.lineTo(-2, 6);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -18, 0, 7, skin, "#8a8f52"), 1.8, DS.ink);
  ctx.fillStyle = "#f4efd8";
  for (let x = 6; x < 38; x += 4.4) {
    const l = 5.5 - Math.abs(x - 24) * 0.12;
    ctx.beginPath();
    ctx.moveTo(x - 1.7, 6);
    ctx.lineTo(x, 6 + l);
    ctx.lineTo(x + 1.7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = DS.ink;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.fillStyle = dark;
  ctx.globalAlpha = 0.7;
  for (const [x, y, r] of [
    [2, -9, 3],
    [8, -13, 2.2],
    [-4, -3, 2.4],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(10, -13);
  ctx.quadraticCurveTo(17, -17, 23, -12);
  ctx.strokeStyle = DS.ink;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  glow(ctx, 17, -9.5, 9, `rgba(255,176,46,${0.35 + jaw * 0.4})`);
  ctx.beginPath();
  ctx.ellipse(17, -9.5, 3.6, 2.8, 0, 0, TAU);
  ctx.fillStyle = DS.amber;
  ctx.fill();
  ctx.strokeStyle = DS.ink;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(17.4, -9.5, 0.9, 2.5, 0, 0, TAU);
  ctx.fillStyle = "#120a04";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(37, -4, 1.6, 1, 0.3, 0, TAU);
  ctx.fillStyle = DS.ink;
  ctx.fill();
  ctx.restore();
}
// A fern frond from (0,0) along +x.
function dsFrond(ctx, len, t, ph, c0 = "#2f7a3a", c1 = "#7fbf4a") {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const bend = Math.sin(t * 1.3 + ph) * len * 0.05 - len * 0.18;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, bend, len, bend * 0.2);
  ctx.strokeStyle = DS.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = c0;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  for (let i = 1; i < 11; i++) {
    const u = i / 11,
      x = len * u,
      y = 2 * (1 - u) * u * bend + u * u * bend * 0.2,
      l = len * 0.24 * Math.sin(u * Math.PI) + 3;
    for (const sy of [-1, 1]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(sy * 1.05 + (2 * (1 - 2 * u) * bend) / len);
      leafPath(ctx, l, l * 0.22);
      inked(ctx, i % 2 ? c0 : c1, 0.9, DS.ink);
      ctx.restore();
    }
  }
}
function dsClaw(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, 0);
  ctx.quadraticCurveTo(-s * 0.5, -s * 0.9, s * 0.5, -s * 1.3);
  ctx.quadraticCurveTo(s * 0.15, -s * 0.6, s * 0.3, 0);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, 0, -s * 1.3, 0, 0, "#fffbe8", "#bfae7a"),
    Math.max(1, s * 0.1),
    DS.ink,
  );
}

export default function create(CARD, AVATAR) {
  return {
    name: "Dino Selvagem",
    reach: { top: 108, side: 68, bottom: 70 },
    mat: ["#161f10", "#0b1008"],
    theme: cardTheme("#4f7a2e", "#a84a16"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.vine = Strand(this.loop, m.tl + m.arc * 0.5, m.side * 0.84, -1, 4, {
        off: 7,
        wave: 7,
        freq: 16,
        gap: 0.075,
        size: 16,
        taper: 0.8,
      });
      this.vine2 = Strand(
        this.loop,
        m.right - m.arc * 0.5,
        m.side * 0.84,
        1,
        16,
        { off: 7, wave: 7, freq: 16, gap: 0.075, size: 16, taper: 0.8 },
      );
      this.t0 = 0.4;
      this.dur = 1.8;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.fx = Drift(18, 89, { v: [-20, -7], s: [1.2, 3], sway: 14, spin: 0 });
      const R = rng(14);
      this.flies = [];
      for (let i = 0; i < 12; i++)
        this.flies.push({ x: R(), y: R(), ph: R() * TAU, f: 0.5 + R() });
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.4, 1.2),
        L = this.loop.L,
        m = this.loop.m;
      // pteranodons circle high above
      for (const [ph, r, y] of [
        [0, 60, -92],
        [3.4, 86, -84],
      ]) {
        const u = tt * 0.5 + ph,
          x = CARD.w * 0.5 + Math.cos(u) * (CARD.w * 0.5 + r),
          fl = Math.sin(tt * 3 + ph) * 3;
        ctx.save();
        ctx.translate(x, y + Math.sin(u * 2) * 8);
        ctx.scale(Math.sin(u) > 0 ? -1 : 1, 1);
        ctx.globalAlpha = a * 0.85;
        ctx.beginPath();
        ctx.moveTo(-18, fl);
        ctx.quadraticCurveTo(-8, -6 - fl, 0, 0);
        ctx.quadraticCurveTo(8, -6 - fl, 18, fl);
        ctx.quadraticCurveTo(6, 2, 0, 5);
        ctx.quadraticCurveTo(-6, 2, -18, fl);
        ctx.closePath();
        ctx.fillStyle = "#2a3320";
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(13, -3);
        ctx.lineTo(5, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // lianas down both sides, fern fronds at the four corners
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        for (const v of [this.vine, this.vine2]) {
          strandLine(c, v, g, [
            [DS.ink, 7],
            ["#3f5a2a", 4.4],
            ["rgba(170,200,110,.6)", 1.1],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2 + Math.sin(tt * 1.2 + b.ph) * 0.07);
            c.scale(k, k);
            c.rotate(-Math.PI / 2 + (b.i % 2 ? 0.5 : -0.5));
            leafPath(c, b.s * 1.5, b.s * 0.5);
            inked(
              c,
              grad(
                c,
                0,
                0,
                b.s * 1.5,
                0,
                "#2f6a34",
                b.i % 2 ? "#6fae48" : "#4f8a3a",
              ),
              1.2,
              DS.ink,
            );
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(b.s * 1.4, 0);
            c.strokeStyle = "rgba(20,40,16,.5)";
            c.lineWidth = 0.9;
            c.stroke();
          });
        }
        [
          [-6, CARD.h + 8, [2.2, 2.75, 3.3], 54],
          [CARD.w + 6, CARD.h + 8, [0.95, 0.4, -0.15], 54],
          [-8, -4, [3.5, 4.0], 40],
          [CARD.w + 8, -4, [-0.35, -0.85], 40],
        ].forEach(([x, y, angs, len], ci) =>
          angs.forEach((an, i) => {
            const k = still
              ? 1
              : easeOutBack(clamp((t - 0.5 - ci * 0.12 - i * 0.1) / 0.7));
            if (k <= 0) return;
            c.save();
            c.translate(x, y);
            c.rotate(an);
            c.scale(k, k);
            dsFrond(
              c,
              len * (1 - i * 0.08),
              tt,
              ci + i,
              i % 2 ? "#2f7a3a" : "#286a40",
              i % 2 ? "#7fbf4a" : "#5fa84a",
            );
            c.restore();
          }),
        );
      });
      // bones in the ground and a piece of amber that glows
      {
        const k = still ? 1 : pop(t, 0.9, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(46, CARD.h + 38);
          ctx.scale(k, k);
          ctx.beginPath();
          ctx.ellipse(0, 6, 40, 8, 0, 0, TAU);
          inked(
            ctx,
            grad(ctx, 0, -2, 0, 14, "#6b5434", "#3a2c18"),
            1.5,
            DS.ink,
          );
          ctx.lineCap = "round";
          for (let i = 0; i < 5; i++) {
            const x = -22 + i * 9,
              h = 20 - Math.abs(i - 2) * 3;
            ctx.beginPath();
            ctx.moveTo(x, 4);
            ctx.quadraticCurveTo(x + 9, -h * 0.6, x + 3, -h);
            ctx.strokeStyle = DS.ink;
            ctx.lineWidth = 5;
            ctx.stroke();
            ctx.strokeStyle = "#efe6c8";
            ctx.lineWidth = 2.8;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.quadraticCurveTo(22, -15, 34, -12);
          ctx.quadraticCurveTo(42, -7, 36, 2);
          ctx.closePath();
          inked(ctx, "#efe6c8", 1.5, DS.ink);
          ctx.beginPath();
          ctx.arc(31, -6, 2.6, 0, TAU);
          ctx.fillStyle = DS.ink;
          ctx.fill();
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.2, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w - 34, CARD.h + 34);
          ctx.scale(k, k);
          glow(
            ctx,
            0,
            -8,
            34,
            `rgba(255,176,46,${0.4 + 0.2 * Math.sin(tt * 2.4)})`,
          );
          ctx.beginPath();
          ctx.moveTo(-14, 4);
          ctx.lineTo(-10, -14);
          ctx.lineTo(2, -22);
          ctx.lineTo(14, -12);
          ctx.lineTo(12, 4);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, -14, -22, 14, 4, "#ffe08a", "#f29a1f", "#b35a0c"),
            1.6,
            DS.ink,
          );
          ctx.beginPath();
          ctx.moveTo(-6, -10);
          ctx.lineTo(1, -17);
          ctx.strokeStyle = "rgba(255,255,255,.7)";
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.strokeStyle = "rgba(60,30,6,.8)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(2, -6, 3.4, 1.6, 0.5, 0, TAU);
          ctx.moveTo(2, -6);
          ctx.lineTo(7, -9);
          ctx.moveTo(2, -6);
          ctx.lineTo(-3, -9);
          ctx.stroke();
          ctx.restore();
        }
      }
      // a raptor runs a lap round the card and stops, watching, by the amber
      {
        const k = still ? 1 : easeInOut(clamp((t - 0.2) / 2.2)),
          s = m.tl - 40 + k * (L * 0.56),
          p = this.loop.at(s);
        ctx.save();
        if (k < 1) {
          ctx.translate(p.x + p.nx * 12, p.y + p.ny * 12);
          ctx.rotate(Math.atan2(p.ty, p.tx));
          ctx.scale(0.42, 0.42);
          dsRex(ctx, tt, 0.1, t * 18, {
            skin: "#9a6a3a",
            dark: "#5a3418",
            belly: "#e0c090",
          });
        } else {
          ctx.translate(CARD.w * 0.62, CARD.h + 44);
          ctx.scale(0.44, 0.44);
          dsRex(ctx, tt, 0.05 + (!still && tt % 4 > 3.6 ? 0.3 : 0), 0.4, {
            skin: "#9a6a3a",
            dark: "#5a3418",
            belly: "#e0c090",
            nod: Math.sin(tt * 1.4) * 0.06,
          });
        }
        ctx.restore();
      }
      // the tyrannosaur walks on along the top edge, stops and roars
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.6) / 1.9)),
          x = -150 + k * (CARD.w * 0.5 + 150),
          since = t - 2.6,
          roar = still
            ? 0.25
            : since > 0
              ? Math.exp(-Math.pow((since - 0.45) / 0.5, 2))
              : 0,
          cyc = (tt + 3) % 8,
          again =
            !still && t > 6 && cyc < 1.2
              ? Math.sin((cyc / 1.2) * Math.PI) * 0.8
              : 0,
          jaw = Math.max(roar, again) + 0.06 + Math.sin(tt * 1.5) * 0.03;
        if (k > 0) {
          ctx.save();
          ctx.translate(x + (jaw > 0.4 ? Math.sin(tt * 50) * 1.2 : 0), 2);
          ctx.scale(0.92, 0.92);
          dsRex(ctx, tt, jaw, k < 1 ? t * 9 : 0.5, { nod: -jaw * 0.1 });
          ctx.restore();
          if (jaw > 0.35) {
            ctx.save();
            ctx.translate(x + 82, -66);
            ctx.strokeStyle = `rgba(255,236,190,${(jaw - 0.3) * 1.1})`;
            ctx.lineWidth = 2.4;
            ctx.lineCap = "round";
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.arc(-14, 0, 22 + i * 11 + ((tt * 40) % 11), -0.5, 0.5);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      }
      // fireflies in the leaves
      for (const f of this.flies) {
        const an = f.ph + tt * 0.12 * f.f,
          x = CARD.w / 2 + Math.cos(an) * (CARD.w / 2 + 34 + f.x * 26),
          y = CARD.h / 2 + Math.sin(an) * (CARD.h / 2 + 30 + f.y * 26);
        glow(
          ctx,
          x,
          y,
          7,
          `rgba(210,255,120,${a * (0.25 + 0.6 * Math.abs(Math.sin(tt * 1.7 * f.f + f.ph)))})`,
        );
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r;
      for (const [sx, angs] of [
        [-1, [3.5, 4.1, 2.9]],
        [1, [-0.35, -0.95, 0.25]],
      ])
        angs.forEach((an, i) => {
          const k = still ? 1 : easeOutBack(clamp((t - 0.4 - i * 0.1) / 0.6));
          if (k <= 0) return;
          ctx.save();
          ctx.translate(77 + sx * (R - 4), 77 + 6);
          ctx.rotate(an);
          ctx.scale(k, k);
          dsFrond(ctx, 34 - i * 4, tt, i + sx, "#2f7a3a", "#7fbf4a");
          ctx.restore();
        });
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        77,
        77,
        R + 3.5,
        [
          [DS.ink, 8],
          ["#8a7a4a", 5.2],
          ["#efe6c8", 1.4, [7, 5], 0],
        ],
        tt,
      );
      ctx.restore();
      // claws close round the bottom of the ring, and a drop of amber sits on top
      for (let i = 0; i < 5; i++) {
        const an = Math.PI / 2 + (i - 2) * 0.38,
          k = still ? 1 : pop(t, 0.8 + Math.abs(i - 2) * 0.1, 0.4);
        if (k <= 0) continue;
        ctx.save();
        ctx.translate(
          77 + Math.cos(an) * (R + 12),
          77 + Math.sin(an) * (R + 12),
        );
        ctx.rotate(an + Math.PI / 2 + 0.2);
        ctx.scale(k, k);
        dsClaw(ctx, 10 - Math.abs(i - 2) * 1.6);
        ctx.restore();
      }
      {
        const k = still ? 1 : pop(t, 1.3, 0.5);
        ctx.save();
        ctx.translate(77, 77 - R - 4);
        ctx.scale(k, k);
        glow(
          ctx,
          0,
          0,
          17,
          `rgba(255,176,46,${0.45 + 0.25 * Math.sin(tt * 2.4)})`,
        );
        dropPath(ctx, 7.5);
        inked(
          ctx,
          grad(ctx, -6, -12, 6, 8, "#ffe08a", "#f29a1f", "#b35a0c"),
          1.5,
          DS.ink,
        );
        ctx.beginPath();
        ctx.ellipse(-2.4, -1, 1.4, 3, 0.4, 0, TAU);
        ctx.fillStyle = "rgba(255,255,255,.7)";
        ctx.fill();
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      // jungle haze low down, embers rising
      for (let i = 0; i < 4; i++)
        glow(
          ctx,
          ((i * 130 + tt * 9) % (CARD.w + 220)) - 110,
          CARD.h - 30 + Math.sin(tt * 0.6 + i) * 8,
          110,
          `rgba(120,170,90,${0.16 * a})`,
        );
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y) => {
        glow(
          ctx,
          x,
          y,
          p.s * 2.6,
          `rgba(255,170,60,${0.5 * a * (0.4 + 0.6 * Math.abs(Math.sin(tt * p.f + p.ph)))})`,
        );
      });
      // three claw marks tear across when the profile opens
      const k = still ? 1 : clamp((t - 2.7) / 0.28),
        fadeOut = still
          ? 0.16
          : t > 2.7
            ? Math.max(0.12, 1 - (t - 3) / 1.6)
            : 0;
      if (k > 0) {
        ctx.save();
        ctx.lineCap = "round";
        for (let i = 0; i < 3; i++) {
          const x0 = CARD.w * 0.5 + i * 26,
            y0 = 40 + i * 6,
            x1 = x0 - 130 * k,
            y1 = y0 + 190 * k;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.quadraticCurveTo(x0 - 30 * k, y0 + 110 * k, x1, y1);
          ctx.strokeStyle = `rgba(255,220,170,${0.55 * fadeOut})`;
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.strokeStyle = `rgba(255,255,255,${0.8 * fadeOut})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
        ctx.restore();
      }
    },
  };
}
