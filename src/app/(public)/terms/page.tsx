import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neuro-cream pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="text-5xl font-heading font-black text-neuro-navy">Terms of Service</h1>
          <p className="text-neuro-orange font-bold text-sm uppercase tracking-widest pb-2">Last Updated: March 14, 2026</p>
        </div>

        <div className="prose prose-slate max-w-none bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100">
          <p className="lead text-lg text-gray-600 mb-8">By using the NeuroChiro platform, you agree to the following terms and conditions.</p>
          
          <h2 className="text-2xl font-bold text-neuro-navy mt-12 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing or using our services, you agree to be bound by these terms. If you do not agree to all terms, you may not access the platform.</p>
          
          <h2 className="text-2xl font-bold text-neuro-navy mt-12 mb-4">2. Professional Verification</h2>
          <p>Doctors joining the directory must provide accurate clinical credentials. NeuroChiro reserves the right to hide or remove profiles that fail our verification standards.</p>
          
          <h2 className="text-2xl font-bold text-neuro-navy mt-12 mb-4">3. User Conduct</h2>
          <p>You are responsible for maintaining the security of your account and for all activities that occur under your account. Harassment or fraudulent activity will result in immediate termination.</p>
          
          <h2 className="text-2xl font-bold text-neuro-navy mt-12 mb-4">4. Limitation of Liability</h2>
          <p>NeuroChiro provides a directory and ecosystem for educational purposes and does not provide direct medical advice.</p>
        </div>
      </div>
    </div>
  );
}
