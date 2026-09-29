import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Enturma — estude em companhia",
  description: "Encontre sua matéria, entre em uma turma e aprenda junto.",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
