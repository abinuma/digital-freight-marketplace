export function Spinner({ label = 'Loading', className = '' }) {
  return <span className={`ui-spinner inline-block w-5 h-5 border-2 border-gray-200 border-t-[var(--color-brand)] rounded-full animate-spin ${className}`.trim()} role="status" aria-label={label} />;
}
