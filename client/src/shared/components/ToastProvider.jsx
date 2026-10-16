import { useCallback, useRef, useState } from 'react';
import { Toast } from './Toast.jsx';
import { ToastContext } from './ToastContext.js';

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const nextId = useRef(0);

  const autoDismissTimerRef = useRef(null);

  const dismiss = useCallback((id) => {
    setToast((current) => current?.id === id ? { ...current, closing: true } : current);
    window.setTimeout(() => setToast((current) => current?.id === id ? null : current), 200);
  }, []);

  const showSuccess = useCallback((message, title = '') => {
    if (autoDismissTimerRef.current) {
      window.clearTimeout(autoDismissTimerRef.current);
    }
    const id = ++nextId.current;
    setToast({ id, message, title, closing: false });
    autoDismissTimerRef.current = window.setTimeout(() => dismiss(id), 3400);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={showSuccess}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          tone="success"
          title={toast.title}
          closing={toast.closing}
          onDismiss={() => dismiss(toast.id)}
        >
          {toast.message}
        </Toast>
      )}
    </ToastContext.Provider>
  );
}
