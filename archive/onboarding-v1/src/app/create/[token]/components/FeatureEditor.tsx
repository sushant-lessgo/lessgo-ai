"use client";

import { useState, useEffect } from "react";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type FeatureItem = {
  id?: string;
  feature: string;
  benefit: string;
};

type Props = {
  initialFeatures: FeatureItem[];
  onChange: (features: FeatureItem[]) => void;
};

const MAX_FEATURES = 8;

function SortableFeatureItem({
  item,
  index,
  onChange,
  onDelete,
  canDelete,
}: {
  item: FeatureItem;
  index: number;
  onChange: (index: number, key: keyof FeatureItem, value: string) => void;
  onDelete: (index: number) => void;
  canDelete: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id!,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    background: "white",
    boxShadow: isDragging ? "0 8px 25px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.05)",
    scale: isDragging ? 1.02 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative rounded-lg border bg-white p-4 transition-all duration-200
        ${isDragging ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-move text-gray-400 hover:text-gray-600 mt-2 flex-shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Side-by-Side Layout: Feature | Benefit */}
        {/* Side-by-Side Layout: Feature | Benefit */}
<div className="flex-1 min-w-0">
  {/* Column Labels */}
  <div className="flex gap-4 mb-2">
    <div className="flex-1">
      <label className="text-xs font-medium text-gray-700">Feature</label>
    </div>
    <div className="flex-1">
      <label className="text-xs font-medium text-gray-700">Benefit</label>
    </div>
  </div>
  
  {/* Input Fields */}
  <div className="flex gap-4">
          {/* Feature Input (Left Side) */}
          <div className="flex-1">
            <Input
              value={item.feature}
              onChange={(e) => onChange(index, "feature", e.target.value)}
              placeholder="Feature name..."
              className="font-medium h-20"
              maxLength={50}
            />
          </div>
          
          {/* Benefit Input (Right Side) */}
          <div className="flex-1">
            <Textarea
              value={item.benefit}
              onChange={(e) => onChange(index, "benefit", e.target.value)}
              placeholder="Describe the benefit this feature provides..."
              className="resize-none h-20"
              maxLength={150}
            />
          </div>
        </div>
        </div>

        {/* Delete Button */}
        {canDelete && (
          <button
            onClick={() => onDelete(index)}
            className="text-gray-400 hover:text-red-500 transition-colors mt-2 flex-shrink-0"
            title="Delete feature"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Character counts - Side by Side */}
      <div className="flex gap-4 text-xs text-gray-400 mt-2 px-7">
        <div className="flex-1">Feature: {item.feature.length}/50</div>
        <div className="flex-1">Benefit: {item.benefit.length}/150</div>
      </div>
    </div>
  );
}

export default function FeatureEditor({ initialFeatures, onChange }: Props) {
  const [features, setFeatures] = useState<FeatureItem[]>([]);

  // Initialize features when initialFeatures changes
  useEffect(() => {
    if (initialFeatures.length > 0) {
      // Limit to MAX_FEATURES and ensure we have at least one feature
      const limitedFeatures = initialFeatures.slice(0, MAX_FEATURES).map((f, i) => ({
        ...f,
        id: f.id || `feature-${Date.now()}-${i}`
      }));
      setFeatures(limitedFeatures);
    } else {
      // If no initial features, start with one empty feature
      setFeatures([{ id: `feature-${Date.now()}-0`, feature: "", benefit: "" }]);
    }
  }, [initialFeatures]);

  const update = (updated: FeatureItem[]) => {
    setFeatures(updated);
    onChange(updated);
  };

  const handleAdd = () => {
    if (features.length >= MAX_FEATURES) return;
    const newFeature = { 
      id: `feature-${Date.now()}-${features.length}`, 
      feature: "", 
      benefit: "" 
    };
    update([...features, newFeature]);
  };

  const handleChange = (index: number, field: keyof FeatureItem, value: string) => {
    const updated = [...features];
    updated[index][field] = value;
    update(updated);
  };

  const handleDelete = (index: number) => {
    if (features.length <= 1) return; // Always keep at least one feature
    const updated = features.filter((_, i) => i !== index);
    update(updated);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = features.findIndex(f => f.id === active.id);
      const newIndex = features.findIndex(f => f.id === over!.id);
      const updated = arrayMove(features, oldIndex, newIndex);
      update(updated);
    }
  };

  const canAddMore = features.length < MAX_FEATURES;
  const canDelete = features.length > 1;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Features</h2>
        <p className="text-sm text-gray-600">
          Validate and edit your key features and benefits. Most important features should be listed first.
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-gray-500">
            {features.length} of {MAX_FEATURES} features • Drag to reorder
          </div>
          {!canAddMore && (
            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Maximum features reached
            </div>
          )}
        </div>
      </div>

      {/* Features List */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={features.map(f => f.id!)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 mb-6">
            {features.map((item, index) => (
              <SortableFeatureItem
                key={item.id}
                index={index}
                item={item}
                onChange={handleChange}
                onDelete={handleDelete}
                canDelete={canDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Feature Button */}
      {canAddMore && (
        <Button
          onClick={handleAdd}
          variant="outline"
          className="w-full border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Feature ({features.length}/{MAX_FEATURES})
        </Button>
      )}

      {/* Tips */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Tips for great features:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Keep feature names short and punchy (2-4 words)</li>
          <li>• Focus benefits on outcomes, not just what the feature does</li>
          <li>• Put your most compelling features first</li>
          <li>• Use action words that show value to your users</li>
        </ul>
      </div>
    </div>
  );
}