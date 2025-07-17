'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { SimpleFormData, SimpleFormField } from '@/types/simpleForms';

interface SimpleFormRendererProps {
  form: SimpleFormData;
  className?: string;
}

interface FormSubmissionData {
  [key: string]: string;
}

export function SimpleFormRenderer({ form, className }: SimpleFormRendererProps) {
  const [formData, setFormData] = useState<FormSubmissionData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    form.fields.forEach(field => {
      const value = formData[field.id]?.trim() || '';
      
      if (field.required && !value) {
        newErrors[field.id] = `${field.label} is required`;
        return;
      }
      
      // Email validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }
      
      // Phone validation (basic)
      if (field.type === 'phone' && value) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(value)) {
          newErrors[field.id] = 'Please enter a valid phone number';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically send the data to your backend
      console.log('Form submission:', {
        formId: form.id,
        formName: form.name,
        data: formData
      });
      
      setIsSubmitted(true);
      setFormData({});
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: SimpleFormField) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];
    
    const commonProps = {
      id: field.id,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleInputChange(field.id, e.target.value),
      placeholder: field.placeholder,
      className: error ? 'border-red-500' : ''
    };

    switch (field.type) {
      case 'text':
        return <Input {...commonProps} type="text" />;
      case 'email':
        return <Input {...commonProps} type="email" />;
      case 'phone':
        return <Input {...commonProps} type="tel" />;
      case 'textarea':
        return <Textarea {...commonProps} rows={3} />;
      default:
        return <Input {...commonProps} type="text" />;
    }
  };

  if (isSubmitted) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-gray-600">
              Your message has been sent successfully. We'll get back to you soon.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsSubmitted(false)}
              className="mt-4"
            >
              Send Another Message
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {form.fields.map(field => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderField(field)}
              {errors[field.id] && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  {errors[field.id]}
                </div>
              )}
            </div>
          ))}
          
          {form.privacyNote && (
            <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded">
              {form.privacyNote}
            </div>
          )}
          
          {errors.submit && (
            <div className="flex items-center gap-1 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              {errors.submit}
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : form.buttonText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}