import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ConversationBidCard } from './ConversationBidCard.jsx';

describe('ConversationBidCard', () => {
  const sampleBid = {
    id: 'bid-123',
    shipmentId: 'shipment-456',
    price: 45000,
    pickupDate: '2026-10-20T08:00:00.000Z',
    status: 'PENDING',
    message: 'Can pick up first thing in the morning',
    shipment: {
      id: 'shipment-456',
      goodsDescription: 'Industrial Machine Parts',
      pickupLocation: 'Addis Ababa',
      deliveryLocation: 'Hawassa',
      pickupDate: '2026-10-20T00:00:00.000Z',
      weightKg: 3500,
      status: 'PUBLISHED',
    },
  };

  const sampleProfile = {
    name: 'Abebe Logistics',
    profilePhoto: null,
    averageRating: 4.8,
    reviewCount: 15,
  };

  const sampleVehicle = {
    type: 'Heavy Truck',
    capacityTons: 10,
  };

  it('renders transporter profile, shipment details, and action buttons in one single card', () => {
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(ConversationBidCard, {
          bid: sampleBid,
          role: 'SHIPPER',
          profile: sampleProfile,
          vehicle: sampleVehicle,
          counterpartName: 'Abebe Logistics',
          accepting: false,
          onAcceptBid: () => {},
        })
      )
    );

    // Profile details
    expect(markup).toContain('Abebe Logistics');
    expect(markup).toContain('4.8');
    expect(markup).toContain('Heavy Truck (10t)');

    // Shipment details
    expect(markup).toContain('Industrial Machine Parts');
    expect(markup).toContain('Addis Ababa');
    expect(markup).toContain('Hawassa');
    expect(markup).toContain('ETB 45,000');
    expect(markup).toContain('PENDING');
    expect(markup).toContain('3500 kg');
    expect(markup).toContain('Can pick up first thing in the morning');

    // Action buttons
    expect(markup).toContain('Accept Bid');
    expect(markup).toContain('Report Issue');
  });

  it('displays accepted state when bid is accepted', () => {
    const acceptedBid = { ...sampleBid, status: 'ACCEPTED' };
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(ConversationBidCard, {
          bid: acceptedBid,
          role: 'SHIPPER',
          profile: sampleProfile,
          vehicle: sampleVehicle,
          counterpartName: 'Abebe Logistics',
          accepting: false,
          onAcceptBid: () => {},
        })
      )
    );

    expect(markup).toContain('Bid Accepted');
    expect(markup).toContain('Report Issue');
  });
});
