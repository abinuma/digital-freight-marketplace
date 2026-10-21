import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VehicleDetailsCard } from './VehicleDetailsCard.jsx';

describe('VehicleDetailsCard', () => {
  const baseVehicle = {
    type: 'Isuzu',
    capacityKg: '5000',
    plateNumber: 'KBZ 123A',
    photo: '',
  };

  it('renders default truck placeholder and upload prompt when no photo is set', () => {
    const markup = renderToStaticMarkup(
      createElement(VehicleDetailsCard, {
        vehicle: baseVehicle,
        errors: {},
        hasVehicle: true,
        isLoading: false,
        loadError: '',
        busy: false,
        onChange: () => {},
        onSave: () => {},
      })
    );

    expect(markup).toContain('Vehicle Details');
    expect(markup).toContain('No vehicle photo');
    expect(markup).toContain('Upload Photo');
    expect(markup).toContain('KBZ 123A');
    expect(markup).toContain('Maximum Load (kg)');
    expect(markup).toContain('id="vehicle-photo"');
  });

  it('renders the vehicle photo image and change photo action when photo exists', () => {
    const markup = renderToStaticMarkup(
      createElement(VehicleDetailsCard, {
        vehicle: {
          ...baseVehicle,
          photo: 'https://cdn.example.test/isuzu-truck.jpg',
        },
        errors: {},
        hasVehicle: true,
        isLoading: false,
        loadError: '',
        busy: false,
        onChange: () => {},
        onSave: () => {},
      })
    );

    expect(markup).toContain('src="https://cdn.example.test/isuzu-truck.jpg"');
    expect(markup).toContain('Change Photo');
  });

  it('renders photo file name and upload photo button when a file is selected', () => {
    const markup = renderToStaticMarkup(
      createElement(VehicleDetailsCard, {
        vehicle: baseVehicle,
        errors: {},
        hasVehicle: true,
        isLoading: false,
        loadError: '',
        busy: false,
        onChange: () => {},
        onSave: () => {},
        photoFile: { name: 'my-truck.jpg' },
        photoPreview: 'blob:http://localhost/blob-123',
        photoBusy: false,
        onChoosePhoto: () => {},
        onUploadPhoto: () => {},
        onClearPhoto: () => {},
      })
    );

    expect(markup).toContain('src="blob:http://localhost/blob-123"');
    expect(markup).toContain('my-truck.jpg');
    expect(markup).toContain('Upload Photo');
  });
});
