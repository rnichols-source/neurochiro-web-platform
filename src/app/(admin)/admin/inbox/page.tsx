"use client";

import { 
  MessageSquare, 
  Search, 
  Filter, 
  User, 
  ChevronLeft, 
  Send, 
  MoreVertical, 
  ShieldCheck, 
  Clock,
  Mail,
  Phone,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminInbox() {
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize to detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const threads = [
    { id: 1, user: "Dr. Patrick McDonnell", subject: "Verification Issue", lastMsg: "I've uploaded my credentials again, please check.", time: "2m ago", unread: true, type: "Verification" },
    { id: 2, user: "Sarah Miller (Student)", subject: "Mastermind Access", lastMsg: "How do I join the upcoming seminar?", time: "14m ago", unread: false, type: "Support" },
    { id: 3, user: "Dr. Keitza Garavito", subject: "Billing Query", lastMsg: "I need to update my clinic's payment method.", time: "1h ago", unread: false, type: "Billing" },
  ];

  const handleBack = () => {
    setSelectedThread(null);
  };

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden relative">
      {/* Thread List - Hidden on mobile if a thread is selected */}
      <div className={`
        ${isMobile && selectedThread ? 'hidden' : 'flex'}
        w-full lg:w-96 border-r border-white/5 flex-col bg-[#0A0D14] h-full
      `}>
        <div className="p-6 border-b border-white/5 space-y-4">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-neuro-orange" /> Communication
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-neuro-orange text-white" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 pb-20">
          {threads.map((thread) => (
            <div 
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className={`p-6 cursor-pointer transition-all hover:bg-white/5 active:bg-white/10 ${selectedThread?.id === thread.id ? 'bg-white/5 border-l-4 border-neuro-orange' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-neuro-orange">{thread.type}</span>
                <span className="text-[10px] text-gray-500 font-bold">{thread.time}</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <p className={`text-sm font-bold ${thread.unread ? 'text-white' : 'text-gray-300'}`}>{thread.user}</p>
                {thread.unread && <div className="w-2 h-2 bg-neuro-orange rounded-full" />}
              </div>
              <p className="text-xs text-white font-medium mb-1 truncate">{thread.subject}</p>
              <p className="text-xs text-gray-500 truncate">{thread.lastMsg}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat View - Full width on mobile, right side on desktop */}
      <div className={`
        ${isMobile && !selectedThread ? 'hidden' : 'flex'}
        flex-1 flex-col bg-[#020617] h-full relative z-10
      `}>
        {selectedThread ? (
          <>
            <header className="p-4 lg:p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center gap-3 lg:gap-4">
                {isMobile && (
                  <button 
                    onClick={handleBack}
                    className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                    aria-label="Back to conversations"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-neuro-navy flex items-center justify-center text-neuro-orange font-black text-lg lg:text-xl shadow-lg border border-white/10 shrink-0">
                  {selectedThread.user[selectedThread.user.startsWith('Dr.') ? 4 : 0]}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm lg:text-base truncate">
                    {selectedThread.user} 
                    <ShieldCheck className="w-3 h-3 lg:w-4 lg:h-4 text-blue-500 shrink-0" />
                  </h3>
                  <p className="text-[10px] lg:text-xs text-gray-500 truncate">{selectedThread.subject}</p>
                </div>
              </div>
              <div className="flex gap-1 lg:gap-2 shrink-0">
                <button className="p-2 lg:p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"><Phone className="w-4 h-4" /></button>
                {!isMobile && (
                  <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"><Mail className="w-4 h-4" /></button>
                )}
                <button className="p-2 lg:p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"><MoreVertical className="w-4 h-4" /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-8 scroll-smooth">
              <div className="flex flex-col gap-6">
                <div className="max-w-[85%] lg:max-w-[70%] bg-white/5 border border-white/5 rounded-3xl p-4 lg:p-6 rounded-tl-none">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Hello Admin, I've been trying to update my clinical profile but the verification badge isn't appearing. I've uploaded my latest credentials.
                  </p>
                  <span className="text-[10px] text-gray-600 font-bold mt-4 block">10:42 AM</span>
                </div>
                
                <div className="max-w-[85%] lg:max-w-[70%] bg-neuro-orange text-white rounded-3xl p-4 lg:p-6 rounded-tr-none self-end shadow-xl shadow-neuro-orange/10">
                  <p className="text-sm font-medium leading-relaxed">
                    Checking that for you now, Dr. {selectedThread.user.includes(' ') ? selectedThread.user.split(' ').pop() : selectedThread.user}. It looks like the image was slightly blurry. Can you re-upload the PDF version?
                  </p>
                  <span className="text-[10px] text-white/60 font-black mt-4 block uppercase tracking-widest text-right">Sent • Just now</span>
                </div>
              </div>
            </div>

            <footer className="p-4 lg:p-6 bg-white/[0.02] border-t border-white/5 sticky bottom-0 z-20 backdrop-blur-md">
              <div className="relative">
                <textarea 
                  placeholder="Type your secure response..."
                  className="w-full bg-white/5 border border-white/10 rounded-3xl lg:rounded-[2rem] px-6 lg:px-8 py-4 lg:py-5 pr-16 lg:pr-20 text-sm focus:outline-none focus:border-neuro-orange text-white resize-none h-20 lg:h-32"
                />
                <button className="absolute bottom-3 right-3 lg:bottom-4 lg:right-4 bg-neuro-orange p-3 lg:p-4 rounded-2xl text-white shadow-xl hover:bg-neuro-orange-light transition-all active:scale-95">
                  <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-gray-700 mb-6 border border-white/5">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Secure Inbox</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
              Select a conversation from the sidebar to manage platform communication and user support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
