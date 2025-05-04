export default function Footer() {
  return (
    <footer className="w-full border-t bg-white px-4 py-6 text-sm text-gray-600">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-center md:text-left">
        {/* Left: Beta message + feedback CTA */}
        <div className="space-y-1">
          <p>
            This is a beta version. Outputs may vary. Please review your copy before publishing.
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

        {/* Right: Copyright + links */}
        <div className="text-gray-500 text-sm flex flex-col md:items-end gap-1">
          <p>© 2025 Lessgo.ai</p>
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
