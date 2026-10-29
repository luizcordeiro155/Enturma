import { Suspense } from "react";
import { RideMobilitySettings } from "@/components/ride-mobility-settings";

export default function Page() {
  return <Suspense fallback={null}><RideMobilitySettings /></Suspense>;
}
