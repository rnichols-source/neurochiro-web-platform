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
    <div className="flex w-full md:w-80 shrink-0 flex-col border-r border-gray-200 bg-white h-full">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <button type="button" onClick={props.onCompose} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full text-white bg-[#B4501A]" aria-label="New conversation" title="New conversation">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search conversations"
            onChange={(event) => props.onSearch(event.target.value)}
            className="w-full min-h-11 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-base text-gray-900"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button key={tab} type="button" onClick={() => props.onTab(tab)} className={`min-h-11 px-3 rounded-full text-sm font-bold ${props.tab === tab ? 'bg-[#B4501A] text-white' : 'bg-gray-100 text-gray-600'}`}>
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
            <MessageSquare className="w-6 h-6 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">{props.emptyMessage || 'Your inbox is where conversations live. When you accept a patient referral, your conversation with that doctor starts here automatically. You can also message any doctor in the network directly.'}</p>
            <button type="button" onClick={props.onCompose} className="mt-3 min-h-11 px-4 rounded-full bg-[#B4501A] text-white text-sm font-bold">Start a conversation</button>
          </div>
        ) : visible.map((item) => (
          <button key={item.id} type="button" onClick={() => props.onSelect(item)} className={`w-full min-h-11 px-4 py-3 flex items-center gap-3 text-left border-l-4 ${props.selectedId === item.id ? 'bg-orange-50 border-[#B4501A]' : 'border-transparent'}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-sm ${item.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-800'}`}>{item.otherUser.full_name || 'Former member'}</span>
                {item.unreadCount > 0 ? <span className="text-xs font-bold text-[#B4501A]">{item.unreadCount}</span> : null}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {item.contextType === 'referral' ? 'Referral · ' : ''}
                {item.lastMessagePreview || 'No messages yet'}
              </p>
            </div>
          </button>
        ))}
        {props.messageHits.length > 0 ? (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 mb-2">In your messages</p>
            {props.messageHits.map((hit) => (
              <button key={hit.id} type="button" onClick={() => props.onSelect({ id: hit.conversationId, otherUser: { id: '', full_name: 'Former member', role: '' }, last_message_at: '', lastMessagePreview: hit.body, unreadCount: 0, contextType: null, contextId: null, referralChip: null })} className="block w-full text-left min-h-11 text-sm text-gray-800 py-2">
                {hit.body}
              </button>
            ))}
          </div>
        ) : null}
        {props.canLoadMore ? (
          <button type="button" onClick={props.onLoadMore} className="w-full min-h-11 text-sm font-bold text-[#B4501A]">Load more</button>
        ) : null}
      </div>
    </div>
  );
}
