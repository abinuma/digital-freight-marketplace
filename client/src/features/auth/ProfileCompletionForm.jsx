import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

export function ProfileCompletionForm({ onComplete = () => {} }) {
  const { completeProfile } = useAuth();
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
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
    <section
      className={`w-full mt-8  border rounded bg-slate-500 shadow-sm text-left     auth-card`}
      aria-labelledby="profile-title"
    >
      <p
        className={`mt-5 mx-0 mb-2 text-blue-700 text-sm font-bold tracking-widest uppercase eyebrow`}
      >
        One last step
      </p>
      <h1 id="profile-title">Complete your profile</h1>
      <p
        className={`max-w-7xl mt-4 mx-0 mb-0 text-slate-500  leading-relaxed intro`}
      >
        Add a contact number and choose how you’ll use the marketplace. You can
        continue once these details are saved.
      </p>

      <form
        className={`grid gap-3 mt-6 text-left                   profile-form`}
        onSubmit={handleSubmit}
      >
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
        <select
          id="role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          required
        >
          <option value="" disabled>
            Select your role
          </option>
          <option value="SHIPPER">Shipper</option>
          <option value="TRANSPORTER">Transporter</option>
        </select>

        {error && (
          <p className={`text-red-700 text-base form-error`} role="alert">
            {error}
          </p>
        )}
        <button
          className={`min-h-12 mt-4 py-3 px-4 border rounded-lg bg-blue-700 text-white cursor-pointer font-bold transition    disabled:cursor-wait disabled:opacity-75 primary-button`}
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "Saving…" : "Continue"}
        </button>
      </form>
    </section>
  );
}
