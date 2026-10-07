import type { Metadata } from "next";
import { PolicyPage } from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Credits and licences",
  description: "Sources and licensing status for third-party material in Atlas Arcade.",
};

export default function CreditsPage() {
  return <PolicyPage documentKey="credits" />;
}
