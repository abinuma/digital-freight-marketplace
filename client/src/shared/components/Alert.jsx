const roles = { info: 'status', success: 'status', warning: 'alert', danger: 'alert' };
const toneClasses = {
  info: 'ui-alert--info border-sky-200 bg-sky-50 text-sky-950',
  success: 'ui-alert--success border-emerald-200 bg-emerald-50 text-emerald-950',
  warning: 'ui-alert--warning border-amber-200 bg-amber-50 text-amber-950',
  danger: 'ui-alert--danger border-red-200 bg-red-50 text-red-900',
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
