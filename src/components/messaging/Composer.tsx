'use client';

import { Send, Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function Composer(props: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  canned: string[];
  showCanned: boolean;
  onToggleCanned: () => void;
  onPickCanned: (value: string) => void;
  includeSafeArea?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const line = 24;
    el.style.height = `${Math.min(el.scrollHeight, line * 5)}px`;
  }, [props.value]);

  return (
    <div className="border-t border-portal-border bg-white px-3 pt-3 shrink-0" style={{ paddingBottom: props.includeSafeArea ? 'calc(env(safe-area-inset-bottom) + 12px)' : 12 }} data-composer>
      {props.showCanned && props.canned.length > 0 ? (
        <div className="mb-2 bg-portal-surface border border-portal-border rounded-xl p-2 space-y-1">
          {props.canned.map((reply) => (
            <button key={reply} type="button" onClick={() => props.onPickCanned(reply)} className="w-full text-left min-h-11 px-3 rounded-lg text-sm text-portal-ink">{reply}</button>
          ))}
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        {props.canned.length > 0 ? (
          <button type="button" onClick={props.onToggleCanned} className="min-h-11 min-w-11 inline-flex items-center justify-center text-portal-muted" aria-label="Quick replies" title="Quick replies">
            <Zap className="w-4 h-4" />
          </button>
        ) : null}
        <textarea
          ref={ref}
          value={props.value}
          rows={1}
          onChange={(event) => props.onChange(event.target.value.slice(0, 2000))}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (!props.sending) props.onSend();
            }
          }}
          placeholder="Type a message"
          className="flex-1 bg-portal-surface border border-portal-border rounded-xl px-4 py-3 text-base text-portal-ink resize-none"
          style={{ fontSize: 16 }}
        />
        <button type="button" onClick={props.onSend} disabled={props.sending || !props.value.trim()} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-white bg-portal-accent disabled:opacity-40" aria-label="Send message" title="Send message" data-send>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
