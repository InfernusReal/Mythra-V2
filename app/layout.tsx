import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theming/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = { title: "Mythra", description: "A context-aware long-form writing environment" };

const themeScript = `(()=>{try{const t=localStorage.getItem('mythra.theme')||'system';const r=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.dataset.theme=r;document.documentElement.style.colorScheme=r}catch{}})()`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><Script id="mythra-theme-bootstrap" strategy="beforeInteractive">{themeScript}</Script></head>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
