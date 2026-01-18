type ConfirmedFieldTileProps = {
  field: string;
  value: string;
  isAutoConfirmed?: boolean;
  confidence?: number;
  onEdit?: () => void;
};

export default function ConfirmedFieldTile({ 
  field, 
  value, 
  isAutoConfirmed = false,
  confidence,
  onEdit 
}: ConfirmedFieldTileProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-gray-500 capitalize">{field}</h3>
        <div className="flex items-center gap-2">
          {isAutoConfirmed ? (
            <span className="text-xs text-blue-600 font-semibold">
              🤖 Auto-confirmed
            </span>
          ) : (
            <span className="text-xs text-green-600 font-semibold">
              ✅ Confirmed
            </span>
          )}
          {onEdit && (
            <button 
              onClick={onEdit} 
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit this field"
            >
              ✏️
            </button>
          )}
        </div>
      </div>
      <p className="text-base font-semibold text-gray-900">{value}</p>
      {confidence && confidence < 1.0 && (
        <p className="text-xs text-gray-400 mt-1">
          Confidence: {(confidence * 100).toFixed(0)}%
        </p>
      )}
    </div>
  );
}