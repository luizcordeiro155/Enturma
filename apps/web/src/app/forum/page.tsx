import { Forum } from "@/components/forum";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selected = [
    "GENERAL",
    "PROGRAMMING",
    "ACADEMIC",
    "CAREER",
    "CAMPUS",
  ].includes(category ?? "")
    ? category
    : "";
  return <Forum key={selected} initialCategory={selected} />;
}
