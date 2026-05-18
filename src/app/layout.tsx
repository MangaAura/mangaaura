import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { headers } from 'next/headers';
import Script from "next/script";
import { Suspense } from 'react';

import { AppFooter } from "@/components/Layout/AppFooter";
import { Providers } from "@/components/Providers";
import { PwaComponents } from '@/components/pwa/PwaComponents';
import { detectLocale } from "@/i18n/server";
import { validateEnv } from "@/lib/env";
import { ensureInfrastructure } from "@/infrastructure/init";
import "./globals.css";

validateEnv();
ensureInfrastructure();

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const displayFont = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InkVerse - Plataforma de Manga",
  description: "Descubre, lee y comparte manga de calidad en InkVerse. La mejor plataforma para creadores y lectores de manga.",
  keywords: ["manga", "lector", "anime", "comics", "inkverse", "lectura", "subtitulos"],
  authors: [{ name: "InkVerse" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    type: "website",
    title: "InkVerse - Plataforma de Manga",
    description: "Descubre, lee y comparte manga de calidad en InkVerse",
    siteName: "InkVerse",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "InkVerse - Plataforma de Manga",
    description: "Descubre, lee y comparte manga de calidad en InkVerse",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  appleWebApp: {
    capable: true,
    title: "InkVerse",
    statusBarStyle: "black-translucent",
  },
  applicationName: "InkVerse",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  colorScheme: "dark light",
};

export function reportWebVitals(_metric: {
  id: string;
  name: string;
  startTime: number;
  value: number;
  label: string;
}) {
}

async function DynamicProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await detectLocale();

  return (
    <div className="flex flex-col flex-1 noise">
      <Providers locale={locale}>
        <Suspense fallback={null}>
          {children}
        </Suspense>
        <Suspense fallback={null}>
          <PwaComponents />
        </Suspense>
        <Suspense fallback={null}>
          <AppFooter />
        </Suspense>
      </Providers>
    </div>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? '';
  const htmlLang = await detectLocale();

  return (
    <html lang={htmlLang} suppressHydrationWarning className={`${inter.variable} ${displayFont.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://**.vercel-storage.com" />
      </head>
      <Script id="theme-init" strategy="beforeInteractive" nonce={nonce} dangerouslySetInnerHTML={{
        __html: `(function(){try{var e=localStorage.getItem('inkverse-theme');if(e==='dark'||(e!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`
      }} />
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <Suspense fallback={<div className="flex flex-col flex-1 noise" />}>
          <DynamicProviders>{children}</DynamicProviders>
        </Suspense>
      </body>
    </html>
  );
}
