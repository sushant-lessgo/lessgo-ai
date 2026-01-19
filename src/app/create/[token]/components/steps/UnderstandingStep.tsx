'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';
import FeatureListEditor from '../shared/FeatureListEditor';
import type { UnderstandingData } from '@/types/generation';

const loadingMessages = [
  'Analyzing your product...',
  'Identifying target audiences...',
  'Extracting key features...',
  'Almost there...',
];

// Chip input component for categories/audiences
function ChipEditor({
  label,
  chips,
  onChange,
  placeholder,
  maxChips = 5,
}: {
  label: string;
  chips: string[];
  onChange: (chips: string[]) => void;
  placeholder: string;
  maxChips?: number;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleRemove = (index: number) => {
    onChange(chips.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    const value = inputValue.trim();
    if (value && chips.length < maxChips && !chips.includes(value)) {
      onChange([...chips, value]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer group"
            onClick={() => handleRemove(index)}
            title="Click to remove"
          >
            {chip}
            <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
          </span>
        ))}
        {chips.length < maxChips && (
          <div className="inline-flex items-center gap-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="h-8 w-32 text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAdd}
              disabled={!inputValue.trim()}
              className="h-8 px-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading view with rotating messages
function LoadingView() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-accentPrimary rounded-full animate-spin" />

      {/* Message */}
      <p className="text-gray-600 animate-pulse">{loadingMessages[messageIndex]}</p>

      {/* Skeleton cards */}
      <div className="w-full max-w-sm space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function UnderstandingStep() {
  const oneLiner = useGenerationStore((s) => s.oneLiner);
  const understanding = useGenerationStore((s) => s.understanding);
  const understandingLoading = useGenerationStore((s) => s.understandingLoading);
  const understandingError = useGenerationStore((s) => s.understandingError);
  const setUnderstanding = useGenerationStore((s) => s.setUnderstanding);
  const setUnderstandingLoading = useGenerationStore((s) => s.setUnderstandingLoading);
  const setUnderstandingError = useGenerationStore((s) => s.setUnderstandingError);
  const nextStep = useGenerationStore((s) => s.nextStep);
  const prevStep = useGenerationStore((s) => s.prevStep);
  const resetFrom = useGenerationStore((s) => s.resetFrom);

  // Local edits state
  const [localEdits, setLocalEdits] = useState<UnderstandingData | null>(null);

  // Sync local edits when understanding data arrives
  useEffect(() => {
    if (understanding && !localEdits) {
      setLocalEdits({ ...understanding });
    }
  }, [understanding, localEdits]);

  // API call
  const callUnderstandAPI = useCallback(async () => {
    setUnderstandingLoading(true);
    setUnderstandingError(null);

    try {
      const response = await fetch('/api/v2/understand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oneLiner }),
      });

      const result = await response.json();

      if (result.success) {
        setUnderstanding(result.data);
        setLocalEdits({ ...result.data });
      } else {
        setUnderstandingError(result.message || 'Failed to analyze product');
      }
    } catch (error) {
      setUnderstandingError('Network error. Please try again.');
    }
  }, [oneLiner, setUnderstanding, setUnderstandingLoading, setUnderstandingError]);

  // Trigger API call on mount if needed
  useEffect(() => {
    if (understandingLoading && !understanding && !understandingError) {
      callUnderstandAPI();
    }
  }, []); // Only on mount

  // Handle confirm
  const handleConfirm = () => {
    if (localEdits) {
      setUnderstanding(localEdits);
      nextStep();
    }
  };

  // Update local edit helpers
  const updateCategories = (categories: string[]) => {
    if (localEdits) setLocalEdits({ ...localEdits, categories });
  };

  const updateAudiences = (audiences: string[]) => {
    if (localEdits) setLocalEdits({ ...localEdits, audiences });
  };

  const updateWhatItDoes = (whatItDoes: string) => {
    if (localEdits) setLocalEdits({ ...localEdits, whatItDoes });
  };

  const updateFeatures = (features: string[]) => {
    if (localEdits) setLocalEdits({ ...localEdits, features });
  };

  // Validation
  const isValid =
    localEdits &&
    localEdits.categories.length > 0 &&
    localEdits.audiences.length > 0 &&
    localEdits.whatItDoes.trim().length > 0 &&
    localEdits.features.length > 0 &&
    localEdits.features.every((f) => f.trim().length > 0);

  // Loading state
  if (understandingLoading && !understanding) {
    return <LoadingView />;
  }

  // Handle going back to edit one-liner
  const handleEditOneLiner = () => {
    resetFrom('understanding');
    prevStep();
  };

  // Error state
  if (understandingError && !understanding) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            We couldn&apos;t understand that description
          </h2>
          <p className="mt-2 text-gray-600 max-w-sm">
            Try rephrasing it with more detail about what your product does and who it&apos;s for.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            onClick={handleEditOneLiner}
            className="w-full bg-brand-accentPrimary hover:bg-orange-500"
            size="lg"
          >
            Edit your one-liner
          </Button>
          <Button
            onClick={callUnderstandAPI}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Playback state
  if (!localEdits) {
    return <LoadingView />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">We understood this</h1>
        <p className="mt-2 text-gray-600">Review and edit if needed. Click chips to remove.</p>
      </div>

      {/* Categories */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <ChipEditor
          label="Categories"
          chips={localEdits.categories}
          onChange={updateCategories}
          placeholder="Add category..."
          maxChips={3}
        />
      </div>

      {/* Audiences */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <ChipEditor
          label="Target Audiences"
          chips={localEdits.audiences}
          onChange={updateAudiences}
          placeholder="Add audience..."
          maxChips={3}
        />
      </div>

      {/* What It Does */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <label className="text-sm font-medium text-gray-700">What It Does</label>
        <Textarea
          value={localEdits.whatItDoes}
          onChange={(e) => updateWhatItDoes(e.target.value)}
          placeholder="Describe what your product does..."
          className="min-h-[80px] bg-white"
          maxLength={200}
        />
        <p className="text-xs text-gray-400 text-right">
          {localEdits.whatItDoes.length}/200
        </p>
      </div>

      {/* Features */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <label className="text-sm font-medium text-gray-700">Key Features</label>
        <FeatureListEditor
          features={localEdits.features}
          onChange={updateFeatures}
          maxFeatures={8}
        />
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleConfirm}
        disabled={!isValid}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg
                   transform hover:scale-105 transition-all duration-200"
        size="lg"
      >
        Looks Good
      </Button>
    </div>
  );
}
