import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Lessgo AI — Sign in or create your account',
};

export default async function WelcomePage() {
  // Signed-in users never see the entry page — send them straight to the app.
  // (Independent of middleware; covers direct /welcome hits.)
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="w-full py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4">
          <img src="/logo.svg" alt="Lessgo AI" className="h-12 md:h-14" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
          Lessgo AI
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          Generate, edit, and publish a high-converting website for your business
          in minutes.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/sign-up">Sign up</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </main>

      <footer className="w-full py-6 text-center text-sm text-muted-foreground">
        © {year} Lessgo AI
      </footer>
    </div>
  );
}
