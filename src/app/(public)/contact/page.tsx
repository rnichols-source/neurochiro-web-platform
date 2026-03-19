import React from 'react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-neuro-cream pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h1 className="text-5xl font-heading font-black text-neuro-navy">Get in Touch</h1>
        <p className="text-xl text-gray-600">Have questions about the NeuroChiro platform? We're here to help.</p>
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 text-left space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Email Us</label>
            <p className="text-lg font-bold text-neuro-navy">support@neurochiro.com</p>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Partnerships</label>
            <p className="text-lg font-bold text-neuro-navy">partners@neurochiro.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
