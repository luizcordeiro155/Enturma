let active: ViewTransition | undefined;
let animation: Animation | undefined;
let deadline: ReturnType<typeof setTimeout> | undefined;
let revision = 0;
let origin: { x: number; y: number } | undefined;
export function setThemeOrigin(x: number, y: number) {
  origin = { x, y };
}

/** Native snapshots keep text crisp; the fallback changes no geometry. */
export function applyEnturmaTheme(theme: string, animate = true) {
  const root = document.documentElement;
  const current = ++revision;
  clearTimeout(deadline);
  animation?.cancel();
  animation = undefined;
  active?.skipTransition();
  active = undefined;
  root.classList.remove("enturma-theme-transition");
  if (root.dataset.theme === theme) return;
  const change = () => {
    // skipTransition does not cancel an already queued update callback.
    if (current === revision) root.dataset.theme = theme;
  };
  const reduced =
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    root.dataset.reducedMotion === "true";
  if (!animate || reduced || document.hidden) {
    change();
    return;
  }
  if (!document.startViewTransition) {
    const before = getComputedStyle(document.body).backgroundColor;
    change();
    if (document.body.animate)
      animation = document.body.animate(
        [
          { backgroundColor: before },
          { backgroundColor: getComputedStyle(document.body).backgroundColor },
        ],
        { duration: 400, easing: "ease-out" },
      );
    return;
  }
  const x = Math.max(0, Math.min(innerWidth, origin?.x ?? innerWidth * 0.85));
  const y = Math.max(0, Math.min(innerHeight, origin?.y ?? 70));
  const radius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );
  root.classList.add("enturma-theme-transition");
  let transition: ViewTransition;
  try {
    transition = document.startViewTransition(change);
  } catch {
    change();
    root.classList.remove("enturma-theme-transition");
    return;
  }
  active = transition;
  let completed = false;
  const finish = () => {
    if (current !== revision) return;
    completed = true;
    clearTimeout(deadline);
    change();
    animation?.cancel();
    animation = undefined;
    active = undefined;
    root.classList.remove("enturma-theme-transition");
  };
  // A suspended renderer must never leave a snapshot covering the application.
  deadline = setTimeout(() => {
    if (current !== revision) return;
    transition.skipTransition();
    finish();
  }, 1500);
  void transition.ready
    .then(() => {
      if (current !== revision || completed) return;
      animation = root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 580,
          easing: "cubic-bezier(.22,.7,.2,1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {
      if (current === revision) {
        transition.skipTransition();
        finish();
      }
    });
  void transition.finished.finally(finish).catch(() => {});
}
