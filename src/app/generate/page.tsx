"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/stores/useThemeStore";
import posthog from "posthog-js";



import LandingPageRenderer from "@/modules/generatedLanding/LandingPageRenderer";

import type { GPTOutput } from "@/modules/prompt/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SlugModal } from '@/components/SlugModal';
import { logger } from '@/lib/logger';


export default function PreviewPage() {
  const [data, setData] = useState<GPTOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

const router = useRouter();
const [publishing, setPublishing] = useState(false);
const [publishSuccess, setPublishSuccess] = useState(false);
const [publishedUrl, setPublishedUrl] = useState("");
const [publishError, setPublishError] = useState("");

const [showSlugModal, setShowSlugModal] = useState(false);
const [customSlug, setCustomSlug] = useState('');


const [tokenId, setTokenId] = useState<string | null>(null);      // 🆕
const [inputText, setInputText] = useState<string>('');           // 🆕


const cta = data?.hero?.ctaConfig;
const isPublishDisabled =
  !cta?.cta_text || !(cta?.url || cta?.embed_code);


  useEffect(() => {
    const checkForData = () => {
      try {
        const stored = localStorage.getItem("lessgo_preview_data");
        
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            
            setData(parsed);

            setTokenId(parsed.tokenId || null);
             setInputText(parsed.inputText || "");
          } catch (e) {
            logger.error("Failed to parse preview data:", () => e);
            setError("Failed to parse preview data. The data might be corrupted.");
          }
        } else {
          setError("No preview data found in localStorage. Please return to the main page and try again.");
        }
      } catch (e) {
        logger.error("Error accessing localStorage:", () => e);
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

useEffect(() => {
  if (!data) return;

  // Parse data.theme which is a string (you said `theme: string` in GPTOutput)
  let parsedTheme: { primary?: string; background?: string; muted?: string } = {};

  try {
    parsedTheme = JSON.parse(data.theme || '{}');
  } catch (err) {
    logger.warn("Failed to parse theme from data.theme:", () => err);
  }

  useThemeStore.setState({
    primary: parsedTheme.primary || '#14B8A6',
    background: parsedTheme.background || '#F9FAFB',
    muted: parsedTheme.muted || '#6B7280',
  });

  const fullTheme = useThemeStore.getState().getFullTheme();
  Object.entries(fullTheme).forEach(([key, val]) => {
    document.documentElement.style.setProperty(key, val);
  });
}, [data]);






async function handlePublish() {

  const previewElement = document.getElementById('landing-preview');
if (!previewElement) {
  setPublishError('Failed to find preview content.');
  return;
}

const htmlContent = previewElement.innerHTML;

  if (!data || !customSlug) return;

  setPublishing(true);
  setPublishError('');

  try {
    // Step 1: Check if slug is available
    // const checkRes = await fetch(`/api/checkSlug?slug=${customSlug}`);
    // const checkData = await checkRes.json();

    // if (!checkRes.ok || !checkData.available) {
    //   setPublishError('This slug is already taken. Please choose a different one.');
    //   return;
    // }
    const { primary, background, muted } = useThemeStore.getState();
    // Step 2: Publish the page
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: customSlug,
        htmlContent, // can sanitize if needed
        title: data.hero?.headline || 'Untitled Page',
        content: data,
        themeValues: {
          primary,
          background,
          muted,
        },
        tokenId,
        inputText,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || 'Failed to publish');
    }

    setPublishedUrl(result.url);
    setPublishSuccess(true);

    posthog?.capture("publish_clicked", {
      slug: customSlug,
      title: data.hero?.headline || "",
      hasCTA: !!(data.hero?.ctaConfig?.cta_text && data.hero?.ctaConfig?.url),
    });

    setShowSlugModal(false);
  } catch (err: any) {
    logger.error('Publish error:', () => err);
    setPublishError(err.message || 'Unexpected error');
  } finally {
    setPublishing(false);
  }
}



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
      <div id="landing-preview">
  <LandingPageRenderer tokenId={tokenId || 'default'} />
</div>


      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
        <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
  <button
    onClick={() => window.close()}
    className="text-sm text-gray-500 hover:text-gray-800 underline"
  >
    Close Preview
  </button>

 <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <div>
        <button
          onClick={() => {
            const defaultSlug = (data?.hero?.headline || `page-${Date.now()}`)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .slice(0, 40);

            setCustomSlug(defaultSlug);
            setShowSlugModal(true);
          }}
          disabled={isPublishDisabled || publishing}
          className={`px-5 py-2 rounded-md font-semibold text-base transition ${
            isPublishDisabled || publishing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-brand-accentPrimary text-white hover:bg-brand-logo'
          }`}
        >
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>
    </TooltipTrigger>
    {isPublishDisabled && (
      <TooltipContent side="top">
        Configure CTA before publishing.
      </TooltipContent>
    )}
  </Tooltip>
</TooltipProvider>

{showSlugModal && (
  <SlugModal
    slug={customSlug}
    onChange={setCustomSlug}
    onCancel={() => setShowSlugModal(false)}
    onConfirm={handlePublish} // This function will use customSlug
    loading={publishing}
    error={publishError}
  />
)}

  {publishSuccess && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full">
      <h2 className="text-xl font-bold mb-3">🎉 Page Published!</h2>
      <p className="text-sm text-gray-600 break-all mb-4">{publishedUrl}</p>
      <div className="flex justify-center gap-3 mt-4">
        <button
          onClick={() => navigator.clipboard.writeText(publishedUrl)}
          className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
        >
          Copy Link
        </button>
        <a
          href={publishedUrl}
          target="_blank"
          className="text-sm bg-brand-accentPrimary text-white hover:bg-brand-logo px-3 py-1 rounded"
          rel="noreferrer"
        >
          View Live
        </a>
      </div>
      <button
        onClick={() => setPublishSuccess(false)}
        className="mt-4 text-xs text-gray-500 hover:text-gray-800 underline"
      >
        Close
      </button>
    </div>
  </div>
)}

</div>

      </div>
      {/* Include the debug helper on successful preview */}
      {/* <PreviewDebugHelper /> */}
    </div>



  );
}