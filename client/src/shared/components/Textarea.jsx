export function Textarea({ className = '', ...props }) {
  const isInvalid = props['aria-invalid'] === true || props['aria-invalid'] === 'true';
  const invalidClass = isInvalid ? 'border-red-600 focus:border-red-600 focus:ring-red-100' : '';
  return (
    <textarea
      className={`ui-input ui-textarea w-full min-h-24 px-3 py-3 border border-slate-300 rounded-lg bg-white transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 resize-y ${invalidClass} ${className}`.trim()}
      {...props}
    />
  );
}
