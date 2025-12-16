import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartLab Hospital - Blood Cell Quality Testing",
  description: "Professional blood cell quality testing system for hospitals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
