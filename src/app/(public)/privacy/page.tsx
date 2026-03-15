import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neuro-cream pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="text-5xl font-heading font-black text-neuro-navy">Privacy Policy</h1>
          <p className="text-neuro-orange font-bold text-sm uppercase tracking-widest pb-2">Last Updated: March 14, 2026</p>
        </div>
        
        <div className="prose prose-slate max-w-none bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100">
          <p className="lead text-lg text-gray-600 mb-8">Your privacy is important to us. This policy outlines how NeuroChiro handles your data across our global network.</p>
          
          <h2 className="text-2xl font-bold text-neuro-navy mt-12 mb-4">1. Data Collection</h2>
          <p>We collect information you provide directly to us when you create an account, post a job, or apply for a position. This includes your name, email, clinical credentials, and location data.</p>
          
          <h2 className="text-2xl font-bold text-neuro-navy mt-12 mb-4">2. Use of Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, including connecting patients with verified specialists and facilitating career opportunities for students.</p>
          
          <h2 className="text-2xl font-bold text-neuro-navy mt-12 mb-4">3. Data Security</h2>
          <p>We implement industry-standard security measures to protect your personal information from unauthorized access or disclosure.</p>
          
          <h2 className="text-2xl font-bold text-neuro-navy mt-12 mb-4">4. Cookies</h2>
          <p>We use cookies to improve your experience and analyze platform traffic. You can manage your preferences via our consent banner.</p>
        </div>
      </div>
    </div>
  );
}
