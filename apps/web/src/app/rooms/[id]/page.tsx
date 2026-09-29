import { RoomView } from "@/components/room-v4";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RoomView id={id} />;
}
