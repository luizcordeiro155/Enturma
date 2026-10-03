import { GroupWorkspace } from "@/components/group-workspace";
export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <GroupWorkspace id={id}/>;
}
