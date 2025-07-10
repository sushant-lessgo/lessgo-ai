// utils/contentSerialization.ts - Content serialization utilities
import type { SerializedContent, ContentValidationResult } from '@/hooks/useContentSerializer';
import type { UniversalElementInstance } from '@/types/universalElements';

export function validateContentStructure(data: any): ContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return { isValid: false, errors, warnings };
  }

  if (typeof data.version !== 'number') {
    errors.push('Version must be a number');
  }

  if (typeof data.timestamp !== 'number') {
    errors.push('Timestamp must be a number');
  }

  if (!Array.isArray(data.sections)) {
    errors.push('Sections must be an array');
  }

  if (!data.sectionLayouts || typeof data.sectionLayouts !== 'object') {
    errors.push('Section layouts must be an object');
  }

  if (!data.content || typeof data.content !== 'object') {
    errors.push('Content must be an object');
  }

  if (!data.theme || typeof data.theme !== 'object') {
    errors.push('Theme must be an object');
  }

  if (!data.metadata || typeof data.metadata !== 'object') {
    errors.push('Metadata must be an object');
  } else {
    if (typeof data.metadata.title !== 'string') {
      errors.push('Metadata title must be a string');
    }
    if (typeof data.metadata.tokenId !== 'string') {
      errors.push('Metadata tokenId must be a string');
    }
    if (typeof data.metadata.lastUpdated !== 'number') {
      errors.push('Metadata lastUpdated must be a number');
    }
  }

  if (data.sections && data.sectionLayouts) {
    data.sections.forEach((sectionId: string) => {
      if (!data.sectionLayouts[sectionId]) {
        warnings.push(`Missing layout for section: ${sectionId}`);
      }
    });
  }

  if (data.sections && data.content) {
    data.sections.forEach((sectionId: string) => {
      if (!data.content[sectionId]) {
        warnings.push(`Missing content for section: ${sectionId}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function serializeUniversalElements(elements: Record<string, UniversalElementInstance>): Record<string, any> {
  const serialized: Record<string, any> = {};
  
  Object.entries(elements).forEach(([key, element]) => {
    serialized[key] = {
      id: element.id,
      type: element.type,
      props: element.props,
      meta: element.meta,
    };
  });
  
  return serialized;
}

export function deserializeUniversalElements(serialized: Record<string, any>): Record<string, UniversalElementInstance> {
  const elements: Record<string, UniversalElementInstance> = {};
  
  Object.entries(serialized).forEach(([key, data]) => {
    if (data && typeof data === 'object' && data.id && data.type) {
      elements[key] = {
        id: data.id,
        type: data.type,
        props: data.props || {},
        meta: data.meta || { createdAt: Date.now() },
      };
    }
  });
  
  return elements;
}

export function validateSectionData(sectionData: any): boolean {
  if (!sectionData || typeof sectionData !== 'object') {
    return false;
  }

  if (typeof sectionData.id !== 'string') {
    return false;
  }

  if (typeof sectionData.layout !== 'string') {
    return false;
  }

  if (!sectionData.elements || typeof sectionData.elements !== 'object') {
    return false;
  }

  return true;
}

export function cleanupSerializedContent(data: SerializedContent): SerializedContent {
  const cleaned = { ...data };
  
  if (cleaned.sections) {
    cleaned.sections = cleaned.sections.filter(id => cleaned.content[id]);
  }
  
  Object.keys(cleaned.content).forEach(sectionId => {
    if (!cleaned.sections.includes(sectionId)) {
      delete cleaned.content[sectionId];
    }
  });
  
  return cleaned;
}

export function getContentSummary(data: SerializedContent): {
  sectionsCount: number;
  elementsCount: number;
  hasTheme: boolean;
  size: string;
} {
  const sectionsCount = data.sections?.length || 0;
  const elementsCount = Object.values(data.content || {}).reduce((total, section: any) => {
    return total + (section.elements ? Object.keys(section.elements).length : 0);
  }, 0);
  const hasTheme = !!(data.theme && Object.keys(data.theme).length > 0);
  const size = new Blob([JSON.stringify(data)]).size;
  const sizeFormatted = size > 1024 ? `${(size / 1024).toFixed(2)}KB` : `${size}B`;

  return {
    sectionsCount,
    elementsCount,
    hasTheme,
    size: sizeFormatted,
  };
}