// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutCubic,
  rng,
  glow,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  rgrad,
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
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Inverno ----------
const IV = { ink: "#1c2f52", ice: "#bfe6ff" };
function ivFlake(ctx, r, color = "#fff", lw = 1.4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6,
      c = Math.cos(a),
      s = Math.sin(a);
    ctx.moveTo(0, 0);
    ctx.lineTo(c * r, s * r);
    for (const u of [0.45, 0.72])
      for (const d of [-1, 1]) {
        const b = a + d * 0.9;
        ctx.moveTo(c * r * u, s * r * u);
        ctx.lineTo(
          c * r * u + Math.cos(b) * r * 0.26,
          s * r * u + Math.sin(b) * r * 0.26,
        );
      }
  }
  ctx.stroke();
}
function ivSnowman(ctx, t, blink, wave) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#5b3a22";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-12, -22);
  ctx.lineTo(-26, -30);
  ctx.moveTo(-21, -27);
  ctx.lineTo(-24, -34);
  ctx.stroke();
  ctx.save();
  ctx.translate(12, -22);
  ctx.rotate(-0.5 + wave * 0.5);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(16, -6);
  ctx.moveTo(11, -4);
  ctx.lineTo(15, -11);
  ctx.moveTo(11, -4);
  ctx.lineTo(17, -1);
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, -13, 15, 0, TAU);
  inked(
    ctx,
    rgrad(ctx, -5, -19, 20, "#fff", "#eaf4ff", "#c3dcf5"),
    1.7,
    IV.ink,
  );
  ctx.beginPath();
  ctx.arc(0, -34, 11, 0, TAU);
  inked(
    ctx,
    rgrad(ctx, -4, -38, 15, "#fff", "#eaf4ff", "#c3dcf5"),
    1.7,
    IV.ink,
  );
  ctx.fillStyle = "#2a2a3a";
  for (const y of [-8, -15]) {
    ctx.beginPath();
    ctx.arc(0, y, 1.7, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-10.5, -27.5);
  ctx.quadraticCurveTo(0, -22, 10.5, -27.5);
  ctx.strokeStyle = IV.ink;
  ctx.lineWidth = 6.4;
  ctx.stroke();
  ctx.strokeStyle = "#e5484d";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, -25);
  ctx.lineTo(9 + Math.sin(t * 2.4) * 1.5, -13);
  ctx.strokeStyle = IV.ink;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = "#e5484d";
  ctx.lineWidth = 3.6;
  ctx.stroke();
  ctx.save();
  ctx.translate(0, -35);
  eyes(ctx, 8.5, 1.6, 0, blink, "#2a2a3a", null);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(0, -33);
  ctx.lineTo(11, -31);
  ctx.lineTo(0, -29.5);
  ctx.closePath();
  inked(ctx, "#ff8a3d", 1.1, IV.ink);
  ctx.beginPath();
  ctx.arc(0, -28, 4.4, 0.35, Math.PI - 0.35);
  ctx.strokeStyle = "#2a2a3a";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([1, 2.2]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.save();
  ctx.translate(0, -43);
  ctx.rotate(-0.12);
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 3, 0, 0, TAU);
  inked(ctx, "#2a2a3a", 1.4, IV.ink);
  ctx.beginPath();
  ctx.roundRect(-7.5, -13, 15, 13, 2);
  inked(ctx, grad(ctx, -7, 0, 7, 0, "#3a3a4e", "#1c1c2a"), 1.4, IV.ink);
  ctx.fillStyle = "#e5484d";
  ctx.fillRect(-7.5, -4, 15, 3);
  ctx.restore();
}
function ivPenguin(ctx, t, blink, flap) {
  ctx.lineJoin = "round";
  const w = Math.sin(t * 5) * 0.06;
  ctx.save();
  ctx.rotate(w);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * 6, -1, 6, 3, 0, 0, TAU);
    inked(ctx, "#ffa63d", 1.3, IV.ink);
    ctx.save();
    ctx.translate(sx * 13, -24);
    ctx.rotate(sx * (0.3 + flap * 0.9));
    ctx.beginPath();
    ctx.ellipse(0, 9, 4.5, 11, 0, 0, TAU);
    inked(ctx, "#24304a", 1.4, IV.ink);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(0, -19, 14.5, 19, 0, 0, TAU);
  inked(ctx, grad(ctx, -14, 0, 14, 0, "#34446a", "#1a2238"), 1.7, IV.ink);
  ctx.beginPath();
  ctx.ellipse(0, -15, 10, 14.5, 0, 0, TAU);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -27, 9.5, 7, 0, 0, TAU);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.save();
  ctx.translate(0, -28);
  eyes(ctx, 9, 2, 0, blink, "#1a2238", null);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-3.5, -24.5);
  ctx.lineTo(3.5, -24.5);
  ctx.lineTo(0, -20.5);
  ctx.closePath();
  inked(ctx, "#ffa63d", 1.1, IV.ink);
  ctx.fillStyle = "rgba(255,143,181,.6)";
  ctx.beginPath();
  ctx.ellipse(-7, -24, 2.2, 1.4, 0, 0, TAU);
  ctx.ellipse(7, -24, 2.2, 1.4, 0, 0, TAU);
  ctx.fill();
  // a knitted hat with a pompom
  ctx.beginPath();
  ctx.moveTo(-11, -32);
  ctx.quadraticCurveTo(-10, -45, 0, -45);
  ctx.quadraticCurveTo(10, -45, 11, -32);
  ctx.closePath();
  inked(ctx, "#4fd1c5", 1.5, IV.ink);
  ctx.beginPath();
  ctx.roundRect(-12.5, -35, 25, 6, 3);
  inked(ctx, "#fff", 1.3, IV.ink);
  ctx.beginPath();
  ctx.arc(0, -47, 4.2, 0, TAU);
  inked(ctx, "#fff", 1.3, IV.ink);
  ctx.restore();
}
function ivPine(ctx, h, t, seed) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.rect(-h * 0.06, -h * 0.14, h * 0.12, h * 0.14);
  inked(ctx, "#5b3a22", 1.3, IV.ink);
  for (let i = 0; i < 4; i++) {
    const y = -h * (0.12 + i * 0.2),
      w = h * (0.4 - i * 0.075),
      top = y - h * 0.34;
    ctx.beginPath();
    ctx.moveTo(-w, y);
    ctx.quadraticCurveTo(-w * 0.3, y - h * 0.1, 0, top);
    ctx.quadraticCurveTo(w * 0.3, y - h * 0.1, w, y);
    ctx.quadraticCurveTo(0, y + h * 0.05, -w, y);
    ctx.closePath();
    inked(ctx, grad(ctx, -w, 0, w, 0, "#1f7a52", "#0f4a36"), 1.4, IV.ink);
    ctx.beginPath();
    ctx.moveTo(-w * 0.72, y - h * 0.03);
    ctx.quadraticCurveTo(-w * 0.2, y - h * 0.13, 0, top + h * 0.02);
    ctx.quadraticCurveTo(w * 0.2, y - h * 0.13, w * 0.72, y - h * 0.03);
    ctx.quadraticCurveTo(
      w * 0.3,
      y - h * 0.09,
      0,
      y - h * 0.05 + Math.sin(seed + i) * 2,
    );
    ctx.quadraticCurveTo(-w * 0.3, y - h * 0.09, -w * 0.72, y - h * 0.03);
    ctx.closePath();
    ctx.fillStyle = "#f4fbff";
    ctx.fill();
  }
}

export default function create(CARD, AVATAR) {
  return {
    name: "Inverno",
    reach: { top: 112, side: 62, bottom: 66 },
    mat: ["#12233f", "#0a1424"],
    theme: cardTheme("#3f8fd6", "#6a5fcf"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.ice = Strand(this.loop, m.right, m.side * 0.9, 1, 4, {
        off: 7,
        wave: 4,
        freq: 28,
        gap: 0.085,
        size: 12,
        taper: 0.9,
      });
      this.ice2 = Strand(this.loop, m.tl, m.side * 0.9, -1, 15, {
        off: 7,
        wave: 4,
        freq: 28,
        gap: 0.085,
        size: 12,
        taper: 0.9,
      });
      this.t0 = 0.5;
      this.dur = 1.8;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.snow = Drift(34, 43, {
        v: [22, 52],
        s: [1.4, 3.6],
        sway: 14,
        spin: 1,
      });
      this.fx = Drift(30, 47, {
        v: [18, 46],
        s: [1.2, 3.4],
        sway: 12,
        spin: 1,
      });
      const R = rng(9);
      this.cap = [];
      for (let x = -10; x <= CARD.w + 10; x += 18)
        this.cap.push([x, 9 + R() * 8]);
      this.drips = [];
      for (let i = 0; i < 12; i++)
        this.drips.push({
          x: 8 + R() * (CARD.w - 16),
          l: 8 + R() * 16,
          w: 2.5 + R() * 2.5,
        });
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.4, 1.2);
      this.snow.each(tt, CARD.w + 140, CARD.h + 170, (p, x, y) => {
        const px = x - 70,
          py = y - 100;
        if (px > 0 && px < CARD.w && py > 0 && py < CARD.h) return;
        ctx.globalAlpha = a * (0.5 + 0.5 * p.k);
        ctx.beginPath();
        ctx.arc(px, py, p.s, 0, TAU);
        ctx.fillStyle = "#fff";
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 5, (c) => {
        for (const v of [this.ice, this.ice2]) {
          strandLine(c, v, g, [
            [IV.ink, 5.6],
            [IV.ice, 3.2],
            ["#fff", 1],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2);
            c.translate(0, -b.s * 0.8 * b.out);
            c.rotate(b.ph + tt * 0.15 * (b.i % 2 ? 1 : -1));
            c.scale(k, k);
            if (b.kind < 0.75) {
              ivFlake(c, b.s * 0.9, IV.ink, 3.4);
              ivFlake(c, b.s * 0.9, b.i % 2 ? "#fff" : IV.ice, 1.5);
            } else {
              sparkPath(c, b.s * 0.6);
              inked(c, "#fff", 1, IV.ink);
            }
          });
        }
      });
      // pines under snow in one corner, ice crystals in the other, on a drift
      {
        const k = still ? 1 : pop(t, 0.5, 0.6);
        ctx.save();
        ctx.translate(0, CARD.h + 40);
        ctx.scale(1, k);
        blobPath(ctx, [
          [-30, 14],
          [-22, -4],
          [20, -10],
          [70, -2],
          [CARD.w * 0.5, 4],
          [CARD.w - 70, -2],
          [CARD.w - 20, -9],
          [CARD.w + 24, -3],
          [CARD.w + 30, 14],
        ]);
        inked(ctx, grad(ctx, 0, -10, 0, 14, "#fff", "#c3dcf5"), 1.6, IV.ink);
        ctx.restore();
      }
      [
        [30, 54, 0],
        [58, 38, 1.4],
      ].forEach(([x, h, sd], i) => {
        const k = still ? 1 : pop(t, 0.8 + i * 0.2, 0.6);
        if (k <= 0) return;
        ctx.save();
        ctx.translate(x, CARD.h + 34);
        ctx.rotate(Math.sin(tt * 1.2 + i) * 0.015);
        ctx.scale(k, k);
        ivPine(ctx, h, tt, sd);
        ctx.restore();
      });
      [
        [CARD.w - 36, 26, -0.25, "#bfe6ff"],
        [CARD.w - 22, 34, 0.1, "#eaf6ff"],
        [CARD.w - 8, 22, 0.4, "#9fd0f5"],
      ].forEach(([x, h, r, col], i) => {
        const k = still ? 1 : pop(t, 1 + i * 0.12, 0.5);
        if (k <= 0) return;
        ctx.save();
        ctx.translate(x, CARD.h + 34);
        ctx.rotate(r);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-7, -h * 0.7);
        ctx.lineTo(0, -h);
        ctx.lineTo(7, -h * 0.7);
        ctx.lineTo(6, 0);
        ctx.closePath();
        inked(ctx, grad(ctx, -7, 0, 7, 0, "#fff", col, "#6aa9e0"), 1.4, IV.ink);
        ctx.beginPath();
        ctx.moveTo(0, -h);
        ctx.lineTo(0, 0);
        ctx.strokeStyle = "rgba(255,255,255,.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });
      // snow settles along the top edge, with icicles
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.3) / 1.2));
        ctx.save();
        ctx.beginPath();
        ctx.rect(-40, -60, (CARD.w + 80) * k, 120);
        ctx.clip();
        ctx.fillStyle = grad(ctx, 0, 0, 0, 26, "#eaf6ff", "#9fd0f5");
        for (const d of this.drips) {
          const l = d.l * (still ? 1 : clamp((t - 1) / 1.2));
          ctx.beginPath();
          ctx.moveTo(d.x - d.w, 1);
          ctx.lineTo(d.x + d.w, 1);
          ctx.lineTo(d.x, 1 + l);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = IV.ink;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-12, 3);
        for (const [x, h] of this.cap)
          ctx.quadraticCurveTo(x + 4, -h * 1.5, x + 14, -h * 0.5);
        ctx.lineTo(CARD.w + 12, 3);
        ctx.closePath();
        inked(ctx, grad(ctx, 0, -16, 0, 3, "#fff", "#d3e6f8"), 1.6, IV.ink);
        ctx.restore();
      }
      // the snowman waves; the penguin slides in and flaps
      {
        const k = still ? 1 : pop(t, 1.5, 0.6);
        if (k > 0) {
          const c = tt % 5,
            wv = !still && c < 1.2 ? Math.sin(c * 10) : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.72, -4);
          ctx.scale(1.6 * k, 1.6 * k);
          ivSnowman(ctx, tt, !still && blinking(tt, 3.3), wv);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 1) / 1.1));
        if (k > 0) {
          const c = (tt + 2) % 4.4,
            fl = !still && c < 0.8 ? Math.abs(Math.sin(c * 12)) : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.26 - (1 - k) * 150, -4);
          ctx.rotate((1 - k) * -0.5);
          ctx.scale(1.55, 1.55);
          ivPenguin(ctx, tt, !still && blinking(tt, 2.9, 1), fl);
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
          [IV.ink, 7.4],
          [IV.ice, 4.6],
          ["#fff", 1.4, [1.5, 6], 3],
        ],
        tt,
      );
      [
        [0.5, 7],
        [1.2, 5],
        [1.95, 8],
        [2.7, 5.5],
      ].forEach(([an, r], i) => {
        ctx.save();
        ctx.translate(
          77 + Math.cos(an) * (R + 10),
          77 + Math.sin(an) * (R + 10),
        );
        ctx.rotate(tt * 0.3 * (i % 2 ? 1 : -1));
        const k2 = still ? 1 : pop(t, 0.9 + i * 0.1, 0.4);
        ctx.scale(k2, k2);
        ivFlake(ctx, r, IV.ink, 3.2);
        ivFlake(ctx, r, "#fff", 1.4);
        ctx.restore();
      });
      ctx.restore();
      // a wool hat pulled over the top, pompom swaying
      const k = still ? 1 : bounceOut((t - 0.5) / 0.8);
      if (still || t > 0.5) {
        ctx.save();
        ctx.translate(77, 77 - R + 6 - (1 - k) * 70);
        ctx.rotate(-0.14);
        ctx.beginPath();
        ctx.moveTo(-32, 2);
        ctx.quadraticCurveTo(-30, -36, 0, -38);
        ctx.quadraticCurveTo(30, -36, 32, 2);
        ctx.closePath();
        inked(ctx, grad(ctx, -30, 0, 30, 0, "#5fb0f2", "#2f6fb5"), 1.8, IV.ink);
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = "rgba(255,255,255,.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = -34; x <= 34; x += 8) {
          ctx.moveTo(x, -16);
          ctx.lineTo(x + 4, -22);
          ctx.lineTo(x + 8, -16);
        }
        ctx.stroke();
        ctx.fillStyle = "#fff";
        for (let x = -30; x <= 30; x += 10) {
          ctx.beginPath();
          ctx.arc(x, -8, 1.6, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.roundRect(-35, -3, 70, 11, 5.5);
        inked(ctx, "#fff", 1.7, IV.ink);
        ctx.strokeStyle = "rgba(60,90,140,.35)";
        ctx.lineWidth = 1;
        for (let x = -30; x <= 30; x += 6) {
          ctx.beginPath();
          ctx.moveTo(x, -1);
          ctx.lineTo(x, 6);
          ctx.stroke();
        }
        ctx.translate(0, -38);
        ctx.rotate(Math.sin(tt * 2.2) * 0.2);
        ctx.beginPath();
        ctx.arc(0, -7, 9, 0, TAU);
        inked(ctx, rgrad(ctx, -3, -10, 12, "#fff", "#d3e6f8"), 1.6, IV.ink);
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      for (const [x, y] of [
        [0, 0],
        [CARD.w, 0],
        [0, CARD.h],
        [CARD.w, CARD.h],
      ])
        glow(ctx, x, y, 120, `rgba(220,240,255,${0.3 * a})`);
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.globalAlpha = a * (0.4 + 0.5 * p.k);
        if (p.s > 3) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rot);
          ivFlake(ctx, p.s * 1.7, "#fff", 1);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, p.s * 0.8, 0, TAU);
          ctx.fillStyle = "#fff";
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad(
        ctx,
        0,
        CARD.h - 60,
        0,
        CARD.h,
        "rgba(255,255,255,0)",
        `rgba(255,255,255,${0.2 * a})`,
      );
      ctx.fillRect(0, CARD.h - 60, CARD.w, 60);
    },
  };
}
