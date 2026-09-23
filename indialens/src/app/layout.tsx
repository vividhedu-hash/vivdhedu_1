import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,600&display=swap"
          rel="stylesheet"
        />
        {/* Clash Display (display headings) */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PostHogProvider>
          <AuthProvider>
            <Navbar />
            <main style={{ paddingTop: 60 }}>{children}</main>
            <Footer />
            <AuthModal />
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
