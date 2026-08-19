import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nyumba Nearby | Student housing in Arusha",
  description: "Find student-friendly rooms and homes through trusted local agents in Arusha.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
