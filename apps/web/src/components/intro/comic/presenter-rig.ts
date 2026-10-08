const clamp = (n: number, low: number, high: number) =>
  Math.max(low, Math.min(high, n));
const rotate = (x: number, y: number, angle: number) => ({
  x:
    x * Math.cos((angle * Math.PI) / 180) -
    y * Math.sin((angle * Math.PI) / 180),
  y:
    x * Math.sin((angle * Math.PI) / 180) +
    y * Math.cos((angle * Math.PI) / 180),
});

// Landmarks are in the 500x500 puppet coordinate system. Forearms attach to
// elbows, hands attach to cuffs, and wrist angles are relative to forearms.
export function armAt(
  side: number,
  shoulder: number,
  elbow: number,
  wrist: number,
) {
  let a = clamp(shoulder, -43, 43);
  let b = side ? clamp(elbow, -148, -50) : clamp(elbow, 50, 148);
  const bend = clamp(wrist, -12, 12);
  const x = side ? 338 : 165;
  let e = rotate(side ? 14 : -14, 115, a);
  let w = rotate(side ? -15 : 12, 98, a + b);
  const targetX = clamp(x + e.x + w.x, 78, 425);
  if (targetX !== x + e.x + w.x) {
    // Two-bone inverse kinematics preserves both limb lengths while keeping
    // the performance inside its stage; never stretch or detach the hand.
    const dx = targetX - x,
      dy = e.y + w.y;
    const upper = Math.hypot(14, 115),
      lower = Math.hypot(side ? 15 : 12, 98);
    const flex =
      Math.acos(
        clamp(
          (dx * dx + dy * dy - upper * upper - lower * lower) /
            (2 * upper * lower),
          -1,
          1,
        ),
      ) * (side ? -1 : 1);
    const theta =
      Math.atan2(dy, dx) -
      Math.atan2(lower * Math.sin(flex), upper + lower * Math.cos(flex));
    const upperRest = Math.atan2(115, side ? 14 : -14);
    const lowerRest = Math.atan2(98, side ? -15 : 12);
    a = ((theta - upperRest) * 180) / Math.PI;
    b = clamp(
      ((flex - lowerRest + upperRest) * 180) / Math.PI,
      side ? -148 : 50,
      side ? -50 : 148,
    );
    e = rotate(side ? 14 : -14, 115, a);
    w = rotate(side ? -15 : 12, 98, a + b);
  }
  return {
    side,
    x,
    a,
    b,
    ex: x + e.x,
    ey: 274 + e.y,
    wx: x + e.x + w.x,
    wy: 274 + e.y + w.y,
    handAngle: a + b + 180 + bend,
    bend,
  };
}

// Normalized wrist anchors differ between a raised thumb, palm and held prop.
export const HAND_ANCHORS = [
  0.456, 0.539, 0.505, 0.249, 0.444, 0.324, 0.544, 0.348,
];
