import type { Metadata } from "next";
import { PolicyPage } from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Cookies and local storage",
  description: "Cookies and local browser storage used by Atlas Arcade.",
};

export default function CookiesPage() {
  return <PolicyPage documentKey="cookies" />;
}
