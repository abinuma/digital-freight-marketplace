const toneClasses = {
  success: 'bg-white text-emerald-950',
  danger: 'bg-white text-red-950',
  info: 'bg-white text-sky-950',
};

export function Toast({ tone = 'success', title, children, onDismiss, closing = false }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[1000] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto inline-flex w-fit max-w-[calc(100vw-2rem)] ${toneClasses[tone] || toneClasses.info} ${
          closing ? 'animate-toast-out' : 'animate-toast-in'
        } items-center gap-2 rounded-lg border-0 px-3 py-2 shadow-[0_2px_10px_rgba(15,23,42,0.12)]`}
      >
        {tone === 'success' ? (
          <img className="h-5 w-5 shrink-0" src="/correct-success-tick-svgrepo-com.svg" alt="" aria-hidden="true" />
        ) : (
          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ${tone === 'danger' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}`} aria-hidden="true">
            {tone === 'danger' ? '!' : 'i'}
          </span>
        )}
        <div className="min-w-0 text-sm">
          {title && <strong className="mr-1 font-semibold">{title}</strong>}
          <span>{children}</span>
        </div>
        {onDismiss && (
          <button
            className="grid h-5 w-5 shrink-0 place-items-center rounded border-0 bg-transparent p-0 text-base leading-none text-slate-500 hover:bg-slate-100 cursor-pointer"
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
