// utils/dataParsingUtils.ts
// Centralized parsing utilities for pipe-separated and other data formats

export interface ListItem {
  id: string;
  index: number;
  [key: string]: any;
}

export interface StepItem extends ListItem {
  title: string;
  description: string;
  number: string;
}

export interface FeatureItem extends ListItem {
  title: string;
  description: string;
  icon?: string;
}

export interface TestimonialItem extends ListItem {
  quote: string;
  author: string;
  title?: string;
  company?: string;
  avatar?: string;
}

// Generic pipe-separated data parser
export function parsePipeData(
  data: string, 
  fallback: string[] = []
): string[] {
  if (!data || typeof data !== 'string') return fallback;
  return data.split('|').map(item => item.trim()).filter(item => item);
}

// Parse step data from multiple pipe-separated strings
export function parseStepData(
  titles: string, 
  descriptions: string, 
  numbers?: string
): StepItem[] {
  const titleList = parsePipeData(titles);
  const descriptionList = parsePipeData(descriptions);
  const numberList = parsePipeData(numbers || '');
  
  return titleList.map((title, index) => ({
    id: `step-${index}`,
    index,
    title,
    description: descriptionList[index] || 'Step description not provided.',
    number: numberList[index] || (index + 1).toString()
  }));
}

// Parse feature data
export function parseFeatureData(
  titles: string,
  descriptions: string,
  icons?: string
): FeatureItem[] {
  const titleList = parsePipeData(titles);
  const descriptionList = parsePipeData(descriptions);
  const iconList = parsePipeData(icons || '');
  
  return titleList.map((title, index) => ({
    id: `feature-${index}`,
    index,
    title,
    description: descriptionList[index] || 'Feature description not provided.',
    icon: iconList[index] || 'star'
  }));
}

// Parse testimonial data
export function parseTestimonialData(
  quotes: string,
  authors: string,
  titles?: string,
  companies?: string,
  avatars?: string
): TestimonialItem[] {
  const quoteList = parsePipeData(quotes);
  const authorList = parsePipeData(authors);
  const titleList = parsePipeData(titles || '');
  const companyList = parsePipeData(companies || '');
  const avatarList = parsePipeData(avatars || '');
  
  return quoteList.map((quote, index) => ({
    id: `testimonial-${index}`,
    index,
    quote,
    author: authorList[index] || 'Anonymous',
    title: titleList[index] || '',
    company: companyList[index] || '',
    avatar: avatarList[index] || ''
  }));
}

// Generic list data updater
export function updateListData(
  currentData: string,
  index: number,
  newValue: string,
  separator: string = '|'
): string {
  const items = parsePipeData(currentData);
  items[index] = newValue;
  return items.join(separator);
}

// Bulk update multiple list properties
export function updateListItem<T extends Record<string, string>>(
  data: T,
  index: number,
  updates: Partial<T>
): T {
  const result = { ...data };
  
  Object.entries(updates).forEach(([key, value]) => {
    if (typeof value === 'string' && result[key]) {
      result[key as keyof T] = updateListData(result[key], index, value) as T[keyof T];
    }
  });
  
  return result;
}

// Validation helpers
export function validateListData(
  required: string[],
  data: Record<string, string>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  required.forEach(field => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    } else {
      const items = parsePipeData(data[field]);
      if (items.length === 0) {
        errors.push(`${field} must contain at least one item`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Check if all lists have the same length
export function validateListLengths(
  data: Record<string, string>,
  fields: string[]
): { isValid: boolean; expectedLength?: number; errors: string[] } {
  const lengths = fields.map(field => parsePipeData(data[field] || '').length);
  const expectedLength = Math.max(...lengths);
  const errors: string[] = [];
  
  fields.forEach((field, index) => {
    if (lengths[index] !== expectedLength && lengths[index] > 0) {
      errors.push(`${field} should have ${expectedLength} items, but has ${lengths[index]}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    expectedLength: expectedLength > 0 ? expectedLength : undefined,
    errors
  };
}

// Avatar management utilities
export interface CustomerAvatar {
  id: string;
  index: number;
  name: string;
  avatarUrl?: string;
}

// Parse customer avatar URLs from JSON string
export function parseAvatarUrls(avatarUrlsJson: string): Record<string, string> {
  try {
    return JSON.parse(avatarUrlsJson || '{}');
  } catch {
    return {};
  }
}

// Update avatar URLs JSON string
export function updateAvatarUrls(avatarUrlsJson: string, customerName: string, avatarUrl: string): string {
  const avatarUrls = parseAvatarUrls(avatarUrlsJson);
  if (avatarUrl === '') {
    delete avatarUrls[customerName];
  } else {
    avatarUrls[customerName] = avatarUrl;
  }
  return JSON.stringify(avatarUrls);
}

// Get avatar URL for a customer
export function getCustomerAvatarUrl(avatarUrlsJson: string, customerName: string): string {
  const avatarUrls = parseAvatarUrls(avatarUrlsJson);
  return avatarUrls[customerName] || '';
}

// Parse customer avatar data from names and URLs
export function parseCustomerAvatarData(
  customerNames: string,
  avatarUrlsJson: string = '{}'
): CustomerAvatar[] {
  const names = parsePipeData(customerNames);
  const avatarUrls = parseAvatarUrls(avatarUrlsJson);
  
  return names.map((name, index) => ({
    id: `customer-${index}`,
    index,
    name,
    avatarUrl: avatarUrls[name] || ''
  }));
}

// Update customer names and clean up orphaned avatar URLs
export function updateCustomerNamesWithAvatars(
  oldNames: string, 
  newNames: string, 
  avatarUrlsJson: string
): { names: string; avatarUrls: string } {
  const oldCustomers = parsePipeData(oldNames).map(name => name.trim());
  const newCustomers = parsePipeData(newNames).map(name => name.trim());
  const avatarUrls = parseAvatarUrls(avatarUrlsJson);
  
  // Remove avatar URLs for customers that no longer exist
  const cleanedAvatarUrls: Record<string, string> = {};
  newCustomers.forEach(customer => {
    if (avatarUrls[customer]) {
      cleanedAvatarUrls[customer] = avatarUrls[customer];
    }
  });
  
  return {
    names: newCustomers.join('|'),
    avatarUrls: JSON.stringify(cleanedAvatarUrls)
  };
}

// Generate customer initials for fallback display
export function getCustomerInitials(name: string): string {
  const words = name.trim().split(' ').filter(Boolean);
  if (words.length === 0) return 'U'; // Unknown
  if (words.length === 1) return name.substring(0, 2).toUpperCase();
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}