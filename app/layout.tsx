import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DigitalOcean Gradient CUA Demo",
  description: "Orchestrating remote driver sessions and automation workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} antialiased bg-white text-gray-900 h-full w-full`}
      >
        <Providers>
          {/* Fixed Header */}
          <Header />

          {/*
            Main content container:
            - pt-20 for header (64px) + breadcrumbs (~16px) spacing
            - h-screen + overflow-hidden to contain content
            - flex flex-col to allow children to expand
          */}
          <main className="pt-20 h-screen overflow-hidden flex flex-col">
            <ScrollToTop />
            <div className="flex-1 overflow-hidden flex flex-col">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
