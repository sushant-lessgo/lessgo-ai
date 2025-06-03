type ConfirmedFieldTileProps = {
  field: string;
  value: string;
  onEdit?: () => void;
};

export default function ConfirmedFieldTile({ field, value, onEdit }: ConfirmedFieldTileProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-gray-500 capitalize">{field}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-600 font-semibold">✅ Confirmed</span>
          {onEdit && (
            <button onClick={onEdit} className="text-xs text-gray-400 hover:text-gray-600">
              ✏️ Edit
            </button>
          )}
        </div>
      </div>
      <p className="text-base font-semibold text-gray-900">{value}</p>
    </div>
  );
}
