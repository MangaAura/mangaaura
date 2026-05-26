import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { headers } from 'next/headers';
import { Suspense } from 'react';

import { AppFooter } from "@/components/Layout/AppFooter";
import { Providers } from "@/components/Providers";
import { PwaComponents } from '@/components/pwa/PwaComponents';
import { detectLocale } from "@/i18n/server";
import { ensureInfrastructure } from "@/infrastructure/init";
import { validateEnv } from "@/lib/env";
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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MangaAura — Lee, crea y crowdfundea manga con IA",
    template: "%s | MangaAura",
  },
  description: "La plataforma de manga con IA que te permite leer, crear y crowdfundear capítulos. Únete a miles de creadores y lectores.",
  keywords: ["manga", "crear manga online", "publicar manga", "crowdfunding manga", "leer manga", "anime", "mangaaura", "comics", "inteligencia artificial manga"],
  authors: [{ name: "MangaAura" }],
  manifest: "/manifest.json",
  alternates: {
    canonical: siteUrl,
    languages: {
      'x-default': siteUrl,
      es: siteUrl,
      en: `${siteUrl}/en`,
    },
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    title: "MangaAura — Lee, crea y crowdfundea manga con IA",
    description: "La plataforma de manga con IA que te permite leer, crear y crowdfundear capítulos.",
    siteName: "MangaAura",
    locale: "es_ES",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MangaAura" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MangaAura — Lee, crea y crowdfundea manga con IA",
    description: "La plataforma de manga con IA que te permite leer, crear y crowdfundear capítulos.",
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
    title: "MangaAura",
    statusBarStyle: "black-translucent",
  },
  applicationName: "MangaAura",
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

export function reportWebVitals(metric: {
  id: string;
  name: string;
  startTime: number;
  value: number;
  label: string;
}) {
  // Send Core Web Vitals to analytics
  if (typeof window !== 'undefined') {
    const body = {
      id: metric.id,
      name: metric.name, // LCP, CLS, INP, FCP, TTFB
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      label: metric.label,
      page: window.location.pathname,
      timestamp: Date.now(),
    };

    // Use sendBeacon for reliable delivery on page unload
    try {
      navigator.sendBeacon('/api/analytics/web-vitals', JSON.stringify(body));
    } catch {
      // Fallback: silent (analytics are best-effort)
    }

    // Also report poor Web Vitals to Sentry for debugging
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      const thresholds: Record<string, number> = {
        LCP: 2500, // 2.5s
        INP: 200,  // 200ms
        CLS: 0.1,  // 0.1
        FCP: 1800, // 1.8s
        TTFB: 800, // 800ms
      };
      const threshold = thresholds[metric.name];
      if (threshold && metric.value > threshold) {
        import('@sentry/nextjs').then((Sentry) => {
          Sentry.captureMessage(
            `Poor ${metric.name}: ${metric.value}`,
            { level: 'warning', tags: { metric: metric.name, page: window.location.pathname } }
          );
        }).catch(() => {});
      }
    }
  }
}

async function DynamicProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 noise">
      <Suspense fallback={null}>
        {children}
      </Suspense>
      <Suspense fallback={null}>
        <PwaComponents />
      </Suspense>
      <Suspense fallback={null}>
        <AppFooter />
      </Suspense>
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
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <script
          id="theme-init"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=localStorage.getItem("mangaaura-theme");if(e==="dark"||(e!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`
          }}
        />
        <Providers locale={htmlLang}>
          <Suspense fallback={<div className="flex flex-col flex-1 noise" />}>
            <DynamicProviders>{children}</DynamicProviders>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
