"use client";

import { 
  MessageSquare, 
  Search, 
  ChevronLeft, 
  Send, 
  MoreVertical, 
  ShieldCheck, 
  AlertCircle,
  Check,
  CheckCheck,
  Zap,
  Plus,
  X,
  User as UserIcon,
  Loader2
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function MessagingSystem({ currentUserId, userRole, initialOtherUserId }: { currentUserId: string, userRole: string, initialOtherUserId?: string }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Compose States
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const doctorCannedReplies = [
    "Yes, we are currently accepting new patients.",
    "Please call our office to schedule an appointment.",
    "I focus specifically on neurologically-based care."
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id, 
          last_message_at,
          participant_one:profiles!participant_one_id(id, full_name, role),
          participant_two:profiles!participant_two_id(id, full_name, role)
        `)
        .or(`participant_one_id.eq.${currentUserId},participant_two_id.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      const formatted = data.map((conv: any) => {
        const otherUser = conv.participant_one.id === currentUserId ? conv.participant_two : conv.participant_one;
        return {
          id: conv.id,
          otherUser,
          last_message_at: conv.last_message_at
        };
      });
      
      setConversations(formatted);
      return formatted;
    } catch (err) {
      console.error("Error fetching conversations:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [supabase, currentUserId]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      const unreadMessages = data?.filter((m: any) => m.recipient_id === currentUserId && !m.read_at);
      if (unreadMessages && unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map((m: any) => m.id));
      }
      
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, [supabase, currentUserId]);

  useEffect(() => {
    fetchConversations().then(async (fetchedConvs) => {
      if (initialOtherUserId && fetchedConvs) {
        let existingConv = fetchedConvs.find((c: any) => c.otherUser.id === initialOtherUserId);
        if (existingConv) {
          setSelectedConversation(existingConv);
        } else {
          const { data: otherUser } = await supabase.from('profiles').select('id, full_name, role').eq('id', initialOtherUserId).single();
          if (otherUser) {
            const tempConv = {
              id: 'temp-' + Date.now(),
              otherUser: otherUser,
              last_message_at: new Date().toISOString(),
              isTemp: true
            };
            setConversations(prev => [tempConv, ...prev]);
            setSelectedConversation(tempConv);
          }
        }
      }
    });
    
    const convChannel = supabase
      .channel('conversations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
    };
  }, [fetchConversations, initialOtherUserId, supabase]);

  useEffect(() => {
    if (selectedConversation && !selectedConversation.isTemp) {
      fetchMessages(selectedConversation.id);
      
      const msgChannel = supabase
        .channel(`messages_${selectedConversation.id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          }, 
          (payload: any) => {
            setMessages(prev => [...prev, payload.new]);
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
  }, [selectedConversation, fetchMessages, supabase]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageText = newMessage;
    setNewMessage("");

    try {
      let convId = selectedConversation.id;

      if (selectedConversation.isTemp) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            participant_one_id: currentUserId,
            participant_two_id: selectedConversation.otherUser.id,
          })
          .select()
          .single();

        if (convError) {
          const { data: existing } = await supabase
            .from('conversations')
            .select('*')
            .or(`participant_one_id.eq.${currentUserId},participant_two_id.eq.${currentUserId}`)
            .or(`participant_one_id.eq.${selectedConversation.otherUser.id},participant_two_id.eq.${selectedConversation.otherUser.id}`)
            .single();
            
          if (existing) {
             convId = existing.id;
          } else {
             throw convError;
          }
        } else {
          convId = newConv.id;
        }

        setSelectedConversation({ ...selectedConversation, id: convId, isTemp: false });
        fetchConversations();
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_id: currentUserId,
          recipient_id: selectedConversation.otherUser.id,
          body: messageText
        });

      if (error) throw error;
      
      if (selectedConversation.isTemp) {
        fetchMessages(convId);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleBack = () => setSelectedConversation(null);

  const handleSearchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .neq('id', currentUserId)
      .ilike('full_name', `%${query}%`)
      .limit(5);
    
    if (data) setSearchResults(data);
    setSearching(false);
  }, [supabase, currentUserId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) handleSearchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearchUsers]);

  const startNewConversation = (otherUser: any) => {
    let existing = conversations.find(c => c.otherUser.id === otherUser.id);
    if (existing) {
      setSelectedConversation(existing);
    } else {
      const tempConv = {
        id: 'temp-' + Date.now(),
        otherUser: otherUser,
        last_message_at: new Date().toISOString(),
        isTemp: true
      };
      setConversations(prev => [tempConv, ...prev]);
      setSelectedConversation(tempConv);
    }
    setIsComposeOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] lg:h-[80vh] bg-[#020617] border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl">
      {/* Thread List */}
      <div className={`
        ${isMobile && selectedConversation ? 'hidden' : 'flex'}
        w-full lg:w-96 border-r border-white/5 flex-col bg-[#0A0D14] h-full
      `}>
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-neuro-orange" /> Messages
            </h1>
            <button 
              onClick={() => setIsComposeOpen(true)}
              className="p-2 bg-neuro-orange hover:bg-neuro-orange-light text-white rounded-xl shadow-lg shadow-neuro-orange/20 transition-all active:scale-95"
              title="Compose Message"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-neuro-orange text-white" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {loading ? (
             <div className="p-6 text-center text-gray-500 text-sm">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No messages yet.</div>
          ) : conversations.map((conv) => (
            <div 
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`p-5 cursor-pointer transition-all hover:bg-white/5 active:bg-white/10 ${selectedConversation?.id === conv.id ? 'bg-white/5 border-l-4 border-neuro-orange' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-neuro-orange">{conv.otherUser.role}</span>
                <span className="text-[10px] text-gray-500">{new Date(conv.last_message_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm font-bold text-white mb-1 truncate">{conv.otherUser.full_name || 'User'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat View */}
      <div className={`
        ${isMobile && !selectedConversation ? 'hidden' : 'flex'}
        flex-1 flex-col bg-[#020617] h-full relative
      `}>
        {selectedConversation ? (
          <>
            <header className="p-4 lg:p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <button onClick={handleBack} className="p-2 -ml-2 text-gray-400 hover:text-white">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                <div className="w-10 h-10 rounded-2xl bg-neuro-navy flex items-center justify-center text-neuro-orange font-black text-lg shadow-lg border border-white/10 shrink-0">
                  {(selectedConversation.otherUser.full_name || 'U').charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm truncate">
                    {selectedConversation.otherUser.full_name || 'User'}
                    {selectedConversation.otherUser.role === 'doctor' && <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0" />}
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{selectedConversation.otherUser.role}</p>
                </div>
              </div>
              <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white">
                <MoreVertical className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 flex flex-col">
              {messages.map((msg) => {
                const isMine = msg.sender_id === currentUserId;
                return (
                  <div 
                    key={msg.id}
                    className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl ${
                      isMine 
                        ? 'bg-neuro-orange text-white rounded-tr-none self-end shadow-lg shadow-neuro-orange/20' 
                        : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none self-start'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                    <div className={`flex items-center gap-1 mt-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[10px] ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      {isMine && (
                        msg.read_at ? 
                          <CheckCheck className="w-3 h-3 text-white" /> : 
                          <Check className="w-3 h-3 text-white/50" />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 bg-white/[0.02] border-t border-white/5">
              {userRole === 'doctor' && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
                  {doctorCannedReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => setNewMessage(reply)}
                      className="whitespace-nowrap px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] text-gray-300 font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Zap className="w-3 h-3 text-neuro-orange" /> {reply}
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-16 text-sm focus:outline-none focus:border-neuro-orange text-white resize-none h-14 overflow-hidden"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="absolute bottom-2 right-2 bg-neuro-orange p-2.5 rounded-xl text-white shadow-lg hover:bg-neuro-orange-light transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-600 mb-6">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Your Messages</h3>
            <p className="text-gray-500 max-w-xs text-sm">
              Select a conversation from the sidebar to view or send messages.
            </p>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsComposeOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0D14] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">New Message</h3>
                  <button onClick={() => setIsComposeOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name..." 
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-neuro-orange text-white" 
                  />
                </div>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                {searching ? (
                  <div className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => startNewConversation(user)}
                        className="w-full p-4 hover:bg-white/5 rounded-2xl transition-all text-left flex items-center gap-4 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-neuro-navy flex items-center justify-center text-neuro-orange font-black group-hover:scale-110 transition-transform">
                          {user.full_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{user.full_name}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user.role}</p>
                        </div>
                        <Plus className="w-4 h-4 text-gray-600 group-hover:text-neuro-orange transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">No users found.</div>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm italic">Type at least 2 characters to search.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
