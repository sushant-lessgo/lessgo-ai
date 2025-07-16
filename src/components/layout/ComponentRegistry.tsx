// components/layout/ComponentRegistry.tsx - Additional components for production use

import React from 'react';

// Enhanced Trust Indicators Component
export function TrustIndicators({ 
  items = ['Free trial', 'No credit card'], 
  colorClass = 'text-gray-500',
  iconColor = 'text-green-500'
}: { 
  items?: string[];
  colorClass?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <svg className={`w-4 h-4 ${iconColor} flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className={colorClass}>{item}</span>
        </div>
      ))}
    </div>
  );
}

export function CTAButton({ 
  text, 
  colorTokens, 
  textStyle, 
  onClick,
  className = '',
  size = 'large',
  variant = 'primary',
  disabled = false,
  loading = false,
  ariaLabel
}: {
  text: string;
  colorTokens: any;
  textStyle?: React.CSSProperties;
  onClick?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
}) {
  
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };

  // ✅ FIXED: Use actual accent colors from the generated system
  const getVariantClasses = () => {
    if (variant === 'outline') {
      const borderClass = colorTokens.accentBorder || colorTokens.borderFocus || 'border-blue-600';
      const textClass = colorTokens.dynamicBody || colorTokens.textPrimary || 'text-gray-900';
      const hoverBg = colorTokens.ctaBg || 'bg-blue-600';
      const hoverText = colorTokens.ctaText || 'text-white';
      
      return `border-2 ${borderClass} ${textClass} bg-transparent hover:${hoverBg} hover:${hoverText} transition-all duration-200`;
    }
    
    if (variant === 'secondary') {
      const bgClass = colorTokens.surfaceElevated || 'bg-gray-100';
      const textClass = colorTokens.textPrimary || 'text-gray-900';
      const hoverClass = colorTokens.surfaceSection || 'bg-gray-200';
      
      return `${bgClass} ${textClass} hover:${hoverClass} transition-all duration-200`;
    }
    
    // ✅ PRIMARY: Use the generated accent colors (e.g., bg-purple-600)
    const primaryBg = colorTokens.ctaBg || colorTokens.accent || 'bg-blue-600';
    const primaryText = colorTokens.ctaText || 'text-white';
    const primaryHover = colorTokens.ctaHover || colorTokens.accentHover || 'bg-blue-700';
    
    // console.log('🎨 CTA Button using accent colors:', {
    //   bg: primaryBg,
    //   text: primaryText,
    //   hover: primaryHover,
    //   fromAccentSystem: primaryBg.includes('purple') || primaryBg.includes('indigo') || primaryBg.includes('emerald')
    // });
    
    return `${primaryBg} ${primaryText} hover:${primaryHover} transition-all duration-200`;
  };

  // ✅ ENHANCED: Add focus styles using accent colors
  const focusClass = colorTokens.borderFocus ? 
    `focus:ring-4 focus:ring-opacity-50 focus:${colorTokens.borderFocus}` : 
    'focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50';

  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel || text}
      className={`
        inline-flex items-center justify-center font-semibold rounded-lg 
        shadow-lg hover:shadow-xl transform hover:scale-105 
        transition-all duration-200 focus:outline-none ${focusClass}
        ${sizeClasses[size]} ${getVariantClasses()}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed transform-none hover:scale-100' : ''}
        ${className}
      `}
      style={textStyle}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {text}
      {!loading && (
        <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      )}
    </button>
  );
}

// ✅ ENHANCED: CTA Button variants for different use cases
export function PrimaryCTAButton(props: Parameters<typeof CTAButton>[0]) {
  return <CTAButton {...props} variant="primary" />;
}

export function SecondaryCTAButton(props: Parameters<typeof CTAButton>[0]) {
  return <CTAButton {...props} variant="secondary" />;
}

export function OutlineCTAButton(props: Parameters<typeof CTAButton>[0]) {
  return <CTAButton {...props} variant="outline" />;
}


export function DashboardMockup({ 
  variant = 'analytics',
  className = '' 
}: {
  variant?: 'analytics' | 'crm' | 'ecommerce' | 'minimal';
  className?: string;
}) {
  
  if (variant === 'minimal') {
    return (
      <div className={`bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
        <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        </div>
        <div className="p-8">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Default analytics variant (from the main component)
  return (
    <div className={`bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
      {/* Browser chrome and content as in main component */}
    </div>
  );
}


// Star Rating Component (unchanged)
export function StarRating({ 
  rating = 5, 
  maxRating = 5, 
  size = 'medium',
  showNumber = true,
  className = ''
}: {
  rating?: number;
  maxRating?: number;
  size?: 'small' | 'medium' | 'large';
  showNumber?: boolean;
  className?: string;
}) {
  
  const sizeClasses = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4', 
    large: 'w-5 h-5'
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => (
          <svg 
            key={i} 
            className={`${sizeClasses[size]} ${
              i < rating ? 'text-yellow-400' : 'text-gray-300'
            } fill-current`} 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {showNumber && (
        <span className="text-sm text-gray-600 ml-2">
          {rating}/{maxRating}
        </span>
      )}
    </div>
  );
}
// Avatar Stack Component
export function AvatarStack({ 
  count = 4, 
  size = 'medium',
  totalUsers,
  className = ''
}: {
  count?: number;
  size?: 'small' | 'medium' | 'large';
  totalUsers?: string;
  className?: string;
}) {
  
  const sizeClasses = {
    small: 'w-6 h-6 text-xs',
    medium: 'w-8 h-8 text-xs',
    large: 'w-10 h-10 text-sm'
  };

  const colors = [
    'from-blue-400 to-indigo-500',
    'from-emerald-400 to-teal-500', 
    'from-purple-400 to-pink-500',
    'from-orange-400 to-red-500',
    'from-yellow-400 to-orange-500'
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex -space-x-2">
        {Array.from({ length: count }, (_, i) => (
          <div 
            key={i}
            className={`
              ${sizeClasses[size]} rounded-full bg-gradient-to-br ${colors[i % colors.length]}
              border-2 border-white flex items-center justify-center text-white font-bold
              shadow-sm
            `}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      {totalUsers && (
        <span className="text-sm text-gray-600">
          {totalUsers}
        </span>
      )}
    </div>
  );
}

// Social Proof Number Component
export function SocialProofNumber({ 
  number, 
  label, 
  prefix = '',
  suffix = '',
  highlighted = false,
  className = ''
}: {
  number: string | number;
  label: string;
  prefix?: string;
  suffix?: string;
  highlighted?: boolean;
  className?: string;
}) {
  return (
    <div className={`text-center ${className}`}>
      <div className={`text-2xl font-bold ${highlighted ? 'text-blue-600' : 'text-gray-900'}`}>
        {prefix}{number}{suffix}
      </div>
      <div className="text-sm text-gray-600">
        {label}
      </div>
    </div>
  );
}

// Loading Skeleton Component
export function LoadingSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string; }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={`h-4 bg-gray-200 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}></div>
      ))}
    </div>
  );
}

export function AccentBadge({ 
  text, 
  colorTokens,
  size = 'medium',
  className = ''
}: {
  text: string;
  colorTokens?: any;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base'
  };

  // ✅ Use accent colors for badge background
  const accentBg = colorTokens?.ctaBg?.replace('bg-', 'bg-')?.replace('-600', '-100') || 'bg-blue-100';
  const accentText = colorTokens?.ctaBg?.replace('bg-', 'text-')?.replace('-600', '-800') || 'text-blue-800';

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${sizeClasses[size]} ${accentBg} ${accentText}
      ${className}
    `}>
      {text}
    </span>
  );
}

// Responsive Image Component
export function ResponsiveImage({ 
  src, 
  alt, 
  className = '',
  aspectRatio = 'aspect-video',
  priority = false
}: {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
}) {
  return (
    <div className={`${aspectRatio} ${className} overflow-hidden rounded-lg`}>
      <img 
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}

// Enhanced Number Badge with animations
export function NumberBadge({ 
  number, 
  colorTokens,
  className = '',
  size = 'medium',
  animated = false
}: {
  number: string | number;
  colorTokens?: any;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}) {
  
  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-12 h-12 text-lg',
    large: 'w-16 h-16 text-xl'
  };

  return (
    <div className={`
      ${sizeClasses[size]} rounded-full flex items-center justify-center 
      text-white font-bold shadow-lg
      ${colorTokens?.ctaBg || 'bg-blue-600'} 
      ${animated ? 'animate-pulse' : ''}
      ${className}
    `}>
      {number}
    </div>
  );
}

// Feature Icon Component with dynamic sizing
export function FeatureIcon({ 
  type = 'star', 
  colorTokens,
  size = 'medium',
  className = ''
}: {
  type?: string;
  colorTokens?: any;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  
  const sizeClasses = {
    small: 'w-8 h-8 p-2',
    medium: 'w-12 h-12 p-3',
    large: 'w-16 h-16 p-4'
  };

  const iconClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6', 
    large: 'w-8 h-8'
  };

  const getIcon = () => {
    switch(type) {
      case 'lightning':
        return (
          <svg className={iconClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'shield':
        return (
          <svg className={iconClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'chart':
        return (
          <svg className={iconClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default: // star
        return (
          <svg className={iconClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
    }
  };

  return (
    <div className={`
      ${sizeClasses[size]} rounded-lg flex items-center justify-center text-white
      ${colorTokens?.ctaBg || 'bg-blue-600'} 
      ${className}
    `}>
      {getIcon()}
    </div>
  );
}

// Notification/Toast Component
export function NotificationToast({ 
  message, 
  type = 'info',
  onClose,
  autoClose = true,
  duration = 5000
}: {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}) {
  
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const typeIcons = {
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg max-w-sm
      transform transition-all duration-300 ease-in-out
      ${typeStyles[type]}
    `}>
      <div className="flex items-start space-x-3">
        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcons[type]} />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Progress Bar Component
export function ProgressBar({ 
  progress, 
  colorTokens,
  showPercentage = true,
  className = ''
}: {
  progress: number; // 0-100
  colorTokens?: any;
  showPercentage?: boolean;
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">Progress</span>
        {showPercentage && (
          <span className="text-gray-600">{progress}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colorTokens?.ctaBg || 'bg-blue-600'}`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        ></div>
      </div>
    </div>
  );
}

// Metric Card Component
export function MetricCard({ 
  title, 
  value, 
  trend,
  trendDirection = 'up',
  icon,
  colorTokens,
  className = ''
}: {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  colorTokens?: any;
  className?: string;
}) {
  
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600', 
    neutral: 'text-gray-600'
  };

  const trendIcons = {
    up: 'M7 14l3-3 3 3m-6 0l3-3 3 3M5 10h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2z',
    down: 'M17 14l-3 3-3-3m6 0l-3 3-3-3M19 10H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2z',
    neutral: 'M5 12h14'
  };

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          {trend && (
            <div className={`flex items-center text-sm ${trendColors[trendDirection]}`}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trendIcons[trendDirection]} />
              </svg>
              {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Video Player Component (placeholder)
export function VideoPlayer({ 
  src, 
  poster, 
  className = '',
  autoplay = false,
  muted = true
}: {
  src?: string;
  poster?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <video 
        src={src}
        poster={poster}
        autoPlay={autoplay}
        muted={muted}
        controls
        className="w-full h-full object-cover"
        playsInline
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Play button overlay for poster */}
      {poster && !autoplay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
          <button className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-200">
            <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// Tooltip Component
export function Tooltip({ 
  children, 
  content, 
  position = 'top',
  className = ''
}: {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  
  const [isVisible, setIsVisible] = React.useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2', 
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`
          absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg
          whitespace-nowrap pointer-events-none
          ${positionClasses[position]} ${className}
        `}>
          {content}
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
            'right-full top-1/2 -translate-y-1/2 -mr-1'
          }`}></div>
        </div>
      )}
    </div>
  );
}