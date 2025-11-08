import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import SupabaseProvider from "@/components/supabase-provider";
import AppShell from "@/components/AppShell";
import { PageTransitionOverlayProvider } from "@/components/PageTransitionOverlay";
import ClickSpark from "@/components/ClickSpark";
import ThemeProvider from "@/components/ThemeProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "미래·사회변화주도 프로젝트",
  description: "미래·사회변화주도 프로젝트 협업 틀",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} h-full antialiased`}
      >
        <SupabaseProvider>
          <ThemeProvider>
            <Toaster position="top-center" richColors duration={2500} closeButton />
            <ClickSpark />
            <PageTransitionOverlayProvider>
              <Header />
              <AppShell>{children}</AppShell>
            </PageTransitionOverlayProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}

