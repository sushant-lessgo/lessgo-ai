"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LayoutGrid, Paintbrush } from "lucide-react";
import posthog from "posthog-js";
import type { GPTOutput } from "@/modules/prompt/types";
import type { Action } from "./landingPageReducer";
import { Switch } from "@/components/ui/switch";
import ThemeCustomizer from '@/components/theme/ThemeCustomizer';
import PreviewButton from "@/modules/generatedLanding/PreviewButton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTokenId } from '@/context/TokenContext';
type Props = {
  data: GPTOutput;
  dispatch: React.Dispatch<Action>;
};

export default function RightPanelHeader({ data, dispatch }: Props) {
  const [open, setOpen] = useState(false);

  const handleLayoutClick = () => {
    posthog.capture("layout_modal_opened", { from: "right_panel_header" });
  };
const tokenId = useTokenId();
console.log('[TokenContext] tokenId in RightPanelHeader:', tokenId);
const handleSaveDraft = async () => {
  try {

    console.log('[SAVE_DRAFT_PAYLOAD]', {
  tokenId,
  title: data.hero?.headline || 'Untitled Project',
  content: data,
});
    const res = await fetch('/api/saveDraft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenId, // must be passed in from the page or parent
        title: data.hero?.headline || 'Untitled Project',
        content: data,
      }),
    });

    const result = await res.json();
    
    if (!res.ok) {
      console.error('[SAVE_DRAFT_ERROR]', result.error);
      alert(result.error || 'Failed to save draft');
      return;
    }

    console.log('[DRAFT_SAVED]', result.message);
    alert('Draft saved successfully!');
  } catch (err) {
    console.error('[SAVE_DRAFT_FAILED]', err);
    alert('Something went wrong while saving the draft.');
  }
};


  
  const handleCustomizeTheme = () => {
    posthog.capture("customize_theme_clicked", { from: "right_panel_header" });
    setOpen(true);
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm rounded-t-xl">
        {/* Left: Style controls */}
        <div className="flex items-center gap-4">

          {/* Customize Theme Button */}
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleCustomizeTheme}
          >
            <Paintbrush size={16} />
            Customize Theme
          </Button>

          {/* Layout Toggler */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <LayoutGrid size={16} /> Layout
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="p-2 w-56">
              <div className="text-sm font-medium px-2 pb-2 text-gray-500">Toggle Sections</div>
              {Object.entries(data.visibleSections || {}).map(([sectionKey, isVisible]) => (
                <div key={sectionKey} className="flex items-center justify-between px-2 py-1">
                  <span className="capitalize text-sm">{sectionKey.replace(/_/g, " ")}</span>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={(checked) =>
                      dispatch({
                        type: "SET_SECTION_VISIBILITY",
                        payload: { section: sectionKey, visible: checked },
                      })
                    }
                  />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>



        </div>
              

        {/* Right: No buttons for now */}
        <div />
        <div className="flex gap-3">
       <button
  onClick={handleSaveDraft}
  className="border border-brand-mutedText text-brand-mutedText hover:bg-gray-100 hover:text-brand-text font-semibold text-sm px-4 py-2 rounded-md transition"
>
  Save Draft
</button>

        

        <TooltipProvider>
        <Tooltip>
  <TooltipTrigger asChild>
    <div>
      <PreviewButton pageData={data} />
    </div>
  </TooltipTrigger>
  <TooltipContent side="top">
    Preview your page... you’ll publish from there.
  </TooltipContent>
</Tooltip>
</TooltipProvider>
</div>
      </div>

      <ThemeCustomizer isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
