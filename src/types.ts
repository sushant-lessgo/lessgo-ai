export type CtaConfigType = {
  type: "link" | "email-form" | "form";
  cta_text: string;
  url?: string;
  embed_code?: string;
  placement?: "hero" | "separate-section";
  formId?: string;
  behavior?: "scrollTo" | "openModal";
};
