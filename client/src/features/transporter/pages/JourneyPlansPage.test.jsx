import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../journeyPlan.api.js', () => ({
  createJourneyPlan: vi.fn(),
  listMyJourneyPlans: vi.fn(),
}));

import * as journeyPlanApi from '../journeyPlan.api.js';
import { JourneyPlansPage } from './JourneyPlansPage.jsx';

describe('JourneyPlansPage', () => {
  it('renders journey plans, capacity progress, and ready-to-go banner when full', () => {
    const data = {
      journeyPlans: [
        {
          id: 'plan-full',
          originCity: 'Addis Ababa',
          destinationCity: 'Hawassa',
          departureDate: '2026-10-25T08:00:00.000Z',
          fullLoadPrice: 35000,
          status: 'FULL',
          maxWeightKg: 10000,
          allocatedWeightKg: 10000,
          remainingWeightKg: 0,
          assignments: [
            {
              id: 'assign-1',
              shipment: {
                id: 'ship-1',
                goodsDescription: 'Factory Equipment',
                pickupLocation: 'Addis Ababa',
                deliveryLocation: 'Hawassa',
                weightKg: 10000,
              },
              bid: { price: 35000 },
            },
          ],
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    journeyPlanApi.listMyJourneyPlans.mockReturnValue(data);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['transporter', 'journeyPlans', '', 1], data);

    const markup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(MemoryRouter, null, createElement(JourneyPlansPage))
      )
    );

    // Route & status
    expect(markup).toContain('Addis Ababa');
    expect(markup).toContain('Hawassa');
    expect(markup).toContain('FULL');
    expect(markup).toContain('35,000');

    // Capacity
    expect(markup).toContain('Load Capacity');
    expect(markup).toContain('10,000 kg');

    // Assigned loads
    expect(markup).toContain('Factory Equipment');
    expect(markup).toContain('Assigned Loads (1)');

    // Full banner
    expect(markup).toContain('You are ready to collect the loads and go');
  });

  it('calculates remaining percentage based purely on mass for small loads', () => {
    const data = {
      journeyPlans: [
        {
          id: 'plan-small-half',
          originCity: 'Addis Ababa',
          destinationCity: 'Hawassa',
          departureDate: '2026-10-25T08:00:00.000Z',
          fullLoadPrice: 20000,
          status: 'ACTIVE',
          maxWeightKg: 5000,
          allocatedWeightKg: 2500,
          remainingWeightKg: 2500,
          assignments: [
            {
              id: 'assign-small',
              loadSize: 'SMALL_LOAD',
              weightKg: 2500,
              shipment: {
                id: 'ship-small',
                goodsDescription: 'Electronics Parts',
                loadSize: 'SMALL_LOAD',
                weightKg: 2500,
              },
            },
          ],
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    journeyPlanApi.listMyJourneyPlans.mockReturnValue(data);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['transporter', 'journeyPlans', '', 1], data);

    const markup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(MemoryRouter, null, createElement(JourneyPlansPage))
      )
    );

    expect(markup).toContain('2,500 kg');
    expect(markup).toContain('50% capacity remaining');
  });

  it('renders empty state when no journey plans are listed', () => {
    const emptyData = {
      journeyPlans: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
    journeyPlanApi.listMyJourneyPlans.mockReturnValue(emptyData);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['transporter', 'journeyPlans', '', 1], emptyData);

    const markup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(MemoryRouter, null, createElement(JourneyPlansPage))
      )
    );

    expect(markup).toContain('No journey plans listed');
    expect(markup).toContain('Create your first journey plan');
  });
});
