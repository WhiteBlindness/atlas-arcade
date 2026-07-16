import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://flagcdn.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="font-mono antialiased min-h-dvh overflow-x-hidden overscroll-y-none bg-arcade-bg bg-scanlines">
        <AuthProvider>
          {children}
          <AuthModal />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
