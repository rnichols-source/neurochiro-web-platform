export type Person = { id: string; full_name: string; role: string };

export type InboxItem = {
  id: string;
  otherUser: Person;
  last_message_at: string;
  lastMessagePreview: string;
  unreadCount: number;
  contextType: string | null;
  contextId: string | null;
  referralChip: { label: string; href: string } | null;
  isTemp?: boolean;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  message_type: string;
  deleted_at: string | null;
  client_message_id: string | null;
  pending?: boolean;
  failed?: boolean;
  error?: string;
};
