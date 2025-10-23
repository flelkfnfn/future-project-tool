import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import SupabaseProvider from "@/components/supabase-provider";
import AppShell from "@/components/AppShell";
import PageTransitionOverlay from "@/components/PageTransitionOverlay";
import ThemeProvider from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "미래변화주도 프로젝트",
  description: "미래변화주도 프로젝트 협업 툴",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <SupabaseProvider>
            <Header />
            <AppShell>{children}</AppShell>
            <PageTransitionOverlay />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
