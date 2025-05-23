// components/PreviewButton.tsx
import React from "react";
import posthog from "posthog-js";

type Props = {
  pageData: any; // Replace with your edited state type if available
};

export default function PreviewButton({ pageData }: Props) {
  const handlePreview = () => {
    if (!pageData) {
      alert("Preview data is missing.");
      return;
    }

    try {
      localStorage.setItem("lessgo_preview_data", JSON.stringify(pageData));
      posthog.capture("preview_triggered");

      setTimeout(() => {
        const previewWindow = window.open("/preview", "_blank");
        if (!previewWindow) {
          alert("Popup blocked. Please allow popups.");
        }
      }, 100);
    } catch (e) {
      console.error("Preview failed:", e);
      alert("Failed to generate preview.");
    }
  };

  return (
    <button
  onClick={handlePreview}
  className="bg-brand-accentPrimary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-brand-logo transition-colors"

>
  Preview
</button>
  );
}
