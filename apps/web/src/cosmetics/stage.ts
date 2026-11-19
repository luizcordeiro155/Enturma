import {
  framePadding,
  loadPack,
  stageScale,
  type CosmeticChoice,
  type CosmeticLayer,
  type CosmeticPack,
} from "./catalog";
import { createPacer } from "./pace";

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

  const pacer = createPacer();
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
    unboxed = false;
  /** How much of the art's margin fits around the card inside the room, side by side. */
  const margin = { top: 0, right: 0, bottom: 0, left: 0 };
  /**
   * What scrolls a floating card: compact, the popover is the card and scrolls whole; in
   * full, the card has a column of its own.
   */
  const room = () =>
    !floating
      ? null
      : floating.matches('[data-profile-view="compact"]')
        ? floating
        : (card.closest<HTMLElement>(".profile-preview-identity") ?? floating);
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

  /**
   * Sets the spilling frame around the card inside the room that scrolls it, so card and
   * frame go up and down as one piece and the room's edge is the only thing that cuts them.
   */
  function place() {
    const canvas = canvases.get("frame"),
      host = room();
    if (!host || !canvas) return;
    if (canvas.parentElement !== host) host.append(canvas);
    const m = spill(),
      at = card.getBoundingClientRect(),
      box = host.getBoundingClientRect(),
      left = at.left - box.left - host.clientLeft + host.scrollLeft,
      top = at.top - box.top - host.clientTop + host.scrollTop,
      below = Math.max(
        parseFloat(getComputedStyle(host).paddingBottom) || 0,
        host.clientHeight - top - at.height,
      ),
      within = (free: number) => Math.round(Math.max(0, Math.min(m, free)));
    // Never past what the room already scrolls: the art adds no scrolling of its own.
    margin.left = within(left);
    margin.top = within(top);
    margin.right = within(host.clientWidth - left - at.width);
    margin.bottom = within(below);
    canvas.style.left = `${Math.round(left) - margin.left}px`;
    canvas.style.top = `${Math.round(top) - margin.top}px`;
  }

  function fit(canvas: HTMLCanvasElement, w: number, h: number) {
    const ratio = pacer.ratio(Math.min(2, window.devicePixelRatio || 1));
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
    if (chosen.frame && floating) {
      const around = reach();
      floating.style.setProperty("--cosmetic-spill", `${around.side}px`);
      floating.style.setProperty("--cosmetic-spill-top", `${around.top}px`);
      floating.style.setProperty(
        "--cosmetic-spill-bottom",
        `${around.bottom}px`,
      );
      place();
    }
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
        place();
        const fw = w + margin.left + margin.right,
          fh = h + margin.top + margin.bottom,
          ratio = fit(canvas, fw, fh);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, fw, fh);
        ctx.save();
        ctx.translate(margin.left, margin.top);
        ctx.scale(s, s);
        pack.drawFrame(ctx, time, still);
        ctx.restore();
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
    // Not every screen refresh is a frame: see the pacer.
    if (!still && last && now - last < pacer.gap(time) - 3) {
      frame = requestAnimationFrame(tick);
      return;
    }
    // The frame's timestamp can be a hair before the moment the loop was woken.
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000 || 0.016));
    last = now;
    if (!still) {
      time += dt;
      for (const pack of packs.values()) pack.update(dt, time, false);
    }
    const began = performance.now();
    draw(still);
    if (!still) pacer.took(performance.now() - began);
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
  // The room changes without the card changing size: the window is resized, or a compact
  // popover opens in full and the card gets another room.
  const moved = () => {
    place();
    if (packs.size) layout();
    wake();
  };
  window.addEventListener("resize", moved);
  const reopened =
    typeof MutationObserver === "function"
      ? new MutationObserver(moved)
      : undefined;

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
      // A spilling frame goes in the room that scrolls the card; the rest sits on the card.
      const host = layer === "frame" && floating ? room()! : card;
      if (canvas) host.append(canvas);
    }
    if (floating)
      reopened?.observe(floating, {
        attributes: true,
        attributeFilter: ["data-profile-view"],
      });
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
      reopened?.disconnect();
      document.removeEventListener("visibilitychange", shown);
      window.removeEventListener("resize", moved);
      surface?.classList.remove("has-cosmetic-spill");
      for (const side of ["", "-top", "-bottom"])
        floating?.style.removeProperty(`--cosmetic-spill${side}`);
      for (const [layer, canvas] of canvases) {
        canvas.remove();
        card.classList.remove(`has-cosmetic-${layer}`);
      }
      for (const name of ["top", "side", "bottom"])
        card.style.removeProperty(`--cosmetic-${name}`);
    },
  };
}
