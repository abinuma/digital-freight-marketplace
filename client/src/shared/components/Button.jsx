const base = 'ui-button inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-3 font-bold leading-tight no-underline transition-colors hover:shadow-sm active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:active:brightness-100';
const variants = {
  primary: 'ui-button--primary bg-blue-700 text-white hover:bg-blue-800',
  secondary: 'ui-button--secondary border-gray-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50',
  ghost: 'ui-button--ghost bg-transparent text-blue-700 hover:bg-blue-50',
  danger: 'ui-button--danger bg-red-700 text-white hover:bg-red-800',
};
const sizes = {
  sm: 'ui-button--sm min-h-8 px-3 py-2 text-sm',
  md: 'ui-button--md',
  lg: 'ui-button--lg min-h-12 px-5 py-3',
};

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  const safeVariant = Object.hasOwn(variants, variant) ? variant : 'primary';
  const safeSize = Object.hasOwn(sizes, size) ? size : 'md';
  return <button className={`${base} ${variants[safeVariant]} ${sizes[safeSize]} ${className}`.trim()} type={type} {...props} />;
}
