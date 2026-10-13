import { initials } from '../messaging.formatters.js';

const avatarClass = 'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-bold text-blue-700';

export function ConversationHeader({ conversation, roleLabel }) {
  return (
    <>
      <header className="flex min-h-16 items-center gap-3 border-b border-slate-200">
        <span className={avatarClass}>
          {conversation.counterpart.profilePhoto
            ? <img className="h-full w-full object-cover" src={conversation.counterpart.profilePhoto} alt="" />
            : initials(conversation.counterpart.name)}
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <strong className="truncate">{conversation.counterpart.name}</strong>
          <small className="text-slate-500">{roleLabel} · Private conversation</small>
        </div>
      </header>
    </>
  );
}
