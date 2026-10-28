/** Presentation only: callers supply the authenticated inbox count. */
const unreadPrefix = /^\((?:\d+|99\+)\)\s*/;

export function watchNotificationBadge(count: number) {
  const total = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  // Leave Next.js in charge of page titles when the inbox is empty.
  if (!total) return () => {};

  const label = total > 99 ? "99+" : String(total);
  // Route metadata can change while the badge is mounted.
  let pageTitle = document.title.replace(unreadPrefix, "") || "Enturma";
  const currentTitle = () => "(" + label + ") " + pageTitle;
  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  const icon = existing ?? document.createElement("link");
  const originalHref = icon.getAttribute("href");
  const originalType = icon.getAttribute("type");
  icon.rel = "icon";
  if (!existing) document.head.append(icon);

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#173f35"/><path d="M12 17q12-4 20 2 8-6 20-2v29q-12-4-20-2zM32 19v29" fill="none" stroke="#d8ef79" stroke-width="4"/><rect x="25" y="1" width="39" height="28" rx="13" fill="#d8ef79"/><text x="44" y="21" fill="#173f35" font-family="Arial,sans-serif" font-weight="bold" font-size="19" text-anchor="middle">' + label + '</text></svg>';
  icon.href = "data:image/svg+xml," + encodeURIComponent(svg);
  icon.type = "image/svg+xml";

  const apply = () => {
    const unbadged = document.title.replace(unreadPrefix, "").trim();
    if (unbadged && unbadged !== pageTitle) pageTitle = unbadged;
    if (document.title !== currentTitle()) document.title = currentTitle();
  };
  apply();

  const observer = new MutationObserver(apply);
  observer.observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  return () => {
    observer.disconnect();
    // Do not revert navigation metadata on cleanup.
    if (document.title === currentTitle()) document.title = pageTitle;
    if (!existing) icon.remove();
    else {
      if (originalHref == null) icon.removeAttribute("href");
      else icon.setAttribute("href", originalHref);
      if (originalType == null) icon.removeAttribute("type");
      else icon.setAttribute("type", originalType);
    }
  };
}
