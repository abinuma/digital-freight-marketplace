import { useEffect, useRef, useState } from "react";
import { SORTED_CITIES } from "../../../shared/constants/locations.js";

export function ShipmentCityPicker({ id, label, value, excludeCity, disabled = false, error, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => setQuery(value || ""), [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery(value || "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const normalizedQuery = query.trim().toLowerCase();
  const options = SORTED_CITIES.filter(({ city }) =>
    city.toLowerCase() !== (excludeCity || "").trim().toLowerCase()
      && (!normalizedQuery || city.toLowerCase().includes(normalizedQuery)),
  );

  function updateQuery(next) {
    setQuery(next);
    setIsOpen(true);
    onChange("");
  }

  return (
    <div className={"relative " + (disabled ? "opacity-70" : "")} ref={containerRef}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen && !disabled}
        aria-controls={`${id}-options`}
        aria-invalid={Boolean(error)}
        autoComplete="off"
        required
        disabled={disabled}
        value={query}
        placeholder={`Type or choose a ${label.toLowerCase()} city`}
        className={`ui-input min-h-10 w-full rounded-lg border bg-white px-3 py-2 pr-10 text-slate-800 placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 ${error ? "border-red-600" : "border-slate-300"}`}
        onChange={(event) => updateQuery(event.target.value)}
        onFocus={() => !disabled && setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
          if (event.key === "Enter" && isOpen && options.length) {
            event.preventDefault();
            setQuery(options[0].city);
            onChange(options[0].city);
            setIsOpen(false);
          }
          if (event.key === "ArrowDown") setIsOpen(true);
        }}
      />
      <button
        type="button"
        aria-label={`Toggle ${label.toLowerCase()} city list`}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className="absolute inset-y-0 right-2 border-0 bg-transparent px-1 text-slate-500"
      >▼</button>
      {isOpen && !disabled && (
        <ul id={`${id}-options`} role="listbox" className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-sm text-slate-800 shadow-lg">
          {options.length ? options.map(({ id: cityId, city }) => (
            <li key={cityId} role="option" aria-selected={city === value}>
              <button type="button" className="w-full border-0 bg-transparent px-3 py-2 text-left hover:bg-blue-50" onClick={() => { setQuery(city); onChange(city); setIsOpen(false); }}>
                {city}
              </button>
            </li>
          )) : <li className="px-3 py-2 text-slate-500">No matching cities found</li>}
        </ul>
      )}
    </div>
  );
}
