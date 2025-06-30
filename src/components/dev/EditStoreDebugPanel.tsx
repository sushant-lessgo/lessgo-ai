// components/dev/EditStoreDebugPanel.tsx - Debug Panel for Edit Store
import React, { useState, useMemo } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useDevTools } from '@/hooks/useDevTools';

export function EditStoreDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  // Store and dev tools integration
  const store = useEditStore();
  const devTools = useDevTools({
    componentName: 'EditStoreDebugPanel',
    trackPerformance: true,
  });

  // Store state analysis
  const storeAnalysis = useMemo(() => {
    return {
      sections: {
        count: store.sections.length,
        withContent: Object.keys(store.content).length,
        missing: store.sections.filter(id => !store.content[id]),
      },
      content: {
        totalSections: Object.keys(store.content).length,
        withElements: Object.values(store.content).filter(
          section => Object.keys(section.elements || {}).length > 0
        ).length,
        aiGenerated: Object.values(store.content).filter(
          section => section.aiMetadata?.aiGenerated
        ).length,
        customized: Object.values(store.content).filter(
          section => section.aiMetadata?.isCustomized
        ).length,
      },
      ui: {
        mode: store.mode,
        editMode: store.editMode,
        selectedSection: store.selectedSection,
        selectedElement: store.selectedElement,
        hasErrors: Object.keys(store.errors).length > 0,
        isLoading: store.isLoading,
        leftPanelCollapsed: store.leftPanel.collapsed,
      },
      autoSave: {
        isDirty: store.isDirty,
        isSaving: store.isSaving,
        lastSaved: store.lastSaved ? new Date(store.lastSaved).toLocaleTimeString() : 'Never',
        hasError: !!store.saveError,
        queuedChanges: store.queuedChanges?.length || 0,
      },
    };
  }, [store]);

  // Recent actions (last 10)
  const recentActions = useMemo(() => {
    return devTools.actionHistory.slice(-10).reverse();
  }, [devTools.actionHistory]);

  // Performance stats
  const performanceStats = useMemo(() => {
    return devTools.getPerformanceStats();
  }, [devTools]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          🔧 Debug Edit Store
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-[500px] max-h-[600px] bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
        <h3 className="font-semibold text-sm">Edit Store Debug Panel</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {devTools.isEnabled ? '🟢 Active' : '🔴 Disabled'}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-xs">
        {[
          { key: 'store', label: 'Store' },
          { key: 'actions', label: 'Actions' },
          { key: 'performance', label: 'Performance' },
          { key: 'ai', label: 'AI' },
          { key: 'validation', label: 'Validation' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 ${
              activeTab === tab.key 
                ? 'bg-orange-100 text-orange-700 border-b-2 border-orange-500' 
                : 'hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto max-h-[450px] text-xs font-mono">
        {activeTab === 'store' && (
          <div className="space-y-3">
            <div className="border-b pb-2">
              <strong className="text-orange-600">Sections ({storeAnalysis.sections.count}):</strong>
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                <div>With Content: <span className="text-green-600">{storeAnalysis.sections.withContent}</span></div>
                <div>Missing: <span className="text-red-600">{storeAnalysis.sections.missing.length}</span></div>
              </div>
              {storeAnalysis.sections.missing.length > 0 && (
                <div className="mt-1 text-red-600">
                  Missing: {storeAnalysis.sections.missing.join(', ')}
                </div>
              )}
            </div>

            <div className="border-b pb-2">
              <strong className="text-orange-600">Content ({storeAnalysis.content.totalSections}):</strong>
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                <div>With Elements: <span className="text-green-600">{storeAnalysis.content.withElements}</span></div>
                <div>AI Generated: <span className="text-blue-600">{storeAnalysis.content.aiGenerated}</span></div>
                <div>Customized: <span className="text-purple-600">{storeAnalysis.content.customized}</span></div>
              </div>
            </div>

            <div className="border-b pb-2">
              <strong className="text-orange-600">UI State:</strong>
              <div className="mt-1 space-y-1">
                <div>Mode: <span className="text-blue-600">{storeAnalysis.ui.mode}</span></div>
                <div>Edit Mode: <span className="text-blue-600">{storeAnalysis.ui.editMode}</span></div>
                <div>Selected Section: <span className="text-green-600">{storeAnalysis.ui.selectedSection || 'None'}</span></div>
                <div>Selected Element: <span className="text-green-600">{storeAnalysis.ui.selectedElement ? `${storeAnalysis.ui.selectedElement.sectionId}.${storeAnalysis.ui.selectedElement.elementKey}` : 'None'}</span></div>
                <div>Has Errors: <span className={storeAnalysis.ui.hasErrors ? 'text-red-600' : 'text-green-600'}>{storeAnalysis.ui.hasErrors ? 'Yes' : 'No'}</span></div>
                <div>Loading: <span className={storeAnalysis.ui.isLoading ? 'text-yellow-600' : 'text-green-600'}>{storeAnalysis.ui.isLoading ? 'Yes' : 'No'}</span></div>
              </div>
            </div>

            <div>
              <strong className="text-orange-600">Auto-Save:</strong>
              <div className="mt-1 space-y-1">
                <div>Dirty: <span className={storeAnalysis.autoSave.isDirty ? 'text-yellow-600' : 'text-green-600'}>{storeAnalysis.autoSave.isDirty ? 'Yes' : 'No'}</span></div>
                <div>Saving: <span className={storeAnalysis.autoSave.isSaving ? 'text-blue-600' : 'text-gray-600'}>{storeAnalysis.autoSave.isSaving ? 'Yes' : 'No'}</span></div>
                <div>Last Saved: <span className="text-gray-600">{storeAnalysis.autoSave.lastSaved}</span></div>
                <div>Queued Changes: <span className="text-blue-600">{storeAnalysis.autoSave.queuedChanges}</span></div>
                {storeAnalysis.autoSave.hasError && (
                  <div className="text-red-600">Error: {store.saveError}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <strong className="text-orange-600">Recent Actions ({recentActions.length}):</strong>
              <button
                onClick={() => devTools.clearLogs()}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
            {recentActions.length === 0 ? (
              <div className="text-gray-500">No actions tracked yet</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recentActions.map((action, index) => (
                  <div key={action.id} className="bg-gray-50 p-2 rounded text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-orange-700">{action.actionName}</span>
                      <span className="text-gray-500">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Source: <span className={`${action.source === 'ai' ? 'text-blue-600' : action.source === 'user' ? 'text-green-600' : 'text-gray-600'}`}>{action.source}</span>
                      {action.duration > 0 && (
                        <span className="ml-2">Duration: {action.duration}ms</span>
                      )}
                    </div>
                    {action.payload && Object.keys(action.payload).length > 0 && (
                      <details className="mt-1">
                        <summary className="text-xs text-blue-600 cursor-pointer">Payload</summary>
                        <pre className="mt-1 text-xs bg-gray-100 p-1 rounded max-h-20 overflow-y-auto">
                          {JSON.stringify(action.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-2">
            <div><strong className="text-orange-600">Performance Stats:</strong></div>
            <div className="grid grid-cols-2 gap-2">
              <div>Total Renders: <span className="text-blue-600">{performanceStats.totalRenders}</span></div>
              <div>Slow Renders: <span className={performanceStats.slowRenders > 0 ? 'text-red-600' : 'text-green-600'}>{performanceStats.slowRenders}</span></div>
              <div>Avg Render: <span className="text-gray-600">{performanceStats.averageRenderTime.toFixed(2)}ms</span></div>
            </div>
            
            {devTools.slowRenders.length > 0 && (
              <div className="mt-3">
                <strong className="text-red-600">Slow Renders ({devTools.slowRenders.length}):</strong>
                <div className="space-y-1 mt-1 max-h-40 overflow-y-auto">
                  {devTools.slowRenders.slice(-10).reverse().map((render, index) => (
                    <div key={render.id} className="bg-red-50 p-2 rounded text-xs">
                      <div className="font-semibold">{render.componentName}</div>
                      <div className="text-red-600">{render.duration.toFixed(2)}ms - {render.operationType}</div>
                      <div className="text-gray-500">{new Date(render.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-2">
            <div><strong className="text-orange-600">AI Generation:</strong></div>
            <div className="space-y-1">
              <div>Status: <span className={store.aiGeneration.isGenerating ? 'text-blue-600' : 'text-gray-600'}>{store.aiGeneration.isGenerating ? 'Generating' : 'Idle'}</span></div>
              <div>Operation: <span className="text-blue-600">{store.aiGeneration.currentOperation || 'None'}</span></div>
              <div>Target: <span className="text-green-600">{store.aiGeneration.targetId || 'None'}</span></div>
              <div>Status: <span className="text-gray-600">{store.aiGeneration.status || 'Ready'}</span></div>
              <div>Progress: <span className="text-blue-600">{store.aiGeneration.progress}%</span></div>
            </div>

            {store.aiGeneration.errors.length > 0 && (
              <div className="mt-2">
                <strong className="text-red-600">AI Errors ({store.aiGeneration.errors.length}):</strong>
                <div className="space-y-1 mt-1 max-h-20 overflow-y-auto">
                  {store.aiGeneration.errors.map((error, index) => (
                    <div key={index} className="bg-red-50 p-1 rounded text-xs text-red-600">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {store.aiGeneration.warnings.length > 0 && (
              <div className="mt-2">
                <strong className="text-yellow-600">AI Warnings ({store.aiGeneration.warnings.length}):</strong>
                <div className="space-y-1 mt-1 max-h-20 overflow-y-auto">
                  {store.aiGeneration.warnings.map((warning, index) => (
                    <div key={index} className="bg-yellow-50 p-1 rounded text-xs text-yellow-600">
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2">
              <strong className="text-orange-600">API Queue:</strong>
              <div className="space-y-1 mt-1">
                <div>Processing: <span className={store.apiQueue.processing ? 'text-blue-600' : 'text-gray-600'}>{store.apiQueue.processing ? 'Yes' : 'No'}</span></div>
                <div>Queue Size: <span className="text-blue-600">{store.apiQueue.queue.length}</span></div>
                <div>Rate Limit: <span className="text-green-600">{store.apiQueue.rateLimitRemaining}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <strong className="text-orange-600">Store Validation:</strong>
              <button
                onClick={() => devTools.validateStore()}
                className="text-xs bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded"
              >
                Validate
              </button>
            </div>
            
            <StoreValidationResults validateFn={devTools.validateStore} />
            
            <div className="mt-3">
              <strong className="text-orange-600">Quick Checks:</strong>
              <div className="space-y-1 mt-1">
                <div>Can Publish: <span className={store.canPublish() ? 'text-green-600' : 'text-red-600'}>{store.canPublish() ? 'Yes' : 'No'}</span></div>
                <div>Sections Valid: <span className={store.sections.every(id => store.validateSection(id)) ? 'text-green-600' : 'text-red-600'}>{store.sections.every(id => store.validateSection(id)) ? 'All Valid' : 'Issues Found'}</span></div>
                <div>Content Consistency: <span className={store.sections.length === Object.keys(store.content).length ? 'text-green-600' : 'text-yellow-600'}>{store.sections.length === Object.keys(store.content).length ? 'Consistent' : 'Mismatch'}</span></div>
              </div>
            </div>

            <div className="mt-3">
              <strong className="text-orange-600">Optimization Suggestions:</strong>
              <div className="space-y-1 mt-1">
                {store.getOptimizationSuggestions().map((suggestion, index) => (
                  <div key={index} className="bg-blue-50 p-1 rounded text-xs text-blue-600">
                    • {suggestion}
                  </div>
                ))}
                {store.getOptimizationSuggestions().length === 0 && (
                  <div className="text-green-600">No suggestions - looks good!</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t p-2 space-y-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => console.log('Edit Store State:', store)}
            className="text-xs bg-gray-100 hover:bg-gray-200 py-1 rounded"
          >
            📄 Log Store
          </button>
          <button
            onClick={() => devTools.analyzeStore()}
            className="text-xs bg-blue-100 hover:bg-blue-200 py-1 rounded"
          >
            🔍 Analyze
          </button>
          <button
            onClick={() => store.triggerAutoSave()}
            className="text-xs bg-green-100 hover:bg-green-200 py-1 rounded"
          >
            💾 Force Save
          </button>
          <button
            onClick={() => {
              const data = devTools.exportLogs();
              navigator.clipboard.writeText(JSON.stringify(data, null, 2));
              alert('Debug data copied to clipboard!');
            }}
            className="text-xs bg-orange-100 hover:bg-orange-200 py-1 rounded"
          >
            📋 Export
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper component for validation results
function StoreValidationResults({ validateFn }: { validateFn: () => string[] }) {
  const [issues, setIssues] = useState<string[]>([]);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

  const runValidation = () => {
    const validationIssues = validateFn();
    setIssues(validationIssues);
    setLastValidated(new Date());
  };

  React.useEffect(() => {
    runValidation();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center text-xs">
        <span>Issues Found: <span className={issues.length > 0 ? 'text-red-600' : 'text-green-600'}>{issues.length}</span></span>
        {lastValidated && (
          <span className="text-gray-500">
            {lastValidated.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {issues.length > 0 && (
        <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
          {issues.map((issue, index) => (
            <div key={index} className="bg-red-50 p-1 rounded text-xs text-red-600">
              ⚠️ {issue}
            </div>
          ))}
        </div>
      )}
      
      {issues.length === 0 && (
        <div className="bg-green-50 p-1 rounded text-xs text-green-600 mt-1">
          ✅ No validation issues found
        </div>
      )}
    </div>
  );
}