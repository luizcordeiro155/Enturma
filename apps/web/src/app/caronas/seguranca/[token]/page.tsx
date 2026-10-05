import { RideSafetyShare } from "@/components/ride-safety-share";

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <RideSafetyShare token={token} />;
}
