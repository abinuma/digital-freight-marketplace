export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`ui-input ui-select min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 transition-colors hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  );
}
