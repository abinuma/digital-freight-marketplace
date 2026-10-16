import { useEffect, useRef } from 'react';

export function FormValidationScroll() {
  const frameRef = useRef(0);

  useEffect(() => {
    function handleSubmit(event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(() => {
        const invalidField = form.querySelector(
          'input:invalid:not(:disabled), select:invalid:not(:disabled), textarea:invalid:not(:disabled), [aria-invalid="true"]:not(:disabled)',
        );
        if (!invalidField) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        invalidField.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        invalidField.focus({ preventScroll: true });
      });
    }

    document.addEventListener('submit', handleSubmit, true);
    return () => {
      document.removeEventListener('submit', handleSubmit, true);
      window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return null;
}
