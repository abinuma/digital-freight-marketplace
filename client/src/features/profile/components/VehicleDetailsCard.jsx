import { Alert, Spinner } from '../../../shared/components/index.js';
import { PreviewableImage } from '../../../shared/components/PreviewableImage.jsx';

export function VehicleDetailsCard({
  vehicle,
  errors,
  hasVehicle,
  isLoading,
  loadError,
  busy,
  onChange,
  onSave,
  photoFile,
  photoPreview,
  photoBusy,
  onChoosePhoto,
  onUploadPhoto,
  onClearPhoto,
}) {
  const displayPhoto = photoPreview || vehicle.photo;

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
              ? 'Keep your vehicle information and photo up to date.'
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

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Vehicle photo section on the left */}
            <div className="w-full md:w-56 flex flex-col items-center shrink-0">
              <div className="relative w-full h-44 rounded-2xl border-2 border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shadow-xs group">
                {displayPhoto ? (
                  <PreviewableImage
                    src={displayPhoto}
                    alt={`${vehicle.type || 'Vehicle'} photo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-400">
                    <svg
                      viewBox="0 0 120 70"
                      className="w-full h-24 drop-shadow-sm opacity-80"
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
                    <span className="text-xs font-medium text-slate-500 mt-1">No vehicle photo</span>
                  </div>
                )}

                {/* Camera action overlay button */}
                <label
                  htmlFor="vehicle-photo"
                  className="absolute bottom-2.5 right-2.5 h-9 w-9 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md flex items-center justify-center cursor-pointer hover:bg-white hover:scale-105 transition-all"
                >
                  <img
                    src="/camera-solid-full.svg"
                    alt="Upload photo"
                    className="h-4 w-4"
                    style={{
                      filter:
                        'invert(27%) sepia(85%) saturate(2250%) hue-rotate(213deg) brightness(96%) contrast(96%)',
                    }}
                  />
                </label>
              </div>

              {/* Hidden file input for vehicle photo */}
              <input
                id="vehicle-photo"
                name="vehiclePhoto"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={onChoosePhoto}
                disabled={photoBusy}
              />

              {/* Photo upload status and actions */}
              <div className="w-full mt-2.5 flex flex-col items-center gap-1.5">
                {photoFile ? (
                  <div className="w-full flex flex-col items-center gap-1.5">
                    <span className="text-xs text-slate-600 max-w-[210px] truncate font-medium">
                      {photoFile.name}
                    </span>
                    <div className="flex items-center gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={onUploadPhoto}
                        disabled={photoBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {photoBusy ? 'Uploading…' : 'Upload Photo'}
                      </button>
                      {onClearPhoto && (
                        <button
                          type="button"
                          onClick={onClearPhoto}
                          disabled={photoBusy}
                          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 p-2 text-xs transition-colors cursor-pointer"
                          aria-label="Cancel chosen file"
                        >
                          <img src="/xmark-solid-full.svg" alt="" aria-hidden="true" className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <label
                      htmlFor="vehicle-photo"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer py-1 px-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {vehicle.photo ? 'Change Photo' : 'Upload Photo'}
                    </label>
                  </div>
                )}
              </div>
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
                      required
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
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <img src="/angle-down-solid-full.svg" alt="" aria-hidden="true" className="h-3 w-3" />
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
                    Maximum Load (kg)
                  </label>
                  <input
                    id="vehicle-capacity"
                    name="capacityKg"
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 5000"
                    value={vehicle.capacityKg ?? ""}
                    onChange={onChange}
                    className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    aria-invalid={Boolean(errors.capacityKg)}
                    aria-describedby={errors.capacityKg ? 'vehicle-capacity-error' : undefined}
                  />
                  <span className="text-xs text-slate-400 mt-1 block">
                    Cargo mass capacity in kilograms
                  </span>
                  {errors.capacityKg && (
                    <small
                      className="text-xs text-red-600 mt-1 block"
                      id="vehicle-capacity-error"
                    >
                      {errors.capacityKg}
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
                  required
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
            className="mt-2 inline-flex min-h-9 justify-self-end items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}
    </div>
  );
}
