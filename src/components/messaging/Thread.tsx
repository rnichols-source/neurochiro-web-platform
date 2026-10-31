'use client';

import { ChevronLeft, Flag, Loader2, MoreVertical, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { ChatMessage, InboxItem } from './types';

export type ThreadScroller = {
  scrollToBottom: () => void;
};

function roleLabel(role: string) {
  if (role === 'doctor') return 'Doctor';
  if (role === 'student') return 'Student';
  if (role === 'admin' || role === 'super_admin' || role === 'founder' || role === 'regional_admin') return 'NeuroChiro team';
  return '';
}

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => (
    /^https?:\/\//.test(part) ? (
      <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all text-portal-accent">{part}</a>
    ) : (
      <span key={index}>{part}</span>
    )
  ));
}

export const Thread = forwardRef<ThreadScroller, {
  item: InboxItem;
  messages: ChatMessage[];
  loading: boolean;
  currentUserId: string;
  hasEarlier: boolean;
  onEarlier: () => void;
  onBack: () => void;
  onReport: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onRetry: (message: ChatMessage) => void;
  onRefer?: () => void;
  showMenu: boolean;
  onToggleMenu: () => void;
  onMute: () => void;
  muted: boolean;
  onBlock: () => void;
  showNew: boolean;
  onJump: () => void;
  onNearBottom: (near: boolean) => void;
}>(function Thread(props, ref) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => ({
    scrollToBottom() {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    },
  }), []);
  const lastMine = [...props.messages].reverse().find((message) => message.sender_id === props.currentUserId && !message.pending && !message.failed && message.message_type !== 'system');
  return (
    <div className="flex flex-1 flex-col min-w-0 h-full bg-white" data-thread>
      <header className="px-3 py-2 border-b border-portal-border flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={props.onBack} className="min-h-11 min-w-11 inline-flex items-center justify-center md:hidden" aria-label="Back to conversations" title="Back to conversations">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-portal-ink truncate">{props.item.otherUser.full_name || 'Former member'}</h3>
            <p className="text-xs text-portal-ink-2 truncate">
              {roleLabel(props.item.otherUser.role)}
              {props.item.referralChip ? (
                <>
                  {roleLabel(props.item.otherUser.role) ? ' · ' : null}
                  <Link href={props.item.referralChip.href} className="font-bold text-portal-accent">{props.item.referralChip.label}</Link>
                </>
              ) : null}
            </p>
          </div>
        </div>
        {props.onRefer && props.item.otherUser.role === 'doctor' ? (
          <button type="button" onClick={props.onRefer} className="min-h-11 min-w-11 inline-flex items-center justify-center gap-2 rounded-lg border border-portal-border px-3 text-sm font-bold text-portal-ink" aria-label="Refer a patient to this doctor" title="Refer a patient to this doctor">
            <UserPlus className="w-4 h-4" aria-hidden />
            <span className="hidden md:inline">Refer</span>
          </button>
        ) : null}
        <div className="relative">
          <button type="button" onClick={props.onToggleMenu} className="min-h-11 min-w-11 inline-flex items-center justify-center" aria-label="Conversation actions" title="Conversation actions">
            <MoreVertical className="w-4 h-4" />
          </button>
          {props.showMenu ? (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30">
              <button type="button" onClick={props.onMute} className="w-full text-left min-h-11 px-3 text-sm">{props.muted ? 'Unmute' : 'Mute'}</button>
              <button type="button" onClick={props.onBlock} className="w-full text-left min-h-11 px-3 text-sm">Block</button>
            </div>
          ) : null}
        </div>
      </header>
      <div
        ref={scrollerRef}
        onScroll={() => {
          const el = scrollerRef.current;
          if (!el) return;
          props.onNearBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
        }}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-3"
      >
        {props.hasEarlier ? (
          <button type="button" onClick={props.onEarlier} className="w-full min-h-11 text-sm font-bold text-portal-accent">Load earlier messages</button>
        ) : null}
        {props.loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div> : null}
        {props.messages.map((message) => {
          if (message.message_type === 'system') {
            return <p key={message.id} className="text-center text-sm text-portal-muted italic">{message.body}</p>;
          }
          const mine = message.sender_id === props.currentUserId;
          const seen = mine && lastMine?.id === message.id && Boolean(message.read_at);
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`} data-message-body>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${mine ? 'bg-portal-ink text-white' : 'bg-portal-surface text-portal-ink'}`} onContextMenu={(event) => { if (!mine) { event.preventDefault(); props.onReport(message.id); } }}>
                <p className="text-sm whitespace-pre-wrap break-words">{message.deleted_at ? 'This message was deleted.' : linkify(message.body)}</p>
                {seen ? <p className="text-xs mt-1 text-white/70" data-seen>Seen</p> : null}
                {message.failed ? (
                  <button type="button" onClick={() => props.onRetry(message)} className="mt-1 text-left text-sm text-white" data-send-error>
                    Not sent. Tap to retry. {message.error || ''}
                  </button>
                ) : null}
                <div className="mt-1 flex gap-3">
                  {mine && !message.pending && !message.failed ? (
                    <button type="button" onClick={() => props.onDelete(message.id)} className="text-xs text-white/70 min-h-11">Delete</button>
                  ) : null}
                  {!mine ? (
                    <button type="button" onClick={() => props.onReport(message.id)} className="text-xs min-h-11 inline-flex items-center gap-1" aria-label="Report message" title="Report message">
                      <Flag className="w-3 h-3" /> Report
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {props.showNew ? (
        <button type="button" onClick={props.onJump} className="mx-auto mb-2 min-h-11 px-4 rounded-full bg-portal-ink text-white text-sm font-bold">New messages ↓</button>
      ) : null}
    </div>
  );
});
