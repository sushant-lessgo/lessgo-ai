import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Static branded 404. Prerendered at build time (`/_not-found`), so NO `auth()`
// here — an RSC auth read would break the static prerender.
//
// Signed-out visitors to an unknown, non-public route never reach this page:
// `clerkMiddleware`'s `auth.protect()` redirects them to `/sign-in` FIRST — and
// that redirect resolves on-domain ONLY because phase 2 set
// `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` (the env var `clerkMiddleware`
// actually reads; ClerkProvider React props alone would send them to the hosted
// Account Portal). So this 404 is effectively the authed-user surface.
export const metadata = {
  title: 'Page not found — Lessgo AI',
};

export default function NotFound() {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="w-full py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4">
          <img src="/logo.svg" alt="Lessgo AI" className="h-12 md:h-14" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          404
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </main>

      <footer className="w-full py-6 text-center text-sm text-muted-foreground">
        © {year} Lessgo AI
      </footer>
    </div>
  );
}
