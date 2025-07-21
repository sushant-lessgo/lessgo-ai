import React, { useState } from 'react';
import { useEditStoreContext } from '@/components/EditProvider';

export function StoreDebugPanel() {
  // Early return for non-development environments
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  // Wrap in try-catch to handle missing context
  try {
    const context = useEditStoreContext();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('theme');
    
    const { 
      sections,
      content, 
      theme,
      store,
    } = context;

    if (!store) {
      return null;
    }

    const storeState = store.getState();
    const sectionLayouts = storeState.sectionLayouts || {};
    const mode = storeState.mode || 'edit';
    const errors = storeState.errors || {};
    const title = storeState.title || 'Untitled';
    const getColorTokens = storeState.getColorTokens;
    const colorTokens = getColorTokens ? getColorTokens() : {};

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          🐛 Debug Store
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
        <h3 className="font-semibold text-sm">Store Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-xs">
        {['theme', 'content', 'layout', 'colors'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 capitalize ${
              activeTab === tab 
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500' 
                : 'hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto max-h-64 text-xs font-mono">
        {activeTab === 'theme' && (
          <div className="space-y-2">
            <div><strong>Base Color:</strong> {theme.colors.baseColor}</div>
            <div><strong>Accent Color:</strong> {theme.colors.accentColor}</div>
            <div><strong>Heading Font:</strong> {theme.typography.headingFont}</div>
            <div><strong>Body Font:</strong> {theme.typography.bodyFont}</div>
            <div><strong>Typography Scale:</strong> {theme.typography.scale}</div>
            <div><strong>Corners:</strong> {theme.corners?.radius || 'N/A'}px</div>
            <div className="pt-2 border-t">
              <strong>Section Backgrounds:</strong>
              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(theme.colors.sectionBackgrounds, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-2">
            <div><strong>Sections:</strong> {sections.length}</div>
            <div><strong>Content Keys:</strong></div>
            <ul className="ml-2">
              {Object.keys(content).map(key => (
                <li key={key}>• {key} ({Object.keys(content[key]?.elements || {}).length} elements)</li>
              ))}
            </ul>
            <div className="pt-2 border-t">
              <strong>Sample Content:</strong>
              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                {JSON.stringify(content, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-2">
            <div><strong>Sections Order:</strong></div>
            <ul className="ml-2">
              {sections.map((section, i) => (
                <li key={section}>
                  {i + 1}. {section} → {sectionLayouts[section] || 'no layout'}
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t">
              <strong>Global Settings:</strong>
              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify({}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-2">
            <div><strong>Live Color Tokens:</strong></div>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(colorTokens).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded border mr-2" 
                    style={{ backgroundColor: typeof value === 'string' ? value : '#gray' }}
                  ></div>
                  <span className="text-xs">{key}: {typeof value === 'string' ? value : JSON.stringify(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t p-2 space-y-1">
        <button
          onClick={() => console.log('Full Store State:', store.getState())}
          className="w-full text-xs bg-gray-100 hover:bg-gray-200 py-1 rounded"
        >
          📄 Log Full Store to Console
        </button>
        <button
          onClick={() => {
            const data = JSON.stringify(store.getState(), null, 2);
            navigator.clipboard.writeText(data);
            alert('Store data copied to clipboard!');
          }}
          className="w-full text-xs bg-blue-100 hover:bg-blue-200 py-1 rounded"
        >
          📋 Copy Store Data
        </button>
      </div>
    </div>
  );
  
  } catch (error) {
    // If we're not inside an EditProvider context, show a simple message
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg text-sm">
          Debug panel requires EditProvider context
        </div>
      </div>
    );
  }
}