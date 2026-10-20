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
    createdAt: '2026-10-19T10:00:00.000Z',
    shipment: {
      id: 'shipment-456',
      goodsDescription: 'Industrial Machine Parts',
      pickupLocation: 'Addis Ababa',
      deliveryLocation: 'Hawassa',
      pickupDate: '2026-10-20T00:00:00.000Z',
      loadSize: 'FULL_LOAD',
      status: 'PUBLISHED',
    },
  };

  const sampleVehicle = {
    type: 'Heavy Truck',
    loadSize: 'FULL_LOAD',
  };

  it('renders shipment details, price, load size, and accept action button for shipper', () => {
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(ConversationBidCard, {
          bid: sampleBid,
          role: 'SHIPPER',
          vehicle: sampleVehicle,
          accepting: false,
          onAcceptBid: () => {},
        })
      )
    );

    // Shipment details
    expect(markup).toContain('Industrial Machine Parts');
    expect(markup).toContain('Full load');
    expect(markup).toContain('Addis Ababa');
    expect(markup).toContain('Hawassa');
    expect(markup).toContain('ETB 45,000');
    expect(markup).toContain('pending');
    expect(markup).toContain('Heavy Truck (Full load)');

    // Action button
    expect(markup).toContain('Accept offer');
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
          vehicle: sampleVehicle,
          accepting: false,
          onAcceptBid: () => {},
        })
      )
    );

    expect(markup).toContain('Offer accepted');
  });

  it('displays transporter status message when role is TRANSPORTER', () => {
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(ConversationBidCard, {
          bid: sampleBid,
          role: 'TRANSPORTER',
          vehicle: sampleVehicle,
          accepting: false,
          onAcceptBid: () => {},
        })
      )
    );

    expect(markup).toContain('Your bid is');
    expect(markup).toContain('pending');
  });

  it('displays legacy vehicle capacity if loadSize is not provided', () => {
    const legacyVehicle = { type: 'Sinotruk', capacityTons: 40, volumeM3: 65 };
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(ConversationBidCard, {
          bid: sampleBid,
          role: 'SHIPPER',
          vehicle: legacyVehicle,
          accepting: false,
          onAcceptBid: () => {},
        })
      )
    );

    expect(markup).toContain('Sinotruk (40t · 65m³)');
  });

  it('displays small load details with mass and volume and driver vehicle mass in kg', () => {
    const smallLoadBid = {
      ...sampleBid,
      shipment: {
        ...sampleBid.shipment,
        loadSize: 'SMALL_LOAD',
        weightKg: 150,
        volumeM3: 0.8,
      },
    };
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(ConversationBidCard, {
          bid: smallLoadBid,
          role: 'SHIPPER',
          vehicle: { type: 'Pickup', capacityKg: 1000, volumeM3: 5 },
          accepting: false,
          onAcceptBid: () => {},
        })
      )
    );

    expect(markup).toContain('Small load (150 kg · 0.8 m³)');
    expect(markup).toContain('Pickup (1,000 kg · 5m³)');
  });
});
