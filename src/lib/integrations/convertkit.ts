// ConvertKit API integration
// Documentation: https://developers.convertkit.com/

interface ConvertKitConfig {
  apiKey: string;
  apiSecret?: string;
  formId?: string;
}

interface ConvertKitSubscriber {
  email: string;
  first_name?: string;
  last_name?: string;
  fields?: Record<string, any>;
  tags?: string[];
}

interface ConvertKitResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class ConvertKitIntegration {
  private baseUrl = 'https://api.convertkit.com/v3';
  
  constructor(private config: ConvertKitConfig) {}

  /**
   * Add subscriber to ConvertKit
   */
  async addSubscriber(subscriber: ConvertKitSubscriber): Promise<ConvertKitResponse> {
    try {
      const endpoint = this.config.formId 
        ? `${this.baseUrl}/forms/${this.config.formId}/subscribe`
        : `${this.baseUrl}/subscribers`;

      const payload = {
        api_key: this.config.apiKey,
        email: subscriber.email,
        first_name: subscriber.first_name,
        ...(subscriber.fields && { fields: subscriber.fields }),
        ...(subscriber.tags && { tags: subscriber.tags }),
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'ConvertKit API error',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown ConvertKit error',
      };
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<ConvertKitResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/account?api_key=${this.config.apiKey}`);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Invalid API key',
        };
      }

      return {
        success: true,
        data: {
          account_name: data.name,
          account_email: data.primary_email_address,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  /**
   * Get forms associated with the account
   */
  async getForms(): Promise<ConvertKitResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/forms?api_key=${this.config.apiKey}`);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to fetch forms',
        };
      }

      return {
        success: true,
        data: data.forms || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch forms',
      };
    }
  }

  /**
   * Add tags to a subscriber
   */
  async addTagsToSubscriber(email: string, tags: string[]): Promise<ConvertKitResponse> {
    try {
      const results = await Promise.all(
        tags.map(async (tag) => {
          const response = await fetch(`${this.baseUrl}/tags`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              api_key: this.config.apiKey,
              tag: {
                name: tag,
                email: email,
              },
            }),
          });
          
          return response.json();
        })
      );

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add tags',
      };
    }
  }
}

/**
 * Helper function to map form data to ConvertKit subscriber
 */
export function mapFormDataToSubscriber(formData: Record<string, any>): ConvertKitSubscriber {
  const subscriber: ConvertKitSubscriber = {
    email: '',
  };

  // Extract email (required)
  const emailField = Object.entries(formData).find(([key, value]) => 
    key.toLowerCase().includes('email') && typeof value === 'string' && value.includes('@')
  );
  
  if (emailField) {
    subscriber.email = emailField[1] as string;
  }

  // Extract first name
  const firstNameFields = ['firstName', 'first_name', 'fname', 'name'];
  for (const field of firstNameFields) {
    if (formData[field] && typeof formData[field] === 'string') {
      subscriber.first_name = formData[field];
      break;
    }
  }

  // Extract last name
  const lastNameFields = ['lastName', 'last_name', 'lname', 'surname'];
  for (const field of lastNameFields) {
    if (formData[field] && typeof formData[field] === 'string') {
      subscriber.last_name = formData[field];
      break;
    }
  }

  // If we have a single "name" field, try to split it
  if (!subscriber.first_name && !subscriber.last_name && formData.name) {
    const nameParts = String(formData.name).trim().split(' ');
    if (nameParts.length >= 2) {
      subscriber.first_name = nameParts[0];
      subscriber.last_name = nameParts.slice(1).join(' ');
    } else if (nameParts.length === 1) {
      subscriber.first_name = nameParts[0];
    }
  }

  // Map all other fields to custom fields
  const customFields: Record<string, any> = {};
  const excludeFields = new Set(['email', 'firstName', 'first_name', 'fname', 'lastName', 'last_name', 'lname', 'name', 'surname']);
  
  Object.entries(formData).forEach(([key, value]) => {
    if (!excludeFields.has(key) && value !== null && value !== undefined && value !== '') {
      customFields[key] = value;
    }
  });

  if (Object.keys(customFields).length > 0) {
    subscriber.fields = customFields;
  }

  return subscriber;
}

/**
 * Validate ConvertKit configuration
 */
export function validateConvertKitConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.apiKey || typeof config.apiKey !== 'string') {
    errors.push('API key is required');
  }

  if (config.apiKey && config.apiKey.length < 10) {
    errors.push('API key appears to be invalid (too short)');
  }

  if (config.formId && (typeof config.formId !== 'string' && typeof config.formId !== 'number')) {
    errors.push('Form ID must be a string or number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}