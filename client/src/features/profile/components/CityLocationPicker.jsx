import { useEffect, useRef, useState } from 'react';
import { SORTED_CITIES } from '../../../shared/constants/locations.js';

export function CityLocationPicker({
  label = 'City',
  id = 'profile-city',
  placeholder = 'Type or select a city...',
  city,
  excludeCity,
  zone,
  region,
  error,
  required = false,
  disabled = false,
  className = 'sm:col-span-2',
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(city || '');
  const containerRef = useRef(null);

  // Sync local query when city prop updates from outside
  useEffect(() => {
    setQuery(city || '');
  }, [city]);

  // Filter cities matching typed query
  const filteredCities = query.trim()
    ? SORTED_CITIES.filter((item) =>
        item.displayName.toLowerCase().includes(query.trim().toLowerCase())
      )
    : SORTED_CITIES;
  const availableCities = excludeCity
    ? filteredCities.filter((item) => item.city.toLowerCase() !== excludeCity.trim().toLowerCase())
    : filteredCities;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        if (city) {
          setQuery(city);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [city]);

  function handleSelect(item) {
    setQuery(item.city);
    setIsOpen(false);
    onChange({
      city: item.city,
      zone: item.zone,
      region: item.region,
      location: `${item.city}, ${item.zone}, ${item.region}`,
    });
  }

  function handleInputChange(event) {
    const value = event.target.value;
    setQuery(value);
    setIsOpen(true);

    if (!value.trim()) {
      onChange({ city: '', zone: '', region: '', location: '' });
      return;
    }

    // Auto-match if user types an exact city name
    const exact = SORTED_CITIES.find(
      (c) => c.city.toLowerCase() === value.trim().toLowerCase()
    );
    if (exact) {
      onChange({
        city: exact.city,
        zone: exact.zone,
        region: exact.region,
        location: `${exact.city}, ${exact.zone}, ${exact.region}`,
      });
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'ArrowDown' && !isOpen) {
      setIsOpen(true);
    }
  }

  function handleClear() {
    setQuery('');
    onChange({ city: '', zone: '', region: '', location: '' });
    setIsOpen(false);
  }

  return (
    <div className={`relative grid content-start gap-1.5 ${className}`} ref={containerRef}>
      <label className="cursor-default text-sm font-semibold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name="city"
          type="text"
          autoComplete="off"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className={`flex h-10 w-full rounded-lg border bg-white px-3 py-2 pr-14 text-sm text-slate-800 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${error ? 'border-red-600 focus:border-red-600 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}`}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-expanded={isOpen}
          role="combobox"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 gap-1.5">
          {query && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0.5 border-0 bg-transparent cursor-pointer text-xs disabled:cursor-not-allowed"
              aria-label="Clear city"
            >
              <img src="/xmark-solid-full.svg" alt="" aria-hidden="true" className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            className="text-slate-400 hover:text-slate-600 p-0.5 border-0 bg-transparent cursor-pointer text-xs disabled:cursor-not-allowed"
            aria-label="Toggle city list"
          >
            <img src="/angle-down-solid-full.svg" alt="" aria-hidden="true" className="h-3 w-3" />
          </button>
        </div>
        {isOpen && !disabled && (
          <ul
            className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg list-none p-0 m-0 text-sm text-slate-800"
            role="listbox"
          >
            {availableCities.length > 0 ? (
              availableCities.map((item) => {
                const isSelected = item.city === city && item.zone === zone && (!region || item.region === region);
                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    className={`cursor-pointer px-3 py-2 hover:bg-blue-50 hover:text-blue-900 transition-colors ${
                      isSelected ? 'bg-blue-50 font-semibold text-blue-900' : ''
                    }`}
                  >
                    {item.displayName}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-2 text-slate-400 italic cursor-default">
                No matching cities found
              </li>
            )}
          </ul>
        )}
      </div>

      {error && (
        <span className="text-sm text-red-700" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
