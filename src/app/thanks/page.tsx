export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 text-gray-900">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold text-green-600">
          You're officially in!
        </h1>

        <p className="text-lg">
          Welcome to the founding circle of <span className="font-semibold">Lessgo.ai</span>, AI-powered coversion-focused landing page builder.
        </p>

        <div className="space-y-4">
  <a
    href="https://lessgo.ai/dashboard"
    className="inline-block bg-brand-logo text-white font-semibold px-6 py-3 rounded-xl shadow hover:bg-brand-accentPrimary transition"
  >
    Try Lessgo.ai Now!
  </a>

  <p className="text-sm text-gray-700">
    Or, if you're curious to chat - you can{' '}
    <a
      href="https://calendly.com/sushant-lessgo/30min"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline hover:text-blue-800 font-medium"
    >
      book a 1:1 call with me here.
    </a>
  </p>
</div>


        <div className="text-left mt-8 space-y-4 border-t border-gray-200 pt-10">
          <h2 className="text-xl font-semibold">What happens next?</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>You now have early access to Lessgo.ai</li>
            <li>Expect occasional updates from the founder</li>
            <li>You'll receive founder-only perks & early features</li>
          </ul>
        </div>

        <div className="text-sm text-gray-600 mt-12">
          <p>
            Got feedback or ideas? I’d love to hear them.
            <br />
            👉 Just reply to your welcome email or email me directly at{' '}
            <a
              href="mailto:sushant@lessgo.ai"
              className="text-blue-600 underline hover:text-blue-800"
            >
              sushant@lessgo.ai
            </a>
          </p>
          <p className="mt-4">Let’s build something epic together!</p>
          <p className="font-semibold mt-2">– Sushant Jain, Founder</p>
        </div>
      </div>
    </main>
  );
}
