import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import Navbar from "@/components/layout/Navbar";
import BottomNavigation from "@/components/layout/BottomNavigation";
import Footer from "@/components/layout/Footer";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Stack Shack Nutrition | Premium Supplements & Protein",
  description: "Experience premium nutrition, protein, creatine, and pre-workout formulas. Buy quality athletic supplements online at Stack Shack Nutrition.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[#1F2937]">
        <StoreProvider>
          {/* Main Layout Container */}
          <Navbar />
          
          <main className="flex-1 flex flex-col w-full pb-16 md:pb-0">
            {children}
          </main>
          
          <Footer />
          <BottomNavigation />
        </StoreProvider>
      </body>
    </html>
  );
}
