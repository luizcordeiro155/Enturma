// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  lerp,
  smooth,
  easeOutCubic,
  rng,
  glow,
  inked,
  tuft,
  pop,
  fade,
  grad,
  rgrad,
  leafPath,
  sparkPath,
  cloudPath,
  blinking,
  ringBase,
  Drift,
  settle,
  twinkles,
  frameLoop,
  spine,
  bodyPath,
  cardTheme,
} from "../kit";

// ---------- Dragão da Lua ----------
const LU = {
  ink: "#4a3a6a",
  soft: "rgba(74,58,106,.6)",
  pearl: "#f8f5ff",
  shade: "#d6ccf2",
  lilac: "#b9a6ea",
  mane: "#f2b6dc",
  rose: "#ff9ccb",
  gold: "#f6e2a6",
  moon: "#fff8de",
  eye: "#6b7cf0",
};
// A feather from (0,0) to (len,0), with its rib.
function luFeather(ctx, len, wide, fill) {
  leafPath(ctx, len, wide);
  inked(ctx, fill, 1.2, LU.ink);
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(len * 0.86, 0);
  ctx.strokeStyle = "rgba(74,58,106,.35)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
}
// A wing of feathers swept back from the shoulder at (0,0). `open` lifts it, `flap` rocks it.
function luWing(ctx, open, flap, far) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const lift = lerp(-2.86, -2.3, open) + flap * 0.05,
    rows = [
      [7, 58, 11, 0.2],
      [6, 42, 10, 0.12],
      [5, 27, 8.5, 0.05],
    ];
  rows.forEach(([n, len, wide, drop], r) => {
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1),
        an =
          lift -
          (u - 0.5) * lerp(0.5, 1.5, open) +
          drop +
          flap * (u - 0.5) * 0.12,
        l = len * (0.72 + 0.28 * Math.sin(u * Math.PI)) * (0.7 + 0.3 * open);
      ctx.save();
      ctx.rotate(an);
      ctx.translate(4 - r * 2, 0);
      luFeather(
        ctx,
        l,
        wide,
        far
          ? grad(ctx, 0, 0, l, 0, "#efe9ff", "#cfc3f0")
          : grad(
              ctx,
              0,
              0,
              l,
              0,
              "#ffffff",
              "#fbf9ff",
              r ? "#efe8ff" : "#d9cdf7",
            ),
      );
      ctx.restore();
    }
  });
  ctx.beginPath();
  ctx.ellipse(-3, -2, 9, 6.5, -0.6, 0, TAU);
  inked(ctx, far ? "#e4dcfa" : LU.pearl, 1.3, LU.ink);
}
// A small antler from (0,0), growing up and back.
function luAntler(ctx, far) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const draw = () => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-3, -9, -9, -16);
    ctx.moveTo(-3.4, -7.4);
    ctx.quadraticCurveTo(1, -12, 2, -17);
    ctx.moveTo(-6.4, -12);
    ctx.quadraticCurveTo(-12, -11, -15, -13.5);
  };
  draw();
  ctx.strokeStyle = LU.ink;
  ctx.lineWidth = 5.2;
  ctx.stroke();
  draw();
  ctx.strokeStyle = far ? "#d9c68c" : LU.gold;
  ctx.lineWidth = 2.8;
  ctx.stroke();
}
// The head, neck joint at (0,0), looking along +x. `gaze` moves the eye, `blink` shuts it softly.
function luHead(ctx, tt, blink, gaze = 0) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.save();
  ctx.translate(-1, -15);
  ctx.rotate(-0.15);
  luAntler(ctx, true);
  ctx.restore();
  // the mane falls back from the crown
  for (const [x, y, an, len, wide] of [
    [-9, -11, 2.75, 30, 12],
    [-12, -3, 3.02, 36, 13],
    [-10, 6, 3.32, 28, 11],
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(an + Math.sin(tt * 1.4 + y) * 0.07);
    tuft(ctx, len, wide, Math.sin(tt * 1.7 + x) * 3);
    inked(ctx, grad(ctx, 0, 0, len, 0, LU.mane, "#fff3fb"), 1.4, LU.ink);
    ctx.restore();
  }
  // a round skull and a short soft snout
  ctx.beginPath();
  ctx.moveTo(-11, 8);
  ctx.bezierCurveTo(-18, -6, -9, -20, 6, -19);
  ctx.bezierCurveTo(16, -19, 22, -13, 27, -9.5);
  ctx.bezierCurveTo(35, -9, 41, -4, 40, 2);
  ctx.bezierCurveTo(39, 8.5, 31, 10.5, 22, 10.5);
  ctx.bezierCurveTo(10, 13.5, -4, 13.5, -11, 8);
  ctx.closePath();
  inked(
    ctx,
    grad(ctx, 0, -19, 0, 13, "#ffffff", LU.pearl, LU.shade),
    1.7,
    LU.ink,
  );
  glow(ctx, 13, 4.5, 7.5, "rgba(255,156,203,.5)");
  // the smile, the nostril, a crescent on the brow
  ctx.beginPath();
  ctx.moveTo(38.6, 4.2);
  ctx.quadraticCurveTo(31, 7.6, 23.5, 4.6);
  ctx.strokeStyle = LU.ink;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(35.4, -3.2, 1.3, 0.8, 0.5, 0, TAU);
  ctx.fillStyle = LU.ink;
  ctx.fill();
  ctx.save();
  ctx.translate(4.5, -12.6);
  ctx.rotate(-0.5);
  ctx.beginPath();
  ctx.arc(0, 0, 3.3, 0.5, TAU - 0.5);
  ctx.arc(1.5, 0, 2.5, TAU - 0.9, 0.9, true);
  ctx.closePath();
  ctx.fillStyle = LU.gold;
  ctx.fill();
  ctx.strokeStyle = "rgba(74,58,106,.7)";
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.restore();
  // a big gentle eye with lashes
  if (blink) {
    ctx.beginPath();
    ctx.moveTo(10, -4.4);
    ctx.quadraticCurveTo(15.6, -0.8, 21.4, -4.6);
    ctx.strokeStyle = LU.ink;
    ctx.lineWidth = 1.7;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(15.6, -5, 5.6, 6.2, 0.1, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(16.4 + gaze, -4.8, 4.3, 5.2, 0, 0, TAU);
    ctx.fillStyle = grad(ctx, 0, -10, 0, 1, "#3c3fa6", LU.eye, "#9fe0ff");
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16.8 + gaze, -4.8, 2, 3, 0, 0, TAU);
    ctx.fillStyle = "#1c1640";
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(15.6, -5, 5.6, 6.2, 0.1, 0, TAU);
    ctx.strokeStyle = LU.ink;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(14.4 + gaze, -7.2, 1.7, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(18.2 + gaze, -2.6, 0.9, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(9.4, -6.6);
  ctx.quadraticCurveTo(14.6, -12.6, 21.6, -8.4);
  ctx.strokeStyle = LU.ink;
  ctx.lineWidth = 1.9;
  ctx.stroke();
  ctx.lineWidth = 1.1;
  for (const [x, y, dx, dy] of [
    [10, -7.4, -3, -2.6],
    [12.4, -9.6, -1.8, -3.4],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
  }
  // the ear like a feather, the near antler, two long whiskers
  ctx.save();
  ctx.translate(-4, -15);
  ctx.rotate(-2.2 + Math.sin(tt * 1.1) * 0.06);
  luFeather(ctx, 19, 6.5, grad(ctx, 0, 0, 19, 0, "#ffffff", LU.mane));
  ctx.restore();
  ctx.save();
  ctx.translate(5, -18);
  ctx.rotate(0.1);
  luAntler(ctx, false);
  ctx.restore();
  for (const [y, len, ph] of [
    [1.5, 44, 0],
    [5, 34, 1.4],
  ]) {
    const s = Math.sin(tt * 1.2 + ph) * 7;
    ctx.beginPath();
    ctx.moveTo(36, y);
    ctx.bezierCurveTo(
      46,
      y + 4,
      44 + len * 0.3,
      y - 10 + s,
      34 + len,
      y + 6 + s * 1.4,
    );
    ctx.strokeStyle = LU.ink;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
}
// A paw that hangs over the edge it rests on: (0,0) on the edge.
function luPaw(ctx, far) {
  ctx.beginPath();
  ctx.moveTo(-8, -9);
  ctx.quadraticCurveTo(-9.5, 9, -3, 11);
  ctx.quadraticCurveTo(2, 12.5, 6.5, 10.5);
  ctx.quadraticCurveTo(10, 8, 8, -9);
  ctx.closePath();
  inked(
    ctx,
    far ? "#cfc4ee" : grad(ctx, 0, -9, 0, 12, "#ffffff", LU.shade),
    1.4,
    LU.ink,
  );
  ctx.strokeStyle = LU.soft;
  ctx.lineWidth = 1;
  for (const x of [-2.6, 2.2]) {
    ctx.beginPath();
    ctx.moveTo(x, 6);
    ctx.lineTo(x, 10.6);
    ctx.stroke();
  }
}
// A soft cloud around (0,0).
function luCloud(ctx, s, tone = 0) {
  cloudPath(ctx, s);
  inked(
    ctx,
    grad(
      ctx,
      0,
      -s,
      0,
      s * 0.4,
      tone ? "#f3ecff" : "#ffffff",
      tone ? "#b6a8e2" : "#cabdf0",
    ),
    1.4,
    LU.soft,
  );
  ctx.beginPath();
  ctx.moveTo(-s * 0.72, -s * 0.14);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.52, 0.05 * s, -s * 0.36);
  ctx.strokeStyle = "rgba(255,255,255,.8)";
  ctx.lineWidth = 1.3;
  ctx.stroke();
}
// The full moon around (0,0).
function luMoon(ctx, r, a) {
  glow(ctx, 0, 0, r * 2.3, `rgba(255,244,200,${0.3 * a})`);
  glow(ctx, 0, 0, r * 1.5, `rgba(255,248,222,${0.4 * a})`);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fillStyle = rgrad(
    ctx,
    -r * 0.3,
    -r * 0.3,
    r * 1.4,
    "#fffdf2",
    LU.moon,
    "#f1dca4",
  );
  ctx.fill();
  ctx.strokeStyle = "rgba(74,58,106,.45)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = "rgba(214,188,120,.34)";
  for (const [x, y, rr] of [
    [0.34, -0.3, 0.2],
    [-0.4, 0.2, 0.26],
    [0.26, 0.42, 0.13],
    [-0.14, -0.52, 0.1],
    [0.62, 0.12, 0.09],
  ]) {
    ctx.beginPath();
    ctx.ellipse(x * r, y * r, rr * r, rr * r * 0.86, 0.3, 0, TAU);
    ctx.fill();
  }
}
// A four-point star.
const luStar = (ctx, x, y, r, a, c = "255,250,226") => {
  if (a <= 0.02) return;
  glow(ctx, x, y, r * 2.6, `rgba(${c},${0.5 * a})`);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= a;
  sparkPath(ctx, r, 0.2);
  ctx.fillStyle = "#fffdf0";
  ctx.fill();
  ctx.restore();
};

export default function create(CARD, AVATAR) {
  return {
    name: "Dragão da Lua",
    reach: { top: 122, side: 76, bottom: 66 },
    mat: ["#2b2950", "#191a36"],
    theme: cardTheme("#5d68b4", "#9a82cc"),
    init() {
      this.loop = frameLoop(CARD, 8);
      // drawn mirrored: asleep along the top edge, the tail hanging down the right side
      this.base = [
        [-32, 196],
        [-40, 142],
        [-27, 88],
        [-33, 36],
        [-17, -7],
        [30, -19],
        [84, -20],
        [130, -23],
        [163, -33],
        [183, -46],
        [197, -53],
      ];
      this.half = (u) =>
        u < 0.5
          ? lerp(1.6, 14, smooth(u / 0.5))
          : u < 0.72
            ? lerp(14, 17, smooth((u - 0.5) / 0.22))
            : lerp(17, 10, smooth((u - 0.72) / 0.28));
      this.stars = twinkles(22, 37, CARD.w, CARD.h, 22, 72);
      this.dust = Drift(20, 19, {
        v: [8, 22],
        s: [1.2, 2.6],
        sway: 14,
        spin: 0,
      });
      this.fluff = Drift(5, 83, {
        v: [14, 26],
        s: [9, 13],
        sway: 26,
        spin: 1.2,
      });
      const R = rng(53);
      this.inside = [];
      for (let i = 0; i < 16; i++)
        this.inside.push({
          x: R() * CARD.w,
          y: R() * CARD.h * 0.8,
          s: 1.4 + R() * 2.4,
          f: 0.8 + R() * 1.8,
          ph: R() * TAU,
        });
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.1, 0.9),
        W = CARD.w,
        H = CARD.h;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      // a silver rail, with moonlight running slowly round it
      settle(this, "rail", ctx, t, still, 1.4, 12, (c) => {
        c.save();
        c.globalAlpha = a;
        c.beginPath();
        c.roundRect(-7, -7, W + 14, H + 14, CARD.r + 7);
        c.strokeStyle = LU.ink;
        c.lineWidth = 6.4;
        c.stroke();
        c.strokeStyle = "#e6defc";
        c.lineWidth = 3.4;
        c.stroke();
        c.setLineDash([3, 30]);
        c.lineDashOffset = -tt * 14;
        c.strokeStyle = "rgba(255,255,255,.95)";
        c.lineWidth = 3.4;
        c.stroke();
        c.setLineDash([]);
        c.restore();
      });
      // stars all round
      for (const s of this.stars)
        luStar(
          ctx,
          s.x,
          s.y,
          s.s * 1.7,
          a * (0.15 + 0.85 * Math.abs(Math.sin(tt * s.f * 0.5 + s.ph))),
          s.ph > 3 ? "214,196,255" : "255,250,226",
        );
      // the moon rises over the corner
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.15) / 1.3));
        if (k > 0) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, k * 1.4);
          ctx.translate(48, -64 + (1 - k) * 46);
          luMoon(ctx, 40, 0.8 + 0.2 * Math.sin(tt * 0.8));
          ctx.restore();
        }
      }
      // clouds behind the dragon
      for (const [x, y, s, ph, tone] of [
        [W * 0.84, -72, 30, 0, 1],
        [W * 0.52, -92, 22, 2, 0],
        [-30, H * 0.4, 20, 4, 1],
      ]) {
        const k = still ? 1 : pop(t, 0.2 + ph * 0.08, 0.8);
        if (k <= 0) continue;
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.translate(
          x + Math.sin(tt * 0.3 + ph) * 8,
          y + Math.sin(tt * 0.45 + ph) * 2,
        );
        ctx.scale(k, k);
        luCloud(ctx, s, tone);
        ctx.restore();
      }
      // the dragon floats down and settles
      const land = still ? 1 : easeOutCubic(clamp((t - 0.45) / 1.1)),
        open = still
          ? 0.6
          : 0.55 +
            0.45 * (1 - smooth((t - 1.2) / 1.2)) * clamp(t / 0.6) +
            0.1 * Math.max(0, Math.sin(tt * 0.7 - 1)),
        flap = Math.sin(tt * (t < 2.2 && !still ? 6 : 1.2)),
        breath = Math.sin(tt * 1.25);
      if (land > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, land * 1.6);
        ctx.translate(W, (1 - land) * -64);
        ctx.scale(-1, 1);
        const pts = this.base.map(([x, y], i) => [
            x + (i < 4 ? Math.sin(tt * 0.95 + i * 0.85) * (4 - i) * 2.4 : 0),
            y + (i > 7 ? Math.sin(tt * 0.8 + 0.4) * (i - 7) * 1.2 : 0),
          ]),
          sp = spine(pts, 44),
          half = (u) =>
            this.half(u) * (u > 0.48 && u < 0.8 ? 1 + breath * 0.035 : 1),
          at = (u) => sp[Math.round(u * 44)];
        const sh = at(0.66),
          hip = at(0.5),
          fore = at(0.74);
        // the plume at the end of the tail
        {
          const p = sp[0],
            an = Math.atan2(-p.ty, -p.tx);
          ctx.save();
          ctx.translate(p.x, p.y);
          for (const [d, len, wide] of [
            [-0.5, 26, 10],
            [0.5, 26, 10],
            [0, 36, 12],
          ]) {
            ctx.save();
            ctx.rotate(an + d + Math.sin(tt * 1.3 + d) * 0.08);
            tuft(ctx, len, wide, Math.sin(tt * 1.6 + d * 2) * 3);
            inked(
              ctx,
              grad(ctx, 0, 0, len, 0, LU.mane, "#fff6fc"),
              1.4,
              LU.ink,
            );
            ctx.restore();
          }
          ctx.restore();
        }
        ctx.save();
        ctx.translate(sh.x + 12, sh.y - 12);
        ctx.rotate(0.14);
        luWing(ctx, open * 0.9, flap, true);
        ctx.restore();
        // the mane runs down the back, each lock stirring a little
        for (let k = 5; k < 43; k += 2) {
          const p = sp[k],
            w = half(p.u),
            len = 6 + 17 * Math.sin(p.u * Math.PI),
            bx = p.x - p.nx * (w - 3),
            by = p.y - p.ny * (w - 3);
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(
            Math.atan2(-p.ny - p.ty * 1.1, -p.nx - p.tx * 1.1) +
              Math.sin(tt * 1.3 + k) * 0.09,
          );
          tuft(ctx, len, len * 0.7, Math.sin(tt * 1.5 + k * 0.7) * 2);
          inked(ctx, grad(ctx, 0, 0, len, 0, "#fff3fb", LU.mane), 1.3, LU.ink);
          ctx.restore();
        }
        ctx.save();
        ctx.translate(hip.x + 22, -1);
        luPaw(ctx, true);
        ctx.restore();
        // tail, body and neck are one shape, pearl with a paler belly
        bodyPath(ctx, sp, half);
        inked(
          ctx,
          grad(ctx, 0, -90, 0, 196, "#ffffff", LU.pearl, LU.shade),
          1.8,
          LU.ink,
        );
        bodyPath(ctx, sp, half, (u) => half(u) * 0.34);
        ctx.fillStyle = grad(
          ctx,
          0,
          -90,
          0,
          196,
          "#efe6ff",
          "#dccff6",
          LU.lilac,
        );
        ctx.fill();
        ctx.strokeStyle = "rgba(74,58,106,.28)";
        ctx.lineWidth = 1;
        for (let k = 3; k < 43; k += 2) {
          const p = sp[k],
            w = half(p.u);
          ctx.beginPath();
          ctx.moveTo(p.x + p.nx * w * 0.34, p.y + p.ny * w * 0.34);
          ctx.quadraticCurveTo(
            p.x + p.nx * w * 0.7 + p.tx * 2.6,
            p.y + p.ny * w * 0.7 + p.ty * 2.6,
            p.x + p.nx * w,
            p.y + p.ny * w,
          );
          ctx.stroke();
        }
        // scales that catch the moonlight
        for (let k = 5; k < 41; k += 2) {
          const p = sp[k],
            w = half(p.u),
            o = -w * 0.34,
            on = 0.25 + 0.75 * Math.max(0, Math.sin(tt * 1.6 - k * 0.42));
          ctx.beginPath();
          ctx.arc(
            p.x + p.nx * o,
            p.y + p.ny * o,
            Math.max(1.6, w * 0.26),
            Math.atan2(p.ty, p.tx) - 1.2,
            Math.atan2(p.ty, p.tx) + 1.2,
          );
          ctx.strokeStyle = `rgba(185,166,234,${0.5 + 0.4 * on})`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
        // the haunch and the paws, hanging over the edge
        ctx.beginPath();
        ctx.ellipse(hip.x + 4, hip.y + 3, 16, 12.5, 0.2, 0, TAU);
        inked(
          ctx,
          grad(ctx, 0, hip.y - 10, 0, hip.y + 16, "#ffffff", LU.shade),
          1.5,
          LU.ink,
        );
        ctx.save();
        ctx.translate(hip.x + 10, -1);
        luPaw(ctx, false);
        ctx.restore();
        ctx.save();
        ctx.translate(fore.x + 14, -1);
        luPaw(ctx, true);
        ctx.restore();
        ctx.save();
        ctx.translate(fore.x + 1, -1);
        luPaw(ctx, false);
        ctx.restore();
        ctx.save();
        ctx.translate(sh.x - 6, sh.y - 11);
        ctx.scale(1.12, 1.12);
        luWing(ctx, open, flap, false);
        ctx.restore();
        // the head looks up at the moon, and nods now and then
        {
          const p = sp[44],
            nod = still ? 0 : Math.max(0, Math.sin(tt * 0.5 - 0.6)) * 0.07;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(
            Math.atan2(p.ty, p.tx) + 0.42 + nod + Math.sin(tt * 0.8) * 0.03,
          );
          ctx.scale(1.5, 1.5);
          luHead(
            ctx,
            tt,
            !still && (blinking(tt, 4.6) || blinking(tt, 4.6, 0.26)),
            still ? 0.6 : 0.6 + Math.sin(tt * 0.6) * 0.5,
          );
          ctx.restore();
        }
        ctx.restore();
      }
      // a cloud across the foot of the moon, a bank of mist under the card
      for (const [x, y, s, ph, tone] of [
        [94, -30, 19, 1, 0],
        [W * 0.16, H + 30, 30, 3, 0],
        [W * 0.5, H + 37, 36, 5, 1],
        [W * 0.85, H + 29, 30, 2, 0],
        [W + 32, H * 0.74, 20, 6, 1],
      ]) {
        const k = still ? 1 : pop(t, 0.5 + ph * 0.09, 0.8);
        if (k <= 0) continue;
        ctx.save();
        ctx.globalAlpha = y < 0 ? 0.85 : 0.94;
        ctx.translate(
          x + Math.sin(tt * 0.28 + ph) * 9,
          y + Math.sin(tt * 0.4 + ph) * 2,
        );
        ctx.scale(k, k);
        luCloud(ctx, s, tone);
        ctx.restore();
      }
      // moon dust drifting down beside the card
      if (!still)
        for (let i = 0; i < 6; i++) {
          const c = (tt * 0.12 + i / 6) % 1,
            x = i % 2 ? W + 20 + ((i * 9) % 40) : -24 - ((i * 11) % 36);
          luStar(
            ctx,
            x + Math.sin(tt * 0.9 + i) * 8,
            -40 + c * (H + 60),
            2.6,
            a * Math.sin(c * Math.PI),
          );
        }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r,
        cx = 77,
        cy = 77;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      glow(
        ctx,
        cx,
        cy,
        R + 26,
        `rgba(255,244,200,${a * (0.2 + 0.06 * Math.sin(tt * 1.2))})`,
      );
      // a crescent moon holds the picture
      {
        const k = still ? 1 : easeOutCubic(clamp((t - 0.2) / 0.9));
        if (k > 0) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, k * 1.5);
          ctx.translate(cx, cy);
          ctx.rotate((1 - k) * -0.8);
          ctx.beginPath();
          ctx.arc(-6, 6, R + 13, 0, TAU);
          ctx.arc(0, 0, R + 2, 0, TAU, true);
          ctx.fillStyle = grad(
            ctx,
            -R,
            R,
            R,
            -R,
            "#f1dca4",
            LU.moon,
            "#fffdf2",
          );
          ctx.fill("evenodd");
          ctx.beginPath();
          ctx.arc(-6, 6, R + 13, 0, TAU);
          ctx.strokeStyle = "rgba(74,58,106,.6)";
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.fillStyle = "rgba(214,188,120,.36)";
          for (const [an, d, r] of [
            [2.2, R + 8, 3],
            [2.9, R + 7, 2.2],
            [1.7, R + 8, 1.8],
          ]) {
            ctx.beginPath();
            ctx.arc(-3 + Math.cos(an) * d, 3 + Math.sin(an) * d, r, 0, TAU);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        cx,
        cy,
        R + 3.5,
        [
          [LU.ink, 8.6],
          ["#efe9ff", 5.2],
          ["rgba(255,255,255,.95)", 5.2, [2, 15], 10],
        ],
        tt,
      );
      ctx.restore();
      // a little dragon sleeps on top, its paws over the rim
      {
        const k = still ? 1 : pop(t, 0.8, 0.6);
        if (k > 0) {
          const bob = Math.sin(tt * 1.25) * 0.8,
            wake = !still && (tt + 3) % 9 < 2.2;
          ctx.save();
          ctx.translate(cx + 2, cy - R - 5 + bob);
          ctx.scale(k, k);
          for (const sx of [-1, 1]) {
            ctx.save();
            ctx.scale(sx, 1);
            ctx.translate(9, -9);
            ctx.rotate(-0.5 * sx * sx + 0.2);
            ctx.scale(0.62, 0.62);
            ctx.save();
            ctx.scale(-1, 1);
            luAntler(ctx, false);
            ctx.restore();
            ctx.restore();
            ctx.save();
            ctx.scale(sx, 1);
            ctx.translate(11, -5);
            ctx.rotate(-0.75 + Math.sin(tt * 1.1) * 0.05);
            luFeather(ctx, 14, 5, grad(ctx, 0, 0, 14, 0, "#ffffff", LU.mane));
            ctx.restore();
          }
          for (const [x, an, len] of [
            [-3, -1.95, 11],
            [0, -1.57, 13],
            [3, -1.2, 11],
          ]) {
            ctx.save();
            ctx.translate(x, -9);
            ctx.rotate(an + Math.sin(tt * 1.5 + x) * 0.08);
            tuft(ctx, len, 6);
            inked(
              ctx,
              grad(ctx, 0, 0, len, 0, LU.mane, "#fff3fb"),
              1.2,
              LU.ink,
            );
            ctx.restore();
          }
          ctx.beginPath();
          ctx.ellipse(0, 0, 15, 11.5, 0, 0, TAU);
          inked(
            ctx,
            grad(ctx, 0, -11, 0, 11, "#ffffff", LU.shade),
            1.6,
            LU.ink,
          );
          for (const sx of [-1, 1]) {
            glow(ctx, sx * 9.5, 3.4, 5, "rgba(255,156,203,.55)");
            ctx.beginPath();
            if (wake) {
              ctx.ellipse(sx * 6, -0.6, 2.5, 3.1, 0, 0, TAU);
              ctx.fillStyle = "#2a2360";
              ctx.fill();
              ctx.beginPath();
              ctx.arc(sx * 6 - 0.8, -1.7, 0.95, 0, TAU);
              ctx.fillStyle = "#fff";
              ctx.fill();
            } else {
              ctx.moveTo(sx * 6 - 3, -0.8);
              ctx.quadraticCurveTo(sx * 6, 2.2, sx * 6 + 3, -0.8);
              ctx.strokeStyle = LU.ink;
              ctx.lineWidth = 1.4;
              ctx.stroke();
            }
          }
          ctx.beginPath();
          ctx.moveTo(-2, 4.6);
          ctx.quadraticCurveTo(0, 6.2, 2, 4.6);
          ctx.strokeStyle = LU.ink;
          ctx.lineWidth = 1.1;
          ctx.stroke();
          ctx.fillStyle = LU.ink;
          for (const sx of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(sx * 1.5, 2.2, 0.6, 0, TAU);
            ctx.fill();
          }
          for (const sx of [-1, 1]) {
            ctx.save();
            ctx.translate(sx * 9, 9.5);
            ctx.scale(0.62, 0.62);
            luPaw(ctx, false);
            ctx.restore();
          }
          if (!wake && !still)
            for (let i = 0; i < 2; i++) {
              const c = (tt * 0.45 + i * 0.5) % 1;
              ctx.save();
              ctx.globalAlpha = Math.sin(c * Math.PI) * 0.9;
              ctx.fillStyle = "#fff";
              ctx.font = `700 ${7 + c * 4}px system-ui, sans-serif`;
              ctx.fillText("z", 15 + c * 10, -10 - c * 14);
              ctx.restore();
            }
          ctx.restore();
        }
      }
      // stars circle slowly, and a wisp of cloud rests below
      for (let i = 0; i < 4; i++) {
        const an = tt * 0.45 + (i * TAU) / 4,
          k = still ? 1 : pop(t, 1 + i * 0.1, 0.5);
        luStar(
          ctx,
          cx + Math.cos(an) * (R + 15),
          cy + Math.sin(an) * (R + 15) * 0.96,
          2.6 + (i % 2),
          a * k * (0.5 + 0.5 * Math.abs(Math.sin(tt * 1.7 + i))),
        );
      }
      {
        const k = still ? 1 : pop(t, 0.9, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.globalAlpha = 0.95;
          ctx.translate(cx + R * 0.66 + Math.sin(tt * 0.5) * 2, cy + R + 3);
          ctx.scale(k, k);
          luCloud(ctx, 13, 0);
          ctx.restore();
        }
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1),
        W = CARD.w,
        H = CARD.h;
      // moonlight from the corner, mist drifting low
      glow(ctx, 40, -10, 190, `rgba(255,244,200,${0.2 * a})`);
      for (let i = 0; i < 4; i++)
        glow(
          ctx,
          ((i * 150 + tt * 10) % (W + 280)) - 140,
          H - 20 + Math.sin(tt * 0.4 + i) * 8,
          120,
          `rgba(214,196,255,${0.2 * a})`,
        );
      for (let i = 0; i < 3; i++)
        glow(
          ctx,
          ((((i * 190 - tt * 7) % (W + 300)) + W + 300) % (W + 300)) - 150,
          H * 0.56 + i * 30,
          100,
          `rgba(190,200,255,${0.09 * a})`,
        );
      // stars that come and go
      for (const s of this.inside)
        luStar(
          ctx,
          s.x,
          s.y,
          s.s,
          a * 0.8 * Math.max(0, Math.sin(tt * s.f * 0.6 + s.ph)),
        );
      // dust of the moon falling, a feather now and then
      this.dust.each(tt, W, H, (p, x, y) => {
        glow(
          ctx,
          x,
          y,
          p.s * 2.4,
          `rgba(255,250,226,${0.6 * a * (0.3 + 0.7 * Math.abs(Math.sin(tt * p.f + p.ph)))})`,
        );
      });
      if (!still)
        this.fluff.each(tt, W, H, (p, x, y, rot) => {
          ctx.save();
          ctx.globalAlpha = 0.5 * a;
          ctx.translate(x, y);
          ctx.rotate(rot);
          leafPath(ctx, p.s, p.s * 0.26);
          ctx.fillStyle = "#fff";
          ctx.fill();
          ctx.strokeStyle = "rgba(185,166,234,.9)";
          ctx.lineWidth = 0.7;
          ctx.stroke();
          ctx.restore();
        });
      // a shooting star crosses the top
      if (!still) {
        const c = (tt + 4) % 7.5;
        if (c < 0.9) {
          const u = c / 0.9,
            x = W * (0.95 - u * 0.7),
            y = 18 + u * 96,
            k = Math.sin(u * Math.PI);
          ctx.save();
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 54 * k, y - 22 * k);
          ctx.strokeStyle = grad(
            ctx,
            x,
            y,
            x + 54,
            y - 22,
            `rgba(255,253,240,${0.9 * k * a})`,
            "rgba(255,253,240,0)",
          );
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
          luStar(ctx, x, y, 3.4, k * a);
        }
      }
    },
  };
}
