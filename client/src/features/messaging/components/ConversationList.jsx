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
}) {
  return (
    <aside
      className={`flex min-h-0 shrink-0 flex-col border-b border-slate-200 bg-white md:border-b-0 md:border-r ${
        hasSelectedConversation ? 'max-md:hidden' : 'w-full'
      } md:w-60 lg:w-64 xl:w-72 2xl:w-80`}
      aria-label="Conversations"
    >
      <div className="border-b border-slate-200 p-2.5 lg:p-3">
        <Input
          type="search"
          aria-label="Search conversations"
          placeholder="Search conversations…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
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
                  {conversation.counterpart.profilePhoto ? (
                    <img className="h-full w-full object-cover" src={conversation.counterpart.profilePhoto} alt="" />
                  ) : (
                    initials(conversation.counterpart.name)
                  )}
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex items-center justify-between gap-1.5">
                    <strong className="truncate text-xs font-semibold text-slate-900 lg:text-sm">
                      {conversation.counterpart.name}
                    </strong>
                    <time className="shrink-0 text-[11px] text-slate-400 lg:text-xs">
                      {latest ? timeLabel(latest.createdAt) : dateLabel(conversation.updatedAt)}
                    </time>
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
          <strong className="text-sm">{search ? 'No conversations found' : 'No conversations yet'}</strong>
          <p className="m-0 max-w-xs text-xs">
            {search ? 'Try another name or shipment.' : 'Chats will appear here when you have a shipment bid.'}
          </p>
        </div>
      )}
    </aside>
  );
}
