import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { StatsBar } from "@/components/StatsBar";
import { Footer } from "@/components/Footer";
import { PostHogProvider } from "@/components/PostHogProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://theproject.edu.in"),
  title: {
    default: "The Project — Rankings measure institutions. The Project measures the student.",
    template: "%s | The Project",
  },
  description: "India's first quantitative Education & Career Intelligence Operating System. Treats degrees as multi-decade financial assets with 20-year NPV, Monte Carlo debt stress testing, and AI displacement surfaces.",
  keywords: ["education ROI", "college NPV", "degree downside risk", "NIRF alternative", "actuarial career intelligence", "student-priced ROI"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://theproject.edu.in",
    siteName: "The Project",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@theproject_edu",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

import { AuthProvider } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PostHogProvider>
          <AuthProvider>
            <Navbar />
            <StatsBar />
            <main style={{ paddingTop: 84 }}>{children}</main>
            <Footer />
            <AuthModal />
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}

