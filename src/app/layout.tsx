import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { ProfileModal } from "@/components/ui/ProfileModal";
import { LeaderboardModal } from "@/components/ui/LeaderboardModal";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: { default: "ATLAS ARCADE", template: "%s | ATLAS ARCADE" },
  description: "Geography mini-games with daily challenges, arcade play and the Atlas Jackpot boss stage.",
};

export const viewport: Viewport = {
  themeColor: "#080810",
  width: "device-width",
  initialScale: 1,
  // reflow the UI when the mobile keyboard opens (GeoRadar input)
  interactiveWidget: "resizes-content",
};

// Restore the saved theme before hydration to avoid a theme flash.
const THEME_INIT_JS =
  "try{if(typeof window!=='undefined'){var s=JSON.parse(localStorage.getItem('atlas-arcade-settings'));var t=(s&&s.state&&s.state.theme)||'dark';document.documentElement.classList.add(t);}else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script below mutates <html> classes
    // before hydration (theme), which would otherwise trip a hydration mismatch.
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://flagcdn.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <script
          id="theme-initializer"
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_JS }}
        />
      </head>
      {/* suppressHydrationWarning: the theme script adds a class to <html> and
          browser extensions commonly inject attributes on <body> before React
          hydrates. */}
      <body suppressHydrationWarning className="font-mono antialiased min-h-dvh overflow-x-hidden overscroll-y-none bg-arcade-bg bg-scanlines">
        <AuthProvider>
          {children}
          <AuthModal />
          <ProfileModal />
          <LeaderboardModal />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
