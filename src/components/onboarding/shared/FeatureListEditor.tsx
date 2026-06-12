'use client';

import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  features: string[];
  onChange: (features: string[]) => void;
  maxFeatures?: number;
}

const MAX_FEATURE_LENGTH = 60;

function FeatureItem({
  feature,
  index,
  onChange,
  onDelete,
  canDelete,
}: {
  feature: string;
  index: number;
  onChange: (index: number, value: string) => void;
  onDelete: (index: number) => void;
  canDelete: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors">
      {/* Feature Input */}
      <Input
        value={feature}
        onChange={(e) => onChange(index, e.target.value)}
        placeholder="Feature name..."
        className="flex-1 border-0 shadow-none focus-visible:ring-0 bg-transparent"
        maxLength={MAX_FEATURE_LENGTH}
      />

      {/* Character count */}
      <span className="text-xs text-gray-400 flex-shrink-0">
        {feature.length}/{MAX_FEATURE_LENGTH}
      </span>

      {/* Delete Button */}
      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
          title="Remove feature"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function FeatureListEditor({ features, onChange, maxFeatures = 8 }: Props) {
  const handleChange = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    if (features.length <= 1) return;
    onChange(features.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (features.length >= maxFeatures) return;
    onChange([...features, '']);
  };

  const canAddMore = features.length < maxFeatures;
  const canDelete = features.length > 1;

  return (
    <div className="space-y-3">
      {/* Features List */}
      <div className="space-y-2">
        {features.map((feature, index) => (
          <FeatureItem
            key={index}
            feature={feature}
            index={index}
            onChange={handleChange}
            onDelete={handleDelete}
            canDelete={canDelete}
          />
        ))}
      </div>

      {/* Add Feature Button */}
      {canAddMore && (
        <Button
          type="button"
          onClick={handleAdd}
          variant="outline"
          size="sm"
          className="w-full border-dashed border-gray-300 text-gray-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add feature ({features.length}/{maxFeatures})
        </Button>
      )}
    </div>
  );
}
