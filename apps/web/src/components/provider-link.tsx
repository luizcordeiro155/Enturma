"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { insideNativeShell } from "@/lib/external-access";
import { leaveTo } from "@/lib/leave";

/**
 * A link to `/api/oauth/…/start`. In a browser it is an ordinary link. Inside the Android and
 * Windows apps Google refuses to show its page, so the app asks for the provider's address and
 * leaves through it: both apps open addresses outside Enturma in the device browser, and the
 * answer comes back to the app by an `enturma://` link.
 */
export function ProviderLink({
  href,
  allow,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  /** Return false to keep the person on the page (something is still missing). */
  allow?: (event: MouseEvent<HTMLAnchorElement>) => boolean;
}) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (allow && !allow(event)) {
          event.preventDefault();
          return;
        }
        if (!insideNativeShell()) return;
        event.preventDefault();
        const address = `${href}${href.includes("?") ? "&" : "?"}mode=json`;
        void fetch(address, { credentials: "same-origin", cache: "no-store" })
          .then((response) => response.json() as Promise<{ url?: string }>)
          .then((answer) => leaveTo(answer.url || href))
          .catch(() => leaveTo(href));
      }}
    />
  );
}
