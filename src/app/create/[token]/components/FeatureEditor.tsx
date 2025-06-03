"use client";

import { useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
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
  feature: string;
  benefit: string;
};

type Props = {
  initialFeatures: FeatureItem[];
  onChange: (features: FeatureItem[]) => void;
};

function SortableFeatureItem({
  item,
  index,
  onChange,
  onDelete,
}: {
  item: FeatureItem;
  index: number;
  onChange: (index: number, key: keyof FeatureItem, value: string) => void;
  onDelete: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: index.toString(),
  });

  const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  zIndex: 10,
  background: "white",
  boxShadow: transform ? "0 4px 12px rgba(0,0,0,0.08)" : undefined,
  scale: transform ? 1.02 : 1,
};


  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-move text-gray-400">
          <GripVertical className="w-4 h-4" />
        </div>
        <Input
          value={item.feature}
          onChange={(e) => onChange(index, "feature", e.target.value)}
          placeholder="Feature title"
          className="flex-1"
        />
        <button
          onClick={() => onDelete(index)}
          className="text-gray-400 hover:text-red-500 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <Textarea
        value={item.benefit}
        onChange={(e) => onChange(index, "benefit", e.target.value)}
        placeholder="Describe the benefit"
      />
    </div>
  );
}


export default function FeatureEditor({ initialFeatures, onChange }: Props) {
  const [features, setFeatures] = useState<FeatureItem[]>(initialFeatures);

  const update = (updated: FeatureItem[]) => {
    setFeatures(updated);
    onChange(updated);
  };

  const handleAdd = () => {
    update([...features, { feature: "", benefit: "" }]);
  };

  const handleChange = (index: number, field: keyof FeatureItem, value: string) => {
    const updated = [...features];
    updated[index][field] = value;
    update(updated);
  };

  const handleDelete = (index: number) => {
    const updated = features.filter((_, i) => i !== index);
    update(updated);
  };

  const sensors = useSensors(useSensor(PointerSensor));

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (active.id !== over?.id) {
    const oldIndex = parseInt(active.id.toString());
const newIndex = parseInt(over!.id.toString());

    const updated = arrayMove(features, oldIndex, newIndex);
    update(updated);
  }
};

  return (
    <div className="bg-white p-6 rounded-md shadow-sm space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Product Features</h2>
      <p className="text-sm text-gray-500 mb-4">
        Validate key features and benefits. You can add, delete or edit. Most important first.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={features.map((_, i) => i.toString())} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {features.map((item, index) => (
            <SortableFeatureItem
              key={`${item.feature}-${index}`}
              index={index}
              item={item}
              onChange={handleChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>

    <button
      onClick={handleAdd}
      className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1"
    >
      + Add Feature
    </button>
    </div>
  );
}
