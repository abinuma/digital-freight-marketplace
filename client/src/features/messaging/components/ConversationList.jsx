import { Alert, Input, Skeleton } from '../../../shared/components/index.js';
import { dateLabel, initials, timeLabel } from '../messaging.formatters.js';

const emptyStateClass = 'flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-500';
const avatarClass = 'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-bold text-blue-700';

export function ConversationList({ filteredConversations, selectedId, lastMessage, search, onSearchChange, isPending, error, onSelect }) {
  return (
    <aside className="flex h-64 shrink-0 flex-col border-b border-slate-200 md:h-auto md:w-80 md:border-b-0 md:border-r" aria-label="Conversations">
      <div className="border-b border-slate-200 p-3">
        <Input type="search" aria-label="Search conversations" placeholder="Search conversations…" value={search} onChange={(event) => onSearchChange(event.target.value)} />
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      {isPending ? (
        <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4"><Skeleton /><Skeleton /><Skeleton /></div>
      ) : filteredConversations.length ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const active = conversation.id === selectedId;
            const latest = active && lastMessage ? lastMessage : conversation.lastMessage;
            return (
              <button
                type="button"
                key={conversation.id}
                className={`flex min-h-20 w-full items-center gap-3 border-0 border-b border-slate-100 px-3 py-3 text-left text-slate-800 transition-colors hover:bg-slate-50 ${active ? 'bg-blue-50' : 'bg-white'}`}
                onClick={() => onSelect(conversation)}
                aria-current={active ? 'true' : undefined}
              >
                <span className={avatarClass}>
                  {conversation.counterpart.profilePhoto
                    ? <img className="h-full w-full object-cover" src={conversation.counterpart.profilePhoto} alt="" />
                    : initials(conversation.counterpart.name)}
                </span>
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className="flex items-center justify-between gap-2">
                    <strong className="truncate text-sm">{conversation.counterpart.name}</strong>
                    <time className="shrink-0 text-xs text-slate-400">{latest ? timeLabel(latest.createdAt) : dateLabel(conversation.updatedAt)}</time>
                  </span>
                  <span className="truncate text-xs text-slate-500">{latest?.content || 'No messages yet'}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={emptyStateClass}>
          <span className="text-2xl text-blue-700">✉</span>
          <strong>{search ? 'No conversations found' : 'No conversations yet'}</strong>
          <p className="m-0 max-w-sm text-sm">{search ? 'Try another name or shipment.' : 'Chats will appear here when you have a shipment bid.'}</p>
        </div>
      )}
    </aside>
  );
}
