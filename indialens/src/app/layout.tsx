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
import { CookieConsent } from "@/components/CookieConsent";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `suppressHydrationWarning` is required and not a shortcut: the inline
    // script below writes `data-theme` on <html> before React hydrates, so the
    // server-rendered attribute and the client one differ by design. Without
    // this, React logs a mismatch on every page load.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inter + JetBrains Mono. Loaded twice (here and via the @import in
            globals.css) — see DESIGN-SYSTEM.md; the @import is the one to
            remove, and it was left alone here to keep this diff reviewable. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Applies the stored theme before first paint. Blocking on purpose:
            deferring it is what causes the white flash this exists to prevent. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=/(?:^|;\\s*)vividhedu_consent=([^;]*)/.exec(document.cookie);" +
              "var r=m?decodeURIComponent(m[1]):'';" +
              "if(/^\\d+\\.1\\.[01]\\.\\d+$/.test(r)){var s=null;try{s=localStorage.getItem('il-theme')}catch(e){}" +
              "if(s==='dark'||s==='light'){document.documentElement.setAttribute('data-theme',s);return}}}" +
              "document.documentElement.setAttribute('data-theme','light')})();",
          }}
        />
      </head>
      {/* Tokens, not literals. The old `bg-[#F8FAFC] text-zinc-950` here was a
          hardcoded light background sitting on <body> — it painted over the
          dark theme on every dark-mode page, which is why `background-color:
          var(--bg)` in globals.css could never actually be seen. */}
      <body className="t-bg t-text antialiased selection:bg-[var(--accent-dim)] selection:text-[var(--text-primary)]">
        <PostHogProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <AuthModal />
            <CookieConsent />
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
