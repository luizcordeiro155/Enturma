"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { synchronizeAccountIdentity } from "@/lib/account-chat-sync";
import type { Identity } from "@/lib/private-chat-crypto";

/** Synchronization is automatic. No extra password/device-linking step in chat. */
export function PrivateKeySync({
  userId,
  ready,
  onUnlock,
}: {
  userId: string;
  ready: boolean;
  onUnlock: (identity: Identity) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const announced = useRef("");
  const active = useRef(true);
  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const result = await synchronizeAccountIdentity(userId);
      if (!active.current) return;
      if (announced.current !== result.identity.publicKey.x) {
        announced.current = result.identity.publicKey.x ?? "";
        onUnlock(result.identity);
      }
      setError("");
    } catch (failure) {
      if (active.current) setError((failure as Error).message);
    } finally {
      if (active.current) setBusy(false);
    }
  }, [userId, onUnlock]);
  useEffect(() => {
    active.current = true;
    const update = () => {
      if (!document.hidden) void refresh();
    };
    update();
    document.addEventListener("visibilitychange", update);
    window.addEventListener("online", update);
    return () => {
      active.current = false;
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("online", update);
    };
  }, [refresh]);
  if (ready || !error) return null;
  return (
    <section
      className="private-backup"
      id="private-sync"
      aria-label="Conexão das conversas"
    >
      <p role="status">{error}</p>
      <button type="button" disabled={busy} onClick={() => void refresh()}>
        {busy ? "Conectando…" : "Tentar novamente"}
      </button>
    </section>
  );
}
