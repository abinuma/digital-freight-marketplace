const roles = { info: 'status', success: 'status', warning: 'alert', danger: 'alert' };
const toneClasses = {
  info: 'ui-alert--info border-gray-200 bg-gray-50 text-slate-500',
  success: 'ui-alert--success border-gray-300 bg-gray-100 text-slate-500',
  warning: 'ui-alert--warning border-gray-50 bg-gray-50 text-slate-500',
  danger: 'ui-alert--danger border-gray-100 bg-gray-50 text-slate-500',
};

export function Alert({ tone = 'info', title, className = '', children, ...props }) {
  const safeTone = Object.hasOwn(roles, tone) ? tone : 'info';
  return (
    <div className={`ui-alert grid gap-1 py-3 px-4 border border-transparent rounded-xl text-base ${toneClasses[safeTone]} ${className}`.trim()} role={roles[safeTone]} {...props}>
      {title && <strong className="ui-alert__title font-bold">{title}</strong>}
      <div>{children}</div>
    </div>
  );
}
