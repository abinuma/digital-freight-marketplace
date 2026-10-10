import { useState } from 'react';
import { Button } from '../../shared/components/index.js';
import { useAuth } from './AuthContext.jsx';

export function GoogleSignInButton({ label = 'Continue with Google' }) {
  const { startGoogleSignIn } = useAuth();
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  async function handleClick() {
    setError('');
    setIsStarting(true);
    try {
      const url = await startGoogleSignIn(`${window.location.origin}/`);
      window.location.assign(url);
    } catch (requestError) {
      setError(requestError.message);
      setIsStarting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" className="google-button" onClick={handleClick} disabled={isStarting}>
        <span className="google-button__mark" aria-hidden="true">G</span>
        {isStarting ? 'Connecting to Google…' : label}
      </Button>
      {error && <p className="auth-form__error" role="alert">{error}</p>}
    </>
  );
}
