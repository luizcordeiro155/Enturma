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
export function glow(ctx, x, y, r, inner, outer = "rgba(0,0,0,0)") {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
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
