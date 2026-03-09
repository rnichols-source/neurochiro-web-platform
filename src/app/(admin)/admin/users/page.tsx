"use client";

import { 
  Users, 
  GraduationCap, 
  Target, 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  BarChart3,
  MousePointerClick,
  ChevronRight,
  UserPlus,
  X,
  Loader2,
  Megaphone,
  TrendingUp,
  Activity,
  UserCheck,
  CreditCard,
  History
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { 
  getTalentUsers, 
  getTalentAuditStats, 
  dispatchTalentBroadcast,
  UserType 
} from "./actions";
import { motion, AnimatePresence } from "framer-motion";

export default function TalentIntelligence() {
  const [activeTab, setActiveTab] = useState<UserType>('Students');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Filtering & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // CEO Metrics State
  const [auditStats, setAuditStats] = useState<any>(null);

  const fetchUsers = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    const currentPage = isLoadMore ? page + 1 : 1;
    
    try {
      const result = await getTalentUsers({
        type: activeTab,
        search: searchQuery,
        status: statusFilter,
        page: currentPage,
        limit: 10
      });

      if (isLoadMore) {
        setUsers(prev => [...prev, ...result.users]);
      } else {
        setUsers(result.users);
      }
      
      setTotalCount(result.total);
      setHasMore(result.hasMore);
      setPage(currentPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, searchQuery, statusFilter, page]);

  // Initial load and filter changes
  useEffect(() => {
    fetchUsers(false);
  }, [activeTab, statusFilter]);

  // Handle Search with debounce or explicit trigger
  const handleSearch = () => {
    fetchUsers(false);
  };

  useEffect(() => {
    async function loadAudit() {
      const stats = await getTalentAuditStats();
      setAuditStats(stats);
    }
    loadAudit();
  }, []);

  const [broadcastData, setBroadcastData] = useState({ title: "", message: "", target: "All" });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleSendBroadcast = async () => {
    if (!broadcastData.title || !broadcastData.message) return;
    setIsBroadcasting(true);
    await dispatchTalentBroadcast(broadcastData.target, broadcastData);
    setIsBroadcasting(false);
    setIsBroadcastModalOpen(false);
    alert("Broadcast dispatched to talent network.");
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-neuro-orange">
            <Target className="w-5 h-5" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white">Marketplace Governance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-white">Talent Intelligence</h1>
          <p className="text-gray-400 mt-2 text-base md:text-lg font-medium">Monitor engagement, clinical matches, and account verification.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => setIsBroadcastModalOpen(true)}
            className="px-8 py-4 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <Megaphone className="w-4 h-4 text-neuro-orange" /> Broadcast to Talent
          </button>
          <button 
            onClick={() => setIsAuditModalOpen(true)}
            className="bg-neuro-orange text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-neuro-orange-light transition-all transform hover:scale-105 flex items-center justify-center gap-3 active:scale-95"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="font-black uppercase tracking-widest text-[10px] md:text-xs">System Audit</span>
          </button>
        </div>
      </header>

      {/* CEO Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Students", value: auditStats?.totalStudents || "---", trend: "+14%", icon: GraduationCap, color: "text-blue-500" },
          { label: "Active Doctors", value: auditStats?.totalDoctors || "---", trend: "+5%", icon: UserCheck, color: "text-neuro-orange" },
          { label: "Paid Conversion", value: `${auditStats?.paidRatio || "--"}%`, trend: "+2.4%", icon: CreditCard, color: "text-emerald-500" },
          { label: "Active Matches", value: auditStats?.activeMatches || "---", trend: "+28", icon: Activity, color: "text-purple-500" }
        ].map((item, i) => (
          <section key={i} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-neuro-orange/10"></div>
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">{item.trend}</span>
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{item.label}</p>
            <p className="text-2xl md:text-3xl font-black text-white">{loading ? "..." : item.value}</p>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation & Filters */}
        <div className="space-y-6">
          <nav className="bg-white/5 border border-white/5 rounded-[2rem] p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible scrollbar-hide">
            {(['Students', 'Doctors', 'Vendors'] as UserType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 lg:w-full py-4 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap px-6 lg:px-4 ${
                  activeTab === tab ? 'bg-neuro-orange text-white shadow-lg' : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <section className="bg-white/5 border border-white/5 rounded-[2rem] p-6 md:p-8">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Filter Results</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase ml-2">Search Network</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Name, clinic, or email..." 
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs focus:outline-none focus:border-neuro-orange text-white transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase ml-2">Member Status</label>
                <div className="relative group">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white focus:outline-none appearance-none cursor-pointer hover:border-white/20 transition-all"
                  >
                    <option>All Statuses</option>
                    <option>Paid</option>
                    <option>Free</option>
                    <option>Pending</option>
                    <option>Verified</option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none rotate-90" />
                </div>
              </div>
              <button 
                onClick={handleSearch}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </section>
        </div>

        {/* User Table */}
        <div className="lg:col-span-3 space-y-8">
          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            {loading && (
              <div className="absolute inset-0 bg-neuro-navy/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
              </div>
            )}
            
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">User Details</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center border-b border-white/5">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center border-b border-white/5">Engagement</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center border-b border-white/5">Matches</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right border-b border-white/5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                        No users found for this filter.
                      </td>
                    </tr>
                  ) : (
                    users.map((user, i) => (
                      <tr key={`${user.id}-${i}`} className="hover:bg-white/[0.03] transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-neuro-navy border border-white/5 flex items-center justify-center text-neuro-orange font-black text-xl shadow-lg">
                              {user.name[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-lg truncate">{user.name}</p>
                              <p className="text-xs text-gray-500 truncate">{user.entity} • {user.context}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5 ${
                            user.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                            user.status === 'Verified' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-black text-white">{user.engagement}%</span>
                            <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-neuro-orange shadow-[0_0_8px_rgba(214,104,41,0.5)]" style={{ width: `${user.engagement}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center font-black text-white text-sm">
                          {user.matches}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => setSelectedUser(user)}
                            className="p-3 hover:bg-neuro-orange hover:text-white rounded-xl transition-all text-gray-500 hover:shadow-xl active:scale-90"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {hasMore && (
              <div className="p-8 bg-white/[0.02] border-t border-white/5 text-center">
                <button 
                  onClick={() => fetchUsers(true)}
                  disabled={loadingMore}
                  className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mx-auto"
                >
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin text-neuro-orange" /> : <TrendingUp className="w-4 h-4 text-neuro-orange" />}
                  {loadingMore ? "Synchronizing Nodes..." : "Load More Network Talent"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* USER DETAIL MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-neuro-navy/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0A0D14] rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-8 md:p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6 min-w-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-neuro-navy flex items-center justify-center text-neuro-orange font-black text-3xl shadow-xl border border-white/10 shrink-0">
                    {selectedUser.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl md:text-3xl font-black text-white truncate">{selectedUser.name}</h3>
                    <p className="text-[10px] md:text-xs font-black text-neuro-orange uppercase tracking-[0.2em] mt-1 truncate">{selectedUser.entity} • {selectedUser.context}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 shrink-0">
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              <div className="p-8 md:p-10 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Member Since</p>
                    <p className="text-lg font-bold text-white">{selectedUser.joined}</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Matches</p>
                    <p className="text-lg font-bold text-white">{selectedUser.matches}</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Email</p>
                    <p className="text-xs font-bold text-white truncate px-2">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Administrative Control</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button className="py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 active:scale-95">
                      <MousePointerClick className="w-4 h-4 text-neuro-orange" /> Reset Engagement
                    </button>
                    <button className="py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center gap-2 active:scale-95">
                      Suspend Account
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYSTEM AUDIT MODAL */}
      <AnimatePresence>
        {isAuditModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-neuro-navy/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0D14] rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-white/10 p-8 md:p-12 text-white max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="text-3xl font-black flex items-center gap-4">
                    <ShieldCheck className="w-8 h-8 text-neuro-orange" /> Talent Infrastructure Audit
                  </h3>
                  <p className="text-gray-500 text-sm mt-2 uppercase tracking-widest font-bold">Network Health & Integrity Report</p>
                </div>
                <button onClick={() => setIsAuditModalOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-colors"><X /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-4">Account Integrity</h4>
                  <div className="space-y-6">
                    {[
                      { label: "Verified Ratio", value: `${auditStats?.verificationRate}%`, color: "bg-blue-500" },
                      { label: "Onboarding Completion", value: "84%", color: "bg-neuro-orange" },
                      { label: "Monthly Retention", value: "96.2%", color: "bg-emerald-500" }
                    ].map((m, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-gray-400">{m.label}</span>
                          <span className="text-white">{m.value}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: m.value }}
                            className={`h-full ${m.color}`}
                          ></motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-4">Ecosystem Velocity</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase mb-2">New (30D)</p>
                      <p className="text-2xl font-black text-white">+{auditStats?.newThisMonth}</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Vendors</p>
                      <p className="text-2xl font-black text-white">{auditStats?.totalVendors}</p>
                    </div>
                  </div>
                  <button className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                    <History className="w-4 h-4 text-neuro-orange" /> Download Forensic Report
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BROADCAST MODAL */}
      <AnimatePresence>
        {isBroadcastModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-neuro-navy/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0D14] rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white/10 p-8 md:p-12 text-white max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black flex items-center gap-4">
                  <Megaphone className="w-8 h-8 text-neuro-orange" /> Broadcast
                </h3>
                <button onClick={() => setIsBroadcastModalOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-colors"><X /></button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Target Audience</label>
                  <select 
                    value={broadcastData.target}
                    onChange={(e) => setBroadcastData({...broadcastData, target: e.target.value})}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white focus:outline-none"
                  >
                    <option value="All">All Network Talent</option>
                    <option value="Paid">Paid Members Only</option>
                    <option value="Verified">Verified Clinicians Only</option>
                    <option value="Students">All Students</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Announcement Title</label>
                  <input 
                    value={broadcastData.title}
                    onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
                    placeholder="e.g. Platform Maintenance or New Feature" 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-neuro-orange" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Content Body</label>
                  <textarea 
                    value={broadcastData.message}
                    onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
                    placeholder="Enter your message to the talent network..."
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-neuro-orange h-32 resize-none" 
                  />
                </div>
                <button 
                  onClick={handleSendBroadcast}
                  disabled={isBroadcasting || !broadcastData.title || !broadcastData.message}
                  className="w-full py-5 bg-neuro-orange text-white font-black rounded-[2rem] uppercase tracking-widest text-[10px] md:text-xs shadow-xl shadow-neuro-orange/20 mt-4 hover:bg-neuro-orange-light transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isBroadcasting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                  {isBroadcasting ? "Dispatching Broadcast..." : "Dispatch Global Announcement"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
