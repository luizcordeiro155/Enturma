import {
  framePadding,
  loadPack,
  stageScale,
  type CosmeticChoice,
  type CosmeticLayer,
  type CosmeticPack,
} from "./catalog";

const INNER_RADIUS = 16;
/** Where a profile floats over the page: there the frame goes around the card, unboxed. */
const FLOATING = ".user-profile-popover, .social-dialog";
/** The margin the art is drawn with around the card, at the size it was made. */
const SPILL = 124;
/** The avatar art is drawn on a 154px square around an 84px avatar. */
const AVATAR_ART = 154 / 84;

const narrow = () =>
  typeof matchMedia === "function" && matchMedia("(max-width: 760px)").matches;
const reducedMotion = () =>
  (typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches) ||
  document.documentElement.dataset.reducedMotion === "true";

/**
 * Draws the chosen cosmetics over a profile card: the frame around it, the decoration on the
 * avatar and the effect over the card. The entrance plays when the card first shows; after
 * that the art idles. Returns a handle that takes everything down again.
 */
export function mountCosmetics(card: HTMLElement, chosen: CosmeticChoice) {
  const wanted = (["frame", "effect", "avatar"] as const).filter(
    (layer) => chosen[layer],
  );
  let alive = true;
  if (!wanted.length) return { destroy() {} };

  const canvases = new Map<CosmeticLayer, HTMLCanvasElement>();
  const packs = new Map<string, CosmeticPack>();
  let frame = 0,
    last = 0,
    time = 0,
    seen = false,
    visible = true,
    size = "";
  const geometry = { w: 340, h: 548, r: 18 };
  // In a floating profile the frame spills over what is around the card, like the art was
  // drawn; everywhere else the card makes room for it.
  let floating: HTMLElement | null = null,
    surface: HTMLElement | null = null,
    shiftX = 0,
    shiftY = 0,
    unboxed = false;
  const scale = () =>
    floating
      ? Math.round(
          Math.max(0.7, Math.min(1, (card.clientWidth || 340) / 400)) * 1000,
        ) / 1000
      : stageScale(card.clientWidth || 340);
  const reach = () => {
    const pack = chosen.frame ? packs.get(chosen.frame) : undefined;
    return pack
      ? framePadding(pack.reach, scale(), !floating && narrow())
      : { top: 0, side: 0, bottom: 0 };
  };
  const pad = () => (floating ? { top: 0, side: 0, bottom: 0 } : reach());
  /** Canvas room around a floating card: the whole margin the art was drawn with. */
  const spill = () => Math.round(SPILL * scale());

  /** Keeps the spilling frame on the card while the page scrolls or the dialog moves. */
  function place() {
    const canvas = canvases.get("frame");
    if (!floating || !canvas) return;
    const m = spill(),
      at = card.getBoundingClientRect(),
      now = canvas.getBoundingClientRect(),
      dx = at.left - m - now.left,
      dy = at.top - m - now.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    shiftX += dx;
    shiftY += dy;
    canvas.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
  }

  function fit(canvas: HTMLCanvasElement, w: number, h: number) {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const pw = Math.max(1, Math.round(w * ratio)),
      ph = Math.max(1, Math.round(h * ratio));
    if (canvas.width !== pw) canvas.width = pw;
    if (canvas.height !== ph) canvas.height = ph;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    return ratio;
  }

  /** Reads where everything is and rebuilds the art when the card changed size. */
  function layout() {
    const s = scale(),
      p = pad(),
      w = card.clientWidth,
      h = card.clientHeight;
    if (chosen.frame && floating)
      surface?.style.setProperty("--cosmetic-spill", `${reach().side}px`);
    if (chosen.frame && !floating) {
      card.style.setProperty("--cosmetic-top", `${p.top}px`);
      card.style.setProperty("--cosmetic-side", `${p.side}px`);
      card.style.setProperty("--cosmetic-bottom", `${p.bottom}px`);
    }
    const innerW = Math.max(40, w - p.side * 2),
      innerH = Math.max(40, h - p.top - p.bottom);
    const next = `${Math.round(innerW / s)}x${Math.round(innerH / s)}`;
    if (next !== size) {
      size = next;
      geometry.w = innerW / s;
      geometry.h = innerH / s;
      geometry.r = (chosen.frame ? INNER_RADIUS : 0) / s;
      shiftX = shiftY = 0;
      for (const pack of packs.values()) pack.init();
    }
    const effect = canvases.get("effect");
    if (effect) {
      effect.style.left = `${p.side}px`;
      effect.style.top = `${p.top}px`;
    }
    const avatar = canvases.get("avatar"),
      face = card.querySelector<HTMLElement>(".identity-avatar");
    if (avatar && face) {
      const a = face.getBoundingClientRect(),
        c = card.getBoundingClientRect(),
        side = a.width * AVATAR_ART;
      avatar.style.left = `${a.left - c.left + a.width / 2 - side / 2}px`;
      avatar.style.top = `${a.top - c.top + a.height / 2 - side / 2}px`;
    }
  }

  function draw(still: boolean) {
    const s = scale(),
      p = pad(),
      w = card.clientWidth,
      h = card.clientHeight;
    for (const [layer, canvas] of canvases) {
      const ctx = canvas.getContext("2d"),
        pack = packs.get(chosen[layer]!);
      if (!ctx || !pack) continue;
      if (layer === "frame" && floating) {
        const m = spill(),
          fw = w + m * 2,
          fh = h + m * 2,
          ratio = fit(canvas, fw, fh);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, fw, fh);
        ctx.save();
        ctx.translate(m, m);
        ctx.scale(s, s);
        pack.drawFrame(ctx, time, still);
        ctx.restore();
        place();
      } else if (layer === "frame") {
        const ratio = fit(canvas, w, h);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, w, h);
        // Outside a dark profile room the frame brings its own band to sit on, with the
        // card showing through the middle.
        if (!unboxed) {
          const mat = ctx.createLinearGradient(0, 0, 0, h);
          mat.addColorStop(0, pack.mat[0]);
          mat.addColorStop(1, pack.mat[1]);
          ctx.beginPath();
          ctx.rect(0, 0, w, h);
          ctx.roundRect(
            p.side,
            p.top,
            w - p.side * 2,
            h - p.top - p.bottom,
            INNER_RADIUS,
          );
          ctx.fillStyle = mat;
          ctx.fill("evenodd");
        }
        ctx.save();
        ctx.translate(p.side, p.top);
        ctx.scale(s, s);
        pack.drawFrame(ctx, time, still);
        ctx.restore();
      } else if (layer === "effect") {
        const ew = w - p.side * 2,
          eh = h - p.top - p.bottom,
          ratio = fit(canvas, ew, eh);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, ew, eh);
        ctx.save();
        ctx.scale(s, s);
        pack.drawEffect(ctx, time, still);
        ctx.restore();
      } else {
        const face = card.querySelector<HTMLElement>(".identity-avatar"),
          side = (face?.offsetWidth || 84) * AVATAR_ART,
          ratio = fit(canvas, side, side);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, side, side);
        ctx.save();
        ctx.scale(side / 154, side / 154);
        pack.drawAvatar(ctx, time, still);
        ctx.restore();
      }
    }
  }

  function tick(now: number) {
    frame = 0;
    if (!alive) return;
    const still = reducedMotion();
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (!still) {
      time += dt;
      for (const pack of packs.values()) pack.update(dt, time, false);
    }
    draw(still);
    // With motion off the art is a still picture: drawn once, redrawn only on resize.
    if (!still && visible && !document.hidden)
      frame = requestAnimationFrame(tick);
  }
  function wake() {
    if (!alive || frame || !packs.size || !seen) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  const resized =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          if (!packs.size) return;
          layout();
          wake();
        })
      : undefined;
  const watched =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (visible) seen = true;
          wake();
        })
      : undefined;
  const shown = () => wake();
  document.addEventListener("visibilitychange", shown);
  window.addEventListener("scroll", place, { capture: true, passive: true });
  window.addEventListener("resize", place);

  void Promise.all(
    [...new Set(wanted.map((layer) => chosen[layer]!))].map(async (id) => ({
      id,
      create: await loadPack(id),
    })),
  ).then((loaded) => {
    if (!alive) return;
    // No canvas (very old browser, test environment): the profile simply has no cosmetics.
    const able = !!document.createElement("canvas").getContext?.("2d");
    floating =
      chosen.frame &&
      typeof matchMedia === "function" &&
      matchMedia("(min-width: 761px)").matches
        ? card.closest<HTMLElement>(FLOATING)
        : null;
    surface = floating
      ? card.closest<HTMLElement>(".profile-preview-combined")
      : null;
    unboxed =
      getComputedStyle(card).getPropertyValue("--cosmetic-mat").trim() ===
      "none";
    for (const layer of wanted) {
      const canvas = document.createElement("canvas"),
        spills = layer === "frame" && floating;
      canvas.className = `profile-cosmetic-layer${spills ? " profile-cosmetic-spill" : ""}`;
      canvas.dataset.layer = layer;
      canvas.setAttribute("aria-hidden", "true");
      canvases.set(layer, canvas);
      if (spills) surface?.classList.add("has-cosmetic-spill");
      else card.classList.add(`has-cosmetic-${layer}`);
    }
    // Frame last in the document so it sits over the other two.
    for (const layer of ["effect", "avatar", "frame"] as const) {
      const canvas = canvases.get(layer);
      // A dialog in the top layer has to hold its own frame; anything else lets the page
      // hold it, so no clipped or moved ancestor can cut the art.
      const host =
        layer === "frame" && floating
          ? floating.matches("dialog")
            ? floating
            : document.body
          : card;
      if (canvas) host.append(canvas);
    }
    if (able)
      for (const { id, create } of loaded)
        packs.set(id, create(geometry, { x: 60, y: 112, r: 42 }));
    layout();
    resized?.observe(card);
    if (watched) watched.observe(card);
    else seen = true;
    wake();
  });

  return {
    destroy() {
      alive = false;
      cancelAnimationFrame(frame);
      resized?.disconnect();
      watched?.disconnect();
      document.removeEventListener("visibilitychange", shown);
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
      surface?.classList.remove("has-cosmetic-spill");
      surface?.style.removeProperty("--cosmetic-spill");
      for (const [layer, canvas] of canvases) {
        canvas.remove();
        card.classList.remove(`has-cosmetic-${layer}`);
      }
      for (const name of ["top", "side", "bottom"])
        card.style.removeProperty(`--cosmetic-${name}`);
    },
  };
}
