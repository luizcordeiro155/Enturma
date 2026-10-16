let active: ViewTransition | undefined;
let revision = 0;
let origin: { x: number; y: number } | undefined;
export function setThemeOrigin(x: number, y: number) {
  origin = { x, y };
}

/** Native snapshots keep text crisp; the fallback changes no geometry. */
export function applyEnturmaTheme(theme: string, animate = true) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  const change = () => {
    root.dataset.theme = theme;
  };
  const reduced =
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    root.dataset.reducedMotion === "true";
  active?.skipTransition();
  const current = ++revision;
  active = undefined;
  root.classList.remove("enturma-theme-transition");
  if (!animate || reduced || document.hidden) {
    change();
    return;
  }
  if (!document.startViewTransition) {
    const before = getComputedStyle(document.body).backgroundColor;
    change();
    if (document.body.animate)
      document.body.animate(
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
  const transition = document.startViewTransition(change);
  active = transition;
  void transition.ready
    .then(() => {
      if (current !== revision) return;
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 580,
          easing: "cubic-bezier(.22,.7,.2,1)",
          fill: "both",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {
      if (current === revision) change();
    });
  void transition.finished
    .finally(() => {
      if (current === revision) {
        active = undefined;
        root.classList.remove("enturma-theme-transition");
      }
    })
    .catch(() => {});
}
