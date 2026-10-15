export function ProfileField({ id, label, error, helperText, children }) {
  return (
    <div className="grid content-start gap-1.5">
      <span className="cursor-default text-sm font-semibold text-slate-700">
        {label}
      </span>
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
