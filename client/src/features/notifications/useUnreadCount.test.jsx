import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { ShipperLayout } from '../shipper/ShipperLayout.jsx';
import { TransporterLayout } from '../transporter/TransporterLayout.jsx';

vi.mock('../auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', role: 'SHIPPER', name: 'Test Shipper' },
    logout: vi.fn(),
  }),
}));

vi.mock('./notifications.api.js', () => ({
  listNotifications: vi.fn().mockImplementation(() => {
    return Promise.resolve({
      notifications: [],
      pagination: { total: 0, page: 1, limit: 1, totalPages: 0 },
    });
  }),
}));

describe('Sidebar Messages Unread Badge', () => {
  it('does not render any bell icon in ShipperLayout or TransporterLayout', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const shipperMarkup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(MemoryRouter, null, createElement(ShipperLayout))
      )
    );

    const transporterMarkup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(MemoryRouter, null, createElement(TransporterLayout))
      )
    );

    // Bell icon and notification dropdown are completely removed
    expect(shipperMarkup).not.toContain('Notifications');
    expect(shipperMarkup).not.toContain('M18 8a6 6 0 0 0-12 0');
    expect(transporterMarkup).not.toContain('Notifications');
    expect(transporterMarkup).not.toContain('M18 8a6 6 0 0 0-12 0');
  });

  it('renders red badge next to Messages when unread notifications exist for Shipper', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(['notifications', 'unread'], {
      notifications: [],
      pagination: { total: 5, page: 1, limit: 1, totalPages: 5 },
    });

    const markup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(MemoryRouter, null, createElement(ShipperLayout))
      )
    );

    expect(markup).toContain('Messages');
    expect(markup).toContain('bg-red-600');
    expect(markup).toContain('5');
  });

  it('renders red badge next to Messages when unread notifications exist for Transporter', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(['notifications', 'unread'], {
      notifications: [],
      pagination: { total: 12, page: 1, limit: 1, totalPages: 12 },
    });

    const markup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(MemoryRouter, null, createElement(TransporterLayout))
      )
    );

    expect(markup).toContain('Messages');
    expect(markup).toContain('bg-red-600');
    expect(markup).toContain('12');
  });

  it('formats counts above 99 as 99+ next to Messages', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(['notifications', 'unread'], {
      notifications: [],
      pagination: { total: 105, page: 1, limit: 1, totalPages: 105 },
    });

    const markup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(MemoryRouter, null, createElement(ShipperLayout))
      )
    );

    expect(markup).toContain('99+');
  });
});
