"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Tag, 
  ShieldCheck, 
  ArrowRight, 
  ChevronLeft, 
  CheckCircle2, 
  Globe, 
  Cpu, 
  Users,
  X,
  UploadCloud,
  Mail,
  Lock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { submitVendorApplication } from "@/app/actions/vendors";

interface VendorOnboardingProps {
  onClose?: () => void;
}

export default function VendorOnboarding({ onClose }: VendorOnboardingProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    website: "",
    category: "Neurological Tech",
    contactName: "",
    contactEmail: "",
    techSpecs: "",
    philosophy: ""
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await submitVendorApplication(formData);
    if (result.success) {
        router.push("/vendor/dashboard");
    } else {
        alert(result.error || "Submission failed");
        setIsSubmitting(false);
    }
  };

  const steps = [
    { title: "Basic Info", icon: Building2 },
    { title: "Tech Specs", icon: Cpu },
    { title: "Verification", icon: ShieldCheck }
  ];

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden relative flex flex-col">
      {onClose && (
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors z-20">
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Progress Bar Header */}
      <div className="bg-neuro-navy p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[100px]"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-heading font-black mb-6">Partner Onboarding</h2>
          
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-neuro-orange -translate-y-1/2 z-0 transition-all duration-500" 
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isCompleted = step > i + 1;
              const isActive = step === i + 1;
              
              return (
                <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 ${
                    isCompleted ? "bg-neuro-orange border-neuro-orange text-white" :
                    isActive ? "bg-white border-white text-neuro-navy scale-110 shadow-lg" :
                    "bg-neuro-navy border-white/20 text-white/40"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-white" : "text-white/40"}`}>{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-10 flex-1 overflow-y-auto max-h-[60vh]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. NeuralPulse Tech"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 outline-none font-bold"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Website</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 outline-none font-bold"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 outline-none font-bold appearance-none"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option>Neurological Tech</option>
                      <option>Practice Software</option>
                      <option>Clinical Supplies</option>
                      <option>Marketing Agency</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Email</label>
                  <input 
                    type="email" 
                    placeholder="partner@company.com"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 outline-none font-bold"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Technical Specifications</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe your product's technical capabilities, integrations, and clinical relevance..."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 outline-none font-bold resize-none"
                    value={formData.techSpecs}
                    onChange={(e) => setFormData({...formData, techSpecs: e.target.value})}
                  />
                </div>
                <div className="p-6 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-center hover:border-neuro-orange/30 transition-colors cursor-pointer group">
                   <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-neuro-orange/10 group-hover:text-neuro-orange transition-all">
                      <UploadCloud className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-xs font-black uppercase tracking-widest">Upload Deck or Brochure</p>
                      <p className="text-[10px] text-gray-400 mt-1">PDF, JPG or PNG (Max 10MB)</p>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <div className="p-6 bg-neuro-orange/5 border border-neuro-orange/20 rounded-[2rem] space-y-4">
                   <div className="flex items-center gap-3 text-neuro-orange">
                      <ShieldCheck className="w-6 h-6" />
                      <h4 className="font-bold">Partner Philosophy</h4>
                   </div>
                   <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      NeuroChiro partners must align with tonal chiropractic principles and focus on nervous system regulation. How does your company support this mission?
                   </p>
                   <textarea 
                    rows={3}
                    className="w-full px-6 py-4 bg-white border border-neuro-orange/10 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 outline-none font-bold resize-none text-sm"
                    placeholder="Your alignment statement..."
                    value={formData.philosophy}
                    onChange={(e) => setFormData({...formData, philosophy: e.target.value})}
                  />
                </div>
                
                <div className="space-y-3">
                   <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-xs font-bold text-neuro-navy">I agree to offer exclusive benefits to Pro Members.</span>
                   </div>
                   <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-xs font-bold text-neuro-navy">I understand there is a verification review period.</span>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-10 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        {step > 1 ? (
          <button 
            onClick={prevStep}
            className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-neuro-navy transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button 
            onClick={nextStep}
            className="px-10 py-4 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl flex items-center gap-3 uppercase tracking-widest text-[10px]"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-10 py-4 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-dark transition-all shadow-xl flex items-center gap-3 uppercase tracking-widest text-[10px] disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"} <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
