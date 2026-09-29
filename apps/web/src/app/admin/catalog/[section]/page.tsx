import { CatalogAdmin } from "@/components/catalog-admin";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (
    !["imports", "review", "sources", "requests", "events", "audit"].includes(
      section,
    )
  )
    notFound();
  return <CatalogAdmin section={section} />;
}
