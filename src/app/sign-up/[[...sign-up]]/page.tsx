import { SignUp } from '@clerk/nextjs';

export const metadata = {
  title: 'Lessgo AI — Create your account',
};

export default function SignUpPage() {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="w-full py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4">
          <img src="/logo.svg" alt="Lessgo AI" className="h-12 md:h-14" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <SignUp />
      </main>

      <footer className="w-full py-6 text-center text-sm text-muted-foreground">
        © {year} Lessgo AI
      </footer>
    </div>
  );
}
