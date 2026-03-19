"use client";

import { useState } from "react";
import { triggerTestAutomation } from "../../(auth)/actions/debug-automations";
import { 
  Mail, 
  Zap, 
  UserPlus, 
  ShieldAlert, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Info 
} from "lucide-react";

export default function AutomationPlayground() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: string; success: boolean; message: string } | null>(null);

  const handleTrigger = async (type: string) => {
    if (!email && type !== 'admin_alert') {
      alert("Please enter an email address to receive the automation.");
      return;
    }
    
    setIsPending(type);
    setResult(null);
    
    try {
      const res = await triggerTestAutomation(type, email);
      setResult({ type, success: true, message: res.message });
    } catch (err: any) {
      setResult({ type, success: false, message: err.message });
    } finally {
      setIsPending(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-heading font-black text-neuro-navy">Automation Playground</h1>
        <p className="text-gray-500">Test platform event triggers, Resend email delivery, and Database queuing.</p>
      </header>

      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center gap-4 p-4 bg-neuro-orange/5 rounded-2xl border border-neuro-orange/10">
          <Info className="w-6 h-6 text-neuro-orange" />
          <p className="text-sm text-neuro-navy/80 leading-relaxed">
            <strong>Note:</strong> If your <code>RESEND_API_KEY</code> is not set in <code>.env</code>, 
            the system will log the email content to the server console instead of sending a real email.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Target Test Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input 
              type="email" 
              placeholder="your-email@example.com" 
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AutomationCard 
            title="Welcome Sequence"
            desc="Triggers on user registration. Sends welcome email."
            icon={<UserPlus className="w-5 h-5" />}
            onTrigger={() => handleTrigger('welcome')}
            isPending={isPending === 'welcome'}
          />
          <AutomationCard 
            title="Membership Upgrade"
            desc="Triggers after Stripe payment. Confirms Elite Pro tier."
            icon={<Zap className="w-5 h-5" />}
            onTrigger={() => handleTrigger('upgrade')}
            isPending={isPending === 'upgrade'}
          />
          <AutomationCard 
            title="Patient Referral"
            desc="Simulates a doctor receiving a new referral alert."
            icon={<Send className="w-5 h-5" />}
            onTrigger={() => handleTrigger('referral')}
            isPending={isPending === 'referral'}
          />
          <AutomationCard 
            title="Admin System Alert"
            desc="Triggers an internal notification for new job posts."
            icon={<ShieldAlert className="w-5 h-5" />}
            onTrigger={() => handleTrigger('admin_alert')}
            isPending={isPending === 'admin_alert'}
          />
        </div>

        {result && (
          <div className={`p-6 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 ${result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {result.success ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <ShieldAlert className="w-6 h-6 shrink-0" />}
            <div>
              <p className="font-bold uppercase tracking-widest text-[10px]">Result</p>
              <p className="text-sm font-medium">{result.message}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function AutomationCard({ title, desc, icon, onTrigger, isPending }: any) {
  return (
    <button 
      onClick={onTrigger}
      disabled={isPending}
      className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 text-left hover:bg-white hover:border-neuro-orange/30 hover:shadow-xl hover:shadow-neuro-orange/5 transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-neuro-navy mb-4 shadow-sm group-hover:bg-neuro-orange group-hover:text-white transition-colors">
        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      </div>
      <h3 className="font-bold text-neuro-navy mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </button>
  );
}
