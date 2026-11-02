"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Video } from "lucide-react";
import { api } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live-updates";

export type CallHistoryEntry = {
  id: string;
  callerId: string;
  video: boolean;
  answered: boolean;
  state: "DECLINED" | "CANCELLED" | "NO_ANSWER" | "ENDED";
  createdAt: string;
  updatedAt: string;
};
export function usePrivateCallHistory(friendshipId?: string) {
  const [history, setHistory] = useState<{
    friendshipId: string;
    entries: CallHistoryEntry[];
  }>();
  const current = useRef(friendshipId);
  useEffect(() => {
    current.current = friendshipId;
  }, [friendshipId]);
  const refresh = useCallback(async () => {
    if (!friendshipId) return;
    const entries = await api<CallHistoryEntry[]>(
      `/friends/${friendshipId}/calls`,
      { cache: "no-store" },
    );
    if (current.current === friendshipId) setHistory({ friendshipId, entries });
  }, [friendshipId]);
  useLiveRefresh("private_call_changed", refresh, 5000);
  useEffect(() => {
    void refresh().catch(() => {});
  }, [refresh]);
  return history && history.friendshipId === friendshipId
    ? history.entries
    : [];
}
export function PrivateCallHistoryCard({
  call,
  me,
}: {
  call: CallHistoryEntry;
  me?: string;
}) {
  const mine = call.callerId === me;
  const Icon = call.video
    ? Video
    : call.answered
      ? mine
        ? PhoneOutgoing
        : PhoneIncoming
      : PhoneMissed;
  const outcome =
    call.state === "DECLINED"
      ? "Recusada"
      : call.state === "CANCELLED"
        ? "Cancelada"
        : call.state === "NO_ANSWER"
          ? "Não atendida"
          : call.answered
            ? "Atendida"
            : "Encerrada antes de conectar";
  return (
    <div
      className={`private-call-history ${mine ? "outgoing" : "incoming"}`}
      data-outcome={call.answered ? "answered" : "missed"}
    >
      <Icon size={24} aria-hidden="true" />
      <div>
        <strong>{call.video ? "Chamada de vídeo" : "Ligação de voz"}</strong>
        <span>
          {mine ? "Efetuada" : "Recebida"} · {outcome}
        </span>
        <time dateTime={call.createdAt}>
          {new Date(call.createdAt).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  );
}
