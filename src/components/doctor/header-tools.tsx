'use client'

import Link from 'next/link'
import NotificationBell from '@/components/layout/NotificationBell'
import { MessagesIcon } from '@/components/doctor/icons'
import { usePortal } from '@/components/portal/PortalProvider'

export function HeaderTools({ onDark = true }: { onDark?: boolean }) {
  const ctx = usePortal()
  const count = ctx.unreadMessages
  const label = count > 0 ? `Messages, ${count} unread` : 'Messages'
  return (
    <div className="flex items-center gap-2">
      <NotificationBell
        unreadOverride={ctx.unreadNotifications}
        includeAnnouncements={false}
        variant={onDark ? 'dark' : 'light'}
        viewAllHref="/doctor/notifications"
      />
      <Link prefetch
        href="/doctor/messages"
        aria-label={label}
        title={label}
        data-messages-badge={count}
        className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/20 text-white"
        style={onDark ? undefined : { background: '#F5F3EF', color: '#1E2D3B' }}
      >
        <MessagesIcon />
        {count > 0 ? (
          <span className="dp-ui absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#D66829] px-1 text-[11px] font-extrabold text-white">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </Link>
    </div>
  )
}
