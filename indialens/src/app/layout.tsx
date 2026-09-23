import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";
import { AuthProvider } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://indialens.in"),
  title: {
    default: "IndiaLens · Student OS — India's Education & Career Intelligence System",
    template: "%s | IndiaLens · Student OS",
  },
  description:
    "India's first student operating system. Treats degrees as multi-decade capital assets: 20-year NPV, Monte Carlo debt stress testing, 3PL IRT psychometrics, and AI displacement surfaces. Priced per student, not per institution.",
  keywords: [
    "education ROI India",
    "college NPV calculator",
    "AI resilience score",
    "degree downside risk",
    "NIRF alternative",
    "actuarial career intelligence",
    "student priced ROI",
    "IIT MBA ROI India",
    "AI job automation risk",
    "college admissions intelligence India",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://indialens.in",
    siteName: "IndiaLens · Student OS",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@indialens_in",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

import { AppShell } from "@/components/AppShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Inter + JetBrains Mono + Newsreader */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-[#F5F5F7] antialiased selection:bg-rose-900/30 selection:text-rose-300">
        <PostHogProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <AuthModal />
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
