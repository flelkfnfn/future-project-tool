import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import SupabaseProvider from "@/components/supabase-provider"; // Import the provider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "미래사회변화주도프로젝트",
  description: "미래사회변화주도프로젝트 협업 툴",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider> {/* Wrap Header and main with SupabaseProvider */}
          <Header />
          <main className="container mx-auto p-4">{children}</main>
        </SupabaseProvider>
      </body>
    </html>
  );
}
