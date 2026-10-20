import { useQuery } from '@tanstack/react-query';
import { Alert, Skeleton } from '../../../shared/components/index.js';
import { getPublicProfile, listUserReviews } from '../profile.api.js';

const reviewDate = (date) => new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date(date));

export function UserReviews({ userId, averageRating, reviewCount }) {
  const profileQuery = useQuery({
    queryKey: ['users', 'publicProfile', userId],
    queryFn: () => getPublicProfile(userId),
    enabled: Boolean(userId) && (averageRating === undefined || reviewCount === undefined),
  });
  const query = useQuery({
    queryKey: ['users', userId, 'reviews'],
    queryFn: () => listUserReviews(userId),
    enabled: Boolean(userId),
  });
  const reviews = query.data?.reviews || [];
  const resolvedAverage = averageRating ?? profileQuery.data?.averageRating;
  const resolvedCount = reviewCount ?? profileQuery.data?.reviewCount;

  return (
    <section className="grid gap-2 border-t border-slate-200 pt-3" aria-label="User ratings and reviews">
      <div className="flex items-center justify-between gap-3">
        <h4 className="m-0 text-sm font-semibold text-slate-900">Ratings & reviews</h4>
        {resolvedCount > 0 && resolvedAverage != null ? (
          <span className="text-xs font-medium text-slate-600" aria-label={`${Number(resolvedAverage).toFixed(1)} out of 5, ${resolvedCount} reviews`}>
            <span className="text-amber-500" aria-hidden="true">★</span> {Number(resolvedAverage).toFixed(1)} · {resolvedCount} {resolvedCount === 1 ? 'review' : 'reviews'}
          </span>
        ) : resolvedCount === 0 ? <span className="text-xs text-slate-500">No ratings yet</span> : profileQuery.isError ? <span className="text-xs text-slate-500">Rating summary unavailable</span> : <Skeleton className="h-4 w-24" />}
      </div>
      {query.isPending ? (
        <div className="grid gap-2"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
      ) : query.isError ? (
        <Alert tone="danger" title="Reviews unavailable">{query.error.message}</Alert>
      ) : reviews.length ? (
        <div className="grid gap-2">
          {reviews.map((review) => (
            <article className="grid gap-1 rounded-lg bg-slate-50 p-3" key={review.id}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <strong className="truncate text-slate-800">{review.reviewer?.name || 'Marketplace member'}</strong>
                <time className="shrink-0 text-slate-500" dateTime={review.createdAt}>{reviewDate(review.createdAt)}</time>
              </div>
              <span className="text-sm" aria-label={`${review.rating} out of 5 stars`}>
                <span className="text-amber-500">{'★'.repeat(review.rating)}</span><span className="text-slate-300">{'☆'.repeat(5 - review.rating)}</span>
              </span>
              {review.comment && <p className="m-0 whitespace-pre-wrap text-sm text-slate-600">{review.comment}</p>}
            </article>
          ))}
          {query.data.pagination.total > reviews.length && (
            <p className="m-0 text-xs text-slate-500">Showing the 5 most recent reviews.</p>
          )}
        </div>
      ) : <p className="m-0 text-xs text-slate-500">No written reviews yet.</p>}
    </section>
  );
}
