import { useState } from 'react';
import { Button } from '../../shared/components/index.js';
import { useAuth } from './AuthContext.jsx';
import { ProfileCompletionForm } from './ProfileCompletionForm.jsx';

export function AuthGate() {
  const { user, isLoading, isError, error, refreshUser, startGoogleSignIn } = useAuth();
  const [isStartingSignIn, setIsStartingSignIn] = useState(false);
  const [actionError, setActionError] = useState('');

  async function handleGoogleSignIn() {
    setActionError('');
    setIsStartingSignIn(true);
    try {
      const authorizationUrl = await startGoogleSignIn(window.location.origin);
      window.location.assign(authorizationUrl);
    } catch (requestError) {
      setActionError(requestError.message);
      setIsStartingSignIn(false);
    }
  }

  if (isLoading) {
    return <main className="landing" aria-live="polite"><p>Checking your sign-in…</p></main>;
  }

  if (user && !user.profileComplete) {
    return (
      <main className="landing">
        <div className="brand-mark" aria-hidden="true">EF</div>
        <ProfileCompletionForm />
      </main>
    );
  }

  return (
    <main className="landing">
      <div className="brand-mark" aria-hidden="true">EF</div>
      <p className="eyebrow">EthioFreight</p>
      <h1>{user ? `Welcome, ${user.name}` : 'Freight moving forward.'}</h1>
      <p className="intro">
        {user
          ? 'Your profile is complete. The marketplace is being prepared.'
          : 'A simpler way for shippers and transporters to connect. Sign in with Google to get started.'}
      </p>

      {isError && <p className="form-error" role="alert">{error.message}</p>}
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      {!user && !isError && (
        <Button className="primary-button" onClick={handleGoogleSignIn} disabled={isStartingSignIn}>
          {isStartingSignIn ? 'Connecting to Google…' : 'Continue with Google'}
        </Button>
      )}
      {user && (
        <div className="availability">
          <span className="status-dot" aria-hidden="true" />
          <span>Platform setup in progress</span>
        </div>
      )}
      {isError && <Button variant="secondary" className="secondary-button" onClick={() => refreshUser().catch(() => undefined)}>Try again</Button>}
    </main>
  );
}
