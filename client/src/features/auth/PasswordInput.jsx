import { useState } from "react";
import { Input } from "../../shared/components/index.js";

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  autoComplete,
  error,
  required = true,
  className = "",
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`relative password-input ${className}`.trim()}>
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        className="pr-10"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <button
        className="password-input__toggle absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1.5 border-0 bg-transparent text-slate-500 cursor-pointer hover:text-blue-700 transition-colors focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 rounded"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        <span className="relative flex items-center justify-center h-5 w-5">
          <img
            src="/eye-solid-full.svg"
            alt=""
            className={`h-5 w-5 object-contain transition-opacity ${
              visible ? "opacity-90" : "opacity-40"
            }`}
          />
          {!visible && (
            <span
              className="pointer-events-none absolute h-[2px] w-6 rotate-45 rounded-full bg-slate-600 shadow-xs"
              aria-hidden="true"
            />
          )}
        </span>
      </button>
    </div>
  );
}
