// components/layout/UniversalElementRenderer.tsx - Universal element rendering component

import React, { useMemo } from 'react';
import { EditableContent, EditableHeadline } from './EditableContent';
import type { UniversalElementType, UniversalElementInstance } from '@/types/universalElements';

interface UniversalElementRendererProps {
  element: UniversalElementInstance;
  mode: 'preview' | 'edit';
  onContentChange: (content: string | string[]) => void;
  onPropsChange: (props: Record<string, any>) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function UniversalElementRenderer({
  element,
  mode,
  onContentChange,
  onPropsChange,
  className = '',
  style = {},
}: UniversalElementRendererProps) {
  
  // Generate element-specific classes and styles
  const elementClasses = useMemo(() => {
    const baseClasses = ['universal-element'];
    const props = element.props;
    
    // Add type-specific classes
    baseClasses.push(`element-${element.type}`);
    
    // Add prop-based classes
    if (props.alignment) {
      baseClasses.push(`text-${props.alignment}`);
    }
    
    if (props.size) {
      const sizeMap = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg',
        xl: 'text-xl',
      };
      baseClasses.push(sizeMap[props.size as keyof typeof sizeMap] || 'text-base');
    }
    
    if (props.variant) {
      baseClasses.push(`variant-${props.variant}`);
    }
    
    return baseClasses.concat(className.split(' ')).filter(Boolean).join(' ');
  }, [element.type, element.props, className]);

  const elementStyle = useMemo(() => {
    const computedStyle = { ...style };
    const props = element.props;
    
    // Apply prop-based styles
    if (props.color) {
      computedStyle.color = props.color;
    }
    
    if (props.background && props.background !== 'transparent') {
      computedStyle.backgroundColor = props.background;
    }
    
    if (props.padding) {
      const paddingMap = {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem',
      };
      computedStyle.padding = paddingMap[props.padding as keyof typeof paddingMap] || props.padding;
    }
    
    if (props.rounded) {
      computedStyle.borderRadius = typeof props.rounded === 'boolean' ? '0.375rem' : props.rounded;
    }
    
    if (props.shadow) {
      computedStyle.boxShadow = typeof props.shadow === 'boolean' 
        ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' 
        : props.shadow;
    }
    
    return computedStyle;
  }, [style, element.props]);

  // Render element based on type
  const renderElement = () => {
    switch (element.type) {
      case 'text':
        return (
          <EditableContent
            mode={mode}
            value={element.content as string}
            onEdit={onContentChange}
            element="p"
            className={elementClasses}
            style={elementStyle}
            sectionId={element.sectionId}
            elementKey={element.elementKey}
            placeholder="Enter your text..."
            multiline
          />
        );

      case 'headline':
        const level = element.props.level || 'h2';
        return (
          <EditableHeadline
            mode={mode}
            value={element.content as string}
            onEdit={onContentChange}
            level={level as 'h1' | 'h2' | 'h3' | 'h4'}
            className={elementClasses}
            style={elementStyle}
            sectionId={element.sectionId}
            elementKey={element.elementKey}
            placeholder="Enter your headline..."
          />
        );

      case 'list':
        return (
          <UniversalList
            mode={mode}
            content={element.content as string[]}
            onEdit={onContentChange}
            listType={element.props.listType || 'bullet'}
            className={elementClasses}
            style={elementStyle}
            sectionId={element.sectionId}
            elementKey={element.elementKey}
          />
        );

      case 'button':
        return (
          <UniversalButton
            mode={mode}
            content={element.content as string}
            onEdit={onContentChange}
            props={element.props}
            onPropsChange={onPropsChange}
            className={elementClasses}
            style={elementStyle}
            sectionId={element.sectionId}
            elementKey={element.elementKey}
          />
        );

      case 'link':
        return (
          <UniversalLink
            mode={mode}
            content={element.content as string}
            onEdit={onContentChange}
            props={element.props}
            onPropsChange={onPropsChange}
            className={elementClasses}
            style={elementStyle}
            sectionId={element.sectionId}
            elementKey={element.elementKey}
          />
        );

      case 'image':
        return (
          <UniversalImage
            mode={mode}
            src={element.content as string}
            alt={element.props.alt || ''}
            props={element.props}
            onPropsChange={onPropsChange}
            className={elementClasses}
            style={elementStyle}
            sectionId={element.sectionId}
            elementKey={element.elementKey}
          />
        );

      case 'icon':
        return (
          <UniversalIcon
            mode={mode}
            iconName={element.content as string}
            props={element.props}
            onPropsChange={onPropsChange}
            className={elementClasses}
            style={elementStyle}
            sectionId={element.sectionId}
            elementKey={element.elementKey}
          />
        );

      case 'spacer':
        return (
          <UniversalSpacer
            mode={mode}
            height={element.props.height || 'medium'}
            showInEdit={element.props.showInEdit !== false}
            className={elementClasses}
            style={elementStyle}
            sectionId={element.sectionId}
            elementKey={element.elementKey}
          />
        );

      case 'container':
        return (
          <UniversalContainer
            mode={mode}
            props={element.props}
            onPropsChange={onPropsChange}
            className={elementClasses}
            style={elementStyle}
            sectionId={element.sectionId}
            elementKey={element.elementKey}
          >
            {/* Container children would be rendered here */}
            <div className="container-placeholder text-gray-400 text-sm">
              Container element - add content here
            </div>
          </UniversalContainer>
        );

      default:
        return (
          <div className="unknown-element text-red-500 text-sm border border-red-200 rounded p-2">
            Unknown element type: {element.type}
          </div>
        );
    }
  };

  return (
    <div
      className="universal-element-wrapper"
      data-element-type={element.type}
      data-element-key={element.elementKey}
      data-section-id={element.sectionId}
    >
      {renderElement()}
    </div>
  );
}

// Universal List Component
function UniversalList({
  mode,
  content,
  onEdit,
  listType,
  className,
  style,
  sectionId,
  elementKey,
}: {
  mode: 'preview' | 'edit';
  content: string[];
  onEdit: (content: string[]) => void;
  listType: 'bullet' | 'numbered';
  className: string;
  style: React.CSSProperties;
  sectionId: string;
  elementKey: string;
}) {
  const ListElement = listType === 'numbered' ? 'ol' : 'ul';
  
  const handleItemChange = (index: number, value: string) => {
    const newContent = [...content];
    newContent[index] = value;
    onEdit(newContent);
  };

  const handleAddItem = () => {
    onEdit([...content, 'New item']);
  };

  const handleRemoveItem = (index: number) => {
    if (content.length > 1) {
      const newContent = content.filter((_, i) => i !== index);
      onEdit(newContent);
    }
  };

  return (
    <ListElement 
      className={className}
      style={style}
      data-section-id={sectionId}
      data-element-key={elementKey}
    >
      {content.map((item, index) => (
        <li key={index} className="relative group">
          <EditableContent
            mode={mode}
            value={item}
            onEdit={(value) => handleItemChange(index, value)}
            element="span"
            placeholder="List item..."
          />
          {mode === 'edit' && (
            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-500 hover:text-red-700 text-xs ml-2"
                title="Remove item"
              >
                ×
              </button>
            </div>
          )}
        </li>
      ))}
      {mode === 'edit' && (
        <li>
          <button
            onClick={handleAddItem}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            + Add item
          </button>
        </li>
      )}
    </ListElement>
  );
}

// Universal Button Component
function UniversalButton({
  mode,
  content,
  onEdit,
  props,
  onPropsChange,
  className,
  style,
  sectionId,
  elementKey,
}: {
  mode: 'preview' | 'edit';
  content: string;
  onEdit: (content: string) => void;
  props: Record<string, any>;
  onPropsChange: (props: Record<string, any>) => void;
  className: string;
  style: React.CSSProperties;
  sectionId: string;
  elementKey: string;
}) {
  const buttonClasses = useMemo(() => {
    const baseClasses = ['px-6 py-3 rounded font-semibold transition-colors'];
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
      ghost: 'text-blue-600 hover:bg-blue-50',
    };
    
    const sizeClasses = {
      small: 'px-4 py-2 text-sm',
      medium: 'px-6 py-3',
      large: 'px-8 py-4 text-lg',
    };
    
    if (props.variant) {
      baseClasses.push(variantClasses[props.variant as keyof typeof variantClasses] || variantClasses.primary);
    }
    
    if (props.size) {
      baseClasses.push(sizeClasses[props.size as keyof typeof sizeClasses] || sizeClasses.medium);
    }
    
    return baseClasses.concat(className.split(' ')).filter(Boolean).join(' ');
  }, [props.variant, props.size, className]);

  const ButtonElement = mode === 'preview' && props.url ? 'a' : 'button';
  const elementProps = mode === 'preview' && props.url 
    ? { href: props.url, target: props.target || '_self' }
    : { type: 'button' };

  return (
    <ButtonElement
      {...elementProps}
      className={buttonClasses}
      style={style}
      data-section-id={sectionId}
      data-element-key={elementKey}
    >
      <EditableContent
        mode={mode}
        value={content}
        onEdit={onEdit}
        element="span"
        placeholder="Button text..."
      />
    </ButtonElement>
  );
}

// Universal Link Component
function UniversalLink({
  mode,
  content,
  onEdit,
  props,
  onPropsChange,
  className,
  style,
  sectionId,
  elementKey,
}: {
  mode: 'preview' | 'edit';
  content: string;
  onEdit: (content: string) => void;
  props: Record<string, any>;
  onPropsChange: (props: Record<string, any>) => void;
  className: string;
  style: React.CSSProperties;
  sectionId: string;
  elementKey: string;
}) {
  const linkClasses = useMemo(() => {
    const baseClasses = ['text-blue-600 hover:text-blue-800'];
    
    if (props.underline !== false) {
      baseClasses.push('underline');
    }
    
    return baseClasses.concat(className.split(' ')).filter(Boolean).join(' ');
  }, [props.underline, className]);

  const linkProps = mode === 'preview' 
    ? { href: props.url || '#', target: props.target || '_self' }
    : {};

  return (
    <a
      {...linkProps}
      className={linkClasses}
      style={style}
      data-section-id={sectionId}
      data-element-key={elementKey}
    >
      <EditableContent
        mode={mode}
        value={content}
        onEdit={onEdit}
        element="span"
        placeholder="Link text..."
      />
    </a>
  );
}

// Universal Image Component
function UniversalImage({
  mode,
  src,
  alt,
  props,
  onPropsChange,
  className,
  style,
  sectionId,
  elementKey,
}: {
  mode: 'preview' | 'edit';
  src: string;
  alt: string;
  props: Record<string, any>;
  onPropsChange: (props: Record<string, any>) => void;
  className: string;
  style: React.CSSProperties;
  sectionId: string;
  elementKey: string;
}) {
  const imageClasses = useMemo(() => {
    const baseClasses = [];
    
    const sizeClasses = {
      small: 'w-24 h-24',
      medium: 'w-48 h-48',
      large: 'w-64 h-64',
      full: 'w-full h-auto',
    };
    
    if (props.size) {
      baseClasses.push(sizeClasses[props.size as keyof typeof sizeClasses] || sizeClasses.medium);
    }
    
    if (props.rounded) {
      baseClasses.push('rounded-lg');
    }
    
    if (props.shadow) {
      baseClasses.push('shadow-lg');
    }
    
    return baseClasses.concat(className.split(' ')).filter(Boolean).join(' ');
  }, [props.size, props.rounded, props.shadow, className]);

  if (mode === 'edit' && !src) {
    return (
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center min-h-24 ${className}`}
        style={style}
        data-section-id={sectionId}
        data-element-key={elementKey}
      >
        <div className="text-center text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Click to add image</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src || '/placeholder-image.jpg'}
      alt={alt}
      className={imageClasses}
      style={style}
      data-section-id={sectionId}
      data-element-key={elementKey}
    />
  );
}

// Universal Icon Component
function UniversalIcon({
  mode,
  iconName,
  props,
  onPropsChange,
  className,
  style,
  sectionId,
  elementKey,
}: {
  mode: 'preview' | 'edit';
  iconName: string;
  props: Record<string, any>;
  onPropsChange: (props: Record<string, any>) => void;
  className: string;
  style: React.CSSProperties;
  sectionId: string;
  elementKey: string;
}) {
  const iconClasses = useMemo(() => {
    const baseClasses = [];
    
    const sizeClasses = {
      small: 'w-4 h-4',
      medium: 'w-6 h-6',
      large: 'w-8 h-8',
      xl: 'w-12 h-12',
    };
    
    if (props.size) {
      baseClasses.push(sizeClasses[props.size as keyof typeof sizeClasses] || sizeClasses.medium);
    }
    
    return baseClasses.concat(className.split(' ')).filter(Boolean).join(' ');
  }, [props.size, className]);

  // Simple icon mapping - in a real app, you'd use a proper icon library
  const getIconSVG = (name: string) => {
    const icons: Record<string, JSX.Element> = {
      'star': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      ),
      'heart': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      ),
      'check': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      ),
      'arrow-right': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      ),
    };
    
    return icons[name] || icons['star'];
  };

  return (
    <svg
      className={iconClasses}
      style={style}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      data-section-id={sectionId}
      data-element-key={elementKey}
    >
      {getIconSVG(iconName)}
    </svg>
  );
}

// Universal Spacer Component
function UniversalSpacer({
  mode,
  height,
  showInEdit,
  className,
  style,
  sectionId,
  elementKey,
}: {
  mode: 'preview' | 'edit';
  height: string;
  showInEdit: boolean;
  className: string;
  style: React.CSSProperties;
  sectionId: string;
  elementKey: string;
}) {
  const spacerHeight = useMemo(() => {
    const heightMap = {
      small: '1rem',
      medium: '2rem',
      large: '4rem',
      xl: '6rem',
    };
    
    return heightMap[height as keyof typeof heightMap] || height;
  }, [height]);

  const spacerStyle = {
    ...style,
    height: spacerHeight,
  };

  if (mode === 'edit' && showInEdit) {
    return (
      <div
        className={`border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center ${className}`}
        style={spacerStyle}
        data-section-id={sectionId}
        data-element-key={elementKey}
      >
        <span className="text-xs text-gray-400">Spacer ({height})</span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={spacerStyle}
      data-section-id={sectionId}
      data-element-key={elementKey}
    />
  );
}

// Universal Container Component
function UniversalContainer({
  mode,
  props,
  onPropsChange,
  className,
  style,
  sectionId,
  elementKey,
  children,
}: {
  mode: 'preview' | 'edit';
  props: Record<string, any>;
  onPropsChange: (props: Record<string, any>) => void;
  className: string;
  style: React.CSSProperties;
  sectionId: string;
  elementKey: string;
  children: React.ReactNode;
}) {
  const containerClasses = useMemo(() => {
    const baseClasses = [];
    
    if (props.border) {
      baseClasses.push('border border-gray-200');
    }
    
    if (props.rounded) {
      baseClasses.push('rounded-lg');
    }
    
    return baseClasses.concat(className.split(' ')).filter(Boolean).join(' ');
  }, [props.border, props.rounded, className]);

  return (
    <div
      className={containerClasses}
      style={style}
      data-section-id={sectionId}
      data-element-key={elementKey}
    >
      {children}
    </div>
  );
}