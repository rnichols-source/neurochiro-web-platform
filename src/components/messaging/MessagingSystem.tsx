'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { messagingV2 } from '@/config/portal-features';
import { useReferralOptional } from '@/components/portal/ReferralProvider';
import {
  blockUser,
  deleteMessage,
  getInboxPage,
  getThreadPage,
  lookupMessagePerson,
  markMessagesRead,
  muteConversation,
  reportMessage,
  searchMyMessages,
  searchUsersForMessage,
  sendMessage,
  unmuteConversation,
} from '@/app/actions/messaging-actions';
import { mergeMessages } from '@/lib/messaging/realtime';
import { Composer } from './Composer';
import { Inbox, type InboxTab } from './Inbox';
import { Thread, type ThreadScroller } from './Thread';
import type { ChatMessage, InboxItem, Person } from './types';
import { useMessagingRealtime } from './useMessagingRealtime';

const CANNED: Record<string, string[]> = {
  doctor: [
    'Yes, we are currently accepting new patients.',
    'Please call our office to schedule.',
    "I'd be happy to discuss further. What times work?",
    'Thank you for reaching out!',
  ],
  student: [
    'Thank you for the interview opportunity!',
    "I'd love to learn more about the position.",
    'Would it be possible to shadow for a day?',
    "I'm very interested in your practice.",
  ],
};

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toChat(row: {
  id?: unknown;
  conversation_id?: unknown;
  sender_id?: unknown;
  recipient_id?: unknown;
  body?: unknown;
  created_at?: unknown;
  read_at?: unknown;
  message_type?: unknown;
  deleted_at?: unknown;
  client_message_id?: unknown;
}): ChatMessage {
  return {
    id: text(row.id),
    conversation_id: text(row.conversation_id),
    sender_id: text(row.sender_id),
    recipient_id: text(row.recipient_id),
    body: text(row.body),
    created_at: text(row.created_at),
    read_at: textOrNull(row.read_at),
    message_type: text(row.message_type) || 'user',
    deleted_at: textOrNull(row.deleted_at),
    client_message_id: textOrNull(row.client_message_id),
  };
}

export default function MessagingSystem({
  currentUserId,
  userRole,
  initialOtherUserId,
  initialConversationId,
  emptyMessage,
  header,
  fill = false,
}: {
  currentUserId: string;
  userRole: string;
  initialOtherUserId?: string;
  initialConversationId?: string;
  emptyMessage?: string;
  header?: ReactNode;
  fill?: boolean;
}) {
  const referral = useReferralOptional();
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [hasEarlier, setHasEarlier] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(false);
  const [tab, setTab] = useState<InboxTab>('All');
  const [showCanned, setShowCanned] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [hits, setHits] = useState<{ id: string; conversationId: string; body: string }[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [blockOpen, setBlockOpen] = useState(false);
  const sendingRef = useRef(false);
  const threadRef = useRef<ThreadScroller>(null);
  const nearBottom = useRef(true);
  const lastSeen = useRef<string | null>(null);
  const selectedRef = useRef<InboxItem | null>(null);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const refreshInbox = useCallback(async () => {
    const page = await getInboxPage();
    setItems(page.rows);
    setUnreadTotal(page.unreadMessages);
    setCanLoadMore(page.rows.length >= 30);
    setLoading(false);
    return page.rows;
  }, []);

  const openThread = useCallback(async (item: InboxItem) => {
    setSelected(item);
    setShowMenu(false);
    setShowNew(false);
    if (item.isTemp || item.id.startsWith('temp-')) {
      setMessages([]);
      setHasEarlier(false);
      return;
    }
    setThreadLoading(true);
    const thread = await getThreadPage(item.id);
    if (thread) {
      const next = thread.messages.map(toChat);
      setMessages(next);
      setHasEarlier(thread.hasEarlier);
      lastSeen.current = next[next.length - 1]?.created_at || null;
      setSelected((current) => current ? { ...current, otherUser: thread.otherUser, referralChip: thread.chip, contextType: thread.contextType } : current);
    } else {
      setMessages([]);
      setHasEarlier(false);
    }
    setThreadLoading(false);
  }, []);

  useEffect(() => {
    refreshInbox().then(async (rows) => {
      if (initialConversationId) {
        const found = rows.find((row) => row.id === initialConversationId);
        await openThread(found || {
          id: initialConversationId,
          otherUser: { id: '', full_name: 'Former member', role: '' },
          last_message_at: '',
          lastMessagePreview: '',
          unreadCount: 0,
          contextType: null,
          contextId: null,
          referralChip: null,
        });
        return;
      }
      if (initialOtherUserId) {
        const found = rows.find((row) => row.otherUser.id === initialOtherUserId);
        if (found) {
          await openThread(found);
          return;
        }
        const person = await lookupMessagePerson(initialOtherUserId);
        if (person) {
          const temp: InboxItem = {
            id: `temp-${person.id}`,
            otherUser: person,
            last_message_at: new Date().toISOString(),
            lastMessagePreview: '',
            unreadCount: 0,
            contextType: null,
            contextId: null,
            referralChip: null,
            isTemp: true,
          };
          setItems((prev) => [temp, ...prev]);
          setSelected(temp);
        }
      }
    });
  }, [initialConversationId, initialOtherUserId, openThread, refreshInbox]);

  useEffect(() => {
    if (!selected || selected.isTemp) return;
    const run = () => {
      if (document.visibilityState !== 'visible') return;
      const unread = messages.some((message) => message.recipient_id === currentUserId && !message.read_at && !message.pending);
      if (unread) void markMessagesRead(selected.id);
    };
    run();
    document.addEventListener('visibilitychange', run);
    return () => document.removeEventListener('visibilitychange', run);
  }, [selected, messages, currentUserId]);

  const gapFill = useCallback(async () => {
    await refreshInbox();
    const current = selectedRef.current;
    if (!current || current.isTemp || !lastSeen.current) return;
    const thread = await getThreadPage(current.id, null, lastSeen.current);
    if (!thread) return;
    setMessages((prev) => mergeMessages(prev, thread.messages.map(toChat)));
    const latest = thread.messages[thread.messages.length - 1];
    if (latest) lastSeen.current = latest.created_at;
  }, [refreshInbox]);

  useMessagingRealtime({
    userId: currentUserId,
    onReconnect: () => { void gapFill(); },
    onInsert: (row) => {
      const message = toChat(row);
      if (selectedRef.current?.id === message.conversation_id) {
        setMessages((prev) => mergeMessages(prev, [message]));
        lastSeen.current = message.created_at;
        if (!nearBottom.current && message.sender_id !== currentUserId) setShowNew(true);
      } else {
        void refreshInbox();
      }
    },
    onUpdate: (row) => {
      const message = toChat(row);
      setMessages((prev) => prev.map((item) => item.id === message.id ? { ...item, ...message } : item));
    },
  });

  async function loadMore() {
    const last = items[items.length - 1];
    if (!last?.last_message_at) return;
    const page = await getInboxPage(last.last_message_at);
    setItems((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      return [...prev, ...page.rows.filter((row) => !seen.has(row.id))];
    });
    setCanLoadMore(page.rows.length >= 30);
  }

  async function loadEarlier() {
    const oldest = messages[0];
    if (!selected || !oldest) return;
    const thread = await getThreadPage(selected.id, { createdAt: oldest.created_at, id: oldest.id });
    if (!thread) return;
    setMessages((prev) => mergeMessages(thread.messages.map(toChat), prev));
    setHasEarlier(thread.hasEarlier);
  }

  function choose(item: InboxItem) {
    if (item.id.startsWith('temp-') || item.isTemp) {
      setSelected(item);
      setMessages([]);
      return;
    }
    router.push(`${pathname}?c=${item.id}`, { scroll: false });
    void openThread(item);
  }

  async function submit(existingClientId?: string) {
    if (!selected || sendingRef.current) return;
    const text = existingClientId ? messages.find((message) => message.client_message_id === existingClientId)?.body || draft : draft.trim();
    if (!text.trim()) return;
    const clientId = existingClientId || crypto.randomUUID();
    sendingRef.current = true;
    setSending(true);
    if (!existingClientId) {
      const pending: ChatMessage = {
        id: `pending-${clientId}`,
        conversation_id: selected.id,
        sender_id: currentUserId,
        recipient_id: selected.otherUser.id,
        body: text.trim(),
        created_at: new Date().toISOString(),
        read_at: null,
        message_type: 'user',
        deleted_at: null,
        client_message_id: clientId,
        pending: true,
      };
      setMessages((prev) => [...prev, pending]);
      setDraft('');
    }
    const result = await sendMessage(selected.otherUser.id, text.trim(), selected.isTemp ? undefined : selected.id, clientId);
    sendingRef.current = false;
    setSending(false);
    if (!result.ok) {
      setMessages((prev) => prev.map((message) => message.client_message_id === clientId ? { ...message, pending: false, failed: true, error: result.userMessage || result.error } : message));
      return;
    }
    const confirmed: ChatMessage = {
      id: result.message.id,
      conversation_id: result.conversationId,
      sender_id: result.message.senderId,
      recipient_id: result.message.recipientId,
      body: result.message.body,
      created_at: result.message.createdAt,
      read_at: null,
      message_type: 'user',
      deleted_at: null,
      client_message_id: clientId,
    };
    setMessages((prev) => mergeMessages(prev, [confirmed]));
    if (selected.isTemp) {
      const next = { ...selected, id: result.conversationId, isTemp: false };
      setSelected(next);
      router.push(`${pathname}?c=${result.conversationId}`, { scroll: false });
    }
    void refreshInbox();
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setPeople([]);
        setHits([]);
        return;
      }
      const found = await searchUsersForMessage(searchQuery);
      setPeople(found as Person[]);
      if (messagingV2 === 'beta' || messagingV2 === 'live') {
        const mine = await searchMyMessages(searchQuery);
        setHits(mine);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    nearBottom.current = true;
    threadRef.current?.scrollToBottom();
  }, [selected?.id]);

  useEffect(() => {
    if (!nearBottom.current) return;
    threadRef.current?.scrollToBottom();
  }, [messages, selected?.id]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const onResize = () => {
      if (nearBottom.current) threadRef.current?.scrollToBottom();
    };
    viewport.addEventListener('resize', onResize);
    return () => viewport.removeEventListener('resize', onResize);
  }, []);

  const showList = !selected;
  const frame = fill
    ? 'flex flex-1 min-h-0 overflow-hidden bg-white md:rounded-2xl md:border md:border-portal-border'
    : 'flex h-[calc(100dvh-11rem)] min-h-[420px] overflow-hidden rounded-2xl border border-portal-border bg-white';
  return (
    <div className={fill ? 'flex flex-1 min-h-0 flex-col' : undefined}>
      {header ? <div className={selected ? 'hidden md:block shrink-0 px-4 pt-4 md:px-0 md:pt-0' : 'shrink-0 px-4 pt-4 md:px-0 md:pt-0'}>{header}</div> : null}
    <div className={frame}>
      <div className={selected ? 'hidden md:flex md:flex-col min-h-0 h-full' : 'flex flex-col min-h-0 h-full w-full md:w-auto'}>
        <Inbox
          items={items}
          loading={loading}
          tab={tab}
          onTab={setTab}
          selectedId={selected?.id || null}
          onSelect={choose}
          onSearch={setSearchQuery}
          onCompose={() => setComposeOpen(true)}
          onLoadMore={() => { void loadMore(); }}
          canLoadMore={canLoadMore}
          messageHits={hits}
          unreadTotal={unreadTotal}
          emptyMessage={emptyMessage}
        />
      </div>
      <div className={showList ? 'hidden md:flex flex-1 min-h-0 flex-col' : 'flex flex-1 min-w-0 min-h-0 flex-col'}>
        {selected ? (
          <div className="flex flex-1 flex-col min-w-0">
            <Thread
              ref={threadRef}
              item={selected}
              messages={messages}
              loading={threadLoading}
              currentUserId={currentUserId}
              hasEarlier={hasEarlier}
              onEarlier={() => { void loadEarlier(); }}
              onBack={() => {
                if (window.history.length > 1) router.back();
                else router.push(pathname);
              }}
              onReport={setReportId}
              onDelete={async (messageId) => {
                const result = await deleteMessage(messageId);
                if (result.ok) setMessages((prev) => prev.map((message) => message.id === messageId ? { ...message, deleted_at: new Date().toISOString(), body: '' } : message));
              }}
              onRetry={(message) => { void submit(message.client_message_id || undefined); }}
              onRefer={referral && selected.otherUser.role === 'doctor' ? () => referral.openReferral({ userId: selected.otherUser.id }) : undefined}
              showMenu={showMenu}
              onToggleMenu={() => setShowMenu((value) => !value)}
              muted={muted}
              onMute={async () => {
                if (!selected || selected.isTemp) return;
                if (muted) await unmuteConversation(selected.id);
                else await muteConversation(selected.id);
                setMuted((value) => !value);
                setShowMenu(false);
              }}
              onBlock={() => { setBlockOpen(true); setShowMenu(false); }}
              showNew={showNew}
              onJump={() => { threadRef.current?.scrollToBottom(); setShowNew(false); nearBottom.current = true; }}
              onNearBottom={(near) => {
                nearBottom.current = near;
                if (near) setShowNew(false);
              }}
            />
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => { void submit(); }}
              sending={sending}
              canned={CANNED[userRole] || []}
              showCanned={showCanned}
              onToggleCanned={() => setShowCanned((value) => !value)}
              onPickCanned={(value) => { setDraft(value); setShowCanned(false); }}
              includeSafeArea={!fill}
            />
          </div>
        ) : (
          <div className="flex-1 items-center justify-center p-8 text-center text-sm text-gray-500 hidden md:flex">Choose a conversation from the list.</div>
        )}
      </div>
      {composeOpen ? (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">New message</h3>
              <button type="button" onClick={() => setComposeOpen(false)} className="min-h-11 min-w-11" aria-label="Close" title="Close">Close</button>
            </div>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name" className="w-full min-h-11 px-3 border border-gray-200 rounded-xl text-base" />
            <div className="mt-3">
              {people.map((person) => (
                <button key={person.id} type="button" onClick={() => {
                  const existing = items.find((item) => item.otherUser.id === person.id);
                  if (existing) choose(existing);
                  else {
                    const temp: InboxItem = { id: `temp-${person.id}`, otherUser: person, last_message_at: new Date().toISOString(), lastMessagePreview: '', unreadCount: 0, contextType: null, contextId: null, referralChip: null, isTemp: true };
                    setItems((prev) => [temp, ...prev]);
                    setSelected(temp);
                    setMessages([]);
                  }
                  setComposeOpen(false);
                }} className="w-full text-left min-h-11 text-sm font-bold">{person.full_name}</button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {blockOpen && selected ? (
        <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900">Block {selected.otherUser.full_name}?</h3>
            <p className="text-sm text-gray-600 mt-2">They will not be able to message you. You can unblock them from Settings.</p>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setBlockOpen(false)} className="flex-1 min-h-11 rounded-xl bg-gray-100 font-bold">Cancel</button>
              <button type="button" onClick={async () => {
                await blockUser(selected.otherUser.id);
                setBlockOpen(false);
                setSelected(null);
                router.push(pathname);
              }} className="flex-1 min-h-11 rounded-xl bg-red-600 text-white font-bold">Block</button>
            </div>
          </div>
        </div>
      ) : null}
      {reportId ? (
        <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900">Report this message</h3>
            <textarea value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="w-full mt-3 min-h-24 border border-gray-200 rounded-xl p-3 text-base" placeholder="What happened?" />
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => { setReportId(null); setReportReason(''); }} className="flex-1 min-h-11 rounded-xl bg-gray-100 font-bold">Cancel</button>
              <button type="button" onClick={async () => {
                if (reportReason.trim()) await reportMessage(reportId, reportReason.trim());
                setReportId(null);
                setReportReason('');
              }} className="flex-1 min-h-11 rounded-xl bg-red-600 text-white font-bold">Report</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    </div>
  );
}
