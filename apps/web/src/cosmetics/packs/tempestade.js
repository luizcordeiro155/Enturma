// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  lerp,
  smooth,
  easeOutCubic,
  easeOutBack,
  glow,
  inked,
  pop,
  fade,
  grad,
  cloudPath,
  blinking,
  ringBase,
  Drift,
  settle,
  twinkles,
  frameLoop,
  spine,
  bodyPath,
  boltPath,
  cardTheme,
} from "../kit";

// ---------- Dragão da Tempestade ----------
const TP = {
  ink: "#070912",
  hide: "#35429a",
  deep: "#232a66",
  belly: "#7f8fd8",
  bolt: "#7fe3ff",
  core: "#eaffff",
  violet: "#7a5cff",
  rim: "rgba(160,185,255,.55)",
};
// Dark shapes on a dark room: a thin pale edge under the ink keeps them readable.
const tpInk = (ctx, fill, lw = 1.8) => {
  ctx.lineJoin = "round";
  ctx.strokeStyle = TP.rim;
  ctx.lineWidth = lw + 2.6;
  ctx.stroke();
  inked(ctx, fill, lw, TP.ink);
};
// A wing like a bat's, swept back over the body, from the shoulder at (0,0). `open` unfolds it, `flap` rocks
// the fingers, `far` is the one behind.
function tpWing(ctx, open, flap, far) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const wrist = [-12 * open - 2, -36 * open - 2],
    reach = 0.3 + 0.7 * open,
    tips = [
      [-2.82, 58],
      [-3.06, 80],
      [-3.36, 92],
      [-3.8, 74],
    ].map(([an, len], i) => {
      const a = lerp(-3.5, an, open) + flap * (1.5 - i) * 0.05;
      return [
        wrist[0] + Math.cos(a) * len * reach,
        wrist[1] + Math.sin(a) * len * reach,
      ];
    }),
    root = [-52 * reach, 12];
  const skin = () => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(wrist[0], wrist[1]);
    ctx.lineTo(tips[0][0], tips[0][1]);
    for (let i = 1; i <= tips.length; i++) {
      const a = tips[i - 1],
        b = i < tips.length ? tips[i] : root,
        mx = lerp((a[0] + b[0]) / 2, wrist[0], 0.3),
        my = lerp((a[1] + b[1]) / 2, wrist[1], 0.3);
      ctx.quadraticCurveTo(mx, my, b[0], b[1]);
    }
    ctx.closePath();
  };
  skin();
  tpInk(
    ctx,
    far
      ? grad(ctx, 0, -70, 0, 20, "#1c2350", "#2a2f66")
      : grad(ctx, -90, -60, 0, 10, "#5a3fb8", "#3a47a6", "#2c3684"),
    1.8,
  );
  // the light of the storm through the skin, then the finger bones over it
  if (!far) {
    ctx.save();
    skin();
    ctx.clip();
    for (let i = 0; i < tips.length; i++) {
      const a = tips[i],
        b = i + 1 < tips.length ? tips[i + 1] : root;
      ctx.beginPath();
      ctx.moveTo(wrist[0], wrist[1]);
      ctx.lineTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      ctx.strokeStyle = "rgba(160,225,255,.3)";
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const tip of tips) {
    ctx.beginPath();
    ctx.moveTo(wrist[0], wrist[1]);
    ctx.lineTo(tip[0], tip[1]);
    ctx.strokeStyle = TP.ink;
    ctx.lineWidth = 4.2;
    ctx.stroke();
    ctx.strokeStyle = far ? "#353d78" : "#8f9cf0";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(wrist[0], wrist[1]);
  ctx.strokeStyle = TP.ink;
  ctx.lineWidth = 7.4;
  ctx.stroke();
  ctx.strokeStyle = far ? "#353d78" : "#6f7de0";
  ctx.lineWidth = 4.6;
  ctx.stroke();
  // the claw on the wrist
  ctx.save();
  ctx.translate(wrist[0], wrist[1]);
  ctx.rotate(0.5);
  ctx.beginPath();
  ctx.moveTo(-2.4, 0);
  ctx.quadraticCurveTo(-3, -9, 4, -12);
  ctx.quadraticCurveTo(2, -5, 2.4, 0);
  ctx.closePath();
  inked(ctx, "#e4e9ff", 1.1, TP.ink);
  ctx.restore();
}
// The head, neck joint at (0,0), looking along +x. `jaw` opens the mouth, `lit` is how hard the eye burns.
function tpHead(ctx, jaw, lit, blink) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // two horns swept back, the far one first
  const horn = (dy, len, far) => {
    ctx.save();
    ctx.translate(-2, dy);
    ctx.beginPath();
    ctx.moveTo(0, 3.6);
    ctx.quadraticCurveTo(-len * 0.55, 2, -len, -len * 0.42);
    ctx.quadraticCurveTo(-len * 0.45, -6, 2, -4);
    ctx.closePath();
    inked(
      ctx,
      far ? "#3a4280" : grad(ctx, 0, 0, -len, -len * 0.4, "#6a76c8", "#e2e8ff"),
      1.5,
      TP.ink,
    );
    if (!far) {
      ctx.strokeStyle = "rgba(7,9,18,.55)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const u = i / 5.4;
        ctx.beginPath();
        ctx.moveTo(-len * u, 3 - u * len * 0.3);
        ctx.lineTo(-len * u - 2, -4 - u * len * 0.24);
        ctx.stroke();
      }
    }
    ctx.restore();
  };
  horn(-11, 30, true);
  // lower jaw, hinged at the back
  ctx.save();
  ctx.translate(2, 5);
  ctx.rotate(jaw * 0.5);
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.lineTo(30, 1.5);
  ctx.quadraticCurveTo(35, 4, 29, 6.5);
  ctx.lineTo(4, 9);
  ctx.quadraticCurveTo(-7, 7, -6, -2);
  ctx.closePath();
  tpInk(ctx, grad(ctx, 0, 0, 0, 9, TP.belly, "#3a4490"), 1.5);
  ctx.fillStyle = "#eef2ff";
  for (const x of [9, 15, 21, 26]) {
    ctx.beginPath();
    ctx.moveTo(x - 1.5, 1.2);
    ctx.lineTo(x, -3.4);
    ctx.lineTo(x + 1.5, 1.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = TP.ink;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();
  if (jaw > 0.12) {
    ctx.beginPath();
    ctx.moveTo(2, 4);
    ctx.lineTo(30, 5);
    ctx.lineTo(27, 5 + jaw * 13);
    ctx.lineTo(4, 6 + jaw * 8);
    ctx.closePath();
    ctx.fillStyle = "#0b1030";
    ctx.fill();
    glow(ctx, 18, 7 + jaw * 5, 16 * jaw, `rgba(127,227,255,${0.7 * jaw})`);
  }
  // the skull: a long wedge with a heavy brow
  ctx.beginPath();
  ctx.moveTo(-10, 6);
  ctx.bezierCurveTo(-14, -6, -6, -15, 8, -14);
  ctx.lineTo(16, -17);
  ctx.lineTo(21, -11.5);
  ctx.bezierCurveTo(30, -10, 40, -6, 43, -1);
  ctx.quadraticCurveTo(44, 4, 38, 5.5);
  ctx.lineTo(0, 7);
  ctx.closePath();
  tpInk(ctx, grad(ctx, 0, -16, 0, 7, "#5565c8", TP.hide), 1.8);
  ctx.fillStyle = "#eef2ff";
  for (const x of [12, 19, 26, 32, 37]) {
    const l = 5.2 - Math.abs(x - 22) * 0.12;
    ctx.beginPath();
    ctx.moveTo(x - 1.6, 5.6);
    ctx.lineTo(x, 5.6 + l);
    ctx.lineTo(x + 1.6, 5.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = TP.ink;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  // plates over the snout, a frill of spikes at the cheek
  ctx.strokeStyle = "rgba(190,205,255,.55)";
  ctx.lineWidth = 1;
  for (const x of [25, 30, 35]) {
    ctx.beginPath();
    ctx.moveTo(x, -8.4 + (x - 25) * 0.36);
    ctx.quadraticCurveTo(x + 2.4, -5, x + 1, -1.5);
    ctx.stroke();
  }
  for (const [x, y, an, l] of [
    [-8, 3, 2.5, 13],
    [-9, -3, 2.9, 15],
    [-6, 8, 2.1, 10],
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(an);
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(l, 0);
    ctx.lineTo(0, 3);
    ctx.closePath();
    inked(ctx, "#4a58b0", 1.2, TP.ink);
    ctx.restore();
  }
  horn(-12, 34, false);
  // the eye: a slit that burns with the storm
  ctx.beginPath();
  ctx.moveTo(5, -9.5);
  ctx.quadraticCurveTo(13, -14.5, 21, -9);
  ctx.strokeStyle = TP.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  glow(ctx, 14, -6.6, 13, `rgba(127,227,255,${0.35 + 0.45 * lit})`);
  if (blink) {
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(20, -7);
    ctx.strokeStyle = TP.ink;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(8, -5.6);
    ctx.quadraticCurveTo(14, -10.6, 20.5, -7.4);
    ctx.quadraticCurveTo(14, -3.6, 8, -5.6);
    ctx.closePath();
    ctx.fillStyle = grad(ctx, 8, -7, 20, -7, "#d8fbff", TP.bolt);
    ctx.fill();
    ctx.strokeStyle = TP.ink;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(14.6, -6.8, 0.9, 2.4, 0.1, 0, TAU);
    ctx.fillStyle = "#04121a";
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(38.5, -3, 1.5, 0.9, 0.4, 0, TAU);
  ctx.fillStyle = TP.ink;
  ctx.fill();
}
// A leg that grips the edge it stands on: the hip at (0,0), the toes on the line y = `down`.
function tpLeg(ctx, down, far) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(0, 2, 12, 15, -0.3, 0, TAU);
  tpInk(
    ctx,
    far ? "#232a66" : grad(ctx, 0, -12, 0, 16, "#5565c8", TP.hide),
    1.6,
  );
  ctx.beginPath();
  ctx.moveTo(-2, 10);
  ctx.quadraticCurveTo(10, 12, 9, down - 3);
  ctx.lineTo(1, down - 3);
  ctx.quadraticCurveTo(0, 16, -8, 12);
  ctx.closePath();
  tpInk(ctx, far ? "#232a66" : TP.hide, 1.5);
  for (const x of [-3, 4, 11]) {
    ctx.beginPath();
    ctx.moveTo(x - 2.6, down - 4);
    ctx.quadraticCurveTo(x + 1, down - 6, x + 3, down - 3);
    ctx.quadraticCurveTo(x + 4.5, down + 4, x + 1, down + 8);
    ctx.quadraticCurveTo(x, down + 1, x - 2.6, down - 4);
    ctx.closePath();
    inked(ctx, "#d6dcf5", 1.1, TP.ink);
  }
}
// A storm cloud around (0,0), lit from inside by `flash`.
function tpCloud(ctx, s, flash, tone = 0) {
  cloudPath(ctx, s);
  inked(
    ctx,
    grad(
      ctx,
      0,
      -s * 0.7,
      0,
      s * 0.5,
      tone ? "#3a4270" : "#2c3358",
      tone ? "#1b2040" : "#141833",
    ),
    1.6,
    TP.ink,
  );
  if (flash > 0.02) {
    ctx.save();
    cloudPath(ctx, s);
    ctx.clip();
    glow(ctx, 0, s * 0.2, s * 1.5, `rgba(160,230,255,${0.75 * flash})`);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(-s * 0.7, -s * 0.18);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.5, 0, -s * 0.34);
  ctx.strokeStyle = "rgba(160,180,255,.35)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
}
function tpStrike(ctx, x0, y0, x1, y1, seed, a) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  boltPath(ctx, x0, y0, x1, y1, seed, 0.2, 8);
  ctx.strokeStyle = `rgba(127,227,255,${0.35 * a})`;
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.strokeStyle = `rgba(127,227,255,${0.9 * a})`;
  ctx.lineWidth = 3.4;
  ctx.stroke();
  ctx.strokeStyle = `rgba(240,255,255,${a})`;
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.restore();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Dragão da Tempestade",
    reach: { top: 122, side: 76, bottom: 66 },
    mat: ["#0f1326", "#070912"],
    theme: cardTheme("#27408f", "#3a1f7a"),
    init() {
      this.loop = frameLoop(CARD, 8);
      // perched on the top edge, the tail hanging down the left side
      this.base = [
        [-34, 190],
        [-40, 138],
        [-28, 86],
        [-34, 34],
        [-14, -14],
        [36, -28],
        [92, -32],
        [138, -40],
        [170, -50],
        [190, -66],
        [206, -74],
      ];
      this.half = (u) =>
        u < 0.52
          ? lerp(1.4, 13.5, smooth(u / 0.52))
          : u < 0.72
            ? lerp(13.5, 16.5, smooth((u - 0.52) / 0.2))
            : lerp(16.5, 7.6, smooth((u - 0.72) / 0.28));
      this.stars = twinkles(16, 71, CARD.w, CARD.h, 26, 70);
      this.rain = Drift(46, 23, {
        v: [430, 650],
        s: [9, 17],
        sway: 0,
        spin: 0,
      });
      this.motes = Drift(14, 61, {
        v: [-26, -9],
        s: [1, 2.4],
        sway: 12,
        spin: 0,
      });
    },
    reset() {},
    update() {},
    // When the sky lights up: once as the dragon lands, then every few seconds for a moment.
    flash(t, still) {
      if (still) return 0.18;
      const land = Math.exp(-Math.pow((t - 1.25) / 0.16, 2)),
        c = (t + 1.3) % 5.4;
      return Math.max(
        land,
        t > 3 && c < 0.42 ? Math.abs(Math.sin(c * 30)) * (1 - c / 0.42) : 0,
      );
    },
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.1, 0.9),
        fl = this.flash(t, still),
        W = CARD.w,
        H = CARD.h,
        strike = Math.floor((tt + 1.3) / 5.4);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      // the rail round the card, with a charge running along it
      settle(this, "rail", ctx, t, still, 1.4, 12, (c) => {
        c.save();
        c.globalAlpha = a;
        c.beginPath();
        c.roundRect(-7, -7, W + 14, H + 14, CARD.r + 7);
        c.strokeStyle = TP.ink;
        c.lineWidth = 6.5;
        c.stroke();
        c.strokeStyle = "#2b3466";
        c.lineWidth = 3.6;
        c.stroke();
        c.setLineDash([10, 54]);
        c.lineDashOffset = -tt * 90;
        c.strokeStyle = "rgba(127,227,255,.9)";
        c.lineWidth = 1.5;
        c.stroke();
        c.setLineDash([]);
        c.restore();
      });
      // storm clouds behind everything, drifting, lit when it thunders
      for (const [x, y, s, ph, tone] of [
        [W * 0.2, -74, 34, 0, 0],
        [W * 0.86, -64, 38, 2, 1],
        [W + 34, 40, 24, 4, 0],
        [-40, H * 0.56, 22, 1, 1],
        [W * 0.5, -90, 24, 3, 0],
      ]) {
        const k = still ? 1 : pop(t, 0.1 + ph * 0.07, 0.7);
        if (k <= 0) continue;
        ctx.save();
        ctx.translate(
          x + Math.sin(tt * 0.35 + ph) * 7,
          y + Math.sin(tt * 0.5 + ph) * 2,
        );
        ctx.scale(k, k);
        tpCloud(ctx, s, fl, tone);
        ctx.restore();
      }
      // the bolt that comes down the right side
      if (fl > 0.05) {
        tpStrike(ctx, W * 0.86, -44, W + 26, H * 0.36, 11 + strike, fl);
        tpStrike(
          ctx,
          W + 26,
          H * 0.36,
          W + 14,
          H * 0.66,
          31 + strike,
          fl * 0.8,
        );
        tpStrike(ctx, W + 26, H * 0.36, W + 52, H * 0.5, 51 + strike, fl * 0.6);
      }
      // sparks that crawl along the rail
      if (!still)
        for (let i = 0; i < 3; i++) {
          const s = (tt * 150 + (i * this.loop.L) / 3) % this.loop.L,
            p = this.loop.at(s),
            q = this.loop.at(s + 26),
            on = 0.5 + 0.5 * Math.sin(tt * 23 + i * 2);
          tpStrike(
            ctx,
            p.x,
            p.y,
            q.x + q.nx * 6,
            q.y + q.ny * 6,
            Math.floor(tt * 14) + i * 7,
            a * 0.55 * on,
          );
        }
      // the dragon drops out of the cloud and lands
      const land = still ? 1 : easeOutCubic(clamp((t - 0.35) / 0.9)),
        open = still
          ? 0.9
          : 0.25 +
            0.75 * easeOutBack(clamp((t - 0.5) / 0.9)) -
            0.1 * smooth((t - 2) / 1.2),
        flap = Math.sin(tt * 1.3) * (still ? 0 : 1),
        breath = Math.sin(tt * 1.5);
      if (land > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, land * 1.6);
        ctx.translate(0, (1 - land) * -70);
        const pts = this.base.map(([x, y], i) => [
            x + (i < 4 ? Math.sin(tt * 1.3 + i * 0.9) * (4 - i) * 2.6 : 0),
            y + (i > 7 ? Math.sin(tt * 1.1 + 0.6) * (i - 7) * 1.3 : 0),
          ]),
          sp = spine(pts, 44),
          half = (u) =>
            this.half(u) * (u > 0.5 && u < 0.8 ? 1 + breath * 0.03 : 1),
          at = (u) => sp[Math.round(u * 44)];
        const sh = at(0.66),
          hip = at(0.5),
          fore = at(0.7);
        ctx.save();
        ctx.translate(sh.x + 16, sh.y - 10);
        ctx.rotate(0.16);
        tpWing(ctx, open * 0.94, flap, true);
        ctx.restore();
        ctx.save();
        ctx.translate(hip.x + 16, hip.y + 6);
        tpLeg(ctx, -hip.y - 8, true);
        ctx.restore();
        // tail, body and neck are one shape; the belly is a paler band with plates across it
        bodyPath(ctx, sp, half);
        tpInk(ctx, grad(ctx, 0, -100, 0, 190, "#5565c8", TP.hide, TP.deep), 2);
        bodyPath(ctx, sp, half, (u) => half(u) * 0.28);
        ctx.fillStyle = grad(
          ctx,
          0,
          -100,
          0,
          190,
          "#a9b6f5",
          TP.belly,
          "#4a5596",
        );
        ctx.fill();
        ctx.strokeStyle = "rgba(7,9,18,.5)";
        ctx.lineWidth = 1;
        for (let k = 2; k < 43; k += 2) {
          const p = sp[k],
            w = half(p.u);
          ctx.beginPath();
          ctx.moveTo(p.x + p.nx * w * 0.28, p.y + p.ny * w * 0.28);
          ctx.quadraticCurveTo(
            p.x + p.nx * w * 0.7 + p.tx * 3,
            p.y + p.ny * w * 0.7 + p.ty * 3,
            p.x + p.nx * w,
            p.y + p.ny * w,
          );
          ctx.stroke();
        }
        // a row of spines down the back, each tipped with light
        for (let k = 4; k < 41; k += 2) {
          const p = sp[k],
            w = half(p.u),
            h = 5 + 8 * Math.sin(p.u * Math.PI) + (k % 4 ? 0 : 2.5),
            bx = p.x - p.nx * (w - 1),
            by = p.y - p.ny * (w - 1),
            tx = bx - p.nx * h - p.tx * h * 0.7,
            ty = by - p.ny * h - p.ty * h * 0.7;
          ctx.beginPath();
          ctx.moveTo(bx - p.tx * 3.4, by - p.ty * 3.4);
          ctx.lineTo(tx, ty);
          ctx.lineTo(bx + p.tx * 3.4, by + p.ty * 3.4);
          ctx.closePath();
          inked(ctx, "#2a3280", 1.2, TP.ink);
          glow(ctx, tx, ty, 4 + fl * 6, `rgba(127,227,255,${0.35 + 0.6 * fl})`);
        }
        // the blade at the end of the tail
        {
          const p = sp[0];
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.atan2(-p.ty, -p.tx));
          ctx.beginPath();
          ctx.moveTo(-2, 0);
          ctx.lineTo(8, -11);
          ctx.lineTo(30, 0);
          ctx.lineTo(8, 11);
          ctx.closePath();
          tpInk(ctx, grad(ctx, 0, 0, 30, 0, "#3a47a6", "#c4d0ff"), 1.6);
          ctx.beginPath();
          ctx.moveTo(4, 0);
          ctx.lineTo(26, 0);
          ctx.strokeStyle = "rgba(127,227,255,.8)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          glow(ctx, 22, 0, 12, `rgba(127,227,255,${0.3 + 0.5 * fl})`);
          ctx.restore();
        }
        ctx.save();
        ctx.translate(fore.x - 2, fore.y + 8);
        tpLeg(ctx, -fore.y - 10, false);
        ctx.restore();
        ctx.save();
        ctx.translate(hip.x - 4, hip.y + 8);
        tpLeg(ctx, -hip.y - 10, false);
        ctx.restore();
        ctx.save();
        ctx.translate(sh.x - 4, sh.y - 8);
        tpWing(ctx, open, flap, false);
        ctx.restore();
        // the head turns down towards the profile and growls when it thunders
        {
          const p = sp[44],
            cyc = (tt + 2.2) % 7,
            jaw =
              Math.max(
                fl * 0.8,
                !still && t > 4 && cyc < 0.9
                  ? Math.sin((cyc / 0.9) * Math.PI) * 0.5
                  : 0,
              ) + 0.04;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(
            Math.atan2(p.ty, p.tx) +
              1.0 +
              Math.sin(tt * 0.9) * 0.05 -
              jaw * 0.12,
          );
          ctx.scale(1.22, 1.22);
          tpHead(
            ctx,
            jaw,
            0.4 + 0.6 * Math.max(fl, 0.5 + 0.5 * Math.sin(tt * 2.2)),
            !still && blinking(tt, 4.2),
          );
          ctx.restore();
        }
        ctx.restore();
      }
      // little lights in the dark air
      for (const s of this.stars) {
        const k = a * (0.2 + 0.8 * Math.abs(Math.sin(tt * s.f * 0.6 + s.ph)));
        glow(ctx, s.x, s.y, s.s * 2.4, `rgba(127,227,255,${0.5 * k})`);
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r,
        fl = this.flash(t, still),
        cx = 77,
        cy = 77;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      glow(ctx, cx, cy, R + 22, `rgba(127,227,255,${a * (0.16 + 0.3 * fl)})`);
      // small wings open behind the ring
      for (const sx of [-1, 1]) {
        const k = still ? 1 : easeOutBack(clamp((t - 0.5) / 0.7));
        if (k <= 0) continue;
        ctx.save();
        ctx.translate(cx + sx * (R - 6), cy - 6);
        ctx.scale(sx * -0.34 * k, 0.34 * k);
        ctx.rotate(-0.35 + Math.sin(tt * 1.3) * 0.05);
        tpWing(ctx, 0.95, Math.sin(tt * 1.3), false);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        cx,
        cy,
        R + 3.5,
        [
          [TP.ink, 9],
          ["#2b3466", 5.6],
          ["rgba(127,227,255,.95)", 1.5, [4, 13], 30],
        ],
        tt,
      );
      ctx.restore();
      // horns on top, spines round the bottom
      for (const sx of [-1, 1]) {
        const k = still ? 1 : pop(t, 0.7, 0.5);
        if (k <= 0) continue;
        ctx.save();
        ctx.translate(cx + sx * 15, cy - R - 2);
        ctx.scale(sx * k, k);
        ctx.rotate(-0.25);
        ctx.beginPath();
        ctx.moveTo(-5, 3);
        ctx.quadraticCurveTo(-2, -16, 14, -27);
        ctx.quadraticCurveTo(8, -12, 6, 3);
        ctx.closePath();
        inked(ctx, grad(ctx, 0, 3, 12, -26, "#4a5390", "#c9d4ff"), 1.5, TP.ink);
        ctx.strokeStyle = "rgba(7,9,18,.5)";
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(-4 + i * 2.6, -i * 5.4);
          ctx.lineTo(4 + i * 2.2, -i * 6.4 + 2);
          ctx.stroke();
        }
        ctx.restore();
      }
      for (let i = 0; i < 7; i++) {
        const an = Math.PI / 2 + (i - 3) * 0.3,
          k = still ? 1 : pop(t, 0.8 + Math.abs(i - 3) * 0.07, 0.4);
        if (k <= 0) continue;
        const h = 11 - Math.abs(i - 3) * 2;
        ctx.save();
        ctx.translate(cx + Math.cos(an) * (R + 6), cy + Math.sin(an) * (R + 6));
        ctx.rotate(an - Math.PI / 2);
        ctx.scale(k, k);
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(0, h);
        ctx.lineTo(4, 0);
        ctx.closePath();
        inked(ctx, "#232b58", 1.2, TP.ink);
        glow(ctx, 0, h, 4 + fl * 5, `rgba(127,227,255,${0.4 + 0.5 * fl})`);
        ctx.restore();
      }
      // arcs that jump round the ring
      if (!still)
        for (let i = 0; i < 2; i++) {
          const an = tt * 1.7 + i * Math.PI,
            on = Math.max(0, Math.sin(tt * 9 + i * 3));
          tpStrike(
            ctx,
            cx + Math.cos(an) * (R + 6),
            cy + Math.sin(an) * (R + 6),
            cx + Math.cos(an + 0.7) * (R + 9),
            cy + Math.sin(an + 0.7) * (R + 9),
            Math.floor(tt * 12) + i * 5,
            a * 0.6 * on,
          );
        }
      // the eyes of the storm watch from above the ring
      {
        const k = still ? 1 : pop(t, 1.1, 0.5);
        if (k > 0)
          for (const sx of [-1, 1]) {
            ctx.save();
            ctx.translate(cx + sx * 6.4, cy - R - 6);
            ctx.scale(sx * k, k);
            glow(ctx, 0, 0, 7, `rgba(127,227,255,${0.5 + 0.4 * fl})`);
            ctx.beginPath();
            ctx.moveTo(-3.6, 1);
            ctx.quadraticCurveTo(0, -3, 4, -1.6);
            ctx.quadraticCurveTo(0.6, 2.2, -3.6, 1);
            ctx.closePath();
            ctx.fillStyle = "#d8fbff";
            ctx.fill();
            ctx.strokeStyle = TP.ink;
            ctx.lineWidth = 0.9;
            ctx.stroke();
            ctx.restore();
          }
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1),
        fl = this.flash(t, still),
        W = CARD.w,
        H = CARD.h;
      // heavy sky above, mist low down
      for (let i = 0; i < 4; i++)
        glow(
          ctx,
          ((i * 120 + tt * 12) % (W + 240)) - 120,
          14 + Math.sin(tt * 0.5 + i) * 6,
          120,
          `rgba(30,40,95,${0.5 * a})`,
        );
      for (let i = 0; i < 3; i++)
        glow(
          ctx,
          ((((i * 170 - tt * 8) % (W + 260)) + W + 260) % (W + 260)) - 130,
          H - 18,
          110,
          `rgba(90,120,220,${0.14 * a})`,
        );
      // rain on a slant
      if (!still) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.strokeStyle = `rgba(175,215,255,${0.32 * a})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        this.rain.each(tt, W + 60, H, (p, x, y) => {
          ctx.moveTo(x, y);
          ctx.lineTo(x - p.s * 0.28, y + p.s);
        });
        ctx.stroke();
        ctx.restore();
      }
      this.motes.each(tt, W, H, (p, x, y) => {
        glow(
          ctx,
          x,
          y,
          p.s * 2.6,
          `rgba(127,227,255,${0.45 * a * (0.3 + 0.7 * Math.abs(Math.sin(tt * p.f + p.ph)))})`,
        );
      });
      // the whole card lights up with the thunder, and a bolt crosses the top
      if (fl > 0.03) {
        ctx.fillStyle = `rgba(190,235,255,${0.2 * fl})`;
        ctx.fillRect(0, 0, W, H);
        tpStrike(
          ctx,
          W * 0.72,
          -6,
          W * 0.46,
          H * 0.3,
          77 + Math.floor((tt + 1.3) / 5.4),
          fl * 0.8,
        );
      }
    },
  };
}
