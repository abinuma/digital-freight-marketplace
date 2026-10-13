import { MapCanvas } from '../../../shared/components/maps/MapCanvas.jsx';

export function LocationPicker({ label, value, onChange }) {
  const hasPoint = value?.lat != null && value?.lng != null;
  const point = hasPoint
    ? [{ id: `${label}-pin`, position: [value.lat, value.lng], title: label }]
    : [];
  const center = hasPoint ? [value.lat, value.lng] : [8.9806, 38.7578];

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-slate-500">Click the map to set an optional pin</span>
      </div>
      <MapCanvas
        points={point}
        center={center}
        zoom={hasPoint ? 12 : 6}
        onPick={onChange}
        className="z-10 h-48 w-full overflow-hidden rounded-xl border border-slate-200"
      />
      {hasPoint && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>
            Pin: {Number(value.lat).toFixed(5)}, {Number(value.lng).toFixed(5)}
          </span>
          <button
            type="button"
            onClick={() => onChange({ lat: null, lng: null })}
            className="font-semibold text-blue-700 transition-colors hover:text-blue-800"
          >
            Remove pin
          </button>
        </div>
      )}
    </div>
  );
}
