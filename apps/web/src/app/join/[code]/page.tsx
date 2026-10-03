import { JoinRoom } from "@/components/join-room";
export default async function Page({params}:{params:Promise<{code:string}>}) {
  const {code}=await params;
  return <JoinRoom code={code}/>;
}
