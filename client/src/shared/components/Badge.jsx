const tones = new Set(['neutral', 'brand', 'success', 'warning', 'danger']);
const toneClasses = {
  neutral: 'ui-badge--neutral bg-slate-100 text-slate-700',
  brand: 'ui-badge--brand bg-indigo-50 text-blue-700',
  success: 'ui-badge--success bg-green-100 text-green-800',
  warning: 'ui-badge--warning bg-amber-100 text-amber-800',
  danger: 'ui-badge--danger bg-red-100 text-red-800',
};

export function Badge({ tone = 'neutral', className = '', ...props }) {
  const safeTone = tones.has(tone) ? tone : 'neutral';
  return <span className={`ui-badge inline-flex min-h-5 items-center rounded-full px-2 py-0.5 text-xs font-bold leading-none whitespace-nowrap ${toneClasses[safeTone]} ${className}`.trim()} {...props} />;
}
