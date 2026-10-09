export function Textarea({ className = '', ...props }) {
  return <textarea className={`ui-input ui-textarea ${className}`.trim()} {...props} />;
}
