// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutCubic,
  easeOutBack,
  rng,
  Particles,
  glow,
  inked,
  pop,
  fade,
  grad,
  rgrad,
  leafPath,
  ringBase,
  Strand,
  strandLine,
  strandBits,
  Drift,
  settle,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Verão ----------
const VR = { ink: "#12384a", sand: "#ffd99a" };
function vrHibiscus(ctx, r, c0, c1) {
  ctx.lineJoin = "round";
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i * TAU) / 5);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-r * 0.75, -r * 0.3, -r * 0.6, -r * 1.1, 0, -r);
    ctx.bezierCurveTo(r * 0.6, -r * 1.1, r * 0.75, -r * 0.3, 0, 0);
    ctx.closePath();
    inked(ctx, grad(ctx, 0, 0, 0, -r, c1, c0), Math.max(0.9, r * 0.08), VR.ink);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(r * 0.3, -r * 0.4, r * 0.55, -r * 0.75);
  ctx.strokeStyle = "#ffe27a";
  ctx.lineWidth = Math.max(1.2, r * 0.12);
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.fillStyle = "#ffb23c";
  for (const [x, y] of [
    [0.55, -0.75],
    [0.42, -0.86],
    [0.66, -0.62],
  ]) {
    ctx.beginPath();
    ctx.arc(x * r, y * r, r * 0.08, 0, TAU);
    ctx.fill();
  }
}
// A palm growing from (0,0), leaning by `lean`, fronds swaying with t.
function vrPalm(ctx, h, lean, t) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const top = [lean * h * 0.5, -h],
    mid = [lean * h * 0.1, -h * 0.5];
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(mid[0], mid[1], top[0], top[1]);
  ctx.strokeStyle = VR.ink;
  ctx.lineWidth = 11;
  ctx.stroke();
  ctx.strokeStyle = "#b9793a";
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.strokeStyle = "rgba(90,50,20,.6)";
  ctx.lineWidth = 1.4;
  for (let i = 1; i < 8; i++) {
    const u = i / 8,
      x = 2 * (1 - u) * u * mid[0] + u * u * top[0],
      y = 2 * (1 - u) * u * mid[1] + u * u * top[1];
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 1);
    ctx.lineTo(x + 4, y - 1);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(top[0], top[1]);
  [
    [-2.7, 1],
    [-2.1, 1.08],
    [-1.5, 0.9],
    [-0.95, 0.96],
    [-0.4, 1.06],
    [0.2, 0.92],
  ].forEach(([a, l], i) => {
    const len = h * 0.62 * l,
      sw = Math.sin(t * 1.5 + i * 1.1) * 0.07;
    ctx.save();
    ctx.rotate(a + sw);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -len * 0.42, len, len * 0.12);
    ctx.quadraticCurveTo(len * 0.5, -len * 0.12, 0, 0);
    ctx.closePath();
    inked(
      ctx,
      grad(ctx, 0, 0, len, 0, "#1f8a4a", i % 2 ? "#7bd66a" : "#3fbf62"),
      1.4,
      VR.ink,
    );
    ctx.strokeStyle = "rgba(10,70,40,.5)";
    ctx.lineWidth = 1;
    for (let j = 1; j < 6; j++) {
      const u = j / 6;
      ctx.beginPath();
      ctx.moveTo(
        len * u,
        -len * 0.42 * 4 * u * (1 - u) * 0.62 + len * 0.12 * u * u,
      );
      ctx.lineTo(len * u + 4, len * 0.02 * u - len * 0.02);
      ctx.stroke();
    }
    ctx.restore();
  });
  for (const [x, y] of [
    [-3, 5],
    [5, 6],
    [1, 9],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, TAU);
    inked(
      ctx,
      rgrad(ctx, x - 1.5, y - 1.5, 6, "#b9793a", "#6b3f1e"),
      1.2,
      VR.ink,
    );
  }
  ctx.restore();
}
function vrDolphin(ctx, s) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 1.5, 0);
  ctx.bezierCurveTo(-s * 0.9, -s * 0.9, s * 0.6, -s * 0.9, s * 1.35, -s * 0.15);
  ctx.lineTo(s * 1.75, -s * 0.12);
  ctx.lineTo(s * 1.35, s * 0.12);
  ctx.bezierCurveTo(s * 0.6, s * 0.5, -s * 0.6, s * 0.4, -s * 1.4, s * 0.05);
  ctx.lineTo(-s * 2, s * 0.5);
  ctx.lineTo(-s * 1.85, -s * 0.05);
  ctx.lineTo(-s * 2.1, -s * 0.55);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, 0, -s * 0.8, 0, s * 0.5, "#5fb6e8", "#2a7fc0"),
    Math.max(1.2, s * 0.1),
    VR.ink,
  );
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, -s * 0.72);
  ctx.quadraticCurveTo(-s * 0.2, -s * 1.3, -s * 0.75, -s * 1.25);
  ctx.quadraticCurveTo(-s * 0.5, -s * 0.9, -s * 0.6, -s * 0.62);
  ctx.closePath();
  inked(ctx, "#2a7fc0", Math.max(1.2, s * 0.1), VR.ink);
  ctx.beginPath();
  ctx.moveTo(-s * 1.1, s * 0.12);
  ctx.bezierCurveTo(-s * 0.4, s * 0.42, s * 0.6, s * 0.42, s * 1.3, s * 0.1);
  ctx.bezierCurveTo(s * 0.5, s * 0.14, -s * 0.5, s * 0.2, -s * 1.1, s * 0.12);
  ctx.fillStyle = "#e6f6ff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.95, -s * 0.22, s * 0.08, 0, TAU);
  ctx.fillStyle = VR.ink;
  ctx.fill();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Verão",
    reach: { top: 118, side: 62, bottom: 72 },
    mat: ["#0f2e42", "#0a1a28"],
    theme: cardTheme("#ff8f2e", "#12a3b8"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.lei = Strand(this.loop, m.tl + m.arc * 0.2, m.side * 0.86, -1, 6, {
        off: 9,
        wave: 6,
        freq: 22,
        gap: 0.085,
        size: 13,
        taper: 1,
      });
      this.lei2 = Strand(
        this.loop,
        m.right - m.arc * 0.2,
        m.side * 0.86,
        1,
        14,
        { off: 9, wave: 6, freq: 22, gap: 0.085, size: 13, taper: 1 },
      );
      this.t0 = 0.5;
      this.dur = 1.8;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.fx = Drift(14, 29, { v: [-26, -10], s: [3, 8], sway: 8, spin: 0 });
      this.spray = Particles();
      this.rand = rng(12);
    },
    reset() {
      this.spray.clear();
      this.rand = rng(12);
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand,
        c = (t + 1.5) % 7;
      if (t > 2.5 && (c < 0.12 || (c > 1.25 && c < 1.37)))
        for (let i = 0; i < 3; i++)
          this.spray.add({
            x: CARD.w * (c < 1 ? 0.56 : 0.84) + (R() - 0.5) * 16,
            y: CARD.h + 30,
            vx: (R() - 0.5) * 60,
            vy: -60 - R() * 70,
            g: 260,
            life: 0.7 + R() * 0.3,
            size: 1.5 + R() * 2,
          });
      this.spray.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t;
      // the sun comes up over the top edge
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.2) / 1.6)),
          cx = CARD.w * 0.76,
          cy = 26 - k * 40,
          r = 34;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-200, -300, CARD.w + 400, 300);
        ctx.clip();
        glow(ctx, cx, cy, 110, `rgba(255,200,90,${0.5 * k})`);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tt * 0.25);
        for (let i = 0; i < 12; i++) {
          ctx.rotate(TAU / 12);
          const l = (i % 2 ? 15 : 22) + Math.sin(tt * 3 + i) * 2;
          ctx.beginPath();
          ctx.moveTo(-5, -r - 5);
          ctx.lineTo(0, -r - 5 - l);
          ctx.lineTo(5, -r - 5);
          ctx.closePath();
          inked(ctx, i % 2 ? "#ffd23c" : "#ff9d2e", 1.4, "#a8480f");
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        inked(
          ctx,
          rgrad(
            ctx,
            cx - 10,
            cy - 12,
            r * 1.3,
            "#fff6b8",
            "#ffd23c",
            "#ff9d2e",
          ),
          1.8,
          "#a8480f",
        );
        // sunglasses and a smile
        for (const sx of [-1, 1]) {
          ctx.beginPath();
          ctx.roundRect(cx + sx * 12 - 9, cy - 12, 18, 12, 5);
          inked(
            ctx,
            grad(ctx, 0, cy - 12, 0, cy, "#2a3a5a", "#101828"),
            1.4,
            "#0a1020",
          );
          ctx.beginPath();
          ctx.moveTo(cx + sx * 12 - 5, cy - 9);
          ctx.lineTo(cx + sx * 12 - 1, cy - 9);
          ctx.strokeStyle = "rgba(255,255,255,.6)";
          ctx.lineWidth = 1.6;
          ctx.lineCap = "round";
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - 8);
        ctx.lineTo(cx + 4, cy - 8);
        ctx.strokeStyle = "#0a1020";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy + 4, 9, 0.25, Math.PI - 0.25);
        ctx.strokeStyle = "#a8480f";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      // garlands of hibiscus down both sides
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        for (const v of [this.lei, this.lei2]) {
          strandLine(c, v, g, [
            [VR.ink, 5.6],
            ["#3fbf62", 3.2],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2);
            c.translate(0, -b.s * 0.3 * b.out);
            c.rotate(b.ph + Math.sin(tt + b.ph) * 0.1);
            c.scale(k, k);
            if (b.kind < 0.2) {
              leafPath(c, b.s * 1.3, b.s * 0.45);
              inked(c, "#3fbf62", 1.2, VR.ink);
            } else {
              const p = [
                ["#ff5f7e", "#c9184a"],
                ["#ffb23c", "#f2681f"],
                ["#ff8fd0", "#d9479a"],
                ["#fff6d6", "#ffd23c"],
              ][b.i % 4];
              vrHibiscus(c, b.s * 0.9, p[0], p[1]);
            }
          });
        }
      });
      // a palm leans in from the top-left
      {
        const k = still ? 1 : easeOutBack(clamp((t - 0.6) / 0.9));
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w * 0.16, 3);
          ctx.scale(k, k);
          vrPalm(ctx, 78, -0.5, tt);
          ctx.restore();
        }
      }
      // the sea along the bottom: three bands of waves, a sailboat, and a dolphin that jumps
      const a = still ? 1 : fade(t, 0.3, 1),
        y0 = CARD.h + 26,
        wave = (off, amp, sp, col, edge) => {
          ctx.beginPath();
          ctx.moveTo(-34, y0 + off + 60);
          for (let x = -34; x <= CARD.w + 34; x += 6)
            ctx.lineTo(
              x,
              y0 +
                off +
                Math.sin(x * 0.045 + tt * sp) * amp +
                Math.sin(x * 0.11 - tt * sp * 0.7) * amp * 0.4,
            );
          ctx.lineTo(CARD.w + 34, y0 + off + 60);
          ctx.closePath();
          ctx.fillStyle = col;
          ctx.fill();
          if (edge) {
            ctx.strokeStyle = edge;
            ctx.lineWidth = 2.2;
            ctx.lineJoin = "round";
            ctx.stroke();
          }
        };
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.roundRect(-34, y0 - 40, CARD.w + 68, 86, 22);
      ctx.clip();
      wave(0, 5, 1.2, "#1c86b8", "#bdeeff");
      {
        const c = still ? 0.45 : ((t + 1.5) % 7) / 1.3;
        if (c > 0 && c < 1) {
          ctx.save();
          ctx.translate(
            CARD.w * (0.56 + c * 0.28),
            y0 + 12 - Math.sin(c * Math.PI) * 52,
          );
          ctx.rotate(-0.9 + c * 1.8);
          vrDolphin(ctx, 15);
          ctx.restore();
        }
      }
      {
        const bx = CARD.w * 0.27 + Math.sin(tt * 0.4) * 14,
          by = y0 + 8 + Math.sin(bx * 0.045 + tt * 1.6) * 4;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(Math.sin(tt * 1.6) * 0.08);
        ctx.beginPath();
        ctx.moveTo(-17, -3);
        ctx.lineTo(17, -3);
        ctx.lineTo(11, 7);
        ctx.lineTo(-11, 7);
        ctx.closePath();
        inked(ctx, "#ff6f5a", 1.5, VR.ink);
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(0, -34);
        ctx.strokeStyle = VR.ink;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2, -33);
        ctx.quadraticCurveTo(20, -20, 15, -6);
        ctx.lineTo(2, -6);
        ctx.closePath();
        inked(ctx, "#fff", 1.4, VR.ink);
        ctx.beginPath();
        ctx.moveTo(-2, -28);
        ctx.quadraticCurveTo(-13, -17, -11, -6);
        ctx.lineTo(-2, -6);
        ctx.closePath();
        inked(ctx, "#ffe27a", 1.4, VR.ink);
        ctx.restore();
      }
      wave(11, 4.5, 1.6, "#2aa7d6", "#e6faff");
      wave(24, 4, 2.1, "#57c9e8", "#ffffff");
      ctx.restore();
      ctx.fillStyle = "#e6faff";
      for (const p of this.spray.list) {
        ctx.globalAlpha = 1 - p.age / p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // a gull crosses on arrival
      if (!still) {
        const k = (t - 0.9) / 2.2;
        if (k > 0 && k < 1) {
          ctx.save();
          ctx.translate(
            -50 + (CARD.w + 100) * k,
            -70 - Math.sin(k * Math.PI) * 26,
          );
          const f = Math.sin(t * 9) * 5;
          ctx.beginPath();
          ctx.moveTo(-13, f);
          ctx.quadraticCurveTo(-6, -7 - f, 0, 0);
          ctx.quadraticCurveTo(6, -7 - f, 13, f);
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2.4;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r;
      // a lifebuoy: white ring with red bands
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(ctx, 77, 77, R + 5, [
        [VR.ink, 11.5],
        ["#fff", 8.6],
      ]);
      ctx.save();
      ctx.translate(77, 77);
      ctx.rotate(tt * 0.12);
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, R + 5, i * (TAU / 4) - 0.28, i * (TAU / 4) + 0.28);
        ctx.strokeStyle = "#f2473a";
        ctx.lineWidth = 8.6;
        ctx.stroke();
      }
      ctx.restore();
      ringBase(
        ctx,
        77,
        77,
        R + 10.5,
        [["rgba(255,255,255,.7)", 1.1, [3, 8], 4]],
        tt,
      );
      ctx.restore();
      const k = still ? 1 : pop(t, 0.6, 0.6);
      ctx.save();
      ctx.translate(77 - 29, 77 - R + 4);
      ctx.rotate(-0.4 + Math.sin(tt * 1.4) * 0.05);
      ctx.scale(k, k);
      for (const r of [-2.5, -1.7]) {
        ctx.save();
        ctx.rotate(r);
        leafPath(ctx, 22, 6);
        inked(ctx, "#3fbf62", 1.3, VR.ink);
        ctx.restore();
      }
      vrHibiscus(ctx, 15, "#ff5f7e", "#c9184a");
      ctx.restore();
      ctx.save();
      ctx.translate(77 + 27, 77 + R);
      ctx.rotate(0.3);
      ctx.scale(k, k);
      vrHibiscus(ctx, 10, "#ffb23c", "#f2681f");
      ctx.restore();
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      // warm light from the sun's corner, water light at the bottom, bubbles coming up
      glow(ctx, CARD.w * 0.76, 0, 210, `rgba(255,200,90,${0.3 * a})`);
      ctx.fillStyle = grad(
        ctx,
        0,
        CARD.h - 150,
        0,
        CARD.h,
        "rgba(40,170,214,0)",
        `rgba(40,170,214,${0.34 * a})`,
      );
      ctx.fillRect(0, CARD.h - 150, CARD.w, 150);
      ctx.save();
      ctx.globalAlpha = a * 0.35;
      ctx.strokeStyle = "#d6f6ff";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      for (let i = 0; i < 5; i++) {
        const y = CARD.h - 22 - i * 20;
        ctx.beginPath();
        for (let x = 0; x <= CARD.w; x += 10)
          ctx.lineTo(x, y + Math.sin(x * 0.05 + tt * (1 + i * 0.2) + i) * 4);
        ctx.globalAlpha = a * 0.3 * (1 - i / 5);
        ctx.stroke();
      }
      ctx.restore();
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y) => {
        if (y < CARD.h * 0.35) return;
        ctx.globalAlpha = a * 0.5 * clamp((y - CARD.h * 0.35) / 80);
        ctx.beginPath();
        ctx.arc(x, y, p.s * 0.6, 0, TAU);
        ctx.strokeStyle = "#e6faff";
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - p.s * 0.2, y - p.s * 0.2, p.s * 0.14, 0, TAU);
        ctx.fillStyle = "#fff";
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    },
  };
}
