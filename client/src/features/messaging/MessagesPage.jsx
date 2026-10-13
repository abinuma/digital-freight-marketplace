import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Modal } from '../../shared/components/index.js';
import { getPublicProfile, getVehicle } from '../profile/profile.api.js';
import { getConversationBids, getConversationLastMessage, getConversationMessages, listConversations, sendConversationMessage } from './messaging.api.js';
import { decideBid } from '../shipper/shipper.api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { ConversationHeader } from './components/ConversationHeader.jsx';
import { ConversationContextPanel } from './components/ConversationContextPanel.jsx';
import { ConversationList } from './components/ConversationList.jsx';
import { MessageComposer } from './components/MessageComposer.jsx';
import { MessageList } from './components/MessageList.jsx';

const conversationKey = ['messages', 'conversations'];
const noConversations = [];
const noMessages = [];
const emptyStateClass = 'flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-500';

export function MessagesPage() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [content, setContent] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const [acceptingBid, setAcceptingBid] = useState(false);
  const [acceptBidOpen, setAcceptBidOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [bidSelection, setBidSelection] = useState({ conversationId: '', bidId: '' });
  const messagesRef = useRef(null);

  const conversationsQuery = useQuery({ queryKey: conversationKey, queryFn: listConversations, refetchInterval: 15_000 });
  const conversations = conversationsQuery.data || noConversations;
  const requestedConversation = searchParams.get('conversationId');
  const shipmentId = searchParams.get('shipmentId');
  const transporterId = searchParams.get('transporterId');
  const requested = requestedConversation && conversations.find((conversation) => conversation.id === requestedConversation);
  const fromShipment = shipmentId && conversations.find((conversation) => conversation.shipmentIds.includes(shipmentId) && (!transporterId || conversation.transporterId === transporterId));
  const selected = requested || fromShipment || conversations[0] || null;
  const selectedId = selected?.id || '';
  const profileQuery = useQuery({
    queryKey: ['messages', 'counterpart-profile', selected?.counterpart.id],
    queryFn: () => getPublicProfile(selected.counterpart.id),
    enabled: Boolean(selected?.counterpart.id),
    staleTime: 5 * 60_000,
  });
  const vehicleQuery = useQuery({
    queryKey: ['messages', 'counterpart-vehicle', selected?.counterpart.id],
    queryFn: () => getVehicle(selected.counterpart.id),
    enabled: user.role === 'SHIPPER' && Boolean(selected?.counterpart.id),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const bidQuery = useQuery({
    queryKey: ['messages', 'conversation-bids', selectedId],
    queryFn: () => getConversationBids(selectedId),
    enabled: Boolean(selectedId),
    refetchInterval: 15_000,
  });
  const bids = bidQuery.data || noConversations;
  const routeBid = shipmentId
    ? bids.find((bid) => bid.shipmentId === shipmentId && (user.role !== 'SHIPPER' || ['ACCEPTED', 'PENDING'].includes(bid.status)))
    : null;
  const storedBid = bidSelection.conversationId === selectedId
    ? bids.find((bid) => bid.id === bidSelection.bidId)
    : null;
  const contextBid = storedBid || routeBid || bids[0] || null;
  const contextBidIndex = bids.findIndex((bid) => bid.id === contextBid?.id);

  useEffect(() => {
    if (selected && selected.id !== requestedConversation) {
      setSearchParams({ conversationId: selected.id, ...(shipmentId ? { shipmentId } : {}) }, { replace: true });
    }
  }, [requestedConversation, selected, setSearchParams, shipmentId]);

  const messagesQuery = useQuery({
    queryKey: ['messages', 'conversation', selectedId],
    queryFn: () => getConversationMessages(selectedId),
    enabled: Boolean(selectedId),
    refetchInterval: 10_000,
  });
  const contextLastMessageQuery = useQuery({
    queryKey: ['messages', 'conversation-last-message', selectedId],
    queryFn: () => getConversationLastMessage(selectedId),
    enabled: Boolean(selectedId),
    refetchInterval: 10_000,
  });
  const messages = messagesQuery.data || noMessages;
  const contextLastMessage = contextLastMessageQuery.data;
  const filteredConversations = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) => (
      `${conversation.counterpart.name} ${conversation.lastMessage?.content || ''}`
        .toLocaleLowerCase()
        .includes(needle)
    ));
  }, [conversations, search]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, selectedId]);

  function selectConversation(conversation) {
    setSearchParams({ conversationId: conversation.id });
    setBidSelection({ conversationId: conversation.id, bidId: '' });
    setContent('');
    setSendError('');
  }

  function selectAdjacentBid(offset) {
    if (!selected || contextBidIndex < 0 || bids.length < 2) return;
    const nextIndex = (contextBidIndex + offset + bids.length) % bids.length;
    const nextBid = bids[nextIndex];
    setBidSelection({ conversationId: selected.id, bidId: nextBid.id });
    setSearchParams({ conversationId: selected.id }, { replace: true });
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
        cache.invalidateQueries({ queryKey: ['messages', 'conversation-last-message', selected.id] }),
        cache.invalidateQueries({ queryKey: conversationKey }),
        cache.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    } catch (error) {
      setSendError(error.message);
    } finally {
      setSending(false);
    }
  }

  async function acceptBid() {
    if (user.role !== 'SHIPPER' || !selected || !contextBid || acceptingBid) return;
    setAcceptingBid(true);
    setActionError('');
    try {
      await decideBid({
        shipmentId: contextBid.shipmentId,
        bidId: contextBid.id,
        action: 'accept',
      });
      setAcceptBidOpen(false);
      await Promise.all([
        cache.invalidateQueries({ queryKey: conversationKey }),
        cache.invalidateQueries({ queryKey: ['messages', 'conversation-bids', selected.id] }),
        cache.invalidateQueries({ queryKey: ['messages', 'conversation', selected.id] }),
        cache.invalidateQueries({ queryKey: ['shipper'] }),
        cache.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setAcceptingBid(false);
    }
  }

  const roleLabel = user.role === 'SHIPPER' ? 'Transporter' : 'Shipper';

  return (
    <main className="flex h-screen min-h-0 flex-col bg-white text-slate-800">
      <header className="flex min-h-16 items-center gap-3 border-b border-blue-800 bg-blue-700 px-4 py-2 text-white sm:px-6">
        <Link className="text-2xl text-white no-underline transition-colors hover:text-blue-200" to={user.role === 'SHIPPER' ? '/shipper' : '/transporter'} aria-label="Back to dashboard">←</Link>
        <div>
          <p className="m-0 text-xs font-bold tracking-widest text-blue-200">ETHIOFREIGHT</p>
          <h1 className="m-0 text-lg font-bold">Messages</h1>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[20rem_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)_auto] xl:grid-cols-[20rem_minmax(0,1fr)_20rem] xl:grid-rows-1">
      <ConversationList
          conversations={conversations}
          filteredConversations={filteredConversations}
          selectedId={selectedId}
          lastMessage={selectedId ? contextLastMessage : null}
          search={search}
          onSearchChange={setSearch}
          isPending={conversationsQuery.isPending}
          error={conversationsQuery.error?.message}
          onSelect={selectConversation}
        />

        <section className="flex min-h-[34rem] min-w-0 flex-col px-3 pb-3 sm:px-4 md:min-h-0" aria-label="Selected conversation">
          {selected ? (
            <>
              <ConversationHeader conversation={selected} roleLabel={roleLabel} />
              <MessageList messages={messages} userId={user.id} isPending={messagesQuery.isPending} error={messagesQuery.error?.message} listRef={messagesRef} />
              <MessageComposer
                content={content}
                sendError={sendError}
                sending={sending}
                onChange={setContent}
                onSend={sendMessage}
              />
            </>
          ) : (
            <div className={emptyStateClass}>
              <span className="text-2xl text-blue-700">✉</span>
              <h2 className="m-0 text-base">Your shipment conversations</h2>
              <p className="m-0 max-w-sm text-sm">Select a chat to view messages and coordinate with the other party.</p>
            </div>
          )}
        </section>

        {selected && (
          <ConversationContextPanel
            conversation={selected}
            role={user.role}
            bids={bids}
            bidIndex={contextBidIndex}
            bidsPending={bidQuery.isPending}
            bidsError={bidQuery.error?.message}
            profile={profileQuery.data}
            profilePending={profileQuery.isPending}
            vehicle={vehicleQuery.data}
            bid={contextBid}
            accepting={acceptingBid}
            actionError={actionError}
            onPreviousBid={() => selectAdjacentBid(-1)}
            onNextBid={() => selectAdjacentBid(1)}
            onAcceptBid={() => {
              setActionError('');
              setAcceptBidOpen(true);
            }}
          />
        )}
      </div>
      <Modal
        open={acceptBidOpen}
        onClose={() => !acceptingBid && setAcceptBidOpen(false)}
        title="Accept this bid?"
      >
        <p className="mb-4 mt-0 text-sm leading-6 text-slate-600">
          Accepting this offer starts the shipment and closes the other pending bids.
        </p>
        {actionError && <Alert tone="danger">{actionError}</Alert>}
        <div className="flex justify-end gap-2 max-sm:flex-col-reverse">
          <Button variant="secondary" disabled={acceptingBid} onClick={() => setAcceptBidOpen(false)}>Keep reviewing</Button>
          <Button disabled={acceptingBid} onClick={acceptBid}>{acceptingBid ? 'Accepting…' : 'Accept bid'}</Button>
        </div>
      </Modal>
    </main>
  );
}
