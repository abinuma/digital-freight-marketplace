import { initials } from '../messaging.formatters.js';

export function ConversationHeader({
  conversation,
  roleLabel,
  bidsCount = 0,
  onOpenBids,
  onBack,
}) {
  return (
    <header className="flex min-h-14 items-center justify-between gap-2 border-b border-slate-200 py-2 sm:min-h-16">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700 hover:bg-slate-50 md:hidden"
            aria-label="Back to conversations list"
          >
            ←
          </button>
        )}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xs font-bold text-blue-700 sm:h-10 sm:w-10 sm:text-sm">
          {conversation.counterpart.profilePhoto ? (
            <img className="h-full w-full object-cover" src={conversation.counterpart.profilePhoto} alt="" />
          ) : (
            initials(conversation.counterpart.name)
          )}
        </span>
        <div className="grid min-w-0 gap-0.5">
          <strong className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            {conversation.counterpart.name}
          </strong>
          <small className="truncate text-xs text-slate-500">
            {roleLabel} · Private chat
          </small>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenBids}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
          aria-label={`View ${bidsCount} bids for this conversation`}
          title="Open bids listing"
        >
          <span aria-hidden="true">🏷️</span>
          <span className="hidden xs:inline sm:inline">Bids</span>
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-700 px-1 text-[11px] font-bold text-white">
            {bidsCount}
          </span>
        </button>
      </div>
    </header>
  );
}
