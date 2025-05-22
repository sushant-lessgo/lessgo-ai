import { Button } from "@/components/ui/button";
import { Pencil, Settings } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useState } from "react";
import { usePostHog } from 'posthog-js/react'
import { CTAConfiguratorPopover } from "@/components/generatedLanding/CTAConfiguratorPopover";
import EditableText from "@/modules/generatedLanding/EditableText";
import EditableWrapper from "@/modules/generatedLanding/EditableWrapper";
import type { CtaConfigType } from "@/types";
import type { Action } from "@/modules/generatedLanding/landingPageReducer";


type EditableCTAProps = {
  ctaConfig: CtaConfigType | null;
  isEditable: boolean;
  dispatch: React.Dispatch<Action>;
};

 // Assume this wraps posthog.capture

export function EditableCTA({ ctaConfig, isEditable, dispatch }: EditableCTAProps) {
  const [open, setOpen] = useState(false);
const posthog = usePostHog()
  const openConfig = () => {
    setOpen(true);
    posthog.capture("cta_config_open", {
    location: "hero", // or "offer" based on where this lives
    state: ctaConfig ? "edit_existing" : "create_new",
  });
  };

  if (!ctaConfig) {
    return (
     <Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <div
      onClick={openConfig}
      className="w-full cursor-pointer border border-gray-300 bg-muted p-6 rounded-xl flex flex-col items-center justify-center gap-2 text-center hover:bg-gray-100 transition shadow-sm"
    >
      <Settings className="w-8 h-8 text-gray-500" />
      <span className="text-xl font-medium text-gray-700">Configure CTA</span>
      <span className="text-xs text-gray-500">Add a button or form</span>
    </div>
  </PopoverTrigger>
  <PopoverContent className="w-96">
    <CTAConfiguratorPopover
      ctaConfig={null}
      dispatch={dispatch}
      closePopover={() => setOpen(false)}
    />
  </PopoverContent>
</Popover>
    );
  }

  return (
    <div className="relative group">
      <a
    href={ctaConfig.type === "email-form" ? "#email-form" : ctaConfig.url}
    target={ctaConfig.type === "link" ? "_blank" : undefined}
    rel="noopener noreferrer"
>

        <Button className="bg-landing-primary text-white hover:bg-landing-primaryHover transition">
          {isEditable ? (
            <EditableText
              value={ctaConfig.cta_text}
              onChange={(val) => {
                dispatch({
                  type: "UPDATE_FIELD",
                  payload: { path: "hero.ctaConfig.cta_text", value: val },
                });
                 posthog.capture("cta_text_edited", {
                    newText: val,
                    location: "hero", // or "offer" if reused elsewhere
                    });
              }}
              isEditable={isEditable}
            />
          ) : (
            ctaConfig.cta_text
          )}
        </Button>
      </a>

      {isEditable && (
        <div className="absolute top-0 right-0 mt-[-10px] mr-[-10px] opacity-0 group-hover:opacity-100 transition">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" onClick={openConfig}>
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
              <CTAConfiguratorPopover
                ctaConfig={ctaConfig}
                dispatch={dispatch}
                closePopover={() => setOpen(false)}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
