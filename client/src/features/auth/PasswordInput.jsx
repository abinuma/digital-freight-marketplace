import { useState } from 'react';
import { Input } from '../../shared/components/index.js';

export function PasswordInput({ id, name, value, onChange, autoComplete, error, required = true }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input">
      <Input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <button className="password-input__toggle" type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
