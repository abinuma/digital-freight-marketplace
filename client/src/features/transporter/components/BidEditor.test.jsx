import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../transporter.api.js', () => ({
  getShipment: vi.fn(),
  submitBid: vi.fn(),
}));

vi.mock('../journeyPlan.api.js', () => ({
  listMyJourneyPlans: vi.fn(),
}));

import * as journeyPlanApi from '../journeyPlan.api.js';
import { BidEditor } from './BidEditor.jsx';

describe('BidEditor', () => {
  it('renders normal bid form when capacity is not exceeded', () => {
    const plansData = {
      journeyPlans: [
        {
          id: 'plan-active',
          originCity: 'Addis Ababa',
          destinationCity: 'Hawassa',
          status: 'ACTIVE',
          maxWeightKg: 10000,
          remainingWeightKg: 8000,
        },
      ],
    };
    journeyPlanApi.listMyJourneyPlans.mockReturnValue(plansData);

    const shipment = {
      id: 'ship-1',
      pickupLocation: 'Addis Ababa',
      deliveryLocation: 'Hawassa',
      weightKg: 2000,
    };

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['transporter', 'myJourneyPlansForBid'], plansData);

    const markup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(BidEditor, {
          shipmentId: 'ship-1',
          initialBid: null,
          shipment,
        })
      )
    );

    expect(markup).toContain('Make an offer');
    expect(markup).toContain('Your price (ETB)');
    expect(markup).toContain('Submit bid');
    expect(markup).not.toContain('Your journey plan capacity limit is reached for this route');
  });

  it('displays warning and disables bidding when all matching route plans are FULL', () => {
    const fullPlansData = {
      journeyPlans: [
        {
          id: 'plan-full',
          originCity: 'Addis Ababa',
          destinationCity: 'Hawassa',
          status: 'FULL',
          maxWeightKg: 10000,
          remainingWeightKg: 0,
        },
      ],
    };
    journeyPlanApi.listMyJourneyPlans.mockReturnValue(fullPlansData);

    const shipment = {
      id: 'ship-1',
      pickupLocation: 'Addis Ababa, Bole',
      deliveryLocation: 'Hawassa, City Center',
      weightKg: 2000,
    };

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['transporter', 'myJourneyPlansForBid'], fullPlansData);

    const markup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(BidEditor, {
          shipmentId: 'ship-1',
          initialBid: null,
          shipment,
        })
      )
    );

    // Warning message appears
    expect(markup).toContain('Your journey plan capacity limit is reached for this route');
    // Button is disabled
    expect(markup).toContain('disabled=""');
  });
});
