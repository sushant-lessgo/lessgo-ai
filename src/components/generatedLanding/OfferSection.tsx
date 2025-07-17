'use client';

import EditableText from "@/modules/generatedLanding/EditableText";
import EditableWrapper from "@/modules/generatedLanding/EditableWrapper";
import type { Action } from "@/modules/generatedLanding/landingPageReducer";
import { trackEdit } from '@/utils/trackEdit';
import { EmailFormEmbed } from "@/components/generatedLanding/EmailFormEmbed";
import { FormPlacementRenderer } from "@/components/forms/FormPlacementRenderer";
import { FormConnectedButton } from "@/components/forms/FormConnectedButton";
import type { CtaConfigType } from "@/types";
import type { GPTOutput } from "@/modules/prompt/types";
import { Button } from "@/components/ui/button";


type Props = {
  headline: string;
  bullets: string[];
  cta_text: string;
  urgency_text: string;
  dispatch?: React.Dispatch<Action>;
  isEditable: boolean;
  
  ctaConfig: CtaConfigType | null;
  sectionId: keyof GPTOutput["visibleSections"];
};


export default function OfferSection({
  headline,
  bullets,
  cta_text,
  urgency_text,
  dispatch,
  isEditable,
  ctaConfig,
  sectionId,
}: Props) {
  return (
    <section className="w-full bg-landing-primary text-white py-24 px-4" id="email-form">
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

      <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-10">
        {/* Headline */}
        <EditableWrapper useAltHover={true} isEditable={isEditable} sectionId={sectionId} elementKey="headline">
          <EditableText
            value={headline}
            onChange={(val) => {
              trackEdit('offer', 'headline', val);
              dispatch?.({
                type: "UPDATE_FIELD",
                payload: { path: "offer.headline", value: val },
              });
            }}
            className="text-3xl md:text-4xl font-bold leading-snug"
            isEditable={isEditable}
            sectionId={sectionId}
            elementKey="headline"
          />
        </EditableWrapper>

        {/* Urgency Text */}
        <EditableWrapper useAltHover={true} isEditable={isEditable} sectionId={sectionId} elementKey="urgency_text">
          <EditableText
            value={urgency_text}
            onChange={(val) => {
              trackEdit('offer', 'urgency_text', val);
              dispatch?.({
                type: "UPDATE_FIELD",
                payload: { path: "offer.urgency_text", value: val },
              });
            }}
            className="text-base"
            isEditable={isEditable}
            sectionId={sectionId}
            elementKey="urgency_text"
          />
        </EditableWrapper>

        {/* Bullet Points */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/90 mt-6 max-w-3xl">
          {bullets.map((point, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-landing-accent text-base leading-none">✔</span>
              <EditableWrapper useAltHover={true} isEditable={isEditable} sectionId={sectionId} elementKey={`bullet_${i}`}>
                <EditableText
                  value={point}
                  onChange={(val) => {
                    trackEdit('offer', 'offer_bullets', val);
                    dispatch?.({
                      type: "UPDATE_FIELD",
                      payload: { path: `offer.bullets[${i}]`, value: val },
                    });
                  }}
                  isEditable={isEditable}
                  sectionId={sectionId}
                  elementKey={`bullet_${i}`}
                />
              </EditableWrapper>
            </div>
          ))}
        </div>

        {/* Embed form if email-form with placement=separate-section */}
        {ctaConfig?.type === "email-form" && (
  (ctaConfig.placement === "separate-section" || ctaConfig.placement === "hero") && (
    <div className="w-full max-w-xl mt-10">
      <EmailFormEmbed embedCode={ctaConfig.embed_code!} />
    </div>
  )
)}

        {/* CTA Button logic */}
        {ctaConfig?.type === "link" ? (
        <a
  href={ctaConfig.url}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-6"
>
  <Button className="bg-white text-landing-primary font-semibold px-6 py-3 rounded-lg text-base hover:bg-gray-100 transition w-full sm:w-auto text-center">
    {ctaConfig.cta_text}
  </Button>
</a>

        ) : ctaConfig?.type === "form" ? (
          <div className="mt-6">
            <FormConnectedButton 
              ctaConfig={ctaConfig}
              className="bg-white text-landing-primary font-semibold px-6 py-3 rounded-lg text-base hover:bg-gray-100 transition w-full sm:w-auto text-center"
            />
          </div>
        ) : ctaConfig && ctaConfig.type !== "email-form" ? (
          <EditableWrapper useAltHover={true} isEditable={isEditable} sectionId={sectionId} elementKey="cta_text">
            <EditableText
              value={cta_text}
              onChange={(val) => {
                trackEdit('offer', 'cta_text', val);
                dispatch?.({
                  type: "UPDATE_FIELD",
                  payload: { path: "offer.cta_text", value: val },
                });
              }}
              className="bg-white text-landing-primary font-semibold px-6 py-3 rounded-lg text-base hover:bg-gray-100 transition w-full sm:w-auto text-center"
              isEditable={isEditable}
              sectionId={sectionId}
              elementKey="cta_text"
            />
          </EditableWrapper>
        ) : null}

        {!ctaConfig && (
  <div className="text-sm text-yellow-200 bg-yellow-700 bg-opacity-20 border border-yellow-400 px-4 py-3 rounded-md text-center mt-6">
    {isEditable
      ? "⚠️ CTA not configured. Please configure it in the Hero section."
      : "⚠️ No CTA configured. Your visitors will have nothing to click here."}
  </div>
)}

        {/* Form Placement for CTA Section */}
        <FormPlacementRenderer placement="cta-section" className="mt-8 w-full max-w-2xl" />
      </div>
    </section>
  );
}
