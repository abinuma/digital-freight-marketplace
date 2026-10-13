export function ProfileField({ id, label, error, helperText, children }) {
  return (
    <div className="grid content-start gap-1.5">
      <label className="text-sm font-semibold text-slate-700" htmlFor={id}>
        {label}
      </label>
      {children}
      {helperText && (
        <span className="text-sm text-slate-500">{helperText}</span>
      )}
      {error && (
        <span className="text-sm text-red-700" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
