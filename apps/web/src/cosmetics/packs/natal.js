// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  TAU,
  clamp,
  rng,
  glow,
  sprite,
  stamp,
  inked,
  bounceOut,
  pop,
  fade,
  grad,
  rgrad,
  starPath,
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

// ---------- Natal ----------
const NT = {
  ink: "#2a1410",
  red: "#d6332e",
  green: "#1f8a4c",
  gold: "#ffd35c",
};
function ntCane(ctx, s) {
  ctx.lineCap = "round";
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(0, s);
    ctx.lineTo(0, -s * 0.4);
    ctx.arc(s * 0.42, -s * 0.4, s * 0.42, Math.PI, 0);
  };
  path();
  ctx.strokeStyle = NT.ink;
  ctx.lineWidth = s * 0.42;
  ctx.stroke();
  path();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = s * 0.28;
  ctx.stroke();
  path();
  ctx.strokeStyle = NT.red;
  ctx.lineWidth = s * 0.28;
  ctx.setLineDash([s * 0.2, s * 0.24]);
  ctx.lineCap = "butt";
  ctx.stroke();
  ctx.setLineDash([]);
}
function ntGift(ctx, w, h, box, rib) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h, w, h, 2.5);
  inked(ctx, grad(ctx, -w / 2, 0, w / 2, 0, box[0], box[1]), 1.5, NT.ink);
  ctx.fillStyle = rib;
  ctx.fillRect(-w * 0.09, -h, w * 0.18, h);
  ctx.beginPath();
  ctx.roundRect(-w / 2 - 2, -h - 5, w + 4, 7, 2);
  inked(ctx, box[0], 1.5, NT.ink);
  ctx.fillRect(-w * 0.09, -h - 5, w * 0.18, 7);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -h - 5);
    ctx.bezierCurveTo(
      sx * w * 0.2,
      -h - 18,
      sx * w * 0.5,
      -h - 14,
      sx * w * 0.36,
      -h - 5,
    );
    ctx.closePath();
    inked(ctx, rib, 1.3, NT.ink);
  }
}
// A reindeer sitting on (0,0); `glowing` is the nose, 0..1.
function ntDeer(ctx, t, blink, glowing, look) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  blobPath(ctx, [
    [-13, 0],
    [-15, -13],
    [-9, -25],
    [9, -25],
    [15, -13],
    [13, 0],
  ]);
  inked(ctx, grad(ctx, 0, -25, 0, 0, "#c98a52", "#8f5a2e"), 1.6, NT.ink);
  ctx.beginPath();
  ctx.ellipse(0, -9, 7.5, 9, 0, 0, TAU);
  ctx.fillStyle = "#f2dcb8";
  ctx.fill();
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(sx * 6.5 - 3.6, -13, 7.2, 13, 3.6);
    inked(ctx, "#b9793f", 1.4, NT.ink);
    ctx.beginPath();
    ctx.roundRect(sx * 6.5 - 4.2, -3.5, 8.4, 4.5, 2);
    inked(ctx, "#3a2418", 1.2, NT.ink);
  }
  ctx.beginPath();
  ctx.moveTo(-10, -23);
  ctx.quadraticCurveTo(0, -18, 10, -23);
  ctx.strokeStyle = NT.ink;
  ctx.lineWidth = 5.6;
  ctx.stroke();
  ctx.strokeStyle = NT.red;
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -17.5, 3.2, 0, TAU);
  inked(ctx, NT.gold, 1.1, NT.ink);
  ctx.save();
  ctx.translate(0, -33);
  ctx.rotate(look * 0.07);
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * 7, -10);
    ctx.scale(sx, 1);
    const an = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(2, -10, 8, -14, 9, -24);
      ctx.moveTo(4, -9);
      ctx.lineTo(13, -12);
      ctx.moveTo(8, -16);
      ctx.lineTo(15, -21);
      ctx.moveTo(2, -5);
      ctx.lineTo(-4, -12);
    };
    an();
    ctx.strokeStyle = NT.ink;
    ctx.lineWidth = 5;
    ctx.stroke();
    an();
    ctx.strokeStyle = "#e9cf9a";
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(sx * 13, -5);
    ctx.rotate(sx * 0.9);
    ctx.beginPath();
    ctx.ellipse(0, -5, 4, 8, 0, 0, TAU);
    inked(ctx, "#b9793f", 1.4, NT.ink);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, 14.5, 13, 0, 0, TAU);
  inked(ctx, grad(ctx, 0, -13, 0, 13, "#d79a60", "#a86a36"), 1.6, NT.ink);
  ctx.beginPath();
  ctx.ellipse(0, 6, 9, 6.5, 0, 0, TAU);
  ctx.fillStyle = "#f2dcb8";
  ctx.fill();
  ctx.save();
  ctx.translate(0, -2);
  eyes(ctx, 13, 2.8, look, blink, "#2a1410", null);
  ctx.restore();
  if (glowing > 0) glow(ctx, 0, 4.5, 16, `rgba(255,70,60,${0.7 * glowing})`);
  ctx.beginPath();
  ctx.arc(0, 4.5, 4.4, 0, TAU);
  inked(ctx, rgrad(ctx, -1.5, 3, 6, "#ff9a8f", "#e5352e"), 1.2, NT.ink);
  ctx.beginPath();
  ctx.arc(0, 8, 4, 0.4, Math.PI - 0.4);
  ctx.strokeStyle = NT.ink;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
}
function ntTree(ctx, h, t) {
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.rect(-h * 0.07, -h * 0.12, h * 0.14, h * 0.12);
  inked(ctx, "#6b3f1e", 1.3, NT.ink);
  for (let i = 0; i < 4; i++) {
    const y = -h * (0.1 + i * 0.2),
      w = h * (0.42 - i * 0.08),
      top = y - h * 0.34;
    ctx.beginPath();
    ctx.moveTo(-w, y);
    ctx.quadraticCurveTo(-w * 0.3, y - h * 0.1, 0, top);
    ctx.quadraticCurveTo(w * 0.3, y - h * 0.1, w, y);
    ctx.quadraticCurveTo(0, y + h * 0.06, -w, y);
    ctx.closePath();
    inked(ctx, grad(ctx, -w, 0, w, 0, "#2aa35e", "#156a3a"), 1.4, NT.ink);
  }
  const cols = ["#ff5f5a", "#ffd35c", "#5fb6ff", "#ff8fd0"];
  [
    [-0.2, -0.18],
    [0.14, -0.26],
    [-0.08, -0.4],
    [0.2, -0.46],
    [-0.14, -0.58],
    [0.06, -0.7],
    [0.3, -0.14],
    [-0.3, -0.3],
  ].forEach(([x, y], i) => {
    const on = 0.4 + 0.6 * Math.abs(Math.sin(t * 2.4 + i * 1.7));
    glow(ctx, x * h, y * h, h * 0.09, `rgba(255,240,200,${0.5 * on})`);
    ctx.beginPath();
    ctx.arc(x * h, y * h, h * 0.035, 0, TAU);
    ctx.fillStyle = cols[i % 4];
    ctx.fill();
    ctx.strokeStyle = NT.ink;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });
  ctx.save();
  ctx.translate(0, -h * 1.02);
  ctx.rotate(Math.sin(t * 1.5) * 0.1);
  glow(ctx, 0, 0, h * 0.24, `rgba(255,220,110,${0.5 + 0.2 * Math.sin(t * 4)})`);
  starPath(ctx, h * 0.11);
  inked(ctx, NT.gold, 1.2, NT.ink);
  ctx.restore();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Natal",
    reach: { top: 122, side: 64, bottom: 68 },
    mat: ["#2a1014", "#12080c"],
    theme: cardTheme("#c9302c", "#1a7a44"),
    init() {
      this.loop = frameLoop(CARD, 8);
      const m = this.loop.m;
      this.gar = Strand(
        this.loop,
        m.left + m.side * 0.3,
        m.side * 0.7 + m.arc + m.top + m.arc + m.side * 0.7,
        1,
        5,
        {
          off: 6,
          wave: 5,
          freq: 22,
          gap: 0.034,
          size: 11,
          taper: 1,
          outward: 0.6,
        },
      );
      this.t0 = 0.3;
      this.dur = 2.3;
      this.when = (u) => this.t0 + this.dur * clamp(u);
      this.front = (t) => clamp((t - this.t0) / this.dur);
      this.snow = Drift(22, 53, {
        v: [20, 44],
        s: [1.3, 3.2],
        sway: 12,
        spin: 0,
      });
      this.fx = Drift(22, 59, {
        v: [14, 34],
        s: [1.4, 3.6],
        sway: 12,
        spin: 0,
      });
      const R = rng(11);
      this.bokeh = [];
      for (let i = 0; i < 9; i++)
        this.bokeh.push({
          x: R() * CARD.w,
          y: 130 + R() * (CARD.h - 150),
          r: 10 + R() * 22,
          ph: R() * TAU,
          c: ["255,210,110", "255,120,110", "140,230,160"][i % 3],
        });
      this.needles = sprite(26, (x) => {
        x.lineCap = "round";
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * TAU;
          x.beginPath();
          x.moveTo(0, 0);
          x.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
          x.strokeStyle = i % 2 ? "#2aa35e" : "#156a3a";
          x.lineWidth = 2;
          x.stroke();
        }
      });
    },
    reset() {},
    update() {},
    drawFrame(ctx, t, still) {
      const T = still ? 99 : t,
        tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.4, 1.2),
        v = this.gar;
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
      // the pine garland, bushy, with baubles, canes and bows; the lights come on one after the other
      const g = this.front(T),
        last = Math.min(v.n, Math.floor(g * v.n));
      settle(this, "rest", ctx, t, still, this.t0 + this.dur + 1, 4, (c) => {
        strandLine(c, v, g, [
          [NT.ink, 13],
          ["#156a3a", 10],
        ]);
        for (let i = 0; i <= last; i += 2) {
          const p = v.pts[i];
          stamp(c, this.needles, p.x, p.y, 1.05, i * 0.7);
        }
        strandBits(c, v, T, this.when, (b, k) => {
          if (b.i % 3 === 1) return;
          c.rotate(b.a + Math.PI / 2);
          c.translate(0, -5 * b.out);
          c.scale(k, k);
          if (b.kind < 0.56) {
            const col = [
              ["#ff8f8a", "#c9211c"],
              ["#ffe9a8", "#e0a01f"],
              ["#9fd6ff", "#2f7fc9"],
            ][b.i % 3];
            c.beginPath();
            c.arc(0, -b.s * 0.9, b.s * 0.62, 0, TAU);
            inked(
              c,
              rgrad(
                c,
                -b.s * 0.2,
                -b.s * 1.1,
                b.s * 0.9,
                "#fff",
                col[0],
                col[1],
              ),
              1.3,
              NT.ink,
            );
            c.fillStyle = NT.gold;
            c.fillRect(-2, -b.s * 0.38, 4, 3);
          } else if (b.kind < 0.8) {
            c.translate(0, -b.s * 0.9);
            c.rotate(0.5 * (b.i % 2 ? 1 : -1));
            ntCane(c, b.s * 0.85);
          } else {
            c.translate(0, -b.s * 0.5);
            for (const sx of [-1, 1]) {
              c.beginPath();
              c.moveTo(0, 0);
              c.bezierCurveTo(
                sx * b.s * 0.5,
                -b.s * 0.8,
                sx * b.s * 1.2,
                -b.s * 0.5,
                sx * b.s,
                0,
              );
              c.bezierCurveTo(
                sx * b.s * 1.2,
                b.s * 0.5,
                sx * b.s * 0.5,
                b.s * 0.5,
                0,
                0,
              );
              c.closePath();
              inked(c, NT.red, 1.2, NT.ink);
            }
            c.beginPath();
            c.arc(0, 0, b.s * 0.26, 0, TAU);
            inked(c, NT.gold, 1.1, NT.ink);
          }
        });
      });
      for (const b of v.bits) {
        if (b.i % 3 !== 1) continue;
        const on = still ? 1 : clamp((t - this.when(b.u) - 0.5) / 0.2);
        if (on <= 0) continue;
        const col = [
            "255,90,80",
            "255,214,90",
            "110,190,255",
            "255,140,210",
            "120,240,150",
          ][Math.floor(b.i / 3) % 5],
          f = still
            ? 0.8
            : 0.45 + 0.55 * Math.abs(Math.sin(tt * 2.2 + b.i * 0.9));
        const x = b.x + b.nx * 6 * b.out,
          y = b.y + b.ny * 6 * b.out;
        glow(ctx, x, y, 15, `rgba(${col},${0.6 * on * f})`);
        ctx.beginPath();
        ctx.ellipse(x, y, 3.4, 4.4, b.a, 0, TAU);
        ctx.fillStyle = `rgb(${col})`;
        ctx.fill();
        ctx.strokeStyle = NT.ink;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
      // presents in one corner, a lit tree in the other
      [
        [-2, 34, 26, ["#e5484d", "#a82a33"], NT.gold],
        [28, 24, 20, ["#2f8fd6", "#1f5fa0"], "#fff"],
        [12, 20, 13, ["#ffd35c", "#e0a01f"], NT.red],
      ].forEach(([dx, w, h, box, rib], i) => {
        const k = still ? 1 : pop(t, 0.7 + i * 0.16, 0.5);
        if (k <= 0) return;
        ctx.save();
        ctx.translate(34 + dx, CARD.h + 44 - (i === 2 ? 26 : 0));
        ctx.rotate(i === 2 ? 0.12 : 0);
        ctx.scale(k, k);
        ntGift(ctx, w, h, box, rib);
        ctx.restore();
      });
      {
        const k = still ? 1 : pop(t, 1.1, 0.6);
        if (k > 0) {
          ctx.save();
          ctx.translate(CARD.w - 30, CARD.h + 46);
          ctx.scale(k, k);
          ntTree(ctx, 56, tt);
          ctx.restore();
        }
      }
      // on the top edge: the reindeer with the bright nose, and a gingerbread friend that waves
      {
        const k = still ? 1 : bounceOut((t - 1.2) / 0.85);
        if (still || t > 1.2) {
          ctx.save();
          ctx.translate(CARD.w * 0.28, -4 - (1 - k) * 150);
          ctx.scale(1.65, 1.65);
          ntDeer(
            ctx,
            tt,
            !still && blinking(tt, 3.3),
            still ? 0.8 : 0.55 + 0.45 * Math.sin(tt * 3),
            Math.sin(tt * 0.7) * 0.8,
          );
          ctx.restore();
        }
      }
      {
        const k = still ? 1 : pop(t, 1.9, 0.5);
        if (k > 0) {
          const c = tt % 4.5,
            wv = !still && c < 1.3 ? Math.sin(c * 11) * 0.5 : 0,
            hop =
              !still && c > 3.4 && c < 3.8
                ? Math.sin(((c - 3.4) / 0.4) * Math.PI) * 6
                : 0;
          ctx.save();
          ctx.translate(CARD.w * 0.73, -5 - hop);
          ctx.scale(1.5 * k, 1.5 * k);
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          const body = () => {
            ctx.beginPath();
            ctx.moveTo(-5, -1);
            ctx.lineTo(-5, -11);
            ctx.moveTo(5, -1);
            ctx.lineTo(5, -11);
            ctx.moveTo(0, -11);
            ctx.lineTo(0, -22);
            ctx.moveTo(-5, -20);
            ctx.lineTo(-14, -17);
            ctx.stroke();
            ctx.save();
            ctx.translate(5, -20);
            ctx.rotate(-0.9 + wv);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(10, 0);
            ctx.stroke();
            ctx.restore();
          };
          ctx.strokeStyle = NT.ink;
          ctx.lineWidth = 12;
          body();
          ctx.strokeStyle = "#c98a4b";
          ctx.lineWidth = 9;
          body();
          ctx.beginPath();
          ctx.arc(0, -30, 9.5, 0, TAU);
          inked(ctx, "#c98a4b", 1.5, NT.ink);
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-8, -3.5);
          ctx.lineTo(-2, -3.5);
          ctx.moveTo(2, -3.5);
          ctx.lineTo(8, -3.5);
          ctx.moveTo(-13, -15);
          ctx.lineTo(-11, -19);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, -29, 5, 0.3, Math.PI - 0.3);
          ctx.stroke();
          ctx.fillStyle = "#2a1410";
          ctx.beginPath();
          ctx.arc(-3.4, -32, 1.3, 0, TAU);
          ctx.arc(3.4, -32, 1.3, 0, TAU);
          ctx.fill();
          ctx.fillStyle = NT.red;
          ctx.beginPath();
          ctx.arc(0, -17, 1.6, 0, TAU);
          ctx.fill();
          ctx.fillStyle = "#2aa35e";
          ctx.beginPath();
          ctx.arc(0, -12, 1.6, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      }
    },
    drawAvatar(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0, 0.7),
        R = AVATAR.r;
      // candy stripes round the avatar
      ctx.save();
      ctx.globalAlpha = a;
      ringBase(
        ctx,
        77,
        77,
        R + 3.5,
        [
          [NT.ink, 8],
          ["#fff", 5.2],
          [NT.red, 5.2, [6, 7], 5],
        ],
        tt,
      );
      ctx.restore();
      // holly at the bottom
      {
        const k = still ? 1 : pop(t, 0.9, 0.5);
        ctx.save();
        ctx.translate(77 + 4, 77 + R + 5);
        ctx.scale(k, k);
        for (const [r, sx] of [
          [-2.6, 1],
          [-0.5, 1],
        ]) {
          ctx.save();
          ctx.rotate(r + Math.sin(tt * 1.6 + r) * 0.05);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          for (let i = 1; i <= 4; i++)
            ctx.quadraticCurveTo(
              i * 5.5 - 4,
              -7,
              i * 5.5 - 1,
              i === 4 ? 0 : -3,
            );
          for (let i = 4; i >= 1; i--)
            ctx.quadraticCurveTo(
              i * 5.5 - 4,
              7,
              i * 5.5 - 6.5,
              i === 1 ? 0 : 3,
            );
          ctx.closePath();
          inked(ctx, grad(ctx, 0, 0, 22, 0, "#2aa35e", "#156a3a"), 1.3, NT.ink);
          ctx.restore();
        }
        for (const [x, y] of [
          [-3, -1],
          [3, -3],
          [1, 3],
        ]) {
          ctx.beginPath();
          ctx.arc(x, y, 3.6, 0, TAU);
          inked(
            ctx,
            rgrad(ctx, x - 1, y - 1, 4.5, "#ff9a8f", "#d6332e"),
            1.1,
            NT.ink,
          );
        }
        ctx.restore();
      }
      // the hat drops on, its pompom swinging
      const k = still ? 1 : bounceOut((t - 0.5) / 0.8);
      if (still || t > 0.5) {
        const sw = Math.sin(tt * 2.2) * 0.12;
        ctx.save();
        ctx.translate(77 - 2, 77 - R + 7 - (1 - k) * 70);
        ctx.rotate(-0.2);
        ctx.beginPath();
        ctx.moveTo(-31, 0);
        ctx.quadraticCurveTo(-24, -38, 6, -44);
        ctx.quadraticCurveTo(34, -44 + sw * 20, 42, -16 + sw * 30);
        ctx.quadraticCurveTo(26, -28, 31, 0);
        ctx.closePath();
        inked(
          ctx,
          grad(ctx, -30, -40, 30, 0, "#f25a52", "#b3201c"),
          1.8,
          NT.ink,
        );
        ctx.beginPath();
        ctx.roundRect(-35, -5, 70, 12, 6);
        inked(ctx, "#fff", 1.7, NT.ink);
        ctx.beginPath();
        ctx.arc(43, -12 + sw * 30, 8, 0, TAU);
        inked(
          ctx,
          rgrad(ctx, 40, -15 + sw * 30, 11, "#fff", "#e3e9f2"),
          1.6,
          NT.ink,
        );
        ctx.restore();
      }
    },
    drawEffect(ctx, t, still) {
      const tt = still ? 0.6 : t,
        a = still ? 1 : fade(t, 0.2, 1);
      for (const b of this.bokeh)
        glow(
          ctx,
          b.x,
          b.y,
          b.r,
          `rgba(${b.c},${a * (0.12 + 0.12 * Math.sin(tt * 1.2 + b.ph))})`,
        );
      this.fx.each(tt, CARD.w, CARD.h, (p, x, y) => {
        ctx.globalAlpha = a * (0.4 + 0.5 * p.k);
        ctx.beginPath();
        ctx.arc(x, y, p.s * 0.8, 0, TAU);
        ctx.fillStyle = "#fff";
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad(
        ctx,
        0,
        CARD.h - 50,
        0,
        CARD.h,
        "rgba(255,255,255,0)",
        `rgba(255,255,255,${0.18 * a})`,
      );
      ctx.fillRect(0, CARD.h - 50, CARD.w, 50);
    },
  };
}
