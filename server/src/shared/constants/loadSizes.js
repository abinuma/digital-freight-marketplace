export const LOAD_SIZES = {
  FULL_LOAD: {
    value: 'FULL_LOAD',
    label: 'Full load',
    fraction: 1.0,
  },
  HALF_LOAD: {
    value: 'HALF_LOAD',
    label: 'Half load',
    fraction: 0.5,
  },
  QUARTER_LOAD: {
    value: 'QUARTER_LOAD',
    label: 'Quarter load',
    fraction: 0.25,
  },
  SMALL_LOAD: {
    value: 'SMALL_LOAD',
    label: 'Small load',
    fraction: 0.125,
  },
};

export const VALID_LOAD_SIZES = ['FULL_LOAD', 'HALF_LOAD', 'QUARTER_LOAD', 'SMALL_LOAD'];

export function normalizeLoadSize(value) {
  if (!value) return 'FULL_LOAD';
  const clean = String(value).trim().toUpperCase().replace(/\s+/g, '_');
  if (VALID_LOAD_SIZES.includes(clean)) return clean;
  const match = Object.values(LOAD_SIZES).find(
    (item) => item.label.toLowerCase() === String(value).trim().toLowerCase()
  );
  return match ? match.value : 'FULL_LOAD';
}

export function formatLoadSize(value) {
  if (!value) return '';
  const normalized = normalizeLoadSize(value);
  return LOAD_SIZES[normalized]?.label || value;
}

export function getLoadFraction(value, weightKg, maxWeightKg) {
  if (!value) return 1.0;
  const normalized = normalizeLoadSize(value);
  if (normalized === 'SMALL_LOAD') {
    if (weightKg != null && maxWeightKg != null && Number(maxWeightKg) > 0) {
      return Number(weightKg) / Number(maxWeightKg);
    }
  }
  return LOAD_SIZES[normalized]?.fraction ?? 1.0;
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
