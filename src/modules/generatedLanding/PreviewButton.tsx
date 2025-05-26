'use client';

import React from "react";
import posthog from "posthog-js";
import { useThemeStore } from "@/stores/useThemeStore";

type Props = {
  pageData: any; // Ideally type this as GPTOutput
  tokenId: string | null;
  inputText: string;
};

export default function PreviewButton({ pageData, tokenId, inputText }: Props) {
  const { primary, background, muted } = useThemeStore();
  
console.log("🔧 PreviewButton mounted with props:", { tokenId, inputText });

  const handlePreview = () => {

    console.log("🚀 handlePreview called with:", { tokenId, inputText, pageData });

    if (!pageData) {
      alert("Preview data is missing.");
      return;
    }

    try {
      // Inject updated theme into pageData before saving
      const updatedData = {
        ...pageData,
        theme: JSON.stringify({
          primary,
          background,
          muted,
        }),
        tokenId,
        inputText,
      };

      console.log("🔍 Updated Data before publish:", {
        tokenId,
        inputText,
        theme: updatedData.theme,
      });

      localStorage.setItem("lessgo_preview_data", JSON.stringify(updatedData));
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
