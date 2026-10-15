import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CityLocationPicker } from './CityLocationPicker.jsx';
import { findLocationByCity, ALL_CITIES, SORTED_CITIES } from '../../../shared/constants/locations.js';

describe('CityLocationPicker & Location Constants', () => {
  it('contains expected regions, zones, and cities in dataset', () => {
    expect(ALL_CITIES.length).toBeGreaterThan(50);

    const addis = findLocationByCity('Addis Ababa');
    expect(addis).toBeDefined();
    expect(addis.region).toBe('Addis Ababa');
    expect(addis.zone).toBe('Addis Ababa');

    const adama = findLocationByCity('Adama');
    expect(adama).toBeDefined();
    expect(adama.region).toBe('Oromia');
    expect(adama.zone).toBe('East Shewa Zone');

    const semera = findLocationByCity('Semera-Logia');
    expect(semera).toBeDefined();
    expect(semera.region).toBe('Afar');

    const hawassa = findLocationByCity('Hawassa');
    expect(hawassa).toBeDefined();
    expect(hawassa.region).toBe('Sidama');

    const direDawa = findLocationByCity('Dire Dawa');
    expect(direDawa).toBeDefined();
    expect(direDawa.region).toBe('Oromia');
    expect(direDawa.zone).toBe('East Hararghe Zone');
  });

  it('sorts cities strictly alphabetically', () => {
    expect(SORTED_CITIES.length).toBe(ALL_CITIES.length);
    for (let i = 1; i < SORTED_CITIES.length; i += 1) {
      expect(SORTED_CITIES[i].city.localeCompare(SORTED_CITIES[i - 1].city)).toBeGreaterThanOrEqual(0);
    }
  });

  it('renders searchable city input without showing Region or Zone fields', () => {
    const markup = renderToStaticMarkup(
      createElement(CityLocationPicker, {
        city: 'Adama',
        zone: 'East Shewa Zone',
        region: 'Oromia',
        error: '',
        onChange: () => {},
      })
    );

    // City input is rendered with the selected city
    expect(markup).toContain('City');
    expect(markup).toContain('value="Adama"');
    expect(markup).toContain('placeholder="Type or select a city..."');

    // Region and Zone auto-filled fields must NEVER be shown to the user
    expect(markup).not.toContain('Region (Auto-filled)');
    expect(markup).not.toContain('Zone (Auto-filled)');
  });
});
