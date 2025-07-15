// app/edit/[token]/components/modals/StartupStageModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import TaxonomyTile from '../ui/TaxonomyTile';
import { startupStageGroups } from '@/modules/inference/taxonomy';

interface StartupStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentValue?: string;
  fieldName: string;
}

export function StartupStageModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentValue, 
  fieldName 
}: StartupStageModalProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(currentValue || null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleStageSelect = (stageId: string) => {
    setSelectedStage(stageId);
  };

  const handleConfirm = () => {
    if (selectedStage) {
      onSelect(selectedStage);
    }
  };

  const handleCancel = () => {
    setSelectedStage(currentValue || null);
    onClose();
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedStage(currentValue || null);
      // Auto-expand all groups for better discoverability
      setExpandedGroups(new Set(startupStageGroups.map(g => g.id)));
    }
  }, [isOpen, currentValue]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Select Startup Stage"
      description="Choose the stage that best describes your current position"
      size="large"
    >
      <div className="space-y-6">
        <div className="max-h-96 overflow-y-auto space-y-4">
          {startupStageGroups.map((group) => (
            <div key={group.id} className="border border-gray-200 rounded-lg">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900">{group.label}</span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {group.stages.length} stages
                  </span>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${expandedGroups.has(group.id) ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Group Content */}
              {expandedGroups.has(group.id) && (
                <div className="p-4 space-y-3">
                  {group.stages.map((stage) => (
                    <TaxonomyTile
                      key={stage.id}
                      id={stage.id}
                      label={stage.label}
                      isSelected={selectedStage === stage.id}
                      onClick={() => handleStageSelect(stage.id)}
                      size="medium"
                      layout="horizontal"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selection Info */}
        {selectedStage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Selected: {startupStageGroups.flatMap(g => g.stages as any).find((s: any) => s.id === selectedStage)?.label}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  This helps tailor your content to your current business phase.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStage}
            className={`px-6 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              selectedStage
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

export default StartupStageModal;