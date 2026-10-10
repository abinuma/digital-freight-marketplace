import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Skeleton, Spinner, Textarea } from '../../shared/components/index.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { getShipmentMessages, sendShipmentMessage } from './messaging.api.js';

const noMessages = [];

export function ShipmentConversation({ shipmentId }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const query = useQuery({ queryKey: ['messages', shipmentId], queryFn: () => getShipmentMessages(shipmentId), refetchInterval: 30_000 });
  const messages = query.data || noMessages;

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  async function send(event) {
    event.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError('');
    try {
      await sendShipmentMessage({ shipmentId, content: content.trim() });
      setContent('');
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['messages', shipmentId] }),
        cache.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="shipper-detail-card shipment-conversation"><div className="shipper-panel__heading"><div><h2>Shipment conversation</h2><p>Coordinate details with the {user?.role === 'SHIPPER' ? 'transporter' : 'shipper'}.</p></div></div>
      {error && <Alert tone="danger" title="Message could not be sent">{error}</Alert>}{query.isError && <Alert tone="danger" title="Conversation unavailable">{query.error.message}</Alert>}
      <div className="shipment-message-list" ref={listRef}>{query.isPending ? <Skeleton /> : messages.length ? messages.map((message) => <article className={`shipment-message ${message.senderId === user?.id ? 'shipment-message--own' : ''}`} key={message.id}><p>{message.content}</p><time>{new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(message.createdAt))}</time></article>) : <p className="shipment-conversation__empty">No messages yet. Start the conversation.</p>}</div>
      <form onSubmit={send} className="shipment-message-form"><Textarea aria-label="Message" maxLength={5000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write a message…" /><Button type="submit" disabled={sending || !content.trim()}>{sending ? <Spinner /> : 'Send'}</Button></form>
    </Card>
  );
}
