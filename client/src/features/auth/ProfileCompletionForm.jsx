import { useState } from 'react';
import { useAuth } from './AuthContext.jsx';

export function ProfileCompletionForm({ onComplete = () => {} }) {
  const { completeProfile } = useAuth();
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const user = await completeProfile({ phone, role });
      onComplete(user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="auth-card" aria-labelledby="profile-title">
      <p className="eyebrow">One last step</p>
      <h1 id="profile-title">Complete your profile</h1>
      <p className="intro">
        Add a contact number and choose how you’ll use the marketplace. You can continue once these details are saved.
      </p>

      <form className="profile-form" onSubmit={handleSubmit}>
        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          minLength={7}
          maxLength={20}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />

        <label htmlFor="role">I am a</label>
        <select id="role" name="role" value={role} onChange={(event) => setRole(event.target.value)} required>
          <option value="" disabled>Select your role</option>
          <option value="SHIPPER">Shipper</option>
          <option value="TRANSPORTER">Transporter</option>
        </select>

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </section>
  );
}
