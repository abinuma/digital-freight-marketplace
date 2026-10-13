import { useEffect, useId } from 'react';

export function Modal({ open, onClose, title, children, className = '' }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm max-sm:p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section className={`w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="m-0 text-lg font-semibold text-slate-900" id={titleId}>{title}</h2>
          <button className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-xl text-slate-500 hover:bg-slate-200 hover:text-slate-800" type="button" onClick={onClose} aria-label="Close dialog">×</button>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
