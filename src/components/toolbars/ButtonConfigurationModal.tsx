'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logger } from '@/lib/logger';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { Plus, X, AlertCircle, Info } from 'lucide-react';
import type { ElementSelection } from '@/types/store/state';
import IconPicker from '@/components/ui/IconPicker';
import * as LucideIcons from 'lucide-react';
import { getDisabledBehaviorOptions } from '@/utils/formPlacement';
import { hasPrimaryCTASection } from '@/utils/sectionHelpers';
import { buildPageLinkOptions } from '@/utils/pageLinks';
import { toDestination } from '@/utils/destinationShim';
import { resolveDestination } from '@/utils/resolveCtaHref';
import type { CTAButton, Destination } from '@/types/destination';

// Some button elements are items inside a collection (pricing/package tiers):
// their elementKey is `<collection>_cta_<id>` and the visible text lives nested at
// elements[<collection>][n].cta_text, NOT at a flat elements[key]. Resolve that
// here so the modal can seed + write the right place. Guarded by Array.isArray so
// single keys (e.g. secondary_cta_text → elements.secondary is not an array) stay
// on the normal flat path.
function getCollectionCtaRef(
  sectionData: any,
  elementKey: string,
): { field: string; id: string; item: any } | null {
  const m = elementKey.match(/^(.+)_cta_(.+)$/);
  if (!m) return null;
  const field = m[1];
  const id = m[2];
  const arr = sectionData?.elements?.[field];
  if (!Array.isArray(arr)) return null;
  const item = arr.find((it: any) => it?.id === id);
  return item ? { field, id, item } : null;
}

// scale-04: reverse-map a saved CTAButton (explicit destination) back into the
// modal's flat ButtonConfig so the form fields prefill on reopen. Icons/inputs
// ride on the legacy buttonConfig (the new shape doesn't carry them), so we pull
// those from `legacy` when available.
function configFromCta(
  cta: CTAButton,
  text: string,
  role: 'primary' | 'secondary',
  legacy: any,
): ButtonConfig {
  const dest = cta.dest as Destination;
  const base: ButtonConfig = {
    type: 'link',
    text,
    ctaType: role,
    leadingIcon: legacy?.leadingIcon,
    trailingIcon: legacy?.trailingIcon,
    iconConfig: legacy?.iconConfig || { leadingSize: 'md', trailingSize: 'md' },
  };
  if (cta.formId && dest?.kind === 'section' && dest.anchor === 'form-section') {
    return { ...base, type: 'form', formId: cta.formId, behavior: legacy?.behavior || 'scrollTo' };
  }
  if (dest?.kind === 'page') {
    return { ...base, type: 'page', pathSlug: dest.pathSlug };
  }
  // external / whatsapp / call / email / social / download → a plain link url.
  return { ...base, type: 'link', url: dest ? resolveDestination(dest) : '' };
}

// scale-04: build the new CTAButton write from the modal state. Primary + follow
// goal ⇒ GOAL_REF. A FORM cta ALWAYS carries `formId` (the pre-pass detects the
// form case by formId — a form-intent cta without it is mis-mapped to a link).
// `link-with-input` is NOT representable in the new shape (it carries inputConfig)
// ⇒ returns undefined so the legacy buttonConfig renders it instead.
function buildCtaButton(
  config: ButtonConfig,
  role: 'primary' | 'secondary',
  followGoal: boolean,
): CTAButton | undefined {
  if (role === 'primary' && followGoal) {
    return { role: 'primary', dest: 'GOAL_REF' };
  }
  switch (config.type) {
    case 'form':
      return config.formId
        ? { role, dest: { kind: 'section', anchor: 'form-section' }, formId: config.formId }
        : undefined;
    case 'page':
      return { role, dest: { kind: 'page', pathSlug: config.pathSlug ?? '' } };
    case 'link': {
      const d = toDestination(config.url ?? '');
      return d && d !== 'GOAL_REF' ? { role, dest: d } : undefined;
    }
    case 'link-with-input':
    default:
      return undefined;
  }
}

interface ButtonConfig {
  type: 'link' | 'form' | 'link-with-input' | 'page';
  text: string;
  url?: string;
  pageId?: string; // cross-page link: target page id
  pathSlug?: string; // cross-page link: target page pathSlug ('/contact')
  formId?: string;
  behavior?: 'scrollTo' | 'openModal';
  ctaType?: 'primary' | 'secondary'; // NEW: CTA type for placement logic
  inputConfig?: {
    label?: string;
    placeholder?: string;
    queryParamName?: string;
  };
  leadingIcon?: string;
  trailingIcon?: string;
  iconConfig?: {
    leadingSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    trailingSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  };
}

interface ButtonConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  elementSelection: ElementSelection;
}

export function ButtonConfigurationModal({ 
  isOpen, 
  onClose, 
  elementSelection 
}: ButtonConfigurationModalProps) {
  const {
    getAllForms,
    showFormBuilder,
    content,
    setSection,
    sections, // NEW: Get sections for placement logic
    pages, // multi-page: cross-page link targets
  } = useEditStore();

  const pageOptions = buildPageLinkOptions(pages);
  const availableForms = getAllForms();

  // scale-04: role is DERIVED from the element key (read-only), never chosen.
  // `cta_*` ⇒ primary, `secondary_cta_*` ⇒ secondary.
  const role: 'primary' | 'secondary' =
    elementSelection?.elementKey && /secondary/i.test(elementSelection.elementKey)
      ? 'secondary'
      : 'primary';

  const [config, setConfig] = useState<ButtonConfig>({
    type: 'link',
    text: '',
    ctaType: role, // mirrors the derived role (kept for downstream compat)
  });

  // scale-04: primary buttons default to following the project goal (GOAL_REF);
  // "detach" flips this off so the user picks an explicit destination. Secondary
  // buttons never follow the goal (D14).
  const [followGoal, setFollowGoal] = useState<boolean>(role === 'primary');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState<'leading' | 'trailing' | null>(null);

  // Initialize with current element content and saved configuration
  useEffect(() => {
    if (elementSelection && content[elementSelection.sectionId]) {
      const sectionData = content[elementSelection.sectionId];
      const element = sectionData.elements[elementSelection.elementKey];
      const collRef = getCollectionCtaRef(sectionData, elementSelection.elementKey);
      if (element !== undefined || collRef) {
        // V2 stores element content as a plain string; tolerate a legacy
        // { content } object too. Reading element.content on the string shape
        // always yielded undefined → modal showed "Button Text" and clobbered
        // the real copy on save (#8/#9). Tier CTAs (collRef) read their nested
        // cta_text instead of the (absent) flat key.
        const buttonText = collRef
          ? (typeof collRef.item.cta_text === 'string' ? collRef.item.cta_text : 'Button Text')
          : (typeof element === 'string'
              ? element
              : (typeof element?.content === 'string' ? element.content : 'Button Text'));

        // Saved config lives in elementMetadata[key].buttonConfig (NOT on the
        // element). Reading element.metadata always returned undefined, so a set
        // URL/form never rehydrated on reopen (#9).
        const savedConfig =
          sectionData.elementMetadata?.[elementSelection.elementKey]?.buttonConfig;
        // scale-04: the new CTAButton shape (preferred when present).
        const savedCta: CTAButton | undefined =
          sectionData.elementMetadata?.[elementSelection.elementKey]?.cta;

        const inferredCtaType: 'primary' | 'secondary' = role;

        if (savedCta && savedCta.dest === 'GOAL_REF') {
          // Following the project goal — no explicit destination to prefill.
          setFollowGoal(true);
          setConfig({
            type: savedConfig?.type || 'link',
            text: buttonText,
            url: savedConfig?.url || '',
            pageId: savedConfig?.pageId,
            pathSlug: savedConfig?.pathSlug,
            formId: savedConfig?.formId || '',
            behavior: savedConfig?.behavior || 'scrollTo',
            ctaType: role,
            leadingIcon: savedConfig?.leadingIcon,
            trailingIcon: savedConfig?.trailingIcon,
            iconConfig: savedConfig?.iconConfig || { leadingSize: 'md', trailingSize: 'md' },
            inputConfig: savedConfig?.inputConfig,
          });
          logger.dev('Loaded GOAL_REF cta');
        } else if (savedCta) {
          // Explicit destination on the new shape — reverse-map to form fields.
          setFollowGoal(false);
          setConfig(configFromCta(savedCta, buttonText, role, savedConfig));
          logger.dev('Loaded saved cta:', () => savedCta);
        } else if (savedConfig) {
          // Legacy buttonConfig — read via the old fields (dual-read for reopen).
          setFollowGoal(false);
          setConfig({
            type: savedConfig.type || 'link',
            text: buttonText,
            url: savedConfig.url || '',
            pageId: savedConfig.pageId,
            pathSlug: savedConfig.pathSlug,
            formId: savedConfig.formId || '',
            behavior: savedConfig.behavior || 'scrollTo',
            ctaType: role,
            leadingIcon: savedConfig.leadingIcon,
            trailingIcon: savedConfig.trailingIcon,
            iconConfig: savedConfig.iconConfig || { leadingSize: 'md', trailingSize: 'md' },
            inputConfig: savedConfig.inputConfig,
          });
          logger.dev('Loaded saved button config:', () => savedConfig);
        } else {
          // Fresh: primary follows the goal by default; secondary picks a dest.
          setFollowGoal(role === 'primary');
          setConfig({
            type: 'link',
            text: buttonText,
            ctaType: inferredCtaType,
          });
        }
      }
    }
    // Reset success state when modal opens
    setShowSuccess(false);
  }, [elementSelection, content]);

  const handleSave = async () => {
    logger.dev('🔧 handleSave called');
    const newErrors: Record<string, string> = {};

    if (!config.text.trim()) {
      newErrors.text = 'Button text is required.';
    }

    // scale-04: in goal-follow mode the destination comes from the project goal —
    // no explicit destination to validate. Validate only when detached/secondary.
    if (!followGoal) {
      if (config.type === 'link' && !config.url?.trim()) {
        newErrors.url = 'URL is required for external link.';
      }

      if (config.type === 'link-with-input') {
        if (!config.url?.trim()) {
          newErrors.url = 'URL is required for link with input.';
        }
        if (!config.inputConfig?.queryParamName?.trim()) {
          newErrors.queryParamName = 'Query parameter name is required.';
        }
      }

      if (config.type === 'form' && !config.formId) {
        newErrors.form = 'Please select a form or create a new one.';
      }

      if (config.type === 'page' && !config.pathSlug?.trim()) {
        newErrors.page = 'Please choose a page to link to.';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      logger.dev('🔧 Validation errors:', () => newErrors);
      return;
    }

    logger.dev('🔧 Validation passed, updating content');
    setIsSaving(true);

    try {
      // V2: Store button text directly, metadata in elementMetadata
      const currentSection = content[elementSelection.sectionId];
      const collRef = getCollectionCtaRef(currentSection, elementSelection.elementKey);
      if (currentSection?.elements[elementSelection.elementKey] !== undefined || collRef) {
        // Build buttonConfig object
        const buttonConfig = {
          type: config.type,
          ctaType: config.ctaType,
          ...(config.type === 'link' && { url: config.url }),
          ...(config.type === 'link-with-input' && {
            url: config.url,
            inputConfig: config.inputConfig
          }),
          ...(config.type === 'form' && {
            formId: config.formId,
            behavior: config.behavior
          }),
          ...(config.type === 'page' && {
            pageId: config.pageId,
            pathSlug: config.pathSlug,
          }),
          leadingIcon: config.leadingIcon,
          trailingIcon: config.trailingIcon,
          iconConfig: config.iconConfig,
        };

        // Create ctaConfig for compatibility with HeroSection. An internal page
        // link maps to a plain link whose url is the target pathSlug ('/contact').
        const ctaConfig = {
          type: config.type === 'link-with-input' ? 'link-with-input' as const : (config.type === 'form' ? 'form' as const : 'link' as const),
          cta_text: config.text,
          url: config.type === 'page' ? config.pathSlug : ((config.type === 'link' || config.type === 'link-with-input') ? config.url : undefined),
          formId: config.type === 'form' ? config.formId : undefined,
          behavior: config.type === 'form' ? config.behavior : undefined,
          inputConfig: config.type === 'link-with-input' ? config.inputConfig : undefined,
        };

        // V2: Elements stored directly (no wrapper). Tier CTAs (collRef) write
        // their text back into the nested collection item's cta_text instead of a
        // junk flat key the block never reads.
        const updatedElements = collRef
          ? {
              ...currentSection.elements,
              [collRef.field]: currentSection.elements[collRef.field].map((it: any) =>
                it?.id === collRef.id ? { ...it, cta_text: config.text } : it
              ),
            }
          : {
              ...currentSection.elements,
              [elementSelection.elementKey]: config.text  // Direct string, no spread
            };

        // V2: Store cta_url/cta_embed as direct strings
        if (config.type === 'link' && config.url) {
          updatedElements.cta_url = config.url;
        } else if (config.type === 'link-with-input' && config.url) {
          updatedElements.cta_url = config.url;
        } else if (config.type === 'form' && config.formId) {
          updatedElements.cta_embed = `form:${config.formId}`;
        } else if (config.type === 'page' && config.pathSlug) {
          updatedElements.cta_url = config.pathSlug;
        }

        // scale-04: build the new CTAButton write. `cta` is the new shape the
        // renderer pre-pass consumes; the legacy `buttonConfig` stays alongside
        // for raw readers (form placement, icons, inputConfig). For a
        // `link-with-input` (not representable in the new shape) `cta` is omitted
        // so the pre-pass leaves the legacy buttonConfig — and any stale cta is
        // dropped by not re-spreading it.
        const cta = buildCtaButton(config, role, followGoal);

        // V2: Store buttonConfig in elementMetadata (separate from element)
        const updatedElementMetadata = {
          ...currentSection.elementMetadata,
          [elementSelection.elementKey]: cta
            ? { buttonConfig, cta }
            : { buttonConfig },
        };

        setSection(elementSelection.sectionId, {
          elements: updatedElements,
          elementMetadata: updatedElementMetadata,
          // Also save ctaConfig at section level for easy access by CTA handler.
          // variant follows the chosen CTA type (was hardcoded 'primary'; no
          // reader styles from this field — blocks style by element key).
          cta: {
            ...ctaConfig,
            label: ctaConfig.cta_text,
            variant: config.ctaType || 'primary',
            size: 'medium'
          }
        });
        
        logger.dev('🔧 Button configuration saved:', () => config);
        logger.dev('🔧 CTA config created:', () => ctaConfig);
      }

      // Clear any existing errors first
      setErrors({});
      
      // Show success message using DOM manipulation
      logger.dev('🔧 Setting showSuccess to true');
      setShowSuccess(true);
      setIsSaving(false);
      
      // Create success notification directly
      const successDiv = document.createElement('div');
      successDiv.id = 'button-config-success';
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #16a34a;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideDown 0.3s ease-out;
      `;
      
      // Add animation keyframes
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
      
      // Create checkmark icon
      const iconSvg = `
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      `;
      
      // Build success message content
      let messageHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          ${iconSvg}
          <div>
            <div style="font-weight: 600; font-size: 16px;">Success!</div>
            <div style="font-size: 14px; margin-top: 2px; opacity: 0.9;">
              ${config.type === 'link' ? 'External link configured successfully' : 
                'Form connection configured successfully'}
            </div>
          </div>
        </div>
      `;
      
      successDiv.innerHTML = messageHTML;
      document.body.appendChild(successDiv);
      
      // Close after showing the message
      setTimeout(() => {
        logger.dev('🔧 Timeout triggered, closing modal');
        if (document.getElementById('button-config-success')) {
          document.body.removeChild(successDiv);
        }
        if (style.parentNode) {
          document.head.removeChild(style);
        }
        onClose();
      }, 2000);
    } catch (error) {
      logger.error('🔧 Error saving configuration:', () => error);
      setIsSaving(false);
    }
  };

  const handleCreateNewForm = () => {
    showFormBuilder();
    // Don't close the button config modal yet - let user create the form first
  };

  // Helper to render icon preview
  const renderIconPreview = (iconValue: string) => {
    if (!iconValue) return null;

    // PascalCase Lucide icon
    if (/^[A-Z][a-zA-Z0-9]*$/.test(iconValue)) {
      const IconComponent = (LucideIcons as any)[iconValue];
      if (IconComponent) {
        return <IconComponent size={18} />;
      }
      return <LucideIcons.Sparkles size={18} className="text-gray-400" />;
    }

    // Emoji
    if (/\p{Emoji}/u.test(iconValue)) {
      return <span className="text-lg">{iconValue}</span>;
    }

    return null;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Button Configuration</DialogTitle>
        </DialogHeader>

          <div className="space-y-4">
          {/* Button Text */}
          <div>
            <Label htmlFor="button-text">Button Text*</Label>
            <Input
              id="button-text"
              value={config.text}
              onChange={(e) => setConfig(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Enter button text"
            />
            {errors.text && <p className="text-sm text-red-500 mt-1">{errors.text}</p>}
          </div>

          {/* CTA Role — DERIVED from the element key, shown read-only (scale-04) */}
          <div>
            <Label>CTA Role</Label>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize bg-gray-50">
                {role} CTA
              </span>
              <span className="text-xs text-gray-500">
                {role === 'primary'
                  ? 'Main conversion action'
                  : 'Alternative action'}
              </span>
            </div>
          </div>

          {/* Goal-follow state (primary only) — GOAL_REF vs explicit destination */}
          {role === 'primary' && followGoal && (
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-blue-800">
                    Follows your project goal
                  </div>
                  <p className="mt-1 text-sm text-blue-700">
                    This button points wherever your project goal points. Change the
                    goal once and every primary button re-points automatically.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setFollowGoal(false)}
                  >
                    Detach &amp; set a custom destination
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Re-attach control for a detached primary */}
          {role === 'primary' && !followGoal && (
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              onClick={() => setFollowGoal(true)}
            >
              ← Follow the project goal instead
            </button>
          )}

          {/* Icon Configuration */}
          <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
            <Label className="text-sm font-semibold">Button Icons (Optional)</Label>

            {/* Leading Icon */}
            <div>
              <Label className="text-sm text-gray-700">Leading Icon</Label>
              {config.leadingIcon ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-2 border rounded px-3 py-2 bg-white">
                    {renderIconPreview(config.leadingIcon)}
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, leadingIcon: undefined }))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <Select
                    value={config.iconConfig?.leadingSize || 'md'}
                    onValueChange={(val) => setConfig(prev => ({
                      ...prev,
                      iconConfig: { ...prev.iconConfig, leadingSize: val as any }
                    }))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xs">XS</SelectItem>
                      <SelectItem value="sm">SM</SelectItem>
                      <SelectItem value="md">MD</SelectItem>
                      <SelectItem value="lg">LG</SelectItem>
                      <SelectItem value="xl">XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIconPickerOpen('leading')}
                  className="mt-1"
                >
                  <Plus size={14} className="mr-2" />
                  Add Leading Icon
                </Button>
              )}
            </div>

            {/* Trailing Icon */}
            <div>
              <Label className="text-sm text-gray-700">Trailing Icon</Label>
              {config.trailingIcon ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-2 border rounded px-3 py-2 bg-white">
                    {renderIconPreview(config.trailingIcon)}
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, trailingIcon: undefined }))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <Select
                    value={config.iconConfig?.trailingSize || 'md'}
                    onValueChange={(val) => setConfig(prev => ({
                      ...prev,
                      iconConfig: { ...prev.iconConfig, trailingSize: val as any }
                    }))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xs">XS</SelectItem>
                      <SelectItem value="sm">SM</SelectItem>
                      <SelectItem value="md">MD</SelectItem>
                      <SelectItem value="lg">LG</SelectItem>
                      <SelectItem value="xl">XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIconPickerOpen('trailing')}
                  className="mt-1"
                >
                  <Plus size={14} className="mr-2" />
                  Add Trailing Icon
                </Button>
              )}
            </div>
          </div>

          {/* Explicit destination config — hidden while following the goal. */}
          {!followGoal && (<>
          {/* Button Action Type */}
          <div>
            <Label>Button Action*</Label>
            <RadioGroup
              value={config.type}
              onValueChange={(val) => setConfig(prev => ({ ...prev, type: val as any }))}
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="link" id="link" />
                <div>
                  <Label htmlFor="link">External Link</Label>
                  <p className="text-sm text-gray-600">
                    Redirect to external URL like Typeform, Calendly, etc.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 mt-2">
                <RadioGroupItem value="form" id="form" />
                <div>
                  <Label htmlFor="form">Native Form</Label>
                  <p className="text-sm text-gray-600">
                    Create a custom form with built-in integrations.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 mt-2">
                <RadioGroupItem value="link-with-input" id="link-with-input" />
                <div>
                  <Label htmlFor="link-with-input">Link with Input Field</Label>
                  <p className="text-sm text-gray-600">
                    Collect user input and pass to external URL as query parameter
                  </p>
                </div>
              </div>

              {pageOptions.length > 1 && (
                <div className="flex items-start space-x-2 mt-2">
                  <RadioGroupItem value="page" id="page" />
                  <div>
                    <Label htmlFor="page">Link to Page</Label>
                    <p className="text-sm text-gray-600">
                      Navigate to another page in this project.
                    </p>
                  </div>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Internal page configuration */}
          {config.type === 'page' && (
            <div>
              <Label htmlFor="page-target">Page*</Label>
              <Select
                value={config.pathSlug || ''}
                onValueChange={(val) => setConfig(prev => ({ ...prev, pathSlug: val }))}
              >
                <SelectTrigger id="page-target">
                  <SelectValue placeholder="Choose page…" />
                </SelectTrigger>
                <SelectContent>
                  {pageOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.page && <p className="text-sm text-red-500 mt-1">{errors.page}</p>}
            </div>
          )}

          {/* Link Configuration */}
          {config.type === 'link' && (
            <div>
              <Label htmlFor="url">URL*</Label>
              <Input
                id="url"
                type="url"
                value={config.url || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://your-link.com"
              />
              {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url}</p>}
            </div>
          )}

          {/* Form Configuration */}
          {config.type === 'form' && (
            <div className="space-y-3">
              <div>
                <Label>Form Selection*</Label>
                <div className="space-y-2">
                  {availableForms.length > 0 ? (
                    <Select 
                      value={config.formId || ''} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, formId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a form" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableForms.map((form: any) => (
                          <SelectItem key={form.id} value={form.id}>
                            {form.name} ({form.fields.length} fields)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-gray-600">
                      No forms available. Create your first form below.
                    </div>
                  )}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCreateNewForm}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Form
                  </Button>
                </div>
                {errors.form && <p className="text-sm text-red-500 mt-1">{errors.form}</p>}
              </div>

              {config.formId && (() => {
                const selectedForm = availableForms.find((f: any) => f.id === config.formId);
                const disabledOptions = getDisabledBehaviorOptions(
                  selectedForm,
                  config.ctaType || 'primary',
                  hasPrimaryCTASection(sections)
                );

                return (
                  <div className="space-y-2">
                    <Label>Button Behavior</Label>

                    {/* Show info message if both options disabled (single-field) */}
                    {disabledOptions.disableModal && disabledOptions.disableScroll && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <strong>Single-field forms display inline</strong>
                          <p className="mt-1 text-blue-700">
                            This form will appear as an email input + button, replacing the CTA button for better conversion.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Show warning if scroll disabled but modal available */}
                    {disabledOptions.disableScroll && !disabledOptions.disableModal && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <strong>Modal only</strong>
                          <p className="mt-1 text-amber-700">
                            {disabledOptions.reason}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Only show behavior options if not single-field */}
                    {!(disabledOptions.disableModal && disabledOptions.disableScroll) && (
                      <RadioGroup
                        value={config.behavior || (disabledOptions.disableScroll ? 'openModal' : 'scrollTo')}
                        onValueChange={(val) => setConfig(prev => ({ ...prev, behavior: val as 'scrollTo' | 'openModal' }))}
                      >
                        <div className={`flex items-center space-x-2 ${disabledOptions.disableScroll ? 'opacity-50' : ''}`}>
                          <RadioGroupItem
                            value="scrollTo"
                            id="scroll-to"
                            disabled={disabledOptions.disableScroll}
                          />
                          <Label htmlFor="scroll-to" className={disabledOptions.disableScroll ? 'cursor-not-allowed' : ''}>
                            Scroll to Form
                          </Label>
                        </div>
                        <div className={`flex items-center space-x-2 ${disabledOptions.disableModal ? 'opacity-50' : ''}`}>
                          <RadioGroupItem
                            value="openModal"
                            id="open-modal"
                            disabled={disabledOptions.disableModal}
                          />
                          <Label htmlFor="open-modal" className={disabledOptions.disableModal ? 'cursor-not-allowed' : ''}>
                            Open in Modal
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Link with Input Configuration */}
          {config.type === 'link-with-input' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="url">URL*</Label>
                <Input
                  id="url"
                  type="url"
                  value={config.url || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://workspace.iley.app/auth"
                />
                {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url}</p>}
              </div>

              <div>
                <Label htmlFor="queryParamName">Query Parameter Name*</Label>
                <Input
                  id="queryParamName"
                  value={config.inputConfig?.queryParamName || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    inputConfig: { ...prev.inputConfig, queryParamName: e.target.value }
                  }))}
                  placeholder="prompt"
                />
                {errors.queryParamName && <p className="text-sm text-red-500 mt-1">{errors.queryParamName}</p>}
              </div>

              <div>
                <Label htmlFor="inputLabel">Input Label (Optional)</Label>
                <Input
                  id="inputLabel"
                  value={config.inputConfig?.label || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    inputConfig: { ...prev.inputConfig, label: e.target.value }
                  }))}
                  placeholder="Describe your creative vision..."
                />
              </div>

              <div>
                <Label htmlFor="inputPlaceholder">Input Placeholder (Optional)</Label>
                <Input
                  id="inputPlaceholder"
                  value={config.inputConfig?.placeholder || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    inputConfig: { ...prev.inputConfig, placeholder: e.target.value }
                  }))}
                  placeholder="Try: 'create anime style portrait'"
                />
              </div>
            </div>
          )}
          </>)}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
          </div>
      </DialogContent>

      {/* Icon Picker Modal */}
      {iconPickerOpen && (
        <IconPicker
          value={iconPickerOpen === 'leading' ? (config.leadingIcon || '') : (config.trailingIcon || '')}
          onChange={(icon: string) => {
            if (iconPickerOpen === 'leading') {
              setConfig(prev => ({ ...prev, leadingIcon: icon }));
            } else {
              setConfig(prev => ({ ...prev, trailingIcon: icon }));
            }
            setIconPickerOpen(null);
          }}
          onClose={() => setIconPickerOpen(null)}
        />
      )}
    </Dialog>
  );
}