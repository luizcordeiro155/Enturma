// Production redeploy marker: account-switch/mobile-profile fixes 2026-10-03.
import type { Metadata } from "next";
import "./globals.css";
import "./advanced-games.css";
import "./profile-customization.css";
import "./production-polish.css";
import "./social.css";
import "./forum.css";
import "./notifications.css";
import "./study-journey.css";
import "./ride-activity.css";
import "./account-privacy.css";
import "./student-suite.css";
import { RideActivity } from "@/components/ride-activity";
import "./study-workspace.css";
import "./responsive-shell.css";
import { CallSessionProvider } from "@/components/call-session-provider";
import { PrivateCallsProvider } from "@/components/private-calls";
import "./community-v3.css";
import "./ride-mobility-polish.css";
import "./dark-theme-polish.css";
import "./mobile-chat-layout.css";
import "./profile-call-polish.css";
import "./chat-message-polish.css";
import "./intro-experience.css";
import "./call-tiles.css";
import "./theme-surfaces.css";
import "./interaction-refinement.css";
import { DesktopUpdateProvider } from "@/components/desktop-updates";
import { Motion } from "@/components/motion";
import { ThemeSync } from "@/components/theme-sync";
import { MobilePushRegistration } from "@/components/mobile-push-registration";
import { WebPushRegistration } from "@/components/web-push-registration";
import { AppShellStateProvider } from "@/components/app-shell-state";
import { PwaProvider } from "@/components/pwa-install";
export const metadata: Metadata = {
  title: "Enturma — estude em companhia",
  description: "Encontre sua matéria, entre em uma turma e aprenda junto.",
  applicationName: "Enturma",
  icons: {
    icon: [{ url: "/pwa/enturma-mobile-official-v6.png", type: "image/png" }],
    apple: [{ url: "/pwa/enturma-mobile-official-v6.png", type: "image/png" }],
  },
  other: {
    "application-version": "0.3.0",
  },
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning data-enturma-update-ui="web">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p={};try{p=JSON.parse(localStorage.getItem('enturma-experience')||'{}')||{}}catch(e){}var r=document.documentElement,t=p.theme;r.dataset.desktop=String(navigator.userAgent.includes('EnturmaDesktop/'));r.dataset.theme=t==='DARK'?'dark':t==='LIGHT'?'light':matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';r.dataset.highContrast=String(p.highContrast===true);r.dataset.reducedMotion=String(p.reducedMotion===true);r.dataset.enhancedFocus=String(p.enhancedFocus!==false);r.style.setProperty('--font-scale',String(Math.max(.85,Math.min(1.35,Number(p.fontScale)||1))));})();`,
          }}
        />
      </head>
      <body>
        <Motion />
        <ThemeSync />
        <MobilePushRegistration />
        <WebPushRegistration />
        <PwaProvider>
          <CallSessionProvider>
            <PrivateCallsProvider>
              <DesktopUpdateProvider>
                <AppShellStateProvider>
                  <RideActivity>{children}</RideActivity>
                </AppShellStateProvider>
              </DesktopUpdateProvider>
            </PrivateCallsProvider>
          </CallSessionProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
