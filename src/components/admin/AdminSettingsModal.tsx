"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  User, 
  Lock, 
  Shield, 
  Bell, 
  Globe, 
  History, 
  Settings,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Eye,
  LogOut,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmergencyLockdown: () => void;
}

export default function AdminSettingsModal({ isOpen, onClose, onEmergencyLockdown }: AdminSettingsModalProps) {
  const [activeTab, setActiveTab] = useState("Profile");

  const tabs = [
    { name: "Profile", icon: User },
    { name: "Security", icon: Lock },
    { name: "Permissions", icon: Shield },
    { name: "Notifications", icon: Bell },
    { name: "Regional Access", icon: Globe },
    { name: "Audit Logs", icon: History },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 backdrop-blur-xl bg-black/60">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0A0D14] rounded-2xl w-full max-w-5xl h-[80vh] shadow-2xl overflow-hidden border border-white/10 flex"
        >
          {/* Sidebar */}
          <div className="w-64 border-r border-white/5 bg-white/[0.02] p-8 hidden md:flex flex-col">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-neuro-orange flex items-center justify-center text-white shadow-lg">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">Settings</h3>
            </div>

            <nav className="space-y-2 flex-1">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.name 
                      ? "bg-white/10 text-white shadow-sm" 
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.name ? "text-neuro-orange" : ""}`} />
                  {tab.name}
                </button>
              ))}
            </nav>

            <button 
              onClick={onEmergencyLockdown}
              className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all border border-red-500/20"
            >
              <AlertTriangle className="w-4 h-4" />
              Lockdown
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">{activeTab}</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your administrative {activeTab.toLowerCase()} settings.</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500">
                <X className="w-8 h-8" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === "Profile" && (
                <div className="space-y-10">
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-neuro-navy border-4 border-white/10 flex items-center justify-center text-neuro-orange text-4xl font-black shadow-2xl">
                      RN
                    </div>
                    <div className="space-y-3">
                      <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase text-white hover:bg-white/10 transition-all">
                        Change Avatar
                      </button>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Recommended: 400x400 PNG</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Display Name</label>
                      <input className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-neuro-orange transition-all" defaultValue="Raymond Nichols" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Admin Email</label>
                      <input className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-neuro-orange transition-all" defaultValue="" placeholder="admin@example.com" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Security" && (
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-neuro-orange/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-neuro-orange/10 flex items-center justify-center text-neuro-orange">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Two-Factor Authentication</p>
                        <p className="text-xs text-gray-500">Currently enabled via Authenticator App</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 group-hover:text-white transition-all">
                      Manage <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Session Security</p>
                        <p className="text-xs text-gray-500">Auto-logout after 30 minutes of inactivity</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 group-hover:text-white transition-all">
                      Settings <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )}

              {/* Other tabs would follow same pattern */}
              {activeTab !== "Profile" && activeTab !== "Security" && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-gray-700 mb-6">
                    <Eye className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{activeTab} Details</h3>
                  <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
                    This section is being synchronized with the production database.
                  </p>
                </div>
              )}
            </div>

            <footer className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end gap-4">
              <button onClick={onClose} className="px-8 py-3 rounded-xl text-xs font-black uppercase text-gray-500 hover:text-white transition-all">Cancel</button>
              <button className="px-8 py-3 bg-neuro-orange text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-neuro-orange/20 hover:bg-neuro-orange-light transition-all active:scale-95">Save Changes</button>
            </footer>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
