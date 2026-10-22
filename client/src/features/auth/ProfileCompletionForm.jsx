import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { ethiopianPhoneSchema } from "../../shared/utils/ethiopianPhone.js";

export function ProfileCompletionForm({ onComplete = () => {} }) {
  const { completeProfile } = useAuth();
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const parsedPhone = ethiopianPhoneSchema.safeParse(phone);
    if (!parsedPhone.success) {
      setPhoneError(parsedPhone.error.issues[0]?.message || "Enter a valid Ethiopian mobile");
      return;
    }
    setPhoneError("");
    setIsSaving(true);

    try {
      const user = await completeProfile({ phone: parsedPhone.data, role });
      onComplete(user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className="mt-6 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-lg shadow-slate-200/60 sm:p-8"
      aria-labelledby="profile-title"
    >
      <p className="mb-2 mt-0 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
        One last step
      </p>
      <h1 id="profile-title" className="m-0 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Complete your profile
      </h1>
      <p className="mb-0 mt-3 text-sm leading-6 text-slate-600">
        Add a contact number and choose how you’ll use the marketplace. You can
        continue once these details are saved.
      </p>

      <form
        className="mt-7 grid gap-5 text-left"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-700" htmlFor="phone">Phone number</label>
          <input
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="0912345678"
            maxLength={25}
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setPhoneError("");
            }}
            aria-invalid={Boolean(phoneError)}
            aria-describedby={phoneError ? "phone-error" : "phone-hint"}
            required
          />
          <small id={phoneError ? "phone-error" : "phone-hint"} className={phoneError ? "text-xs text-red-700" : "text-xs text-slate-500"}>
            {phoneError || "Enter a valid Ethiopian mobile"}
          </small>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-700" htmlFor="role">I am a</label>
          <select
            className="ui-select h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
        </div>

        {error && (
          <p className="m-0 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          className="mt-1 min-h-11 w-full cursor-pointer rounded-lg border-0 bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "Saving…" : "Continue"}
        </button>
      </form>
    </section>
  );
}
