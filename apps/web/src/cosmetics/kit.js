// Generated from the cosmetics prototype by tools/export-app.mjs. Edit the prototype, then export again.
// Drawing helpers shared by every profile cosmetic pack.
// ---------- small maths ----------
export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeOutBack = (t) => {
  t = clamp(t);
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
export const easeInOut = (t) => {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
// Deterministic random, so a frame always draws the same art.
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- geometry of the card ----------

// A closed path walked clockwise; `n` is the normal pointing away from the card.
export function rectLoop(x, y, w, h, r) {
  const segs = [];
  const line = (x0, y0, x1, y1) => {
    const len = Math.hypot(x1 - x0, y1 - y0),
      tx = (x1 - x0) / len,
      ty = (y1 - y0) / len;
    segs.push({ len, fn: (d) => ({ x: x0 + tx * d, y: y0 + ty * d, tx, ty }) });
  };
  const arc = (cx, cy, a0) =>
    segs.push({
      len: (r * Math.PI) / 2,
      fn: (d) => {
        const a = a0 + d / r;
        return {
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          tx: -Math.sin(a),
          ty: Math.cos(a),
        };
      },
    });
  line(x + r, y, x + w - r, y);
  arc(x + w - r, y + r, -Math.PI / 2);
  line(x + w, y + r, x + w, y + h - r);
  arc(x + w - r, y + h - r, 0);
  line(x + w - r, y + h, x + r, y + h);
  arc(x + r, y + h - r, Math.PI / 2);
  line(x, y + h - r, x, y + r);
  arc(x + r, y + r, Math.PI);
  const L = segs.reduce((a, s) => a + s.len, 0);
  return {
    L,
    at(s) {
      s = ((s % L) + L) % L;
      for (const g of segs) {
        if (s <= g.len) {
          const p = g.fn(s);
          p.nx = p.ty;
          p.ny = -p.tx;
          return p;
        }
        s -= g.len;
      }
      return this.at(0);
    },
  };
}
export function circleLoop(cx, cy, r) {
  const L = TAU * r;
  return {
    L,
    at(s) {
      const a = -Math.PI / 2 + s / r;
      return {
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        tx: -Math.sin(a),
        ty: Math.cos(a),
        nx: Math.cos(a),
        ny: Math.sin(a),
      };
    },
  };
}

// ---------- particles ----------
export function Particles() {
  const list = [];
  return {
    list,
    add(p) {
      list.push(
        Object.assign(
          {
            age: 0,
            life: 1,
            vx: 0,
            vy: 0,
            g: 0,
            drag: 0,
            rot: 0,
            vr: 0,
            size: 2,
          },
          p,
        ),
      );
    },
    update(dt) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.age += dt;
        if (p.age >= p.life) {
          list.splice(i, 1);
          continue;
        }
        p.vy += p.g * dt;
        p.vx *= 1 - p.drag * dt;
        p.vy *= 1 - p.drag * dt;
        if (p.sway) p.x += Math.sin(p.age * p.swayF + p.phase) * p.sway * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
      }
    },
    clear() {
      list.length = 0;
    },
  };
}

// ---------- drawing helpers ----------
export function pathFrom(ctx, pts, close = true) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  if (close) ctx.closePath();
}
// A soft light. Painted once per colour and stamped after that: a gradient per call is what
// makes canvas art slow.
export const glowSprites = new Map();
export function glow(ctx, x, y, r, inner, outer) {
  if (r <= 0) return;
  if (outer !== undefined) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    return;
  }
  const m =
      /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.e+-]+)\s*\)$/.exec(
        inner,
      ),
    key = m ? m[1] + "," + m[2] + "," + m[3] : inner,
    alpha = m ? +m[4] : 1;
  if (!(alpha > 0.004)) return;
  let s = glowSprites.get(key);
  if (!s) {
    s = document.createElement("canvas");
    s.width = s.height = 64;
    const c = s.getContext("2d"),
      g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, m ? "rgb(" + key + ")" : inner);
    g.addColorStop(1, m ? "rgba(" + key + ",0)" : "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    glowSprites.set(key, s);
  }
  const a = ctx.globalAlpha;
  ctx.globalAlpha = a * Math.min(1, alpha);
  ctx.drawImage(s, x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = a;
}
// Art that hardly moves is painted into a layer of its own a few times a second and stamped in
// between, so a frame at rest costs one picture instead of thousands of strokes.
export function Layer() {
  let canvas = null,
    at = -1e9,
    mark = "";
  return {
    draw(ctx, t, fps, paint) {
      const m = ctx.getTransform(),
        w = ctx.canvas.width,
        h = ctx.canvas.height,
        key =
          w +
          "x" +
          h +
          ":" +
          m.a.toFixed(3) +
          ":" +
          m.e.toFixed(1) +
          ":" +
          m.f.toFixed(1);
      if (!canvas) canvas = document.createElement("canvas");
      if (key !== mark || t < at || t - at >= 1 / fps) {
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const c = canvas.getContext("2d");
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, w, h);
        c.setTransform(m);
        paint(c);
        mark = key;
        at = t;
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    },
  };
}
// Art that repeats many times is painted once and stamped.
export function sprite(size, draw) {
  const c = document.createElement("canvas");
  c.width = c.height = size * 2;
  const x = c.getContext("2d");
  x.scale(2, 2);
  x.translate(size / 2, size / 2);
  draw(x);
  return c;
}
export function stamp(ctx, spr, x, y, s, rot, sy = 1) {
  const w = spr.width / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s * sy);
  ctx.drawImage(spr, -w / 2, -w / 2, w, w);
  ctx.restore();
}
// Ink outline over a fill, the look every pack shares.
export const inked = (ctx, fill, lw = 1.6, ink = "#1c0d26") => {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = ink;
  ctx.lineJoin = "round";
  ctx.stroke();
};
export const bounceOut = (t) => {
  t = clamp(t);
  const n = 7.5625,
    d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};
// A flame / tuft shape from (0,0) to (len,0), fat near the root.
export function tuft(ctx, len, wide, bend = 0) {
  ctx.beginPath();
  ctx.moveTo(0, -wide * 0.5);
  ctx.bezierCurveTo(
    len * 0.35,
    -wide * 0.9 + bend,
    len * 0.7,
    -wide * 0.25 + bend,
    len,
    bend,
  );
  ctx.bezierCurveTo(
    len * 0.62,
    wide * 0.5 + bend * 0.6,
    len * 0.3,
    wide * 0.75,
    0,
    wide * 0.5,
  );
  ctx.closePath();
}

// ---------- shapes and motion the packs share ----------
export const pop = (t, at, dur = 0.5) => easeOutBack(clamp((t - at) / dur));
export const fade = (t, at, dur = 0.6) => smooth((t - at) / dur);
export function grad(ctx, x0, y0, x1, y1, ...stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((c, i) =>
    g.addColorStop(stops.length > 1 ? i / (stops.length - 1) : 0, c),
  );
  return g;
}
export function rgrad(ctx, x, y, r, ...stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach((c, i) =>
    g.addColorStop(stops.length > 1 ? i / (stops.length - 1) : 0, c),
  );
  return g;
}
export function starPath(ctx, r, n = 5, inner = 0.45, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n,
      q = i % 2 ? r * inner : r;
    ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q);
  }
  ctx.closePath();
}
export function heartPath(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.9);
  ctx.bezierCurveTo(-s * 1.3, s * 0.05, -s * 0.75, -s * 0.95, 0, -s * 0.3);
  ctx.bezierCurveTo(s * 0.75, -s * 0.95, s * 1.3, s * 0.05, 0, s * 0.9);
  ctx.closePath();
}
export function leafPath(ctx, len, wide) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -wide, len, 0);
  ctx.quadraticCurveTo(len * 0.45, wide, 0, 0);
  ctx.closePath();
}
export function dropPath(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.6);
  ctx.bezierCurveTo(r * 1.1, -r * 0.2, r, r, 0, r);
  ctx.bezierCurveTo(-r, r, -r * 1.1, -r * 0.2, 0, -r * 1.6);
  ctx.closePath();
}
export function sparkPath(ctx, r, thin = 0.22) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4,
      q = i % 2 ? r * thin : r;
    ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q);
  }
  ctx.closePath();
}
export function gearPath(ctx, r, teeth = 8, depth = 0.22) {
  ctx.beginPath();
  const n = teeth * 4;
  for (let i = 0; i < n; i++) {
    const a = ((i - 0.5) / n) * TAU,
      q = i % 4 < 2 ? r : r * (1 - depth);
    ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q);
  }
  ctx.closePath();
}
export function cloudPath(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(-s * 1.1, s * 0.3);
  ctx.bezierCurveTo(
    -s * 1.55,
    -s * 0.2,
    -s * 0.85,
    -s * 0.62,
    -s * 0.5,
    -s * 0.3,
  );
  ctx.bezierCurveTo(-s * 0.4, -s, s * 0.4, -s, s * 0.5, -s * 0.35);
  ctx.bezierCurveTo(s * 0.9, -s * 0.7, s * 1.55, -s * 0.2, s * 1.1, s * 0.3);
  ctx.closePath();
}
// A blob through points, rounded: the quickest way to a hand-drawn silhouette.
export function blobPath(ctx, pts, close = true) {
  const n = pts.length;
  ctx.beginPath();
  if (close) {
    const a = pts[n - 1],
      b = pts[0];
    ctx.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i],
        q = pts[(i + 1) % n];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const p = pts[i],
        q = pts[i + 1];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
}
// A pair of cartoon eyes around (0,0): `gap` apart, looking by `look`, shut when `blink`.
export function eyes(
  ctx,
  gap,
  r,
  look = 0,
  blink = false,
  iris = "#2a1a12",
  white = "#fff",
) {
  for (const sx of [-1, 1]) {
    const x = (sx * gap) / 2;
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(x - r, 0);
      ctx.quadraticCurveTo(x, r * 0.7, x + r, 0);
      ctx.strokeStyle = iris;
      ctx.lineWidth = Math.max(1, r * 0.34);
      ctx.lineCap = "round";
      ctx.stroke();
      continue;
    }
    if (white) {
      ctx.beginPath();
      ctx.ellipse(x, 0, r, r * 1.12, 0, 0, TAU);
      ctx.fillStyle = white;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x + look * r * 0.35, r * 0.08, r * (white ? 0.62 : 1), 0, TAU);
    ctx.fillStyle = iris;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + look * r * 0.35 + r * 0.24, -r * 0.26, r * 0.24, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }
}
export const blinking = (t, every = 3.6, shift = 0) =>
  (t + shift) % every < 0.13;
// The ring every avatar decoration starts from: [colour, width, dash?] from the outside in.
export function ringBase(ctx, cx, cy, r, layers, t = 0) {
  for (const [color, width, dash, speed] of layers) {
    ctx.save();
    if (dash) {
      ctx.setLineDash(dash);
      ctx.lineDashOffset = -t * (speed || 0);
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  }
}

// A line that runs beside the card's edge from s0, with things growing from it.
export function Strand(loop, s0, len, dir, seed, o = {}) {
  const R = rng(seed),
    n = Math.max(2, Math.ceil(len / 5)),
    pts = [],
    bits = [],
    off = o.off === undefined ? 6 : o.off,
    wave = o.wave === undefined ? 5 : o.wave;
  for (let i = 0; i <= n; i++) {
    const u = i / n,
      p = loop.at(s0 + dir * u * len),
      d =
        off +
        Math.sin(u * (o.freq || 19) + seed) * wave +
        Math.sin(u * 47 + seed) * wave * 0.3;
    pts.push({
      x: p.x + p.nx * d,
      y: p.y + p.ny * d,
      nx: p.nx,
      ny: p.ny,
      tx: p.tx * dir,
      ty: p.ty * dir,
      u,
    });
  }
  for (
    let u = o.from === undefined ? 0.08 : o.from;
    u < (o.to === undefined ? 0.97 : o.to);
    u += (o.gap || 0.07) * (0.75 + R() * 0.6)
  ) {
    const p = pts[Math.round(u * n)],
      out = R() < (o.outward === undefined ? 0.75 : o.outward) ? 1 : -1;
    bits.push({
      u,
      x: p.x,
      y: p.y,
      nx: p.nx,
      ny: p.ny,
      tx: p.tx,
      ty: p.ty,
      a: Math.atan2(p.ny * out, p.nx * out),
      out,
      s:
        (o.size || 12) *
        (0.7 + R() * 0.6) *
        lerp(1, o.taper === undefined ? 0.7 : o.taper, u),
      kind: R(),
      ph: R() * TAU,
      i: bits.length,
    });
  }
  return { pts, n, bits };
}
export function strandLine(ctx, v, g, layers) {
  const last = Math.min(v.n, Math.floor(clamp(g) * v.n));
  if (last < 1) return;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [color, width, dash] of layers) {
    ctx.beginPath();
    for (let i = 0; i <= last; i++) {
      const p = v.pts[i];
      if (i) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    }
    ctx.setLineDash(dash || []);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  ctx.setLineDash([]);
}
// Calls draw(b, k) at each thing on the strand that has grown; k runs 0 to 1 with a little overshoot.
export function strandBits(ctx, v, t, when, draw, dur = 0.45) {
  for (const b of v.bits) {
    const k = easeOutBack(clamp((t - when(b.u)) / dur));
    if (k <= 0) continue;
    ctx.save();
    ctx.translate(b.x, b.y);
    draw(b, k);
    ctx.restore();
  }
}
// Things that fall (v > 0) or rise (v < 0) across an area for ever. No state: where each one is depends only on time.
export function Drift(n, seed, o) {
  const R = rng(seed),
    list = [];
  for (let i = 0; i < n; i++)
    list.push({
      x: R(),
      y: R(),
      v: lerp(o.v[0], o.v[1], R()),
      s: lerp(o.s[0], o.s[1], R()),
      ph: R() * TAU,
      sway: (o.sway === undefined ? 10 : o.sway) * (0.5 + R()),
      f: 0.6 + R() * 1.4,
      spin: (R() - 0.5) * (o.spin === undefined ? 2 : o.spin),
      k: R(),
      i,
    });
  return {
    list,
    each(t, w, h, fn) {
      for (const p of list) {
        const span = h + 60,
          y = ((((p.y * span + t * p.v) % span) + span) % span) - 30;
        fn(
          p,
          p.x * w + Math.sin(t * p.f + p.ph) * p.sway,
          y,
          p.ph + t * p.spin,
        );
      }
    },
  };
}
// Paints `paint` straight away while the entrance runs, and through a slow layer once the scene has settled.
export function settle(self, key, ctx, t, still, after, fps, paint) {
  if (still || t <= after) paint(ctx);
  else (self[key] || (self[key] = Layer())).draw(ctx, t, fps, paint);
}
// Lights that twinkle around the card: [x, y, size, phase, speed].
export function twinkles(n, seed, w, h, near = 30, far = 80) {
  const R = rng(seed),
    list = [];
  for (let i = 0; i < n; i++) {
    const a = R() * TAU,
      d = near + R() * (far - near);
    list.push({
      x:
        w / 2 +
        Math.cos(a) * (w / 2 + d) * (Math.abs(Math.cos(a)) > 0.6 ? 1 : 0.92),
      y: h / 2 + Math.sin(a) * (h / 2 + d),
      s: 1.2 + R() * 2.6,
      ph: R() * TAU,
      f: 1.4 + R() * 2.4,
    });
  }
  return list;
}

// The path around the card that frames follow, `pad` away from it, with the places a pack needs:
// where each side and corner starts, clockwise from the top-left.
export function frameLoop(card, pad) {
  const r = card.r + pad,
    top = card.w + pad * 2 - r * 2,
    side = card.h + pad * 2 - r * 2,
    arc = (r * Math.PI) / 2,
    loop = rectLoop(-pad, -pad, card.w + pad * 2, card.h + pad * 2, r);
  loop.m = {
    top,
    side,
    arc,
    tr: top,
    right: top + arc,
    br: top + arc + side,
    bottom: top + arc * 2 + side,
    bl: top * 2 + arc * 2 + side,
    left: top * 2 + arc * 3 + side,
    tl: top * 2 + arc * 3 + side * 2,
  };
  return loop;
}
// A paw print around (0,0), toes up.
export function pawPrint(ctx, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.25, s * 0.55, s * 0.45, 0, 0, TAU);
  ctx.fill();
  for (const [x, y, r] of [
    [-0.62, -0.28, 0.2],
    [-0.24, -0.62, 0.22],
    [0.24, -0.62, 0.22],
    [0.62, -0.28, 0.2],
  ]) {
    ctx.beginPath();
    ctx.ellipse(x * s, y * s, r * s, r * s * 1.25, x * 0.5, 0, TAU);
    ctx.fill();
  }
}
// A bunny sitting on (0,0), about 40 wide and 62 tall with the ears. o: fur, shade, inner, ink, blink, look, twitch (-1..1), acc ("scarf" | "bow" | "none"), accColor, hold ("carrot" | "egg" | "none").
export function bunny(ctx, t, o) {
  const ink = o.ink || "#3b2a3a",
    fur = o.fur || "#fff",
    shade = o.shade || "#e6dfee",
    inner = o.inner || "#ffb3c9",
    tw = o.twitch || 0;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // tail and body
  ctx.beginPath();
  ctx.arc(13, -7, 5.5, 0, TAU);
  inked(ctx, fur, 1.4, ink);
  blobPath(ctx, [
    [-13, 0],
    [-16, -12],
    [-10, -24],
    [10, -24],
    [16, -12],
    [13, 0],
  ]);
  inked(ctx, grad(ctx, 0, -24, 0, 0, fur, shade), 1.6, ink);
  ctx.beginPath();
  ctx.ellipse(0, -9, 7.5, 8.5, 0, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.fill();
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * 8, -1.5, 5.6, 3.4, 0, 0, TAU);
    inked(ctx, fur, 1.3, ink);
  }
  ctx.save();
  ctx.translate(0, -31);
  ctx.rotate((o.look || 0) * 0.07);
  // ears: the right one folds a little when it twitches
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * 7, -9);
    ctx.rotate(sx * (0.16 + (sx > 0 ? tw * 0.22 : -tw * 0.06)));
    ctx.beginPath();
    ctx.ellipse(0, -14, 5.4, 15, 0, 0, TAU);
    inked(ctx, fur, 1.6, ink);
    ctx.beginPath();
    ctx.ellipse(0, -13, 2.6, 10.5, 0, 0, TAU);
    ctx.fillStyle = inner;
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 13.5, 0, 0, TAU);
  inked(ctx, grad(ctx, 0, -13, 0, 13, fur, shade), 1.6, ink);
  ctx.fillStyle = "rgba(255,143,181,.5)";
  ctx.beginPath();
  ctx.ellipse(-10.5, 4.5, 3.4, 2.2, 0, 0, TAU);
  ctx.ellipse(10.5, 4.5, 3.4, 2.2, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(0, -0.5);
  eyes(ctx, 14, 2.9, o.look || 0, o.blink, "#2a1a2a", null);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-1.8, 4);
  ctx.lineTo(1.8, 4);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fillStyle = "#ff7d9c";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.quadraticCurveTo(-1, 8.6, -3.6, 7.8);
  ctx.moveTo(0, 6);
  ctx.quadraticCurveTo(1, 8.6, 3.6, 7.8);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
  const ac = o.accColor || "#5aa9e6";
  if (o.acc === "scarf") {
    ctx.beginPath();
    ctx.moveTo(-12, -22);
    ctx.quadraticCurveTo(0, -16, 12, -22);
    ctx.lineTo(11, -17.5);
    ctx.quadraticCurveTo(0, -11.5, -11, -17.5);
    ctx.closePath();
    inked(ctx, ac, 1.3, ink);
    ctx.beginPath();
    ctx.moveTo(6, -18);
    ctx.lineTo(10 + Math.sin(t * 2.4) * 1.2, -7);
    ctx.lineTo(4.5 + Math.sin(t * 2.4) * 1.2, -8);
    ctx.closePath();
    inked(ctx, ac, 1.3, ink);
  }
  if (o.acc === "bow") {
    ctx.save();
    ctx.translate(9, -43);
    ctx.rotate(0.3);
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(sx * 9, -8, sx * 10, 0);
      ctx.quadraticCurveTo(sx * 9, 7, 0, 0);
      ctx.closePath();
      inked(ctx, ac, 1.3, ink);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 2.6, 0, TAU);
    inked(ctx, "#fff", 1.1, ink);
    ctx.restore();
  }
  if (o.hold === "carrot") {
    ctx.save();
    ctx.translate(-7, -9);
    ctx.rotate(-0.5 + Math.sin(t * 6) * (o.nibble ? 0.06 : 0));
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.quadraticCurveTo(5, -8, 1, 8);
    ctx.quadraticCurveTo(-4, -6, 0, -11);
    ctx.closePath();
    inked(ctx, grad(ctx, -3, -10, 3, 8, "#ffa23d", "#f2681f"), 1.2, ink);
    ctx.strokeStyle = "#4f9a3a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(-3, -17);
    ctx.moveTo(0, -11);
    ctx.lineTo(1, -18);
    ctx.moveTo(0, -11);
    ctx.lineTo(4, -16);
    ctx.stroke();
    ctx.restore();
  }
  if (o.hold === "egg") {
    ctx.save();
    ctx.translate(-7, -8);
    ctx.rotate(-0.2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.4, 7, 0, 0, TAU);
    inked(ctx, grad(ctx, 0, -7, 0, 7, "#ffe27a", "#ff9db5"), 1.2, ink);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, -1);
    ctx.lineTo(-2.5, 1.5);
    ctx.lineTo(0, -1);
    ctx.lineTo(2.5, 1.5);
    ctx.lineTo(5, -1);
    ctx.stroke();
    ctx.restore();
  }
}

// A simple flower around (0,0): n round petals and a centre.
export function daisy(ctx, r, n, petal, centre, ink) {
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.rotate((i * TAU) / n);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.62, r * 0.3, r * 0.44, 0, 0, TAU);
    ctx.fillStyle = petal;
    ctx.fill();
    if (ink) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(0.7, r * 0.09);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, TAU);
  ctx.fillStyle = centre;
  ctx.fill();
  if (ink) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(0.7, r * 0.09);
    ctx.stroke();
  }
}
// A clover: three heart leaves on a short stem, from (0,0) upwards.
export function clover(
  ctx,
  s,
  light = "#7bd389",
  dark = "#3f9a55",
  ink = "#1f4a2a",
) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.2, -s * 0.5, 0, -s * 0.9);
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1, s * 0.16);
  ctx.lineCap = "round";
  ctx.stroke();
  for (const a of [-1.15, 0, 1.15]) {
    ctx.save();
    ctx.translate(0, -s * 0.9);
    ctx.rotate(a);
    ctx.translate(0, -s * 0.42);
    ctx.rotate(Math.PI);
    heartPath(ctx, s * 0.36);
    ctx.fillStyle = a ? dark : light;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(0.7, s * 0.08);
    ctx.stroke();
    ctx.restore();
  }
}
// An egg around (0,0), painted one of several ways. cols: [base, band, dot].
export function paintedEgg(ctx, r, kind, cols, ink = "#3b2a3a") {
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.25);
    ctx.bezierCurveTo(r * 0.95, -r * 1.2, r * 1.05, r, 0, r);
    ctx.bezierCurveTo(-r * 1.05, r, -r * 0.95, -r * 1.2, 0, -r * 1.25);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = grad(ctx, -r, -r, r, r, cols[0], cols[0], cols[1]);
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  ctx.lineWidth = r * 0.22;
  ctx.strokeStyle = cols[1];
  ctx.fillStyle = cols[2];
  if (kind % 3 === 0) {
    for (const y of [-0.45, 0.25]) {
      ctx.beginPath();
      for (let x = -1.2; x <= 1.21; x += 0.3)
        ctx.lineTo(x * r, y * r + (Math.round(x / 0.3) % 2 ? -0.16 : 0.16) * r);
      ctx.stroke();
    }
  } else if (kind % 3 === 1) {
    ctx.beginPath();
    ctx.moveTo(-r * 1.2, -r * 0.1);
    ctx.lineTo(r * 1.2, -r * 0.1);
    ctx.stroke();
    for (const [x, y] of [
      [-0.45, -0.65],
      [0.4, -0.6],
      [-0.5, 0.5],
      [0.45, 0.5],
      [0, 0.15 - 0.9],
      [0, 0.6],
    ]) {
      ctx.beginPath();
      ctx.arc(x * r, y * r, r * 0.13, 0, TAU);
      ctx.fill();
    }
  } else {
    for (const y of [-0.7, -0.15, 0.4]) {
      ctx.beginPath();
      ctx.moveTo(-r * 1.2, y * r + r * 0.25);
      ctx.quadraticCurveTo(0, y * r - r * 0.25, r * 1.2, y * r + r * 0.25);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.55, r * 0.14, r * 0.3, 0.5, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fill();
  shape();
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.stroke();
}

// The prototype's card, tinted the way the app tints a profile with the pack's two colours.
export const cardTheme = (a, b) => ({
  "--card-bg": `linear-gradient(rgba(8,9,13,.52),rgba(8,9,13,.64)),linear-gradient(180deg,${a},${b})`,
  "--card-banner": `linear-gradient(120deg,${a},${b})`,
  "--card-avatar": "#14151c",
  "--card-avatar-ring": "#0b0c12",
  "--card-button": a,
  "--card-border": "rgba(255,255,255,.16)",
});
