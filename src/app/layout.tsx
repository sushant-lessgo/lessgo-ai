import type { Metadata } from "next";
import Script from 'next/script'
import { GeistSans, GeistMono } from 'geist/font';
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://lessgo.ai'),
  title: "Lessgo.ai – The AI Landing Page Builder for Startup Founders",
  description:
    "Lessgo.ai is the AI landing page builder made for startup founders. Instantly generate high-converting landing pages from a single input – no code, no writing hassle. Join the waitlist now!",
    keywords: [
      "AI landing page builder",
      "startup landing page tool",
      "generate landing page with AI",
      "no-code landing page generator",
      "landing page copy AI",
    ],
    // themeColor: "#111827",
    alternates: {
      canonical: "https://lessgo.ai",
    },
  openGraph: {
    title: "Lessgo.ai – The AI Landing Page Builder for Startup Founders",
    description:
      "Lessgo.ai is the AI landing page builder for startup founders. Instantly generate high-converting landing pages without coding or writing.",
    url: "https://lessgo.ai",
    siteName: "Lessgo.ai",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Lessgo.ai - AI-powered landing page builder for startup founders",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lessgo.ai – The AI Landing Page Builder for Startup Founders",
    description:
      "Generate high-converting landing pages with Lessgo.ai – the AI-powered builder built for startup founders. Fast, smart, and no-code.",
      images: [
        {
          url: "/og-image.jpg",
          alt: "Lessgo.ai – AI landing page builder screenshot",
        },
      ],
    creator: "@LessgoSushant", // Replace with your actual Twitter handle
  },
  authors: [{ name: "Sushant Jain", url: "https://lessgo.ai" }],
  publisher: "Lessgo.ai",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>

      {/* Hotjar */}
      <Script
  id="hotjar-script"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      (function (c, s, q, u, a, r, e) {
        c.hj = c.hj || function () { (c.hj.q = c.hj.q || []).push(arguments) };
        c._hjSettings = { hjid: 6371891 };
        r = s.getElementsByTagName('head')[0];
        e = s.createElement('script');
        e.async = true;
        e.src = q + c._hjSettings.hjid + u;
        r.appendChild(e);
      })(window, document, 'https://static.hj.contentsquare.net/c/csq-', '.js', 6371891);
    `,
  }}
/>
        
{/* Google Analytics */}
<Script
          strategy="beforeInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-DM2YZB9VYG"
        />
        <Script
          id="ga-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', 'G-DM2YZB9VYG'), { debug_mode: true });
            `,
          }}
        />

      </head>
      <body className={`${GeistSans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
