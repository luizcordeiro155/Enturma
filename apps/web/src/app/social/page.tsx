import { Suspense } from "react";
import { Social } from "@/components/social/social";
import "@/components/social/social.css";
import "@/components/social/social-3.css";
import "@/components/social/social-3-continuation.css";
import "@/components/social/social-studio.css";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Abrindo o Enturma Social…</p>}>
      <Social />
    </Suspense>
  );
}
