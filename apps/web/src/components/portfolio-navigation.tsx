"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { authDestination } from "@/lib/auth-navigation";

export function PublicPortfolioLink({
  username,
  children,
  className,
}: {
  username: string;
  children: React.ReactNode;
  className?: string;
}) {
  const path = usePathname();
  return (
    <Link
      href={{
        pathname: `/p/${encodeURIComponent(username)}`,
        query: { returnTo: path },
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
export function PortfolioBack() {
  const router = useRouter();
  const search = useSearchParams();
  const target = authDestination(search.get("returnTo"));
  return (
    <nav className="portfolio-return" aria-label="Navegação do portfólio">
      <Link
        className="button secondary"
        href={target}
        onClick={(event) => {
          // Internal links mark their origin; direct/public visits always have a safe fallback.
          if (search.has("returnTo") && window.history.length > 1) {
            event.preventDefault();
            router.back();
          }
        }}
      >
        <ArrowLeft size={18} /> Voltar ao Enturma
      </Link>
    </nav>
  );
}
