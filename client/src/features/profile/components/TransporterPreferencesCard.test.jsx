import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TransporterPreferencesCard } from './TransporterPreferencesCard.jsx';

describe('TransporterPreferencesCard', () => {
  it('renders all Mon-Sun day options and preferred load types', () => {
    const markup = renderToStaticMarkup(
      createElement(TransporterPreferencesCard, {
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        preferredLoadTypes: ['Construction', 'Beverage'],
        busy: false,
        onDaysChange: () => {},
        onLoadTypesChange: () => {},
        onSave: () => {},
      })
    );

    // Days of week
    expect(markup).toContain('Monday');
    expect(markup).toContain('Tuesday');
    expect(markup).toContain('Wednesday');
    expect(markup).toContain('Thursday');
    expect(markup).toContain('Friday');
    expect(markup).toContain('Saturday');
    expect(markup).toContain('Sunday');

    // Quick selection helpers
    expect(markup).toContain('All week');
    expect(markup).toContain('Weekdays');
    expect(markup).toContain('Clear');

    // Load types
    expect(markup).toContain('Construction');
    expect(markup).toContain('Timber');
    expect(markup).toContain('Beverage');
    expect(markup).toContain('Bottled water');
    expect(markup).toContain('Agriculture');

    // Save button
    expect(markup).toContain('Save Preferences');
  });
});
