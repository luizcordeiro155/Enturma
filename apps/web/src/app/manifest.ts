import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Enturma — estude em companhia",
    short_name: "Enturma",
    description:
      "Salas de estudo, comunidade, cadernos, chamadas e perfil em um único aplicativo.",
    start_url: "/home?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0f1917",
    theme_color: "#0f1917",
    categories: ["education", "productivity", "social"],
    lang: "pt-BR",
    dir: "ltr",
    icons: [
      {
        src: "/enturma-app-icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/enturma-app-icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Início",
        short_name: "Início",
        description: "Abrir o início do Enturma",
        url: "/home",
        icons: [{ src: "/enturma-app-icon.png", sizes: "1024x1024", type: "image/png" }],
      },
      {
        name: "Salas",
        short_name: "Salas",
        description: "Encontrar suas salas de estudo",
        url: "/explore",
        icons: [{ src: "/enturma-app-icon.png", sizes: "1024x1024", type: "image/png" }],
      },
      {
        name: "Comunidade",
        short_name: "Comunidade",
        description: "Abrir o fórum do Enturma",
        url: "/forum",
        icons: [{ src: "/enturma-app-icon.png", sizes: "1024x1024", type: "image/png" }],
      },
      {
        name: "Cadernos",
        short_name: "Cadernos",
        description: "Abrir seus cadernos de estudo",
        url: "/notebooks",
        icons: [{ src: "/enturma-app-icon.png", sizes: "1024x1024", type: "image/png" }],
      },
    ],
  };
}
