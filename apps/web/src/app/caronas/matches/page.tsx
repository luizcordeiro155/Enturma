import { Matches } from "@/components/rides";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense fallback={<p>Carregando matches…</p>}>
      <Matches />
    </Suspense>
  );
}
