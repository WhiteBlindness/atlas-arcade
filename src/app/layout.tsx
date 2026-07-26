import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { ProfileModal } from "@/components/ui/ProfileModal";
import { LeaderboardModal } from "@/components/ui/LeaderboardModal";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: { default: "ATLAS ARCADE", template: "%s | ATLAS ARCADE" },
  description: "Retro geography mini-game arcade — GeoRadar, Capital Strike, Flag Frenzy, Peaks & Valleys and more.",
};

export const viewport: Viewport = {
  themeColor: "#080810",
  width: "device-width",
  initialScale: 1,
  // reflow the UI when the mobile keyboard opens (GeoRadar input)
  interactiveWidget: "resizes-content",
};

// Applies the persisted theme to <html> before first paint, so there is no
// light/dark flash. Runs synchronously as the browser parses the HTML — the
// pattern documented for this fork at
// node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
// ("Themes"): a raw <script>, not next/script's beforeInteractive, with a
// server/client `type` switch + suppressHydrationWarning to quiet React's
// dev-only "Encountered a script tag" warning.
//
// KNOWN ISSUE, verified by isolation testing (removing the script entirely and
// re-checking the dev console):
//  - The "Encountered a script tag while rendering React component" warning
//    still fires here despite following the documented type-switch fix. It
//    also fired identically with next/script's beforeInteractive. It is gone
//    only when no <script> is rendered via JSX at all — in this fork's dev
//    overlay the warning appears to trigger on the element type itself, not on
//    whether the type attribute makes it inert. Not something fixable from
//    application code with either documented approach.
//  - The separate hydration mismatch inside Next's own metadata Suspense
//    boundary (<Head> > MetadataWrapper > __next_metadata_boundary__) is
//    UNRELATED to this script — it reproduces identically on a bare layout
//    with the script removed entirely. Pre-existing in this fork/build, not
//    caused by or fixable via this file.
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
