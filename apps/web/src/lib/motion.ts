const active = new Set<Animation>();
export function reducedMotion() {
  return (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.reducedMotion === "true"
  );
}
export function cancelMotion() {
  active.forEach((a) => a.cancel());
  active.clear();
}
export function playMotion(
  el: Element,
  frames: Keyframe[],
  options: KeyframeAnimationOptions = {},
) {
  if (reducedMotion() || !el.animate) return;
  const animation = el.animate(frames, {
    duration: 260,
    easing: "cubic-bezier(.16,1,.3,1)",
    ...options,
  });
  active.add(animation);
  const clear = () => active.delete(animation);
  animation.addEventListener("finish", clear, { once: true });
  animation.addEventListener("cancel", clear, { once: true });
  return animation;
}

/** Heart pop shared by every Social like button; runs only when a like is added. */
export function popLike(el: Element) {
  playMotion(
    el,
    [
      { transform: "scale(1)" },
      { transform: "scale(1.3)" },
      { transform: "scale(.9)" },
      { transform: "scale(1)" },
    ],
    { duration: 360 },
  );
}
