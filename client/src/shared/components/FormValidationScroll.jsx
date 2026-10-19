import { useEffect, useRef } from 'react';

function findInvalidField(form) {
  // 1. Direct match for standard invalid or aria-invalid controls
  const directInvalid = form.querySelector(
    'input:invalid:not(:disabled), select:invalid:not(:disabled), textarea:invalid:not(:disabled), [aria-invalid="true"]:not(:disabled)'
  );
  if (directInvalid) return directInvalid;

  // 2. Form controls that have required or aria-required and are currently empty
  const requiredControls = form.querySelectorAll(
    'input[required]:not(:disabled), select[required]:not(:disabled), textarea[required]:not(:disabled), [aria-required="true"]:not(:disabled)'
  );
  for (const control of requiredControls) {
    if (control.type === 'radio' || control.type === 'checkbox') {
      const name = control.name;
      if (name) {
        const group = form.querySelectorAll(`input[name="${name}"]`);
        const isAnyChecked = Array.from(group).some((input) => input.checked);
        if (!isAnyChecked) return control;
      } else if (!control.checked) {
        return control;
      }
    } else if (!control.value || !control.value.trim()) {
      return control;
    }
  }

  // 3. Fallback: check controls associated with an active error message element
  const errorElements = form.querySelectorAll('[role="alert"], [id$="-error"]');
  for (const errEl of errorElements) {
    if (!errEl.textContent || !errEl.textContent.trim()) continue;
    if (errEl.id) {
      const describedControl = form.querySelector(`[aria-describedby~="${errEl.id}"]:not(:disabled)`);
      if (describedControl) return describedControl;
    }
    const container = errEl.closest('label, div, fieldset');
    if (container) {
      const control = container.querySelector('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
      if (control) return control;
    }
  }

  return null;
}

function navigateAndHighlight(form, invalidField) {
  if (!invalidField) return;

  // Clear previous highlighted fields in this form
  form.querySelectorAll('.field-error-accent, .field-error-pulse').forEach((el) => {
    el.classList.remove('field-error-accent', 'field-error-pulse');
  });

  // Apply red accent highlight
  invalidField.classList.add('field-error-accent', 'field-error-pulse');
  invalidField.setAttribute('data-field-invalid', 'true');

  // If inside a role choice or specialized container, also highlight that container
  const roleOption = invalidField.closest('.role-choice__option');
  if (roleOption) {
    roleOption.classList.add('field-error-accent');
  }

  // Smooth scroll and focus
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  invalidField.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  try {
    invalidField.focus({ preventScroll: true });
  } catch {
    invalidField.focus();
  }
}

export function FormValidationScroll() {
  const frameRef = useRef(0);
  const timeoutRef = useRef(0);

  useEffect(() => {
    function handleSubmit(event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      form.setAttribute('data-submitted', 'true');

      window.cancelAnimationFrame(frameRef.current);
      clearTimeout(timeoutRef.current);

      const runCheck = () => {
        const invalidField = findInvalidField(form);
        if (invalidField) {
          navigateAndHighlight(form, invalidField);
          return true;
        }
        return false;
      };

      // Immediate check in next animation frame
      frameRef.current = window.requestAnimationFrame(() => {
        const found = runCheck();
        // If React re-rendered with new validation state slightly after, run secondary check
        if (!found) {
          timeoutRef.current = window.setTimeout(runCheck, 50);
        }
      });
    }

    function handleInputOrChange(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      if (target.matches('input, select, textarea')) {
        const input = target;
        if (input.validity?.valid || (input.value && input.value.trim())) {
          input.classList.remove('field-error-accent', 'field-error-pulse');
          input.removeAttribute('data-field-invalid');

          const roleOption = input.closest('.role-choice__option');
          if (roleOption) roleOption.classList.remove('field-error-accent');
        }
      }
    }

    document.addEventListener('submit', handleSubmit, true);
    document.addEventListener('input', handleInputOrChange, true);
    document.addEventListener('change', handleInputOrChange, true);

    return () => {
      document.removeEventListener('submit', handleSubmit, true);
      document.removeEventListener('input', handleInputOrChange, true);
      document.removeEventListener('change', handleInputOrChange, true);
      window.cancelAnimationFrame(frameRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
}
