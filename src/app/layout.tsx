import type { Metadata } from "next";
// import Script from 'next/script'

import posthog from "posthog-js";
import { PostHogProvider } from '@/providers/ph-provider'
import { GeistSans, GeistMono } from 'geist/font';
import "./globals.css";
// Template @font-face declarations (self-hosted). Published pages load these via
// p/layout.tsx; without this import the editor + preview rendered fallback fonts
// (QA vestria: display serif fell back to a slab serif). Declarations are lazy —
// browsers only download faces actually used on screen.
import "@/styles/fonts-self-hosted.css";
// App-chrome @font-face declarations (Onest, JetBrains Mono 600, Material Symbols
// Rounded, Caveat). Imported ONLY here in the root app layout — NOT inlined into
// public/published.css and NOT loaded by p/layout.tsx, so these families add zero
// bytes to published pages. Lazy: only faces used on screen download.
import "@/styles/fonts-app-chrome.css";
// App-chrome scope class (.app-chrome) + Material Symbols icon base (.app-icon).
// Imported ONLY here in the root app layout — NOT loaded by p/layout.tsx and NOT
// inlined into public/published.css, so it adds zero bytes to published pages.
// `.app-chrome` is applied to NO screen by this feature; consuming specs attach it.
import "@/styles/app-chrome.css";
// import GoogleAnalytics from '@/components/GoogleAnalytics';
import { Suspense } from 'react';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs'

import { TooltipProvider } from "@/components/ui/tooltip"


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
          alt: "Lessgo AI – AI landing page builder screenshot",
        },
      ],
    creator: "@LessgoSushant", // Replace with your actual Twitter handle
  },
  authors: [{ name: "Sushant Jain", url: "https://lessgo.ai" }],
  publisher: "Lessgo AI",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {




  // Cross-origin redirect allowance for the apex→app split: Clerk strips
  // redirect_urls whose origin isn't allow-listed, so the hosted portal must be
  // told app.lessgo.ai (NEXT_PUBLIC_DASHBOARD_URL) and the apex origins are OK.
  // Includes the app origin only when the rollout var is set; falsy entries
  // filtered so this is a no-op pre-cutover. Relative force-redirect URLs below
  // stay host-relative (correct on whichever host serves the page).
  const allowedRedirectOrigins: string[] = [
    'https://lessgo.ai',
    'https://www.lessgo.ai',
    process.env.NEXT_PUBLIC_DASHBOARD_URL,
  ].filter((o): o is string => Boolean(o))

  // Founding-cohort auth copy (auth-redesign). These are FLOW-SCOPED keys —
  // `signUp.start.*` and `signIn.start.*` are distinct namespaces, so setting both
  // cannot collide, and no shared/global key is touched (a global override like
  // `formButtonPrimary` would leak into UserButton/UserProfile forms). Purely
  // presentational: Clerk still owns every flow, step and redirect.
  const authLocalization = {
    signUp: {
      start: {
        title: 'Claim your founding seat',
        titleCombined: 'Claim your founding seat',
        subtitle:
          'Invite-only access to Lessgo. Set up in minutes, no credit card required.',
        subtitleCombined:
          'Invite-only access to Lessgo. Set up in minutes, no credit card required.',
        actionText: 'Already have an account?',
        actionLink: 'Log in',
      },
    },
    signIn: {
      start: {
        title: 'Welcome back',
        titleCombined: 'Welcome back',
        subtitle: 'Pick up where you left off.',
        subtitleCombined: 'Pick up where you left off.',
        actionText: 'New here?',
        actionLink: 'Claim your seat',
      },
    },
  }

  return (
    <ClerkProvider
      allowedRedirectOrigins={allowedRedirectOrigins}
      localization={authLocalization}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signUpForceRedirectUrl="/dashboard"
      signInForceRedirectUrl="/dashboard"
    >
      <html lang="en">
        <head>
          {/* App-chrome font preloads (app surface only; see fonts-app-chrome.css).
              Onest 400/600 = the two most-used chrome weights; Material Symbols
              subset = icon font used across chrome. Published pages preload their
              own template hero font via CriticalFontPreload — untouched here. */}
          <link
            rel="preload"
            as="font"
            type="font/woff2"
            href="/fonts/onest/onest-latin-400-normal.woff2"
            crossOrigin="anonymous"
          />
          <link
            rel="preload"
            as="font"
            type="font/woff2"
            href="/fonts/onest/onest-latin-600-normal.woff2"
            crossOrigin="anonymous"
          />
          <link
            rel="preload"
            as="font"
            type="font/woff2"
            href="/fonts/material-symbols-rounded/material-symbols-rounded.woff2"
            crossOrigin="anonymous"
          />
        </head>
        <body className="antialiased">
          <TooltipProvider>
          <PostHogProvider>
            {children}
          </PostHogProvider>
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}




// Google analytica and hotjar not required for now

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <head>

//       {/* Hotjar */}
//       <Script
//   id="hotjar-script"
//   strategy="afterInteractive"
//   dangerouslySetInnerHTML={{
//     __html: `
//       (function (c, s, q, u, a, r, e) {
//         c.hj = c.hj || function () { (c.hj.q = c.hj.q || []).push(arguments) };
//         c._hjSettings = { hjid: 6371891 };
//         r = s.getElementsByTagName('head')[0];
//         e = s.createElement('script');
//         e.async = true;
//         e.src = q + c._hjSettings.hjid + u;
//         r.appendChild(e);
//       })(window, document, 'https://static.hj.contentsquare.net/c/csq-', '.js', 6371891);
//     `,
//   }}
// />
        

//       </head>
//       <body className={`${GeistSans.className} antialiased`}>
//         {children}

//         <Suspense>
//           <GoogleAnalytics />
//         </Suspense>
//         {/* Moved here: End of the body is a common and good practice */}
//         <Suspense fallback={null}> {/* Suspense is good for client components that might have async operations */}
//           <GoogleAnalytics />
//         </Suspense>
//       </body>
//     </html>
//   );
// }