import { useContext } from 'react';
import { ToastContext } from './ToastContext.js';

export function useSuccessToast() {
  const showSuccess = useContext(ToastContext);
  return showSuccess || (() => {});
}
