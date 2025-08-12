// Variable Preview Components - Enhanced preview components with CSS variable support
// Provides real-time preview of variable backgrounds, colors, and layouts

'use client';

import React, { useState, useMemo } from 'react';
import { VariableBackgroundRenderer } from '@/modules/Design/ColorSystem/VariableBackgroundRenderer';
import { VariableThemeInjector } from '@/modules/Design/ColorSystem/VariableThemeInjector';
import { VariableModeIndicator } from '@/modules/Design/ColorSystem/VariableModeIndicators';
import { useVariableTheme } from '@/modules/Design/ColorSystem/VariableThemeInjector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Code2,
  Palette,
  Type,
  Layout,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
  Play,
  Pause
} from 'lucide-react';

// Device viewport configurations
const DEVICE_VIEWPORTS = {
  desktop: { width: '100%', height: 'auto', label: 'Desktop', icon: Monitor },
  tablet: { width: '768px', height: '1024px', label: 'Tablet', icon: Tablet },
  mobile: { width: '375px', height: '667px', label: 'Mobile', icon: Smartphone },
};

interface VariablePreviewProps {
  tokenId: string;
  backgroundSystem: any;
  customColors?: Record<string, string>;
  content?: React.ReactNode;
  showControls?: boolean;
  allowDeviceSwitching?: boolean;
  enableRealTimeUpdates?: boolean;
}

interface PreviewSectionProps {
  id: string;
  title: string;
  background: string;
  customColors?: Record<string, string>;
  tokenId: string;
  children: React.ReactNode;
  className?: string;
}

interface PreviewLayoutProps {
  tokenId: string;
  sections: Array<{
    id: string;
    title: string;
    background: string;
    content: React.ReactNode;
  }>;
  customColors?: Record<string, string>;
  deviceMode?: keyof typeof DEVICE_VIEWPORTS;
}

/**
 * Enhanced Preview Component with Variable Support
 */
export function VariablePreview({
  tokenId,
  backgroundSystem,
  customColors = {},
  content,
  showControls = true,
  allowDeviceSwitching = true,
  enableRealTimeUpdates = true,
}: VariablePreviewProps) {
  const { phase, flags } = useVariableTheme(tokenId);
  const [deviceMode, setDeviceMode] = useState<keyof typeof DEVICE_VIEWPORTS>('desktop');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVariableInfo, setShowVariableInfo] = useState(false);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);

  const currentViewport = DEVICE_VIEWPORTS[deviceMode];

  return (
    <VariableThemeInjector
      tokenId={tokenId}
      backgroundSystem={backgroundSystem}
      customColors={customColors}
    >
      <div className={`border rounded-lg overflow-hidden ${isExpanded ? 'fixed inset-4 z-50 bg-white shadow-2xl' : ''}`}>
        {/* Preview Header */}
        {showControls && (
          <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4" />
              <span className="font-medium text-sm">Variable Preview</span>
              <VariableModeIndicator tokenId={tokenId} variant="badge" />
            </div>
            
            <div className="flex items-center gap-2">
              {/* Device Switcher */}
              {allowDeviceSwitching && (
                <div className="flex border rounded overflow-hidden">
                  {Object.entries(DEVICE_VIEWPORTS).map(([key, viewport]) => (
                    <Button
                      key={key}
                      variant={deviceMode === key ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setDeviceMode(key as keyof typeof DEVICE_VIEWPORTS)}
                      className="rounded-none px-2"
                    >
                      <viewport.icon className="w-3 h-3" />
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Preview Controls */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewPaused(!isPreviewPaused)}
                  title={isPreviewPaused ? 'Resume updates' : 'Pause updates'}
                >
                  {isPreviewPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVariableInfo(!showVariableInfo)}
                  title="Toggle variable info"
                >
                  <Code2 className="w-3 h-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Minimize' : 'Expand'}
                >
                  {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Variable Info Panel */}
        {showVariableInfo && (
          <div className="p-3 bg-blue-50 border-b text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="font-medium">Phase:</span> {phase}
              </div>
              <div>
                <span className="font-medium">Variables:</span> {Object.keys(customColors).length}
              </div>
              <div>
                <span className="font-medium">Device:</span> {currentViewport.label}
              </div>
              <div>
                <span className="font-medium">Updates:</span> {isPreviewPaused ? 'Paused' : 'Real-time'}
              </div>
            </div>
          </div>
        )}

        {/* Preview Content */}
        <div className="relative">
          <div 
            className={`transition-all duration-300 ${
              deviceMode !== 'desktop' ? 'mx-auto' : ''
            }`}
            style={{
              width: currentViewport.width,
              height: deviceMode !== 'desktop' ? currentViewport.height : 'auto',
              maxHeight: isExpanded ? 'calc(100vh - 200px)' : '600px',
              overflow: 'auto',
            }}
          >
            <VariableBackgroundRenderer
              tokenId={tokenId}
              background={backgroundSystem?.primary || 'bg-white'}
              customColors={isPreviewPaused ? {} : customColors}
              className="min-h-full"
              debugMode={flags.enableMigrationDebug}
            >
              {content || (
                <PreviewContent 
                  tokenId={tokenId}
                  backgroundSystem={backgroundSystem}
                  customColors={customColors}
                />
              )}
            </VariableBackgroundRenderer>
          </div>
        </div>
        
        {/* Preview Footer */}
        {showControls && (
          <div className="flex items-center justify-between p-2 bg-gray-50 border-t text-xs text-gray-600">
            <div>
              Viewport: {currentViewport.width} × {currentViewport.height}
            </div>
            <div className="flex items-center gap-2">
              {enableRealTimeUpdates && (
                <Badge variant="outline" className="text-xs">
                  {isPreviewPaused ? 'Paused' : 'Live'}
                </Badge>
              )}
              <span>Mode: {phase}</span>
            </div>
          </div>
        )}
      </div>
    </VariableThemeInjector>
  );
}

/**
 * Individual Preview Section
 */
export function PreviewSection({
  id,
  title,
  background,
  customColors = {},
  tokenId,
  children,
  className = '',
}: PreviewSectionProps) {
  return (
    <VariableBackgroundRenderer
      tokenId={tokenId}
      background={background}
      customColors={customColors}
      sectionId={id}
      className={`relative ${className}`}
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-white/90">
          {title}
        </h2>
        {children}
      </div>
      
      {/* Section overlay info for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {id}
        </div>
      )}
    </VariableBackgroundRenderer>
  );
}

/**
 * Full Layout Preview
 */
export function PreviewLayout({
  tokenId,
  sections,
  customColors = {},
  deviceMode = 'desktop',
}: PreviewLayoutProps) {
  return (
    <VariableThemeInjector tokenId={tokenId} customColors={customColors}>
      <div className="space-y-0">
        {sections.map((section, index) => (
          <PreviewSection
            key={section.id}
            id={section.id}
            title={section.title}
            background={section.background}
            customColors={customColors}
            tokenId={tokenId}
            className="min-h-[400px]"
          >
            {section.content}
          </PreviewSection>
        ))}
      </div>
    </VariableThemeInjector>
  );
}

/**
 * Color Scheme Preview
 */
export function ColorSchemePreview({
  tokenId,
  colors,
  className = '',
}: {
  tokenId: string;
  colors: Record<string, string>;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`}>
      {Object.entries(colors).slice(0, 8).map(([key, color]) => (
        <div key={key} className="text-center">
          <div
            className="w-full h-12 rounded border mb-1"
            style={{ backgroundColor: color }}
          />
          <div className="text-xs text-gray-600 truncate" title={key}>
            {key.replace('--', '').replace(/-/g, ' ')}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Responsive Preview Grid
 */
export function ResponsivePreviewGrid({
  tokenId,
  backgroundSystem,
  customColors = {},
  content,
}: {
  tokenId: string;
  backgroundSystem: any;
  customColors?: Record<string, string>;
  content?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.entries(DEVICE_VIEWPORTS).map(([device, viewport]) => (
        <Card key={device} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <viewport.icon className="w-4 h-4" />
              {viewport.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              className="mx-auto border"
              style={{
                width: device === 'desktop' ? '100%' : '280px',
                height: device === 'desktop' ? '200px' : '160px',
                transform: device !== 'desktop' ? 'scale(0.5)' : 'none',
                transformOrigin: 'top left',
              }}
            >
              <VariableBackgroundRenderer
                tokenId={tokenId}
                background={backgroundSystem?.primary || 'bg-white'}
                customColors={customColors}
                className="w-full h-full"
              >
                {content || (
                  <div className="p-4 h-full flex items-center justify-center">
                    <div className="text-center text-white/80">
                      <div className="text-lg font-bold mb-2">Preview</div>
                      <div className="text-sm">{viewport.label}</div>
                    </div>
                  </div>
                )}
              </VariableBackgroundRenderer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Interactive Preview with Live Editing
 */
export function InteractivePreview({
  tokenId,
  backgroundSystem,
  onColorChange,
  initialColors = {},
}: {
  tokenId: string;
  backgroundSystem: any;
  onColorChange: (colors: Record<string, string>) => void;
  initialColors?: Record<string, string>;
}) {
  const [localColors, setLocalColors] = useState(initialColors);
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const handleColorUpdate = (key: string, value: string) => {
    const newColors = { ...localColors, [key]: value };
    setLocalColors(newColors);
    onColorChange(newColors);
  };

  return (
    <div className="space-y-4">
      {/* Color Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Live Color Editing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['--gradient-from', '--gradient-to', '--accent-primary', '--text-primary'].map((colorKey) => (
              <div key={colorKey}>
                <label className="text-xs">{colorKey.replace('--', '').replace(/-/g, ' ')}</label>
                <input
                  type="color"
                  value={localColors[colorKey] || '#3b82f6'}
                  onChange={(e) => handleColorUpdate(colorKey, e.target.value)}
                  className="w-full h-8 rounded border cursor-pointer"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <VariablePreview
        tokenId={tokenId}
        backgroundSystem={backgroundSystem}
        customColors={localColors}
        showControls={true}
        allowDeviceSwitching={true}
        enableRealTimeUpdates={true}
      />
    </div>
  );
}

// Default preview content component
function PreviewContent({ 
  tokenId, 
  backgroundSystem, 
  customColors 
}: { 
  tokenId: string; 
  backgroundSystem: any; 
  customColors: Record<string, string>; 
}) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white/90 mb-6">
          Variable Preview
        </h1>
        <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
          This is a live preview of your CSS variable-powered design system
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button 
            className="px-6 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: customColors['--accent-primary'] || '#f59e0b' }}
          >
            Primary Button
          </button>
          <button className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg font-medium text-white border border-white/30">
            Secondary Button
          </button>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white/90 mb-6">
                CSS Variable System
              </h2>
              <p className="text-white/70 mb-6">
                Experience the power of CSS variables with real-time updates, 
                infinite customization, and seamless fallbacks.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/80">
                  <Code2 className="w-5 h-5" />
                  <span>Real-time variable updates</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Palette className="w-5 h-5" />
                  <span>Infinite color customization</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Layout className="w-5 h-5" />
                  <span>Responsive design system</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white/90 mb-4">
                Current Variables
              </h3>
              <ColorSchemePreview tokenId={tokenId} colors={customColors} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}