// app/terms/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Lessgo.ai",
  description: "Read the terms and conditions for using Lessgo.ai.",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-sm text-gray-800 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <p><strong>Effective Date:</strong> 26-05-2025</p>

      <p>
        Welcome to <strong>Lessgo.ai</strong> ("we", "our", or "us"). These Terms of Service ("Terms") govern your access to and use of our website and services. By using Lessgo.ai, you agree to be bound by these Terms.
      </p>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">1. Who We Are</h2>
        <ul className="list-disc list-inside">
          <li><strong>Business Name:</strong> Lessgo AI</li>
          <li><strong>Legal Form:</strong> Eenmanszaak (sole proprietorship, Netherlands)</li>
          <li><strong>KVK Number:</strong> 97014273</li>
          <li><strong>Contact Email:</strong> hello@lessgo.ai</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">2. Use of Service</h2>
        <p>
          Lessgo.ai allows users to generate AI-based landing pages using short input prompts. The generated content and pages are stored on our infrastructure (hosted on Vercel).
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>Use the service only for lawful purposes</li>
          <li>Do not copy, modify, distribute, or reverse-engineer any part of the service</li>
          <li>Do not misuse the service to harm others or breach laws</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">3. Account and Access</h2>
        <p>
          Authentication is managed via Clerk. By signing up, you agree to Clerk’s terms of service. You are responsible for maintaining the security of your account.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">4. Ownership and User Content</h2>
        <ul className="list-disc list-inside">
          <li>All user-generated content (e.g., landing pages, projects) remains your property.</li>
          <li>You grant us a non-exclusive license to store, display, and use your content solely to provide the service.</li>
          <li>We do not claim ownership of any AI-generated content.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">5. Payments (Upcoming)</h2>
        <p>
          Lessgo.ai is currently free. In the future, we may introduce paid plans. Terms of billing, refunds, and pricing will be published at that time.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">6. Availability</h2>
        <p>
          We do not currently guarantee uptime or service availability. We may update the platform or discontinue features without prior notice.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">7. Data Handling and Privacy</h2>
        <p>
          We use third-party providers (Clerk, PostHog, OpenAI, Mistral AI) to operate our platform. Please refer to our{" "}
          <a href="/privacy" className="underline text-blue-600">Privacy Policy</a> for detailed information on data handling and user rights under GDPR.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">8. Termination</h2>
        <p>
          You may stop using the service at any time. We may terminate or suspend access without notice if you breach these Terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">9. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Lessgo.ai shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">10. Governing Law</h2>
        <p>
          These Terms are governed by Dutch law. Disputes shall be subject to the jurisdiction of the courts in the Netherlands.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">11. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Material changes will be notified via email or platform notices.
        </p>
      </section>

      <p>
        For any questions, contact us at <a href="mailto:hello@lessgo.ai" className="underline text-blue-600">hello@lessgo.ai</a>.
      </p>
    </main>
  );
}
