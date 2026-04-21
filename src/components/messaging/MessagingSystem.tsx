"use client";

import {
  MessageSquare,
  Search,
  ChevronLeft,
  Send,
  MoreVertical,
  Plus,
  X,
  Check,
  CheckCheck,
  Zap,
  Loader2,
  User as UserIcon,
  Archive,
  Flag,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Profile {
  id: string;
  full_name: string;
  role: string;
  clinic_name?: string;
}

interface Conversation {
  id: string;
  otherUser: Profile;
  last_message_at: string;
  lastMessagePreview?: string;
  isTemp?: boolean;
  unreadCount: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at?: string | null;
}

interface MessagingSystemProps {
  currentUserId: string;
  userRole: string;
  initialOtherUserId?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANNED_REPLIES: Record<string, string[]> = {
  doctor: [
    "Yes, we are currently accepting new patients.",
    "Please call our office to schedule.",
    "I'd be happy to discuss further. What times work?",
    "Thank you for reaching out!",
  ],
  student: [
    "Thank you for the interview opportunity!",
    "I'd love to learn more about the position.",
    "Would it be possible to shadow for a day?",
    "I'm very interested in your practice.",
  ],
  patient: [
    "I need to reschedule my appointment.",
    "Question about my care plan.",
    "Running a few minutes late.",
    "Thank you for the great visit!",
  ],
};

const ROLE_COLORS: Record<string, string> = {
  doctor: "#1a2744",
  student: "#e97325",
  admin: "#22c55e",
  team: "#22c55e",
  patient: "#64748b",
};

const FILTER_TABS = ["All", "Doctors", "Students", "Team"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const FILTER_ROLE_MAP: Record<FilterTab, string | null> = {
  All: null,
  Doctors: "doctor",
  Students: "student",
  Team: "admin",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roleColor(role: string): string {
  return ROLE_COLORS[role] || ROLE_COLORS.patient;
}

function initials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (then >= yesterdayStart.getTime() && then < todayStart.getTime()) return "Yesterday";

  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function dateSeparatorLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (d.getTime() >= todayStart.getTime()) return "Today";
  if (d.getTime() >= yesterdayStart.getTime()) return "Yesterday";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function truncate(str: string, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

function linkify(text: string) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlPattern);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function profileLink(role: string, userId: string): string {
  if (role === "doctor") return `/doctor/profile/${userId}`;
  if (role === "student") return `/student/profile/${userId}`;
  return "#";
}

function groupMessagesByDate(msgs: Message[]): { label: string; messages: Message[] }[] {
  const groups: { label: string; messages: Message[] }[] = [];
  let currentLabel = "";
  for (const msg of msgs) {
    const label = dateSeparatorLabel(msg.created_at);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MessagingSystem({
  currentUserId,
  userRole,
  initialOtherUserId,
}: MessagingSystemProps) {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("All");
  const [convSearchQuery, setConvSearchQuery] = useState("");
  const [showCannedReplies, setShowCannedReplies] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Compose
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const convSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  // -----------------------------------------------------------------------
  // Mobile detection
  // -----------------------------------------------------------------------
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // -----------------------------------------------------------------------
  // Auto-resize textarea
  // -----------------------------------------------------------------------
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxRows = 4;
    const lineHeight = 24;
    const maxH = lineHeight * maxRows;
    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
  }, [newMessage]);

  // -----------------------------------------------------------------------
  // Scroll to bottom
  // -----------------------------------------------------------------------
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // -----------------------------------------------------------------------
  // Fetch conversations
  // -----------------------------------------------------------------------
  const fetchConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          id,
          last_message_at,
          participant_one:profiles!participant_one_id(id, full_name, role),
          participant_two:profiles!participant_two_id(id, full_name, role)
        `
        )
        .or(`participant_one_id.eq.${currentUserId},participant_two_id.eq.${currentUserId}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Fetch last message preview + unread counts in one query per conversation
      const formatted: Conversation[] = await Promise.all(
        (data || []).map(async (conv: any) => {
          const otherUser =
            conv.participant_one?.id === currentUserId ? conv.participant_two : conv.participant_one;

          // Get last message preview
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("body")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("recipient_id", currentUserId)
            .is("read_at", null);

          return {
            id: conv.id,
            otherUser: otherUser || { id: "", full_name: "Unknown", role: "patient" },
            last_message_at: conv.last_message_at,
            lastMessagePreview: lastMsg?.body || "",
            unreadCount: count || 0,
          };
        })
      );

      setConversations(formatted);
      return formatted;
    } catch (err) {
      console.error("Error fetching conversations:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [supabase, currentUserId]);

  // -----------------------------------------------------------------------
  // Fetch messages for a conversation
  // -----------------------------------------------------------------------
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      setMessagesLoading(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages((data as Message[]) || []);

        // Mark unread messages as read
        const unread = data?.filter(
          (m: any) => m.recipient_id === currentUserId && !m.read_at
        );
        if (unread && unread.length > 0) {
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .in(
              "id",
              unread.map((m: any) => m.id)
            );
        }

        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setMessagesLoading(false);
      }
    },
    [supabase, currentUserId, scrollToBottom]
  );

  // -----------------------------------------------------------------------
  // Initial load + realtime subscription on conversations
  // -----------------------------------------------------------------------
  useEffect(() => {
    fetchConversations().then(async (fetched) => {
      if (initialOtherUserId && fetched) {
        const existing = fetched.find((c) => c.otherUser.id === initialOtherUserId);
        if (existing) {
          setSelectedConversation(existing);
        } else {
          const { data: otherUser } = await supabase
            .from("profiles")
            .select("id, full_name, role")
            .eq("id", initialOtherUserId)
            .single();
          if (otherUser) {
            const tempConv: Conversation = {
              id: "temp-" + Date.now(),
              otherUser: otherUser as Profile,
              last_message_at: new Date().toISOString(),
              isTemp: true,
              unreadCount: 0,
            };
            setConversations((prev) => [tempConv, ...prev]);
            setSelectedConversation(tempConv);
          }
        }
      }
    });

    const convChannel = supabase
      .channel("conversations_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Realtime subscription on messages for selected conversation
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (selectedConversation && !selectedConversation.isTemp) {
      fetchMessages(selectedConversation.id);

      const msgChannel = supabase
        .channel(`messages_${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload: any) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // Mark as read if we are the recipient
            if (newMsg.recipient_id === currentUserId) {
              supabase
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", newMsg.id)
                .then();
            }

            setTimeout(scrollToBottom, 100);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(msgChannel);
      };
    } else if (selectedConversation?.isTemp) {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id]);

  // -----------------------------------------------------------------------
  // Realtime: bump unread for non-selected conversations
  // -----------------------------------------------------------------------
  useEffect(() => {
    const globalMsgChannel = supabase
      .channel("global_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          const msg = payload.new;
          if (msg.recipient_id !== currentUserId) return;
          if (selectedConversation && msg.conversation_id === selectedConversation.id) return;

          setConversations((prev) =>
            prev.map((c) =>
              c.id === msg.conversation_id
                ? {
                    ...c,
                    unreadCount: c.unreadCount + 1,
                    lastMessagePreview: msg.body || c.lastMessagePreview,
                    last_message_at: msg.created_at || c.last_message_at,
                  }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalMsgChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id, currentUserId]);

  // -----------------------------------------------------------------------
  // Send message
  // -----------------------------------------------------------------------
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    if (newMessage.length > 500) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setShowCannedReplies(false);

    try {
      let convId = selectedConversation.id;

      if (selectedConversation.isTemp) {
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            participant_one_id: currentUserId,
            participant_two_id: selectedConversation.otherUser.id,
          })
          .select()
          .single();

        if (convError) {
          // Try to find existing
          const { data: existing } = await supabase
            .from("conversations")
            .select("*")
            .or(
              `participant_one_id.eq.${currentUserId},participant_two_id.eq.${currentUserId}`
            )
            .or(
              `participant_one_id.eq.${selectedConversation.otherUser.id},participant_two_id.eq.${selectedConversation.otherUser.id}`
            )
            .single();

          if (existing) {
            convId = existing.id;
          } else {
            throw convError;
          }
        } else {
          convId = newConv.id;
        }

        const updatedConv = { ...selectedConversation, id: convId, isTemp: false };
        setSelectedConversation(updatedConv);
        fetchConversations();
      }

      const { error } = await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: currentUserId,
        recipient_id: selectedConversation.otherUser.id,
        body: messageText,
      });

      if (error) throw error;

      if (selectedConversation.isTemp) {
        fetchMessages(convId);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setNewMessage(messageText);
    }
  };

  // -----------------------------------------------------------------------
  // User search (compose)
  // -----------------------------------------------------------------------
  const handleSearchUsers = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .neq("id", currentUserId)
          .ilike("full_name", `%${query}%`)
          .limit(8);

        if (data) setSearchResults(data as unknown as Profile[]);
      } catch {
        // ignore
      }
      setSearching(false);
    },
    [supabase, currentUserId]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) handleSearchUsers(searchQuery);
      else setSearchResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearchUsers]);

  // -----------------------------------------------------------------------
  // Start new conversation
  // -----------------------------------------------------------------------
  const startNewConversation = (otherUser: Profile) => {
    const existing = conversations.find((c) => c.otherUser.id === otherUser.id);
    if (existing) {
      setSelectedConversation(existing);
    } else {
      const tempConv: Conversation = {
        id: "temp-" + Date.now(),
        otherUser,
        last_message_at: new Date().toISOString(),
        isTemp: true,
        unreadCount: 0,
      };
      setConversations((prev) => [tempConv, ...prev]);
      setSelectedConversation(tempConv);
    }
    setIsComposeOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // -----------------------------------------------------------------------
  // Select conversation
  // -----------------------------------------------------------------------
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowCannedReplies(false);
    setShowMoreMenu(false);
    // Clear unread locally
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  // -----------------------------------------------------------------------
  // Filter & search conversations
  // -----------------------------------------------------------------------
  const filteredConversations = conversations
    .filter((c) => {
      const roleFilter = FILTER_ROLE_MAP[filterTab];
      if (roleFilter && c.otherUser.role !== roleFilter) return false;
      return true;
    })
    .filter((c) => {
      if (!convSearchQuery.trim()) return true;
      return c.otherUser.full_name
        ?.toLowerCase()
        .includes(convSearchQuery.toLowerCase());
    });

  // Debounced conversation search
  const handleConvSearchChange = (val: string) => {
    if (convSearchTimerRef.current) clearTimeout(convSearchTimerRef.current);
    convSearchTimerRef.current = setTimeout(() => {
      setConvSearchQuery(val);
    }, 300);
  };

  // Unread counts per tab
  const unreadByTab = (tab: FilterTab): number => {
    const roleFilter = FILTER_ROLE_MAP[tab];
    return conversations
      .filter((c) => (!roleFilter ? true : c.otherUser.role === roleFilter))
      .reduce((sum, c) => sum + c.unreadCount, 0);
  };

  // -----------------------------------------------------------------------
  // Render: Avatar
  // -----------------------------------------------------------------------
  function renderAvatar(name: string, role: string, size: "sm" | "md" | "lg" = "md") {
    const sizeClasses = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
        style={{ backgroundColor: roleColor(role) }}
      >
        {initials(name)}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Role pill
  // -----------------------------------------------------------------------
  function renderRolePill(role: string) {
    return (
      <span
        className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
        style={{
          backgroundColor: roleColor(role) + "22",
          color: roleColor(role),
        }}
      >
        {role}
      </span>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Left panel
  // -----------------------------------------------------------------------
  function renderLeftPanel() {
    return (
      <div
        className={`${
          isMobile && selectedConversation ? "hidden" : "flex"
        } w-full md:w-80 border-r border-gray-200 flex-col bg-white h-full`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Messages</h1>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#e97325" }}
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Search conversations..."
              onChange={(e) => handleConvSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {FILTER_TABS.map((tab) => {
              const count = unreadByTab(tab);
              const active = filterTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#e97325] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {tab}
                  {count > 0 && (
                    <span
                      className={`text-[10px] min-w-[16px] h-4 flex items-center justify-center rounded-full font-bold ${
                        active ? "bg-white/30 text-white" : "bg-[#e97325] text-white"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">No conversations yet</p>
              <button
                onClick={() => setIsComposeOpen(true)}
                className="text-sm font-medium mt-2 px-4 py-1.5 rounded-full transition-colors hover:opacity-90"
                style={{ backgroundColor: "#e97325", color: "white" }}
              >
                Start a conversation
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              const hasUnread = conv.unreadCount > 0;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-3 px-4 cursor-pointer transition-all hover:bg-gray-50 ${
                    isMobile ? "py-4" : "py-3"
                  } ${
                    isSelected
                      ? "bg-orange-50 border-l-[3px] border-l-[#e97325]"
                      : "border-l-[3px] border-l-transparent"
                  }`}
                >
                  <div className="relative">
                    {renderAvatar(conv.otherUser.full_name, conv.otherUser.role)}
                    {hasUnread && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#e97325]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-sm truncate ${
                          hasUnread ? "font-bold text-gray-900" : "font-medium text-gray-800"
                        }`}
                      >
                        {conv.otherUser.full_name || "User"}
                      </span>
                      <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                        {relativeTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {renderRolePill(conv.otherUser.role)}
                      <span className="text-xs text-gray-400 truncate">
                        {truncate(conv.lastMessagePreview || "", 50)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Chat header
  // -----------------------------------------------------------------------
  function renderChatHeader() {
    if (!selectedConversation) return null;
    const { otherUser } = selectedConversation;
    return (
      <header className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={() => {
                setSelectedConversation(null);
                setShowMoreMenu(false);
              }}
              className="p-1 -ml-1 text-gray-500 hover:text-gray-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {renderAvatar(otherUser.full_name, otherUser.role)}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">
                {otherUser.full_name || "User"}
              </h3>
              {renderRolePill(otherUser.role)}
            </div>
            <a
              href={profileLink(otherUser.role, otherUser.id)}
              className="text-[11px] text-[#e97325] hover:underline"
            >
              View Profile
            </a>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30"
              >
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  <Archive className="w-4 h-4" /> Archive
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  <X className="w-4 h-4" /> Block
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                  <Flag className="w-4 h-4" /> Report
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Messages area
  // -----------------------------------------------------------------------
  function renderMessagesArea() {
    if (messagesLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      );
    }

    const groups = groupMessagesByDate(messages);

    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" onClick={() => setShowMoreMenu(false)}>
        {messages.length === 0 && !selectedConversation?.isTemp && (
          <div className="text-center text-gray-400 text-sm py-8">
            No messages yet. Say hello!
          </div>
        )}
        {selectedConversation?.isTemp && messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            Start a conversation with {selectedConversation.otherUser.full_name}
          </div>
        )}

        {groups.map((group) => (
          <div key={group.label}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] font-medium text-gray-400">{group.label}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Messages in group */}
            <div className="space-y-2">
              {group.messages.map((msg) => {
                const isMine = msg.sender_id === currentUserId;
                const isSystem = msg.body?.startsWith("[SYSTEM]");

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center py-1">
                      <span className="text-xs text-gray-400 italic">
                        {msg.body.replace("[SYSTEM]", "").trim()}
                      </span>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[65%] px-4 py-2.5 ${
                        isMine
                          ? "bg-[#1a2744] text-white rounded-2xl rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {linkify(msg.body)}
                      </p>
                      <div
                        className={`flex items-center gap-1 mt-1 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span
                          className={`text-[10px] ${
                            isMine ? "text-white/50" : "text-gray-400"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMine &&
                          (msg.read_at ? (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Check className="w-3 h-3 text-white/40" />
                          ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Input area
  // -----------------------------------------------------------------------
  function renderInputArea() {
    if (!selectedConversation) return null;

    const cannedList = CANNED_REPLIES[userRole] || [];
    const charCount = newMessage.length;

    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3 shrink-0">
        {/* Canned replies dropdown */}
        <AnimatePresence>
          {showCannedReplies && cannedList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="mb-2 bg-gray-50 border border-gray-200 rounded-xl p-2 space-y-1"
            >
              {cannedList.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setNewMessage(reply);
                    setShowCannedReplies(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-white hover:shadow-sm transition-all"
                >
                  {reply}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          {/* Canned replies button */}
          {cannedList.length > 0 && (
            <button
              onClick={() => setShowCannedReplies(!showCannedReplies)}
              className={`p-2 rounded-lg transition-colors shrink-0 ${
                showCannedReplies
                  ? "bg-orange-100 text-[#e97325]"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
              title="Quick replies"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setNewMessage(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent text-gray-900 placeholder:text-gray-400 resize-none overflow-hidden"
              style={{ minHeight: "40px" }}
            />
            {charCount > 400 && (
              <span
                className={`absolute bottom-1 right-2 text-[10px] ${
                  charCount >= 500 ? "text-red-500" : "text-gray-400"
                }`}
              >
                {charCount}/500
              </span>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2.5 rounded-xl text-white transition-all disabled:opacity-40 shrink-0 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#e97325" }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: No conversation selected
  // -----------------------------------------------------------------------
  function renderEmptyChat() {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <MessageSquare className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Your Messages</h3>
        <p className="text-gray-400 text-sm max-w-xs">
          Select a conversation or start a new one
        </p>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Right panel
  // -----------------------------------------------------------------------
  function renderRightPanel() {
    return (
      <div
        className={`${
          isMobile && !selectedConversation ? "hidden" : "flex"
        } flex-1 flex-col bg-white h-full`}
      >
        {selectedConversation ? (
          <>
            {renderChatHeader()}
            {renderMessagesArea()}
            {renderInputArea()}
          </>
        ) : (
          renderEmptyChat()
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Compose overlay
  // -----------------------------------------------------------------------
  function renderComposeOverlay() {
    const suggestedText =
      userRole === "doctor"
        ? "Search for students, other doctors, or the NeuroChiro team"
        : userRole === "student"
        ? "Search for doctors, other students, or the NeuroChiro team"
        : "Search for doctors, students, or the NeuroChiro team";

    return (
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsComposeOpen(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-gray-900">New Message</h3>
                  <button
                    onClick={() => {
                      setIsComposeOpen(false);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto p-3">
                {searching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => startNewConversation(user)}
                        className="w-full p-3 hover:bg-gray-50 rounded-xl transition-all text-left flex items-center gap-3 group"
                      >
                        {renderAvatar(user.full_name, user.role, "sm")}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.full_name}
                            </p>
                            {renderRolePill(user.role)}
                          </div>
                          {user.clinic_name && (
                            <p className="text-xs text-gray-400 truncate">{user.clinic_name}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="py-8 text-center">
                    <UserIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No users found</p>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium mb-1">Suggested</p>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">{suggestedText}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------
  return (
    <div className="flex h-[calc(100vh-10rem)] md:h-[80vh] bg-white border border-gray-200 rounded-2xl overflow-hidden relative shadow-sm">
      {renderLeftPanel()}
      {renderRightPanel()}
      {renderComposeOverlay()}
    </div>
  );
}
