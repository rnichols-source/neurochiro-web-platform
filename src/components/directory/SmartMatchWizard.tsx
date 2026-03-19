"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Target, Users, MapPin, ArrowRight, CheckCircle2, ChevronLeft } from "lucide-react";

interface SmartMatchWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (criteria: string[]) => void;
}

export default function SmartMatchWizard({ isOpen, onClose, onComplete }: SmartMatchWizardProps) {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    focus: "",
    patientType: "",
    zipCode: ""
  });

  const steps = [
    {
      id: 1,
      title: "What is your primary focus?",
      options: [
        { label: "Brain/Nervous System", value: "Neurological", icon: Target },
        { label: "Stress & Recovery", value: "Stress", icon: Sparkles },
        { label: "Pediatric Development", value: "Pediatrics", icon: Users },
        { label: "Family Wellness", value: "Family", icon: Target }
      ]
    },
    {
      id: 2,
      title: "Who is this care for?",
      options: [
        { label: "Myself (Adult)", value: "Adult", icon: Users },
        { label: "My Child", value: "Pediatrics", icon: Users },
        { label: "My Spouse", value: "Adult", icon: Users }
      ]
    }
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      // Logic to filter: combine selections into keywords
      const criteria = [selections.focus, selections.patientType].filter(Boolean);
      onComplete(criteria);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[400] bg-neuro-navy/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[401] w-full max-w-xl p-6"
          >
            <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-gray-100 flex">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: `${(step / 3) * 100}%` }}
                  className="h-full bg-neuro-orange"
                />
              </div>

              <div className="p-10 md:p-12">
                <div className="flex justify-between items-center mb-8">
                  {step > 1 ? (
                    <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                  ) : <div />}
                  <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {step <= 2 ? (
                    <motion.div 
                      key={step}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <h2 className="text-3xl font-heading font-black text-neuro-navy leading-tight">
                        {steps[step-1].title}
                      </h2>
                      <div className="grid grid-cols-1 gap-3">
                        {steps[step-1].options.map((opt, i) => (
                          <button 
                            key={i}
                            onClick={() => {
                              if (step === 1) setSelections({...selections, focus: opt.value});
                              if (step === 2) setSelections({...selections, patientType: opt.value});
                              handleNext();
                            }}
                            className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 hover:border-neuro-orange/30 hover:bg-neuro-orange/5 transition-all text-left group"
                          >
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-neuro-orange transition-colors">
                              <opt.icon className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-neuro-navy">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="step-3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <h2 className="text-3xl font-heading font-black text-neuro-navy leading-tight">
                        Final step: Your Zip Code
                      </h2>
                      <p className="text-gray-500 text-sm">We'll find the highest-rated nervous system specialists in your area.</p>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Enter Zip Code"
                          className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-neuro-orange font-bold text-lg"
                          value={selections.zipCode}
                          onChange={(e) => setSelections({...selections, zipCode: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                          autoFocus
                        />
                      </div>
                      <button 
                        onClick={handleNext}
                        className="w-full py-5 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm shadow-xl shadow-neuro-navy/20"
                      >
                        Find My Matches <ArrowRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
