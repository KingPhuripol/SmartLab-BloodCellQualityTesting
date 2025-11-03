import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
              <a
                href="/"
                className="text-sm font-semibold text-gray-900 hover:text-blue-700"
              >
                SmartLab
              </a>
              <nav className="flex items-center gap-4 text-sm">
                <a href="/" className="text-gray-700 hover:text-blue-700">
                  Home
                </a>
                <a
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-700"
                >
                  Dashboard
                </a>
                <a href="/pt-eqa" className="text-gray-700 hover:text-blue-700">
                  PT:EQA
                </a>
                <a href="/login" className="text-gray-700 hover:text-blue-700">
                  Sign in
                </a>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
