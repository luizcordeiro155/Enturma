import { Friends } from "@/components/friends";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense fallback={<p>Carregando conversas…</p>}>
      <Friends />
    </Suspense>
  );
}
