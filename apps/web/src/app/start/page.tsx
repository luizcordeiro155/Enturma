import type { Metadata } from "next";
import { StartExperience } from "@/components/start-experience";

export const metadata: Metadata = {
  title: "Enturma — sua faculdade, em companhia",
  description:
    "Encontre sua turma, estude junto e leve suas ideias mais longe. Salas de estudo, cadernos com IA, amizades e caronas em um só lugar.",
  alternates: { canonical: "https://enturma-flax.vercel.app/start" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Enturma",
    url: "https://enturma-flax.vercel.app/start",
    title: "Sua próxima descoberta começa em companhia.",
    description: "Sua turma. Seus estudos. Seu Enturma.",
    images: [
      {
        url: "https://enturma-flax.vercel.app/start/poster.png",
        width: 1200,
        height: 630,
        alt: "Enturma — sua faculdade, em companhia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://enturma-flax.vercel.app/start/poster.png"],
  },
};

export default function StartPage() {
  return <StartExperience />;
}
