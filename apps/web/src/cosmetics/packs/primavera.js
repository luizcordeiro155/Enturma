// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  lerp,
  smooth,
  easeOutCubic,
  easeOutBack,
  easeInOut,
  rng,
  glow,
  inked,
  pop,
  fade,
  grad,
  rgrad,
  leafPath,
  blinking,
  ringBase,
  Strand,
  strandLine,
  strandBits,
  Drift,
  settle,
  frameLoop,
  daisy,
  cardTheme,
} from "../kit";

// ---------- Primavera ----------
const PV = { ink: "#24402a", stem: "#3f9a55" };
// A butterfly around (0,0), heading up. `flap` 0 (open) to 1 (closed).
function pvButterfly(ctx, s, flap, c) {
  ctx.lineJoin = "round";
  const w = 1 - flap * 0.86;
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.scale(sx * w, 1);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.1);
    ctx.bezierCurveTo(s * 0.5, -s * 1.3, s * 1.5, -s * 1.1, s * 1.2, -s * 0.15);
    ctx.bezierCurveTo(s * 1.1, s * 0.2, s * 0.4, s * 0.15, 0, 0);
    ctx.closePath();
    inked(
      ctx,
      grad(ctx, 0, 0, s * 1.3, -s, c[0], c[1]),
      Math.max(0.9, s * 0.1),
      PV.ink,
    );
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s * 0.6, s * 0.1, s * 1.15, s * 0.5, s * 0.75, s * 1.0);
    ctx.bezierCurveTo(s * 0.4, s * 1.1, s * 0.1, s * 0.6, 0, s * 0.2);
    ctx.closePath();
    inked(ctx, c[1], Math.max(0.9, s * 0.1), PV.ink);
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.beginPath();
    ctx.arc(s * 0.9, -s * 0.6, s * 0.16, 0, TAU);
    ctx.arc(s * 0.62, s * 0.62, s * 0.11, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(0, s * 0.05, s * 0.12, s * 0.55, 0, 0, TAU);
  ctx.fillStyle = PV.ink;
  ctx.fill();
  ctx.strokeStyle = PV.ink;
  ctx.lineWidth = Math.max(0.7, s * 0.06);
  ctx.lineCap = "round";
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.45);
    ctx.quadraticCurveTo(sx * s * 0.2, -s * 0.9, sx * s * 0.4, -s * 1.0);
    ctx.stroke();
  }
}
// A tulip growing up from (0,0), `h` tall.
function pvTulip(ctx, h, color, dark, sway) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const tx = sway * h * 0.25;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(0, -h * 0.5, tx, -h);
  ctx.strokeStyle = PV.ink;
  ctx.lineWidth = 4.6;
  ctx.stroke();
  ctx.strokeStyle = PV.stem;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(0, -h * 0.12);
    ctx.rotate(-Math.PI / 2 + sx * 0.55 + sway * 0.2);
    leafPath(ctx, h * 0.5, h * 0.11);
    inked(ctx, grad(ctx, 0, 0, h * 0.5, 0, "#2f8a45", "#7bd389"), 1.2, PV.ink);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(tx, -h);
  ctx.rotate(sway * 0.3);
  const r = h * 0.2;
  ctx.beginPath();
  ctx.moveTo(-r, -r * 0.2);
  ctx.bezierCurveTo(-r * 1.1, r * 1.1, r * 1.1, r * 1.1, r, -r * 0.2);
  ctx.lineTo(r * 0.6, -r * 1.3);
  ctx.lineTo(r * 0.25, -r * 0.5);
  ctx.lineTo(0, -r * 1.5);
  ctx.lineTo(-r * 0.25, -r * 0.5);
  ctx.lineTo(-r * 0.6, -r * 1.3);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -r * 1.5, 0, r, color, dark), 1.4, PV.ink);
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -r * 0.2);
  ctx.quadraticCurveTo(-r * 0.45, r * 0.4, -r * 0.1, r * 0.7);
  ctx.strokeStyle = "rgba(255,255,255,.5)";
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
}
function pvBee(ctx, s, t) {
  ctx.lineJoin = "round";
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(-s * 0.1, -s * 0.45);
    ctx.rotate(sx * 0.5 + Math.sin(t * 60) * 0.5);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.45, s * 0.3, s * 0.55, 0, 0, TAU);
    ctx.fillStyle = "rgba(235,250,255,.8)";
    ctx.fill();
    ctx.strokeStyle = "rgba(60,90,110,.6)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.68, 0, 0, TAU);
  inked(ctx, "#ffd23c", Math.max(1, s * 0.13), "#2a2012");
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.94, s * 0.62, 0, 0, TAU);
  ctx.clip();
  ctx.fillStyle = "#2a2012";
  for (const x of [-0.25, 0.3]) ctx.fillRect(x * s, -s, s * 0.26, s * 2);
  ctx.restore();
  ctx.fillStyle = "#2a2012";
  ctx.beginPath();
  ctx.arc(-s * 0.62, -s * 0.12, s * 0.12, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(s * 1.35, 0);
  ctx.strokeStyle = "#2a2012";
  ctx.lineWidth = 1;
  ctx.stroke();
}
function pvBird(ctx, t, blink, sing) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const bob = Math.sin(t * 3) * 0.6;
  ctx.save();
  ctx.translate(-13, -9);
  ctx.rotate(-0.5 + Math.sin(t * 2.4) * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.lineTo(-17, -1);
  ctx.lineTo(-15, 5);
  ctx.lineTo(0, 4);
  ctx.closePath();
  inked(ctx, "#2f6fb5", 1.5, PV.ink);
  ctx.restore();
  ctx.strokeStyle = "#e09a2b";
  ctx.lineWidth = 1.8;
  for (const x of [-3, 4]) {
    ctx.beginPath();
    ctx.moveTo(x, -3);
    ctx.lineTo(x, 0);
    ctx.moveTo(x - 2.5, 0.5);
    ctx.lineTo(x + 2.5, 0.5);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, -13 + bob, 14.5, 12.5, -0.15, 0, TAU);
  inked(
    ctx,
    rgrad(ctx, -3, -18, 20, "#8fd0ff", "#3f8fd6", "#2a5f9e"),
    1.6,
    PV.ink,
  );
  ctx.beginPath();
  ctx.ellipse(3, -9 + bob, 8.5, 7.5, 0, 0, TAU);
  ctx.fillStyle = "#fff0d6";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, -6 + bob, 5, 3.6, 0, 0, TAU);
  ctx.fillStyle = "#ffb68a";
  ctx.fill();
  ctx.save();
  ctx.translate(-6, -12 + bob);
  ctx.rotate(0.5 + Math.sin(t * 5) * 0.06);
  ctx.beginPath();
  ctx.ellipse(0, 0, 8.5, 5.5, 0, 0, TAU);
  inked(ctx, "#2f6fb5", 1.4, PV.ink);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(13, -17 + bob);
  ctx.lineTo(20 + sing * 1.5, -15.5 + bob - sing * 2);
  ctx.lineTo(13, -13.5 + bob);
  ctx.closePath();
  inked(ctx, "#ffb23c", 1.2, PV.ink);
  if (sing > 0) {
    ctx.beginPath();
    ctx.moveTo(13, -14 + bob);
    ctx.lineTo(19, -12 + bob + sing * 2);
    ctx.lineTo(13, -12.5 + bob);
    ctx.closePath();
    inked(ctx, "#ffb23c", 1.2, PV.ink);
  }
  ctx.save();
  ctx.translate(7.5, -18 + bob);
  if (blink) {
    ctx.beginPath();
    ctx.moveTo(-2.4, 0);
    ctx.quadraticCurveTo(0, 1.6, 2.4, 0);
    ctx.strokeStyle = PV.ink;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, TAU);
    ctx.fillStyle = "#1c2a1c";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0.8, -0.8, 0.9, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }
  ctx.restore();
}
function pvSnail(ctx, t) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const st = Math.sin(t * 2) * 1.5;
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.quadraticCurveTo(-6, -7, 12 + st, -5);
  ctx.quadraticCurveTo(21 + st, -6, 21 + st, -15);
  ctx.quadraticCurveTo(26 + st, -5, 22 + st, 0);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -8, 0, 0, "#ffe2a8", "#e9b877"), 1.5, PV.ink);
  ctx.strokeStyle = PV.ink;
  ctx.lineWidth = 1.3;
  for (const dx of [-2, 3]) {
    ctx.beginPath();
    ctx.moveTo(21 + st + dx * 0.4, -14);
    ctx.lineTo(21 + st + dx, -23);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(21 + st + dx, -23.5, 1.5, 0, TAU);
    ctx.fillStyle = PV.ink;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(-2, -13, 13, 0, TAU);
  inked(
    ctx,
    rgrad(ctx, -6, -18, 18, "#ffb3c9", "#e0608a", "#a8345f"),
    1.6,
    PV.ink,
  );
  ctx.beginPath();
  for (let a2 = 0; a2 < 9.5; a2 += 0.25) {
    const rr = 10.5 * (1 - a2 / 11);
    ctx.lineTo(-2 + Math.cos(a2 + 2) * rr, -13 + Math.sin(a2 + 2) * rr);
  }
  ctx.strokeStyle = "rgba(90,20,50,.6)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Primavera",
    reach: { top: 66, side: 64, bottom: 62 },
    mat: ["#16301f", "#0c1a12"],
    theme: cardTheme("#3fae72", "#f06a9b"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.vine = Strand(
        this.loop,
        m.bl + m.arc * 0.5,
        m.arc * 0.5 + m.side + m.arc * 0.6,
        1,
        2,
        { off: 7, wave: 6, gap: 0.055, size: 14 },
      );
      this.vine2 = Strand(
        this.loop,
        m.br + m.arc * 0.5,
        m.arc * 0.5 + m.side + m.arc * 0.6,
        -1,
        13,
        { off: 7, wave: 6, gap: 0.055, size: 14 },
      );
      this.vine3 = Strand(
        this.loop,
        m.bl + m.arc * 0.5,
        m.arc * 0.5 + m.top * 0.5,
        -1,
        23,
        { off: 7, wave: 5, gap: 0.1, size: 13 },
      );
      this.t0 = 0.3;
      this.dur = 2.1;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.fx = Drift(16, 23, { v: [8, 20], s: [3, 7], sway: 16, spin: 2.4 });
      const R = rng(6);
      this.flies = [0, 1, 2, 3].map((i) => ({
        lag: i * 60 + R() * 30,
        off: 26 + R() * 30,
        s: 8 + R() * 3,
        ph: R() * TAU,
        c: [
          ["#ffd6f0", "#ff7fb0"],
          ["#d7f5ff", "#4aa3df"],
          ["#fff3b8", "#f7a531"],
          ["#e3d4ff", "#8a5cf6"],
        ][i],
        rest: [0.12, 0.42, 0.63, 0.88][i],
      }));
      this.tulips = [0.1, 0.2, 0.31, 0.44, 0.92].map((u, i) => ({
        u,
        h: 30 + R() * 18,
        c: [
          ["#ff7fa0", "#d93a6a"],
          ["#ffd23c", "#f2901f"],
          ["#c49bff", "#7a4be0"],
          ["#ff9d6b", "#e8552f"],
          ["#ff7fa0", "#d93a6a"],
        ][i],
        ph: R() * TAU,
      }));
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        L = this.loop.L;
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 8, (c) => {
        for (const v of [this.vine, this.vine2, this.vine3]) {
          strandLine(c, v, g, [
            [PV.ink, 6.4],
            ["#4fae5f", 3.8],
            ["rgba(200,255,190,.75)", 1.1],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2 + Math.sin(tt * 1.4 + b.ph) * 0.08);
            c.scale(k, k);
            if (b.kind < 0.45) {
              c.rotate(-Math.PI / 2 + (b.i % 2 ? 0.5 : -0.5));
              leafPath(c, b.s * 1.2, b.s * 0.42);
              inked(
                c,
                grad(c, 0, 0, b.s * 1.2, 0, "#2f8a45", "#8fe08a"),
                1.2,
                PV.ink,
              );
            } else {
              c.translate(0, -b.s * 0.7);
              c.rotate(tt * 0.2 + b.ph);
              const p = [
                ["#fff", "#ffd35c"],
                ["#ffd6e8", "#ff7fb0"],
                ["#fff3b8", "#f7a531"],
                ["#e3d4ff", "#8a5cf6"],
              ][b.i % 4];
              daisy(c, b.s * 0.82, b.i % 3 ? 6 : 8, p[0], p[1], PV.ink);
            }
          });
        }
      });
      // tulips come up along the top edge
      this.tulips.forEach((f, i) => {
        const k = still ? 1 : easeOutBack(clamp((t - 0.9 - i * 0.16) / 0.7));
        if (k <= 0) return;
        ctx.save();
        ctx.translate(CARD.w * f.u, 2);
        ctx.scale(1, k);
        pvTulip(ctx, f.h, f.c[0], f.c[1], Math.sin(tt * 1.5 + f.ph) * 0.35);
        ctx.restore();
      });
      // a bluebird lands among them and sings now and then
      {
        const k = still ? 1 : clamp((t - 2.2) / 0.6);
        if (k > 0) {
          const c = tt % 6,
            sing =
              !still && c > 4.4 && c < 5.6
                ? Math.abs(Math.sin((c - 4.4) * 10))
                : 0,
            hop = !still && c < 0.3 ? Math.sin((c / 0.3) * Math.PI) * 5 : 0;
          ctx.save();
          ctx.translate(
            CARD.w * 0.68 + (1 - easeOutCubic(k)) * 110,
            1 - (1 - easeOutBack(k)) * 80 - hop,
          );
          ctx.rotate((1 - k) * 0.5);
          ctx.scale(-1.75, 1.75);
          pvBird(ctx, tt, !still && blinking(tt, 3.1), sing);
          ctx.restore();
          if (sing > 0) {
            ctx.fillStyle = "#fff";
            ctx.font = "700 15px Arial, sans-serif";
            ctx.globalAlpha = sing;
            ctx.fillText(
              "♪",
              CARD.w * 0.68 - 46 - (c - 4.4) * 12,
              -34 - (c - 4.4) * 18,
            );
            ctx.globalAlpha = 1;
          }
        }
      }
      // a snail crosses the bottom, very slowly, and a mushroom family grows in the corner
      {
        const k = still ? 1 : pop(t, 1.2, 0.6);
        if (k > 0) {
          [
            [CARD.w - 46, 20, "#ff6f6f"],
            [CARD.w - 22, 14, "#ffb23c"],
            [CARD.w - 64, 12, "#ff6f6f"],
          ].forEach(([x, s, col], i) => {
            ctx.save();
            ctx.translate(x, CARD.h + 34);
            ctx.scale(k, k);
            ctx.beginPath();
            ctx.roundRect(-s * 0.22, -s * 0.9, s * 0.44, s * 0.9, s * 0.15);
            inked(ctx, "#fff3dc", 1.3, PV.ink);
            ctx.beginPath();
            ctx.moveTo(-s * 0.8, -s * 0.8);
            ctx.quadraticCurveTo(0, -s * 2.1, s * 0.8, -s * 0.8);
            ctx.quadraticCurveTo(0, -s * 0.6, -s * 0.8, -s * 0.8);
            ctx.closePath();
            inked(ctx, col, 1.4, PV.ink);
            ctx.fillStyle = "#fff";
            for (const [px, py, pr] of [
              [-0.3, -1.15, 0.13],
              [0.25, -1.3, 0.1],
              [0.35, -0.95, 0.08],
            ]) {
              ctx.beginPath();
              ctx.arc(px * s, py * s, pr * s, 0, TAU);
              ctx.fill();
            }
            ctx.restore();
          });
          const x = 34 + ((tt * 2.2) % (CARD.w * 0.45));
          ctx.save();
          ctx.translate(x, CARD.h + 34);
          ctx.scale(k * 1.1, k * 1.1);
          pvSnail(ctx, tt);
          ctx.restore();
        }
      }
      // butterflies fly a lap round the card on arrival, then keep to their own flowers
      const S = L * 1.05 * easeInOut(clamp(T / 2.8));
      for (const b of this.flies) {
        const settle2 = still ? 1 : smooth((t - 2.8) / 2),
          s = lerp(S - b.lag, b.rest * L, settle2);
        if (s < -30 && !still) continue;
        const p = this.loop.at(s),
          off = b.off + Math.sin(tt * 2.1 + b.ph) * 9;
        ctx.save();
        ctx.translate(
          p.x + p.nx * off + Math.sin(tt * 1.3 + b.ph) * 8 * settle2,
          p.y + p.ny * off + Math.cos(tt * 1.7 + b.ph) * 7,
        );
        ctx.rotate(
          Math.atan2(p.ty, p.tx) * (1 - settle2) +
            (Math.PI / 2) * (1 - settle2) +
            Math.sin(tt * 1.3 + b.ph) * 0.4,
        );
        ctx.globalAlpha = still ? 1 : clamp((s + 30) / 50);
        pvButterfly(
          ctx,
          b.s,
          still ? 0.15 : Math.abs(Math.sin(tt * 9 + b.ph)),
          b.c,
        );
        ctx.restore();
      }
      // a bee does figure eights by the right side
      {
        const a = still ? 1 : fade(t, 2.4, 0.8);
        if (a > 0) {
          const u = tt * 1.3;
          ctx.save();
          ctx.globalAlpha = a;
          ctx.translate(
            CARD.w + 34 + Math.sin(u) * 20,
            CARD.h * 0.5 + Math.sin(u * 2) * 26,
          );
          ctx.scale(Math.cos(u) > 0 ? 1 : -1, 1);
          ctx.rotate(Math.cos(u * 2) * 0.3);
          pvBee(ctx, 7.5, tt);
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
          [PV.ink, 7.4],
          ["#4fae5f", 4.6],
          ["#d7ffd0", 1.3],
        ],
        tt,
      );
      ctx.restore();
      // a wreath: leaves all the way round, flowers opening one by one
      for (let i = 0; i < 16; i++) {
        const an = (i / 16) * TAU,
          k = still ? 1 : pop(t, 0.3 + i * 0.05, 0.4);
        if (k <= 0) continue;
        ctx.save();
        ctx.translate(77 + Math.cos(an) * (R + 6), 77 + Math.sin(an) * (R + 6));
        ctx.rotate(an + 0.5 + Math.sin(tt * 1.6 + i) * 0.08);
        ctx.scale(k, k);
        leafPath(ctx, 13, 4.4);
        inked(ctx, i % 2 ? "#57c785" : "#2f8a45", 1.1, PV.ink);
        ctx.restore();
      }
      [
        [-2.2, 9, 0],
        [-1.25, 7, 1],
        [-0.45, 8, 3],
        [0.9, 7, 2],
        [2.4, 8.5, 1],
        [3.5, 7, 3],
      ].forEach(([an, r, ci], i) => {
        const k = still ? 1 : pop(t, 1 + i * 0.12, 0.45);
        if (k <= 0) return;
        const p = [
          ["#fff", "#ffd35c"],
          ["#ffd6e8", "#ff7fb0"],
          ["#fff3b8", "#f7a531"],
          ["#e3d4ff", "#8a5cf6"],
        ][ci];
        ctx.save();
        ctx.translate(77 + Math.cos(an) * (R + 9), 77 + Math.sin(an) * (R + 9));
        ctx.rotate(tt * 0.25 + i);
        ctx.scale(k, k);
        daisy(ctx, r, i % 2 ? 6 : 8, p[0], p[1], PV.ink);
        ctx.restore();
      });
      {
        const k = still ? 1 : fade(t, 1.8, 0.7);
        if (k > 0) {
          ctx.save();
          ctx.globalAlpha = k;
          ctx.translate(
            77 + 34 + (1 - k) * 40,
            77 - R - 2 - (1 - k) * 30 + Math.sin(tt * 2) * 1.5,
          );
          ctx.rotate(0.5);
          pvButterfly(ctx, 9, still ? 0.15 : Math.abs(Math.sin(tt * 7)) * 0.9, [
            "#ffd6f0",
            "#ff7fb0",
          ]);
          ctx.restore();
        }
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      // morning light from the corner, pollen and petals in the air
      ctx.save();
      ctx.globalAlpha = a * 0.5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(CARD.w * (0.25 + i * 0.26), CARD.h * 0.75);
        ctx.lineTo(CARD.w * (0.38 + i * 0.26), CARD.h * 0.75);
        ctx.closePath();
        ctx.fillStyle = grad(
          ctx,
          0,
          0,
          CARD.w * 0.6,
          CARD.h * 0.75,
          `rgba(255,244,180,${0.16 + 0.05 * Math.sin(tt * 0.8 + i)})`,
          "rgba(255,244,180,0)",
        );
        ctx.fill();
      }
      ctx.restore();
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = a * 0.6;
        if (p.k < 0.5) {
          leafPath(ctx, p.s * 1.6, p.s * 0.6);
          ctx.fillStyle = p.k < 0.25 ? "#ffc2dc" : "#fff";
          ctx.fill();
        } else glow(ctx, 0, 0, p.s * 1.2, "rgba(255,240,150,.9)");
        ctx.restore();
      });
    },
  };
}
