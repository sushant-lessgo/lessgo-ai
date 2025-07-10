// types/universalElements.ts - Universal element type definitions and configurations

export type UniversalElementType = 
  | 'text'
  | 'headline' 
  | 'list'
  | 'button'
  | 'link'
  | 'image'
  | 'icon'
  | 'spacer'
  | 'container';

export interface UniversalElementConfig {
  type: UniversalElementType;
  label: string;
  description: string;
  icon: string;
  category: 'text' | 'interactive' | 'media' | 'layout';
  defaultContent: string | string[];
  defaultProps: Record<string, any>;
  allowedProps: string[];
  requiredProps: string[];
  toolbarType: 'text' | 'element' | 'image';
  previewTemplate: string;
}

export interface UniversalElementInstance {
  id: string;
  elementKey: string;
  sectionId: string;
  type: UniversalElementType;
  content: string | string[];
  props: Record<string, any>;
  metadata: {
    addedManually: boolean;
    addedAt: number;
    lastModified: number;
    position: number;
    version: number;
  };
  editState: {
    isSelected: boolean;
    isEditing: boolean;
    isDirty: boolean;
    hasErrors: boolean;
    lastSaved?: number;
  };
  validation: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  autoFixable: boolean;
  suggestion?: string;
}

export interface ElementTemplate {
  id: string;
  name: string;
  type: UniversalElementType;
  content: string | string[];
  props: Record<string, any>;
  category: string;
  tags: string[];
  createdAt: number;
}

export interface AddElementOptions {
  position?: number;
  content?: string | string[];
  props?: Record<string, any>;
  autoFocus?: boolean;
  insertMode?: 'append' | 'prepend' | 'after' | 'before';
  referenceElementKey?: string;
}

export interface RemoveElementOptions {
  confirmRequired?: boolean;
  archiveInstead?: boolean;
  saveBackup?: boolean;
  updatePositions?: boolean;
}

export interface DuplicateElementOptions {
  targetPosition?: number;
  newElementKey?: string;
  preserveContent?: boolean;
  preserveProps?: boolean;
}

export interface CreateElementRequest {
  type: UniversalElementType;
  content?: string | string[];
  props?: Record<string, any>;
  position?: number;
}

export interface ElementUpdate {
  elementKey: string;
  field: string;
  value: any;
  metadata?: Record<string, any>;
}

export interface ElementSearchCriteria {
  sectionId?: string;
  elementType?: UniversalElementType;
  contentContains?: string;
  propsMatch?: Record<string, any>;
  dateRange?: { start: number; end: number };
  modifiedBy?: string;
}

export interface ElementValidationResult {
  elementKey: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  hasRequiredContent: boolean;
  propsValid: boolean;
}

export const UNIVERSAL_ELEMENTS: Record<UniversalElementType, UniversalElementConfig> = {
  text: {
    type: 'text',
    label: 'Text',
    description: 'Paragraph text content',
    icon: 'type',
    category: 'text',
    defaultContent: 'Click to edit this text',
    defaultProps: {
      alignment: 'left',
      size: 'medium',
    },
    allowedProps: ['alignment', 'size', 'color'],
    requiredProps: [],
    toolbarType: 'text',
    previewTemplate: '<p>Sample paragraph text</p>',
  },
  headline: {
    type: 'headline',
    label: 'Headline',
    description: 'Heading text (H1-H6)',
    icon: 'heading',
    category: 'text',
    defaultContent: 'Your Headline Here',
    defaultProps: {
      level: 'h2',
      alignment: 'left',
    },
    allowedProps: ['level', 'alignment', 'size', 'color'],
    requiredProps: ['level'],
    toolbarType: 'text',
    previewTemplate: '<h2>Sample Headline</h2>',
  },
  list: {
    type: 'list',
    label: 'List',
    description: 'Bulleted or numbered list',
    icon: 'list',
    category: 'text',
    defaultContent: ['List item 1', 'List item 2', 'List item 3'],
    defaultProps: {
      listType: 'bullet',
      spacing: 'normal',
    },
    allowedProps: ['listType', 'spacing', 'alignment'],
    requiredProps: ['listType'],
    toolbarType: 'text',
    previewTemplate: '<ul><li>Sample item</li></ul>',
  },
  button: {
    type: 'button',
    label: 'Button',
    description: 'Call-to-action button',
    icon: 'mouse-pointer',
    category: 'interactive',
    defaultContent: 'Click Here',
    defaultProps: {
      variant: 'primary',
      size: 'medium',
      url: '#',
    },
    allowedProps: ['variant', 'size', 'url', 'target', 'alignment'],
    requiredProps: ['variant'],
    toolbarType: 'element',
    previewTemplate: '<button>Sample Button</button>',
  },
  link: {
    type: 'link',
    label: 'Link',
    description: 'Text link',
    icon: 'link',
    category: 'interactive',
    defaultContent: 'Link text',
    defaultProps: {
      url: '#',
      target: '_self',
    },
    allowedProps: ['url', 'target', 'color', 'underline'],
    requiredProps: ['url'],
    toolbarType: 'element',
    previewTemplate: '<a href="#">Sample Link</a>',
  },
  image: {
    type: 'image',
    label: 'Image',
    description: 'Image element',
    icon: 'image',
    category: 'media',
    defaultContent: '/placeholder-image.jpg',
    defaultProps: {
      alt: 'Image description',
      size: 'medium',
      alignment: 'center',
    },
    allowedProps: ['alt', 'size', 'alignment', 'rounded', 'shadow'],
    requiredProps: ['alt'],
    toolbarType: 'image',
    previewTemplate: '<img src="/placeholder.jpg" alt="Sample Image" />',
  },
  icon: {
    type: 'icon',
    label: 'Icon',
    description: 'Icon element',
    icon: 'star',
    category: 'media',
    defaultContent: 'star',
    defaultProps: {
      size: 'medium',
      color: 'current',
    },
    allowedProps: ['size', 'color', 'style'],
    requiredProps: [],
    toolbarType: 'element',
    previewTemplate: '<svg>★</svg>',
  },
  spacer: {
    type: 'spacer',
    label: 'Spacer',
    description: 'Spacing element',
    icon: 'more-horizontal',
    category: 'layout',
    defaultContent: '',
    defaultProps: {
      height: 'medium',
      showInEdit: true,
    },
    allowedProps: ['height', 'showInEdit'],
    requiredProps: ['height'],
    toolbarType: 'element',
    previewTemplate: '<div style="height: 20px; border: 1px dashed #ccc;"></div>',
  },
  container: {
    type: 'container',
    label: 'Container',
    description: 'Content grouping container',
    icon: 'box',
    category: 'layout',
    defaultContent: '',
    defaultProps: {
      padding: 'medium',
      background: 'transparent',
      border: false,
    },
    allowedProps: ['padding', 'background', 'border', 'rounded'],
    requiredProps: [],
    toolbarType: 'element',
    previewTemplate: '<div>Container content</div>',
  },
};