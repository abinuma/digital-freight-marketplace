import { Button, Card } from "../../../shared/components/index.js";

const DAYS_OF_WEEK = [
  { key: "Monday", label: "Monday", short: "Mon" },
  { key: "Tuesday", label: "Tuesday", short: "Tue" },
  { key: "Wednesday", label: "Wednesday", short: "Wed" },
  { key: "Thursday", label: "Thursday", short: "Thu" },
  { key: "Friday", label: "Friday", short: "Fri" },
  { key: "Saturday", label: "Saturday", short: "Sat" },
  { key: "Sunday", label: "Sunday", short: "Sun" },
];

const LOAD_TYPES = [
  { key: "Construction", label: "Construction", desc: "Cement, rebar, gravel, tiles" },
  { key: "Timber", label: "Timber", desc: "Lumber, wood poles, logs" },
  { key: "Beverage", label: "Beverage", desc: "Soft drinks, beer, juices" },
  { key: "Bottled water", label: "Bottled water", desc: "Packaged drinking water" },
  { key: "Agriculture", label: "Agriculture", desc: "Grains, coffee, oilseeds, produce" },
];

export function TransporterPreferencesCard({
  availableDays = [],
  preferredLoadTypes = [],
  busy = false,
  onDaysChange,
  onLoadTypesChange,
  onSave,
}) {
  function toggleDay(day) {
    const next = availableDays.includes(day)
      ? availableDays.filter((d) => d !== day)
      : [...availableDays, day];
    onDaysChange(next);
  }

  function setWeekdays() {
    onDaysChange(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  }

  function setAllDays() {
    onDaysChange(DAYS_OF_WEEK.map((d) => d.key));
  }

  function clearDays() {
    onDaysChange([]);
  }

  function toggleLoadType(type) {
    const next = preferredLoadTypes.includes(type)
      ? preferredLoadTypes.filter((t) => t !== type)
      : [...preferredLoadTypes, type];
    onLoadTypesChange(next);
  }

  return (
    <Card className="grid gap-5 p-5 md:col-start-2 md:col-span-2">
      <div>
        <h2 className="m-0 text-base font-bold text-slate-900">
          Availability & Load Preferences
        </h2>
        <p className="mb-0 mt-2 text-sm text-slate-500">
          Set the days of the week you want to work and the cargo types you prefer to haul.
        </p>
      </div>

      <form onSubmit={onSave} className="grid gap-6">
        {/* Availability Section */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="cursor-default text-sm font-semibold text-slate-800">
              Working Days Availability (Mon–Sun)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={setAllDays}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline bg-transparent border-0 cursor-pointer p-0"
              >
                All week
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={setWeekdays}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline bg-transparent border-0 cursor-pointer p-0"
              >
                Weekdays
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={clearDays}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline bg-transparent border-0 cursor-pointer p-0"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
            {DAYS_OF_WEEK.map(({ key, label, short }) => {
              const selected = availableDays.includes(key);
              return (
                <label
                  key={key}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center cursor-pointer transition-all select-none ${
                    selected
                      ? "border-blue-600 bg-blue-50/80 text-blue-900 font-semibold shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selected}
                    onChange={() => toggleDay(key)}
                  />
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    {short}
                  </span>
                  <span className="text-xs sm:text-sm font-medium">
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Preferred Load Types Section */}
        <div>
          <span className="cursor-default block text-sm font-semibold text-slate-800 mb-2.5">
            Preferred Cargo & Load Types
          </span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {LOAD_TYPES.map(({ key, label, desc }) => {
              const selected = preferredLoadTypes.includes(key);
              return (
                <label
                  key={key}
                  className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all select-none ${
                    selected
                      ? "border-blue-600 bg-blue-50/80 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={selected}
                    onChange={() => toggleLoadType(key)}
                  />
                  <div className="grid gap-0.5">
                    <strong className="text-sm font-semibold text-slate-900">
                      {label}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {desc}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save Preferences"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
