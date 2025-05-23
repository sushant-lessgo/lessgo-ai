'use client';
import React, { useState } from "react";
import { EmailFormEmbed } from "@/components/generatedLanding/EmailFormEmbed";
import EditableText from "@/modules/generatedLanding/EditableText";
import EditableWrapper from "@/modules/generatedLanding/EditableWrapper";
import { trackEdit } from '@/utils/trackEdit';
import { EditableCTA } from "@/components/generatedLanding/EditableCTA";
import type { Action } from "@/modules/generatedLanding/landingPageReducer";
import type { CtaConfigType } from "@/types";
import type { GPTOutput } from "@/modules/prompt/types"
import { Button } from "@/components/ui/button";
type Props = {
  headline: string;
  subheadline: string;
  cta_text: string;
  urgency_text?: string;
  body_text?: string;
  hero_image?: string;
  dispatch: React.Dispatch<Action>;
  isEditable: boolean;
  ctaConfig: CtaConfigType | null;
  sectionId: keyof GPTOutput["visibleSections"];
};

export default function HeroSection({
  headline,
  subheadline,
  cta_text,
  urgency_text,
  body_text,
  hero_image = "/placeholder.png",
  dispatch,
  isEditable,
  ctaConfig,
  sectionId,
}: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="w-full py-20 bg-landing-mutedBg">
      {isEditable && (
        <div className="flex justify-end">
          <button
            onClick={() =>
              dispatch({
                type: "SET_SECTION_VISIBILITY",
                payload: { section: sectionId, visible: false },
              })
            }
            className="text-sm text-red-500 hover:underline"
          >
            Hide Section
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <EditableWrapper isEditable={isEditable}>
            <EditableText
              value={headline}
              onChange={(val) => {
                trackEdit('hero', 'headline', val);
                dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.headline", value: val } });
              }}
              className="text-4xl leading-tight md:text-5xl font-extrabold text-landing-textPrimary max-w-xl"
              isEditable={isEditable}
            />
          </EditableWrapper>

          <EditableWrapper isEditable={isEditable}>
            <EditableText
              value={subheadline}
              onChange={(val) => {
                trackEdit('hero', 'subheadline', val);
                dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.subheadline", value: val } });
              }}
              className="text-lg text-landing-textSecondary max-w-xl"
              isEditable={isEditable}
            />
          </EditableWrapper>

          <EditableWrapper isEditable={isEditable}>
            {body_text && (
              <EditableText
                value={body_text}
                onChange={(val) => {
                  trackEdit('hero', 'body', val);
                  dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.body_text", value: val } });
                }}
                className="text-base text-landing-textMuted max-w-xl"
                isEditable={isEditable}
              />
            )}
          </EditableWrapper>

          {/* Conditional CTA Button */}
          <div className="relative w-full mt-6">
          <EditableCTA
            ctaConfig={ctaConfig}
            isEditable={isEditable}
            dispatch={dispatch}
            ctaText={cta_text}
          />

          {ctaConfig?.type === "link" && (
            <a
              href={ctaConfig.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-landing-primary text-white hover:bg-landing-primaryHover transition w-full sm:w-auto text-center">
                {ctaConfig.cta_text}
              </Button>
            </a>
          )}

          {ctaConfig?.type === "email-form" && ctaConfig.placement === "separate-section" ? (
            <a href="#email-form">
              <Button className="bg-landing-primary text-white hover:bg-landing-primaryHover transition w-full sm:w-auto text-center">
                {ctaConfig.cta_text}
              </Button>
            </a>
          ) : null}


          {/* Inline Embed Form for hero placement */}
          {ctaConfig?.type === "email-form" && ctaConfig.placement === "hero" && (
            
              <EmailFormEmbed embedCode={ctaConfig.embed_code!} />
            
          )}
</div>
          <EditableWrapper isEditable={isEditable}>
            {urgency_text && (
              <EditableText
                value={urgency_text}
                onChange={(val) => {
                  trackEdit('hero', 'urgency_text', val);
                  dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.urgency_text", value: val } });
                }}
                className="text-sm text-red-600 sm:mt-0"
                isEditable={isEditable}
              />
            )}
          </EditableWrapper>
        </div>

        {/* Right Column */}
        {!image ? (
          <div className="w-full min-h-[280px] md:min-h-[400px] bg-landing-mutedBg border-2 border-dashed border-landing-border rounded-lg flex flex-col items-center justify-center text-landing-textMuted text-sm shadow-sm p-4 relative hover:border-landing-primary hover:bg-slate-50 transition">
            <label htmlFor="imageUpload" className="cursor-pointer text-center">
              <p className="font-medium text-2xl pb-2">Upload Image</p>
              <p>JPG or PNG — Max size 2MB</p>
            </label>
            <input
              type="file"
              id="imageUpload"
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (!["image/jpeg", "image/png"].includes(file.type)) {
                    setError("Only JPG or PNG images are allowed.");
                    return;
                  }
                  if (file.size > 2 * 1024 * 1024) {
                    setError("File is too large. Max size is 2MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImage(reader.result as string);
                    setError(null);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>
        ) : (
          <div className="w-full min-h-[280px] md:min-h-[400px] relative">
            <img
              src={image}
              alt="Uploaded preview"
              className="w-full h-full object-cover rounded-lg shadow-sm"
            />
            <button
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-1 shadow"
              title="Remove Image"
            >
              ✖️
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
