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
