import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Input, Skeleton, Spinner, Textarea } from '../../shared/components/index.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { getConversationMessages, listConversations, sendConversationMessage } from './messaging.api.js';

const conversationKey = ['messages', 'conversations'];
const noConversations = [];
const dateLabel = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
const timeLabel = (value) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}

export function MessagesPage() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [content, setContent] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(null);

  const conversationsQuery = useQuery({ queryKey: conversationKey, queryFn: listConversations, refetchInterval: 15_000 });
  const conversations = conversationsQuery.data || noConversations;
  const requestedConversation = searchParams.get('conversationId');
  const shipmentId = searchParams.get('shipmentId');
  const transporterId = searchParams.get('transporterId');

  const requested = requestedConversation && conversations.find((conversation) => conversation.id === requestedConversation);
  const fromShipment = shipmentId && conversations.find((conversation) => conversation.shipmentId === shipmentId && (!transporterId || conversation.transporterId === transporterId));
  const selected = requested || fromShipment || conversations[0] || null;
  const selectedId = selected?.id || '';

  useEffect(() => {
    if (selected && selected.id !== requestedConversation) setSearchParams({ conversationId: selected.id }, { replace: true });
  }, [requestedConversation, selected, setSearchParams]);

  const messagesQuery = useQuery({
    queryKey: ['messages', 'conversation', selectedId],
    queryFn: () => getConversationMessages(selectedId),
    enabled: Boolean(selectedId),
    refetchInterval: 10_000,
  });
  const messages = useMemo(() => messagesQuery.data || [], [messagesQuery.data]);
  const filteredConversations = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) => `${conversation.counterpart.name} ${conversation.shipment.goodsDescription} ${conversation.shipment.pickupLocation} ${conversation.shipment.deliveryLocation}`.toLocaleLowerCase().includes(needle));
  }, [conversations, search]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, selectedId]);

  function selectConversation(conversation) {
    setSearchParams({ conversationId: conversation.id });
    setContent('');
    setSendError('');
  }

  async function sendMessage(event) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!selected || !trimmed || sending) return;
    setSending(true);
    setSendError('');
    try {
      await sendConversationMessage({ conversationId: selected.id, content: trimmed });
      setContent('');
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['messages', 'conversation', selected.id] }),
        cache.invalidateQueries({ queryKey: conversationKey }),
        cache.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    } catch (error) {
      setSendError(error.message);
    } finally {
      setSending(false);
    }
  }

  const roleLabel = user.role === 'SHIPPER' ? 'Transporter' : 'Shipper';

  return (
    <div className="messages-page">
      <header className="messages-page__heading"><Link to={user.role === 'SHIPPER' ? '/shipper' : '/transporter'} aria-label="Back to dashboard">←</Link><div><p className="shipper-eyebrow">ETHIOFREIGHT</p><h1>Messages</h1></div></header>
      <div className="messages-layout">
        <aside className="messages-sidebar" aria-label="Conversations">
          <div className="messages-sidebar__search"><Input type="search" aria-label="Search conversations" placeholder="Search conversations…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          {conversationsQuery.isError && <Alert tone="danger">{conversationsQuery.error.message}</Alert>}
          {conversationsQuery.isPending ? <div className="messages-loading"><Skeleton /><Skeleton /><Skeleton /></div> : filteredConversations.length ? <div className="messages-conversation-list">{filteredConversations.map((conversation) => {
            const active = conversation.id === selectedId;
            const latest = conversation.lastMessage;
            return <button type="button" key={conversation.id} className={`messages-conversation ${active ? 'is-active' : ''}`} onClick={() => selectConversation(conversation)} aria-current={active ? 'true' : undefined}>
              <span className="messages-avatar">{conversation.counterpart.profilePhoto ? <img src={conversation.counterpart.profilePhoto} alt="" /> : initials(conversation.counterpart.name)}</span>
              <span className="messages-conversation__body"><span className="messages-conversation__top"><strong>{conversation.counterpart.name}</strong><time>{latest ? timeLabel(latest.createdAt) : dateLabel(conversation.updatedAt)}</time></span><span className="messages-conversation__shipment">{conversation.shipment.goodsDescription}</span><span className="messages-conversation__preview">{latest?.content || 'No messages yet'}</span></span>
            </button>;
          })}</div> : <div className="messages-empty-list"><span>✉</span><strong>{search ? 'No conversations found' : 'No conversations yet'}</strong><small>{search ? 'Try another name or shipment.' : 'Chats will appear here when you have a shipment bid.'}</small></div>}
        </aside>

        <section className="messages-chat" aria-label="Selected conversation">
          {selected ? <>
            <header className="messages-chat__header"><span className="messages-avatar">{selected.counterpart.profilePhoto ? <img src={selected.counterpart.profilePhoto} alt="" /> : initials(selected.counterpart.name)}</span><div><strong>{selected.counterpart.name}</strong><small>{roleLabel} · {selected.bidStatus ? selected.bidStatus.toLowerCase() : 'previous bid'} bid</small></div><Link to={user.role === 'SHIPPER' ? `/shipper/shipments/${selected.shipmentId}` : `/transporter/shipments/${selected.shipmentId}`}>Shipment details ↗</Link></header>
            <div className="messages-context"><strong>{selected.shipment.goodsDescription}</strong><span>{selected.shipment.pickupLocation} → {selected.shipment.deliveryLocation}</span><span>Pickup {dateLabel(selected.shipment.pickupDate)}</span></div>
            {messagesQuery.isError && <Alert tone="danger">{messagesQuery.error.message}</Alert>}
            <div className="messages-chat__history" ref={messagesRef}>
              {messagesQuery.isPending ? <div className="messages-loading"><Skeleton /><Skeleton /></div> : messages.length ? <>
                {messages.map((message, index) => {
                  const previousDate = index ? new Date(messages[index - 1].createdAt).toDateString() : null;
                  const currentDate = new Date(message.createdAt).toDateString();
                  return <div key={message.id}>{previousDate !== currentDate && <div className="messages-date-divider"><span>{dateLabel(message.createdAt)}</span></div>}<article className={`messages-bubble ${message.senderId === user.id ? 'is-own' : ''}`}><p>{message.content}</p><time>{timeLabel(message.createdAt)}</time></article></div>;
                })}
              </> : <div className="messages-chat__empty"><span>✉</span><strong>No messages yet</strong><p>Start the conversation about this shipment.</p></div>}
            </div>
            {sendError && <Alert tone="danger">{sendError}</Alert>}
            {selected.canSend ? <form className="messages-compose" onSubmit={sendMessage}><Textarea aria-label="Write a message" maxLength={5000} placeholder="Type your message…" value={content} onChange={(event) => setContent(event.target.value)} /><Button type="submit" aria-label="Send message" disabled={sending || !content.trim()}>{sending ? <Spinner /> : '➤'}</Button></form> : <p className="messages-closed-note">This bid is closed. You can read the conversation history.</p>}
          </> : <div className="messages-chat__welcome"><span>✉</span><h2>Your shipment conversations</h2><p>Select a chat to view messages and coordinate with the other party.</p></div>}
        </section>
      </div>
    </div>
  );
}
