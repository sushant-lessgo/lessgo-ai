import React, { useState } from 'react';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';

export function OnboardingDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');
  
  const { 
    oneLiner,
    confirmedFields,
    validatedFields,
    hiddenInferredFields,
    stepIndex,
    featuresFromAI
  } = useOnboardingStore();

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          🧭 Debug Onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
        <h3 className="font-semibold text-sm">Onboarding Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-xs">
        {['fields', 'inference', 'features', 'flow'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 capitalize ${
              activeTab === tab 
                ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-500' 
                : 'hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto max-h-64 text-xs font-mono">
        {activeTab === 'fields' && (
          <div className="space-y-3">
            <div className="border-b pb-2">
              <strong className="text-purple-600">Confirmed Fields ({Object.keys(confirmedFields).length}):</strong>
              {Object.keys(confirmedFields).length === 0 ? (
                <div className="text-gray-500 mt-1">No confirmed fields yet</div>
              ) : (
                <div className="mt-1 space-y-1">
                  {Object.entries(confirmedFields).map(([key, data]) => (
                    <div key={key} className="bg-yellow-50 p-2 rounded text-xs">
                      <div className="font-semibold">{key}</div>
                      <div className="text-gray-600">"{data.value}"</div>
                      <div className="text-xs text-yellow-600">
                        Confidence: {Math.round(data.confidence * 100)}%
                        {data.alternatives && data.alternatives.length > 0 && (
                          <span> • {data.alternatives.length} alternatives</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <strong className="text-green-600">Validated Fields ({Object.keys(validatedFields).length}):</strong>
              {Object.keys(validatedFields).length === 0 ? (
                <div className="text-gray-500 mt-1">No validated fields yet</div>
              ) : (
                <div className="mt-1 space-y-1">
                  {Object.entries(validatedFields).map(([key, value]) => (
                    <div key={key} className="bg-green-50 p-2 rounded text-xs">
                      <div className="font-semibold">{key}</div>
                      <div className="text-gray-600">"{value}"</div>
                      <div className="text-xs text-green-600">✓ User confirmed</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inference' && (
          <div className="space-y-2">
            <div><strong>Hidden AI Inferences:</strong></div>
            {Object.keys(hiddenInferredFields).length === 0 ? (
              <div className="text-gray-500">No inferences yet</div>
            ) : (
              <div className="space-y-2">
                {hiddenInferredFields.awarenessLevel && (
                  <div className="bg-gray-50 p-2 rounded">
                    <strong>Awareness Level:</strong> {hiddenInferredFields.awarenessLevel}
                  </div>
                )}
                {hiddenInferredFields.copyIntent && (
                  <div className="bg-gray-50 p-2 rounded">
                    <strong>Copy Intent:</strong> {hiddenInferredFields.copyIntent}
                  </div>
                )}
                {hiddenInferredFields.toneProfile && (
                  <div className="bg-gray-50 p-2 rounded">
                    <strong>Tone Profile:</strong> {hiddenInferredFields.toneProfile}
                  </div>
                )}
                {hiddenInferredFields.marketSophisticationLevel && (
                  <div className="bg-gray-50 p-2 rounded">
                    <strong>Market Sophistication:</strong> {hiddenInferredFields.marketSophisticationLevel}
                  </div>
                )}
                {hiddenInferredFields.problemType && (
                  <div className="bg-gray-50 p-2 rounded">
                    <strong>Problem Type:</strong> {hiddenInferredFields.problemType}
                  </div>
                )}
              </div>
            )}
            <div className="pt-2 border-t">
              <strong>Raw Inference Data:</strong>
              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                {JSON.stringify(hiddenInferredFields, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-2">
            <div><strong>AI Generated Features ({featuresFromAI.length}):</strong></div>
            {featuresFromAI.length === 0 ? (
              <div className="text-gray-500">No features generated yet</div>
            ) : (
              <div className="space-y-2">
                {featuresFromAI.map((item, index) => (
                  <div key={index} className="bg-blue-50 p-2 rounded text-xs">
                    <div className="font-semibold text-blue-700">Feature:</div>
                    <div className="mb-1">{item.feature}</div>
                    <div className="font-semibold text-blue-700">Benefit:</div>
                    <div>{item.benefit}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2 border-t">
              <strong>Features Raw Data:</strong>
              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                {JSON.stringify(featuresFromAI, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'flow' && (
          <div className="space-y-2">
            <div><strong>Current Step:</strong> {stepIndex}</div>
            <div><strong>One Liner Length:</strong> {oneLiner.length} chars</div>
            <div className="pt-2 border-t">
              <strong>One Liner:</strong>
              <div className="mt-1 text-xs bg-gray-100 p-2 rounded break-words">
                {oneLiner || 'Not set'}
              </div>
            </div>
            <div className="pt-2 border-t">
              <strong>Progress Overview:</strong>
              <div className="mt-1 space-y-1">
                <div className="flex justify-between">
                  <span>Confirmed Fields:</span>
                  <span className="text-yellow-600">{Object.keys(confirmedFields).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Validated Fields:</span>
                  <span className="text-green-600">{Object.keys(validatedFields).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Inferences:</span>
                  <span className="text-purple-600">{Object.keys(hiddenInferredFields).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Generated Features:</span>
                  <span className="text-blue-600">{featuresFromAI.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t p-2 space-y-1">
        <button
          onClick={() => console.log('Full Onboarding Store State:', useOnboardingStore.getState())}
          className="w-full text-xs bg-gray-100 hover:bg-gray-200 py-1 rounded"
        >
          📄 Log Full Store to Console
        </button>
        <button
          onClick={() => {
            const data = JSON.stringify(useOnboardingStore.getState(), null, 2);
            navigator.clipboard.writeText(data);
            alert('Onboarding store data copied to clipboard!');
          }}
          className="w-full text-xs bg-purple-100 hover:bg-purple-200 py-1 rounded"
        >
          📋 Copy Store Data
        </button>
      </div>
    </div>
  );
}