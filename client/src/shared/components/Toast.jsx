import { Alert } from './Alert.jsx';
import { useEffect, useRef } from 'react';

export function Toast({ className = '', onDismiss, children, ...props }) {
  const toastRef = useRef(null);

  useEffect(() => {
    const toast = toastRef.current;
    if (!toast || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    toast.animate(
      [
        { opacity: 0, transform: 'translate(-50%, -1.25rem) scale(0.97)' },
        { opacity: 1, transform: 'translate(-50%, 0.25rem) scale(1.01)', offset: 0.7 },
        { opacity: 1, transform: 'translate(-50%, 0) scale(1)' },
      ],
      { duration: 420, easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)' },
    );
  }, []);

  return (
    <div ref={toastRef} className={`ui-toast fixed z-[1000] top-4 right-4 flex w-full items-start gap-2 drop-shadow-sm  ${className}`.trim()} role="status">
      <Alert {...props} className="flex-1">{children}</Alert>
      {onDismiss && <button className={`w-8 h-8 border-0 rounded-lg bg-transparent text-inherit cursor-pointer text-2xl leading-tight ui-toast__dismiss`} type="button" onClick={onDismiss} aria-label="Dismiss notification">×</button>}
    </div>
  );
}
