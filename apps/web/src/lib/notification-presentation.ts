/** Presentation only: callers supply the authenticated inbox count. */
export function watchNotificationBadge(count: number) {
  const total = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  const title = total ? `(${total}) Enturma` : "Enturma";
  const originalTitle = document.title;
  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  const icon = existing ?? document.createElement("link");
  const originalHref = icon.getAttribute("href");
  const originalType = icon.getAttribute("type");
  icon.rel = "icon";
  if (!existing) document.head.append(icon);
  const label = total > 99 ? "99+" : String(total);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#173f35"/><path d="M12 17q12-4 20 2 8-6 20-2v29q-12-4-20 2-8-6-20-2zM32 19v29" fill="none" stroke="#d8ef79" stroke-width="4"/>${total ? `<rect x="25" y="1" width="39" height="28" rx="13" fill="#d8ef79"/><text x="44" y="21" fill="#173f35" font-family="Arial,sans-serif" font-weight="bold" font-size="19" text-anchor="middle">${label}</text>` : ""}</svg>`;
  icon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  icon.type = "image/svg+xml";
  const apply = () => {
    if (document.title !== title) document.title = title;
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
    if (document.title === title) document.title = originalTitle;
    if (!existing) icon.remove();
    else {
      if (originalHref == null) icon.removeAttribute("href");
      else icon.setAttribute("href", originalHref);
      if (originalType == null) icon.removeAttribute("type");
      else icon.setAttribute("type", originalType);
    }
  };
}
