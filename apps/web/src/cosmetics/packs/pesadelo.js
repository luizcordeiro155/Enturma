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
  pop,
  fade,
  grad,
  rgrad,
  blinking,
  Strand,
  strandBits,
  settle,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Pesadelo ----------
// Black and white only. Black shapes carry a bone-white rim so they read on the dark profile.
const PD = {
  ink: "#08080a",
  bone: "#e9e6df",
  grey: "#8b8b93",
  dark: "#3c3c44",
  rim: "rgba(233,230,223,.8)",
};
const pdFill = (ctx, lw = 1.5, fill = PD.ink) => {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = PD.rim;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.stroke();
};
// A hooded figure rising behind an edge at (0,0): hollow eyes, hands of bone gripping the edge.
function pdReaper(ctx, t, glare, blink) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const sw = Math.sin(t * 0.9) * 1.6;
  // the scythe
  ctx.save();
  ctx.translate(34, 0);
  ctx.rotate(0.1 + Math.sin(t * 0.7) * 0.015);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(4, -104);
  ctx.strokeStyle = PD.rim;
  ctx.lineWidth = 6.4;
  ctx.stroke();
  ctx.strokeStyle = PD.dark;
  ctx.lineWidth = 3.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, -100);
  ctx.bezierCurveTo(-24, -118, -58, -104, -70, -74);
  ctx.bezierCurveTo(-50, -94, -24, -98, 4, -88);
  ctx.closePath();
  ctx.fillStyle = grad(ctx, -70, -110, 4, -80, "#ffffff", "#b9b9c2", "#55555e");
  ctx.fill();
  ctx.strokeStyle = PD.ink;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
  // robe and hood
  ctx.beginPath();
  ctx.moveTo(-34, 4);
  ctx.bezierCurveTo(-36, -30, -30, -52, -19 + sw, -70);
  ctx.bezierCurveTo(-13 + sw, -92, 13 + sw, -92, 19 + sw, -70);
  ctx.bezierCurveTo(30, -52, 36, -30, 34, 4);
  ctx.closePath();
  pdFill(ctx, 1.8);
  ctx.strokeStyle = "rgba(233,230,223,.16)";
  ctx.lineWidth = 1.1;
  for (const x of [-20, -8, 9, 21]) {
    ctx.beginPath();
    ctx.moveTo(x * 0.6 + sw * 0.4, -52);
    ctx.quadraticCurveTo(x * 0.9, -26, x, 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(sw, -68, 12.5, 15, 0, 0, TAU);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.strokeStyle = "rgba(233,230,223,.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
  for (const sx of [-1, 1]) {
    const x = sw + sx * 5,
      y = -69;
    if (blink) continue;
    glow(ctx, x, y, 8 + glare * 8, `rgba(255,255,255,${0.45 + glare * 0.5})`);
    ctx.beginPath();
    ctx.ellipse(x, y, 2.3, 2.3 + glare, 0, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }
  // hands on the edge
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * 24, 0);
    ctx.beginPath();
    ctx.moveTo(sx * -2, -26);
    ctx.quadraticCurveTo(sx * 3, -14, 0, -3);
    ctx.strokeStyle = PD.ink;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = PD.rim;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    for (let f = -2; f <= 2; f++) {
      const x = f * 3.6,
        tap =
          Math.max(0, Math.sin(t * 5 - f * 0.9 * sx)) * (t % 7 > 5.4 ? 2.4 : 0);
      ctx.beginPath();
      ctx.moveTo(x * 0.6, -6);
      ctx.lineTo(x, -1 - tap);
      ctx.lineTo(x * 1.1, 7 - tap);
      ctx.strokeStyle = PD.ink;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = PD.bone;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.fillStyle = PD.ink;
      ctx.beginPath();
      ctx.arc(x, -1 - tap, 0.9, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
// A crow standing on (0,0), facing left.
function pdCrow(ctx, t, caw, blink) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const bob = Math.sin(t * 2.4) * 0.6;
  ctx.strokeStyle = PD.grey;
  ctx.lineWidth = 1.5;
  for (const x of [-2, 4]) {
    ctx.beginPath();
    ctx.moveTo(x, -5);
    ctx.lineTo(x, 0);
    ctx.moveTo(x - 3, 0.5);
    ctx.lineTo(x + 2, 0.5);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(8, -9);
  ctx.lineTo(26, -2);
  ctx.lineTo(23, -8);
  ctx.lineTo(28, -9);
  ctx.lineTo(12, -15);
  ctx.closePath();
  pdFill(ctx, 1.3);
  ctx.beginPath();
  ctx.ellipse(1, -12 + bob, 13, 9.5, 0.25, 0, TAU);
  pdFill(ctx, 1.4);
  ctx.beginPath();
  ctx.moveTo(-4, -14 + bob);
  ctx.quadraticCurveTo(8, -18 + bob, 18, -8 + bob);
  ctx.quadraticCurveTo(6, -6 + bob, -4, -14 + bob);
  ctx.fillStyle = "#1c1c22";
  ctx.fill();
  ctx.strokeStyle = "rgba(233,230,223,.35)";
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.save();
  ctx.translate(-10, -20 + bob);
  ctx.rotate(-caw * 0.3);
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, 0, TAU);
  pdFill(ctx, 1.4);
  ctx.beginPath();
  ctx.moveTo(-6, -2.5);
  ctx.lineTo(-17, 0.5 - caw * 3);
  ctx.lineTo(-6, 1);
  ctx.closePath();
  pdFill(ctx, 1.1, PD.dark);
  if (caw > 0.1) {
    ctx.beginPath();
    ctx.moveTo(-6, 1);
    ctx.lineTo(-15, 2 + caw * 5);
    ctx.lineTo(-5.5, 3.5);
    ctx.closePath();
    pdFill(ctx, 1.1, PD.dark);
  }
  if (!blink) {
    ctx.beginPath();
    ctx.arc(-2.2, -1.6, 2.1, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2.6, -1.6, 0.8, 0, TAU);
    ctx.fillStyle = PD.ink;
    ctx.fill();
  }
  ctx.restore();
}
function pdStone(ctx, w, h, kind) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (kind === 0) {
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2, -h * 0.6);
    ctx.quadraticCurveTo(-w / 2, -h, 0, -h);
    ctx.quadraticCurveTo(w / 2, -h, w / 2, -h * 0.6);
    ctx.lineTo(w / 2, 0);
  } else {
    const a = w * 0.17;
    ctx.moveTo(-a, 0);
    ctx.lineTo(-a, -h * 0.58);
    ctx.lineTo(-w / 2, -h * 0.58);
    ctx.lineTo(-w / 2, -h * 0.8);
    ctx.lineTo(-a, -h * 0.8);
    ctx.lineTo(-a, -h);
    ctx.lineTo(a, -h);
    ctx.lineTo(a, -h * 0.8);
    ctx.lineTo(w / 2, -h * 0.8);
    ctx.lineTo(w / 2, -h * 0.58);
    ctx.lineTo(a, -h * 0.58);
    ctx.lineTo(a, 0);
  }
  ctx.closePath();
  ctx.fillStyle = grad(ctx, -w / 2, -h, w / 2, 0, "#6a6a74", "#26262c");
  ctx.fill();
  ctx.strokeStyle = PD.rim;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.strokeStyle = "rgba(8,8,10,.7)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  if (kind === 0) {
    ctx.moveTo(-w * 0.22, -h * 0.62);
    ctx.lineTo(w * 0.22, -h * 0.62);
    ctx.moveTo(-w * 0.16, -h * 0.46);
    ctx.lineTo(w * 0.16, -h * 0.46);
    ctx.moveTo(w * 0.1, -h * 0.95);
    ctx.lineTo(w * 0.02, -h * 0.76);
    ctx.lineTo(w * 0.14, -h * 0.7);
  }
  ctx.stroke();
}
function pdSkull(ctx, s) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, s * 0.5);
  ctx.lineTo(-s * 0.56, s * 0.1);
  ctx.bezierCurveTo(-s * 1.2, -s * 0.1, -s * 0.9, -s * 1.1, 0, -s * 1.1);
  ctx.bezierCurveTo(s * 0.9, -s * 1.1, s * 1.2, -s * 0.1, s * 0.56, s * 0.1);
  ctx.lineTo(s * 0.5, s * 0.5);
  ctx.closePath();
  ctx.fillStyle = grad(ctx, 0, -s, 0, s * 0.5, "#fff", PD.bone, "#a9a69f");
  ctx.fill();
  ctx.strokeStyle = PD.ink;
  ctx.lineWidth = Math.max(1, s * 0.11);
  ctx.stroke();
  ctx.fillStyle = PD.ink;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * s * 0.38, -s * 0.3, s * 0.24, s * 0.28, sx * 0.2, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.06);
  ctx.lineTo(-s * 0.1, s * 0.16);
  ctx.lineTo(s * 0.1, s * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PD.ink;
  ctx.lineWidth = Math.max(0.8, s * 0.07);
  for (const x of [-0.25, 0, 0.25]) {
    ctx.beginPath();
    ctx.moveTo(x * s, s * 0.26);
    ctx.lineTo(x * s, s * 0.5);
    ctx.stroke();
  }
}

export default function create(CARD, AVATAR) {
  return {
    name: "Pesadelo",
    reach: { top: 112, side: 68, bottom: 70 },
    mat: ["#1a1a1f", "#08080a"],
    theme: cardTheme("#4a4a54", "#101014"),
    init() {
      this.loop = frameLoop(CARD, 7);
      const m = this.loop.m;
      // two dead trees grow from the bottom corners up the sides
      this.tree = [
        Strand(
          this.loop,
          m.bl + m.arc * 0.6,
          m.arc * 0.4 + m.side * 0.92,
          1,
          6,
          {
            off: 9,
            wave: 8,
            freq: 13,
            gap: 0.07,
            size: 17,
            taper: 0.5,
            outward: 0.86,
          },
        ),
        Strand(
          this.loop,
          m.br + m.arc * 0.4,
          m.arc * 0.6 + m.side * 0.86,
          -1,
          17,
          {
            off: 9,
            wave: 8,
            freq: 13,
            gap: 0.075,
            size: 17,
            taper: 0.5,
            outward: 0.86,
          },
        ),
      ];
      this.t0 = 0.4;
      this.dur = 2.2;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      const R = rng(29);
      this.eyes = [];
      for (let i = 0; i < 10; i++) {
        const an = R() * TAU;
        this.eyes.push({
          x: CARD.w / 2 + Math.cos(an) * (CARD.w / 2 + 30 + R() * 34),
          y: CARD.h / 2 + Math.sin(an) * (CARD.h / 2 + 24 + R() * 34),
          r: 2 + R() * 2.6,
          ph: R() * 9,
          every: 4 + R() * 5,
          pair: R() < 0.6,
        });
      }
      this.inner = [];
      for (let i = 0; i < 5; i++)
        this.inner.push({
          x: 20 + R() * (CARD.w - 40),
          y: CARD.h * 0.56 + R() * (CARD.h * 0.3),
          r: 2.6 + R() * 2.4,
          ph: R() * 9,
          every: 6 + R() * 5,
        });
      this.flock = [];
      for (let i = 0; i < 9; i++)
        this.flock.push({
          lag: i * 30 + R() * 20,
          off: 30 + R() * 50,
          s: 0.5 + R() * 0.5,
          ph: R() * TAU,
          fs: 9 + R() * 5,
        });
      this.shadows = [];
      for (let i = 0; i < 6; i++)
        this.shadows.push({
          x: 14 + ((CARD.w - 28) * i) / 5 + (R() - 0.5) * 18,
          h: 60 + R() * 110,
          ph: R() * TAU,
          w: 5 + R() * 5,
        });
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1.2),
        L = this.loop.L;
      // a pale moon, half behind cloud
      {
        const mx = CARD.w * 0.8,
          my = -66;
        ctx.save();
        ctx.globalAlpha = a;
        glow(ctx, mx, my, 76, "rgba(233,230,223,.3)");
        ctx.beginPath();
        ctx.arc(mx, my, 27, 0, TAU);
        ctx.fillStyle = rgrad(
          ctx,
          mx - 8,
          my - 9,
          34,
          "#ffffff",
          "#d8d5ce",
          "#8f8d88",
        );
        ctx.fill();
        ctx.fillStyle = "rgba(60,60,68,.3)";
        [
          [-8, -5, 6],
          [7, 7, 7.5],
          [9, -11, 4],
        ].forEach(([x, y, r]) => {
          ctx.beginPath();
          ctx.arc(mx + x, my + y, r, 0, TAU);
          ctx.fill();
        });
        for (let i = 0; i < 3; i++) {
          const x = ((tt * (4 + i * 2) + i * 150) % (CARD.w + 200)) - 100;
          ctx.fillStyle = "rgba(20,20,24,.82)";
          ctx.beginPath();
          ctx.ellipse(x, my - 8 + i * 13, 50, 7, 0, 0, TAU);
          ctx.ellipse(x + 34, my - 3 + i * 13, 34, 6, 0, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
      // eyes open in the dark round the card, look, and close
      for (const e of this.eyes) {
        const c = (tt + e.ph) % e.every,
          op = still
            ? e.ph % 2 < 1
              ? 1
              : 0
            : t < 2
              ? 0
              : c < 0.25
                ? c / 0.25
                : c < e.every * 0.5
                  ? 1
                  : c < e.every * 0.5 + 0.25
                    ? 1 - (c - e.every * 0.5) / 0.25
                    : 0;
        if (op <= 0) continue;
        for (const dx of e.pair ? [-e.r * 1.6, e.r * 1.6] : [0]) {
          glow(ctx, e.x + dx, e.y, e.r * 3.4, `rgba(255,255,255,${0.2 * op})`);
          ctx.beginPath();
          ctx.ellipse(e.x + dx, e.y, e.r * 1.25, e.r * op, 0, 0, TAU);
          ctx.fillStyle = "#fff";
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(
            e.x + dx + Math.sin(tt * 0.7 + e.ph) * e.r * 0.5,
            e.y,
            e.r * 0.3,
            e.r * 0.86 * op,
            0,
            0,
            TAU,
          );
          ctx.fillStyle = PD.ink;
          ctx.fill();
        }
      }
      // the dead trees
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 5, (c) => {
        for (const v of this.tree) {
          const last = Math.min(v.n, Math.floor(clamp(g) * v.n));
          if (last < 2) continue;
          c.lineCap = "round";
          c.lineJoin = "round";
          for (const [col, extra] of [
            [PD.rim, 2.8],
            [PD.ink, 0],
          ])
            for (let i = 1; i <= last; i++) {
              const p0 = v.pts[i - 1],
                p1 = v.pts[i];
              c.beginPath();
              c.moveTo(p0.x, p0.y);
              c.lineTo(p1.x, p1.y);
              c.strokeStyle = col;
              c.lineWidth = lerp(13, 2.6, i / v.n) + extra;
              c.stroke();
            }
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(
              b.a + (b.i % 2 ? 0.5 : -0.5) + Math.sin(tt * 0.9 + b.ph) * 0.03,
            );
            c.scale(k, k);
            const l = b.s * 1.5,
              tw = () => {
                c.beginPath();
                c.moveTo(0, 0);
                c.quadraticCurveTo(l * 0.5, -l * 0.16, l, l * 0.06);
                c.moveTo(l * 0.45, -l * 0.08);
                c.lineTo(l * 0.72, -l * 0.42);
                c.moveTo(l * 0.66, -l * 0.02);
                c.lineTo(l * 0.94, l * 0.34);
                c.moveTo(l * 0.58, -l * 0.25);
                c.lineTo(l * 0.5, -l * 0.5);
              };
            tw();
            c.strokeStyle = PD.rim;
            c.lineWidth = 4.8;
            c.stroke();
            tw();
            c.strokeStyle = PD.ink;
            c.lineWidth = 2.6;
            c.stroke();
          });
        }
      });
      // a graveyard along the bottom, mist over it, a hand of bone coming up
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.5) / 1));
        ctx.save();
        ctx.translate(0, CARD.h + 52);
        ctx.beginPath();
        ctx.moveTo(-30, 12);
        ctx.quadraticCurveTo(CARD.w * 0.25, -8 * k, CARD.w * 0.5, 0);
        ctx.quadraticCurveTo(CARD.w * 0.75, -6 * k, CARD.w + 30, 12);
        ctx.closePath();
        pdFill(ctx, 1.4);
        ctx.restore();
        [
          [CARD.w * 0.5 - 20, 22, 30, 0, -0.06, 0.8],
          [CARD.w * 0.5 + 22, 20, 36, 1, 0.08, 0.95],
          [CARD.w * 0.72, 18, 24, 0, 0.12, 1.1],
          [CARD.w * 0.3, 16, 28, 1, -0.14, 1.25],
        ].forEach(([x, w, h, kind, r, d]) => {
          const kk = still ? 1 : easeOutBack(clamp((t - d) / 0.5));
          if (kk <= 0) return;
          ctx.save();
          ctx.translate(x, CARD.h + 52);
          ctx.rotate(r);
          ctx.scale(1, kk);
          pdStone(ctx, w, h, kind);
          ctx.restore();
        });
        {
          const c = (tt + 1) % 7,
            up = still
              ? 0.8
              : t < 2.6
                ? 0
                : c < 1
                  ? easeOutCubic(c)
                  : c < 4
                    ? 1
                    : c < 5
                      ? 1 - smooth(c - 4)
                      : 0;
          if (up > 0) {
            ctx.save();
            ctx.translate(CARD.w * 0.5, CARD.h + 52);
            ctx.beginPath();
            ctx.rect(-30, -60, 60, 60);
            ctx.clip();
            ctx.translate(0, (1 - up) * 44);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            const draw = (col, w0, w1) => {
              ctx.strokeStyle = col;
              ctx.lineWidth = w0;
              ctx.beginPath();
              ctx.moveTo(0, 6);
              ctx.lineTo(0, -16);
              ctx.stroke();
              ctx.lineWidth = w1;
              for (let f = -2; f <= 2; f++) {
                ctx.beginPath();
                ctx.moveTo(f * 1.8, -15);
                ctx.lineTo(f * 4.2, -25);
                ctx.lineTo(
                  f * 4.6 + Math.sin(tt * 3 + f) * 1.4,
                  -34 + Math.abs(f) * 2.6,
                );
                ctx.stroke();
              }
            };
            draw(PD.ink, 8.4, 4.6);
            draw(PD.bone, 5.4, 2.4);
            ctx.restore();
          }
        }
        for (let i = 0; i < 5; i++)
          glow(
            ctx,
            ((i * 110 + tt * 8) % (CARD.w + 240)) - 120,
            CARD.h + 44 + Math.sin(tt * 0.6 + i) * 5,
            62,
            `rgba(233,230,223,${0.14 * a})`,
          );
      }
      // crows wheel round the card on arrival; one stays on the top edge
      const S = L * 1.1 * easeInOut(clamp(T / 2.8));
      if (!still)
        for (const b of this.flock) {
          const gone = smooth((t - 2.6 - b.ph * 0.1) / 0.8);
          if (gone >= 1) continue;
          const s = S - b.lag;
          if (s < -30) continue;
          const p = this.loop.at(s),
            off = b.off + Math.sin(tt * 2 + b.ph) * 8 + gone * 130,
            fl = Math.sin(tt * b.fs + b.ph) * 6;
          ctx.save();
          ctx.translate(p.x + p.nx * off, p.y + p.ny * off);
          ctx.rotate(Math.atan2(p.ty, p.tx));
          ctx.scale(b.s, b.s);
          ctx.globalAlpha = clamp((s + 30) / 50) * (1 - gone);
          ctx.beginPath();
          ctx.moveTo(-20, fl);
          ctx.quadraticCurveTo(-9, -8 - fl, 0, 0);
          ctx.quadraticCurveTo(9, -8 - fl, 20, fl);
          ctx.quadraticCurveTo(7, 2, 0, 6);
          ctx.quadraticCurveTo(-7, 2, -20, fl);
          ctx.closePath();
          pdFill(ctx, 1.4);
          ctx.restore();
        }
      {
        const k = still ? 1 : clamp((t - 2.5) / 0.6);
        if (k > 0) {
          const c = tt % 6.5,
            caw =
              !still && c > 5 && c < 6 ? Math.abs(Math.sin((c - 5) * 9)) : 0;
          ctx.save();
          ctx.translate(
            CARD.w * 0.76 + (1 - easeOutCubic(k)) * 110,
            1 - (1 - easeOutBack(k)) * 70,
          );
          ctx.scale(1.5, 1.5);
          pdCrow(ctx, tt, caw, !still && blinking(tt, 3.6));
          ctx.restore();
        }
      }
      // the figure in the hood rises behind the top edge
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 1.2) / 1.6));
        if (k > 0) {
          const c = tt % 8,
            glare = still
              ? 0.2
              : t > 2.8 && t < 3.6
                ? Math.sin(((t - 2.8) / 0.8) * Math.PI)
                : c > 6.6 && c < 7.6
                  ? Math.sin((c - 6.6) * Math.PI) * 0.8
                  : 0.1 + 0.1 * Math.sin(tt * 2);
          ctx.save();
          ctx.beginPath();
          ctx.rect(-120, -260, CARD.w + 240, 268);
          ctx.clip();
          ctx.translate(CARD.w * 0.3, 2 + (1 - k) * 110);
          pdReaper(ctx, tt, glare, !still && blinking(tt, 5.3));
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r,
        g = still ? 1 : easeInOut(clamp((t - 0.3) / 1.3));
      // a ring of thorns closes round the avatar
      ctx.save();
      ctx.globalAlpha = a;
      ctx.lineCap = "round";
      for (const [col, w] of [
        [PD.rim, 8],
        [PD.ink, 5.4],
      ]) {
        ctx.beginPath();
        for (let i = 0; i <= 80 * g; i++) {
          const an = -Math.PI / 2 + (i / 80) * TAU,
            r = R + 5 + Math.sin(i * 0.9) * 2.2;
          ctx.lineTo(77 + Math.cos(an) * r, 77 + Math.sin(an) * r);
        }
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.stroke();
      }
      for (let i = 0; i < 18; i++) {
        if (i / 18 > g) continue;
        const an = -Math.PI / 2 + (i / 18) * TAU,
          x = 77 + Math.cos(an) * (R + 5),
          y = 77 + Math.sin(an) * (R + 5),
          out = i % 2 ? 1 : -0.5;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(an + ((i % 3) - 1) * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(out * 11, 0);
        ctx.lineTo(0, 3);
        ctx.closePath();
        pdFill(ctx, 1.1);
        ctx.restore();
      }
      ctx.restore();
      {
        const k = still ? 1 : pop(t, 1.3, 0.5);
        ctx.save();
        ctx.translate(77, 77 + R + 9);
        ctx.rotate(Math.sin(tt * 1.2) * 0.05);
        ctx.scale(k, k);
        pdSkull(ctx, 9.5);
        ctx.restore();
      }
      {
        const k = still ? 1 : clamp((t - 1.7) / 0.6);
        if (k > 0) {
          const c = (tt + 2) % 6.5,
            caw =
              !still && c > 5 && c < 6 ? Math.abs(Math.sin((c - 5) * 9)) : 0;
          ctx.save();
          ctx.translate(
            77 + 30 + (1 - easeOutCubic(k)) * 60,
            77 - R - 4 - (1 - easeOutBack(k)) * 40,
          );
          ctx.rotate(0.3);
          ctx.scale(0.95, 0.95);
          pdCrow(ctx, tt, caw, !still && blinking(tt, 3.1, 1));
          ctx.restore();
        }
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      // the dark closes in at the edges, long fingers of shadow climb from below, mist drifts
      ctx.fillStyle = rgrad(
        ctx,
        CARD.w / 2,
        CARD.h / 2,
        Math.max(CARD.w, CARD.h) * 0.72,
        "rgba(0,0,0,0)",
        "rgba(0,0,0,0)",
        `rgba(0,0,0,${0.62 * a})`,
      );
      ctx.fillRect(0, 0, CARD.w, CARD.h);
      ctx.save();
      ctx.lineCap = "round";
      for (const s of this.shadows) {
        const up = still
            ? 0.7
            : smooth((t - 0.8) / 2.4) *
              (0.72 + 0.28 * Math.sin(tt * 0.5 + s.ph)),
          h = s.h * up;
        if (h < 4) continue;
        const tip = [s.x + Math.sin(tt * 0.7 + s.ph) * 14, CARD.h - h];
        ctx.beginPath();
        ctx.moveTo(s.x - s.w, CARD.h + 4);
        ctx.quadraticCurveTo(
          s.x - s.w * 0.4 + Math.sin(tt * 0.9 + s.ph) * 8,
          CARD.h - h * 0.5,
          tip[0],
          tip[1],
        );
        ctx.quadraticCurveTo(
          s.x + s.w * 0.4 + Math.sin(tt * 0.9 + s.ph) * 8,
          CARD.h - h * 0.5,
          s.x + s.w,
          CARD.h + 4,
        );
        ctx.closePath();
        ctx.fillStyle = `rgba(0,0,0,${0.7 * a})`;
        ctx.fill();
      }
      ctx.restore();
      for (const e of this.inner) {
        const c = (tt + e.ph) % e.every,
          op = still
            ? e.ph % 3 < 1
              ? 1
              : 0
            : t < 2.4
              ? 0
              : c < 0.25
                ? c / 0.25
                : c < 2.4
                  ? 1
                  : c < 2.65
                    ? 1 - (c - 2.4) / 0.25
                    : 0;
        if (op <= 0) continue;
        for (const dx of [-e.r * 1.7, e.r * 1.7]) {
          glow(
            ctx,
            e.x + dx,
            e.y,
            e.r * 3.6,
            `rgba(255,255,255,${0.16 * op * a})`,
          );
          ctx.beginPath();
          ctx.ellipse(e.x + dx, e.y, e.r * 1.2, e.r * op, 0, 0, TAU);
          ctx.fillStyle = `rgba(255,255,255,${0.75 * a})`;
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(e.x + dx, e.y, e.r * 0.26, e.r * 0.8 * op, 0, 0, TAU);
          ctx.fillStyle = "#000";
          ctx.fill();
        }
      }
      for (let i = 0; i < 4; i++)
        glow(
          ctx,
          ((i * 130 + tt * 10) % (CARD.w + 240)) - 120,
          CARD.h - 26 + Math.sin(tt * 0.5 + i) * 8,
          100,
          `rgba(233,230,223,${0.1 * a})`,
        );
      // grain, like a worn reel
      if (!still) {
        const s = Math.floor(tt * 16);
        ctx.fillStyle = "rgba(233,230,223,.5)";
        for (let i = 0; i < 26; i++) {
          const q =
              Math.abs(Math.sin(s * 12.9898 + i * 78.233) * 43758.5453) % 1,
            q2 = Math.abs(Math.sin(s * 4.1 + i * 39.3) * 24634.63) % 1;
          ctx.globalAlpha = 0.1 + q * 0.2;
          ctx.fillRect(q * CARD.w, q2 * CARD.h, 1.3, 1.3);
        }
        ctx.globalAlpha = 1;
        const q = Math.abs(Math.sin(s * 3.17) * 999) % 1;
        if (q < 0.1) {
          ctx.fillStyle = `rgba(233,230,223,${0.14 + q})`;
          ctx.fillRect(q * 9 * CARD.w, 0, 1, CARD.h);
        }
      }
    },
  };
}
