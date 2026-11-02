import { Check, CheckCheck } from "lucide-react";
import "./voice-message.css";

export type DeliveryReceipt = {
  receiptTotal?: number;
  deliveredCount?: number;
  readCount?: number;
};
export function messageReceiptState(receipt: DeliveryReceipt) {
  const total = Number(receipt.receiptTotal ?? 0);
  if (total > 0 && Number(receipt.readCount ?? 0) >= total) return "read";
  if (total > 0 && Number(receipt.deliveredCount ?? 0) >= total)
    return "delivered";
  return "sent";
}
export function MessageReceipt({ receipt }: { receipt: DeliveryReceipt }) {
  const state = messageReceiptState(receipt);
  const label =
    state === "read" ? "Lida" : state === "delivered" ? "Entregue" : "Enviada";
  const group =
    Number(receipt.receiptTotal ?? 0) > 1
      ? ` · ${receipt.deliveredCount ?? 0} receberam, ${receipt.readCount ?? 0} leram de ${receipt.receiptTotal} destinatários`
      : "";
  const Icon = state === "sent" ? Check : CheckCheck;
  return (
    <span
      className={`message-delivery message-delivery-${state}`}
      role="img"
      aria-label={label + group}
      title={label + group}
    >
      <Icon size={16} strokeWidth={2.2} />
    </span>
  );
}
