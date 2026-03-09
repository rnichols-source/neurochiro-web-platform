"use client";

import { 
  MessageSquare, 
  Search, 
  Filter, 
  User, 
  ChevronRight, 
  Send, 
  MoreVertical, 
  ShieldCheck, 
  Clock,
  Mail,
  Phone,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export default function AdminInbox() {
  const [selectedThread, setSelectedStudent] = useState<any>(null);

  const threads = [
    { id: 1, user: "Dr. Patrick McDonnell", subject: "Verification Issue", lastMsg: "I've uploaded my credentials again, please check.", time: "2m ago", unread: true, type: "Verification" },
    { id: 2, user: "Sarah Miller (Student)", subject: "Mastermind Access", lastMsg: "How do I join the upcoming seminar?", time: "14m ago", unread: false, type: "Support" },
    { id: 3, user: "Dr. Keitza Garavito", subject: "Billing Query", lastMsg: "I need to update my clinic's payment method.", time: "1h ago", unread: false, type: "Billing" },
  ];

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden">
      {/* Thread List */}
      <div className="w-full lg:w-96 border-r border-white/5 flex flex-col bg-[#0A0D14]">
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
        
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {threads.map((thread) => (
            <div 
              key={thread.id}
              onClick={() => setSelectedStudent(thread)}
              className={`p-6 cursor-pointer transition-all hover:bg-white/5 ${selectedThread?.id === thread.id ? 'bg-white/5 border-l-4 border-neuro-orange' : ''}`}
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

      {/* Chat View */}
      <div className="flex-1 flex flex-col bg-[#020617] relative">
        {selectedThread ? (
          <>
            <header className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-neuro-navy flex items-center justify-center text-neuro-orange font-black text-xl shadow-lg border border-white/10">
                  {selectedThread.user[4]}
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    {selectedThread.user} 
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                  </h3>
                  <p className="text-xs text-gray-500">Active conversation about {selectedThread.subject}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"><Phone className="w-4 h-4" /></button>
                <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"><Mail className="w-4 h-4" /></button>
                <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"><MoreVertical className="w-4 h-4" /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {/* Message Feed Container */}
              <div className="flex flex-col gap-6">
                <div className="max-w-[70%] bg-white/5 border border-white/5 rounded-3xl p-6 rounded-tl-none">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Hello Admin, I've been trying to update my clinical profile but the verification badge isn't appearing. I've uploaded my latest credentials.
                  </p>
                  <span className="text-[10px] text-gray-600 font-bold mt-4 block">10:42 AM</span>
                </div>
                
                <div className="max-w-[70%] bg-neuro-orange text-white rounded-3xl p-6 rounded-tr-none self-end shadow-xl shadow-neuro-orange/10">
                  <p className="text-sm font-medium leading-relaxed">
                    Checking that for you now, Dr. {selectedThread.user.split(' ')[1]}. It looks like the image was slightly blurry. Can you re-upload the PDF version?
                  </p>
                  <span className="text-[10px] text-white/60 font-black mt-4 block uppercase tracking-widest text-right">Sent • Just now</span>
                </div>
              </div>
            </div>

            <footer className="p-6 bg-white/[0.02] border-t border-white/5">
              <div className="relative">
                <textarea 
                  placeholder="Type your secure response..."
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-5 pr-20 text-sm focus:outline-none focus:border-neuro-orange text-white resize-none h-32"
                />
                <button className="absolute bottom-4 right-4 bg-neuro-orange p-4 rounded-2xl text-white shadow-xl hover:bg-neuro-orange-light transition-all active:scale-95">
                  <Send className="w-5 h-5" />
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
