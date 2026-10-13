export function Textarea({ className = '', ...props }) {
  return <textarea className={`ui-input ui-textarea w-full min-h-24 px-3 py-3 border border-gray-300 rounded-lg bg-white  transition-[border-color,box-shadow] placeholder:text-slate-500 border-slate-500 border-blue-700 focus:outline-none focus:shadow-sm bg-gray-50 disabled: disabled:cursor-not-allowed resize-y ${className}`.trim()} {...props} />;
}
