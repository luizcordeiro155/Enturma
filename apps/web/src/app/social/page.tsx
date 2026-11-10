import { Suspense } from "react";
import { Social } from "@/components/social/social";
import "@/components/social/social.css";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Abrindo o Enturma Social…</p>}>
      <Social />
    </Suspense>
  );
}
