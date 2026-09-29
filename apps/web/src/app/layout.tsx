import type { Metadata } from "next";
import "./globals.css";
import { Motion } from "@/components/motion";
export const metadata: Metadata = {
  title: "Enturma — estude em companhia",
  description: "Encontre sua matéria, entre em uma turma e aprenda junto.",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <Motion />
        {children}
      </body>
    </html>
  );
}
