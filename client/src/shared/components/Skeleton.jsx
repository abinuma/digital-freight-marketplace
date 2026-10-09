export function Skeleton({ as: Element = 'div', className = '', width, height, style, ...props }) {
  return <Element className={`ui-skeleton ${className}`.trim()} style={{ width, height, ...style }} aria-hidden="true" {...props} />;
}
