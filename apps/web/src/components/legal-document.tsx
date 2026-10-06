import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export function LegalDocument({
  title,
  summary,
  updatedAt,
  children,
}: {
  title: string;
  summary: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="legal-page-shell">
      <header className="legal-page-header">
        <Link href="/home" className="legal-page-brand" aria-label="Voltar ao Enturma">
          <BookOpen size={30} />
          <span>
            enturma<span className="dot">.</span>
          </span>
        </Link>
        <Link href="/home" className="legal-page-back">
          <ArrowLeft size={17} />
          <span>Voltar ao Enturma</span>
        </Link>
      </header>

      <main className="legal-document">
        <header>
          <h1>{title}</h1>
          <p className="legal-summary">{summary}</p>
          <small className="legal-updated">Última atualização: {updatedAt}</small>
        </header>

        {children}

        <footer className="legal-page-footer" aria-label="Documentos legais">
          <Link href="/privacidade">Política de Privacidade</Link>
          <span aria-hidden="true">•</span>
          <Link href="/termos">Termos de Uso</Link>
          <span aria-hidden="true">•</span>
          <Link href="/home">Enturma</Link>
        </footer>
      </main>
    </div>
  );
}
