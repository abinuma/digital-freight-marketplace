import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Modal } from '../../shared/components/index.js';
import { getPublicProfile, getVehicle } from '../profile/profile.api.js';
import {
  getConversationBids,
  getConversationLastMessage,
  getConversationMessages,
  listConversations,
  sendConversationMessage,
} from './messaging.api.js';
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
  const [bidToAccept, setBidToAccept] = useState(null);
  const [actionError, setActionError] = useState('');
  const [bidsDrawerOpen, setBidsDrawerOpen] = useState(false);
  const messagesRef = useRef(null);

  const conversationsQuery = useQuery({
    queryKey: conversationKey,
    queryFn: listConversations,
    refetchInterval: 15_000,
  });
  const conversations = conversationsQuery.data || noConversations;

  const requestedConversation = searchParams.get('conversationId');
  const shipmentId = searchParams.get('shipmentId');
  const transporterId = searchParams.get('transporterId');

  const requested = requestedConversation
    ? conversations.find((conversation) => conversation.id === requestedConversation)
    : null;
  const fromShipment = shipmentId
    ? conversations.find(
        (conversation) =>
          conversation.shipmentIds.includes(shipmentId) &&
          (!transporterId || conversation.transporterId === transporterId)
      )
    : null;

  // On desktop default to the first conversation if none selected in params.
  // On mobile (<768px), allow null selected so the conversations list is shown.
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const selected = requested || fromShipment || (isDesktop ? conversations[0] : null) || null;
  const selectedId = selected?.id || '';

  const profileQuery = useQuery({
    queryKey: ['messages', 'counterpart-profile', selected?.counterpart?.id],
    queryFn: () => getPublicProfile(selected.counterpart.id),
    enabled: Boolean(selected?.counterpart?.id),
    staleTime: 5 * 60_000,
  });

  const vehicleQuery = useQuery({
    queryKey: ['messages', 'counterpart-vehicle', selected?.counterpart?.id],
    queryFn: () => getVehicle(selected.counterpart.id),
    enabled: user.role === 'SHIPPER' && Boolean(selected?.counterpart?.id),
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

  useEffect(() => {
    if (requestedConversation && selected && selected.id !== requestedConversation) {
      setSearchParams(
        { conversationId: selected.id, ...(shipmentId ? { shipmentId } : {}) },
        { replace: true }
      );
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
    return conversations.filter((conversation) =>
      `${conversation.counterpart.name} ${conversation.lastMessage?.content || ''}`
        .toLocaleLowerCase()
        .includes(needle)
    );
  }, [conversations, search]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, selectedId]);

  function selectConversation(conversation) {
    setSearchParams({ conversationId: conversation.id });
    setContent('');
    setSendError('');
  }

  function handleBackToConversations() {
    setSearchParams({});
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
    if (user.role !== 'SHIPPER' || !selected || !bidToAccept || acceptingBid) return;
    setAcceptingBid(true);
    setActionError('');
    try {
      await decideBid({
        shipmentId: bidToAccept.shipmentId,
        bidId: bidToAccept.id,
        action: 'accept',
      });
      setAcceptBidOpen(false);
      setBidToAccept(null);
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
      <header className="flex min-h-14 items-center justify-between border-b border-blue-800 bg-blue-700 px-4 py-2 text-white sm:min-h-16 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            className="text-2xl text-white no-underline transition-colors hover:text-blue-200"
            to={user.role === 'SHIPPER' ? '/shipper' : '/transporter'}
            aria-label="Back to dashboard"
          >
            ←
          </Link>
          <div>
            <p className="m-0 text-xs font-bold tracking-widest text-blue-200">ETHIOFREIGHT</p>
            <h1 className="m-0 text-lg font-bold">Messages</h1>
          </div>
        </div>

        {selected && (
          <button
            type="button"
            onClick={() => setBidsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-800/80 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-800 lg:hidden"
            aria-label="View conversation bids"
          >
            <span aria-hidden="true">🏷️</span>
            <span>Bids ({bids.length})</span>
          </button>
        )}
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Column 1: Conversations List */}
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
          hasSelectedConversation={Boolean(selected)}
        />

        {/* Column 2: Chatting Board */}
        <section
          className={`flex min-h-0 min-w-0 flex-1 flex-col px-2.5 pb-2.5 sm:px-4 sm:pb-3 ${
            !selected ? 'max-md:hidden' : ''
          }`}
          aria-label="Selected conversation"
        >
          {selected ? (
            <>
              <ConversationHeader
                conversation={selected}
                roleLabel={roleLabel}
                bidsCount={bids.length}
                onOpenBids={() => setBidsDrawerOpen(true)}
                onBack={handleBackToConversations}
              />
              <MessageList
                messages={messages}
                userId={user.id}
                isPending={messagesQuery.isPending}
                error={messagesQuery.error?.message}
                listRef={messagesRef}
              />
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
              <p className="m-0 max-w-sm text-sm">
                Select a chat to view messages and coordinate with the other party.
              </p>
            </div>
          )}
        </section>

        {/* Column 3: Desktop Bids Panel (visible on lg and wider) */}
        {selected && (
          <ConversationContextPanel
            conversation={selected}
            role={user.role}
            bids={bids}
            bidsPending={bidQuery.isPending}
            bidsError={bidQuery.error?.message}
            profile={profileQuery.data}
            profilePending={profileQuery.isPending}
            vehicle={vehicleQuery.data}
            accepting={acceptingBid}
            actionError={actionError}
            onAcceptBid={(bid) => {
              setBidToAccept(bid);
              setActionError('');
              setAcceptBidOpen(true);
            }}
            className="hidden lg:flex lg:w-72 xl:w-80 2xl:w-96"
          />
        )}
      </div>

      {/* Slide-over Drawer / Modal for Bids (opened via Bids button on smaller screens) */}
      {selected && bidsDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={() => setBidsDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Conversation bids"
        >
          <div
            className="flex h-full w-full max-w-md flex-col bg-slate-50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ConversationContextPanel
              conversation={selected}
              role={user.role}
              bids={bids}
              bidsPending={bidQuery.isPending}
              bidsError={bidQuery.error?.message}
              profile={profileQuery.data}
              profilePending={profileQuery.isPending}
              vehicle={vehicleQuery.data}
              accepting={acceptingBid}
              actionError={actionError}
              onAcceptBid={(bid) => {
                setBidToAccept(bid);
                setActionError('');
                setAcceptBidOpen(true);
              }}
              onClose={() => setBidsDrawerOpen(false)}
              isDrawer
            />
          </div>
        </div>
      )}

      {/* Accept Bid Confirmation Modal */}
      <Modal
        open={acceptBidOpen}
        onClose={() => !acceptingBid && setAcceptBidOpen(false)}
        title={
          bidToAccept
            ? `Accept offer: ETB ${Number(bidToAccept.price).toLocaleString()}?`
            : 'Accept this bid?'
        }
      >
        <p className="mb-4 mt-0 text-sm leading-6 text-slate-600">
          Accepting this offer for{' '}
          <strong className="text-slate-900">
            {bidToAccept?.shipment?.goodsDescription || 'this shipment'}
          </strong>{' '}
          starts the shipment and closes other pending bids.
        </p>
        {actionError && <Alert tone="danger">{actionError}</Alert>}
        <div className="flex justify-end gap-2 max-sm:flex-col-reverse">
          <Button
            variant="secondary"
            disabled={acceptingBid}
            onClick={() => {
              setAcceptBidOpen(false);
              setBidToAccept(null);
            }}
          >
            Keep reviewing
          </Button>
          <Button disabled={acceptingBid} onClick={acceptBid}>
            {acceptingBid ? 'Accepting…' : 'Accept bid'}
          </Button>
        </div>
      </Modal>
    </main>
  );
}
