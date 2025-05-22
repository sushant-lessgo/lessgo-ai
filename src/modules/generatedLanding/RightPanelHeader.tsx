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

type Props = {
  data: GPTOutput;
  dispatch: React.Dispatch<Action>;
};

export default function RightPanelHeader({ data, dispatch }: Props) {
  const [open, setOpen] = useState(false);

  const handleLayoutClick = () => {
    posthog.capture("layout_modal_opened", { from: "right_panel_header" });
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
      </div>

      <ThemeCustomizer isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
