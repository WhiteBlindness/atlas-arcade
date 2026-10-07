import type { Metadata } from "next";
import { PolicyPage } from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms and service details for Atlas Arcade.",
};

export default function TermsPage() {
  return <PolicyPage documentKey="terms" />;
}
