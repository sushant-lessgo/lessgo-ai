'use client';
import React, { useState } from "react";
import { EmailFormEmbed } from "@/components/generatedLanding/EmailFormEmbed";
import EditableText from "@/modules/generatedLanding/EditableText";
import EditableWrapper from "@/modules/generatedLanding/EditableWrapper";
import { trackEdit } from '@/utils/trackEdit';
import { EditableCTA } from "@/components/generatedLanding/EditableCTA";
import { FormPlacementRenderer } from "@/components/forms/FormPlacementRenderer";
import { FormConnectedButton } from "@/components/forms/FormConnectedButton";
import type { Action } from "@/modules/generatedLanding/landingPageReducer";
import type { CtaConfigType } from "@/types";
import type { GPTOutput } from "@/modules/prompt/types"
import { Button } from "@/components/ui/button";
import { useSmartTextColorsForSection, useSmartCTAColors } from "@/hooks/useSmartTextColors";

type Props = {
  headline: string;
  subheadline: string;
  cta_text: string;
  urgency_text?: string;
  body_text?: string;
  hero_image?: string | null;
  dispatch?: React.Dispatch<Action>;
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
  hero_image,
  dispatch,
  isEditable,
  ctaConfig,
  sectionId,
}: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get smart text colors for this section
  const smartColors = useSmartTextColorsForSection('hero');
  // Get smart CTA colors that auto-update with accent changes
  const ctaColors = useSmartCTAColors();

  const showImage = isEditable ? image : hero_image;



  const isTwoColumn = isEditable || (showImage !== null && showImage !== undefined);

  return (
    <section className="w-full py-20 bg-landing-mutedBg">
      {isEditable && (
        <div className="flex justify-end">
          <button
            onClick={() =>
              dispatch?.({
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

      <div
        className={`max-w-6xl mx-auto px-4 md:px-8 gap-12 items-center ${
          isTwoColumn ? "grid grid-cols-1 md:grid-cols-2" : "flex flex-col text-center"
        }`}
      >
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <EditableWrapper isEditable={isEditable} sectionId={sectionId} elementKey="headline">
            <EditableText
              value={headline}
              onChange={(val) => {
                trackEdit('hero', 'headline', val);
                dispatch?.({ type: "UPDATE_FIELD", payload: { path: "hero.headline", value: val } });
              }}
              className={`text-4xl leading-tight md:text-5xl font-extrabold ${
                isTwoColumn ? "max-w-xl text-left" : "max-w-[70rem] text-center mx-auto"
              }`}
              style={{ color: smartColors.heading }}
              isEditable={isEditable}
              sectionId={sectionId}
              elementKey="headline"
            />
          </EditableWrapper>

          <EditableWrapper isEditable={isEditable} sectionId={sectionId} elementKey="subheadline">
            <EditableText
              value={subheadline}
              onChange={(val) => {
                trackEdit('hero', 'subheadline', val);
                dispatch?.({ type: "UPDATE_FIELD", payload: { path: "hero.subheadline", value: val } });
              }}
              className={`text-lg ${
                isTwoColumn ? "max-w-xl text-left" : "max-w-[50rem] text-center mx-auto"
              }`}
              style={{ color: smartColors.body }}
              isEditable={isEditable}
              sectionId={sectionId}
              elementKey="subheadline"
            />
          </EditableWrapper>

          <EditableWrapper isEditable={isEditable} sectionId={sectionId} elementKey="body_text">
            {body_text && (
              <EditableText
                value={body_text}
                onChange={(val) => {
                  trackEdit('hero', 'body', val);
                  dispatch?.({ type: "UPDATE_FIELD", payload: { path: "hero.body_text", value: val } });
                }}
                className={`text-base ${
                  isTwoColumn ? "max-w-xl text-left" : "max-w-[40rem] text-center mx-auto"
                }`}
                style={{ color: smartColors.body }}
                isEditable={isEditable}
                sectionId={sectionId}
                elementKey="body_text"
              />
            )}
          </EditableWrapper>

          {/* Conditional CTA Button */}
          <div className="relative w-full mt-6">
            {isEditable && (
              <EditableCTA
                ctaConfig={ctaConfig}
                isEditable={isEditable}
                dispatch={dispatch}
                ctaText={cta_text}
                sectionId={sectionId}
                elementKey="cta_button"
              />
            )}


            {!isEditable && !ctaConfig?.cta_text && (
              <div className="max-w-xl mx-auto">
              <div className="text-sm text-yellow-200 bg-yellow-700 bg-opacity-60 border border-yellow-400 px-4 py-3 rounded-md text-center mt-6">
                ⚠️ No CTA configured. Your visitors will have nothing to click here.
              </div>
              </div>
            )}

            {ctaConfig?.cta_text && (
              <>
                {ctaConfig.type === "link" && (
                  <a href={ctaConfig.url} target="_blank" rel="noopener noreferrer">
                    <Button className={`${ctaColors.background} ${ctaColors.text} hover:${ctaColors.hover} transition w-full sm:w-auto text-center`}>
                      {ctaConfig.cta_text}
                    </Button>
                  </a>
                )}

                {ctaConfig.type === "email-form" && ctaConfig.placement === "separate-section" && (
                  <a href="#email-form">
                    <Button className={`${ctaColors.background} ${ctaColors.text} hover:${ctaColors.hover} transition w-full sm:w-auto text-center`}>
                      {ctaConfig.cta_text}
                    </Button>
                  </a>
                )}

                {ctaConfig.type === "email-form" && ctaConfig.placement === "hero" && (
                  <EmailFormEmbed embedCode={ctaConfig.embed_code!} />
                )}

                {ctaConfig.type === "form" && (
                  <FormConnectedButton 
                    buttonConfig={{
                      type: ctaConfig.type,
                      formId: ctaConfig.formId,
                      behavior: ctaConfig.behavior
                    }}
                    className={`${ctaColors.background} ${ctaColors.text} hover:${ctaColors.hover} transition w-full sm:w-auto text-center`}
                  >
                    {ctaConfig.cta_text}
                  </FormConnectedButton>
                )}
              </>
            )}
          </div>

          {/* Form Placement for Hero */}
          <FormPlacementRenderer placement="hero" className="mt-6" />

          <EditableWrapper isEditable={isEditable} sectionId={sectionId} elementKey="urgency_text">
            {urgency_text && (
              <EditableText
                value={urgency_text}
                onChange={(val) => {
                  trackEdit('hero', 'urgency_text', val);
                  dispatch?.({ type: "UPDATE_FIELD", payload: { path: "hero.urgency_text", value: val } });
                }}
                className="text-sm sm:mt-0"
                style={{ color: smartColors.muted }}
                isEditable={isEditable}
                sectionId={sectionId}
                elementKey="urgency_text"
              />
            )}
          </EditableWrapper>
        </div>

        {/* Right Column */}
        {/* Right Column: Image */}
        {isEditable ? (
          !image ? (
            <div 
              className="w-full min-h-[280px] md:min-h-[400px] bg-landing-mutedBg border-2 border-dashed border-landing-border rounded-lg flex flex-col items-center justify-center text-sm shadow-sm p-4 relative hover:border-landing-primary hover:bg-slate-50 transition"
              style={{ color: smartColors.muted }}
            >
              <label htmlFor="imageUpload" className="cursor-pointer text-center">
                <p className="font-medium text-2xl pb-2">Upload Image</p>
                <p>JPG or PNG — Max size 2MB</p>
                <p className="pt-2 text-sm">Leave blank if no image. The layout will auto-adjust to full width.</p>
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
                      dispatch?.({
                          type: "UPDATE_FIELD",
                          payload: { path: "hero.hero_image", value: reader.result },
                        });

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
                onClick={() => {
                  setImage(null);
                  dispatch?.({
                    type: "UPDATE_FIELD",
                    payload: { path: "hero.hero_image", value: null },
                  });
                }}
                className="absolute top-2 right-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-1 shadow"
                title="Remove Image"
              >
                ✖️
              </button>
            </div>
          )
        ) : showImage ? (
          <div className="w-full min-h-[280px] md:min-h-[400px]">
            <img
              src={showImage}
              alt="Hero"
              className="w-full h-full object-cover rounded-lg shadow-sm"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}