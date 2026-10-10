import { useEffect, useRef, useState } from 'react';
import { Toast } from './Toast.jsx';

export function NetworkErrorToaster() {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    function showNetworkError() {
      setVisible(true);
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setVisible(false), 6000);
    }
    window.addEventListener('app:network-error', showNetworkError);
    return () => {
      window.removeEventListener('app:network-error', showNetworkError);
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible) return null;
  return <Toast tone="danger" title="Connection problem" onDismiss={() => setVisible(false)}>Couldn’t reach the server. Check your connection and try again.</Toast>;
}
