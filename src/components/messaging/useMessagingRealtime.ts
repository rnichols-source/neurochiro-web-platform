'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { isUuid } from '@/lib/messaging/ids';
import { nextBackoffMs } from '@/lib/messaging/realtime';

type Handlers = {
  userId: string;
  onReconnect: () => void;
  onInsert: (row: Record<string, unknown>) => void;
  onUpdate: (row: Record<string, unknown>) => void;
};

/** One channel per user. Gap-fill runs after the socket recovers, comes back online, or the tab is visible again. */
export function useMessagingRealtime({ userId, onReconnect, onInsert, onUpdate }: Handlers) {
  const handlers = useRef({ onReconnect, onInsert, onUpdate });
  useEffect(() => {
    handlers.current = { onReconnect, onInsert, onUpdate };
  }, [onReconnect, onInsert, onUpdate]);

  useEffect(() => {
    if (!isUuid(userId)) return;
    const supabase = createClient();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let sawDrop = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const reconnect = () => {
      if (stopped) return;
      sawDrop = false;
      attempt = 0;
      handlers.current.onReconnect();
    };

    const subscribe = () => {
      if (stopped) return;
      if (channel) supabase.removeChannel(channel);
      channel = supabase
        .channel(`messaging-${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, (payload) => {
          handlers.current.onInsert(payload.new as Record<string, unknown>);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, (payload) => {
          handlers.current.onUpdate(payload.new as Record<string, unknown>);
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, (payload) => {
          handlers.current.onInsert(payload.new as Record<string, unknown>);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, (payload) => {
          handlers.current.onUpdate(payload.new as Record<string, unknown>);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `participant_one_id=eq.${userId}` }, () => {
          handlers.current.onReconnect();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `participant_two_id=eq.${userId}` }, () => {
          handlers.current.onReconnect();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            if (sawDrop) reconnect();
            return;
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            sawDrop = true;
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
              attempt += 1;
              subscribe();
            }, nextBackoffMs(attempt));
          }
        });
    };

    subscribe();
    const onOnline = () => reconnect();
    const onVisible = () => {
      if (document.visibilityState === 'visible') reconnect();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);
}
