import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { NotificationBell } from './NotificationBell.jsx';

vi.mock('../auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', role: 'SHIPPER', name: 'Test Shipper' },
  }),
}));

vi.mock('./notifications.api.js', () => ({
  listNotifications: vi.fn().mockImplementation(({ unreadOnly }) => {
    return Promise.resolve({
      notifications: [],
      pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
    });
  }),
  markNotificationRead: vi.fn().mockResolvedValue({ id: 'notif-1', read: true }),
  markAllNotificationsRead: vi.fn().mockResolvedValue({ updated: 0 }),
}));

describe('NotificationBell', () => {
  it('does not render any badge when there are 0 unread messages (empty / nothing)', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const markup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(
          MemoryRouter,
          null,
          createElement(NotificationBell)
        )
      )
    );

    expect(markup).toContain('Notifications');
    expect(markup).toContain('svg');
    // When 0 unread messages, no badge span is rendered at the top of the ring icon
    expect(markup).not.toContain('bg-red-600');
    expect(markup).not.toContain('bg-slate-400');
  });

  it('renders red badge when unread messages exist', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Populate cache with unread items
    queryClient.setQueryData(['notifications', 'unread'], {
      notifications: [],
      pagination: { total: 3, page: 1, limit: 1, totalPages: 1 },
    });

    const markup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(
          MemoryRouter,
          null,
          createElement(NotificationBell)
        )
      )
    );

    expect(markup).toContain('bg-red-600');
    expect(markup).toContain('3');
  });
});
