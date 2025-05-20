// modules/generatedLanding/RightPanelHeader.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LayoutGrid, Eye, Download, Rocket } from "lucide-react";
import posthog from "posthog-js";
import type { GPTOutput } from "@/modules/prompt/types";
import type { Action } from "./landingPageReducer";
import ActionButtons from "@/modules/generatedLanding/ActionButtons";

type Props = {
  data: GPTOutput;
  dispatch: React.Dispatch<Action>;
};

export default function RightPanelHeader({ data, dispatch }: Props) {
  const handleBgChange = (value: string) => {
    // dispatch({
    //   type: "UPDATE_THEME",
    //   payload: { background: value },
    // });
    posthog.capture("background_mode_changed", { mode: value });
  };

  const handleColorChange = (value: string) => {
    // dispatch({
    //   type: "UPDATE_THEME",
    //   payload: { colorScheme: value },
    // });
    posthog.capture("color_scheme_changed", { scheme: value });
  };

  const handleLayoutClick = () => {
    // dispatch({ type: "TOGGLE_LAYOUT_MODAL" });
    posthog.capture("layout_modal_opened", { from: "right_panel_header" });
  };

  const handlePreview = () => {
    // open in new tab or route as per your app logic
    posthog.capture("preview_clicked", { from: "right_panel_header" });
  };

  const handleDownload = () => {
    // dispatch({ type: "DOWNLOAD_HTML" });
    posthog.capture("download_html_clicked", { from: "right_panel_header" });
  };

  const handlePublish = () => {
    // dispatch({ type: "PUBLISH_LANDING_PAGE" });
    posthog.capture("publish_clicked", { from: "right_panel_header" });
  };

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm rounded-t-xl">
      {/* Left: Style controls */}
      <div className="flex items-center gap-4">

        {/* Background Mode Selector */}
        {/* <Select value={data.theme.background} onValueChange={handleBgChange}> */}
        <Select >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Background" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>

        {/* Color Scheme Selector */}
        {/* <Select value={data.theme.colorScheme} onValueChange={handleColorChange}> */}
        <Select >

          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blue">Blue</SelectItem>
            <SelectItem value="emerald">Emerald</SelectItem>
            <SelectItem value="violet">Violet</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
            <SelectItem value="red">Red</SelectItem>
          </SelectContent>
        </Select>

        {/* Layout Toggler */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <LayoutGrid size={16} /> Layout
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {/* You could render checkboxes here for each layout section if desired */}
            <Button variant="ghost" onClick={handleLayoutClick} className="w-full justify-start">
              Open Layout Settings
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-3">
        <ActionButtons
            data={data}
            showPublish={true}
            onPublish={handlePublish}
            />

      </div>
    </div>
  );
}
