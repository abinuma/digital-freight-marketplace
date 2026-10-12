import { Alert } from './Alert.jsx';

export function Toast({ className = '', onDismiss, children, ...props }) {
  return (
    <div className={`ui-toast ${className}`.trim()} role="status">
      <Alert {...props}>{children}</Alert>
      {onDismiss && <button className="ui-toast__dismiss" type="button" onClick={onDismiss} aria-label="Dismiss notification">×</button>}
    </div>
  );
}
