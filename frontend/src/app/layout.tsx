import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { themeBootScript } from "@/lib/theme";

// Free stand-in for Airbnb Cereal (the real font is proprietary): used until public/fonts/AirbnbCerealVF.woff2 exists.
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  title: "Airbnb clone | Holiday rentals, cabins, beach houses & more",
  description: "Assignment project: an Airbnb-style marketplace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="font-sans text-sm pb-24 md:pb-0">
        <Providers>
          <SiteHeader />
          <main className="mx-auto max-w-[1760px] pt-4">{children}</main>
          <Footer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
