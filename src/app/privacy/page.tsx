import type { Metadata } from "next";
import { PolicyPage } from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Personal data and privacy information for Atlas Arcade.",
};

export default function PrivacyPage() {
  return <PolicyPage documentKey="privacy" />;
}
