export function AuthField({ id, label, error, children }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <label className="text-sm font-semibold text-slate-700" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p
          className="mb-0 mt-0.5 text-sm text-red-700"
          id={`${id}-error`}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
