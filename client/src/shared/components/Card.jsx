export function Card({ as: Element = 'div', className = '', ...props }) {
  return <Element className={`ui-card rounded-xl border border-gray-200 bg-white shadow-sm ${className}`.trim()} {...props} />;
}
