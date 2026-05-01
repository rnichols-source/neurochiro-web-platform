"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { sendFoundingMemberEmail } from "@/app/actions/comms-actions";

export default function FoundingEmailPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [result, setResult] = useState<any>(null);

  const handleSend = async () => {
    if (!confirm("This will send the Founding Member email to EVERY doctor on the platform. Are you sure?")) return;
    setStatus("sending");
    try {
      const res = await sendFoundingMemberEmail();
      if (res.success) {
        setStatus("sent");
        setResult(res);
      } else {
        setStatus("error");
        setResult(res);
      }
    } catch (err: any) {
      setStatus("error");
      setResult({ error: err.message });
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight mb-2">Founding Member Email</h1>
      <p className="text-gray-400 mb-8">Send the founding member announcement to every doctor on the platform.</p>

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
        <div className="mb-6">
          <p className="text-xs font-black text-neuro-orange uppercase tracking-widest mb-2">Subject</p>
          <p className="text-white font-bold">You're officially a Founding Member.</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-black text-neuro-orange uppercase tracking-widest mb-2">Audience</p>
          <p className="text-white font-bold">All doctors with accounts</p>
        </div>

        <div className="mb-8">
          <p className="text-xs font-black text-neuro-orange uppercase tracking-widest mb-2">Preview</p>
          <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300 max-h-60 overflow-y-auto">
            When you joined NeuroChiro, you believed in what we were building before anyone else did. That means something...
            <br /><br />
            FOUNDING MEMBER BADGE — It's live on your profile right now...
            <br /><br />
            EVERY TOOL UNLOCKED — Pro-level access to everything...
            <br /><br />
            YOUR PRICE IS LOCKED — Whatever you're paying now is your price for life...
            <br /><br />
            — Dr. Raymond Nichols, Founder
          </div>
        </div>

        {status === "idle" && (
          <button
            onClick={handleSend}
            className="w-full py-4 bg-neuro-orange text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-neuro-orange/20 hover:bg-neuro-orange-light transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Send to All Doctors
          </button>
        )}

        {status === "sending" && (
          <div className="w-full py-4 bg-neuro-orange/50 text-white rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Sending...
          </div>
        )}

        {status === "sent" && (
          <div className="w-full py-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Sent to {result?.count} doctors!
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <div className="w-full py-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" /> Error: {result?.error}
            </div>
            <button onClick={() => setStatus("idle")} className="w-full py-3 bg-white/10 text-white rounded-xl font-bold text-sm">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
