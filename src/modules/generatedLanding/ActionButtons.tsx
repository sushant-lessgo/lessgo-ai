import React from "react";

import type { GPTOutput } from "@/modules/prompt/types";

import { cleanAndDownloadHTML } from "@/modules/generatedLanding/htmlDownloadUtil"


type Props = {
  data: GPTOutput;
};

export default function ActionButtons({ data }: Props) {
  const handlePreview = () => {
    try {
      // Ensure data is properly serializable
      if (!data) {
        console.error("Preview data is undefined or null");
        alert("Preview data is missing. Cannot generate preview.");
        return;
      }
      
      // Test if localStorage is working
      try {
        localStorage.setItem("test_storage", "test");
        localStorage.removeItem("test_storage");
      } catch (storageError) {
        console.error("LocalStorage is not available:", storageError);
        alert("Your browser does not support or is blocking localStorage. Please check your privacy settings.");
        return;
      }
      
      // Store the data with explicit error handling
      const json = JSON.stringify(data);
      localStorage.setItem("lessgo_preview_data", json);
      
      // Add a console log to verify the data is being stored
      console.log("Preview data stored:", json.substring(0, 100) + "...");
      
      // Check if the data was actually stored
      const verifyStored = localStorage.getItem("lessgo_preview_data");
      if (!verifyStored) {
        console.error("Failed to store data in localStorage");
        alert("Failed to store preview data. Please check browser storage settings.");
        return;
      }
      
      // Use a small timeout to ensure storage completes before opening window
      setTimeout(() => {
        const previewWindow = window.open("/preview", "_blank");
        if (!previewWindow) {
          alert("Your browser blocked opening the preview window. Please allow popups for this site.");
        }
      }, 100);
    } catch (e) {
      console.error("Failed to handle preview:", e);
      alert("Failed to create preview: " + (e instanceof Error ? e.message : String(e)));
    }
  };



  return (
    <div className="w-full max-w-[800px] bg-slate-50 border-t border-brand-border py-4 px-4 flex justify-end gap-4">
      <button
        onClick={handlePreview}
        className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition"
      >
        Preview
      </button>
      <button
        onClick={() => cleanAndDownloadHTML(data)}
        className="bg-brand-accentPrimary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-brand-logo transition"
      >
        Download HTML
      </button>
    </div>
  );
}