export const LOAD_SIZES = {
  FULL_LOAD: {
    value: 'FULL_LOAD',
    label: 'Full load',
    fraction: 1.0,
    description: 'Requires entire vehicle capacity',
  },
  HALF_LOAD: {
    value: 'HALF_LOAD',
    label: 'Half load',
    fraction: 0.5,
    description: 'Takes up about half of vehicle capacity',
  },
  QUARTER_LOAD: {
    value: 'QUARTER_LOAD',
    label: 'Quarter load',
    fraction: 0.25,
    description: 'Takes up about a quarter of vehicle capacity',
  },
  SMALL_LOAD: {
    value: 'SMALL_LOAD',
    label: 'Small load',
    fraction: 0.125,
    description: 'Takes up a small portion of vehicle capacity',
  },
};

export const LOAD_SIZE_OPTIONS = [
  { value: 'FULL_LOAD', label: 'Full load' },
  { value: 'HALF_LOAD', label: 'Half load' },
  { value: 'QUARTER_LOAD', label: 'Quarter load' },
  { value: 'SMALL_LOAD', label: 'Small load' },
];

export function formatLoadSize(value) {
  if (!value) return '';
  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, '_');
  const match = LOAD_SIZES[normalized] || Object.values(LOAD_SIZES).find(
    (item) => item.label.toLowerCase() === String(value).toLowerCase()
  );
  return match ? match.label : value;
}

export function getLoadFraction(value, weightKg, maxWeightKg) {
  if (!value) return 1.0;
  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'SMALL_LOAD') {
    if (weightKg != null && maxWeightKg != null && Number(maxWeightKg) > 0) {
      return Number(weightKg) / Number(maxWeightKg);
    }
  }
  const match = LOAD_SIZES[normalized];
  return match ? match.fraction : 1.0;
}

export function formatShipmentLoad(shipment) {
  if (!shipment) return '';
  const base = formatLoadSize(shipment.loadSize);
  const isSmall = shipment.loadSize === 'SMALL_LOAD' || String(shipment.loadSize).toLowerCase().includes('small');
  if (isSmall && shipment.weightKg != null) {
    return `${base} (${Number(shipment.weightKg).toLocaleString()} kg)`;
  }
  return base;
}
