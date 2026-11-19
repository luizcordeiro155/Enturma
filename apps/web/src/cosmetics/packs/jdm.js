// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  smooth,
  easeOutCubic,
  rng,
  Particles,
  glow,
  inked,
  pop,
  fade,
  grad,
  rgrad,
  ringBase,
  Strand,
  strandLine,
  Drift,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Noite JDM ----------
const JD = {
  ink: "#0c0a1a",
  pink: "#ff2e88",
  cyan: "#19c2ff",
  lime: "#c6ff3d",
};
// An original sports coupe in profile, wheels on (0,0), heading right, 156 long. `spin` turns the wheels, `lights` 0..1.
function jdCar(ctx, t, spin, lights, o = {}) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const sq = o.squat || 0;
  glow(ctx, 0, 2, 80, `rgba(25,194,255,${0.3 * lights})`);
  ctx.fillStyle = `rgba(25,194,255,${0.5 * lights})`;
  ctx.beginPath();
  ctx.ellipse(0, 3, 62, 3.4, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(0, -sq);
  ctx.rotate(-sq * 0.012);
  // wing
  ctx.beginPath();
  ctx.moveTo(-64, -29);
  ctx.lineTo(-62, -39);
  ctx.moveTo(-52, -30);
  ctx.lineTo(-52, -39);
  ctx.strokeStyle = JD.ink;
  ctx.lineWidth = 3.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-74, -42);
  ctx.lineTo(-46, -41);
  ctx.lineTo(-46, -38);
  ctx.lineTo(-72, -37);
  ctx.closePath();
  inked(ctx, "#1c1a2e", 1.5, JD.ink);
  // body
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-76, -12);
    ctx.lineTo(-75, -27);
    ctx.quadraticCurveTo(-64, -31, -46, -32);
    ctx.bezierCurveTo(-36, -43, -24, -46, -6, -46);
    ctx.bezierCurveTo(8, -46, 20, -40, 30, -31);
    ctx.bezierCurveTo(48, -29, 66, -26, 76, -19);
    ctx.quadraticCurveTo(80, -14, 78, -7);
    ctx.lineTo(62, -6);
    ctx.arc(48, -6, 14.5, 0, Math.PI, true);
    ctx.lineTo(-31.5, -6);
    ctx.arc(-46, -6, 14.5, 0, Math.PI, true);
    ctx.lineTo(-74, -6);
    ctx.closePath();
  };
  body();
  inked(
    ctx,
    grad(ctx, 0, -46, 0, -6, "#ffffff", "#e9ecf5", "#9aa3bd"),
    1.9,
    JD.ink,
  );
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = JD.pink;
  ctx.beginPath();
  ctx.moveTo(-80, -19);
  ctx.lineTo(80, -15);
  ctx.lineTo(80, -11.5);
  ctx.lineTo(-80, -15.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = JD.cyan;
  ctx.beginPath();
  ctx.moveTo(-80, -14.6);
  ctx.lineTo(80, -10.6);
  ctx.lineTo(80, -9);
  ctx.lineTo(-80, -13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(10,10,30,.28)";
  ctx.fillRect(-80, -9, 160, 6);
  ctx.restore();
  // glass
  ctx.beginPath();
  ctx.moveTo(-40, -32);
  ctx.bezierCurveTo(-33, -40, -24, -42.5, -8, -42.5);
  ctx.lineTo(-6, -31.5);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -43, 0, -31, "#2a3a6a", "#0f1630"), 1.4, JD.ink);
  ctx.beginPath();
  ctx.moveTo(-3, -42.5);
  ctx.bezierCurveTo(8, -42, 17, -38, 24, -31.5);
  ctx.lineTo(-2, -31.5);
  ctx.closePath();
  inked(ctx, grad(ctx, 0, -43, 0, -31, "#2a3a6a", "#0f1630"), 1.4, JD.ink);
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-30, -39);
  ctx.lineTo(-24, -33.5);
  ctx.moveTo(4, -40.5);
  ctx.lineTo(12, -33.5);
  ctx.stroke();
  ctx.strokeStyle = "rgba(12,10,26,.6)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-6, -31.5);
  ctx.lineTo(-8, -9);
  ctx.moveTo(26, -31);
  ctx.quadraticCurveTo(30, -20, 30, -9);
  ctx.moveTo(-4, -24);
  ctx.lineTo(4, -24);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(24, -32);
  ctx.lineTo(31, -35);
  ctx.lineTo(32, -31);
  ctx.closePath();
  inked(ctx, "#e9ecf5", 1.2, JD.ink);
  // lights
  glow(ctx, 74, -18, 30, `rgba(255,250,210,${0.6 * lights})`);
  ctx.beginPath();
  ctx.moveTo(62, -24);
  ctx.lineTo(75, -19.5);
  ctx.lineTo(74, -16.5);
  ctx.lineTo(60, -20.5);
  ctx.closePath();
  inked(ctx, lights > 0.3 ? "#fffbe0" : "#8f97ad", 1.1, JD.ink);
  glow(ctx, -76, -22, 22, `rgba(255,40,70,${0.6 * lights})`);
  ctx.beginPath();
  ctx.roundRect(-76.5, -26, 4.5, 9, 1.5);
  inked(ctx, "#ff2a4a", 1, JD.ink);
  if (lights > 0.3) {
    ctx.save();
    ctx.globalAlpha = 0.2 * lights;
    ctx.beginPath();
    ctx.moveTo(76, -20);
    ctx.lineTo(150, -32);
    ctx.lineTo(150, 4);
    ctx.lineTo(76, -15);
    ctx.closePath();
    ctx.fillStyle = grad(ctx, 76, 0, 150, 0, "#fffbe0", "rgba(255,251,224,0)");
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.roundRect(-82, -9.5, 9, 3.4, 1.7);
  inked(ctx, "#8f97ad", 1, JD.ink);
  ctx.restore();
  // wheels
  for (const x of [-46, 48]) {
    ctx.beginPath();
    ctx.arc(x, -12, 12.5, 0, TAU);
    inked(ctx, "#14121f", 1.6, JD.ink);
    ctx.beginPath();
    ctx.arc(x, -12, 8.2, 0, TAU);
    inked(ctx, rgrad(ctx, x - 2, -14, 10, "#f2f5ff", "#8f97ad"), 1.1, JD.ink);
    ctx.save();
    ctx.translate(x, -12);
    ctx.rotate(spin);
    ctx.strokeStyle = JD.ink;
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.rotate(TAU / 5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -7.6);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(x, -12, 2.2, 0, TAU);
    ctx.fillStyle = JD.pink;
    ctx.fill();
  }
}
function jdCone(ctx, s) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.roundRect(-s * 0.7, -s * 0.16, s * 1.4, s * 0.2, 2);
  inked(ctx, "#ff7a1c", 1.3, JD.ink);
  ctx.beginPath();
  ctx.moveTo(-s * 0.46, -s * 0.16);
  ctx.lineTo(-s * 0.12, -s * 1.2);
  ctx.lineTo(s * 0.12, -s * 1.2);
  ctx.lineTo(s * 0.46, -s * 0.16);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, -s * 0.46, 0, s * 0.46, 0, "#ff9a3c", "#e0560f"),
    1.3,
    JD.ink,
  );
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(-s * 0.33, -s * 0.55);
  ctx.lineTo(-s * 0.25, -s * 0.8);
  ctx.lineTo(s * 0.25, -s * 0.8);
  ctx.lineTo(s * 0.33, -s * 0.55);
  ctx.closePath();
  ctx.fill();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Noite JDM",
    reach: { top: 96, side: 62, bottom: 84 },
    mat: ["#120a26", "#080512"],
    theme: cardTheme("#d91a72", "#0f8fc4"),
    init() {
      this.loop = frameLoop(CARD, 10);
      const m = this.loop.m;
      this.neon = [
        Strand(this.loop, m.tl + m.arc, m.side + m.arc, -1, 1, {
          off: 0,
          wave: 0,
          gap: 0.09,
          size: 8,
          taper: 1,
          outward: 1,
        }),
        Strand(this.loop, m.tr, m.arc + m.side, 1, 2, {
          off: 0,
          wave: 0,
          gap: 0.09,
          size: 8,
          taper: 1,
          outward: 1,
        }),
      ];
      this.t0 = 0.3;
      this.dur = 1.5;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.fx = Drift(16, 97, { v: [70, 160], s: [10, 30], sway: 0, spin: 0 });
      this.smoke = Particles();
      this.rand = rng(7);
      const R = rng(5);
      this.sky = [];
      let x = -24;
      while (x < CARD.w + 24) {
        const w = 14 + R() * 20,
          h = 16 + R() * 44;
        this.sky.push({ x, w, h, win: Math.floor(R() * 1e6) });
        x += w + 2;
      }
    },
    reset() {
      this.smoke.clear();
      this.rand = rng(7);
    },
    carX(t, still) {
      return still
        ? CARD.w * 0.5
        : -180 + easeOutCubic(clamp((t - 0.5) / 2.1)) * (CARD.w * 0.5 + 180);
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand,
        x = this.carX(t, false);
      if (t > 0.5 && t < 2.5)
        for (let i = 0; i < 2; i++)
          this.smoke.add({
            x: x - 50 + R() * 10,
            y: -8 - R() * 6,
            vx: -40 - R() * 60,
            vy: -14 - R() * 26,
            drag: 1.2,
            life: 0.8 + R() * 0.7,
            size: 7 + R() * 9,
          });
      else if (t > 2.6 && R() < dt * 5)
        this.smoke.add({
          x: x - 82,
          y: -10,
          vx: -22 - R() * 10,
          vy: -8 - R() * 8,
          drag: 0.6,
          life: 1 + R() * 0.6,
          size: 3 + R() * 3,
        });
      this.smoke.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      // the city behind the top edge, a moon, windows blinking
      ctx.save();
      ctx.globalAlpha = a;
      glow(ctx, CARD.w * 0.84, -78, 48, "rgba(255,170,220,.4)");
      ctx.beginPath();
      ctx.arc(CARD.w * 0.84, -78, 15, 0, TAU);
      ctx.fillStyle = "#ffe6f4";
      ctx.fill();
      for (const b of this.sky) {
        const k = still
          ? 1
          : easeOutCubic(clamp((t - 0.2 - (b.x / CARD.w) * 0.5) / 0.7));
        ctx.fillStyle = grad(ctx, 0, -b.h, 0, 0, "#2a1c52", "#140d2a");
        ctx.fillRect(b.x, -b.h * k, b.w, b.h * k);
        let s = b.win;
        for (let wy = 6; wy < b.h * k - 5; wy += 8)
          for (let wx = 4; wx < b.w - 4; wx += 7) {
            s = (s * 16807) % 2147483647;
            const on = s % 7 < 3,
              bl = on && s % 29 === 0 ? Math.sin(tt * 2 + s) > 0 : on;
            if (bl) {
              ctx.fillStyle =
                s % 3 ? "rgba(255,214,120,.85)" : "rgba(120,220,255,.85)";
              ctx.fillRect(b.x + wx, -b.h * k + wy, 3, 4);
            }
          }
      }
      ctx.restore();
      // neon tubes down both sides, with chevrons that run forwards
      const g = this.front(T);
      this.neon.forEach((v, i) => {
        const col = i ? JD.cyan : JD.pink,
          rgb = i ? "25,194,255" : "255,46,136",
          fl = still
            ? 1
            : t < 2
              ? Math.sin(t * 37 + i) > -0.6
                ? 1
                : 0.3
              : 0.9 + 0.1 * Math.sin(tt * 9 + i);
        ctx.save();
        ctx.globalAlpha = fl;
        strandLine(ctx, v, g, [
          [`rgba(${rgb},.22)`, 16],
          [`rgba(${rgb},.5)`, 8],
          [col, 4],
          ["#fff", 1.4],
        ]);
        ctx.restore();
        for (const b of v.bits) {
          if (T < this.when(b.u)) continue;
          const on = still
            ? 0.8
            : 0.3 + 0.7 * Math.max(0, Math.sin(tt * 5 - b.i * 0.9));
          ctx.save();
          ctx.translate(b.x + b.nx * 14, b.y + b.ny * 14);
          ctx.rotate(
            Math.atan2(b.ty, b.tx) + (i ? Math.PI : 0) + (Math.PI / 2) * 0,
          );
          ctx.globalAlpha = on;
          ctx.beginPath();
          ctx.moveTo(-4, -5);
          ctx.lineTo(2, 0);
          ctx.lineTo(-4, 5);
          ctx.strokeStyle = i ? JD.pink : JD.cyan;
          ctx.lineWidth = 2.4;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.restore();
        }
      });
      // under the card: the road, a vending machine, cones
      {
        const y = CARD.h + 46;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.roundRect(-30, y, CARD.w + 60, 30, 8);
        ctx.fillStyle = grad(ctx, 0, y, 0, y + 30, "#2a2440", "#120e22");
        ctx.fill();
        ctx.strokeStyle = JD.ink;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.rect(-28, y, CARD.w + 56, 30);
        ctx.clip();
        ctx.fillStyle = "#ffe14d";
        for (let i = -1; i < 9; i++) {
          const x = ((((i * 54 - tt * 60) % 486) + 486) % 486) - 60;
          ctx.fillRect(x, y + 13, 28, 3.4);
        }
        ctx.restore();
        ctx.restore();
      }
      {
        const k = still ? 1 : pop(t, 0.7, 0.6);
        if (k > 0) {
          const fl = 0.85 + 0.15 * Math.sin(tt * 13);
          ctx.save();
          ctx.translate(CARD.w - 30, CARD.h + 48);
          ctx.scale(k * 0.84, k * 0.84);
          glow(ctx, 0, -26, 54, `rgba(25,194,255,${0.4 * fl})`);
          ctx.beginPath();
          ctx.roundRect(-16, -52, 32, 52, 3);
          inked(
            ctx,
            grad(ctx, -16, 0, 16, 0, "#f2f5ff", "#b8c0d8"),
            1.6,
            JD.ink,
          );
          ctx.beginPath();
          ctx.roundRect(-13, -48, 26, 26, 2);
          inked(ctx, `rgba(190,240,255,${fl})`, 1.2, JD.ink);
          const cans = [
            JD.pink,
            JD.lime,
            "#ffe14d",
            JD.cyan,
            "#ff7a1c",
            "#b15cff",
          ];
          for (let r = 0; r < 2; r++)
            for (let c = 0; c < 4; c++) {
              ctx.fillStyle = cans[(r * 4 + c) % 6];
              ctx.fillRect(-11 + c * 6, -46 + r * 12, 4, 9);
            }
          ctx.fillStyle = JD.pink;
          ctx.fillRect(-13, -19, 26, 3);
          ctx.beginPath();
          ctx.roundRect(-9, -12, 18, 7, 1.5);
          inked(ctx, "#14121f", 1, JD.ink);
          ctx.restore();
        }
      }
      [
        [24, 15, 0.9],
        [44, 12, 1.05],
      ].forEach(([x, s, d]) => {
        const k = still ? 1 : pop(t, d, 0.5);
        if (k <= 0) return;
        ctx.save();
        ctx.translate(x, CARD.h + 48);
        ctx.scale(k, k);
        jdCone(ctx, s);
        ctx.restore();
      });
      // the coupe slides in sideways along the top edge, smoke off the rear tyres, and parks
      for (const p of this.smoke.list) {
        const q = p.age / p.life;
        glow(
          ctx,
          p.x,
          p.y,
          p.size * (1 + q * 1.6),
          `rgba(230,230,245,${0.34 * (1 - q)})`,
        );
      }
      {
        const x = this.carX(t, still),
          k = still ? 1 : clamp((t - 0.5) / 2.1),
          drift = still ? 0 : Math.sin(k * Math.PI) * (1 - k);
        ctx.save();
        ctx.translate(x, 1);
        ctx.rotate(-drift * 0.1);
        ctx.scale(1.18, 1.18);
        jdCar(
          ctx,
          tt,
          still ? 0.4 : -x * 0.08 - (k < 1 ? t * 14 : 0),
          still ? 1 : clamp((t - 0.4) / 0.4),
          { squat: drift * 3 + (still ? 0 : Math.sin(tt * 22) * 0.3) },
        );
        ctx.restore();
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r;
      // a rev counter: ticks round the avatar, the needle runs up to the red on arrival and then idles
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        77,
        77,
        R + 4,
        [
          [JD.ink, 9],
          ["#1c1a2e", 6.4],
        ],
        tt,
      );
      const a0 = Math.PI * 0.75,
        span = Math.PI * 1.5;
      for (let i = 0; i <= 24; i++) {
        const an = a0 + (i / 24) * span,
          big = i % 3 === 0,
          r0 = R + 8,
          r1 = R + (big ? 15 : 12);
        ctx.beginPath();
        ctx.moveTo(77 + Math.cos(an) * r0, 77 + Math.sin(an) * r0);
        ctx.lineTo(77 + Math.cos(an) * r1, 77 + Math.sin(an) * r1);
        ctx.strokeStyle =
          i >= 20 ? "#ff2a4a" : big ? "#fff" : "rgba(255,255,255,.6)";
        ctx.lineWidth = big ? 2.2 : 1.3;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(77, 77, R + 4, a0, a0 + span * (20 / 24));
      ctx.strokeStyle = JD.cyan;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(77, 77, R + 4, a0 + span * (20 / 24), a0 + span);
      ctx.strokeStyle = "#ff2a4a";
      ctx.lineWidth = 2;
      ctx.stroke();
      const rev = still
          ? 0.3
          : t < 0.5
            ? 0
            : t < 1.5
              ? easeOutCubic((t - 0.5) / 1)
              : t < 2.3
                ? 1 - (t - 1.5) * 0.9
                : 0.24 +
                  0.05 * Math.sin(tt * 11) +
                  (tt % 5 > 4.3
                    ? Math.sin((((tt % 5) - 4.3) / 0.7) * Math.PI) * 0.5
                    : 0),
        an = a0 + span * clamp(rev);
      glow(
        ctx,
        77 + Math.cos(an) * (R + 10),
        77 + Math.sin(an) * (R + 10),
        12,
        `rgba(255,46,136,${0.6 + rev * 0.3})`,
      );
      ctx.beginPath();
      ctx.moveTo(77 + Math.cos(an) * (R - 2), 77 + Math.sin(an) * (R - 2));
      ctx.lineTo(77 + Math.cos(an) * (R + 17), 77 + Math.sin(an) * (R + 17));
      ctx.strokeStyle = JD.ink;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = JD.pink;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.restore();
      // a chequered flag at the bottom
      {
        const k = still ? 1 : pop(t, 1.2, 0.5);
        ctx.save();
        ctx.translate(77 + 4, 77 + R + 9);
        ctx.rotate(-0.12);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.roundRect(-13, -7, 26, 14, 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.fillStyle = JD.ink;
        for (let r = 0; r < 3; r++)
          for (let c = 0; c < 5; c++)
            if ((r + c) % 2)
              ctx.fillRect(-13 + c * 5.2, -7 + r * 4.67, 5.2, 4.67);
        ctx.beginPath();
        ctx.roundRect(-13, -7, 26, 14, 2);
        ctx.strokeStyle = JD.ink;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      glow(ctx, 0, CARD.h * 0.5, 190, `rgba(255,46,136,${0.2 * a})`);
      glow(ctx, CARD.w, CARD.h * 0.6, 190, `rgba(25,194,255,${0.2 * a})`);
      // streaks of light, fast at first
      const rush = still ? 0.25 : 0.25 + 0.75 * (1 - smooth((t - 0.6) / 2.2));
      this.fx.each(tt * (0.5 + rush), CARD.h, CARD.w, (p, y, x) => {
        ctx.globalAlpha = a * (0.12 + 0.5 * rush) * (0.4 + 0.6 * p.k);
        ctx.fillStyle = p.i % 2 ? JD.pink : JD.cyan;
        ctx.fillRect(x - p.s * (1 + rush * 2), y, p.s * (1 + rush * 2), 1.4);
      });
      ctx.globalAlpha = 1;
      // the road coming at you at the bottom of the card
      ctx.save();
      ctx.globalAlpha = a * 0.5;
      ctx.beginPath();
      ctx.moveTo(CARD.w * 0.5 - 12, CARD.h - 96);
      ctx.lineTo(CARD.w * 0.5 + 12, CARD.h - 96);
      ctx.lineTo(CARD.w + 30, CARD.h);
      ctx.lineTo(-30, CARD.h);
      ctx.closePath();
      ctx.fillStyle = grad(
        ctx,
        0,
        CARD.h - 96,
        0,
        CARD.h,
        "rgba(10,8,24,0)",
        "rgba(10,8,24,.8)",
      );
      ctx.fill();
      ctx.fillStyle = "#ffe14d";
      for (let i = 0; i < 5; i++) {
        const u = (i / 5 + tt * 0.45) % 1,
          y = CARD.h - 96 + u * u * 96,
          w = 1 + u * 6;
        ctx.globalAlpha = a * 0.6 * u;
        ctx.fillRect(CARD.w * 0.5 - w / 2, y, w, 4 + u * 12);
      }
      ctx.restore();
    },
  };
}
