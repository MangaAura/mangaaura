import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { InstallPrompt, OfflineIndicator, ServiceWorkerRegistration, PushNotificationManager } from "@/components/pwa";
import "./globals.css";

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
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
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
    // Example: send to analytics
    // analytics.track(metric.name, metric);
    console.log("[Web Vitals]", metric);
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://**.vercel-storage.com" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          {/* PWA Components - inside Providers to access SessionContext */}
          <InstallPrompt />
          <OfflineIndicator />
          <ServiceWorkerRegistration />
          <PushNotificationManager />
        </Providers>
      </body>
    </html>
  );
}
