"use client";
import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { DesktopUpdateTitlebarAction } from "./desktop-updates";
export function DesktopChrome() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const bridge = window.enturmaDesktop;
    if (!bridge?.windowChrome) return;
    const root = document.documentElement;
    root.dataset.desktopChrome = "true";
    const timer = setTimeout(() => setActive(true), 0);
    const sync = () =>
      void bridge.setTheme?.(root.dataset.theme === "light").catch(() => {});
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);
  return active ? (
    <div className="desktop-titlebar" aria-label="Enturma">
      <BookOpen size={14} />
      <span>enturma.</span>
      <DesktopUpdateTitlebarAction />
    </div>
  ) : null;
}
