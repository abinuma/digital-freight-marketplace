export function Skeleton({ as: Element = 'div', className = '', width, height, style, ...props }) {
  return <Element className={`ui-skeleton block min-h-3 overflow-hidden rounded-lg bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-size-[400%_100%] animate-pulse ${className}`.trim()} style={{ width, height, ...style }} aria-hidden="true" {...props} />;
}
