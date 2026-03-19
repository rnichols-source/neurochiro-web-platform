"use client";

import { useEffect, useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  Globe, 
  User, 
  Tag,
  AlertCircle,
  ExternalLink,
  Loader2
} from "lucide-react";
import { getPendingSeminars, approveSeminarAction, rejectSeminarAction } from "./actions";

export default function SeminarApprovalsPage() {
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await getPendingSeminars();
    setSeminars(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try {
      await approveSeminarAction(id);
      setSeminars(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      alert("Failed to approve seminar");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const notes = prompt("Reason for rejection:");
    if (!notes) return;
    
    setIsProcessing(id);
    try {
      await rejectSeminarAction(id, notes);
      setSeminars(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      alert("Failed to reject seminar");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black text-neuro-navy">Seminar Approval Queue</h1>
          <p className="text-neuro-gray text-lg">Review and verify new seminar marketplace submissions.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full border border-neuro-orange/20 text-neuro-orange">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">{seminars.length} Pending</span>
        </div>
      </header>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-neuro-orange mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Submission Data...</p>
        </div>
      ) : seminars.length === 0 ? (
        <div className="py-32 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neuro-navy">All Caught Up!</h3>
          <p className="text-gray-500">There are no seminars currently awaiting review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {seminars.map((seminar) => (
            <div key={seminar.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
              
              {/* Promotion Tier Indicator */}
              <div className={`absolute top-0 right-0 px-8 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest ${
                seminar.listing_tier === 'premium' ? 'bg-neuro-navy text-white' : 
                seminar.listing_tier === 'featured' ? 'bg-neuro-orange text-white' : 
                'bg-gray-100 text-gray-500'
              }`}>
                {seminar.listing_tier} Submission
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Basic Info */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2">
                    {seminar.host_type_at_submission === 'doctor' ? (
                      <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-green-100">Verified Doctor</span>
                    ) : (
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-blue-100">External Host</span>
                    )}
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(seminar.created_at).toLocaleDateString()}</span>
                  </div>

                  <h2 className="text-2xl font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors">{seminar.title}</h2>
                  
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{seminar.description}</p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-sm text-neuro-navy">
                      <MapPin className="w-4 h-4 text-neuro-orange" />
                      <span className="font-bold">{seminar.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neuro-navy">
                      <Calendar className="w-4 h-4 text-neuro-orange" />
                      <span className="font-bold">{seminar.dates}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neuro-navy">
                      <User className="w-4 h-4 text-neuro-orange" />
                      <span className="font-bold">{seminar.host?.full_name || 'Dr. Raymond Nichols'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neuro-navy">
                      <Globe className="w-4 h-4 text-neuro-orange" />
                      <a href={seminar.registration_link} target="_blank" className="font-bold text-blue-600 hover:underline flex items-center gap-1">
                        View Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {seminar.target_audience?.map((target: string) => (
                      <span key={target} className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">{target}</span>
                    ))}
                    {seminar.tags?.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-orange-50 rounded-full text-[9px] font-black uppercase tracking-widest text-neuro-orange">#{tag}</span>
                    ))}
                  </div>
                </div>

                {/* 2. Admin Actions */}
                <div className="flex flex-col justify-center gap-3 bg-gray-50 rounded-[2rem] p-6 lg:p-8">
                  <button 
                    disabled={isProcessing === seminar.id}
                    onClick={() => handleApprove(seminar.id)}
                    className="w-full py-4 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-50"
                  >
                    {isProcessing === seminar.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Approve & Go Live
                  </button>
                  <button 
                    disabled={isProcessing === seminar.id}
                    onClick={() => handleReject(seminar.id)}
                    className="w-full py-4 bg-white text-neuro-navy font-bold rounded-2xl border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Submission
                  </button>
                  
                  <div className="mt-4 p-4 bg-white rounded-xl border border-gray-100 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-[10px] text-gray-400 leading-normal">Once approved, this seminar will be instantly indexed on the public marketplace.</p>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
