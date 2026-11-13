'use client';

import { ChevronLeft, Flag, Loader2, MoreVertical, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { ChatMessage, InboxItem } from './types';

export type ThreadScroller = {
  scrollToBottom: () => void;
};

function profileHref(viewerRole: string, otherRole: string): string | null {
  const doctor = viewerRole === 'doctor' || viewerRole.startsWith('doctor');
  if (!doctor) return null;
  if (otherRole === 'doctor') return '/doctor/network';
  if (otherRole === 'student') return '/doctor/students';
  if (otherRole === 'patient' || otherRole === 'member') return '/doctor/people';
  return null;
}

function roleLabel(role: string) {
  if (role === 'doctor') return 'Doctor';
  if (role === 'student') return 'Student';
  if (role === 'patient' || role === 'member') return 'Community member';
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
  viewerRole?: string;
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
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1E2D3B] text-[13px] font-extrabold text-white">{(props.item.otherUser.full_name || 'NC').slice(0, 2).toUpperCase()}</span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold text-[#15202B]">{props.item.otherUser.full_name || 'Former member'}</h3>
            <p className="truncate text-xs text-[#5b6773]">{roleLabel(props.item.otherUser.role)}</p>
          </div>
          {profileHref(props.viewerRole || '', props.item.otherUser.role) ? (
            <Link href={profileHref(props.viewerRole || '', props.item.otherUser.role) || '/doctor/people'} className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-[#D7DEE6] px-3 text-[13px] font-extrabold text-[#1E2D3B]">View profile</Link>
          ) : null}
        </div>
        {props.item.contextType === 'referral' || props.item.referralChip ? (
          props.item.referralChip && (props.viewerRole === 'doctor' || (props.viewerRole || '').startsWith('doctor')) ? (
            <Link href={props.item.referralChip.href} className="mr-2 inline-flex min-h-11 shrink-0 items-center rounded-full bg-[#EFE5F5] px-3 text-[12px] font-extrabold text-[#5C3473]">About your referral</Link>
          ) : (
            <span className="mr-2 inline-flex min-h-11 shrink-0 items-center rounded-full bg-[#EFE5F5] px-3 text-[12px] font-extrabold text-[#5C3473]">About your referral</span>
          )
        ) : null}
        {props.onRefer && props.item.otherUser.role === 'doctor' ? (
            <button type="button" onClick={props.onRefer} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-[#D7DEE6] px-3 text-sm font-bold text-[#15202B]" aria-label="Refer a community member to this doctor" title="Refer a community member to this doctor">
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
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-[#1E2D3B] text-white' : 'bg-[#F5F3EF] text-[#15202B]'}`} onContextMenu={(event) => { if (!mine) { event.preventDefault(); props.onReport(message.id); } }}>
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
