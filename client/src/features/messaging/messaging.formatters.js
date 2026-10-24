export const dateLabel = (value) => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
}).format(new Date(value));

export const timeLabel = (value) => new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date(value));

export function initials(name = '') {
  return Array.from(name.trim())[0]?.toUpperCase() || '?';
}
