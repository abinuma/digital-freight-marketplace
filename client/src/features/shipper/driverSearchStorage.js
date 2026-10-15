const keyFor = (userId) => `digital-freight:shipper:${userId}:driver-search-city`;

export function readLastDriverSearchCity(userId) {
  if (!userId || typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(keyFor(userId)) || '';
  } catch {
    return '';
  }
}

export function saveLastDriverSearchCity(userId, city) {
  if (!userId || typeof window === 'undefined') return;
  try {
    if (city) window.localStorage.setItem(keyFor(userId), city);
    else window.localStorage.removeItem(keyFor(userId));
  } catch {
    // Searching remains available when browser storage is disabled.
  }
}
