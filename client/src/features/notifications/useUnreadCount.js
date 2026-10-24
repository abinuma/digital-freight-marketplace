import { useQuery } from '@tanstack/react-query';
import { listNotifications } from './notifications.api.js';

export function useUnreadCount() {
  const unread = useQuery({
    queryKey: ['notifications', 'unread-messages'],
    queryFn: () => listNotifications({ limit: 1, unreadOnly: true, type: 'NEW_MESSAGE' }),
    refetchInterval: 15_000,
  });

  return typeof unread.data?.pagination?.total === 'number'
    ? unread.data.pagination.total
    : 0;
}
