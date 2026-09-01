import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { ThemeProvider } from "@/components/theming/ThemeProvider";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { directionFor, resolveLocale } from "@/lib/i18n/messages";
import "./globals.css";

export const metadata: Metadata = { title: "Mythra", description: "A context-aware long-form writing environment" };

const themeScript = `(()=>{try{const t=localStorage.getItem('mythra.theme')||'system';const r=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.dataset.theme=r;document.documentElement.style.colorScheme=r==='dark'?'dark':'light'}catch{}})()`;

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get("x-mythra-locale") ?? requestHeaders.get("accept-language"));
  const direction = directionFor(locale);
  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body><Script id="mythra-theme-bootstrap" strategy="beforeInteractive">{themeScript}</Script><LocaleProvider locale={locale}><ThemeProvider>{children}</ThemeProvider></LocaleProvider></body>
    </html>
  );
}
