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
  rectLoop,
  circleLoop,
  Particles,
  glow,
  Layer,
  sprite,
  tuft,
} from "../kit";

// ---------- Dragão Imperial ----------
const DR = {
  red: "#D42A1E",
  redDark: "#931311",
  redLight: "#F2603F",
  gold: "#F6C445",
  goldDark: "#C8860F",
  cream: "#FBEBC2",
  ink: "#3A0A0C",
  jade: "#22C39A",
  mouth: "#5A0A12",
};

function ribbon(ctx, pts, off, half, extra = 0) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i],
      d = (off + half) * p.hw + extra;
    const x = p.x + p.nx * d,
      y = p.y + p.ny * d;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i],
      d = (off - half) * p.hw - extra;
    ctx.lineTo(p.x + p.nx * d, p.y + p.ny * d);
  }
  ctx.closePath();
}

function strokeBoth(ctx, fill, lw = 1.6) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = DR.ink;
  ctx.lineJoin = "round";
  ctx.stroke();
}

function bez(a, b, c, d, k) {
  const m = 1 - k;
  return [
    m * m * m * a[0] +
      3 * m * m * k * b[0] +
      3 * m * k * k * c[0] +
      k * k * k * d[0],
    m * m * m * a[1] +
      3 * m * m * k * b[1] +
      3 * m * k * k * c[1] +
      k * k * k * d[1],
  ];
}
// A ribbon that tapers along a list of [x, y] points.
function tendril(ctx, pts, w0, w1, fill, lw = 1.3) {
  const n = pts.length - 1,
    A = [],
    B = [];
  for (let i = 0; i <= n; i++) {
    const a = pts[Math.max(0, i - 1)],
      b = pts[Math.min(n, i + 1)],
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      l = Math.hypot(dx, dy) || 1,
      w = lerp(w0, w1, i / n);
    A.push([pts[i][0] - (dy / l) * w, pts[i][1] + (dx / l) * w]);
    B.push([pts[i][0] + (dy / l) * w, pts[i][1] - (dx / l) * w]);
  }
  ctx.beginPath();
  A.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
  for (let i = n; i >= 0; i--) ctx.lineTo(B[i][0], B[i][1]);
  ctx.closePath();
  strokeBoth(ctx, fill, lw);
}
// A limb segment: a capsule that tapers from (x0,y0) to (x1,y1).
function limb(ctx, x0, y0, x1, y1, w0, w1) {
  const a = Math.atan2(y1 - y0, x1 - x0),
    s = Math.sin(a),
    c = Math.cos(a);
  ctx.beginPath();
  ctx.moveTo(x0 + s * w0, y0 - c * w0);
  ctx.lineTo(x1 + s * w1, y1 - c * w1);
  ctx.arc(x1, y1, w1, a - Math.PI / 2, a + Math.PI / 2);
  ctx.lineTo(x0 - s * w0, y0 + c * w0);
  ctx.arc(x0, y0, w0, a + Math.PI / 2, a + Math.PI * 1.5);
  ctx.closePath();
}

// The head faces +x with its crown towards -y, around the neck joint at (0,0).
function dragonHead(ctx, t, jaw, blink, fire = 0) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const sw = (i, a = 1, f = 2.2) => Math.sin(t * f + i * 1.3) * a;
  const lock = (x, y, ang, len, w, c0, c1, i, lw = 1.5, c2) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + sw(i, 0.09));
    tuft(ctx, len, w, sw(i + 2, 2.6, 3));
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, c0);
    g.addColorStop(c2 ? 0.55 : 1, c1);
    if (c2) g.addColorStop(1, c2);
    strokeBoth(ctx, g, lw);
    ctx.restore();
  };
  const antler = (bx, by, s, rot, dark) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rot + sw(9, 0.012));
    ctx.scale(s, s);
    const beam = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-3, -13, -13, -22, -29, -27);
      ctx.bezierCurveTo(-38, -30, -44, -37, -45, -47);
      ctx.moveTo(-9, -16);
      ctx.bezierCurveTo(-10, -26, -6, -34, 3, -40);
      ctx.moveTo(-25, -25.5);
      ctx.bezierCurveTo(-28, -35, -25, -42, -19, -49);
      ctx.moveTo(-38, -31.5);
      ctx.quadraticCurveTo(-48, -31, -55, -36);
    };
    beam();
    ctx.strokeStyle = DR.ink;
    ctx.lineWidth = 8;
    ctx.stroke();
    beam();
    ctx.strokeStyle = dark ? "#d9a441" : DR.cream;
    ctx.lineWidth = 5;
    ctx.stroke();
    beam();
    ctx.strokeStyle = dark ? "#f0c869" : "#fffdf0";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = DR.goldDark;
    ctx.lineWidth = 1.2;
    [
      [-2, -8],
      [-7, -16],
      [-16, -22.5],
      [-33, -28.5],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x - 2.2, y + 1.4);
      ctx.lineTo(x + 2.2, y - 1.4);
      ctx.stroke();
    });
    ctx.restore();
  };
  const rot = (x, y) => {
    const c = Math.cos(jaw),
      s = Math.sin(jaw),
      dx = x - 10,
      dy = y - 6;
    return [10 + dx * c - dy * s, 6 + dx * s + dy * c];
  };
  const lipA = [
      [67, -7],
      [58, -3],
      [50, -8],
      [42, -3],
    ],
    lipB = [
      [42, -3],
      [34, 1],
      [26, -3],
      [14, 4.5],
    ];

  antler(8, -30, 0.86, -0.02, true);
  // the mane, back layer
  [
    [-12, -26, -2.5, 46, 15],
    [-15, -17, -2.78, 56, 16],
    [-16, -6, -3.0, 60, 17],
    [-15, 4, 3.06, 54, 16],
    [-11, 12, 2.82, 42, 14],
  ].forEach(([x, y, a, len, w], i) =>
    lock(x, y, a, len, w, "#E8451F", "#FF9A3D", i, 1.6, DR.gold),
  );
  // far ear
  ctx.save();
  ctx.translate(4, -31);
  ctx.rotate(-2.2 + sw(4, 0.05));
  tuft(ctx, 17, 9);
  strokeBoth(ctx, DR.redDark, 1.4);
  ctx.restore();
  // inside of the mouth
  {
    const a = rot(66, 5),
      b = rot(30, 10);
    ctx.beginPath();
    ctx.moveTo(11, 4);
    ctx.lineTo(40, -6);
    ctx.lineTo(68, -9);
    ctx.lineTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(9, 8);
    ctx.closePath();
    const g = ctx.createLinearGradient(12, 0, 66, 0);
    g.addColorStop(0, "#3d050b");
    g.addColorStop(1, "#8c1220");
    ctx.fillStyle = g;
    ctx.fill();
  }
  // tongue
  {
    const tip = rot(60, -1),
      mid = rot(40, 6),
      wag = Math.sin(t * 5.2) * 1.6;
    const draw = () => {
      ctx.beginPath();
      ctx.moveTo(18, 4);
      ctx.bezierCurveTo(30, 6 + jaw * 4, mid[0], mid[1], tip[0], tip[1] + wag);
      ctx.quadraticCurveTo(
        tip[0] + 6,
        tip[1] - 4 + wag,
        tip[0] + 3,
        tip[1] - 8 + wag,
      );
    };
    draw();
    ctx.strokeStyle = DR.ink;
    ctx.lineWidth = 8.4;
    ctx.stroke();
    draw();
    ctx.strokeStyle = "#F0627A";
    ctx.lineWidth = 5.8;
    ctx.stroke();
    draw();
    ctx.strokeStyle = "#ffa4b4";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  // breath of fire on arrival
  if (fire > 0.01)
    for (let i = 0; i < 9; i++) {
      const a = (i - 4) * 0.1 + Math.sin(t * 17 + i * 2.1) * 0.07,
        len = (40 + (i % 3) * 20) * fire * (0.82 + 0.18 * Math.sin(t * 23 + i)),
        m = rot(58, 1);
      ctx.save();
      ctx.translate(m[0], m[1] - 5);
      ctx.rotate(a + jaw * 0.45);
      tuft(ctx, len, 10 + 9 * fire, Math.sin(t * 13 + i) * 3);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, "rgba(255,250,214,.95)");
      g.addColorStop(0.35, "rgba(255,206,74,.9)");
      g.addColorStop(0.75, "rgba(246,110,40,.7)");
      g.addColorStop(1, "rgba(214,42,30,0)");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    }
  // lower jaw, hinged at the corner of the mouth
  ctx.save();
  ctx.translate(10, 6);
  ctx.rotate(jaw);
  ctx.translate(-10, -6);
  [
    [53, 13, 1.85, 17, 7],
    [43, 15, 2.05, 25, 8.5],
    [32, 17, 2.2, 28, 9],
    [21, 17, 2.4, 23, 8],
    [61, 10.5, 1.45, 13, 6],
  ].forEach(([x, y, a, len, w], i) =>
    lock(x, y, a, len, w, DR.gold, DR.cream, i + 10, 1.4, "#fffbea"),
  );
  ctx.beginPath();
  ctx.moveTo(4, 6);
  ctx.bezierCurveTo(22, 11, 44, 10, 60, 4.5);
  ctx.bezierCurveTo(66, 3, 69.5, 7, 66.5, 11);
  ctx.bezierCurveTo(62, 15, 54, 15, 48, 16);
  ctx.bezierCurveTo(34, 20.5, 16, 20.5, 2, 15);
  ctx.closePath();
  {
    const g = ctx.createLinearGradient(0, 5, 0, 20);
    g.addColorStop(0, "#C7241B");
    g.addColorStop(1, "#7d0f12");
    strokeBoth(ctx, g, 1.8);
  }
  ctx.strokeStyle = "rgba(58,10,12,.5)";
  ctx.lineWidth = 1;
  [
    [22, 15],
    [31, 15.6],
    [40, 15],
    [14, 13.4],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 3.4, 0.4, 2.7);
    ctx.stroke();
  });
  [
    [30, 10],
    [37, 10.2],
    [44, 9.9],
    [50.5, 8.8],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x - 1.6, y);
    ctx.lineTo(x + 1.6, y);
    ctx.lineTo(x, y - 4.6);
    ctx.closePath();
    ctx.fillStyle = "#fffdf4";
    ctx.fill();
    ctx.strokeStyle = DR.ink;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(55, 7.4);
  ctx.lineTo(59.4, 6.2);
  ctx.quadraticCurveTo(59.6, -1, 56.2, -4.6);
  ctx.quadraticCurveTo(56.4, 2, 55, 7.4);
  ctx.closePath();
  ctx.fillStyle = "#fffdf4";
  ctx.fill();
  ctx.strokeStyle = DR.ink;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  {
    const d = () => {
      ctx.beginPath();
      ctx.moveTo(8, 7.6);
      ctx.bezierCurveTo(24, 11.8, 44, 10.8, 61, 5.8);
    };
    d();
    ctx.strokeStyle = DR.ink;
    ctx.lineWidth = 4.4;
    ctx.stroke();
    d();
    ctx.strokeStyle = "#F7D38A";
    ctx.lineWidth = 2.3;
    ctx.stroke();
  }
  ctx.restore();
  // jade frill behind the jaw
  ctx.save();
  ctx.translate(-2, 3);
  ctx.rotate(sw(6, 0.05));
  {
    const sp = [
      [2.2, 21],
      [2.62, 27],
      [3.02, 29],
      [-2.86, 26],
      [-2.46, 19],
    ].map(([a, l]) => [Math.cos(a) * l, Math.sin(a) * l]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    sp.forEach((q, i) => {
      if (!i) ctx.lineTo(q[0], q[1]);
      else {
        const pr = sp[i - 1];
        ctx.quadraticCurveTo(
          (pr[0] + q[0]) * 0.36,
          (pr[1] + q[1]) * 0.36,
          q[0],
          q[1],
        );
      }
    });
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, 3, 0, 0, 29);
    g.addColorStop(0, "#0f6f5c");
    g.addColorStop(0.6, DR.jade);
    g.addColorStop(1, "#a9f5dc");
    strokeBoth(ctx, g, 1.5);
    ctx.strokeStyle = "rgba(6,60,48,.75)";
    ctx.lineWidth = 1;
    sp.forEach((q) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(q[0] * 0.92, q[1] * 0.92);
      ctx.stroke();
    });
  }
  ctx.restore();
  // upper teeth and fangs
  [
    [lipA, 0.18, 4.6, 11.5],
    [lipA, 0.5, 3, 5.2],
    [lipA, 0.8, 3, 5.2],
    [lipB, 0.1, 4, 8.6],
    [lipB, 0.34, 3, 4.8],
    [lipB, 0.56, 3, 4.6],
    [lipB, 0.78, 2.8, 4],
  ].forEach(([L, k, w, h]) => {
    const q = bez(L[0], L[1], L[2], L[3], k);
    ctx.beginPath();
    ctx.moveTo(q[0] - w / 2, q[1] - 1.5);
    ctx.lineTo(q[0] + w / 2, q[1] - 1.5);
    ctx.quadraticCurveTo(
      q[0] + w * 0.2,
      q[1] + h * 0.5,
      q[0] - w * 0.25,
      q[1] + h,
    );
    ctx.quadraticCurveTo(
      q[0] - w * 0.45,
      q[1] + h * 0.4,
      q[0] - w / 2,
      q[1] - 1.5,
    );
    ctx.closePath();
    ctx.fillStyle = "#fffdf4";
    ctx.fill();
    ctx.strokeStyle = DR.ink;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  });
  // skull, snout and nose
  ctx.beginPath();
  ctx.moveTo(-14, -16);
  ctx.bezierCurveTo(-12, -30, 2, -36.5, 14, -34.5);
  ctx.bezierCurveTo(22, -33.5, 30, -25, 38, -21.5);
  ctx.bezierCurveTo(46, -19.5, 52, -21, 57, -23.5);
  ctx.bezierCurveTo(61, -32, 76, -30, 77.5, -19.5);
  ctx.bezierCurveTo(78.5, -12, 73, -7, 67, -7);
  ctx.bezierCurveTo(58, -3, 50, -8, 42, -3);
  ctx.bezierCurveTo(34, 1, 26, -3, 14, 4.5);
  ctx.bezierCurveTo(9, 13.5, -6, 16, -14, 10);
  ctx.closePath();
  {
    const g = ctx.createLinearGradient(0, -36, 0, 14);
    g.addColorStop(0, "#F5593A");
    g.addColorStop(0.42, DR.red);
    g.addColorStop(1, "#8f1213");
    strokeBoth(ctx, g, 1.9);
  }
  // scales on the forehead and cheek
  ctx.strokeStyle = "rgba(70,8,10,.5)";
  ctx.lineWidth = 1;
  [
    [1, -25],
    [9, -28],
    [17, -27.5],
    [5, -18],
    [13, -20],
    [-5, -16],
    [-7, -5],
    [1, -9],
    [9, -11],
    [5, -1],
    [-3, 4],
    [17, -12],
    [13, -3],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0.5, 2.7);
    ctx.stroke();
  });
  // light along the bridge of the snout, nostril and nose shine
  ctx.beginPath();
  ctx.moveTo(38, -18.6);
  ctx.bezierCurveTo(46, -16.4, 52, -17.6, 58, -20.4);
  ctx.strokeStyle = "rgba(255,206,170,.8)";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(66.5, -24.5, 5.4, 2.6, -0.2, 0, TAU);
  ctx.fillStyle = "rgba(255,214,186,.6)";
  ctx.fill();
  ctx.beginPath();
  for (let a = 0; a < 5.4; a += 0.3) {
    const r = 4.6 - a * 0.62,
      x = 70.5 + Math.cos(a + 2.6) * r,
      y = -15.5 + Math.sin(a + 2.6) * r;
    if (a) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.strokeStyle = DR.ink;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(57.5, -23);
  ctx.quadraticCurveTo(60, -17, 64.5, -14.5);
  ctx.strokeStyle = "rgba(58,10,12,.55)";
  ctx.lineWidth = 1.1;
  ctx.stroke();
  // the lip
  {
    const d = () => {
      ctx.beginPath();
      ctx.moveTo(69, -7.4);
      ctx.bezierCurveTo(58, -3, 50, -8, 42, -3);
      ctx.bezierCurveTo(34, 1, 26, -3, 14.5, 4.2);
    };
    d();
    ctx.strokeStyle = DR.ink;
    ctx.lineWidth = 5;
    ctx.stroke();
    d();
    ctx.strokeStyle = "#F7D38A";
    ctx.lineWidth = 2.8;
    ctx.stroke();
  }
  // eye
  ctx.save();
  ctx.translate(31.5, -18.5);
  ctx.rotate(-0.22);
  ctx.beginPath();
  ctx.ellipse(0, 0, 9.4, 7, 0, 0, TAU);
  ctx.fillStyle = DR.ink;
  ctx.fill();
  const open = 1 - blink;
  ctx.beginPath();
  ctx.ellipse(0.4, 0.4, 7.8, 5.6 * open, 0, 0, TAU);
  ctx.fillStyle = "#fff6c9";
  ctx.fill();
  if (open > 0.4) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0.4, 0.4, 7.8, 5.6 * open, 0, 0, TAU);
    ctx.clip();
    const g = ctx.createRadialGradient(1.8, 0.4, 0.5, 1.8, 0.4, 5);
    g.addColorStop(0, "#7ff0cf");
    g.addColorStop(0.7, DR.jade);
    g.addColorStop(1, "#0b6b56");
    ctx.beginPath();
    ctx.arc(1.8, 0.4, 4.9, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "#063c30";
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(2, 0.4, 1.3, 4.3, 0, 0, TAU);
    ctx.fillStyle = "#04110d";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3.9, -1.8, 1.5, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0.2, 2.2, 0.7, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-9, -7);
    ctx.lineTo(10, -7);
    ctx.lineTo(10, -2.6);
    ctx.quadraticCurveTo(0, -5.4, -9, -1.2);
    ctx.closePath();
    ctx.fillStyle = DR.ink;
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // flame brow
  [
    [27, -27.5, -2.72, 27, 9],
    [33, -26.5, -2.52, 21, 8],
    [38, -24.5, -2.3, 14, 6.5],
  ].forEach(([x, y, a, len, w], i) =>
    lock(x, y, a, len, w, DR.goldDark, DR.gold, i + 20, 1.4, "#fff3c4"),
  );
  ctx.beginPath();
  ctx.moveTo(19, -27.5);
  ctx.bezierCurveTo(27, -30.5, 36, -27.5, 43.5, -20.5);
  ctx.bezierCurveTo(36, -24.6, 28, -25.4, 20, -23.6);
  ctx.closePath();
  strokeBoth(ctx, DR.gold, 1.5);
  // near ear, near antler
  ctx.save();
  ctx.translate(-3, -27);
  ctx.rotate(-2.42 + sw(5, 0.06));
  tuft(ctx, 21, 11);
  strokeBoth(ctx, DR.red, 1.5);
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.quadraticCurveTo(10, -2.4, 16, 0);
  ctx.quadraticCurveTo(10, 2.4, 3, 0);
  ctx.fillStyle = "#F58A8A";
  ctx.fill();
  ctx.restore();
  antler(11, -33, 0.96, -0.32, false);
  // the mane, front layer
  [
    [-9, -22, -2.66, 34, 12],
    [-13, -12, -2.92, 42, 13],
    [-13, -1, 3.1, 44, 13],
    [-10, 9, 2.86, 34, 12],
  ].forEach(([x, y, a, len, w], i) =>
    lock(x, y, a, len, w, DR.gold, DR.cream, i + 30, 1.5, "#fffbea"),
  );
  // whiskers
  const whisker = (P, phase, amp) => {
    const pts = [];
    for (let i = 0; i <= 28; i++) {
      const k = i / 28,
        q =
          k < 0.5
            ? bez(P[0], P[1], P[2], P[3], k * 2)
            : bez(P[3], P[4], P[5], P[6], (k - 0.5) * 2);
      pts.push([
        q[0] + Math.cos(t * 1.7 + phase - k * 4) * amp * k * k * 0.5,
        q[1] + Math.sin(t * 2.3 + phase - k * 5) * amp * k * k,
      ]);
    }
    const g = ctx.createLinearGradient(P[0][0], 0, P[6][0], 0);
    g.addColorStop(0, DR.redLight);
    g.addColorStop(0.28, DR.gold);
    g.addColorStop(1, DR.cream);
    tendril(ctx, pts, 3.3, 0.7, g, 1.3);
  };
  whisker(
    [
      [66, -11],
      [82, -15],
      [94, -30],
      [80, -41],
      [66, -52],
      [42, -47],
      [20, -60],
    ],
    0,
    8,
  );
  whisker(
    [
      [64, -6.5],
      [80, -3],
      [92, 10],
      [78, 23],
      [64, 36],
      [42, 26],
      [22, 38],
    ],
    2,
    7,
  );
}

// One leg, in a frame where x points to the head and y to the card; the hip sits on the belly.
function dragonLeg(ctx, hw, t, phase, fly) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const k = hw / 17,
    paddle = fly * Math.sin(t * 9 + phase) * 0.5,
    grip = (1 - fly) * Math.sin(t * 1.3 + phase) * 0.06;
  ctx.save();
  ctx.scale(k, k);
  ctx.translate(0, 9);
  ctx.rotate(paddle - fly * 0.5);
  const E = [-14, 12],
    Wr = [6, 15 - fly * 2];
  // flame tufts at the elbow
  [
    [2.45, 24, 10],
    [2.95, 19, 9],
    [2.0, 17, 8],
  ].forEach(([a, len, w], i) => {
    ctx.save();
    ctx.translate(E[0] - 1, E[1]);
    ctx.rotate(a + Math.sin(t * 3 + i + phase) * 0.14);
    tuft(ctx, len, w);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, "#FF9A3D");
    g.addColorStop(1, "#fff3c4");
    strokeBoth(ctx, g, 1.3);
    ctx.restore();
  });
  // foot first, so the forearm sits over the palm: three toes forward, one back, each with a hooked claw
  ctx.save();
  ctx.translate(Wr[0], Wr[1]);
  ctx.rotate(grip);
  [
    [2.85, 9, -1],
    [0.2, 13, 1],
    [0.78, 15, 1],
    [1.38, 13, 1],
  ].forEach(([a, len, hook], i) => {
    ctx.save();
    ctx.rotate(a + (i ? fly * (i - 2) * 0.25 : 0));
    ctx.save();
    ctx.translate(len - 0.5, 0);
    ctx.scale(1, hook);
    ctx.beginPath();
    ctx.moveTo(-1, -2.9);
    ctx.quadraticCurveTo(9, -3.6, 12.5, 6.5);
    ctx.quadraticCurveTo(5, 3.2, -1, 2.9);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 12, 5);
    g.addColorStop(0, "#fffbea");
    g.addColorStop(0.6, "#F7D38A");
    g.addColorStop(1, DR.goldDark);
    strokeBoth(ctx, g, 1.2);
    ctx.restore();
    limb(ctx, 0, 0, len, 0, 4.2, 3.3);
    const tg = ctx.createLinearGradient(0, -4, 0, 4);
    tg.addColorStop(0, DR.redLight);
    tg.addColorStop(1, "#b01a1a");
    strokeBoth(ctx, tg, 1.4);
    ctx.strokeStyle = "rgba(70,8,10,.6)";
    ctx.lineWidth = 0.9;
    [0.42, 0.72].forEach((q) => {
      ctx.beginPath();
      ctx.arc(len * q, 0, 2.6, -1.1, 1.1);
      ctx.stroke();
    });
    ctx.restore();
  });
  ctx.beginPath();
  ctx.arc(0, 0, 6.2, 0, TAU);
  strokeBoth(ctx, DR.red, 1.5);
  ctx.restore();
  // forearm with a gold band at the wrist, then the thigh over it
  limb(ctx, E[0], E[1], Wr[0], Wr[1], 6.4, 4.8);
  {
    const g = ctx.createLinearGradient(E[0], E[1], Wr[0], Wr[1]);
    g.addColorStop(0, "#9c1418");
    g.addColorStop(1, DR.red);
    strokeBoth(ctx, g, 1.7);
  }
  {
    const dx = Wr[0] - E[0],
      dy = Wr[1] - E[1],
      l = Math.hypot(dx, dy),
      bx = E[0] + dx * 0.74,
      by = E[1] + dy * 0.74,
      px = (-dy / l) * 5.6,
      py = (dx / l) * 5.6;
    ctx.beginPath();
    ctx.moveTo(bx - px, by - py);
    ctx.lineTo(bx + px, by + py);
    ctx.strokeStyle = DR.ink;
    ctx.lineWidth = 5.4;
    ctx.stroke();
    ctx.strokeStyle = DR.gold;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  limb(ctx, 2, -6, E[0], E[1], 9.2, 6.2);
  {
    const g = ctx.createLinearGradient(0, -12, 0, 20);
    g.addColorStop(0, DR.redLight);
    g.addColorStop(1, "#a3161a");
    strokeBoth(ctx, g, 1.8);
  }
  ctx.strokeStyle = "rgba(70,8,10,.55)";
  ctx.lineWidth = 1;
  [
    [2, -6],
    [-4, -1],
    [3, 2],
    [-8, 5],
    [-2, 7],
    [-11, 11],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4.2, 0.9, 3.1);
    ctx.stroke();
  });
  ctx.restore();
}

// One scale per tone, painted once: its dark rim faces +x, where the tail is. Small scales skip the shine.
let DRAGON_SCALES = null;
function dragonScales() {
  if (DRAGON_SCALES) return DRAGON_SCALES;
  const one = (fill, rim, shine) =>
    sprite(32, (x) => {
      x.beginPath();
      x.arc(0, 0, 12, 0, TAU);
      x.fillStyle = fill;
      x.fill();
      x.beginPath();
      x.arc(0, 0, 12, -1.45, 1.45);
      x.strokeStyle = rim;
      x.lineWidth = 1.9;
      x.stroke();
      if (shine) {
        x.beginPath();
        x.arc(0, 0, 7.2, -0.85, 0.85);
        x.strokeStyle = shine;
        x.lineWidth = 1.9;
        x.stroke();
      }
    });
  const tones = ["#F0512F", "#DC2F20", "#C4211C", "#A3161A"];
  DRAGON_SCALES = [
    ...tones.map((c) => one(c, "rgba(74,7,10,.78)", "rgba(255,150,110,.5)")),
    one("#F2B03A", "rgba(120,60,6,.85)", "rgba(255,246,200,.85)"),
    ...tones.map((c) => one(c, "rgba(74,7,10,.78)")),
    one("#F2B03A", "rgba(120,60,6,.85)"),
  ];
  return DRAGON_SCALES;
}

function Dragon(o) {
  const self = { pts: [], vis: 0, hs: o.hs };
  const ds = o.ds || 4,
    sc = o.W / 17;
  self.pose = (t, still) => {
    const k = still ? 1 : clamp(t / o.intro),
      e = easeOutCubic(k);
    const sh = o.sFinal + (1 - e) * o.turns * o.loop.L;
    const vis = o.len * (still ? 1 : easeOutCubic(clamp(t / (o.intro * 0.82))));
    const lift = still ? 1 : smooth((k - 0.7) / 0.3);
    const n = Math.max(2, Math.floor(vis / ds)),
      pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i * ds,
        b = o.loop.at(sh + u);
      const off =
        lift * o.neck * (1 - smooth(u / o.neckLen)) +
        o.W *
          (0.22 + 0.2 * (1 - k)) *
          Math.sin(u * 0.028 - t * 1.9) *
          smooth(u / 80);
      pts.push({
        x: b.x + b.nx * off,
        y: b.y + b.ny * off,
        bx: b.nx,
        by: b.ny,
        u,
      });
    }
    for (let i = 0; i <= n; i++) {
      const a = pts[Math.max(i - 1, 0)],
        c = pts[Math.min(i + 1, n)],
        p = pts[i];
      let fx = a.x - c.x,
        fy = a.y - c.y;
      const l = Math.hypot(fx, fy) || 1;
      fx /= l;
      fy /= l;
      let nx = fy,
        ny = -fx;
      if (nx * p.bx + ny * p.by < 0) {
        nx = -nx;
        ny = -ny;
      }
      const q = p.u / Math.max(vis, 1),
        breathe = 1 + 0.03 * Math.sin(t * 2.2 - p.u * 0.02);
      Object.assign(p, {
        fx,
        fy,
        nx,
        ny,
        hw: Math.max(
          0.9,
          o.W *
            breathe *
            (0.8 + 0.2 * smooth(p.u / 50)) *
            (1 - 0.94 * Math.pow(q, 3.1)),
        ),
      });
    }
    self.pts = pts;
    self.vis = vis;
    self.lift = lift;
    self.k = k;
    const h = pts[0];
    self.head = { x: h.x, y: h.y, fx: h.fx, fy: h.fy, nx: h.nx, ny: h.ny };
    return self;
  };
  const layer = Layer(),
    skin = Layer();
  // Once the dragon has settled its body only breathes, so it is painted a few times a second;
  // the head, the glint and everything around it stay live.
  self.draw = (ctx, t, still) => {
    const pts = self.pts,
      n = pts.length - 1;
    if (n < 3) return;
    if (!still && self.k >= 1)
      layer.draw(ctx, t, 8, (c) => self.body(c, t, still));
    else self.body(ctx, t, still);
    self.face(ctx, t, still);
  };
  self.body = (ctx, t, still) => {
    const pts = self.pts,
      n = pts.length - 1;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const edge = (p, r) => [p.x + p.nx * p.hw * r, p.y + p.ny * p.hw * r];
    const finStep = Math.max(2, Math.round((12 * sc + 3) / ds)),
      first = Math.ceil((34 * o.hs + 6) / ds);
    // tail fan
    {
      const p = pts[n];
      ctx.save();
      ctx.transform(-p.fx, -p.fy, p.nx, p.ny, p.x, p.y);
      ctx.scale(sc, sc);
      [
        [-0.95, 24, 10, "#E8451F"],
        [0.9, 22, 10, "#E8451F"],
        [-0.5, 36, 12, "#FF9A3D"],
        [0.48, 33, 12, "#FF9A3D"],
        [0, 48, 13, DR.gold],
      ].forEach(([a, len, w, c], i) => {
        ctx.save();
        ctx.rotate(a + Math.sin(t * 2.8 + i * 2) * 0.16);
        tuft(ctx, len, w, Math.sin(t * 3.6 + i) * 3);
        const g = ctx.createLinearGradient(0, 0, len, 0);
        g.addColorStop(0, DR.red);
        g.addColorStop(0.4, c);
        g.addColorStop(1, "#fff3c4");
        strokeBoth(ctx, g, 1.4 / sc);
        ctx.restore();
      });
      ctx.restore();
    }
    // dorsal fins: a jade row behind, flames in front
    const fin = (i, h, lean, fill, lw, half) => {
      const p = pts[i],
        a = pts[Math.max(0, i - half)],
        b = pts[Math.min(n, i + half)],
        ea = edge(a, 0.86),
        eb = edge(b, 0.86),
        em = edge(p, 0.9);
      const tx = em[0] + p.nx * h - p.fx * lean,
        ty = em[1] + p.ny * h - p.fy * lean;
      ctx.beginPath();
      ctx.moveTo(ea[0], ea[1]);
      ctx.quadraticCurveTo(
        em[0] + p.nx * h * 0.75 + p.fx * lean * 0.1,
        em[1] + p.ny * h * 0.75 + p.fy * lean * 0.1,
        tx,
        ty,
      );
      ctx.quadraticCurveTo(
        em[0] + p.nx * h * 0.25 - p.fx * lean * 0.55,
        em[1] + p.ny * h * 0.25 - p.fy * lean * 0.55,
        eb[0],
        eb[1],
      );
      ctx.closePath();
      if (fill === 1) {
        const g = ctx.createLinearGradient(em[0], em[1], tx, ty);
        g.addColorStop(0, "#E8451F");
        g.addColorStop(0.5, "#FF9A3D");
        g.addColorStop(1, "#FFE38A");
        strokeBoth(ctx, g, lw);
      } else strokeBoth(ctx, fill, lw);
    };
    for (
      let i = first + Math.round(finStep / 2);
      i < n - finStep;
      i += finStep
    ) {
      const p = pts[i],
        q = 1 - Math.pow(p.u / self.vis, 3);
      fin(
        i,
        (p.hw * 0.62 + 2.5 * sc) * q,
        p.hw * 0.7,
        "#128a72",
        Math.max(0.8, 1.1 * sc),
        Math.round(finStep * 0.5),
      );
    }
    for (let i = first, j = 0; i < n - finStep; i += finStep, j++) {
      const p = pts[i],
        q = 1 - Math.pow(p.u / self.vis, 3),
        big = j % 3 === 0 ? 1.28 : 1;
      fin(
        i,
        (p.hw * 0.98 + 4 * sc) * q * big +
          Math.sin(t * 5.5 - j * 0.8) * 1.3 * sc,
        (p.hw * 1.15 + Math.sin(t * 5.5 - j * 0.8) * 2 * sc) * big,
        1,
        Math.max(0.9, 1.3 * sc),
        Math.round(finStep * 0.62),
      );
    }
    // body: the ink line first, then the skin. The scales are stamped on a scratch layer that
    // only accepts paint where the body already is, which is far cheaper than a clip path.
    ribbon(ctx, pts, 0, 1, 1.8 * Math.max(0.55, sc));
    ctx.fillStyle = DR.ink;
    ctx.fill();
    skin.draw(ctx, t, Infinity, (c) => {
      ribbon(c, pts, 0, 1);
      c.fillStyle = "#b01a1a";
      c.fill();
      c.globalCompositeOperation = "source-atop";
      // scales, drawn tail to head so each row lies over the one behind it
      const rowStep = Math.max(1, Math.round((7.4 * sc) / ds)),
        set = dragonScales(),
        base = c.getTransform();
      for (
        let i = n - 1 - ((n - 1) % rowStep), row = Math.floor(i / rowStep);
        i >= 0;
        i -= rowStep, row--
      ) {
        const p = pts[i],
          rs = Math.max(1.2, p.hw * 0.36),
          k = rs / 12,
          co = -p.fx * k,
          si = -p.fy * k,
          odd = ((row % 2) + 2) % 2,
          plain = rs > 2.6 ? 0 : 5;
        const ma = base.a * co + base.c * si,
          mb = base.b * co + base.d * si,
          mc = base.c * co - base.a * si,
          md = base.d * co - base.b * si;
        for (let col = 0; col < 4; col++) {
          const r = 0.98 - col * 0.44 - odd * 0.22;
          if (r < -0.5) continue;
          const cx = p.x + p.nx * r * p.hw,
            cy = p.y + p.ny * r * p.hw,
            gold = (((row * 3 + col * 5) % 13) + 13) % 13 === 0;
          c.setTransform(
            ma,
            mb,
            mc,
            md,
            base.a * cx + base.c * cy + base.e,
            base.b * cx + base.d * cy + base.f,
          );
          c.drawImage(
            set[plain + (gold ? 4 : Math.min(3, col + odd))],
            -16,
            -16,
            32,
            32,
          );
        }
      }
      c.setTransform(base);
      c.globalCompositeOperation = "source-over";
    });
    // volume: a soft light near the spine and a shadow towards the belly
    ribbon(ctx, pts, 0.7, 0.16);
    ctx.fillStyle = "rgba(255,176,130,.22)";
    ctx.fill();
    ribbon(ctx, pts, -0.3, 0.16);
    ctx.fillStyle = "rgba(60,4,8,.3)";
    ctx.fill();
    // belly plates with jade piping
    ribbon(ctx, pts, -0.715, 0.285);
    ctx.fillStyle = "#FBE7B4";
    ctx.fill();
    ribbon(ctx, pts, -0.925, 0.075);
    ctx.fillStyle = "rgba(214,150,40,.55)";
    ctx.fill();
    ribbon(ctx, pts, -0.56, 0.06);
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(150,92,20,.9)";
    ctx.lineWidth = Math.max(0.6, 0.95 * sc);
    ctx.beginPath();
    for (let i = 1; i < n; i += Math.max(1, Math.round((6.5 * sc) / ds))) {
      const p = pts[i],
        a = edge(p, -0.46),
        b = edge(p, -0.99),
        m = edge(p, -0.74);
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(
        m[0] - p.fx * 2.6 * sc,
        m[1] - p.fy * 2.6 * sc,
        b[0],
        b[1],
      );
    }
    ctx.stroke();
    ribbon(ctx, pts, -0.43, 0.075);
    ctx.fillStyle = "#0b4f40";
    ctx.fill();
    ribbon(ctx, pts, -0.43, 0.04);
    ctx.fillStyle = "#35d6ac";
    ctx.fill();
    // legs grip the edge of the card
    (o.legs || []).forEach((frac, li) => {
      const u = frac * o.len;
      if (u > self.vis - 30) return;
      const p = pts[Math.min(n, Math.round(u / ds))];
      ctx.save();
      ctx.transform(p.fx, p.fy, -p.nx, -p.ny, p.x, p.y);
      dragonLeg(
        ctx,
        p.hw,
        t,
        li * 1.7,
        still ? 0 : 1 - smooth((self.k - 0.72) / 0.28),
      );
      ctx.restore();
    });
  };
  self.face = (ctx, t, still) => {
    const pts = self.pts,
      n = pts.length - 1;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const edge = (p, r) => [p.x + p.nx * p.hw * r, p.y + p.ny * p.hw * r],
      first = Math.ceil((34 * o.hs + 6) / ds);
    // a moving glint along the back
    if (sc > 0.6) {
      ctx.save();
      ctx.beginPath();
      for (let i = Math.min(n, first); i <= n - 4; i++) {
        const e = edge(pts[i], 0.72);
        if (i === Math.min(n, first)) ctx.moveTo(e[0], e[1]);
        else ctx.lineTo(e[0], e[1]);
      }
      ctx.setLineDash([14, 46]);
      ctx.lineDashOffset = still ? 0 : t * 34;
      ctx.strokeStyle = "rgba(255,236,200,.6)";
      ctx.lineWidth = 1.7;
      ctx.stroke();
      ctx.restore();
    }
    // head
    const h = pts[0],
      hs = o.hs;
    const since = t - o.intro,
      roar = still ? 0 : Math.exp(-Math.pow((since - 0.25) / 0.5, 2)) * 0.42;
    const jaw = 0.12 + 0.05 * Math.sin(t * 1.7) + roar,
      fire =
        still || !o.fire
          ? 0
          : clamp(since / 0.18) * clamp((0.95 - since) / 0.45);
    const bt = (t + 1.3) % 4.2,
      blink = still ? 0 : bt < 0.14 ? Math.sin((bt / 0.14) * Math.PI) : 0;
    ctx.save();
    ctx.transform(h.fx, h.fy, -h.nx, -h.ny, h.x, h.y);
    ctx.rotate(self.lift * 0.2 + Math.sin(t * 1.3) * 0.03);
    ctx.scale(hs, hs);
    ctx.translate(2, 0);
    dragonHead(ctx, t, jaw, blink, fire);
    ctx.restore();
  };
  return self;
}

function xiangyun(ctx, x, y, s, t, alpha, flip = 1) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 0.8 + x) * 2.2);
  ctx.scale(s * flip, s);
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-36, 9);
  ctx.bezierCurveTo(-44, -7, -24, -16, -15, -7);
  ctx.bezierCurveTo(-13, -25, 13, -27, 15, -8);
  ctx.bezierCurveTo(27, -17, 45, -5, 36, 9);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -24, 0, 10);
  g.addColorStop(0, "#fff8e2");
  g.addColorStop(1, "#f6d98f");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = DR.goldDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  for (const [cx, cy, r] of [
    [-19, -3, 6.5],
    [1, -10, 8.5],
    [22, -2, 6.5],
  ]) {
    ctx.beginPath();
    for (let a = 0; a < TAU * 1.55; a += 0.22) {
      const rr = r * (1 - a / (TAU * 1.75));
      const px = cx + Math.cos(a + 1.2) * rr,
        py = cy + Math.sin(a + 1.2) * rr;
      if (a) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.strokeStyle = DR.goldDark;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(36, 9);
  ctx.quadraticCurveTo(54, 11, 62, 2);
  ctx.moveTo(-36, 9);
  ctx.quadraticCurveTo(-50, 12, -58, 6);
  ctx.strokeStyle = DR.goldDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function lantern(ctx, x, y, s, swing, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(swing);
  ctx.scale(s, s);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 22);
  ctx.strokeStyle = "#e7c36a";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  glow(ctx, 0, 42, 44, `rgba(255,170,70,${0.3 + 0.08 * Math.sin(t * 5)})`);
  ctx.fillStyle = DR.goldDark;
  ctx.fillRect(-7, 21, 14, 4);
  ctx.fillRect(-7, 59, 14, 4);
  ctx.beginPath();
  ctx.ellipse(0, 42, 16, 18, 0, 0, TAU);
  const g = ctx.createRadialGradient(-3, 38, 2, 0, 42, 19);
  g.addColorStop(0, "#ffb05a");
  g.addColorStop(0.45, "#ee3a25");
  g.addColorStop(1, "#a11217");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#5c0d10";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,214,120,.85)";
  ctx.lineWidth = 1;
  for (const rx of [5.5, 11]) {
    ctx.beginPath();
    ctx.ellipse(0, 42, rx, 18, 0, 0, TAU);
    ctx.stroke();
  }
  for (const dx of [-4, 0, 4]) {
    ctx.beginPath();
    ctx.moveTo(dx, 63);
    ctx.quadraticCurveTo(
      dx + Math.sin(t * 2 + dx) * 2.5,
      72,
      dx * 1.4 + swing * -30,
      82,
    );
    ctx.strokeStyle = "#f2b63c";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();
}

export default function create(CARD, AVATAR) {
  return {
    name: "Dragão Imperial",
    reach: { top: 122, side: 72, bottom: 72 },
    mat: ["#2a0a10", "#12060f"],
    theme: {
      "--card-bg":
        "linear-gradient(165deg,#6b1012 0%,#3a0a14 52%,#1a0a24 100%)",
      "--card-banner": "linear-gradient(115deg,#7d0f14,#d9261c 52%,#f2b63c)",
      "--card-avatar": "#2b0b0e",
      "--card-avatar-ring": "#4a0e12",
      "--card-button": "#b3161b",
      "--card-border": "rgba(246,196,69,.45)",
    },
    init() {
      const pad = 25;
      this.loop = rectLoop(
        -pad,
        -pad,
        CARD.w + pad * 2,
        CARD.h + pad * 2,
        CARD.r + pad,
      );
      this.dragon = Dragon({
        loop: this.loop,
        len: this.loop.L * 0.8,
        W: 17,
        hs: 1.08,
        sFinal: 214,
        turns: 1.4,
        intro: 3.0,
        neck: 17,
        neckLen: 150,
        legs: [0.15, 0.41, 0.6, 0.76],
        fire: true,
      });
      const ring = circleLoop(77, 77, AVATAR.r + 8);
      this.mini = Dragon({
        loop: ring,
        len: ring.L * 0.84,
        W: 6.4,
        hs: 0.37,
        sFinal: 70,
        turns: 1.3,
        intro: 2.3,
        neck: 4,
        neckLen: 40,
        ds: 2,
        legs: [0.24, 0.62],
      });
      this.sparks = Particles();
      this.dust = [];
      const r = rng(7);
      for (let i = 0; i < 30; i++)
        this.dust.push({
          x: r() * CARD.w,
          y: r() * CARD.h,
          s: 0.6 + r() * 1.8,
          v: 6 + r() * 12,
          p: r() * TAU,
        });
      this.rand = rng(99);
      this.burst = false;
    },
    reset() {
      this.sparks.clear();
      this.burst = false;
      this.rand = rng(99);
    },
    update(dt, t, still) {
      if (still) return;
      const d = this.dragon.pose(t, false),
        h = d.head,
        R = this.rand;
      if (t < 3.0 && d.vis > 20)
        for (let i = 0; i < 2; i++)
          this.sparks.add({
            x: h.x + (R() - 0.5) * 16,
            y: h.y + (R() - 0.5) * 16,
            vx: -h.fx * (30 + R() * 60) + (R() - 0.5) * 40,
            vy: -h.fy * (30 + R() * 60) + (R() - 0.5) * 40,
            life: 0.5 + R() * 0.6,
            size: 1 + R() * 2.2,
            drag: 1.5,
            color: R() < 0.3 ? "#fff3c4" : DR.gold,
          });
      if (!this.burst && t >= 3.0) {
        this.burst = true;
        for (let i = 0; i < 46; i++) {
          const a = R() * TAU,
            v = 60 + R() * 150;
          this.sparks.add({
            x: h.x + h.fx * 40,
            y: h.y + h.fy * 40,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            life: 0.6 + R() * 0.9,
            size: 1 + R() * 2.6,
            drag: 2.2,
            g: 40,
            color: R() < 0.35 ? "#fff3c4" : R() < 0.5 ? "#FFA63D" : DR.gold,
          });
        }
      }
      if (t > 3.2 && R() < dt * 5) {
        const px = h.x + h.fx * 130,
          py = h.y + h.fy * 130 - 12;
        this.sparks.add({
          x: px + (R() - 0.5) * 10,
          y: py,
          vx: (R() - 0.5) * 14,
          vy: -18 - R() * 22,
          life: 0.9 + R() * 0.8,
          size: 0.8 + R() * 1.6,
          color: R() < 0.5 ? "#fff3c4" : DR.gold,
        });
      }
      this.sparks.update(dt);
    },
    drawFrame(ctx, t, still) {
      const a = still ? 1 : smooth(t / 1.4);
      xiangyun(ctx, -62, 52, 0.95, t, a);
      xiangyun(ctx, CARD.w + 66, CARD.h - 84, 1.05, t + 2, a, -1);
      xiangyun(ctx, -70, CARD.h - 132, 0.7, t + 4, a * 0.92);
      xiangyun(ctx, CARD.w + 74, 196, 0.66, t + 1, a * 0.9, -1);
      xiangyun(ctx, 44, CARD.h + 82, 0.6, t + 3, a * 0.85);
      xiangyun(ctx, 40, -84, 0.62, t + 5, a * 0.85, -1);
      const d = this.dragon.pose(still ? 999 : t, still);
      d.draw(ctx, still ? 0.6 : t, still);
      const h = d.head;
      // the flaming pearl the dragon keeps in sight
      const pa = still ? 1 : smooth((t - 2.5) / 0.7);
      if (pa > 0) {
        const reach = 96 * this.dragon.hs + 26,
          px = h.x + h.fx * reach + h.nx * 6,
          py = h.y + h.fy * reach + h.ny * 6 + Math.sin(t * 2) * 3;
        ctx.save();
        ctx.globalAlpha = pa;
        glow(ctx, px, py, 26, "rgba(255,210,110,.75)");
        ctx.beginPath();
        ctx.arc(px, py, 7.5, 0, TAU);
        const g = ctx.createRadialGradient(px - 2, py - 2, 1, px, py, 8);
        g.addColorStop(0, "#fff");
        g.addColorStop(0.5, "#ffe7a3");
        g.addColorStop(1, "#f2a52c");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = DR.goldDark;
        ctx.lineWidth = 1;
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.translate(px, py - 5);
          ctx.rotate(-Math.PI / 2 + (i - 1) * 0.5 + Math.sin(t * 5 + i) * 0.15);
          tuft(ctx, 13 + Math.sin(t * 7 + i) * 2, 6);
          ctx.fillStyle = i === 1 ? "#ffd166" : "#ff8a3d";
          ctx.globalAlpha = pa * 0.9;
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }
      // arrival: a ring of light where the dragon settles
      if (!still) {
        const k = (t - 3.0) / 0.9;
        if (k > 0 && k < 1) {
          ctx.save();
          ctx.globalAlpha = (1 - k) * 0.8;
          ctx.strokeStyle = "#ffe08a";
          ctx.lineWidth = 5 * (1 - k) + 1;
          ctx.beginPath();
          ctx.arc(
            h.x + h.fx * 30,
            h.y + h.fy * 30,
            16 + easeOutCubic(k) * 96,
            0,
            TAU,
          );
          ctx.stroke();
          ctx.restore();
        }
      }
      for (const p of this.sparks.list) {
        const k = 1 - p.age / p.life;
        ctx.globalAlpha = k;
        glow(ctx, p.x, p.y, p.size * 3, "rgba(255,200,90,.5)");
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * k + 0.3, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    drawAvatar(ctx, t, still) {
      const a = still ? 1 : smooth(t / 0.8);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(77, 77, AVATAR.r + 3, 0, TAU);
      ctx.strokeStyle = DR.goldDark;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = DR.gold;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
      this.mini.pose(still ? 999 : t, still).draw(ctx, still ? 0.6 : t, still);
    },
    drawEffect(ctx, t, still) {
      // warm light sweeping the card on arrival
      if (!still) {
        const k = (t - 0.15) / 1.3;
        if (k > 0 && k < 1) {
          const x = lerp(-CARD.w * 0.6, CARD.w * 1.4, easeInOut(k));
          const g = ctx.createLinearGradient(x - 120, 0, x + 120, 160);
          g.addColorStop(0, "rgba(255,210,120,0)");
          g.addColorStop(
            0.5,
            `rgba(255,214,130,${0.34 * Math.sin(k * Math.PI)})`,
          );
          g.addColorStop(1, "rgba(255,210,120,0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, CARD.w, CARD.h);
        }
      }
      for (const d of this.dust) {
        const y = (((d.y - t * d.v) % CARD.h) + CARD.h) % CARD.h,
          tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.6 + d.p));
        ctx.globalAlpha = tw * (still ? 0.7 : smooth(t / 1.5)) * 0.9;
        glow(
          ctx,
          d.x + Math.sin(t * 0.7 + d.p) * 6,
          y,
          d.s * 3.2,
          "rgba(255,214,120,.9)",
        );
      }
      ctx.globalAlpha = 1;
      const drop = still ? 1 : easeOutBack(clamp((t - 0.5) / 0.9)),
        sw = still
          ? 0.04
          : Math.sin(t * 3.2) * 0.3 * Math.exp(-t * 0.55) +
            Math.sin(t * 1.2) * 0.05;
      lantern(ctx, CARD.w - 34, -92 + drop * 92, 0.82, sw, t);
      lantern(
        ctx,
        CARD.w - 74,
        -112 + (still ? 1 : easeOutBack(clamp((t - 0.72) / 0.9))) * 104,
        0.6,
        -sw * 1.2,
        t + 1,
      );
    },
  };
}
