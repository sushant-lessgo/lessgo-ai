'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// phase 4: GripVertical dropped — it was a decorative drag handle wired to nothing
// (see the field row below). ChevronUp/Down are the real reorder controls.
import { Plus, X, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import type {
  MVPForm,
  MVPFormAutoReply,
  MVPFormField,
  MVPFormFieldType,
  MVPFormIntegration,
} from '@/types/core/forms';
// lead-emails phase 3: autoReplyTemplate.ts is a PURE, zero-import module by design —
// safe to pull into this 'use client' file. Never import sendVisitorAutoReply/sendEmail/
// resolveOwnerEmail here: those drag Sentry/fetch/Clerk server code into the client bundle.
import { DEFAULT_AUTO_REPLY_SUBJECT, DEFAULT_AUTO_REPLY_BODY } from '@/lib/email/autoReplyTemplate';
import {
  getServiceFormTemplate,
  SERVICE_FORM_TEMPLATE_GOALS,
} from '@/modules/audience/service/formTemplates';
import { serviceGoalLabels } from '@/types/service';
import { logger } from '@/lib/logger';

interface FormBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  editingFormId?: string | null;
}

/**
 * The field types `FormMarkupPublished.tsx:16-22` can actually render.
 *
 * This literal is a HAND-MAINTAINED MIRROR of that file's module-local `FormField`
 * interface (it is not exported, so it cannot be imported and compared directly).
 * The two type gates below are what stop the mirror from silently drifting.
 */
export const PUBLISHED_SUPPORTED_FIELD_TYPES = ['text', 'email', 'tel', 'textarea', 'select'] as const;
type PublishedSupportedFieldType = (typeof PUBLISHED_SUPPORTED_FIELD_TYPES)[number];

/**
 * COMPILE-TIME GATE (toolbar-standard-beta phase 4, plan ruling 4 / step 6).
 *
 * Ruling 4 asked to RESTRICT the offered field types to the published-supported set.
 * VERIFIED AT IMPLEMENT TIME: they already were, and the restriction is carried by
 * the TYPE rather than by a runtime filter — `MVPFormFieldType`
 * (types/core/forms.ts:10) is EXACTLY the union FormMarkupPublished declares, so
 * FIELD_TYPES below (typed `MVPFormFieldType`) cannot gain a 6th entry. Step 6 was
 * therefore a no-op: nothing needed narrowing.
 *
 * What phase 4 DID add is this gate, because that equality was previously an
 * unenforced coincidence across two files that never referenced each other. It is
 * bidirectional on purpose:
 *   - `_publishedIsCovered` fails if MVPFormFieldType ever DROPS a type publish
 *     renders (the builder would stop offering something that works);
 *   - `_storeIsNotWider` fails if MVPFormFieldType ever GAINS one publish cannot
 *     render (e.g. 'radio'/'file'/'date') — the silent-drop bug ruling 4 guards
 *     against, where a user builds a field that simply vanishes on publish.
 * It lives HERE, in app code, and NOT in FormBuilder.test.tsx — `tsconfig.json`
 * EXCLUDES test files from compilation, so a type assertion written in the test file
 * is never checked by `npx tsc --noEmit` and would be a gate that can never fail.
 * (Verified by mutation: adding 'radio' to MVPFormFieldType left the test-file
 * version of this gate perfectly green.)
 *
 * ⚠️ Do NOT "fix" any of this to the store's `FormFieldType` (types/store/state.ts:557),
 * which has 10 members. That interface is NOT the one this builder or `state.forms`
 * uses — `state.forms` is `Record<string, MVPForm>` (state.ts:511), i.e. the MVP
 * types ARE the store's form types here. Switching would WIDEN the offered set past
 * what publish renders. The three FormField interfaces are not reconciled on
 * purpose; that is its own spec.
 */
const _publishedIsCovered: PublishedSupportedFieldType extends MVPFormFieldType ? true : false = true;
const _storeIsNotWider: MVPFormFieldType extends PublishedSupportedFieldType ? true : false = true;
void _publishedIsCovered;
void _storeIsNotWider;

/** Exported for FormBuilder.test.tsx — the offered list is the runtime half of the gate above. */
export const FIELD_TYPES: { value: MVPFormFieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Text Input', description: 'Single line text field' },
  { value: 'email', label: 'Email', description: 'Email address field with validation' },
  { value: 'tel', label: 'Phone', description: 'Phone number field' },
  { value: 'textarea', label: 'Text Area', description: 'Multi-line text field' },
  { value: 'select', label: 'Dropdown', description: 'Select from predefined options' },
];

export function FormBuilder({ isOpen, onClose, editingFormId }: FormBuilderProps) {
  // Render-read: `forms` drives the edit-load effect below.
  const forms = useEditStore((s) => s.forms);
  // Actions read in handlers only (addForm/updateForm) — non-reactive.
  const storeApi = useEditStoreApi();

  const [formData, setFormData] = useState<Partial<MVPForm>>({
    name: '',
    fields: [],
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
    integrations: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load form data when editing
  useEffect(() => {
    if (editingFormId && forms?.[editingFormId]) {
      const existingForm = forms[editingFormId];
      setFormData({
        name: existingForm.name,
        fields: [...existingForm.fields],
        submitButtonText: existingForm.submitButtonText,
        successMessage: existingForm.successMessage,
        integrations: existingForm.integrations ? [...existingForm.integrations] : [],
        // Absent autoReply stays ABSENT (server treats absent as ON with the default
        // template) — we only persist a config once the owner touches this section.
        autoReply: existingForm.autoReply ? { ...existingForm.autoReply } : undefined,
      });
    } else {
      // Reset for new form
      setFormData({
        name: '',
        fields: [],
        submitButtonText: 'Submit',
        successMessage: 'Thank you for your submission!',
        integrations: [],
        autoReply: undefined,
      });
    }
    setErrors({});
  }, [editingFormId, forms, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Form name is required';
    }

    if (!formData.fields?.length) {
      newErrors.fields = 'At least one field is required';
    }


    // Validate fields
    formData.fields?.forEach((field, index) => {
      if (!field.label?.trim()) {
        newErrors[`field-${index}-label`] = 'Field label is required';
      }
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        newErrors[`field-${index}-options`] = 'Dropdown fields must have at least one option';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const { addForm, updateForm } = storeApi.getState();
      if (editingFormId) {
        // Update existing form
        updateForm(editingFormId, formData as Partial<MVPForm>);
      } else {
        // Create new form
        addForm(formData as Omit<MVPForm, 'id' | 'createdAt' | 'updatedAt'>);
      }
      onClose();
    } catch (error) {
      logger.error('Error saving form:', () => error);
    } finally {
      setIsSaving(false);
    }
  };

  // Phase 8: seed the in-progress form from a goal template. Only offered for a
  // new (not-yet-saved) form so it never clobbers an existing one.
  const handleLoadTemplate = (goal: (typeof SERVICE_FORM_TEMPLATE_GOALS)[number]) => {
    const tpl = getServiceFormTemplate(goal);
    setFormData({
      name: tpl.name,
      // Clone fields so edits don't mutate the shared template constant.
      fields: tpl.fields.map((f) => ({ ...f })),
      submitButtonText: tpl.submitButtonText,
      successMessage: tpl.successMessage,
      integrations: [],
    });
    setErrors({});
  };

  const handleAddField = () => {
    const newField: MVPFormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: `Field ${(formData.fields?.length || 0) + 1}`,
      placeholder: '',
      required: false,
    };

    setFormData(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField],
    }));
  };

  const handleUpdateField = (fieldIndex: number, updates: Partial<MVPFormField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields?.map((field, index) =>
        index === fieldIndex ? { ...field, ...updates } : field
      ) || [],
    }));
  };

  const handleRemoveField = (fieldIndex: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields?.filter((_, index) => index !== fieldIndex) || [],
    }));
  };

  /**
   * Field reorder — LOCAL-DRAFT ONLY (toolbar-standard-beta phase 4, plan ruling 4).
   *
   * This function already existed and was NEVER CALLED (dead since it was written);
   * phase 4 wires it to real move up/down buttons. Its body is unchanged.
   *
   * WHY NOT the store's `reorderFormFields` (formActions.ts:120) — two independent
   * reasons, both verified:
   *   1. CONTRACT MISMATCH: its impl is `(formId, startIndex, endIndex)` but BOTH
   *      declared type contracts say `(formId, fieldIds[])`
   *      (types/store/formActions.ts:14, types/store/actions.ts:301) — so calling it
   *      through the typed store does not typecheck. Reconciling those three files
   *      is its own spec; do NOT do it from here.
   *   2. DRAFT DESYNC: FormBuilder edits a LOCAL `formData` copy and commits on Save
   *      via `updateForm` (handleSave, :106-113). A store write mid-draft would make
   *      the store and the open draft disagree, and the next Save would clobber it.
   * Add/edit/remove already work exactly this way, so reorder is now consistent with
   * them rather than being the one field op that writes straight through.
   */
  const handleMoveField = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const fields = [...(prev.fields || [])];
      if (toIndex < 0 || toIndex >= fields.length) return prev;
      const [movedField] = fields.splice(fromIndex, 1);
      fields.splice(toIndex, 0, movedField);
      return { ...prev, fields };
    });
  };

  /**
   * Visitor auto-reply settings — LOCAL-DRAFT ONLY (lead-emails phase 3).
   *
   * Same contract as every other field here: edits land in `formData` and are
   * committed by `handleSave` → `updateForm`. Do NOT write to the store mid-draft
   * (see the desync note on `handleMoveField` above).
   *
   * `enabled` defaults to TRUE because the send path treats an ABSENT config as ON
   * (`sendVisitorAutoReply`: `form?.autoReply?.enabled !== false`), so the first
   * write must not silently flip the feature off.
   */
  const handleUpdateAutoReply = (updates: Partial<MVPFormAutoReply>) => {
    setFormData(prev => ({
      ...prev,
      autoReply: {
        enabled: prev.autoReply?.enabled !== false,
        ...(prev.autoReply ?? {}),
        ...updates,
      },
    }));
  };

  const handleAddIntegration = (type: 'dashboard' | 'convertkit') => {
    const newIntegration: MVPFormIntegration = {
      id: `integration-${Date.now()}`,
      type,
      name: type === 'dashboard' ? 'Dashboard Storage' : 'ConvertKit',
      enabled: true,
      settings: {},
    };

    setFormData(prev => ({
      ...prev,
      integrations: [...(prev.integrations || []), newIntegration],
    }));
  };

  const handleUpdateIntegration = (integrationIndex: number, updates: Partial<MVPFormIntegration>) => {
    setFormData(prev => ({
      ...prev,
      integrations: prev.integrations?.map((integration, index) =>
        index === integrationIndex ? { ...integration, ...updates } : integration
      ) || [],
    }));
  };

  const handleRemoveIntegration = (integrationIndex: number) => {
    setFormData(prev => ({
      ...prev,
      integrations: prev.integrations?.filter((_, index) => index !== integrationIndex) || [],
    }));
  };

  // Mirrors the server default: absent config = auto-reply ON.
  const autoReplyEnabled = formData.autoReply?.enabled !== false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingFormId ? 'Edit Form' : 'Create New Form'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form-name">Form Name*</Label>
              <Input
                id="form-name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contact Form"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="submit-button">Submit Button Text</Label>
              <Input
                id="submit-button"
                value={formData.submitButtonText || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, submitButtonText: e.target.value }))}
                placeholder="Submit"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="success-message">Success Message</Label>
            <Textarea
              id="success-message"
              value={formData.successMessage || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, successMessage: e.target.value }))}
              placeholder="Thank you for your submission!"
              rows={2}
            />
          </div>

          {/* Auto-reply email (lead-emails phase 3) */}
          <div data-testid="auto-reply-section" className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium">Auto-reply email</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Sent automatically to the visitor's email address after they submit. Replies go
                  to your inbox.
                </p>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <input
                  type="checkbox"
                  id="auto-reply-enabled"
                  data-testid="auto-reply-enabled"
                  checked={autoReplyEnabled}
                  onChange={(e) => handleUpdateAutoReply({ enabled: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="auto-reply-enabled">Send auto-reply</Label>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <Label
                  htmlFor="auto-reply-subject"
                  className={autoReplyEnabled ? undefined : 'text-gray-400'}
                >
                  Subject
                </Label>
                <Input
                  id="auto-reply-subject"
                  data-testid="auto-reply-subject"
                  value={formData.autoReply?.subject || ''}
                  onChange={(e) => handleUpdateAutoReply({ subject: e.target.value })}
                  placeholder={DEFAULT_AUTO_REPLY_SUBJECT}
                  disabled={!autoReplyEnabled}
                  className={autoReplyEnabled ? undefined : 'bg-gray-100 text-gray-400'}
                />
              </div>

              <div>
                <Label
                  htmlFor="auto-reply-body"
                  className={autoReplyEnabled ? undefined : 'text-gray-400'}
                >
                  Message
                </Label>
                <Textarea
                  id="auto-reply-body"
                  data-testid="auto-reply-body"
                  value={formData.autoReply?.body || ''}
                  onChange={(e) => handleUpdateAutoReply({ body: e.target.value })}
                  placeholder={DEFAULT_AUTO_REPLY_BODY}
                  rows={3}
                  disabled={!autoReplyEnabled}
                  className={autoReplyEnabled ? undefined : 'bg-gray-100 text-gray-400'}
                />
                <p className="text-xs text-gray-600 mt-1">
                  {'Use {name} for the visitor’s name and {business} for your business name. '}
                  Leave both boxes empty to use the default wording.
                </p>
              </div>
            </div>

            {/* Greyed-and-disabled with a stated reason — never silently hidden. */}
            {!autoReplyEnabled && (
              <p data-testid="auto-reply-disabled-reason" className="text-xs text-gray-500 mt-3">
                Auto-reply is off, so visitors get no confirmation email. Turn it back on to edit
                the text.
              </p>
            )}
          </div>

          {/* Start-from-template picker — only for a new form */}
          {!editingFormId && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3">
              <span className="text-sm text-gray-600">Start from a template:</span>
              {SERVICE_FORM_TEMPLATE_GOALS.map((goal) => (
                <Button
                  key={goal}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleLoadTemplate(goal)}
                >
                  {serviceGoalLabels[goal]}
                </Button>
              ))}
            </div>
          )}

          {/* Form Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Form Fields</h3>
              <Button onClick={handleAddField} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>

            {errors.fields && <p className="text-sm text-red-500 mb-4">{errors.fields}</p>}

            <div className="space-y-4">
              {formData.fields?.map((field, index) => (
                <div key={field.id} data-testid="form-field-row" className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {/* phase 4: real move up/down replaces a DECORATIVE
                          `<GripVertical className="cursor-move" />`, which promised
                          drag-and-drop that was never wired to anything (the local
                          `handleMoveField` had zero callers). A fake affordance that
                          does nothing on drag is the naayom-C2 "dead control reads as
                          a bug" failure — so it is removed, not kept beside these.
                          Adjacent swap, matching SocialItemsEditor; no @dnd-kit. */}
                      <div className="flex flex-col">
                        <button
                          type="button"
                          data-testid="form-field-move-up"
                          onClick={() => handleMoveField(index, index - 1)}
                          disabled={index === 0}
                          title="Move field up"
                          aria-label={`Move field ${index + 1} up`}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          data-testid="form-field-move-down"
                          onClick={() => handleMoveField(index, index + 1)}
                          disabled={index === (formData.fields?.length || 0) - 1}
                          title="Move field down"
                          aria-label={`Move field ${index + 1} down`}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-sm font-medium">Field {index + 1}</span>
                    </div>
                    <Button
                      onClick={() => handleRemoveField(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: MVPFormFieldType) =>
                          handleUpdateField(index, { type: value })
                        }
                      >
                        <SelectTrigger data-testid="form-field-type-trigger">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((fieldType) => (
                            <SelectItem
                              key={fieldType.value}
                              value={fieldType.value}
                              data-testid="form-field-type-option"
                            >
                              {fieldType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Field Label*</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                        placeholder="Enter field label"
                      />
                      {errors[`field-${index}-label`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`field-${index}-label`]}</p>
                      )}
                    </div>

                    <div>
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder || ''}
                        onChange={(e) => handleUpdateField(index, { placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                      />
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="mt-4">
                      <Label>Options (one per line)*</Label>
                      <Textarea
                        value={field.options?.join('\n') || ''}
                        onChange={(e) => {
                          const options = e.target.value.split('\n').filter(opt => opt.trim());
                          handleUpdateField(index, { options });
                        }}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        rows={3}
                      />
                      {errors[`field-${index}-options`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`field-${index}-options`]}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={field.required}
                      onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor={`required-${index}`}>Required field</Label>
                  </div>
                </div>
              ))}

              {formData.fields?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No fields added yet. Click "Add Field" to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Form Integrations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Data Storage</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleAddIntegration('dashboard')} 
                  size="sm" 
                  variant="outline"
                  disabled={formData.integrations?.some(i => i.type === 'dashboard')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  onClick={() => handleAddIntegration('convertkit')} 
                  size="sm" 
                  variant="outline"
                  disabled={formData.integrations?.some(i => i.type === 'convertkit')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  ConvertKit
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {formData.integrations?.map((integration, index) => (
                <div key={integration.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={integration.enabled}
                          onChange={(e) => handleUpdateIntegration(index, { enabled: e.target.checked })}
                          className="rounded"
                        />
                        <span className="font-medium">{integration.name}</span>
                      </div>
                      <span className="text-sm text-gray-500 capitalize">({integration.type})</span>
                    </div>
                    <Button
                      onClick={() => handleRemoveIntegration(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {integration.type === 'convertkit' && integration.enabled && (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label>API Key*</Label>
                        <Input
                          type="password"
                          value={integration.settings?.apiKey || ''}
                          onChange={(e) => handleUpdateIntegration(index, {
                            settings: { ...integration.settings, apiKey: e.target.value }
                          })}
                          placeholder="Enter ConvertKit API key"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Find your API key in ConvertKit Account Settings → API Keys
                        </p>
                      </div>
                      <div>
                        <Label>Form ID (Optional)</Label>
                        <Input
                          value={integration.settings?.formId || ''}
                          onChange={(e) => handleUpdateIntegration(index, {
                            settings: { ...integration.settings, formId: e.target.value }
                          })}
                          placeholder="ConvertKit form ID"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Leave empty to use default subscriber list
                        </p>
                      </div>
                    </div>
                  )}

                  {integration.type === 'dashboard' && integration.enabled && (
                    <div className="text-sm text-gray-600">
                      <p>✓ Form submissions will be stored in your dashboard</p>
                      <p>✓ View and export submissions from the main dashboard</p>
                    </div>
                  )}
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">
                  <p>No integrations configured. Add Dashboard or ConvertKit integration above.</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingFormId ? 'Update Form' : 'Create Form'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}