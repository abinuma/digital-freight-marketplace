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
    key: 'Agricultural Products',
    legacyKeys: ['Agriculture'],
    label: 'Agricultural Products',
    testText: 'Agriculture',
    icon: (
      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    key: 'Construction Materials',
    legacyKeys: ['Construction'],
    label: 'Construction Materials',
    testText: 'Construction',
    icon: (
      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'Machinery & Equipment',
    legacyKeys: ['Machinery'],
    label: 'Machinery & Equipment',
    testText: '',
    icon: (
      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'Consumer Goods',
    legacyKeys: ['Consumer Goods'],
    label: 'Consumer Goods',
    testText: '',
    icon: (
      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'Food & Beverages',
    legacyKeys: ['Beverage', 'Bottled water'],
    label: 'Food & Beverages',
    testText: 'Beverage, Bottled water',
    icon: (
      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    key: 'Others',
    legacyKeys: ['Timber', 'Other'],
    label: 'Others',
    testText: 'Timber',
    icon: (
      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    ),
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
      <div className="flex items-center gap-3.5 mb-6">
        <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
          </svg>
        </div>
        <div>
          <h2 className="m-0 text-xl font-bold text-slate-900">
            Availability & Load Preferences
          </h2>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            Set the days of the week you want to work and the cargo types you prefer to haul.
          </p>
        </div>
      </div>

      <form onSubmit={onSave} className="grid gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Box: Working Days Availability */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between">
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Working Days Availability (Mon–Sun)
              </span>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-2 mt-3.5">
                <button
                  type="button"
                  onClick={setAllDays}
                  className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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
                  className="px-5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {LOAD_TYPES.map((item) => {
                const keysToCheck = [item.key, ...(item.legacyKeys || [])];
                const selected = keysToCheck.some((k) => preferredLoadTypes.includes(k));

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleLoadType(item.key)}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs transition-all text-left select-none cursor-pointer ${
                      selected
                        ? 'border-blue-600 bg-blue-50/90 text-blue-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    aria-pressed={selected}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
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
