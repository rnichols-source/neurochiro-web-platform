import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="fixed w-full h-16 border-b border-gray-200 bg-white z-50 flex items-center px-8">
          <a href="/" className="text-2xl font-bold tracking-tighter text-[#004a99]">NEUROCHIRO</a>
        </nav>
        <main className="pt-16 h-screen overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
