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
import AuthRefreshWatcher from "@/components/AuthRefreshWatcher";
import { cookies } from "next/headers";
import {
  MOTION_PREFERENCE_COOKIE,
  parseMotionPreference,
} from "@/lib/motion-preference";
import { MotionPreferenceProvider } from "@/components/MotionPreferenceProvider";
import {
  THEME_PREFERENCE_COOKIE,
  parseThemePreference,
} from "@/lib/theme-preference";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const motionPreference = parseMotionPreference(
    cookieStore.get(MOTION_PREFERENCE_COOKIE)?.value
  );
  const htmlMotion = motionPreference === "reduced" ? "reduced" : "full";
  const themePreference = parseThemePreference(
    cookieStore.get(THEME_PREFERENCE_COOKIE)?.value
  );
  const htmlTheme =
    themePreference === "dark"
      ? "dark"
      : themePreference === "light"
      ? "light"
      : "system";
  const htmlDarkClass = htmlTheme === "dark" ? "dark" : "";

  return (
    <html
      lang="ko"
      className={`h-full ${htmlDarkClass}`}
      data-motion={htmlMotion}
      data-theme={htmlTheme}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${htmlDarkClass}`}
        data-theme={htmlTheme}
      >
        <SupabaseProvider>
          <AuthRefreshWatcher />
          <MotionPreferenceProvider initialPreference={motionPreference}>
            <ThemeProvider initialPreference={themePreference}>
              <Toaster position="top-center" richColors duration={2500} closeButton />
              <ClickSpark />
              <PageTransitionOverlayProvider>
                <Header />
                <AppShell>{children}</AppShell>
              </PageTransitionOverlayProvider>
            </ThemeProvider>
          </MotionPreferenceProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}

