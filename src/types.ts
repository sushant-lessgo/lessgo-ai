export type CtaConfigType = {
  type: "link" | "email-form";
  cta_text: string;
  url?: string;
  embed_code?: string;
  placement?: "hero" | "separate-section";
};
