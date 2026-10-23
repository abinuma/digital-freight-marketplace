import { CityLocationPicker } from './CityLocationPicker.jsx';

export function PersonalInformationCard({
  profile,
  email,
  errors,
  showLocation = true,
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

      <form id="profile-information-form" className="grid gap-4" onSubmit={onSave} noValidate>
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
            required
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
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="0912345678"
            maxLength={25}
            value={profile.phone}
            onChange={onChange}
            className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'profile-phone-error' : 'profile-phone-hint'}
          />
          {!errors.phone && <small className="mt-1 block text-xs text-slate-500" id="profile-phone-hint">Enter a valid Ethiopian mobile</small>}
          {errors.phone && (
            <small className="text-xs text-red-600 mt-1 block" id="profile-phone-error">
              {errors.phone}
            </small>
          )}
        </div>

        {showLocation && (
          <div>
            <CityLocationPicker
              city={profile.city}
              zone={profile.zone}
              region={profile.region}
              error={errors.city || errors.location}
              onChange={onLocationChange}
            />
          </div>
        )}
      </form>
    </div>
  );
}
