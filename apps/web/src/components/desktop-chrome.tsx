"use client";
import { useEffect, useState } from "react";
import { EnturmaAppIcon } from "./enturma-app-icon";
import { DesktopUpdateTitlebarAction } from "./desktop-updates";
export function DesktopChrome() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const bridge = window.enturmaDesktop;
    if (!bridge?.windowChrome) return;
    const root = document.documentElement;
    root.dataset.desktopChrome = "true";
    const timer = setTimeout(() => setActive(true), 0);
    const sync = () => {
      const light = root.dataset.theme === "light";
      // Older installed clients accept only the boolean protocol.
      const theme =
        root.dataset.palette === "enturma"
          ? "enturma"
          : light
            ? "light"
            : "dark";
      void bridge
        .setTheme?.(theme)
        .catch(() => bridge.setTheme?.(light).catch(() => {}));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme", "data-palette"],
    });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);
  return active ? (
    <div className="desktop-titlebar" aria-label="Enturma">
      <EnturmaAppIcon size={18} />
      <span>enturma.</span>
      <DesktopUpdateTitlebarAction />
    </div>
  ) : null;
}
