import { useState } from "react";
import { event } from '@/lib/gtag';
interface WaitlistFormProps {
  formPosition: 'top' | 'bottom';
}

export default function WaitlistForm({ formPosition }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    if (res.ok) {

      event({
      action: 'email_submitted', // This is your GA4 Event Name
      params: {
        // Use descriptive parameters. These will appear in GA4.
        // You can register them as custom dimensions in GA4 UI for easier reporting.
        form_id: `waitlist_form_${formPosition}`, // e.g., 'waitlist_form_footer'
        form_name: 'Waitlist Subscription',      // A general name for the type of form
        // 'event_category': 'engagement', // You can still send this if you have a use for it,
        // 'event_label': `waitlist_form_${formPosition}`, // but custom params are often more flexible in GA4.
        // 'value': 10 // Only include 'value' if it represents a monetary amount.
                      // If so, also consider sending 'currency': 'USD' (or your currency).
      },
    });

      setStatus("success");
      setEmail("");
    } else {
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 px-4">

      {status === "success" ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-md text-center shadow-md">
        <p className="text-lg font-bold">
          You're In! Your Early Access Spot is Reserved.
        </p>
        <p className="text-sm mt-2">
          You'll get exclusive updates, early previews, and first access to Lessgo.ai 🤝
        </p>
      </div>
      
      
      
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2 md:gap-4 w-full">

        <input
        type="email"
        placeholder="Enter your best email"
        className="flex-1 w-full p-4 border text-[1.15rem] border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accentPrimary focus:outline-none"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
        required
      />

      <button
        type="submit"
        className="w-full md:w-auto bg-brand-accentPrimary text-white font-semibold px-6 py-4 rounded-md hover:bg-orange-600 transition-all duration-200"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Joining..." : " Get Early Access!"}
      </button>

        </form>
      )}
      {status === "error" && (
        <p className="text-red-500 text-center mt-2">Oops! Something went wrong.</p>
      )}
    </div>
  );
} 