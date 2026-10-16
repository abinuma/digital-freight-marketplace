import { Alert, Spinner } from '../../../shared/components/index.js';

export function VehicleDetailsCard({
  vehicle,
  errors,
  hasVehicle,
  isLoading,
  loadError,
  busy,
  onChange,
  onSave,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center gap-3.5 mb-6">
        <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
        </div>
        <div>
          <h2 className="m-0 text-xl font-bold text-slate-900">Vehicle Details</h2>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            {hasVehicle
              ? 'Keep your vehicle information up to date.'
              : 'Add your vehicle to start finding loads.'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid min-h-28 place-items-center">
          <Spinner label="Loading vehicle details" />
        </div>
      ) : (
        <form onSubmit={onSave} noValidate className="grid gap-5">
          {loadError && <Alert tone="danger">{loadError}</Alert>}

          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Truck illustration container */}
            <div className="w-full md:w-48 h-36 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-3 shrink-0 overflow-hidden">
              <svg
                viewBox="0 0 120 70"
                className="w-full h-full max-h-28 drop-shadow-sm"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Truck Cargo Box */}
                <rect x="2" y="8" width="70" height="42" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
                <line x1="2" y1="28" x2="72" y2="28" stroke="#E2E8F0" strokeWidth="1.5" />
                <rect x="6" y="12" width="62" height="34" rx="2" fill="#FFFFFF" />
                {/* Cabin */}
                <path
                  d="M72 16H92C96 16 99 18 102 24L108 34C110 37 111 40 111 43V50H72V16Z"
                  fill="#2563EB"
                />
                {/* Cabin Window */}
                <path
                  d="M76 20H90C93 20 95 22 97 26L101 34H76V20Z"
                  fill="#93C5FD"
                />
                {/* Front Bumper / Grill */}
                <rect x="106" y="44" width="6" height="6" rx="1.5" fill="#1E293B" />
                {/* Chassis */}
                <rect x="8" y="50" width="100" height="4" fill="#334155" />
                {/* Wheels */}
                <circle cx="24" cy="54" r="8" fill="#1E293B" />
                <circle cx="24" cy="54" r="3.5" fill="#94A3B8" />
                <circle cx="58" cy="54" r="8" fill="#1E293B" />
                <circle cx="58" cy="54" r="3.5" fill="#94A3B8" />
                <circle cx="94" cy="54" r="8" fill="#1E293B" />
                <circle cx="94" cy="54" r="3.5" fill="#94A3B8" />
              </svg>
            </div>

            {/* Inputs area */}
            <div className="flex-1 grid gap-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="vehicle-type"
                    className="block text-xs font-bold text-slate-800 mb-1.5"
                  >
                    Vehicle Type
                  </label>
                  <div className="relative">
                    <select
                      id="vehicle-type"
                      name="type"
                      className="flex h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2 pr-9 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                      value={vehicle.type}
                      onChange={onChange}
                      aria-invalid={Boolean(errors.type)}
                      aria-describedby={errors.type ? 'vehicle-type-error' : undefined}
                    >
                      <option value="" disabled>
                        Select vehicle type
                      </option>
                      <option value="Isuzu">Isuzu</option>
                      <option value="FSR">FSR</option>
                      <option value="Sinotruk">Sinotruk</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 text-xs">
                      ▲
                    </div>
                  </div>
                  {errors.type && (
                    <small className="text-xs text-red-600 mt-1 block" id="vehicle-type-error">
                      {errors.type}
                    </small>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="vehicle-capacity"
                    className="block text-xs font-bold text-slate-800 mb-1.5"
                  >
                    Maximum Load (Tons)
                  </label>
                  <input
                    id="vehicle-capacity"
                    name="capacityTons"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="20"
                    value={vehicle.capacityTons}
                    onChange={onChange}
                    className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    aria-invalid={Boolean(errors.capacityTons)}
                    aria-describedby={
                      errors.capacityTons ? 'vehicle-capacity-error' : undefined
                    }
                  />
                  <span className="text-xs text-slate-400 mt-1 block">
                    Cargo capacity in tons
                  </span>
                  {errors.capacityTons && (
                    <small
                      className="text-xs text-red-600 mt-1 block"
                      id="vehicle-capacity-error"
                    >
                      {errors.capacityTons}
                    </small>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="vehicle-volume"
                    className="block text-xs font-bold text-slate-800 mb-1.5"
                  >
                    Volume (m³)
                  </label>
                  <input
                    id="vehicle-volume"
                    name="volumeM3"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="60"
                    value={vehicle.volumeM3}
                    onChange={onChange}
                    className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    aria-invalid={Boolean(errors.volumeM3)}
                    aria-describedby={
                      errors.volumeM3 ? 'vehicle-volume-error' : undefined
                    }
                  />
                  <span className="text-xs text-slate-400 mt-1 block">
                    Cargo capacity in cubic meters
                  </span>
                  {errors.volumeM3 && (
                    <small
                      className="text-xs text-red-600 mt-1 block"
                      id="vehicle-volume-error"
                    >
                      {errors.volumeM3}
                    </small>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="vehicle-plate"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Plate Number
                </label>
                <input
                  id="vehicle-plate"
                  name="plateNumber"
                  type="text"
                  placeholder="KBZ 123A"
                  value={vehicle.plateNumber}
                  onChange={onChange}
                  className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  aria-invalid={Boolean(errors.plateNumber)}
                  aria-describedby={
                    errors.plateNumber ? 'vehicle-plate-error' : undefined
                  }
                />
                {errors.plateNumber && (
                  <small
                    className="text-xs text-red-600 mt-1 block"
                    id="vehicle-plate-error"
                  >
                    {errors.plateNumber}
                  </small>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
            {busy ? 'Saving…' : 'Save Vehicle'}
          </button>
        </form>
      )}
    </div>
  );
}
