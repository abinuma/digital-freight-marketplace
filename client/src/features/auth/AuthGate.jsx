import { useEffect, useState } from 'react';
import { getCurrentUser, startGoogleSignIn } from './auth.api.js';
import { ProfileCompletionForm } from './ProfileCompletionForm.jsx';

export function AuthGate() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('loading');
  const [error, setError] = useState('');
  const [isStartingSignIn, setIsStartingSignIn] = useState(false);

  async function loadCurrentUser() {
    setError('');
    setView('loading');
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setView('ready');
    } catch (requestError) {
      if (requestError.status === 401) {
        setUser(null);
        setView('signed-out');
      } else {
        setError(requestError.message);
        setView('error');
      }
    }
  }

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  async function handleGoogleSignIn() {
    setError('');
    setIsStartingSignIn(true);
    try {
      const authorizationUrl = await startGoogleSignIn(window.location.origin);
      window.location.assign(authorizationUrl);
    } catch (requestError) {
      setError(requestError.message);
      setIsStartingSignIn(false);
    }
  }

  if (view === 'loading') {
    return <main className="landing" aria-live="polite"><p>Checking your sign-in…</p></main>;
  }

  if (user && !user.profileComplete) {
    return (
      <main className="landing">
        <div className="brand-mark" aria-hidden="true">DFM</div>
        <ProfileCompletionForm onComplete={setUser} />
      </main>
    );
  }

  return (
    <main className="landing">
      <div className="brand-mark" aria-hidden="true">DFM</div>
      <p className="eyebrow">Digital Freight Marketplace</p>
      <h1>{user ? `Welcome, ${user.name}` : 'Freight moving forward.'}</h1>
      <p className="intro">
        {user
          ? 'Your profile is complete. The marketplace is being prepared.'
          : 'A simpler way for shippers and transporters to connect. Sign in with Google to get started.'}
      </p>

      {view === 'error' && <p className="form-error" role="alert">{error}</p>}
      {view === 'signed-out' && (
        <button className="primary-button" type="button" onClick={handleGoogleSignIn} disabled={isStartingSignIn}>
          {isStartingSignIn ? 'Connecting to Google…' : 'Continue with Google'}
        </button>
      )}
      {user && (
        <div className="availability">
          <span className="status-dot" aria-hidden="true" />
          <span>Platform setup in progress</span>
        </div>
      )}
      {view === 'error' && <button className="secondary-button" type="button" onClick={loadCurrentUser}>Try again</button>}
    </main>
  );
}
