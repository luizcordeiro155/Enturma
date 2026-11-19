// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  smooth,
  easeOutCubic,
  easeOutBack,
  rng,
  inked,
  pop,
  fade,
  grad,
  dropPath,
  blinking,
  ringBase,
  Strand,
  strandLine,
  strandBits,
  Drift,
  settle,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Tinta Sombria ----------
// Ink is black on a dark profile, so every shape carries a thin paper-coloured rim, the way old cartoons cut figures out.
const TS = {
  ink: "#0c0b0e",
  paper: "#efe6cf",
  sepia: "#b9a67a",
  rim: "rgba(239,230,207,.82)",
};
// An ink creature rising from (0,0): a dripping body, two hollow eyes of different sizes, a stitched mouth.
function tsGhoul(ctx, t, o = {}) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const sw = Math.sin(t * 1.3 + (o.ph || 0)) * 2.5,
    h = o.h || 60;
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.bezierCurveTo(-26, -h * 0.4, -20 + sw, -h * 0.95, sw, -h);
  ctx.bezierCurveTo(20 + sw, -h * 0.95, 26, -h * 0.4, 20, 0);
  for (let i = 0; i < 4; i++) {
    const x0 = 20 - i * 10,
      x1 = x0 - 10,
      d = 7 + Math.sin(t * 2.2 + i * 1.6) * 4;
    ctx.quadraticCurveTo((x0 + x1) / 2 + 1, d * (i % 2 ? 0.5 : 1.5), x1, 0);
  }
  ctx.closePath();
  ctx.fillStyle = TS.ink;
  ctx.fill();
  ctx.strokeStyle = TS.rim;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // arms that end in long fingers
  for (const sx of [-1, 1]) {
    const r = (o.reach || 0) * (sx > 0 ? 1 : 0.5);
    ctx.beginPath();
    ctx.moveTo(sx * 17, -h * 0.5);
    ctx.quadraticCurveTo(
      sx * (32 + r * 8),
      -h * 0.55 - r * 10,
      sx * (34 + r * 12),
      -h * 0.28 - r * 16 + Math.sin(t * 2 + sx) * 2,
    );
    ctx.strokeStyle = TS.rim;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = TS.ink;
    ctx.lineWidth = 6;
    ctx.stroke();
    const hx = sx * (34 + r * 12),
      hy = -h * 0.28 - r * 16 + Math.sin(t * 2 + sx) * 2;
    for (const [col, w] of [
      [TS.rim, 4.6],
      [TS.ink, 2.4],
    ]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      for (const a of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(
          hx + sx * Math.cos(a - 0.9 * r) * 9,
          hy + 9 + Math.sin(a) * 3 - r * 8,
        );
        ctx.stroke();
      }
    }
  }
  ctx.save();
  ctx.translate(sw * 0.7, -h * 0.68);
  const bl = o.blink;
  for (const [x, r] of [
    [-7, 5.4],
    [7.5, 3.6],
  ]) {
    ctx.beginPath();
    if (bl) {
      ctx.moveTo(x - r, 0);
      ctx.lineTo(x + r, 0);
      ctx.strokeStyle = TS.paper;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    } else {
      ctx.ellipse(x, 0, r, r * 1.15, 0, 0, TAU);
      ctx.fillStyle = TS.paper;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + (o.look || 0) * r * 0.4, r * 0.1, r * 0.3, 0, TAU);
      ctx.fillStyle = TS.ink;
      ctx.fill();
    }
  }
  const grin = o.grin === undefined ? 1 : o.grin;
  ctx.beginPath();
  ctx.moveTo(-11, 11);
  ctx.quadraticCurveTo(0, 11 + grin * 9, 12, 10);
  ctx.strokeStyle = TS.paper;
  ctx.lineWidth = 1.7;
  ctx.stroke();
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const u = (i + 0.5) / 6,
      x = -11 + 23 * u,
      y = 11 + grin * 9 * 4 * u * (1 - u) * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 2.6);
    ctx.lineTo(x, y + 2.6);
    ctx.stroke();
  }
  ctx.restore();
}
// A drop of ink that has run down from (0,0) by `len` and hangs.
function tsDrip(ctx, w, len) {
  if (len <= 0.5) return;
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.quadraticCurveTo(-w * 0.5, len * 0.5, -w * 0.62, len - w);
  ctx.arc(0, len - w * 0.6, w * 0.74, Math.PI, 0, true);
  ctx.quadraticCurveTo(w * 0.5, len * 0.5, w, 0);
  ctx.closePath();
  ctx.fillStyle = TS.ink;
  ctx.fill();
  ctx.strokeStyle = TS.rim;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-w * 0.2, len - w * 0.8, w * 0.2, 0, TAU);
  ctx.fillStyle = "rgba(239,230,207,.5)";
  ctx.fill();
}
function tsSplat(ctx, r, seed) {
  const R = rng(seed);
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU,
      q = r * (0.62 + R() * 0.5);
    ctx.quadraticCurveTo(
      Math.cos(a - 0.22) * q * 1.4,
      Math.sin(a - 0.22) * q * 1.4,
      Math.cos(a) * q * 0.72,
      Math.sin(a) * q * 0.72,
    );
  }
  ctx.closePath();
  ctx.fillStyle = TS.ink;
  ctx.fill();
  ctx.strokeStyle = TS.rim;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = R() * TAU,
      d = r * (1.1 + R() * 0.7);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * (0.06 + R() * 0.1), 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
}

export default function create(CARD, AVATAR) {
  return {
    name: "Tinta Sombria",
    reach: { top: 84, side: 66, bottom: 72 },
    mat: ["#2a2620", "#12100d"],
    theme: cardTheme("#8a7a52", "#1a1814"),
    init() {
      this.loop = frameLoop(CARD, 6);
      const m = this.loop.m;
      this.ten = [
        Strand(
          this.loop,
          m.bl + m.arc * 0.5,
          m.arc * 0.5 + m.side * 0.84,
          1,
          5,
          { off: 7, wave: 8, freq: 24, gap: 0.085, size: 11 },
        ),
        Strand(
          this.loop,
          m.br + m.arc * 0.5,
          m.arc * 0.5 + m.side * 0.84,
          -1,
          12,
          { off: 7, wave: 8, freq: 24, gap: 0.085, size: 11 },
        ),
      ];
      this.t0 = 0.8;
      this.dur = 1.9;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      const R = rng(23);
      this.drips = [];
      for (let i = 0; i < 15; i++)
        this.drips.push({
          x: 6 + R() * (CARD.w - 12),
          w: 3 + R() * 4.5,
          len: 12 + R() * 34,
          d: R() * 1.6,
          ph: R() * TAU,
        });
      this.inner = [];
      for (let i = 0; i < 9; i++)
        this.inner.push({
          x: 10 + R() * (CARD.w - 20),
          w: 2.6 + R() * 3.6,
          len: 20 + R() * 70,
          d: R() * 2,
          ph: R() * TAU,
        });
      this.splats = [
        [-26, CARD.h * 0.2, 17, 3],
        [CARD.w + 30, CARD.h * 0.66, 21, 7],
        [CARD.w + 22, -20, 14, 11],
        [-22, CARD.h + 26, 24, 15],
        [CARD.w * 0.6, CARD.h + 40, 15, 19],
      ];
      this.fx = Drift(14, 127, { v: [14, 34], s: [2, 5], sway: 3, spin: 0 });
      this.eyes = [];
      for (let i = 0; i < 6; i++) {
        const an = R() * TAU;
        this.eyes.push({
          x: CARD.w / 2 + Math.cos(an) * (CARD.w / 2 + 34 + R() * 26),
          y: CARD.h / 2 + Math.sin(an) * (CARD.h / 2 + 30 + R() * 26),
          r: 3 + R() * 3,
          ph: R() * 9,
          every: 5 + R() * 4,
        });
      }
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t;
      // ink hits the page: splats land one after the other
      this.splats.forEach(([x, y, r, sd], i) => {
        const k = still ? 1 : easeOutBack(clamp((t - 0.15 - i * 0.14) / 0.3));
        if (k <= 0) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(k, k);
        ctx.rotate(sd);
        tsSplat(ctx, r, sd);
        ctx.restore();
      });
      // tendrils creep up both sides, curling, with thorns and small eyes that open
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        for (const v of this.ten) {
          strandLine(c, v, g, [
            [TS.rim, 10.6],
            [TS.ink, 8],
            ["rgba(239,230,207,.25)", 1.1, [9, 14]],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2);
            c.scale(k, k);
            if (b.kind < 0.6) {
              c.beginPath();
              c.moveTo(0, 0);
              for (let a2 = 0; a2 < 7; a2 += 0.3) {
                const rr = b.s * 0.75 * (1 - a2 / 8.5);
                c.lineTo(
                  Math.cos(a2 - 1.6) * rr * b.out,
                  -b.s * 0.8 + Math.sin(a2 - 1.6) * rr,
                );
              }
              c.lineCap = "round";
              c.lineJoin = "round";
              c.strokeStyle = TS.rim;
              c.lineWidth = 6.6;
              c.stroke();
              c.strokeStyle = TS.ink;
              c.lineWidth = 4.2;
              c.stroke();
            } else {
              c.beginPath();
              c.moveTo(-3.4, 0);
              c.lineTo(b.out * 2, -b.s * 1.2);
              c.lineTo(3.4, 0);
              c.closePath();
              c.fillStyle = TS.ink;
              c.fill();
              c.strokeStyle = TS.rim;
              c.lineWidth = 1.3;
              c.stroke();
            }
          });
        }
      });
      for (const e of this.eyes) {
        const c = (tt + e.ph) % e.every,
          op = still
            ? 1
            : t < 2.2
              ? 0
              : c < 0.3
                ? c / 0.3
                : c < e.every - 1.4
                  ? 1
                  : c < e.every - 1.1
                    ? 1 - (c - (e.every - 1.4)) / 0.3
                    : 0;
        if (op <= 0) continue;
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.beginPath();
        ctx.ellipse(0, 0, e.r * 1.9, e.r * 1.5, 0, 0, TAU);
        ctx.fillStyle = TS.ink;
        ctx.fill();
        ctx.strokeStyle = TS.rim;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, e.r * 1.2, e.r * op, 0, 0, TAU);
        ctx.fillStyle = TS.paper;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
          Math.sin(tt * 0.8 + e.ph) * e.r * 0.4,
          0,
          e.r * 0.42 * op,
          0,
          TAU,
        );
        ctx.fillStyle = TS.ink;
        ctx.fill();
        ctx.restore();
      }
      // ink pools along the top edge and runs down in drips that swell and fall
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.3) / 1.1));
        ctx.save();
        ctx.beginPath();
        ctx.rect(
          CARD.w * 0.5 - (CARD.w * 0.5 + 20) * k,
          -40,
          (CARD.w + 40) * k,
          200,
        );
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(-12, 4);
        for (let x = -12; x <= CARD.w + 12; x += 12)
          ctx.quadraticCurveTo(
            x + 6,
            -9 - Math.sin(x * 0.07 + tt * 0.7) * 3 - (x % 36 === 0 ? 4 : 0),
            x + 12,
            -5 - Math.sin(x * 0.05) * 2,
          );
        ctx.lineTo(CARD.w + 12, 4);
        ctx.closePath();
        ctx.fillStyle = TS.ink;
        ctx.fill();
        ctx.strokeStyle = TS.rim;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        for (const d of this.drips) {
          const grow = still ? 1 : clamp((t - 0.9 - d.d) / 1.4),
            pulse = 1 + (still ? 0 : Math.sin(tt * 1.1 + d.ph) * 0.08);
          ctx.save();
          ctx.translate(d.x, 2);
          tsDrip(ctx, d.w, d.len * easeOutCubic(grow) * pulse);
          ctx.restore();
          if (!still && t > 3) {
            const c = (tt * 0.33 + d.ph) % 1.6;
            if (c < 1 && d.w > 5) {
              ctx.save();
              ctx.translate(d.x, 2 + d.len + c * c * 130);
              ctx.globalAlpha = 1 - c;
              dropPath(ctx, d.w * 0.5);
              ctx.fillStyle = TS.ink;
              ctx.fill();
              ctx.restore();
            }
          }
        }
        ctx.restore();
      }
      // an inkwell with its quill in one corner, a puddle in the other where hands come up
      {
        const k = still ? 1 : pop(t, 1, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w - 40, CARD.h + 52);
          ctx.scale(k, k);
          ctx.lineJoin = "round";
          ctx.save();
          ctx.translate(6, -26);
          ctx.rotate(0.45 + Math.sin(tt * 1.3) * 0.03);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(13, -26, 3, -52);
          ctx.quadraticCurveTo(-10, -26, 0, 0);
          ctx.closePath();
          inked(ctx, grad(ctx, 0, -52, 0, 0, TS.paper, TS.sepia), 1.4, TS.ink);
          ctx.beginPath();
          ctx.moveTo(0, 6);
          ctx.lineTo(1.4, -50);
          ctx.strokeStyle = TS.ink;
          ctx.lineWidth = 1.3;
          ctx.stroke();
          for (let i = 1; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(0.4 * i, -i * 8);
            ctx.lineTo(6, -i * 8 - 5);
            ctx.moveTo(0.4 * i, -i * 8);
            ctx.lineTo(-5, -i * 8 - 4);
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
          ctx.restore();
          ctx.beginPath();
          ctx.moveTo(-17, 0);
          ctx.lineTo(-19, -18);
          ctx.quadraticCurveTo(-10, -22, -8, -27);
          ctx.lineTo(8, -27);
          ctx.quadraticCurveTo(10, -22, 19, -18);
          ctx.lineTo(17, 0);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, -18, 0, 18, 0, "#5a5548", "#1c1a16"),
            1.7,
            TS.ink,
          );
          ctx.beginPath();
          ctx.ellipse(0, -27, 8.5, 2.8, 0, 0, TAU);
          ctx.fillStyle = TS.ink;
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(-12, -14);
          ctx.lineTo(-12.6, -5);
          ctx.strokeStyle = "rgba(239,230,207,.5)";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.7) / 1)),
          cx = 54,
          cy = CARD.h + 48;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.ellipse(0, 0, 48 * k, 10 * k, 0, 0, TAU);
        ctx.fillStyle = TS.ink;
        ctx.fill();
        ctx.strokeStyle = TS.rim;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(-12, -2, 20 * k, 2.6 * k, 0, 0, TAU);
        ctx.fillStyle = "rgba(239,230,207,.16)";
        ctx.fill();
        [
          [-20, 0, 1],
          [8, 2.1, 0.85],
          [26, 4.4, 0.7],
        ].forEach(([x, ph, s]) => {
          const c = (tt * 0.5 + ph) % 4.2,
            up = still
              ? 0.7
              : t < 2.4
                ? 0
                : c < 1
                  ? easeOutCubic(c)
                  : c < 2.6
                    ? 1
                    : c < 3.4
                      ? 1 - smooth((c - 2.6) / 0.8)
                      : 0;
          if (up <= 0) return;
          ctx.save();
          ctx.translate(x, 0);
          ctx.scale(s, s);
          ctx.beginPath();
          ctx.rect(-20, -60, 40, 60);
          ctx.clip();
          ctx.translate(0, (1 - up) * 44);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(0, 4);
          ctx.quadraticCurveTo(Math.sin(tt * 2 + ph) * 3, -14, 0, -26);
          ctx.strokeStyle = TS.rim;
          ctx.lineWidth = 9.6;
          ctx.stroke();
          ctx.strokeStyle = TS.ink;
          ctx.lineWidth = 7;
          ctx.stroke();
          for (const [col, w] of [
            [TS.rim, 5],
            [TS.ink, 2.8],
          ]) {
            ctx.strokeStyle = col;
            ctx.lineWidth = w;
            for (let f = -2; f <= 2; f++) {
              ctx.beginPath();
              ctx.moveTo(f * 1.6, -26);
              ctx.quadraticCurveTo(
                f * 4.4,
                -34,
                f * 5 + Math.sin(tt * 3 + f + ph) * 1.5,
                -40 + Math.abs(f) * 2.4,
              );
              ctx.stroke();
            }
          }
          ctx.restore();
        });
        ctx.restore();
      }
      // the things that live in the ink come up over the top edge
      {
        const k = still ? 1 : easeOutBack(clamp((t - 1.5) / 0.8));
        if (k > 0) {
          const c = tt % 6,
            reach =
              !still && c > 4 && c < 5.6
                ? Math.sin(((c - 4) / 1.6) * Math.PI)
                : 0;
          ctx.save();
          ctx.beginPath();
          ctx.rect(-80, -200, CARD.w + 160, 200);
          ctx.clip();
          ctx.translate(CARD.w * 0.3, 2 + (1 - k) * 90);
          ctx.scale(1.25, 1.25);
          tsGhoul(ctx, tt, {
            h: 64,
            look: Math.sin(tt * 0.6),
            blink: !still && blinking(tt, 4.2),
            reach,
            grin: 1 + reach * 0.5,
          });
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : easeOutBack(clamp((t - 2.1) / 0.7));
        if (k > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(-80, -200, CARD.w + 160, 200);
          ctx.clip();
          ctx.translate(CARD.w * 0.74, 2 + (1 - k) * 60);
          ctx.scale(0.8, 0.8);
          tsGhoul(ctx, tt + 2, {
            h: 46,
            ph: 2,
            look: -Math.sin(tt * 0.8),
            blink: !still && blinking(tt, 3.1, 1.4),
            grin: 0.5,
          });
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.6),
        R = AVATAR.r;
      // a ring of wet ink that drips, and one eye that opens on it
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const an = (i / 60) * TAU,
          r =
            R +
            6 +
            Math.sin(i * 1.7 + tt * 0.8) * 1.6 +
            Math.sin(i * 0.6) * 1.2;
        ctx.lineTo(77 + Math.cos(an) * r, 77 + Math.sin(an) * r);
      }
      ctx.closePath();
      ctx.arc(77, 77, R - 0.5, 0, TAU, true);
      ctx.fillStyle = TS.ink;
      ctx.fill("evenodd");
      ctx.strokeStyle = TS.rim;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ringBase(
        ctx,
        77,
        77,
        R + 3,
        [["rgba(239,230,207,.35)", 1.1, [10, 16], 3]],
        tt,
      );
      [
        [0.5, 5, 22],
        [1.1, 3.4, 13],
        [1.75, 4.4, 28],
        [2.3, 3, 11],
        [2.75, 4, 18],
      ].forEach(([an, w, len], i) => {
        const grow = still ? 1 : clamp((t - 0.7 - i * 0.2) / 1.2);
        ctx.save();
        ctx.translate(77 + Math.cos(an) * (R + 3), 77 + Math.sin(an) * (R + 3));
        tsDrip(
          ctx,
          w,
          len *
            easeOutCubic(grow) *
            (1 + (still ? 0 : Math.sin(tt * 1.2 + i) * 0.1)),
        );
        ctx.restore();
      });
      ctx.restore();
      {
        const c = tt % 5,
          op = still
            ? 1
            : t < 1.4
              ? 0
              : c < 0.3
                ? c / 0.3
                : c < 3.8
                  ? 1
                  : c < 4.1
                    ? 1 - (c - 3.8) / 0.3
                    : 0,
          x = 77 + Math.cos(-0.9) * (R + 8),
          y = 77 + Math.sin(-0.9) * (R + 8);
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, TAU);
        ctx.fillStyle = TS.ink;
        ctx.fill();
        ctx.strokeStyle = TS.rim;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (op > 0) {
          ctx.beginPath();
          ctx.ellipse(x, y, 7.5, 6.5 * op, 0, 0, TAU);
          ctx.fillStyle = TS.paper;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + Math.sin(tt * 0.9) * 2.6, y, 2.8 * op, 0, TAU);
          ctx.fillStyle = TS.ink;
          ctx.fill();
        }
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      // ink runs down inside the card from the top, drops fall, and the picture flickers like old film
      ctx.save();
      ctx.globalAlpha = a * 0.92;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= CARD.w; x += 14)
        ctx.quadraticCurveTo(
          x + 7,
          8 + Math.sin(x * 0.09 + tt * 0.6) * 3,
          x + 14,
          3,
        );
      ctx.lineTo(CARD.w, 0);
      ctx.closePath();
      ctx.fillStyle = TS.ink;
      ctx.fill();
      for (const d of this.inner) {
        const grow = still ? 1 : clamp((t - 0.6 - d.d) / 1.8);
        ctx.save();
        ctx.translate(d.x, 2);
        tsDrip(
          ctx,
          d.w,
          d.len *
            easeOutCubic(grow) *
            (1 + (still ? 0 : Math.sin(tt * 0.9 + d.ph) * 0.07)),
        );
        ctx.restore();
      }
      ctx.restore();
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = a * 0.6;
        dropPath(ctx, p.s * 0.6);
        ctx.fillStyle = TS.ink;
        ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = grad(
        ctx,
        0,
        CARD.h - 90,
        0,
        CARD.h,
        "rgba(12,11,14,0)",
        `rgba(12,11,14,${0.7 * a})`,
      );
      ctx.fillRect(0, CARD.h - 90, CARD.w, 90);
      if (!still) {
        const s = Math.floor(tt * 14);
        for (let i = 0; i < 2; i++) {
          const q =
            Math.abs(Math.sin(s * 12.9898 + i * 78.233) * 43758.5453) % 1;
          if (q > 0.55) continue;
          ctx.fillStyle = `rgba(239,230,207,${0.1 + q * 0.2})`;
          ctx.fillRect(q * CARD.w * 1.8, 0, 1, CARD.h);
        }
        const q = Math.abs(Math.sin(s * 3.17) * 999) % 1;
        if (q < 0.08) {
          ctx.fillStyle = "rgba(239,230,207,.05)";
          ctx.fillRect(0, 0, CARD.w, CARD.h);
        }
      }
    },
  };
}
