import { Link } from 'react-router-dom';
import { Alert, Skeleton } from '../../../shared/components/index.js';
import { dateLabel, timeLabel } from '../messaging.formatters.js';

const emptyStateClass = 'flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-500';

function renderMessageContent(content, isOwn) {
  const urlRegex = /(https?:\/\/[^\s]+|\/(?:transporter|shipper)\/shipments\/[a-zA-Z0-9-]+)/g;
  const parts = content.split(urlRegex);
  if (parts.length === 1) return content;
  return parts.map((part, index) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline font-semibold hover:opacity-80 ${isOwn ? 'text-white' : 'text-blue-700'}`}
        >
          {part}
        </a>
      );
    }
    if (part.startsWith('/transporter/shipments/') || part.startsWith('/shipper/shipments/')) {
      return (
        <Link
          key={index}
          to={part}
          className={`underline font-semibold hover:opacity-80 ${isOwn ? 'text-white' : 'text-blue-700'}`}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

export function MessageList({ messages, userId, isPending, error, listRef }) {
  return (
    <>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4" ref={listRef}>
        {isPending ? (
          <div className="grid content-start gap-4 p-4"><Skeleton /><Skeleton /></div>
        ) : messages.length ? messages.map((message, index) => {
          const previousDate = index ? new Date(messages[index - 1].createdAt).toDateString() : null;
          const currentDate = new Date(message.createdAt).toDateString();
          const isOwn = message.senderId === userId;
          return (
            <div key={message.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              {previousDate !== currentDate && <div className="my-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-400">{dateLabel(message.createdAt)}</div>}
              <article className={`grid w-fit max-w-sm gap-1 rounded-xl p-3 shadow-sm ${isOwn ? 'rounded-br-sm bg-blue-700 text-white' : 'rounded-bl-sm border border-slate-100 bg-white text-slate-800'}`}>
                <p className="m-0 whitespace-pre-wrap break-words text-sm leading-6">{renderMessageContent(message.content, isOwn)}</p>
                <time className={`justify-self-end text-xs ${isOwn ? 'text-blue-200' : 'text-slate-400'}`}>{timeLabel(message.createdAt)}</time>
              </article>
            </div>
          );
        }) : (
          <div className={emptyStateClass}>
            <span className="text-2xl text-blue-700">✉</span>
            <strong>No messages yet</strong>
            <p className="m-0 max-w-sm text-sm">Start the conversation.</p>
          </div>
        )}
      </div>
    </>
  );
}
