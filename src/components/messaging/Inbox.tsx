'use client';

import { Loader2, MessageSquare, Plus, Search } from 'lucide-react';
import type { InboxItem } from './types';

const TABS = ['All', 'Doctors', 'Students', 'Team'] as const;
export type InboxTab = (typeof TABS)[number];

const ROLE: Record<InboxTab, string | null> = {
  All: null,
  Doctors: 'doctor',
  Students: 'student',
  Team: 'admin',
};

export function Inbox(props: {
  items: InboxItem[];
  loading: boolean;
  tab: InboxTab;
  onTab: (tab: InboxTab) => void;
  selectedId: string | null;
  onSelect: (item: InboxItem) => void;
  onSearch: (value: string) => void;
  onCompose: () => void;
  onLoadMore: () => void;
  canLoadMore: boolean;
  messageHits: { id: string; conversationId: string; body: string }[];
  unreadTotal: number;
  emptyMessage?: string;
}) {
  const visible = props.items.filter((item) => {
    const role = ROLE[props.tab];
    return !role || item.otherUser.role === role;
  });

  return (
    <div className="flex w-full md:w-80 shrink-0 flex-col border-r border-portal-border bg-white h-full min-h-0">
      <div className="p-4 border-b border-portal-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-portal-ink">Messages</h2>
          <button type="button" onClick={props.onCompose} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full text-white bg-portal-accent" aria-label="New conversation" title="New conversation">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-muted" />
          <input
            placeholder="Search conversations"
            onChange={(event) => props.onSearch(event.target.value)}
            className="w-full min-h-11 pl-9 pr-3 bg-portal-surface border border-portal-border rounded-lg text-base text-portal-ink"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button key={tab} type="button" onClick={() => props.onTab(tab)} className={`min-h-11 px-3 rounded-full text-sm font-bold ${props.tab === tab ? 'bg-portal-accent text-white' : 'bg-portal-surface text-portal-ink-2'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" data-inbox-total={props.unreadTotal}>
        {props.loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <MessageSquare className="w-6 h-6 text-portal-muted mx-auto mb-3" />
            <p className="text-sm text-portal-ink-2">{props.emptyMessage || 'Your inbox is where conversations live. When you accept a patient referral, your conversation with that doctor starts here automatically. You can also message any doctor in the network directly.'}</p>
            <button type="button" onClick={props.onCompose} className="mt-3 min-h-11 px-4 rounded-full bg-portal-accent text-white text-sm font-bold">Start a conversation</button>
          </div>
        ) : visible.map((item) => (
          <button key={item.id} type="button" onClick={() => props.onSelect(item)} className={`w-full min-h-11 px-4 py-3 flex items-center gap-3 text-left border-l-4 ${props.selectedId === item.id ? 'bg-portal-accent-50 border-portal-accent' : 'border-transparent'}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-sm ${item.unreadCount > 0 ? 'font-bold text-portal-ink' : 'text-portal-ink'}`}>{item.otherUser.full_name || 'Former member'}</span>
                {item.unreadCount > 0 ? <span className="text-xs font-bold text-portal-accent">{item.unreadCount}</span> : null}
              </div>
              <p className="text-xs text-portal-muted truncate">
                {item.contextType === 'referral' ? 'Referral · ' : ''}
                {item.lastMessagePreview || 'No messages yet'}
              </p>
            </div>
          </button>
        ))}
        {props.messageHits.length > 0 ? (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs font-bold text-portal-muted mb-2">In your messages</p>
            {props.messageHits.map((hit) => (
              <button key={hit.id} type="button" onClick={() => props.onSelect({ id: hit.conversationId, otherUser: { id: '', full_name: 'Former member', role: '' }, last_message_at: '', lastMessagePreview: hit.body, unreadCount: 0, contextType: null, contextId: null, referralChip: null })} className="block w-full text-left min-h-11 text-sm text-portal-ink py-2">
                {hit.body}
              </button>
            ))}
          </div>
        ) : null}
        {props.canLoadMore ? (
          <button type="button" onClick={props.onLoadMore} className="w-full min-h-11 text-sm font-bold text-portal-accent">Load more</button>
        ) : null}
      </div>
    </div>
  );
}
