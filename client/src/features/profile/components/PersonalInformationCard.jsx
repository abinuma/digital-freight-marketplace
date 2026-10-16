import { CityLocationPicker } from './CityLocationPicker.jsx';

export function PersonalInformationCard({
  profile,
  email,
  errors,
  busy,
  onChange,
  onLocationChange,
  onSave,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
      <div className="flex items-center gap-2 mb-5">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <h3 className="m-0 text-base font-bold text-slate-900">Personal Information</h3>
      </div>

      <form className="grid gap-4" onSubmit={onSave} noValidate>
        <div>
          <label
            htmlFor="profile-name"
            className="block text-xs font-bold text-slate-800 mb-1.5"
          >
            Full Name
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            value={profile.name}
            onChange={onChange}
            className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'profile-name-error' : undefined}
          />
          {errors.name && (
            <small className="text-xs text-red-600 mt-1 block" id="profile-name-error">
              {errors.name}
            </small>
          )}
        </div>

        <div>
          <label
            htmlFor="profile-email"
            className="block text-xs font-bold text-slate-800 mb-1.5"
          >
            Email Address
          </label>
          <input
            id="profile-email"
            type="email"
            value={email || ''}
            disabled
            placeholder="john.doe@example.com"
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed"
          />
          <small className="text-xs text-slate-400 mt-1 block">
            Email address cannot be changed here.
          </small>
        </div>

        <div>
          <label
            htmlFor="profile-phone"
            className="block text-xs font-bold text-slate-800 mb-1.5"
          >
            Phone Number
          </label>
          <input
            id="profile-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+251 912 345 678"
            value={profile.phone}
            onChange={onChange}
            className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'profile-phone-error' : undefined}
          />
          {errors.phone && (
            <small className="text-xs text-red-600 mt-1 block" id="profile-phone-error">
              {errors.phone}
            </small>
          )}
        </div>

        <div>
          <CityLocationPicker
            city={profile.city}
            zone={profile.zone}
            region={profile.region}
            error={errors.city || errors.location}
            onChange={onLocationChange}
          />
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a3 3 0 110-6 3 3 0 010 6zm3-10H5V5h10v4z" />
            </svg>
            {busy ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
