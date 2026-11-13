export function socialKeyboardGeometry(input: {
  height: number;
  visibleHeight: number;
  top: number;
  scale: number;
  native: number;
  overlay: number;
}) {
  if (Math.abs(input.scale - 1) > 0.05)
    return { bottom: 0, height: input.height, top: 0 };
  const top = Math.max(0, input.top),
    bottom = Math.min(
      Math.max(0, input.height - 120),
      Math.max(
        0,
        input.height - input.visibleHeight - top,
        input.native,
        input.overlay,
      ),
    );
  return {
    bottom,
    height: Math.max(
      120,
      Math.min(input.visibleHeight, input.height - bottom - top),
    ),
    top,
  };
}
