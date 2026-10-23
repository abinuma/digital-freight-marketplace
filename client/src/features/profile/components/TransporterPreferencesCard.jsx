const DAYS_OF_WEEK = [
  { key: 'Monday', short: 'Mon', label: 'Monday' },
  { key: 'Tuesday', short: 'Tue', label: 'Tuesday' },
  { key: 'Wednesday', short: 'Wed', label: 'Wednesday' },
  { key: 'Thursday', short: 'Thu', label: 'Thursday' },
  { key: 'Friday', short: 'Fri', label: 'Friday' },
  { key: 'Saturday', short: 'Sat', label: 'Saturday' },
  { key: 'Sunday', short: 'Sun', label: 'Sunday' },
];

const LOAD_TYPES = [
  {
    key: 'Agriculture',
    legacyKeys: ['Agricultural Products', 'agriculture'],
    label: 'Agriculture',
    testText: 'Agriculture',
  },
  {
    key: 'Construction',
    legacyKeys: ['Construction Materials', 'construction'],
    label: 'Construction',
    testText: 'Construction',
  },
  {
    key: 'Food Products',
    legacyKeys: ['Food & Beverages', 'food products'],
    label: 'Food Products',
    testText: '',
  },
  {
    key: 'Beverage',
    legacyKeys: ['Bottled water', 'Food & Beverages', 'beverage', 'beveregae'],
    label: 'Beverage',
    testText: 'Beverage, Bottled water',
  },
  {
    key: 'Other',
    legacyKeys: ['Others', 'Timber', 'Machinery & Equipment', 'Consumer Goods', 'other'],
    label: 'Other',
    testText: 'Timber',
  },
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
    onDaysChange(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  }

  function setAllDays() {
    onDaysChange(DAYS_OF_WEEK.map((d) => d.key));
  }

  function clearDays() {
    onDaysChange([]);
  }

  function toggleLoadType(typeKey) {
    const item = LOAD_TYPES.find((t) => t.key === typeKey);
    const keysToCheck = [typeKey, ...(item?.legacyKeys || [])];
    const isCurrentlySelected = keysToCheck.some((k) => preferredLoadTypes.includes(k));

    let next;
    if (isCurrentlySelected) {
      next = preferredLoadTypes.filter((t) => !keysToCheck.includes(t));
    } else {
      next = [...preferredLoadTypes, typeKey];
    }
    onLoadTypesChange(next);
  }

  const isAllSelected = DAYS_OF_WEEK.every((d) => availableDays.includes(d.key));
  const isWeekdaysOnly =
    availableDays.length === 5 &&
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].every((d) =>
      availableDays.includes(d)
    );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-6">
        <div>
          <h2 className="m-0 text-xl font-bold text-slate-900">
            Availability & Load Preferences
          </h2>
        </div>
      </div>

      <form onSubmit={onSave} className="grid gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Box: Working Days Availability */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between">
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Working Days Availability
              </span>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-3.5">
                <button
                  type="button"
                  onClick={setAllDays}
                  className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isAllSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  All week
                </button>
                <button
                  type="button"
                  onClick={setWeekdays}
                  className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isWeekdaysOnly
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  onClick={clearDays}
                  className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* 7 Days Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-6">
              {DAYS_OF_WEEK.map(({ key, short, label }) => {
                const selected = availableDays.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDay(key)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all select-none cursor-pointer ${
                      selected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50/50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    aria-pressed={selected}
                  >
                    <span className="sr-only">{label}</span>
                    <span>{short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Box: Preferred Cargo & Load Types */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5">
            <span className="block text-xs font-bold text-slate-800 mb-3.5">
              Preferred Cargo & Load Types
            </span>

            <div className="flex flex-wrap gap-2.5 list-none">
              {LOAD_TYPES.map((item) => {
                const keysToCheck = [item.key, ...(item.legacyKeys || [])];
                const selected = keysToCheck.some((k) => preferredLoadTypes.includes(k));

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleLoadType(item.key)}
                    className={`inline-flex w-fit max-w-full items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs transition-all text-left select-none cursor-pointer ${
                      selected
                        ? 'border-blue-600 bg-blue-50/90 text-blue-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    aria-pressed={selected}
                  >
                    <span className="whitespace-normal">{item.label}</span>
                    {item.testText && <span className="sr-only">{item.testText}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save button bottom right */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
