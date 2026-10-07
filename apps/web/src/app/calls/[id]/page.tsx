import { PrivateCallPage } from "@/components/private-calls";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PrivateCallPage id={id} />;
}
