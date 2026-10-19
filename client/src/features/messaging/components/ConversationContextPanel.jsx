import { Link } from 'react-router-dom';
import { Alert, Card, Skeleton } from '../../../shared/components/index.js';
import { ConversationBidCard } from './ConversationBidCard.jsx';

export function ConversationContextPanel({
  conversation,
  role,
  bids = [],
  bidsPending,
  bidsError,
  profile,
  profilePending,
  vehicle,
  accepting,
  actionError,
  onAcceptBid,
  onClose,
  className = '',
  isDrawer = false,
}) {
  const counterpart = conversation?.counterpart;
  const counterpartName = profile?.name || counterpart?.name || 'User';

  return (
    <aside
      className={`flex flex-col gap-4 overflow-y-auto ${
        isDrawer
          ? 'h-full p-4 sm:p-5'
          : 'border-l border-slate-200 bg-slate-50/70 p-4'
      } ${className}`.trim()}
      aria-label="Conversation bids"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-base font-bold text-slate-900">
              {`Bids with ${counterpartName}`}
            </h2>
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-100 px-1.5 text-xs font-bold text-blue-800">
              {bids.length}
            </span>
          </div>
          {role === 'SHIPPER' && profile?.averageRating > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] text-amber-800">
              <span className="tracking-wide text-amber-500" aria-hidden="true">★★★★★</span>
              <strong>{Number(profile.averageRating).toFixed(1)}</strong>
              <span>· {profile.reviewCount || 0} reviews</span>
            </div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
            aria-label="Close bids panel"
          >
            ×
          </button>
        )}
      </div>

      {actionError && (
        <Alert tone="danger" title="Could not accept bid">
          {actionError}
        </Alert>
      )}

      {/* Loading state */}
      {bidsPending || profilePending ? (
        <div className="grid gap-3">
          <Card className="grid gap-3 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 grid gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-16" />
            <Skeleton className="h-9" />
          </Card>
        </div>
      ) : bidsError ? (
        <Alert tone="danger" title="Bid details unavailable">
          {bidsError}
        </Alert>
      ) : !bids.length ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-500">
          <span className="text-2xl text-slate-400" aria-hidden="true">
            ◇
          </span>
          <p className="m-0 text-sm font-semibold text-slate-700">No bids in this conversation</p>
          <p className="m-0 text-xs text-slate-500">
            Bids submitted between you and this party will appear here.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {bids.map((bid) => (
            <ConversationBidCard
              key={bid.id}
              bid={bid}
              role={role}
              profile={profile}
              vehicle={vehicle}
              counterpartName={counterpartName}
              conversation={conversation}
              accepting={accepting}
              onAcceptBid={onAcceptBid}
            />
          ))}
        </div>
      )}

      {/* Quick navigation link */}
      {role === 'TRANSPORTER' && (
        <div className="mt-auto border-t border-slate-200 pt-3 text-center">
          <Link
            to="/transporter/bids"
            className="text-xs font-semibold text-blue-600 no-underline hover:text-blue-800 hover:underline"
          >
            All bids
          </Link>
        </div>
      )}
    </aside>
  );
}
