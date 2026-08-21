import type { Metadata } from "next";
import "./globals.css";
import { AdSenseScript } from "@/components/ads/adsense-script";

export const metadata: Metadata = {
  title: "Nyumba Nearby | Student housing in Arusha",
  description: "Find student-friendly rooms and homes through trusted local agents in Arusha.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AdSenseScript />
        {children}
      </body>
    </html>
  );
}
