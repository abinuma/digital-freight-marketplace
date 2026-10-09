import { Alert } from './Alert.jsx';

export function Toast({ onDismiss, children, ...props }) {
  return (
    <div className="ui-toast" role="status">
      <Alert {...props}>{children}</Alert>
      {onDismiss && <button className="ui-toast__dismiss" type="button" onClick={onDismiss} aria-label="Dismiss notification">×</button>}
    </div>
  );
}
