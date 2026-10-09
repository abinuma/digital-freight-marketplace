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
    <div className="ui-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section className={`ui-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="ui-modal__header">
          <h2 id={titleId}>{title}</h2>
          <button className="ui-modal__close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
        </header>
        <div className="ui-modal__body">{children}</div>
      </section>
    </div>
  );
}
