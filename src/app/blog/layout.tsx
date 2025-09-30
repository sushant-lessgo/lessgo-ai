import Link from "next/link";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl font-bold text-brand-logo">Lessgo.ai</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/blog"
              className="text-gray-700 hover:text-brand-logo transition-colors font-medium"
            >
              Blog
            </Link>
            <Link
              href="/"
              className="text-gray-700 hover:text-brand-logo transition-colors"
            >
              Home
            </Link>
            <Link
              href="/#features"
              className="text-gray-700 hover:text-brand-logo transition-colors"
            >
              Features
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-180px)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-3">Lessgo.ai</h3>
              <p className="text-gray-600 text-sm">
                AI-powered landing page builder for startup founders.
                Launch high-converting pages in minutes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/" className="hover:text-brand-logo transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/#features" className="hover:text-brand-logo transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-brand-logo transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Connect</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a
                    href="https://twitter.com/LessgoSushant"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-logo transition-colors"
                  >
                    Twitter
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Lessgo.ai. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}