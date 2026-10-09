export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return <button className={`ui-button ui-button--${variant} ui-button--${size} ${className}`.trim()} type={type} {...props} />;
}
