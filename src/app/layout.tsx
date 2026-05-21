import type { Metadata } from "next";
import "@/styles/fonts.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "The GUIDON Archives",
  description:
    "A collection of The GUIDON's published content since 1929, chronicling its history as the official student publication of the Ateneo de Manila University.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
