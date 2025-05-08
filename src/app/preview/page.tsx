"use client";

import React, { useEffect, useState } from "react";

import LandingPagePreview from "@/components/generatedLanding/LandingPagePreview";
import PreviewDebugHelper from "./PreviewDebugHelper"; // Import the debug component
import type { GPTOutput } from "@/modules/prompt/types";

import { cleanAndDownloadHTML } from "@/modules/generatedLanding/htmlDownloadUtil"

export default function PreviewPage() {
  const [data, setData] = useState<GPTOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkForData = () => {
      try {
        const stored = localStorage.getItem("lessgo_preview_data");
        console.log("Retrieved from localStorage:", stored ? `data found (${stored.length} chars)` : "no data");
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            console.log("Successfully parsed preview data");
            setData(parsed);
          } catch (e) {
            console.error("Failed to parse preview data:", e);
            setError("Failed to parse preview data. The data might be corrupted.");
          }
        } else {
          setError("No preview data found in localStorage. Please return to the main page and try again.");
        }
      } catch (e) {
        console.error("Error accessing localStorage:", e);
        setError("Error accessing localStorage. This might be due to browser restrictions or private browsing mode.");
      }
    };

    // Check immediately
    checkForData();
    
    // Also set up a small polling mechanism to check for data a few times
    // This helps if the preview page loads before data is fully saved
    const checkInterval = setInterval(checkForData, 500);
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
    }, 3000); // Stop checking after 3 seconds
    
    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, []);



  if (error) {
    return (
      <div className="p-8 text-red-500 flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p>{error}</p>
        <div className="mt-6 space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mx-2"
          >
            Reload Page
          </button>
          <button
            onClick={() => window.close()}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded mx-2"
          >
            Close Preview
          </button>
        </div>
        {/* Include the debug helper even on error screens */}
        <PreviewDebugHelper />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-gray-500 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4">Loading preview data...</div>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-500 mx-auto"></div>
          {/* Include the debug helper on loading screen */}
          {/* <PreviewDebugHelper /> */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingPagePreview data={data} dispatch={() => {}} isStaticExport={true} />

      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
        <button
          onClick={() => cleanAndDownloadHTML(data)}
          className="bg-brand-accentPrimary text-white px-5 py-2 rounded-md font-semibold text-sm hover:bg-brand-logo transition"
        >
          Download HTML
        </button>
      </div>
      {/* Include the debug helper on successful preview */}
      {/* <PreviewDebugHelper /> */}
    </div>
  );
}