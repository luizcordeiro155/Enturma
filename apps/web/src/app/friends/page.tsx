import { Friends } from "@/components/friends";
import { Suspense } from "react";
// The Social Stories and their viewer appear on this page too.
import "@/components/social/social.css";
import "@/components/social/social-3.css";
import "@/components/social/social-3-continuation.css";
import "@/components/social/social-studio.css";
import "../friends-inbox.css";
export default function Page() {
  return (
    <Suspense fallback={<p>Carregando conversas…</p>}>
      <Friends />
    </Suspense>
  );
}
