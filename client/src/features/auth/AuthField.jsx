export function AuthField({ id, label, error, children }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p className="auth-field__error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}
