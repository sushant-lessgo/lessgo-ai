export default function Footer() {
  return (
    <footer className="w-full bg-slate-50 border-t border-gray-200 px-6 py-6 text-sm text-gray-600 shadow-inner">

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:justify-between md:items-start gap-6 text-center md:text-left">
        
        {/* Left: Beta message + feedback CTA */}
        <div className="space-y-2 max-w-md">
          <p>
            This is a beta version. Outputs may vary. Always review your landing page before using it publicly.
          </p>
          <p>
            Questions or feedback?{" "}
            <a
              href="mailto:support@lessgo.ai"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Email us
            </a>
            .
          </p>
          <p>
            Want to shape the future of Lessgo?{" "}
            <a
              href="https://calendly.com/your-link"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Book a 15-minute call
            </a>
            .
          </p>
        </div>

        {/* Right: Legal and Copyright */}
        <div className="text-gray-500 text-sm flex flex-col md:items-end gap-2">
          <p>© 2025 Lessgo.ai. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">
              Terms
            </a>
            <a href="#" className="hover:underline">
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
