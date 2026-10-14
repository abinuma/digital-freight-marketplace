export function PasswordRulesList({ password = '' }) {
  const rules = [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'At least one uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'At least one lowercase letter (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'At least one number (0-9)',
      met: /[0-9]/.test(password),
    },
  ];

  return (
    <div className="mt-2 flex flex-col gap-1.5" aria-label="Password criteria">
      <span className="text-xs font-semibold text-slate-600">Password requirements:</span>
      <ul className="m-0 flex flex-col gap-1.5 p-0 list-none text-xs">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-2 transition-colors ${
              rule.met ? 'text-emerald-700 font-medium' : 'text-slate-500'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                rule.met
                  ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400'
                  : 'border border-slate-300 text-transparent'
              }`}
              aria-hidden="true"
            >
              ✓
            </span>
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
