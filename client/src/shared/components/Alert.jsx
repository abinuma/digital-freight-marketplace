const roles = { info: 'status', success: 'status', warning: 'alert', danger: 'alert' };

export function Alert({ tone = 'info', title, className = '', children, ...props }) {
  const safeTone = Object.hasOwn(roles, tone) ? tone : 'info';
  return (
    <div className={`ui-alert ui-alert--${safeTone} ${className}`.trim()} role={roles[safeTone]} {...props}>
      {title && <strong className="ui-alert__title">{title}</strong>}
      <div>{children}</div>
    </div>
  );
}
