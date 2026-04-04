import React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen bg-[#F5F3EF]`}>
        {/* Secure Sidebar */}
        <aside className="w-64 bg-[#1E2D3B] text-white p-8">
          <h2 className="text-xl font-bold mb-10 tracking-tight">NEUROCHIRO HUB</h2>
          <nav className="space-y-6">
            <a href="/dashboard" className="block text-[#F5F3EF]/80 hover:text-white font-medium">My Profile</a>
            <a href="/mastermind" className="block text-[#F5F3EF]/80 hover:text-white font-medium">The Mastermind</a>
            <a href="/settings" className="block text-[#F5F3EF]/80 hover:text-white font-medium">Account & Billing</a>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-12">
          {children}
        </main>
      </body>
    </html>
  );
}
