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
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`relative  password-input`}>
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <button
        className={`absolute top-1/2 right-2 p-1 -translate-y-1/2 border-0 bg-transparent text-slate-500 cursor-pointer text-sm font-bold hover:text-blue-700 password-input__toggle`}
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
