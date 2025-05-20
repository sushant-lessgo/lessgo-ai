'use client';
import React, { useState } from "react"

import EditableText from "@/modules/generatedLanding/EditableText"
import EditableWrapper from "@/modules/generatedLanding/EditableWrapper"
import { trackEdit } from '@/utils/trackEdit';
import type { Action } from "@/modules/generatedLanding/landingPageReducer"

type Props = {
  headline: string
  subheadline: string
  cta_text: string
  urgency_text?: string
  body_text?: string
  hero_image?: string
  dispatch: React.Dispatch<Action>
  isEditable: boolean
}

export default function HeroSection({
  headline,
  subheadline,
  cta_text,
  urgency_text,
  body_text,
  hero_image = "/placeholder.png",
  dispatch,
  isEditable,
}: Props) {


  const [image, setImage] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);

  return (
<>


    <section className="w-full py-20 bg-landing-mutedBg">
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          
        <EditableWrapper isEditable={isEditable}>
          <EditableText
            value={headline}
            onChange={(val) => {
              trackEdit('hero', 'headline', val);
              dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.headline", value: val } })
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
              dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.subheadline", value: val } })
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
                dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.body_text", value: val } })
              }}
              className="text-base text-landing-textMuted max-w-xl"
              isEditable={isEditable}
            />
          )}
        </EditableWrapper>


          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        
          <EditableWrapper useAltHover={true} isEditable={isEditable}>

            <EditableText
              value={cta_text} 
              onChange={(val) => {
              trackEdit('hero', 'cta_text', val);
                dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.cta_text", value: val } })
              }}
              className="bg-landing-primary text-white font-semibold px-6 py-3 rounded-lg text-base hover:bg-landing-primaryHover transition w-full sm:w-auto text-center"
              isEditable={isEditable}
            />
            
            </EditableWrapper>
            
            <EditableWrapper isEditable={isEditable}>

            {urgency_text && (
             
             <EditableText
                value={urgency_text}
                onChange={(val) => {
              trackEdit('hero', 'urgency_text', val);
                  dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.urgency_text", value: val } })
                }}
                className="text-sm text-red-600 sm:mt-0"
                isEditable={isEditable}
              />
            )}

            </EditableWrapper>
          </div>
        </div>

        {/* Right Column */}
        {!image ? (
          <div
            className="w-full aspect-[4/3] md:aspect-[16/9] bg-landing-mutedBg border-2 border-dashed border-landing-border rounded-lg flex flex-col items-center justify-center text-landing-textMuted text-sm shadow-sm p-4 relative"
          >
            <label htmlFor="imageUpload" className="cursor-pointer text-center">
              <p className="font-medium">Upload Image</p>
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
          <div className="w-full aspect-[4/3] md:aspect-[16/9] relative">
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
</>
  )
  
}
