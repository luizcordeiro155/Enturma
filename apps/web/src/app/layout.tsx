import type { Metadata } from "next";
import "./globals.css";
import "./advanced-games.css";
import "./profile-customization.css";
import "./production-polish.css";
import "./social.css";
import "./forum.css";
import "./notifications.css";
import "./ride-activity.css";
import { RideActivity } from "@/components/ride-activity";
import "./study-workspace.css";
import { Motion } from "@/components/motion";
export const metadata: Metadata = {
  title: "Enturma — estude em companhia",
  description: "Encontre sua matéria, entre em uma turma e aprenda junto.",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p={};try{p=JSON.parse(localStorage.getItem('enturma-experience')||'{}')||{}}catch(e){}var r=document.documentElement,t=p.theme;r.dataset.theme=t==='DARK'?'dark':t==='LIGHT'?'light':matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';r.dataset.highContrast=String(p.highContrast===true);r.dataset.reducedMotion=String(p.reducedMotion===true);r.dataset.enhancedFocus=String(p.enhancedFocus!==false);r.style.setProperty('--font-scale',String(Math.max(.85,Math.min(1.35,Number(p.fontScale)||1))));})();`,
          }}
        />
      </head>
      <body>
        <Motion />
        <RideActivity>{children}</RideActivity>
      </body>
    </html>
  );
}
