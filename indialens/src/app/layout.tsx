import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";
import { AuthProvider } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { APP_URL, BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.descriptor}`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "India's student decision operating system. Treats a degree as a multi-decade capital asset: 20-year NPV, Monte Carlo debt stress testing, 3PL IRT psychometrics, and AI displacement surfaces. Priced per student, not per institution.",
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
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: BRAND.name,
    images: [{ url: "/api/og", width: 1200, height: 630, alt: `${BRAND.name} — ${BRAND.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description:
      "Price the degree as an asset. 20-year NPV, Monte Carlo debt stress testing, and AI displacement scoring for Indian students.",
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
      <body className="bg-[#F8FAFC] text-zinc-950 antialiased selection:bg-rose-100 selection:text-rose-900">
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
