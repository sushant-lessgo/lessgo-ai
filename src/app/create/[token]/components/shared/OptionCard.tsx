'use client';

import { cn } from '@/lib/utils';

interface OptionCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  selected?: boolean;
  onClick: () => void;
}

export default function OptionCard({
  icon,
  label,
  description,
  selected,
  onClick,
}: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-start p-4 rounded-lg border-2 text-left',
        'transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
        'hover:border-orange-300 hover:bg-orange-50/50',
        selected
          ? 'border-brand-accentPrimary bg-orange-50 shadow-md'
          : 'border-gray-200 bg-white'
      )}
    >
      <div className={cn(
        'mb-3',
        selected ? 'text-brand-accentPrimary' : 'text-gray-600'
      )}>
        {icon}
      </div>
      <div className="font-medium text-gray-900">{label}</div>
      <div className="text-xs text-gray-400 mt-1">{description}</div>
    </button>
  );
}
