import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { SkipLink } from "@/components/A11y/SkipLink";
import { PwaComponents } from '@/components/pwa/PwaComponents';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { AppFooter } from "@/components/Layout/AppFooter";
import { detectLocale } from "@/i18n/server";
import { validateEnv } from "@/lib/env";
import "./globals.css";

validateEnv();

// Optimize font loading with display: swap and preload
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
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

// Performance monitoring for production
export function reportWebVitals(metric: {
  id: string;
  name: string;
  startTime: number;
  value: number;
  label: string;
}) {
  // Send to analytics in production
  if (process.env.NODE_ENV === "production") {
    console.info("[Web Vitals]", metric.name, metric.value);
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await detectLocale();
  return (
    <html lang={locale} suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Prevent theme flash - inline before React hydrates */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var e=localStorage.getItem('inkverse-theme');if(e==='dark'||(e!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`
        }} />
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://**.vercel-storage.com" />
      </head>
<body className="font-sans antialiased flex flex-col min-h-screen">
      <ScrollProgress />
      <SkipLink />
      <div className="flex flex-col flex-1 noise">
      <Providers locale={locale}>
        {children}
        <PwaComponents />
        <AppFooter />
      </Providers>
    </div>
      </body>
    </html>
  );
}
