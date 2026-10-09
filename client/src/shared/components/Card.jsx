export function Card({ as: Element = 'div', className = '', ...props }) {
  return <Element className={`ui-card ${className}`.trim()} {...props} />;
}
