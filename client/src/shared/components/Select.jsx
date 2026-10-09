export function Select({ className = '', children, ...props }) {
  return <select className={`ui-input ui-select ${className}`.trim()} {...props}>{children}</select>;
}
