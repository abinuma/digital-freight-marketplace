export function Spinner({ label = 'Loading', className = '' }) {
  return <span className={`ui-spinner ${className}`.trim()} role="status" aria-label={label} />;
}
