import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Bot,
  Briefcase,
  Calendar,
  Clapperboard,
  FileText,
  Flag,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  Mail,
  Map,
  MessageSquare,
  ScrollText,
  Stethoscope,
  Store,
  Wallet,
} from 'lucide-react'

export type AdminNavItem = {
  name: string
  href: string
  icon: LucideIcon
  badge?: 'leads'
}

export const primaryNav: AdminNavItem[] = [
  { name: 'Today', href: '/admin', icon: LayoutDashboard },
  { name: 'Members', href: '/admin/members', icon: Stethoscope },
  { name: 'Applications', href: '/admin/applications', icon: FileText },
  { name: 'Coverage', href: '/admin/coverage', icon: Map },
  { name: 'Leads', href: '/admin/leads', icon: Inbox, badge: 'leads' },
  { name: 'Revenue', href: '/admin/revenue', icon: Wallet },
  { name: 'Content', href: '/admin/content', icon: Clapperboard },
  { name: 'Synapse', href: '/admin/marketplace', icon: Store },
]

export const moreNav: AdminNavItem[] = [
  { name: 'Outreach', href: '/admin/outreach', icon: Mail },
  { name: 'Reply station', href: '/admin/coverage/reply', icon: MessageSquare },
  { name: 'Mentions', href: '/admin/coverage/mentions', icon: MessageSquare },
  { name: 'Templates', href: '/admin/coverage/templates', icon: FileText },
  { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { name: 'Seminars', href: '/admin/seminars', icon: Calendar },
  { name: 'Inbox', href: '/admin/inbox', icon: Inbox },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Agents', href: '/admin/agents', icon: Bot },
  { name: 'Logs', href: '/admin/logs', icon: ScrollText },
  { name: 'Message reports', href: '/admin/message-reports', icon: Flag },
  { name: 'Patients started', href: '/admin/starts', icon: HeartPulse },
]

const contentPrefixes = ['/admin/content', '/admin/clips', '/admin/spotlight', '/admin/announcements', '/admin/content-tracker']
const leadPrefixes = ['/admin/leads', '/admin/contact-requests', '/admin/list', '/admin/referrals', '/admin/match', '/admin/stats/recommendations']
const replyPrefixes = ['/admin/coverage/work', '/admin/coverage/reply', '/admin/coverage/mentions', '/admin/coverage/templates']

export function navIsActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  if (href === '/admin/directory') return pathname === href || pathname.startsWith('/admin/directory/') || pathname.startsWith('/admin/members')
  if (href === '/admin/leads') return leadPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (href === '/admin/content') return contentPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (href === '/admin/coverage') {
    if (replyPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return false
    return pathname === '/admin/coverage' || pathname.startsWith('/admin/coverage/')
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
