// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutCubic,
  easeInOut,
  rng,
  glow,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  rgrad,
  heartPath,
  ringBase,
  Drift,
  settle,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Medicina ----------
const MD = {
  ink: "#0b2a33",
  teal: "#14b8a6",
  mint: "#99f6e4",
  red: "#f43f5e",
  white: "#f8fafc",
};
function mdCapsule(ctx, s, c0, c1) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.roundRect(-s, -s * 0.42, s * 2, s * 0.84, s * 0.42);
  ctx.fillStyle = c1;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = c0;
  ctx.fillRect(-s, -s, s, s * 2);
  ctx.fillStyle = "rgba(255,255,255,.45)";
  ctx.fillRect(-s * 0.8, -s * 0.3, s * 1.6, s * 0.16);
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(-s, -s * 0.42, s * 2, s * 0.84, s * 0.42);
  ctx.strokeStyle = MD.ink;
  ctx.lineWidth = Math.max(1, s * 0.12);
  ctx.stroke();
}
function mdCross(ctx, s, fill) {
  ctx.beginPath();
  const a = s * 0.34;
  ctx.moveTo(-a, -s);
  ctx.lineTo(a, -s);
  ctx.lineTo(a, -a);
  ctx.lineTo(s, -a);
  ctx.lineTo(s, a);
  ctx.lineTo(a, a);
  ctx.lineTo(a, s);
  ctx.lineTo(-a, s);
  ctx.lineTo(-a, a);
  ctx.lineTo(-s, a);
  ctx.lineTo(-s, -a);
  ctx.lineTo(-a, -a);
  ctx.closePath();
  inked(ctx, fill, Math.max(1, s * 0.13), MD.ink);
}
// One beat of an ECG along 0..1: flat, a bump, the spike, a dip, flat.
const mdBeat = (u) => {
  u = ((u % 1) + 1) % 1;
  if (u < 0.2) return 0;
  if (u < 0.3) return Math.sin(((u - 0.2) / 0.1) * Math.PI) * 0.18;
  if (u < 0.36) return 0;
  if (u < 0.4) return -((u - 0.36) / 0.04) * 0.22;
  if (u < 0.45) return -0.22 + ((u - 0.4) / 0.05) * 1.22;
  if (u < 0.5) return 1 - ((u - 0.45) / 0.05) * 1.4;
  if (u < 0.54) return -0.4 + ((u - 0.5) / 0.04) * 0.4;
  if (u < 0.7) return Math.sin(((u - 0.54) / 0.16) * Math.PI) * 0.26;
  return 0;
};
function mdHeart(ctx, s, beat) {
  const k = 1 + beat * 0.12;
  ctx.save();
  ctx.scale(k, k);
  glow(ctx, 0, 0, s * 2.2, `rgba(244,63,94,${0.3 + beat * 0.3})`);
  heartPath(ctx, s);
  inked(
    ctx,
    rgrad(ctx, -s * 0.35, -s * 0.3, s * 1.6, "#fda4af", MD.red, "#9f1239"),
    1.8,
    MD.ink,
  );
  ctx.beginPath();
  ctx.ellipse(-s * 0.42, -s * 0.2, s * 0.14, s * 0.26, 0.6, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i <= 20; i++)
    ctx.lineTo(
      -s * 0.72 + (i / 20) * s * 1.44,
      s * 0.12 - mdBeat(i / 20) * s * 0.42,
    );
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.7;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Medicina",
    reach: { top: 84, side: 66, bottom: 66 },
    mat: ["#0d2a30", "#06161a"],
    theme: cardTheme("#0d9488", "#be123c"),
    init() {
      this.loop = frameLoop(CARD, 12);
      this.fx = Drift(12, 139, { v: [-18, -6], s: [6, 11], sway: 10, spin: 1 });
      const R = rng(12);
      this.caps = [];
      for (let i = 0; i < 8; i++) {
        const an = R() * TAU;
        this.caps.push({
          x: CARD.w / 2 + Math.cos(an) * (CARD.w / 2 + 40 + R() * 22),
          y: CARD.h / 2 + Math.sin(an) * (CARD.h / 2 + 38 + R() * 22),
          ph: R() * TAU,
          s: 6 + R() * 3,
          k: i % 3,
        });
      }
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.3, 1),
        L = this.loop.L,
        m = this.loop.m;
      // capsules and little crosses float round the card
      for (const c of this.caps) {
        const k = still ? 1 : pop(t, 0.8 + c.ph * 0.12, 0.5);
        if (k <= 0) continue;
        ctx.save();
        ctx.translate(c.x, c.y + Math.sin(tt * 1.2 + c.ph) * 5);
        ctx.rotate(c.ph + Math.sin(tt * 0.8 + c.ph) * 0.3);
        ctx.scale(k, k);
        if (c.k === 0) mdCapsule(ctx, c.s, MD.red, MD.white);
        else if (c.k === 1) mdCapsule(ctx, c.s, MD.teal, "#fde68a");
        else mdCross(ctx, c.s * 0.8, MD.mint);
        ctx.restore();
      }
      // a heartbeat runs all the way round the card: the line is drawn once, then the pulse travels along it
      {
        const g = still ? 1 : easeInOut(clamp((t - 0.2) / 2)),
          n = 260,
          amp = 13,
          beats = 9,
          pos = (i) => {
            const u = i / n,
              p = this.loop.at(u * L + m.left + m.side * 0.5),
              d = -mdBeat(u * beats) * amp;
            return [p.x + p.nx * (6 + d), p.y + p.ny * (6 + d)];
          };
        settle(this, "line", ctx, t, still, 2.4, 1, (c) => {
          c.lineJoin = "round";
          c.lineCap = "round";
          for (const [col, w] of [
            ["rgba(20,184,166,.25)", 9],
            [MD.ink, 5],
            [MD.teal, 2.6],
          ]) {
            c.beginPath();
            for (let i = 0; i <= n * g; i++) {
              const q = pos(i);
              c.lineTo(q[0], q[1]);
            }
            c.strokeStyle = col;
            c.lineWidth = w;
            c.stroke();
          }
        });
        const head = still ? 0.3 : (tt * 0.16) % 1;
        for (let j = 0; j < 26; j++) {
          const i = Math.round(head * n) - j;
          if (i < 0 || i > n * g) continue;
          const q = pos(i),
            q2 = pos(Math.max(0, i - 1));
          ctx.beginPath();
          ctx.moveTo(q2[0], q2[1]);
          ctx.lineTo(q[0], q[1]);
          ctx.strokeStyle = `rgba(220,255,250,${1 - j / 26})`;
          ctx.lineWidth = 3.4 - j * 0.08;
          ctx.lineCap = "round";
          ctx.stroke();
          if (j === 0) glow(ctx, q[0], q[1], 14, "rgba(153,246,228,.9)");
        }
      }
      // a strand of DNA turns beside the right edge
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.9) / 1.2)),
          x = CARD.w + 40,
          y0 = CARD.h * 0.2,
          h = CARD.h * 0.56 * k,
          n = 15;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.lineCap = "round";
        for (let i = 0; i <= n; i++) {
          const u = i / n,
            y = y0 + u * h;
          if (u > k) break;
          const ph = u * 7 - tt * 1.6,
            x1 = x + Math.sin(ph) * 13,
            x2 = x - Math.sin(ph) * 13,
            front = Math.cos(ph) > 0;
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.strokeStyle = MD.ink;
          ctx.lineWidth = 3.6;
          ctx.stroke();
          ctx.strokeStyle = i % 2 ? "#fde68a" : "#fda4af";
          ctx.lineWidth = 1.8;
          ctx.stroke();
          for (const [px, col, f] of [
            [x1, MD.teal, front],
            [x2, "#38bdf8", !front],
          ]) {
            ctx.beginPath();
            ctx.arc(px, y, f ? 5 : 3.6, 0, TAU);
            inked(ctx, col, 1.3, MD.ink);
          }
        }
        ctx.restore();
      }
      // a first-aid case in one corner; in the other a flask that bubbles
      {
        const k = still ? 1 : pop(t, 0.9, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(46, CARD.h + 56);
          ctx.scale(k, k);
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.roundRect(-11, -42, 22, 9, 4);
          ctx.strokeStyle = MD.ink;
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.beginPath();
          ctx.roundRect(-30, -36, 60, 36, 6);
          inked(
            ctx,
            grad(ctx, 0, -36, 0, 0, "#ffffff", "#cbd5e1"),
            1.8,
            MD.ink,
          );
          ctx.fillStyle = "rgba(11,42,51,.14)";
          ctx.fillRect(-30, -20, 60, 3);
          ctx.save();
          ctx.translate(0, -18);
          mdCross(ctx, 10, MD.teal);
          ctx.restore();
          for (const x of [-21, 21]) {
            ctx.beginPath();
            ctx.roundRect(x - 3, -22, 6, 7, 1.5);
            inked(ctx, "#94a3b8", 1.1, MD.ink);
          }
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.2, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w - 40, CARD.h + 56);
          ctx.scale(k, k);
          ctx.lineJoin = "round";
          const fl = () => {
            ctx.beginPath();
            ctx.moveTo(-6, -46);
            ctx.lineTo(-6, -30);
            ctx.lineTo(-22, -4);
            ctx.quadraticCurveTo(-24, 0, -18, 0);
            ctx.lineTo(18, 0);
            ctx.quadraticCurveTo(24, 0, 22, -4);
            ctx.lineTo(6, -30);
            ctx.lineTo(6, -46);
            ctx.closePath();
          };
          fl();
          ctx.fillStyle = "rgba(220,245,250,.22)";
          ctx.fill();
          ctx.save();
          fl();
          ctx.clip();
          ctx.fillStyle = grad(ctx, 0, -22, 0, 0, "#5eead4", "#0d9488");
          ctx.beginPath();
          ctx.moveTo(-30, -18 + Math.sin(tt * 2) * 1.2);
          ctx.quadraticCurveTo(0, -22 - Math.sin(tt * 2) * 1.6, 30, -18);
          ctx.lineTo(30, 4);
          ctx.lineTo(-30, 4);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.75)";
          for (let i = 0; i < 4; i++) {
            const q = (tt * 0.6 + i * 0.25) % 1;
            ctx.beginPath();
            ctx.arc(-9 + i * 6, -3 - q * 16, 1.4 + q * 1.4, 0, TAU);
            ctx.fill();
          }
          ctx.restore();
          glow(ctx, 0, -12, 34, "rgba(94,234,212,.3)");
          fl();
          ctx.strokeStyle = MD.ink;
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.beginPath();
          ctx.roundRect(-8, -49, 16, 4.6, 2);
          inked(ctx, "#e2e8f0", 1.3, MD.ink);
          for (let i = 0; i < 3; i++) {
            const q = (tt * 0.35 + i * 0.33) % 1;
            ctx.beginPath();
            ctx.arc(
              Math.sin(tt * 1.5 + i * 2) * 5,
              -54 - q * 26,
              2.4 + q * 2.4,
              0,
              TAU,
            );
            ctx.strokeStyle = `rgba(153,246,228,${0.8 * (1 - q)})`;
            ctx.lineWidth = 1.3;
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      // top edge: a stethoscope lies across it, and a heart that beats in time with the line
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.7) / 1.1)),
          tube = () => {
            ctx.beginPath();
            ctx.moveTo(CARD.w * 0.12, -44);
            ctx.bezierCurveTo(
              CARD.w * 0.1,
              -12,
              CARD.w * 0.2,
              2,
              CARD.w * 0.3,
              -4,
            );
            ctx.bezierCurveTo(
              CARD.w * 0.42,
              -10,
              CARD.w * 0.4,
              -34,
              CARD.w * 0.5,
              -28,
            );
            ctx.bezierCurveTo(
              CARD.w * 0.58,
              -22,
              CARD.w * 0.5,
              -8,
              CARD.w * 0.56,
              -10,
            );
          };
        ctx.save();
        ctx.setLineDash([400 * k, 600]);
        ctx.lineCap = "round";
        tube();
        ctx.strokeStyle = MD.ink;
        ctx.lineWidth = 8;
        ctx.stroke();
        tube();
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 5;
        ctx.stroke();
        tube();
        ctx.strokeStyle = "rgba(255,255,255,.25)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
        if (k > 0.2) {
          for (const dx of [-11, 11]) {
            ctx.beginPath();
            ctx.moveTo(CARD.w * 0.12, -44);
            ctx.quadraticCurveTo(
              CARD.w * 0.12 + dx * 0.4,
              -62,
              CARD.w * 0.12 + dx,
              -72,
            );
            ctx.strokeStyle = MD.ink;
            ctx.lineWidth = 5.4;
            ctx.lineCap = "round";
            ctx.stroke();
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 2.8;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(CARD.w * 0.12 + dx, -74, 3.6, 0, TAU);
            inked(ctx, "#1e293b", 1.2, MD.ink);
          }
        }
        if (k >= 1 || still) {
          const kk = still ? 1 : pop(t, 1.8, 0.4),
            b = Math.max(0, mdBeat(tt * 1.44 + 0.02));
          ctx.save();
          ctx.translate(CARD.w * 0.58, -14);
          ctx.scale(kk * (1 + b * 0.05), kk * (1 + b * 0.05));
          ctx.beginPath();
          ctx.arc(0, 0, 13, 0, TAU);
          inked(
            ctx,
            rgrad(ctx, -4, -4, 17, "#f8fafc", "#cbd5e1", "#64748b"),
            1.8,
            MD.ink,
          );
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, TAU);
          inked(ctx, "#e2e8f0", 1.3, MD.ink);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : bounceOut((t - 1.3) / 0.8);
        if (still || t > 1.3) {
          const b = Math.max(0, mdBeat(tt * 1.44));
          ctx.save();
          ctx.translate(CARD.w * 0.8, -40 - (1 - k) * 130);
          ctx.rotate(-0.08);
          mdHeart(ctx, 26, b);
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.6),
        R = AVATAR.r,
        g = still ? 1 : easeInOut(clamp((t - 0.3) / 1.2));
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        77,
        77,
        R + 3.5,
        [
          [MD.ink, 7.4],
          ["#134e4a", 4.8],
        ],
        tt,
      );
      // the pulse runs round the avatar too
      const n = 120,
        pos = (i) => {
          const u = i / n,
            an = -Math.PI / 2 + u * TAU,
            r = R + 10 + mdBeat(u * 4) * 8;
          return [77 + Math.cos(an) * r, 77 + Math.sin(an) * r];
        };
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const [col, w] of [
        [MD.ink, 4.6],
        [MD.teal, 2.2],
      ]) {
        ctx.beginPath();
        for (let i = 0; i <= n * g; i++) {
          const q = pos(i);
          ctx.lineTo(q[0], q[1]);
        }
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.stroke();
      }
      const head = still ? 0.2 : (tt * 0.3) % 1;
      for (let j = 0; j < 14; j++) {
        const i = Math.round(head * n) - j;
        if (i < 1 || i > n * g) continue;
        const q = pos(i),
          q2 = pos(i - 1);
        ctx.beginPath();
        ctx.moveTo(q2[0], q2[1]);
        ctx.lineTo(q[0], q[1]);
        ctx.strokeStyle = `rgba(220,255,250,${1 - j / 14})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        if (j === 0) glow(ctx, q[0], q[1], 10, "rgba(153,246,228,.9)");
      }
      ctx.restore();
      {
        const k = still ? 1 : pop(t, 1, 0.5),
          b = Math.max(0, mdBeat(tt * 1.44));
        ctx.save();
        ctx.translate(77 + 31, 77 - R + 2);
        ctx.rotate(0.2);
        ctx.scale(k, k);
        mdHeart(ctx, 10, b);
        ctx.restore();
      }
      {
        const k = still ? 1 : pop(t, 1.2, 0.5);
        ctx.save();
        ctx.translate(77 - 30, 77 + R - 1);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, TAU);
        inked(ctx, "#fff", 1.6, MD.ink);
        mdCross(ctx, 6.4, MD.teal);
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(ctx, CARD.w * 0.2, CARD.h * 0.8, 180, `rgba(20,184,166,${0.2 * a})`);
      glow(ctx, CARD.w * 0.9, CARD.h * 0.3, 150, `rgba(244,63,94,${0.12 * a})`);
      // a monitor trace crosses the foot of the card, leaving a tail
      {
        const y = CARD.h - 46,
          head = still ? 0.7 : (tt * 0.28) % 1.25;
        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.globalAlpha = a * 0.16;
        ctx.strokeStyle = MD.mint;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= CARD.w; x += 22) {
          ctx.moveTo(x, y - 30);
          ctx.lineTo(x, y + 22);
        }
        for (let yy = y - 30; yy <= y + 22; yy += 13) {
          ctx.moveTo(0, yy);
          ctx.lineTo(CARD.w, yy);
        }
        ctx.stroke();
        for (let i = 0; i < 90; i++) {
          const u = head - i / 150;
          if (u < 0 || u > 1) continue;
          const x0 = u * CARD.w,
            x1 = (u - 1 / 150) * CARD.w;
          ctx.beginPath();
          ctx.moveTo(x1, y - mdBeat((u - 1 / 150) * 3) * 26);
          ctx.lineTo(x0, y - mdBeat(u * 3) * 26);
          ctx.globalAlpha = a * (1 - i / 90) * 0.9;
          ctx.strokeStyle = MD.mint;
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
        if (head <= 1)
          glow(
            ctx,
            head * CARD.w,
            y - mdBeat(head * 3) * 26,
            12,
            `rgba(153,246,228,${0.9 * a})`,
          );
        ctx.restore();
      }
      // cells drift upwards
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = a * 0.3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const an = (i / 6) * TAU;
          ctx.lineTo(Math.cos(an) * p.s, Math.sin(an) * p.s);
        }
        ctx.closePath();
        ctx.strokeStyle = p.i % 3 ? MD.mint : "#fda4af";
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, p.s * 0.3, 0, TAU);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.restore();
      });
    },
  };
}
