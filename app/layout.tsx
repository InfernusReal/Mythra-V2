import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theming/ThemeProvider";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { getRequestI18n } from "@/lib/i18n/request";
import { earlyCommandIntentScript } from "@/lib/commands/early-intent";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getRequestI18n();
  return { title: messages.productName, description: messages.appDescription };
}

const themeScript = `(()=>{try{const t=localStorage.getItem('mythra.theme')||'system';const r=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.dataset.theme=r;document.documentElement.style.colorScheme=r==='dark'?'dark':'light'}catch{}})()`;

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { locale, direction } = await getRequestI18n();
  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body>
        <Script id="mythra-theme-bootstrap" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <Script id="mythra-command-intent-bootstrap" strategy="beforeInteractive">
          {earlyCommandIntentScript}
        </Script>
        <LocaleProvider locale={locale}>
          <ThemeProvider>{children}</ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
