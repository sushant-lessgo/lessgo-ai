# Native Forms

Form builder + renderer for landing pages. Components in this dir:
`FormBuilder.tsx` (edit-time builder modal), `FormRenderer.tsx` (edit/preview render),
`FormConnectedButton.tsx` (button → form wiring), `FormPlacementRenderer.tsx`
(placement/positioning), `InlineFormInput.tsx` (inline field). Published pages render a
server-safe island (`src/components/published/FormIsland.tsx` / `FormMarkupPublished.tsx`);
runtime submit is handled by the minified `formHandler.js` → `public/assets/form.v2.js`
(v2 = no owner id in the markup or the POST body; the frozen `form.v1.js`, built from
`scripts/legacy/form.v1.src.js`, still serves pre-existing immutable blobs).

> **Status note:** the "submissions only logged to console" / "SMTP" wording lower in this
> doc is **stale**. `POST /api/forms/submit` (`withFormRateLimit`, `createSecureResponse`)
> now **persists `FormSubmission`** via Prisma, runs configured **integrations**
> (ConvertKit live via `src/lib/integrations/convertkit.ts`, plus a `dashboard` sink and
> `blogSubscriber` upsert), and sends a **lead-notification email** via
> `src/lib/email/sendLeadNotification.ts` (env-gated: `RESEND_API_KEY` +
> `LEAD_NOTIFICATION_EMAIL`). See `src/app/api/README.md`.

## Overview

The native forms feature allows users to:
1. Create forms with basic field types (text, email, tel, textarea, select)
2. Configure form settings (name, submit button text, success message)
3. Link buttons to forms with scroll-to or modal behavior
4. Handle form submissions via API (logs submissions for now)

## Components

### 1. FormBuilder (`FormBuilder.tsx`)
Modal component for creating and editing forms.
- Add/remove/reorder form fields
- Configure form settings (name, submit text, success message)
- Field validation and configuration

### 2. FormRenderer (`FormRenderer.tsx`)
Renders forms on the frontend with:
- Client-side validation
- Form submission handling
- Success/error states
- Responsive design

### 3. FormField (`FormField.tsx`)
Individual form field component supporting:
- Text input
- Email input
- Phone input
- Textarea
- Select dropdown

### 4. FormSection (`FormSection.tsx`)
Section component for displaying forms in landing pages.

### 5. GlobalFormBuilder (`GlobalFormBuilder.tsx`)
Global modal integration with the edit store.

## Store Integration

Forms are managed through the edit store with the following structure:

```typescript
// State
interface FormsSlice {
  forms?: Record<string, MVPForm>;
  formBuilderOpen?: boolean;
  editingFormId?: string | null;
}

// Actions
- createForm(form: Omit<MVPForm, 'id' | 'createdAt' | 'updatedAt'>): string
- updateForm(id: string, updates: Partial<MVPForm>): void
- deleteForm(id: string): void
- addFormField(formId: string, field: Omit<MVPFormField, 'id'>): void
- updateFormField(formId: string, fieldId: string, updates: Partial<MVPFormField>): void
- removeFormField(formId: string, fieldId: string): void
- showFormBuilder(formId?: string): void
- hideFormBuilder(): void
- getAllForms(): MVPForm[]
```

## Usage Examples

### Creating a Form
```typescript
const { createForm, showFormBuilder } = useEditStore();

// Create a new form programmatically
const formId = createForm({
  name: 'Contact Form',
  fields: [
    { type: 'text', label: 'Name', required: true },
    { type: 'email', label: 'Email', required: true },
    { type: 'textarea', label: 'Message', required: false }
  ],
  submitButtonText: 'Send Message',
  successMessage: 'Thank you for your message!'
});

// Or open form builder UI
showFormBuilder();
```

### Rendering a Form
```typescript
import { FormRenderer } from '@/components/forms/FormRenderer';

function ContactSection() {
  const { forms } = useEditStore();
  const contactForm = forms['contact-form-id'];

  if (!contactForm) return null;

  return (
    <div className="py-12">
      <h2>Contact Us</h2>
      <FormRenderer form={contactForm} />
    </div>
  );
}
```

### Linking Button to Form
The ButtonConfigurationModal automatically supports native forms:
1. Select "Native Form" option
2. Choose existing form or create new one
3. Configure behavior (scroll to form or open in modal)

## API Integration

### Form Submission Endpoint
`POST /api/forms/submit`

```typescript
interface FormSubmissionRequest {
  formId: string;
  data: Record<string, any>;
  publishedPageId: string; // REQUIRED — the route derives the owner from this
  userId?: string;         // accepted-and-IGNORED (old blobs still send it); never trust it
}
```

The submitting page's owner is resolved server-side via `PublishedPage.userId` and gated on
the canonical `isServingPublishState` predicate. Never reintroduce a client-supplied owner id
(that was the forgery hole: `data-owner-id` in public HTML + a trusted body `userId`).

The API handles:
- Form validation
- Submission logging (for debugging)
- Response formatting

Note: Currently submissions are only logged to the console. In production, you would integrate with external services or store in a database.

## Field Types Supported

### Text (`text`)
- Single line text input
- Basic string validation

### Email (`email`)
- Email input with validation
- Validates email format

### Phone (`tel`)
- Phone number input
- Basic phone format validation

### Textarea (`textarea`)
- Multi-line text input
- Configurable rows

### Select (`select`)
- Dropdown selection
- Configurable options list

## Validation

### Client-side Validation
- Required field validation
- Email format validation
- Phone format validation (basic)
- Real-time validation feedback

### Server-side Validation
- Form existence validation
- Data structure validation
- CSRF protection (to be implemented)

## Styling and Theming

Forms automatically inherit the landing page theme:
- Colors from theme system
- Typography settings
- Responsive breakpoints
- Custom CSS class support

## Future Enhancements

1. **Additional Field Types**
   - File upload
   - Date/time pickers
   - Checkbox groups
   - Radio button groups

2. **Advanced Features**
   - Conditional logic
   - Multi-step forms
   - Form analytics
   - A/B testing

3. **Integrations**
   - CRM integrations (HubSpot, Salesforce)
   - Email marketing (Mailchimp, ConvertKit)
   - Zapier webhooks
   - Google Sheets integration

4. **Security**
   - CSRF protection
   - Rate limiting
   - Spam protection
   - Data encryption

## Testing

To test the implementation:

1. **Create a Form**
   - Click on a button element
   - Open "Button Settings"
   - Select "Native Form"
   - Click "Create New Form"

2. **Configure Form**
   - Add form fields
   - Set notification email
   - Configure submit settings

3. **Test Submission**
   - Preview the form
   - Fill out and submit
   - Check browser network tab for API calls
   - Check console for submission logs

## Troubleshooting

### Forms Not Showing in Button Config
- Check if `getAllForms()` returns data
- Verify forms are stored in edit store
- Check browser console for errors

### Form Submission Fails
- Check network tab for API errors
- Verify form ID exists
- Check SMTP configuration if using email

### Styling Issues
- Verify TailwindCSS classes are available
- Check for CSS conflicts
- Test responsive behavior

## Migration from Simple Forms

The implementation maintains backward compatibility with existing `simpleForms` while introducing the new `forms` system. The ButtonConfigurationModal works with both systems.