// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutCubic,
  easeOutBack,
  easeInOut,
  rng,
  Particles,
  glow,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  rgrad,
  cloudPath,
  ringBase,
  Strand,
  strandLine,
  strandBits,
  Drift,
  settle,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Samurai ----------
const SM = {
  ink: "#14101a",
  red: "#c4202e",
  redDark: "#7a0f1c",
  gold: "#e9c46a",
  goldDark: "#a97a1f",
  steel: "#dfe7f2",
};
// A kabuto with its face guard around (0,0), about 80 wide. `glare` lights the eyes.
function smKabuto(ctx, t, glare) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // the gold crest: two tall horns and a disc
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 5, -30);
    ctx.bezierCurveTo(sx * 12, -50, sx * 34, -58, sx * 44, -84);
    ctx.bezierCurveTo(sx * 44, -58, sx * 30, -38, sx * 15, -27);
    ctx.closePath();
    inked(
      ctx,
      grad(ctx, 0, -84, 0, -28, "#fff3c4", SM.gold, SM.goldDark),
      1.8,
      SM.ink,
    );
  }
  ctx.beginPath();
  ctx.arc(0, -39, 9, 0, TAU);
  inked(
    ctx,
    rgrad(ctx, -3, -42, 12, "#fff3c4", SM.gold, SM.goldDark),
    1.6,
    SM.ink,
  );
  // neck guard plates fanning out at the sides
  for (const sx of [-1, 1])
    for (let i = 2; i >= 0; i--) {
      ctx.beginPath();
      ctx.moveTo(sx * 20, -8 + i * 7);
      ctx.quadraticCurveTo(
        sx * (40 + i * 4),
        -4 + i * 8,
        sx * (43 + i * 5),
        10 + i * 8,
      );
      ctx.lineTo(sx * (22 + i * 2), 8 + i * 8);
      ctx.closePath();
      inked(
        ctx,
        grad(
          ctx,
          0,
          -8 + i * 7,
          0,
          18 + i * 8,
          i % 2 ? "#2a2434" : "#3a3246",
          "#17131f",
        ),
        1.5,
        SM.ink,
      );
      ctx.beginPath();
      ctx.moveTo(sx * (24 + i * 2), 6 + i * 8);
      ctx.lineTo(sx * (41 + i * 5), 8 + i * 8);
      ctx.strokeStyle = SM.red;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  // the bowl of the helmet with its ribs, and the peak
  ctx.beginPath();
  ctx.moveTo(-27, -4);
  ctx.quadraticCurveTo(-28, -36, 0, -37);
  ctx.quadraticCurveTo(28, -36, 27, -4);
  ctx.closePath();
  inked(ctx, grad(ctx, -27, -37, 27, -4, "#4a4058", "#1c1826"), 1.8, SM.ink);
  ctx.strokeStyle = "rgba(233,196,106,.7)";
  ctx.lineWidth = 1.2;
  for (const x of [-18, -9, 0, 9, 18]) {
    ctx.beginPath();
    ctx.moveTo(x, -5);
    ctx.quadraticCurveTo(x * 0.7, -24, x * 0.2, -36);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-31, -4);
  ctx.quadraticCurveTo(0, -13, 31, -4);
  ctx.quadraticCurveTo(0, 3, -31, -4);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -12, 0, 2, SM.gold, SM.goldDark), 1.6, SM.ink);
  // the mask: dark hollow for the eyes, red lacquer below, a snarl with gold teeth
  ctx.beginPath();
  ctx.moveTo(-22, -2);
  ctx.lineTo(22, -2);
  ctx.lineTo(20, 10);
  ctx.lineTo(-20, 10);
  ctx.closePath();
  ctx.fillStyle = "#0a070e";
  ctx.fill();
  for (const sx of [-1, 1]) {
    glow(ctx, sx * 9, 4, 9, `rgba(255,90,70,${0.35 + glare * 0.6})`);
    ctx.beginPath();
    ctx.moveTo(sx * 4, 5);
    ctx.lineTo(sx * 15, 1.5);
    ctx.lineTo(sx * 14, 6);
    ctx.closePath();
    ctx.fillStyle = glare > 0.4 ? "#fff3c4" : "#ff8a6a";
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-21, 9);
  ctx.quadraticCurveTo(-23, 28, -9, 35);
  ctx.quadraticCurveTo(0, 39, 9, 35);
  ctx.quadraticCurveTo(23, 28, 21, 9);
  ctx.quadraticCurveTo(8, 15, 0, 9);
  ctx.quadraticCurveTo(-8, 15, -21, 9);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, 9, 0, 38, "#e03a45", SM.redDark), 1.8, SM.ink);
  ctx.beginPath();
  ctx.moveTo(-3.5, 11);
  ctx.lineTo(0, 20);
  ctx.lineTo(3.5, 11);
  ctx.strokeStyle = SM.ink;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-12, 24);
  ctx.quadraticCurveTo(0, 20, 12, 24);
  ctx.quadraticCurveTo(0, 33, -12, 24);
  ctx.closePath();
  ctx.fillStyle = "#16090c";
  ctx.fill();
  ctx.strokeStyle = SM.ink;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = SM.gold;
  for (const x of [-7, -2.4, 2.4, 7]) ctx.fillRect(x - 1.6, 22.6, 3.2, 3.4);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 6, 22);
    ctx.quadraticCurveTo(sx * 16, 20, sx * 24, 14 + Math.sin(t * 2 + sx) * 1.5);
    ctx.strokeStyle = SM.ink;
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.strokeStyle = "#f4f0e6";
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  // the cord under the chin
  ctx.beginPath();
  ctx.moveTo(-8, 37);
  ctx.lineTo(0, 44);
  ctx.lineTo(8, 37);
  ctx.strokeStyle = SM.ink;
  ctx.lineWidth = 4.4;
  ctx.stroke();
  ctx.strokeStyle = SM.red;
  ctx.lineWidth = 2.4;
  ctx.stroke();
}
// A katana along +x from the pommel at (0,0); `out` is how far it is drawn from the scabbard (0..1).
function smKatana(ctx, len, out) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const h = len * 0.24,
    b = len - h;
  if (out > 0) {
    ctx.beginPath();
    ctx.moveTo(h, -2.6);
    ctx.lineTo(h + b * out - 10, -2.6);
    ctx.quadraticCurveTo(h + b * out, -2.2, h + b * out + 3, 2.6);
    ctx.lineTo(h, 2.6);
    ctx.closePath();
    inked(
      ctx,
      grad(ctx, 0, -2.6, 0, 2.6, "#ffffff", SM.steel, "#8f9bb0"),
      1.2,
      SM.ink,
    );
    ctx.beginPath();
    ctx.moveTo(h + 4, 0.6);
    ctx.lineTo(h + b * out - 6, 0.6);
    ctx.strokeStyle = "rgba(120,140,170,.7)";
    ctx.lineWidth = 0.8;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.beginPath();
  ctx.roundRect(h + b * out, -4, b * (1 - out) + 6, 8, 3);
  inked(ctx, grad(ctx, 0, -4, 0, 4, "#a8283a", "#4a0f1c"), 1.3, SM.ink);
  if (out < 0.9) {
    ctx.fillStyle = SM.gold;
    ctx.fillRect(h + b * out + 8, -4, 4, 8);
  }
  ctx.beginPath();
  ctx.ellipse(h, 0, 3, 7.5, 0, 0, TAU);
  inked(ctx, SM.gold, 1.3, SM.ink);
  ctx.beginPath();
  ctx.roundRect(0, -3.4, h - 2, 6.8, 2.4);
  inked(ctx, "#1c1826", 1.3, SM.ink);
  ctx.strokeStyle = SM.red;
  ctx.lineWidth = 1.4;
  for (let x = 4; x < h - 4; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, -3);
    ctx.lineTo(x + 4, 3);
    ctx.moveTo(x + 4, -3);
    ctx.lineTo(x, 3);
    ctx.stroke();
  }
}
function smMomiji(ctx, s, c) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.62,
      r = s * (1 - Math.abs(i - 3) * 0.12);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + 0.31) * s * 0.36, Math.sin(a + 0.31) * s * 0.36);
  }
  ctx.closePath();
  ctx.fillStyle = c;
  ctx.fill();
  ctx.strokeStyle = SM.ink;
  ctx.lineWidth = Math.max(0.8, s * 0.07);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, s * 0.7);
  ctx.stroke();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Samurai",
    reach: { top: 118, side: 66, bottom: 64 },
    mat: ["#1c1018", "#0c080e"],
    theme: cardTheme("#b3202a", "#2a2238"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.rope = Strand(this.loop, m.tl + m.arc * 0.2, m.side * 0.78, -1, 6, {
        off: 8,
        wave: 3,
        freq: 14,
        gap: 0.14,
        size: 12,
        taper: 1,
        outward: 1,
      });
      this.t0 = 0.5;
      this.dur = 1.7;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.fall = Drift(11, 91, { v: [18, 36], s: [7, 12], sway: 22, spin: 2 });
      this.fx = Drift(10, 93, { v: [16, 32], s: [6, 11], sway: 20, spin: 2 });
      this.sp = Particles();
      this.rand = rng(6);
      this.clicked = false;
    },
    reset() {
      this.sp.clear();
      this.rand = rng(6);
      this.clicked = false;
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand;
      if (!this.clicked && t > 2.75) {
        this.clicked = true;
        for (let i = 0; i < 22; i++) {
          const a = R() * TAU,
            v = 40 + R() * 130;
          this.sp.add({
            x: CARD.w + 30,
            y: CARD.h * 0.3,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            g: 160,
            drag: 2,
            life: 0.4 + R() * 0.5,
            size: 1 + R() * 1.8,
          });
        }
      }
      this.sp.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.3, 1.2);
      // the red sun behind the helmet
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.2) / 1.4)),
          cx = CARD.w * 0.3,
          cy = 34 - k * 76;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-200, -300, CARD.w + 400, 300);
        ctx.clip();
        glow(ctx, cx, cy, 120, `rgba(230,60,60,${0.3 * k})`);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tt * 0.06);
        ctx.globalAlpha = 0.5 * k;
        for (let i = 0; i < 16; i++) {
          ctx.rotate(TAU / 16);
          ctx.beginPath();
          ctx.moveTo(-7, -52);
          ctx.lineTo(0, -104);
          ctx.lineTo(7, -52);
          ctx.closePath();
          ctx.fillStyle = i % 2 ? "#e03a45" : "#a81c2a";
          ctx.fill();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(cx, cy, 50, 0, TAU);
        inked(
          ctx,
          rgrad(ctx, cx - 12, cy - 14, 62, "#ff6a5a", "#d6283a", "#96141f"),
          1.8,
          SM.ink,
        );
        ctx.restore();
      }
      this.fall.each(tt, CARD.w + 130, CARD.h + 150, (p, x, y, rot) => {
        const px = x - 65,
          py = y - 90;
        if (px > -6 && px < CARD.w + 6 && py > -6 && py < CARD.h + 6) return;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rot);
        ctx.scale(1, 0.5 + 0.5 * Math.sin(rot * 1.6));
        ctx.globalAlpha = a * 0.9;
        smMomiji(ctx, p.s * 0.7, p.i % 2 ? "#e03a45" : "#f2811c");
        ctx.restore();
      });
      // a sacred rope along the top with paper streamers, and a red cord with tassels down the left
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.4) / 1.2)),
          y = (u) => -9 + Math.sin(u * Math.PI) * 9;
        ctx.lineCap = "round";
        const rope = () => {
          ctx.beginPath();
          for (let i = 0; i <= 40 * k; i++) {
            const u = i / 40;
            ctx.lineTo(-10 + (CARD.w + 20) * u, y(u));
          }
        };
        rope();
        ctx.strokeStyle = SM.ink;
        ctx.lineWidth = 12;
        ctx.stroke();
        rope();
        ctx.strokeStyle = "#d9c08a";
        ctx.lineWidth = 9;
        ctx.stroke();
        rope();
        ctx.strokeStyle = "rgba(110,80,30,.7)";
        ctx.lineWidth = 9;
        ctx.setLineDash([2, 7]);
        ctx.lineCap = "butt";
        ctx.stroke();
        ctx.setLineDash([]);
        [0.5, 0.64, 0.78, 0.92].forEach((u, i) => {
          if (u > k) return;
          const kk = still ? 1 : pop(t, 0.5 + u * 1.2, 0.4);
          ctx.save();
          ctx.translate(-10 + (CARD.w + 20) * u, y(u) + 4);
          ctx.rotate(Math.sin(tt * 1.8 + i) * 0.1);
          ctx.scale(kk, kk);
          ctx.beginPath();
          ctx.moveTo(-4, 0);
          ctx.lineTo(4, 0);
          ctx.lineTo(4, 9);
          ctx.lineTo(9, 9);
          ctx.lineTo(9, 19);
          ctx.lineTo(3, 19);
          ctx.lineTo(3, 29);
          ctx.lineTo(-5, 29);
          ctx.lineTo(-5, 18);
          ctx.lineTo(1, 18);
          ctx.lineTo(1, 9);
          ctx.lineTo(-4, 9);
          ctx.closePath();
          inked(ctx, "#fffaf0", 1.2, SM.ink);
          ctx.restore();
        });
      }
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        strandLine(c, this.rope, g, [
          [SM.ink, 6.4],
          [SM.red, 4],
          ["#ff8a8a", 1],
        ]);
        strandBits(c, this.rope, T, this.when, (b, k) => {
          c.rotate(
            b.a + Math.PI / 2 + Math.PI + Math.sin(tt * 1.6 + b.ph) * 0.12,
          );
          c.scale(k, k);
          c.beginPath();
          c.arc(0, 0, 4, 0, TAU);
          inked(c, SM.gold, 1.2, SM.ink);
          for (let i = -2; i <= 2; i++) {
            c.beginPath();
            c.moveTo(i * 1.4, 3);
            c.lineTo(i * 2.4, 3 + b.s * 1.5);
            c.strokeStyle = i % 2 ? SM.red : "#e9566a";
            c.lineWidth = 1.8;
            c.lineCap = "round";
            c.stroke();
          }
        });
      });
      // the sword: a cut across on arrival, then it slides home into the scabbard on the right
      {
        const cut = still ? 1 : clamp((t - 1.9) / 0.85),
          out = still ? 0.16 : 1 - easeInOut(cut) * 0.84;
        ctx.save();
        ctx.translate(
          CARD.w + 30,
          CARD.h * 0.3 - 46 - (1 - (still ? 1 : clamp((t - 1.2) / 0.6))) * 160,
        );
        ctx.rotate(Math.PI / 2);
        smKatana(ctx, CARD.h * 0.62, out);
        ctx.restore();
        if (!still)
          for (const p of this.sp.list) {
            const q = 1 - p.age / p.life;
            glow(ctx, p.x, p.y, p.size * 3, `rgba(255,220,150,${0.7 * q})`);
          }
      }
      // a bonsai pine in one corner, a paper lantern in the other
      {
        const k = still ? 1 : pop(t, 0.8, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(40, CARD.h + 44);
          ctx.scale(k, k);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-17, -9);
          ctx.lineTo(17, -9);
          ctx.lineTo(13, 0);
          ctx.lineTo(-13, 0);
          ctx.closePath();
          inked(ctx, grad(ctx, 0, -9, 0, 0, "#3f6fb5", "#22407a"), 1.5, SM.ink);
          const trunk = () => {
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.bezierCurveTo(-10, -20, 10, -26, 2, -40);
            ctx.moveTo(1, -24);
            ctx.quadraticCurveTo(14, -26, 20, -32);
          };
          trunk();
          ctx.strokeStyle = SM.ink;
          ctx.lineWidth = 7;
          ctx.stroke();
          trunk();
          ctx.strokeStyle = "#6b4426";
          ctx.lineWidth = 4.2;
          ctx.stroke();
          [
            [2, -46, 16],
            [-12, -36, 10],
            [22, -36, 11],
            [12, -50, 9],
          ].forEach(([x, y, r], i) => {
            ctx.save();
            ctx.translate(x, y + Math.sin(tt * 1.3 + i) * 0.6);
            cloudPath(ctx, r);
            inked(
              ctx,
              grad(ctx, 0, -r, 0, r * 0.4, "#3fa35a", "#1f6a3a"),
              1.4,
              SM.ink,
            );
            ctx.restore();
          });
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.1, 0.6);
        if (k > 0) {
          const fl = 0.75 + 0.25 * Math.sin(tt * 7) * Math.sin(tt * 3.1);
          ctx.save();
          ctx.translate(CARD.w - 34, CARD.h + 46);
          ctx.scale(k, k);
          glow(ctx, 0, -22, 50, `rgba(255,170,80,${0.4 * fl})`);
          ctx.fillStyle = "#1c1826";
          ctx.strokeStyle = SM.ink;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.roundRect(-13, -4, 26, 5, 1.5);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.roundRect(-14, -44, 28, 5, 1.5);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-9, -48);
          ctx.lineTo(0, -55);
          ctx.lineTo(9, -48);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.rect(-11, -39, 22, 35);
          inked(
            ctx,
            grad(
              ctx,
              0,
              -39,
              0,
              -4,
              "#fff3d6",
              `rgba(255,${Math.round(170 + 40 * fl)},90,1)`,
            ),
            1.4,
            SM.ink,
          );
          ctx.strokeStyle = SM.ink;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(-3.6, -39);
          ctx.lineTo(-3.6, -4);
          ctx.moveTo(3.6, -39);
          ctx.lineTo(3.6, -4);
          ctx.moveTo(-11, -27);
          ctx.lineTo(11, -27);
          ctx.moveTo(-11, -15);
          ctx.lineTo(11, -15);
          ctx.stroke();
          ctx.restore();
        }
      }
      // the helmet settles on the top edge; its eyes flare when the blade locks
      {
        const k = still ? 1 : bounceOut((t - 0.9) / 0.9);
        if (still || t > 0.9) {
          const since = t - 2.75,
            glare = still ? 0.3 : since > 0 ? Math.exp(-since * 1.4) : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.3, -37 - (1 - k) * 150);
          ctx.rotate(Math.sin(tt * 0.9) * 0.012);
          ctx.scale(0.92, 0.92);
          smKabuto(ctx, tt, Math.max(glare, 0.15 + 0.15 * Math.sin(tt * 2)));
          ctx.restore();
        }
      }
      // a banner with a crest on the top right
      {
        const k = still ? 1 : pop(t, 1.4, 0.6);
        if (k > 0) {
          const x = CARD.w * 0.8;
          ctx.save();
          ctx.translate(x, 0);
          ctx.scale(k, k);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -92);
          ctx.moveTo(0, -88);
          ctx.lineTo(27, -88);
          ctx.strokeStyle = SM.ink;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.strokeStyle = "#8a6a4a";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(2, -86);
          ctx.lineTo(26, -86);
          for (let i = 0; i <= 8; i++)
            ctx.lineTo(
              26 + Math.sin(tt * 3 + i * 0.7) * (i * 0.5),
              -86 + i * 8.5,
            );
          for (let i = 8; i >= 0; i--)
            ctx.lineTo(
              2 + Math.sin(tt * 3 + i * 0.7) * (i * 0.5),
              -86 + i * 8.5,
            );
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, 0, -86, 0, -18, "#f4f0e6", "#d9d0bf"),
            1.5,
            SM.ink,
          );
          ctx.beginPath();
          ctx.arc(14 + Math.sin(tt * 3 + 2) * 1.2, -64, 8, 0, TAU);
          ctx.fillStyle = SM.red;
          ctx.fill();
          ctx.fillStyle = "#f4f0e6";
          ctx.fillRect(8.5 + Math.sin(tt * 3 + 2) * 1.2, -66.5, 11, 1.8);
          ctx.fillRect(8.5 + Math.sin(tt * 3 + 2) * 1.2, -62.5, 11, 1.8);
          ctx.fillStyle = SM.ink;
          for (const y of [-46, -38, -30])
            ctx.fillRect(9 + Math.sin(tt * 3 + 4) * 2, y, 10, 3.2);
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r;
      const k = still ? 1 : easeOutBack(clamp((t - 0.5) / 0.8));
      for (const sx of [-1, 1]) {
        ctx.save();
        ctx.translate(77, 77 - R + 8);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.moveTo(sx * 6, -4);
        ctx.bezierCurveTo(sx * 14, -22, sx * 34, -28, sx * 42, -50);
        ctx.bezierCurveTo(sx * 42, -28, sx * 30, -10, sx * 17, -1);
        ctx.closePath();
        inked(
          ctx,
          grad(ctx, 0, -50, 0, 0, "#fff3c4", SM.gold, SM.goldDark),
          1.8,
          SM.ink,
        );
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        77,
        77,
        R + 3.5,
        [
          [SM.ink, 8],
          [SM.red, 5.2],
        ],
        tt,
      );
      for (let i = 0; i < 16; i++) {
        const an = (i / 16) * TAU;
        ctx.beginPath();
        ctx.arc(
          77 + Math.cos(an) * (R + 3.5),
          77 + Math.sin(an) * (R + 3.5),
          1.7,
          0,
          TAU,
        );
        ctx.fillStyle = SM.gold;
        ctx.fill();
      }
      ctx.restore();
      ctx.save();
      ctx.translate(77, 77 - R - 2);
      ctx.scale(k, k);
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      inked(
        ctx,
        rgrad(ctx, -2.5, -2.5, 11, "#fff3c4", SM.gold, SM.goldDark),
        1.6,
        SM.ink,
      );
      ctx.restore();
      // a knotted cord with two tassels at the bottom
      {
        const kk = still ? 1 : pop(t, 1, 0.5);
        ctx.save();
        ctx.translate(77, 77 + R + 4);
        ctx.scale(kk, kk);
        for (const sx of [-1, 1]) {
          ctx.save();
          ctx.rotate(sx * 0.35 + Math.sin(tt * 2 + sx) * 0.1);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 9);
          ctx.strokeStyle = SM.ink;
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.strokeStyle = SM.red;
          ctx.lineWidth = 2.2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 11, 3, 0, TAU);
          inked(ctx, SM.gold, 1.1, SM.ink);
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i, 13);
            ctx.lineTo(i * 2, 25);
            ctx.strokeStyle = i % 2 ? SM.red : "#e9566a";
            ctx.lineWidth = 1.7;
            ctx.lineCap = "round";
            ctx.stroke();
          }
          ctx.restore();
        }
        for (const sx of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(sx * 6, 0, 6, 3.4, sx * 0.4, 0, TAU);
          inked(ctx, SM.red, 1.3, SM.ink);
        }
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, TAU);
        inked(ctx, SM.gold, 1.2, SM.ink);
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      ctx.save();
      ctx.globalAlpha = 0.16 * a;
      ctx.beginPath();
      ctx.arc(CARD.w * 0.74, CARD.h * 0.42, 96, 0, TAU);
      ctx.fillStyle = "#e03a45";
      ctx.fill();
      ctx.restore();
      for (let i = 0; i < 4; i++)
        glow(
          ctx,
          ((i * 130 + tt * 7) % (CARD.w + 220)) - 110,
          CARD.h - 24 + Math.sin(tt * 0.5 + i) * 8,
          110,
          `rgba(20,14,26,${0.5 * a})`,
        );
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.scale(1, 0.5 + 0.5 * Math.sin(rot * 1.6));
        ctx.globalAlpha = a * 0.6;
        smMomiji(ctx, p.s * 0.7, p.i % 2 ? "#e03a45" : "#f2811c");
        ctx.restore();
      });
      // the cut: a line of light across the card, gone in a moment
      if (!still) {
        const k = (t - 1.9) / 0.5;
        if (k > 0 && k < 1) {
          const e = easeOutCubic(clamp(k * 2.4)),
            x0 = CARD.w + 20,
            y0 = 60,
            x1 = x0 - (CARD.w + 60) * e,
            y1 = y0 + CARD.h * 0.62 * e;
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.strokeStyle = "rgba(255,120,120,.6)";
          ctx.lineWidth = 12 * (1 - k);
          ctx.stroke();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2.6;
          ctx.stroke();
          ctx.restore();
        }
      }
    },
  };
}
