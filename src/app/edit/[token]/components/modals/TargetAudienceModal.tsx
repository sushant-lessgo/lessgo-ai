// app/edit/[token]/components/modals/TargetAudienceModal.tsx
"use client";

import { useState, useMemo } from 'react';
import BaseModal from './BaseModal';
import TaxonomyTile from '../ui/TaxonomyTile';
import { targetAudienceGroups } from '@/modules/inference/taxonomy';
import type { TargetAudience } from '@/modules/inference/taxonomy';

interface TargetAudienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentValue?: string;
  fieldName: string;
}

export function TargetAudienceModal({
  isOpen,
  onClose,
  onSelect,
  currentValue,
  fieldName,
}: TargetAudienceModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<string | null>(currentValue || null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Flatten audiences with group context
  const allAudiences = useMemo(() => {
    return targetAudienceGroups.flatMap(group =>
      group.audiences.map(audience => ({
        ...audience,
        groupId: group.id,
        groupLabel: group.label,
      }))
    );
  }, []);

  // Filter audiences based on search
  const filteredAudiences = useMemo(() => {
    if (!searchQuery.trim()) return allAudiences;
    
    const query = searchQuery.toLowerCase();
    return allAudiences.filter(audience =>
      audience.label.toLowerCase().includes(query) ||
      audience.groupLabel.toLowerCase().includes(query) ||
      audience.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [allAudiences, searchQuery]);

  // Group filtered audiences by category
  const groupedAudiences = useMemo(() => {
    const groups = new Map();
    
    filteredAudiences.forEach(audience => {
      if (!groups.has(audience.groupId)) {
        groups.set(audience.groupId, {
          id: audience.groupId,
          label: audience.groupLabel,
          audiences: [],
        });
      }
      groups.get(audience.groupId).audiences.push(audience);
    });
    
    return Array.from(groups.values());
  }, [filteredAudiences]);

  const handleAudienceSelect = (audienceId: string) => {
    setSelectedAudience(audienceId);
  };

  const handleConfirm = () => {
    if (selectedAudience) {
      onSelect(selectedAudience);
    }
  };

  const handleCancel = () => {
    setSelectedAudience(currentValue || null);
    setSearchQuery('');
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

  // Auto-expand groups with selected audience
  React.useEffect(() => {
    if (selectedAudience) {
      const selectedAudienceData = allAudiences.find(a => a.id === selectedAudience);
      if (selectedAudienceData) {
        setExpandedGroups(prev => new Set([...prev, selectedAudienceData.groupId]));
      }
    }
  }, [selectedAudience, allAudiences]);

  // Clear search when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedAudience(currentValue || null);
      // Auto-expand all groups for better discoverability
      setExpandedGroups(new Set(targetAudienceGroups.map(g => g.id)));
    }
  }, [isOpen, currentValue]);

  const getAudienceData = (audienceId: string) => {
    return allAudiences.find(a => a.id === audienceId);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Select Target Audience"
      description="Choose the primary audience for your product or service"
      size="large"
    >
      <div className="space-y-6">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search audiences by name, category, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>

        {/* Audiences by Group */}
        <div className="max-h-96 overflow-y-auto">
          {groupedAudiences.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-1">No audiences found</p>
              <p className="text-sm text-gray-500">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedAudiences.map((group) => (
                <div key={group.id} className="border border-gray-200 rounded-lg">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">{group.label}</span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        {group.audiences.length} {group.audiences.length === 1 ? 'audience' : 'audiences'}
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
                      {group.audiences.map((audience) => (
                        <TaxonomyTile
                          key={audience.id}
                          id={audience.id}
                          label={audience.label}
                          description={audience.tags ? audience.tags.join(' • ') : undefined}
                          isSelected={selectedAudience === audience.id}
                          onClick={() => handleAudienceSelect(audience.id)}
                          size="medium"
                          layout="horizontal"
                          badge={audience.tags?.includes('B2B') ? 'B2B' : audience.tags?.includes('B2C') ? 'B2C' : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selection Info */}
        {selectedAudience && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                {(() => {
                  const audienceData = getAudienceData(selectedAudience);
                  return (
                    <>
                      <p className="text-sm font-medium text-blue-900">
                        Selected: {audienceData?.label}
                      </p>
                      {audienceData?.tags && (
                        <p className="text-sm text-blue-700 mt-1">
                          Tags: {audienceData.tags.join(' • ')}
                        </p>
                      )}
                    </>
                  );
                })()}
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
            disabled={!selectedAudience}
            className={`px-6 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              selectedAudience
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

export default TargetAudienceModal;