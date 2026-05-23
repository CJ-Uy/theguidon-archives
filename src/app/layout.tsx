import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertBarProvider } from "@/lib/alert-bar-context";
import Header from "@/components/header";
import Footer from "@/components/footer";
import AlertBar from "@/components/alert-bar";
import "@/styles/fonts.css";
import "@/styles/globals.css";
import "@/styles/tailwind.css";

export const metadata: Metadata = {
  title: "The GUIDON Archives",
  description:
    "A collection of The GUIDON's published content since 1929, chronicling its history as the official student publication of the Ateneo de Manila University.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AlertBarProvider>
          <Suspense fallback={<header />}>
            <Header />
          </Suspense>
          <main>{children}</main>
          <Footer />
          <AlertBar />
        </AlertBarProvider>
      </body>
    </html>
  );
}
