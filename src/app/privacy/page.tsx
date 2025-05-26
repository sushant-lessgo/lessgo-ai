// app/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Lessgo.ai",
  description: "Learn how Lessgo.ai handles your personal data in compliance with GDPR.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-sm text-gray-800 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p><strong>Effective Date:</strong> 26-05-2025</p>

      <p>
        This Privacy Policy explains how Lessgo.ai ("we", "our", or "us") collects, uses, and protects your personal data in compliance with the EU General Data Protection Regulation (GDPR).
      </p>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">1. Who We Are</h2>
        <ul className="list-disc list-inside">
          <li><strong>Data Controller:</strong> Lessgo AI</li>
          <li><strong>Legal Form:</strong> Eenmanszaak, Netherlands</li>
          <li><strong>KVK Number:</strong> 97014273</li>
          <li><strong>Contact:</strong> hello@lessgo.ai</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">2. What Data We Collect</h2>
        <ul className="list-disc list-inside">
          <li>Email address (via Clerk)</li>
          <li>Authentication data (via Clerk)</li>
          <li>Analytics data such as IP, behavior (via PostHog)</li>
          <li>AI input prompts and generated content (stored on Vercel)</li>
        </ul>
        <p>We do not knowingly collect sensitive personal data.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">3. Purpose and Legal Basis</h2>
        <ul className="list-disc list-inside">
          <li>To provide and improve the Lessgo.ai service</li>
          <li>To manage authentication and access (legitimate interest)</li>
          <li>To analyze usage patterns and improve UX (consent via analytics)</li>
          <li>To generate and store your content (contractual necessity)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">4. Data Processors and Sub-Processors</h2>
        <ul className="list-disc list-inside">
          <li><strong>Clerk</strong> – for authentication</li>
          <li><strong>PostHog</strong> – for analytics</li>
          <li><strong>OpenAI & Mistral AI</strong> (via Nebius) – for content generation</li>
          <li><strong>Vercel</strong> – for storage and hosting</li>
        </ul>
        <p>Each provider complies with GDPR through Data Processing Agreements (DPAs).</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">5. Data Retention</h2>
        <p>
          We retain your data as long as you use our service. If you stop using it, we may retain limited data for legal or operational reasons.
        </p>
        <p>
          Data export or deletion options are not currently offered but are on our roadmap.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">6. Your Rights Under GDPR</h2>
        <ul className="list-disc list-inside">
          <li>Access your data</li>
          <li>Request correction or deletion</li>
          <li>Object to or restrict processing</li>
          <li>Data portability</li>
          <li>File a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens)</li>
        </ul>
        <p>To exercise your rights, contact us at <a href="mailto:hello@lessgo.ai" className="underline text-blue-600">hello@lessgo.ai</a>.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">7. International Data Transfers</h2>
        <p>
          Data may be processed outside the EU by third parties. We ensure such transfers are protected by Standard Contractual Clauses (SCCs) or equivalent mechanisms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">8. Cookies and Tracking</h2>
        <p>
          We use analytics tools that may set cookies or similar identifiers. You can manage cookie preferences through your browser settings.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">9. Updates to this Policy</h2>
        <p>
          We may update this Privacy Policy. Significant changes will be communicated via email or on the platform.
        </p>
      </section>

      <p>
        For any questions or requests, contact us at <a href="mailto:hello@lessgo.ai" className="underline text-blue-600">hello@lessgo.ai</a>.
      </p>
    </main>
  );
}
