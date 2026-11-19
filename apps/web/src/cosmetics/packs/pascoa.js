// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutBack,
  rng,
  Particles,
  glow,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  rgrad,
  sparkPath,
  eyes,
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
  paintedEgg,
  cardTheme,
} from "../kit";

// ---------- Páscoa ----------
const PS = {
  ink: "#3b2a4a",
  cols: [
    ["#ffd6e8", "#ff7fb0", "#fff"],
    ["#d7f5ff", "#4aa3df", "#fff"],
    ["#fff3b8", "#f7a531", "#fff"],
    ["#e3d4ff", "#8a5cf6", "#fff3b8"],
    ["#d6f7c8", "#3fae72", "#fff"],
  ],
};
// A chick around (0,0), feet at y = r. `open` is the beak.
function psChick(ctx, r, t, blink, open = 0, flap = 0) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * r * 0.82, r * 0.1);
    ctx.rotate(sx * (0.5 + flap * 0.7));
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.3, r * 0.52, 0, 0, TAU);
    inked(ctx, "#ffc93c", Math.max(1, r * 0.09), PS.ink);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.92, r, 0, 0, TAU);
  inked(
    ctx,
    rgrad(ctx, -r * 0.3, -r * 0.4, r * 1.3, "#fff5b0", "#ffd84a", "#f2a81f"),
    Math.max(1.1, r * 0.1),
    PS.ink,
  );
  ctx.strokeStyle = "#f2a81f";
  ctx.lineWidth = Math.max(1, r * 0.1);
  for (const a of [-0.35, 0, 0.35]) {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.quadraticCurveTo(
      Math.sin(a) * r * 0.4,
      -r * 1.25,
      Math.sin(a) * r * 0.6,
      -r * 1.4,
    );
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(0, -r * 0.2);
  eyes(ctx, r * 0.8, r * 0.16, 0, blink, "#2a1a12", null);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, r * 0.02);
  ctx.lineTo(0, -r * 0.1 - open * r * 0.1);
  ctx.lineTo(r * 0.2, r * 0.02);
  ctx.lineTo(0, r * 0.16 + open * r * 0.2);
  ctx.closePath();
  inked(ctx, "#ff8a3d", Math.max(0.8, r * 0.07), PS.ink);
  ctx.fillStyle = "rgba(255,120,120,.5)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.55, r * 0.1, r * 0.16, r * 0.1, 0, 0, TAU);
  ctx.ellipse(r * 0.55, r * 0.1, r * 0.16, r * 0.1, 0, 0, TAU);
  ctx.fill();
}
function psBasket(ctx, t) {
  [
    [-14, -15, 0, -0.25],
    [0, -20, 1, 0],
    [14, -15, 2, 0.25],
    [-6, -10, 3, 0.1],
    [8, -9, 4, -0.1],
  ].forEach(([x, y, i, r]) => {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 1.5 + i) * 0.5);
    ctx.rotate(r);
    paintedEgg(ctx, 8.5, i, PS.cols[i], PS.ink);
    ctx.restore();
  });
  ctx.beginPath();
  ctx.moveTo(-26, -8);
  ctx.lineTo(26, -8);
  ctx.quadraticCurveTo(24, 14, 17, 15);
  ctx.lineTo(-17, 15);
  ctx.quadraticCurveTo(-24, 14, -26, -8);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -8, 0, 15, "#e9b877", "#b9793a"), 1.6, PS.ink);
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
  inked(ctx, "#f2cf96", 1.4, PS.ink);
  ctx.beginPath();
  ctx.arc(0, -10, 30, Math.PI * 1.08, Math.PI * 1.92);
  ctx.strokeStyle = PS.ink;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = "#e9b877";
  ctx.lineWidth = 2.6;
  ctx.stroke();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Páscoa",
    reach: { top: 110, side: 64, bottom: 70 },
    mat: ["#241a3a", "#120e20"],
    theme: cardTheme("#8a5cf6", "#f7a531"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.rib = Strand(
        this.loop,
        m.bl + m.arc * 0.5,
        m.arc * 0.5 + m.side + m.arc + m.top * 0.2,
        1,
        3,
        { off: 9, wave: 6, freq: 24, gap: 0.07, size: 12, taper: 0.9 },
      );
      this.rib2 = Strand(
        this.loop,
        m.br + m.arc * 0.5,
        m.arc * 0.5 + m.side * 0.86,
        -1,
        17,
        { off: 9, wave: 6, freq: 24, gap: 0.085, size: 12, taper: 0.9 },
      );
      this.t0 = 0.4;
      this.dur = 2;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.stars = twinkles(14, 71, CARD.w, CARD.h, 24, 74);
      this.fx = Drift(12, 19, { v: [12, 26], s: [5, 9], sway: 12, spin: 2 });
      this.conf = Particles();
      this.rand = rng(4);
      this.done = false;
    },
    reset() {
      this.conf.clear();
      this.rand = rng(4);
      this.done = false;
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand;
      if (!this.done && t > 2.3) {
        this.done = true;
        for (let i = 0; i < 40; i++) {
          const a = -Math.PI / 2 + (R() - 0.5) * 2,
            v = 60 + R() * 150;
          this.conf.add({
            x: CARD.w * 0.72,
            y: -40,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            g: 190,
            drag: 0.8,
            life: 1.4 + R() * 0.9,
            size: 2 + R() * 3,
            rot: R() * TAU,
            vr: (R() - 0.5) * 10,
            color: PS.cols[i % 5][1],
          });
        }
      }
      this.conf.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.3, 1.2);
      for (const s of this.stars) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = a * (0.3 + 0.7 * Math.abs(Math.sin(tt * s.f + s.ph)));
        ctx.rotate(s.ph);
        if (s.s > 2.7) daisy(ctx, s.s * 1.7, 5, "#fff", "#ffd35c");
        else {
          sparkPath(ctx, s.s * 2);
          ctx.fillStyle = ["#ffd6e8", "#d7f5ff", "#fff3b8"][
            Math.floor(s.ph) % 3
          ];
          ctx.fill();
        }
        ctx.restore();
      }
      const g = this.front(T);
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 0.8, 6, (c) => {
        for (const v of [this.rib, this.rib2]) {
          strandLine(c, v, g, [
            [PS.ink, 7.6],
            ["#b99bff", 5],
            ["#fff", 1.4, [5, 5]],
          ]);
          strandBits(c, v, T, this.when, (b, k) => {
            c.rotate(b.a + Math.PI / 2 + Math.sin(tt * 1.3 + b.ph) * 0.07);
            c.translate(0, -b.s * 1.05);
            c.scale(k, k);
            if (b.kind < 0.72) {
              c.rotate((b.i % 2 ? 1 : -1) * 0.25);
              paintedEgg(c, b.s * 0.72, b.i, PS.cols[b.i % 5], PS.ink);
            } else
              daisy(
                c,
                b.s * 0.8,
                6,
                b.i % 2 ? "#ffd6e8" : "#fff",
                "#ffd35c",
                PS.ink,
              );
          });
        }
      });
      // the big chocolate egg with its gold bow, and the basket
      {
        const k = still ? 1 : pop(t, 0.6, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(44, CARD.h + 16);
          ctx.rotate(-0.16 + Math.sin(tt * 1.1) * 0.02);
          ctx.scale(k, k);
          paintedEgg(ctx, 30, 2, ["#9a5a34", "#5b2e16", "#fff"], PS.ink);
          ctx.fillStyle = "#ffd35c";
          ctx.strokeStyle = PS.ink;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.rect(-29, -9, 58, 8);
          ctx.fill();
          ctx.stroke();
          for (const sx of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.bezierCurveTo(sx * 8, -22, sx * 24, -18, sx * 19, -5);
            ctx.bezierCurveTo(sx * 22, 2, sx * 8, 1, 0, -5);
            ctx.closePath();
            inked(ctx, "#ffd35c", 1.4, PS.ink);
          }
          ctx.beginPath();
          ctx.arc(0, -5, 5, 0, TAU);
          inked(ctx, "#fff3a8", 1.3, PS.ink);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 0.9, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w - 40, CARD.h + 26);
          ctx.scale(k * 1.1, k * 1.1);
          psBasket(ctx, tt);
          ctx.restore();
        }
      }
      // top edge: the bunny brings an egg; beside it a big egg cracks and a chick comes out
      {
        const k = still ? 1 : bounceOut((t - 1.1) / 0.85);
        if (still || t > 1.1) {
          const c = tt % 5;
          ctx.save();
          ctx.translate(CARD.w * 0.28, 2 - (1 - k) * 150);
          ctx.scale(1.55, 1.55);
          bunny(ctx, tt, {
            ink: PS.ink,
            hold: "egg",
            inner: "#e3d4ff",
            blink: !still && blinking(tt, 3.2),
            look: Math.sin(tt * 0.7) * 0.7,
            twitch: !still && c > 4.2 ? Math.sin((c - 4.2) * 14) : 0,
          });
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.5, 0.5);
        if (k > 0) {
          const crack = still ? 1 : clamp((t - 2.2) / 0.35),
            wob = !still && t > 1.9 && t < 2.3 ? Math.sin(t * 40) * 0.08 : 0,
            c = tt % 4,
            x = CARD.w * 0.72;
          ctx.save();
          ctx.translate(x, 0);
          ctx.rotate(wob);
          ctx.scale(k, k);
          // back half of the shell, the chick, then the front half with its jagged edge
          ctx.save();
          ctx.beginPath();
          ctx.rect(-40, -22, 80, 26);
          ctx.clip();
          ctx.translate(0, -22);
          paintedEgg(ctx, 24, 1, PS.cols[1], PS.ink);
          ctx.restore();
          if (crack > 0) {
            const up = easeOutBack(crack) * 20,
              ch = !still && c < 0.5 ? Math.sin((c / 0.5) * Math.PI) : 0;
            ctx.save();
            ctx.translate(0, -22 - up - ch * 3);
            psChick(
              ctx,
              15,
              tt,
              !still && blinking(tt, 2.4),
              ch,
              Math.sin(tt * 14) * ch,
            );
            ctx.restore();
          }
          ctx.beginPath();
          ctx.moveTo(-23, -22);
          for (let i = 0; i <= 8; i++)
            ctx.lineTo(-23 + i * 5.75, -22 + (i % 2 ? -7 : 0));
          ctx.bezierCurveTo(24, 2, -24, 2, -23, -22);
          ctx.closePath();
          inked(
            ctx,
            grad(ctx, -24, -20, 24, 2, "#d7f5ff", "#8fcdf2"),
            1.6,
            PS.ink,
          );
          ctx.fillStyle = "#fff";
          for (const [px, py] of [
            [-10, -9],
            [8, -11],
            [0, -4],
          ]) {
            ctx.beginPath();
            ctx.arc(px, py, 2.6, 0, TAU);
            ctx.fill();
          }
          // the top of the shell flies off
          {
            const f = still ? 1 : clamp((t - 2.2) / 0.9);
            if (f < 1 || still) {
              ctx.save();
              ctx.translate(
                still ? 30 : f * 46,
                still ? -52 : -40 - Math.sin(f * Math.PI) * 46 + f * 26,
              );
              ctx.rotate(still ? 0.9 : f * 3);
              ctx.beginPath();
              ctx.moveTo(-18, 0);
              for (let i = 0; i <= 6; i++)
                ctx.lineTo(-18 + i * 6, i % 2 ? 6 : 0);
              ctx.bezierCurveTo(16, -22, -16, -22, -18, 0);
              ctx.closePath();
              inked(ctx, "#d7f5ff", 1.5, PS.ink);
              ctx.restore();
            }
          }
          ctx.restore();
        }
      }
      for (const p of this.conf.list) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, (p.life - p.age) * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
        ctx.restore();
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
          [PS.ink, 7.6],
          ["#b99bff", 4.8],
          ["#fff3b8", 1.6, [4, 6], 6],
        ],
        tt,
      );
      [
        [2.25, 0],
        [1.75, 3],
        [1.25, 2],
      ].forEach(([an, i], j) => {
        const k2 = still ? 1 : pop(t, 0.9 + j * 0.1, 0.4);
        if (k2 <= 0) return;
        ctx.save();
        ctx.translate(77 + Math.cos(an) * (R + 9), 77 + Math.sin(an) * (R + 9));
        ctx.rotate(an - Math.PI / 2 + Math.sin(tt * 2 + j) * 0.08);
        ctx.scale(k2, k2);
        paintedEgg(ctx, j === 1 ? 8.5 : 7, i, PS.cols[i], PS.ink);
        ctx.restore();
      });
      ctx.restore();
      const k = still ? 1 : pop(t, 0.5, 0.6),
        c = tt % 4.2,
        tw = !still && c < 0.4 ? Math.sin((c / 0.4) * Math.PI) : 0;
      for (const sx of [-1, 1]) {
        ctx.save();
        ctx.translate(77 + sx * 14 - 8, 77 - R + 4);
        ctx.rotate(sx * (0.2 + (sx > 0 ? tw * 0.35 : 0)) - 0.12);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.ellipse(0, -18, 8.5, 21, 0, 0, TAU);
        inked(ctx, grad(ctx, 0, -38, 0, 0, "#ffffff", "#e9e0f7"), 1.8, PS.ink);
        ctx.beginPath();
        ctx.ellipse(0, -17, 4.2, 14, 0, 0, TAU);
        ctx.fillStyle = "#e3d4ff";
        ctx.fill();
        ctx.restore();
      }
      // a chick has made itself at home on the ring
      {
        const k2 = still ? 1 : pop(t, 1.3, 0.5),
          ch =
            !still && (tt + 1) % 3.6 < 0.4
              ? Math.sin((((tt + 1) % 3.6) / 0.4) * Math.PI)
              : 0;
        if (k2 > 0) {
          ctx.save();
          ctx.translate(77 + 30, 77 - R - 4 - ch * 3);
          ctx.rotate(0.3);
          ctx.scale(k2, k2);
          psChick(
            ctx,
            10.5,
            tt,
            !still && blinking(tt, 2.8, 1),
            ch,
            Math.sin(tt * 14) * ch,
          );
          ctx.restore();
        }
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(
        ctx,
        CARD.w * 0.5,
        CARD.h + 20,
        200,
        `rgba(190,150,255,${0.22 * a})`,
      );
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = a * 0.55;
        if (p.k < 0.35)
          paintedEgg(
            ctx,
            p.s * 0.7,
            p.i,
            PS.cols[p.i % 5],
            "rgba(40,20,60,.6)",
          );
        else {
          ctx.fillStyle = PS.cols[p.i % 5][p.k < 0.7 ? 1 : 0];
          ctx.fillRect(-p.s * 0.5, -p.s * 0.2, p.s, p.s * 0.4);
        }
        ctx.restore();
      });
    },
  };
}
