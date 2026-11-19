// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  easeOutCubic,
  easeInOut,
  rng,
  Particles,
  pathFrom,
  glow,
  inked,
  tuft,
  pop,
  fade,
  grad,
  rgrad,
  gearPath,
  ringBase,
  Strand,
  strandLine,
  Drift,
  frameLoop,
  cardTheme,
} from "../kit";

// ---------- Mecha ----------
const MC = {
  ink: "#0b1020",
  blue: "#2b6fff",
  white: "#eef3ff",
  grey: "#8f9bb8",
  orange: "#ff5a1f",
  cyan: "#4df3ff",
};
const mcPlate = (ctx, pts, fill, lw = 1.7) => {
  pathFrom(ctx, pts);
  inked(ctx, fill, lw, MC.ink);
};
// An original robot standing on (0,0), about 86 wide and 104 tall. `thrust` lights the boosters, `scan` moves the visor light.
function mcRobot(ctx, t, thrust, scan, o = {}) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const core = 0.6 + 0.4 * Math.sin(t * 3),
    br = Math.sin(t * 1.6) * 0.8,
    arm = o.arm || 0;
  // booster flames behind the legs and back
  if (thrust > 0.02)
    for (const [x, y, s] of [
      [-13, -2, 1],
      [13, -2, 1],
      [-27, -62, 0.7],
      [27, -62, 0.7],
    ]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 2);
      const len = (26 + Math.sin(t * 40 + x) * 6) * thrust * s;
      glow(ctx, len * 0.4, 0, 22 * s, `rgba(120,200,255,${0.5 * thrust})`);
      tuft(ctx, len * 1.5, 12 * s, Math.sin(t * 30 + x) * 2);
      ctx.fillStyle = grad(
        ctx,
        0,
        0,
        len * 1.5,
        0,
        "#ffffff",
        "#7fe0ff",
        "rgba(43,111,255,0)",
      );
      ctx.fill();
      ctx.restore();
    }
  // legs
  for (const sx of [-1, 1]) {
    mcPlate(
      ctx,
      [
        [sx * 6, -40],
        [sx * 18, -40],
        [sx * 19, -20],
        [sx * 8, -20],
      ],
      grad(ctx, 0, -40, 0, -20, MC.white, MC.grey),
    );
    mcPlate(
      ctx,
      [
        [sx * 7, -22],
        [sx * 20, -22],
        [sx * 24, -4],
        [sx * 5, -4],
      ],
      grad(ctx, 0, -22, 0, -4, MC.blue, "#173a9a"),
    );
    mcPlate(
      ctx,
      [
        [sx * 3, -5],
        [sx * 27, -5],
        [sx * 29, 0],
        [sx * 2, 0],
      ],
      "#2a3350",
    );
    ctx.beginPath();
    ctx.arc(sx * 13, -21, 4, 0, TAU);
    inked(ctx, MC.orange, 1.3, MC.ink);
  }
  mcPlate(
    ctx,
    [
      [-17, -48],
      [17, -48],
      [14, -38],
      [-14, -38],
    ],
    "#2a3350",
  );
  ctx.save();
  ctx.translate(0, br);
  // arms, behind the torso
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * 30, -74);
    ctx.rotate(sx * (0.1 + (sx > 0 ? -arm : 0)));
    mcPlate(
      ctx,
      [
        [-6, 4],
        [6, 4],
        [7, 24],
        [-7, 24],
      ],
      grad(ctx, 0, 4, 0, 24, MC.white, MC.grey),
    );
    mcPlate(
      ctx,
      [
        [-8, 22],
        [8, 22],
        [9, 42],
        [-9, 42],
      ],
      grad(ctx, 0, 22, 0, 42, MC.blue, "#173a9a"),
    );
    mcPlate(
      ctx,
      [
        [-6, 41],
        [6, 41],
        [5, 50],
        [-5, 50],
      ],
      "#2a3350",
    );
    ctx.restore();
  }
  // torso
  mcPlate(
    ctx,
    [
      [-22, -84],
      [22, -84],
      [26, -64],
      [14, -46],
      [-14, -46],
      [-26, -64],
    ],
    grad(ctx, -24, -84, 24, -46, MC.white, "#c3cde6", MC.grey),
    1.9,
  );
  mcPlate(
    ctx,
    [
      [-10, -80],
      [10, -80],
      [7, -68],
      [-7, -68],
    ],
    "#2a3350",
  );
  glow(ctx, 0, -60, 20, `rgba(77,243,255,${0.6 * core})`);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    ctx.lineTo(Math.cos(a) * 8, -60 + Math.sin(a) * 8);
  }
  ctx.closePath();
  inked(ctx, rgrad(ctx, 0, -60, 9, "#ffffff", MC.cyan, "#1a8fd0"), 1.5, MC.ink);
  for (const sx of [-1, 1]) {
    mcPlate(
      ctx,
      [
        [sx * 20, -90],
        [sx * 42, -88],
        [sx * 44, -72],
        [sx * 24, -70],
      ],
      grad(ctx, 0, -90, 0, -70, MC.blue, "#173a9a"),
      1.9,
    );
    ctx.beginPath();
    ctx.moveTo(sx * 26, -85);
    ctx.lineTo(sx * 40, -84);
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    mcPlate(
      ctx,
      [
        [sx * 15, -64],
        [sx * 22, -64],
        [sx * 18, -52],
        [sx * 13, -52],
      ],
      MC.orange,
      1.3,
    );
  }
  // head: a visor, one antenna blade, vents
  ctx.save();
  ctx.translate(0, -92);
  ctx.rotate((o.look || 0) * 0.05);
  mcPlate(
    ctx,
    [
      [10, -12],
      [14, -34],
      [17, -12],
    ],
    MC.orange,
    1.4,
  );
  mcPlate(
    ctx,
    [
      [-13, 2],
      [-14, -11],
      [-7, -17],
      [7, -17],
      [14, -11],
      [13, 2],
      [6, 7],
      [-6, 7],
    ],
    grad(ctx, 0, -17, 0, 7, MC.white, "#b8c3e0"),
    1.8,
  );
  mcPlate(
    ctx,
    [
      [-11, -8],
      [11, -8],
      [9, -1],
      [-9, -1],
    ],
    "#0a0f1e",
    1.3,
  );
  glow(ctx, scan * 8, -4.5, 9, "rgba(77,243,255,.8)");
  ctx.beginPath();
  ctx.roundRect(scan * 8 - 3.4, -6.4, 6.8, 3.8, 1.6);
  ctx.fillStyle = MC.cyan;
  ctx.fill();
  ctx.strokeStyle = MC.ink;
  ctx.lineWidth = 1.1;
  for (const x of [-3, 0, 3]) {
    ctx.beginPath();
    ctx.moveTo(x, 1.5);
    ctx.lineTo(x, 5);
    ctx.stroke();
  }
  mcPlate(
    ctx,
    [
      [-3, -17],
      [3, -17],
      [2, -22],
      [-2, -22],
    ],
    "#ff2a4a",
    1.2,
  );
  ctx.restore();
  ctx.restore();
}
function mcDrone(ctx, s, t, ph) {
  ctx.lineJoin = "round";
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(
      sx * s * 1.1,
      -s * 0.5,
      s * 0.8,
      s * 0.14 + Math.abs(Math.sin(t * 40 + ph)) * s * 0.08,
      0,
      0,
      TAU,
    );
    ctx.fillStyle = "rgba(200,230,255,.5)";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx * s * 0.5, 0);
    ctx.lineTo(sx * s * 1.1, -s * 0.4);
    ctx.strokeStyle = MC.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.7, s * 0.46, 0, 0, TAU);
  inked(
    ctx,
    grad(ctx, 0, -s * 0.5, 0, s * 0.5, MC.white, MC.grey),
    1.4,
    MC.ink,
  );
  const on = Math.sin(t * 6 + ph) > 0;
  glow(ctx, 0, s * 0.1, s * 0.8, `rgba(255,60,80,${on ? 0.7 : 0.15})`);
  ctx.beginPath();
  ctx.arc(0, s * 0.1, s * 0.2, 0, TAU);
  ctx.fillStyle = on ? "#ff5a6a" : "#7a1a2a";
  ctx.fill();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Mecha",
    reach: { top: 122, side: 64, bottom: 62 },
    mat: ["#0e1630", "#070b18"],
    theme: cardTheme("#2458d6", "#c9420f"),
    init() {
      this.loop = frameLoop(CARD, 10);
      const m = this.loop.m;
      this.pipes = [
        Strand(this.loop, m.tl + m.arc, m.side + m.arc, -1, 1, {
          off: 0,
          wave: 0,
          gap: 0.1,
          size: 8,
          taper: 1,
        }),
        Strand(this.loop, m.tr, m.arc + m.side, 1, 2, {
          off: 0,
          wave: 0,
          gap: 0.1,
          size: 8,
          taper: 1,
        }),
      ];
      this.t0 = 0.3;
      this.dur = 1.4;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.fx = Drift(18, 101, {
        v: [-34, -12],
        s: [1.2, 3],
        sway: 4,
        spin: 0,
      });
      this.dust = Particles();
      this.rand = rng(9);
      this.landed = false;
    },
    reset() {
      this.dust.clear();
      this.rand = rng(9);
      this.landed = false;
    },
    update(dt, t, still) {
      if (still) return;
      const R = this.rand;
      if (!this.landed && t > 1.75) {
        this.landed = true;
        for (let i = 0; i < 26; i++) {
          const sx = R() < 0.5 ? -1 : 1;
          this.dust.add({
            x: CARD.w * 0.3 + sx * 14,
            y: -2,
            vx: sx * (40 + R() * 150),
            vy: -R() * 34,
            drag: 2.4,
            life: 0.6 + R() * 0.6,
            size: 6 + R() * 9,
          });
        }
      }
      this.dust.update(dt);
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1),
        L = this.loop.L;
      // conduits down both sides: metal segments, and a pulse of energy that travels
      const g = this.front(T);
      this.pipes.forEach((v, i) => {
        strandLine(ctx, v, g, [
          [MC.ink, 9],
          ["#3a4668", 6.4],
          ["#5c6c98", 2, [10, 6]],
        ]);
        const last = Math.floor(clamp(g) * v.n);
        for (let j = 0; j < 3; j++) {
          const u = (((tt * 0.35 + j / 3 + i * 0.17) % 1) + 1) % 1,
            p = v.pts[Math.max(0, Math.min(last, Math.round(u * v.n)))];
          if (u * v.n > last) continue;
          glow(ctx, p.x, p.y, 13, "rgba(77,243,255,.75)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2, 0, TAU);
          ctx.fillStyle = "#fff";
          ctx.fill();
        }
        for (const b of v.bits) {
          if (T < this.when(b.u)) continue;
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(Math.atan2(b.ty, b.tx));
          ctx.beginPath();
          ctx.roundRect(-5, -6.5, 10, 13, 2);
          inked(
            ctx,
            grad(ctx, 0, -6.5, 0, 6.5, "#8f9bb8", "#4a567a"),
            1.3,
            MC.ink,
          );
          ctx.fillStyle = b.i % 3 ? MC.cyan : MC.orange;
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(tt * 4 + b.i);
          ctx.fillRect(-2.5, -1.5, 5, 3);
          ctx.restore();
        }
      });
      // lock-on brackets close in on the four corners
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.3) / 0.9)),
          d = 20 + (1 - k) * 70,
          p = 0.6 + 0.4 * Math.sin(tt * 5);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = MC.cyan;
        ctx.lineWidth = 2.6;
        ctx.lineCap = "square";
        for (const [cx, cy, sx, sy] of [
          [0, 0, -1, -1],
          [CARD.w, 0, 1, -1],
          [0, CARD.h, -1, 1],
          [CARD.w, CARD.h, 1, 1],
        ]) {
          const x = cx + sx * d,
            y = cy + sy * d;
          glow(ctx, x, y, 14, `rgba(77,243,255,${0.4 * p})`);
          ctx.beginPath();
          ctx.moveTo(x - sx * 16, y);
          ctx.lineTo(x, y);
          ctx.lineTo(x, y - sy * 16);
          ctx.stroke();
        }
        ctx.restore();
      }
      // hazard bar under the card with a charging cell and a gear that turns
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.5) / 1)),
          y = CARD.h + 26;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(
          CARD.w * 0.5 - (CARD.w * 0.5 + 16) * k,
          y,
          (CARD.w + 32) * k,
          15,
          4,
        );
        ctx.fillStyle = "#ffcf1f";
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = "#14121f";
        for (let x = -40 + ((tt * 14) % 26); x < CARD.w + 60; x += 26) {
          ctx.beginPath();
          ctx.moveTo(x, y + 15);
          ctx.lineTo(x + 13, y);
          ctx.lineTo(x + 26, y);
          ctx.lineTo(x + 13, y + 15);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        ctx.strokeStyle = MC.ink;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }
      {
        const k = still ? 1 : pop(t, 1, 0.5);
        if (k > 0) {
          ctx.save();
          ctx.translate(34, CARD.h + 34);
          ctx.scale(k, k);
          ctx.rotate(tt * 0.8);
          gearPath(ctx, 21, 9, 0.24);
          inked(
            ctx,
            grad(ctx, -21, -21, 21, 21, "#c3cde6", "#5c6c98"),
            1.6,
            MC.ink,
          );
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, TAU);
          inked(ctx, "#2a3350", 1.4, MC.ink);
          ctx.restore();
          ctx.save();
          ctx.translate(58, CARD.h + 46);
          ctx.scale(k, k);
          ctx.rotate(-tt * 1.4);
          gearPath(ctx, 12, 7, 0.28);
          inked(ctx, MC.orange, 1.4, MC.ink);
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, TAU);
          inked(ctx, "#2a3350", 1.2, MC.ink);
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.2, 0.5);
        if (k > 0) {
          const lvl = still ? 4 : Math.floor((tt * 1.6) % 6);
          ctx.save();
          ctx.translate(CARD.w - 36, CARD.h + 58);
          ctx.scale(k, k);
          ctx.beginPath();
          ctx.roundRect(-9, -44, 18, 5, 2);
          inked(ctx, MC.grey, 1.3, MC.ink);
          ctx.beginPath();
          ctx.roundRect(-16, -40, 32, 40, 4);
          inked(
            ctx,
            grad(ctx, -16, 0, 16, 0, "#2a3350", "#141a30"),
            1.6,
            MC.ink,
          );
          for (let i = 0; i < 4; i++) {
            const on = i < lvl;
            if (on) glow(ctx, 0, -8 - i * 8.6, 13, "rgba(120,255,160,.5)");
            ctx.beginPath();
            ctx.roundRect(-11, -11.5 - i * 8.6, 22, 6.4, 1.6);
            ctx.fillStyle = on ? "#7dffa0" : "#27304a";
            ctx.fill();
          }
          ctx.restore();
        }
      }
      // drones circle the card
      for (const [ph, off] of [
        [0, 34],
        [0.5, 46],
      ]) {
        const s =
            L * (ph + tt * 0.045) +
            (still ? 0 : (1 - easeOutCubic(clamp(t / 2))) * L * 0.8),
          p = this.loop.at(s);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(
          p.x + p.nx * off,
          p.y + p.ny * off + Math.sin(tt * 3 + ph * 9) * 3,
        );
        mcDrone(ctx, 9, tt, ph * 9);
        ctx.restore();
      }
      // the robot comes down on its boosters, lands, and stands guard
      for (const p of this.dust.list) {
        const q = p.age / p.life;
        glow(
          ctx,
          p.x,
          p.y,
          p.size * (1 + q),
          `rgba(210,220,240,${0.4 * (1 - q)})`,
        );
      }
      {
        const k = still ? 1 : clamp((t - 0.5) / 1.25),
          e = still ? 1 : easeInOut(k),
          y = 2 - (1 - e) * 210,
          thrust = still
            ? 0
            : k < 1
              ? 0.6 + 0.4 * (1 - k)
              : Math.max(0, 1 - (t - 1.75) / 0.35),
          land =
            !still && t > 1.75 && t < 2.2
              ? Math.sin(((t - 1.75) / 0.45) * Math.PI) * 5
              : 0,
          c = tt % 7,
          wave =
            !still && c > 5.4 && c < 6.6
              ? Math.sin(((c - 5.4) / 1.2) * Math.PI) * 1.4
              : 0;
        ctx.save();
        ctx.translate(CARD.w * 0.3, y + land);
        ctx.scale(0.9, 0.9 * (1 - land * 0.008));
        mcRobot(ctx, tt, thrust, still ? 0.3 : Math.sin(tt * 1.4), {
          look: Math.sin(tt * 0.7),
          arm: wave,
        });
        ctx.restore();
      }
      // a status panel on the top right
      {
        const k = still ? 1 : pop(t, 1.9, 0.5);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w * 0.76, -12);
          ctx.scale(k, k);
          ctx.beginPath();
          ctx.roundRect(-38, -50, 76, 44, 5);
          inked(ctx, "rgba(12,22,48,.9)", 1.6, MC.cyan);
          ctx.strokeStyle = MC.cyan;
          ctx.lineWidth = 1.6;
          ctx.lineJoin = "round";
          ctx.beginPath();
          for (let i = 0; i <= 22; i++)
            ctx.lineTo(
              -32 + i * 2.9,
              -27 + Math.sin(i * 0.9 + tt * 5) * 7 * Math.sin(i * 0.31 + tt),
            );
          ctx.stroke();
          ctx.fillStyle = MC.orange;
          ctx.fillRect(-32, -45, 20, 3.4);
          ctx.fillStyle = "#7dffa0";
          for (let i = 0; i < 5; i++)
            ctx.fillRect(
              -32 + i * 7,
              -14,
              5,
              3 + (Math.sin(tt * 3 + i * 1.7) + 1) * 2,
            );
          const bl = Math.sin(tt * 4) > 0;
          ctx.beginPath();
          ctx.arc(29, -43, 3, 0, TAU);
          ctx.fillStyle = bl ? "#ff5a6a" : "#5a1a2a";
          ctx.fill();
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.6),
        R = AVATAR.r,
        k = still ? 1 : easeOutCubic(clamp((t - 0.3) / 1));
      // a targeting ring: arcs that turn against each other, ticks, and four markers that lock on
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        77,
        77,
        R + 3,
        [
          [MC.ink, 7],
          ["#2a3350", 4.6],
        ],
        tt,
      );
      ctx.lineCap = "butt";
      ctx.save();
      ctx.translate(77, 77);
      ctx.rotate(tt * 0.5);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, R + 9, i * (TAU / 3), i * (TAU / 3) + 1.5);
        ctx.strokeStyle = MC.cyan;
        ctx.lineWidth = 2.6;
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.translate(77, 77);
      ctx.rotate(-tt * 0.8);
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, R + 14, i * (TAU / 4), i * (TAU / 4) + 0.6);
        ctx.strokeStyle = MC.orange;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
      for (let i = 0; i < 4; i++) {
        const an = i * (TAU / 4) + Math.PI / 4,
          d = R + 20 + (1 - k) * 40,
          x = 77 + Math.cos(an) * d,
          y = 77 + Math.sin(an) * d;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(an + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(-5, -4);
        ctx.lineTo(5, -4);
        ctx.closePath();
        glow(ctx, 0, 0, 10, `rgba(77,243,255,${0.5 + 0.3 * Math.sin(tt * 6)})`);
        inked(ctx, MC.cyan, 1.2, MC.ink);
        ctx.restore();
      }
      ctx.strokeStyle = "rgba(77,243,255,.8)";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const an = i * (TAU / 4);
        ctx.beginPath();
        ctx.moveTo(77 + Math.cos(an) * (R - 3), 77 + Math.sin(an) * (R - 3));
        ctx.lineTo(77 + Math.cos(an) * (R + 6), 77 + Math.sin(an) * (R + 6));
        ctx.stroke();
      }
      ctx.restore();
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      // a faint grid, a scan line that comes down, sparks of energy going up
      ctx.save();
      ctx.globalAlpha = 0.1 * a;
      ctx.strokeStyle = MC.cyan;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= CARD.w; x += 26) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CARD.h);
      }
      for (let y = 0; y <= CARD.h; y += 26) {
        ctx.moveTo(0, y);
        ctx.lineTo(CARD.w, y);
      }
      ctx.stroke();
      ctx.restore();
      {
        const y = still ? CARD.h * 0.4 : ((tt * 90) % (CARD.h + 160)) - 80;
        ctx.fillStyle = grad(
          ctx,
          0,
          y - 46,
          0,
          y,
          "rgba(77,243,255,0)",
          `rgba(77,243,255,${0.22 * a})`,
        );
        ctx.fillRect(0, y - 46, CARD.w, 46);
        ctx.fillStyle = `rgba(190,250,255,${0.6 * a})`;
        ctx.fillRect(0, y, CARD.w, 1.4);
      }
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y) => {
        ctx.globalAlpha = a * (0.3 + 0.6 * p.k);
        ctx.fillStyle = p.i % 4 ? MC.cyan : MC.orange;
        ctx.fillRect(x, y, p.s * 0.6, p.s * 2.4);
      });
      ctx.globalAlpha = 1;
      glow(ctx, CARD.w * 0.3, 0, 150, `rgba(77,243,255,${0.16 * a})`);
    },
  };
}
