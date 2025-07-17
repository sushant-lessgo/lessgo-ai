// Simple form types for MVP implementation
export interface SimpleFormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
}

export interface SimpleFormData {
  id: string;
  name: string;
  title: string;
  fields: SimpleFormField[];
  buttonText: string;
  placement: 'hero' | 'cta-section';
  privacyNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormFieldOption {
  type: 'text' | 'email' | 'phone' | 'textarea';
  label: string;
  icon: string;
  placeholder: string;
}

export const FORM_FIELD_OPTIONS: FormFieldOption[] = [
  {
    type: 'text',
    label: 'Full Name',
    icon: 'user',
    placeholder: 'Enter your full name'
  },
  {
    type: 'email',
    label: 'Email Address',
    icon: 'email',
    placeholder: 'Enter your email address'
  },
  {
    type: 'phone',
    label: 'Phone Number',
    icon: 'phone',
    placeholder: 'Enter your phone number'
  },
  {
    type: 'textarea',
    label: 'Message',
    icon: 'message',
    placeholder: 'Enter your message'
  }
];