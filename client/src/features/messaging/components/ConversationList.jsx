import { Link } from 'react-router-dom';
import { Alert, Input, Skeleton } from '../../../shared/components/index.js';
import { dateLabel, initials, timeLabel } from '../messaging.formatters.js';

const emptyStateClass = 'flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-500';

export function ConversationList({
  filteredConversations,
  selectedId,
  lastMessage,
  search,
  onSearchChange,
  isPending,
  error,
  onSelect,
  hasSelectedConversation,
  dashboardPath,
  filter,
  onFilterChange,
  unreadCountByConversation,
}) {
  return (
    <aside
      className={`flex min-h-0 shrink-0 flex-col border-b border-slate-200 bg-white md:border-b-0 md:border-r ${
        hasSelectedConversation ? 'max-md:hidden' : 'w-full'
      } md:w-64 lg:w-72 xl:w-80`}
      aria-label="Conversations"
    >
      <div className="grid gap-3 border-b border-slate-200 p-4">
        <Link
          to={dashboardPath}
          className="group inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-blue-200 bg-white px-5 text-sm font-semibold text-slate-900 no-underline transition-colors hover:border-blue-700 hover:bg-blue-700 hover:text-white"
        >
          <img src="/chevron-left-solid-full.svg" alt="" aria-hidden="true" className="h-4 w-4 group-hover:brightness-0 group-hover:invert" />
          Back
        </Link>
        <h1 className="m-0 text-2xl font-semibold tracking-tight text-slate-900">Messages</h1>
        <Input
          type="search"
          aria-label="Search conversations"
          placeholder="Search people"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="min-h-10 rounded-full border-slate-300 bg-slate-50 px-4"
        />
        <div className="flex flex-wrap gap-2" aria-label="Filter conversations">
          {[
            ['all', 'All'],
            ['unread', 'Unread'],
            ['bids', 'With bids'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => onFilterChange(value)}
              className={`min-h-8 rounded-full border px-3 text-xs font-semibold transition-colors ${filter === value ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      {isPending ? (
        <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : filteredConversations.length ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const active = conversation.id === selectedId;
            const latest = active && lastMessage ? lastMessage : conversation.lastMessage;
            const counterpart = conversation.counterpart;
            const photo = counterpart?.profilePhoto || counterpart?.image;
            const name = counterpart?.name || 'User';
            return (
              <button
                type="button"
                key={conversation.id}
                className={`flex w-full items-center gap-2.5 border-0 border-b border-slate-100 px-2.5 py-2.5 text-left text-slate-800 transition-colors hover:bg-slate-50 lg:gap-3 lg:px-3 lg:py-3 ${
                  active ? 'bg-blue-50/80 font-medium' : 'bg-white'
                }`}
                onClick={() => onSelect(conversation)}
                aria-current={active ? 'true' : undefined}
              >
                <span className="flex h-8 w-8 min-w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xs font-bold text-blue-700 lg:h-9 lg:w-9 lg:min-w-9 xl:h-10 xl:w-10 xl:min-w-10 lg:text-sm">
                  {photo ? (
                    <img className="h-full w-full object-cover" src={photo} alt={`${name} profile photo`} />
                  ) : (
                    initials(name)
                  )}
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex items-center justify-between gap-1.5">
                    <strong className="truncate text-xs font-semibold text-slate-900 lg:text-sm">
                      {name}
                    </strong>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <time className="text-[11px] text-slate-400 lg:text-xs">
                        {latest ? timeLabel(latest.createdAt) : dateLabel(conversation.updatedAt)}
                      </time>
                      {unreadCountByConversation?.get(conversation.id) > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-700 px-1 text-[10px] font-bold text-white">
                          {unreadCountByConversation.get(conversation.id)}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="truncate text-[11px] text-slate-500 lg:text-xs">
                    {latest?.content || 'No messages yet'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={emptyStateClass}>
          <span className="text-2xl text-blue-700">✉</span>
          <strong className="text-sm">
            {search
              ? 'No conversations found'
              : filter === 'unread'
                ? 'No unread messages'
                : filter === 'bids'
                  ? 'No conversations with bids'
                  : 'No conversations yet'}
          </strong>
          <p className="m-0 max-w-xs text-xs">
            {search
              ? 'Try another name or shipment.'
              : filter === 'unread'
                ? 'New messages will appear here.'
                : filter === 'bids'
                  ? 'Conversations with shipment bids will appear here.'
                  : 'Chats will appear here when you have a shipment bid.'}
          </p>
        </div>
      )}
    </aside>
  );
}
